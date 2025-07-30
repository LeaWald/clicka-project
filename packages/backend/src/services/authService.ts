import { LoginResponse, User, UserRole } from "shared-types";
import { getTokens, getGoogleUserInfo } from './googleAuthService';
import jwt from 'jsonwebtoken';
import { saveUserTokens } from './tokenService';
import { randomUUID } from 'crypto';
import { UserService } from "./user.service";
import bcrypt from 'bcrypt';


const userService = new UserService();
const JWT_SECRET = process.env.JWT_SECRET!;
export const generateJwtToken = (payload: { userId: string; email: string; googleId: string; role: UserRole }): string => {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      googleId: payload.googleId,
      role: payload.role
    },
    JWT_SECRET,
    { expiresIn: '8h' } // 8 hours
  );
};

export const verifyJwtToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; googleId: string; role: UserRole };
};
export const verifyJwtRefreshToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as { userId: string; };
};
export const generateJwtRefreshToken = (payload: { userId: string; }): string => {
  return jwt.sign(
    {
      userId: payload.userId
    },
    JWT_SECRET,
    { expiresIn: '30d' } // 30 days
  );
};
export const exchangeCodeAndFetchUser = async (code: string): Promise<LoginResponse> => {
  try {
    const tokens = await getTokens(code);
    if (!tokens.access_token) {
      throw new Error("No access token received from Google");
    }
    console.log(tokens);
    console.log('Tokens received from Google:', tokens);
    const userInfo = await getGoogleUserInfo(tokens.access_token);
    console.log(userInfo);

    //need to check if the user have permission to login
    if (!userInfo.id) {
      throw new Error("Google ID is missing for the user");
    }
    let checkUser = await userService.loginByGoogleId(userInfo.id);
    if (checkUser == null) {
      //need to check if the user in the system but doesnt have googleId yet
      try {
        checkUser = await userService.getUserByEmail(userInfo.email);
        if (checkUser == null) {
          console.log("user not found by email:", userInfo.email);

          throw new Error("User not found");
        }
        await userService.updateGoogleIdUser(
          checkUser.id ?? userInfo.id,
          userInfo.id,
        );
      } catch (error: any) {
        throw error;
      }
    }
    const user: User = {
      id: checkUser.id,
      email: checkUser.email,
      firstName: checkUser.firstName,
      lastName: checkUser.lastName,
      role: checkUser.role,
      googleId: userInfo.id, // Google user ID
      lastLogin: new Date().toISOString(),
      active: true,
      createdAt: checkUser.createdAt,
      updatedAt: checkUser.updatedAt,
    }
    //---------------------------------------------------
    const newSessionId = randomUUID();
    console.log("in exchange code and fetch user, newSessionId:", newSessionId);

    await saveUserTokens(
      checkUser.id ?? userInfo.id,
      tokens.refresh_token ?? "",
      tokens.access_token,
      newSessionId,
    );

    console.log("Access Token:", tokens.access_token);
    console.log("Refresh Token:", tokens.refresh_token);
    const jwtToken = generateJwtToken({
      userId: checkUser.id ?? userInfo.id,
      email: user.email,
      googleId: user.googleId!,
      role: user.role,
    });
    return {
      user,
      token: jwtToken,
      sessionId: newSessionId,
       googleAccessToken: tokens.access_token,
      // refreshToken: tokens.refresh_token!, // Optional, if you want to store it
      expiresAt: tokens.expires_at,
    };


  } catch (error: any) {
    throw error;
  }
};

export async function loginWithEmailAndPassword(email: string, password: string) {
  try {
    const user = await userService.getUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    if (!user.password) {
      throw new Error('User password not set');
    }
    // Verify the password
    const isMatch: boolean = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid password');
    }
    return user;
  } catch (error:any) {
    if(error.message === 'Invalid password') {
      throw new Error('Invalid password');
    }
    console.error('Error during login:', error);
    throw new Error('Login with password failed');

  }
}