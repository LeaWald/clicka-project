
// middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { User } from "shared-types";
import { UserTokenService } from '../services/userTokenService';
import { generateJwtToken, verifyJwtRefreshToken, verifyJwtToken } from '../services/authService';
import { setAuthCookie } from '../services/tokenService';

const JWT_SECRET = process.env.JWT_SECRET!;
const userService = new UserService();

export const verifySession = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.session;
  const sessionId = req.cookies.sessionId;
  if (!token) {
    res.status(401).json({ error: 'not authenticated' });
    return;
  }
  try {
    const payload = verifyJwtToken(token);
    const result = await userService.loginByGoogleId(payload.googleId);
    if (!result) {
      res.status(404).json({ error: 'user not found' });
      return;
    }
    const userTokenService = new UserTokenService();

    if (! await userTokenService.validateSession(payload.userId, sessionId)) {
      res.status(409).json({ error: 'SessionConflict', message: 'User is already logged in on another device.' });
      return
    }

    const user: User = result;
    (req as any).user = { payload, user, sessionId };// Store the user object in the request object for further use;
    //------------------------------------------------------------
    // (req as any).sessionId = { sessionId };

    next();
  } catch (err: any) {
    if (err.message == 'TokenExpiredError') {
      res.status(401).json({ error: 'TokenExpired' });
      return;
    }
    res.status(403).json({ error: 'Invalid token' });
  }
};
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { session, refreshToken } = req.cookies;
    // check access token
    if (session) {
      try {
        verifyJwtToken(session);
        return next();
      } catch (error) {
        // Access token expired or invalid
        console.log('Access token expired or invalid');
      }
    }
    // If access token is invalid, check refresh token
    if (refreshToken) {
      try {
        const decoded = verifyJwtRefreshToken(refreshToken) as { userId: string; };
        const userData = await userService.getUserById(decoded.userId);

        if (userData) {
          // create new access token
          const newAccessToken = generateJwtToken({
            userId: userData.id || decoded.userId,
            email: userData.email,
            googleId: userData.googleId,
            role: userData.role,
          });

          // Save the new token in a cookie
          setAuthCookie(res, newAccessToken);
          console.log('New access token generated and set in cookie for user:', {
            userId: userData.id,
            email: userData.email ? '[REDACTED]' : 'undefined'
          });
          
          return next();
        }
      } catch (error) {
        console.log('Refresh token expired or invalid');
      }
    }

    // If both tokens are invalid - redirect to login
    console.log('No valid session or refresh token found, redirecting to login');
    
    res.status(401).json({ message: 'Authentication required' });

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};