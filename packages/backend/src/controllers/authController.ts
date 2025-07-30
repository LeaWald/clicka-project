import { Request, Response } from 'express';
import * as authService from '../services/authService';
import * as tokenService from '../services/tokenService';
import { LoginResponse, StatusChangeRequest, UserRole } from "shared-types";
import { HttpStatusCode } from 'axios';
import { UserService } from '../services/user.service';
import { UserTokenService } from '../services/userTokenService';
import { getGoogleWithoutCode } from '../services/googleAuthService';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { saveUserTokens } from '../services/tokenService';
const SALT_ROUNDS = 10; // מספר הסיבובים ל־bcrypt


const userService = new UserService();
const userTokenService = new UserTokenService();

export const handleGoogleAuthCode = async (req: Request, res: Response<LoginResponse | { error: string }>) => {
  console.log('Received Google auth code:', req.body.code);
  try {
    const { code } = req.body;
    if (!code) {
      res.status(HttpStatusCode.BadRequest).json({ error: 'Missing authentication code' });
      return;
    }
    const loginResult = await authService.exchangeCodeAndFetchUser(code);
    console.log('Login result:', loginResult);
    const refreshToken = authService.generateJwtRefreshToken({ userId: loginResult.user.id! });
    tokenService.setRefreshCookie(res, refreshToken);
    tokenService.setAuthCookie(res, loginResult.token, loginResult.sessionId!);
    const response = {
      ...loginResult,
      message: 'התחברת בהצלחה. נותקת ממכשירים אחרים.'
    };
    res.status(200).json(response);
  } catch (error: any) {
    console.log('in auth controller catch ', error)
    if ((error as any).message === 'User not found or not authorized to login') {
      res.status(HttpStatusCode.Forbidden).json({ error: 'User not found or not authorized to login' });
    } else if (error.message === 'User not found') {
      res.status(HttpStatusCode.Unauthorized).json({ error: 'User not found' });
    }
    else {
      console.error('Google login failed:', error);
      res.status(400).json({ error: 'Authentication failed' });
    }
  }

};
export const handleGoogleIdTokenLogin = async (req: Request, res: Response) => {

  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'Missing idToken' });
    }

    // 1. לאמת את הטוקן מול גוגל
    const ticket = await getGoogleWithoutCode(idToken);

    if (!ticket || !ticket.email) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    // 2. לאחזר או ליצור משתמש לפי הפרטים שהגיעו מגוגל
    const userInfo = {
      email: ticket.email,
      fullName: ticket.name,
      picture: ticket.picture,
      googleId: ticket.sub,
    };

    const loginResult = await userService.loginByGoogleId(userInfo.googleId);
    if (loginResult) {
      const jwtToken = authService.generateJwtToken({
        userId: loginResult?.id ?? userInfo.googleId,
        email: userInfo.email,
        googleId: userInfo.googleId!,
        role: loginResult.role,
      });
      const sessionId = randomUUID();
      tokenService.setAuthCookie(res, jwtToken, sessionId);
      const refreshToken = authService.generateJwtRefreshToken({ userId: loginResult?.id ?? userInfo.googleId });
      tokenService.setRefreshCookie(res, refreshToken);
      const response = {
        loginResult,
        jwtToken,
        sessionId,
        message: 'התחברת בהצלחה דרך Google One Tap',
      };
      return res.status(200).json(response);
    }
  } catch (error) {
    console.error('Google One Tap login failed:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};
export const logout = async (req: Request, res: Response) => {
  try {
    const user = await tokenService.getUserFromCookie(req);
    if (user) {
      await tokenService.logoutUser(user.userId, res);
      const sessionId = req.cookies.sessionId;
      if (sessionId) {
        await userTokenService.deleteUserSession(user.userId, sessionId);
      }
    }
  } catch (error) {
    console.error('Logout failed:', error);
  }
  finally {
    // Clear the auth cookie
    tokenService.clearAuthCookie(res);
  }
  try {

  } catch (error) {

  }
  res.status(200).json({ message: 'Logged out successfully' });
};

export const refreshTokenHandler = async (req: Request, res: Response) => {
  try {
    const sessionToken = req.cookies.session;
    const sessionId = req.cookies.sessionId;
    if (!sessionToken || !sessionId) {

      res.status(401).json({ error: 'not authenticated' });
      return;
    }
    const newJwt = await tokenService.refreshUserToken(sessionToken, sessionId);
    tokenService.setAuthCookie(res, newJwt, sessionId);
    res.status(200).json({ message: 'Token refreshed successfully' });
  } catch (err) {
    console.error('Error refreshing token', err);
    if ((err as any).message === 'INVALID_SESSION') {
      // Session expired- need to login again
      tokenService.clearAuthCookie(res);
      res.status(401).json({
        error: 'Session expired',
        message: 'Please login again'
      });
      return;
    }
    res.status(500).json({ error: err });
  }
}
export const handleLoginWithPassword = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await authService.loginWithEmailAndPassword(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = authService.generateJwtToken({ userId: user.id!, googleId: user.googleId, email: user.email, role: user.role });
    const sessionId = randomUUID();
    tokenService.setAuthCookie(res, token, sessionId);
    const refreshToken = authService.generateJwtRefreshToken({ userId: user.id! });
    tokenService.setRefreshCookie(res, refreshToken);
    await tokenService.saveSessionId(user.id!, sessionId);
    const response = {
      user,
      token,
      sessionId,
      message: 'התחברת בהצלחה.'
    };
    res.status(200).json(response);
  } catch (error: any) {
    if (error.message === 'Invalid password') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    console.error('Login failed:', error);
    res.status(401).json({ error: 'Login failed' });
  }
}
export const registerUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const connectedUser = await tokenService.getUserFromCookie(req);
  if (!connectedUser || !connectedUser.email) {
    return res.status(401).json({ error: 'Unauthorized. Please login with Google first' });
  }
  if(email !== connectedUser.email && connectedUser.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Email mismatch. Please login with the correct Google account' });
  }
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // 2. save to database
  const user = await userService.getUserByEmail(email);
  if (user) {
    if (user.password) {
      return res.status(400).json({ error: 'User password already exists' });
      // throw new Error('User password already exists');
    }
    userService.updatePassword(user?.id!, hashedPassword);
  }
  else {
    throw new Error('User not exists');
  }
  return res.status(200).json(user);
}