import { Request, Response } from 'express';
import { LoginResponse, UserRole } from "shared-types"
import { UserTokenService } from './userTokenService';
import { generateJwtToken, verifyJwtToken } from './authService';
import { decrypt } from './cryptoService';
import { refreshAccessToken } from './googleAuthService';
import { UserService } from './user.service';

const userTokenService = new UserTokenService();
export const setAuthCookie = (res: Response<LoginResponse | { error: string }>, token: string, sessionId?: string): void => {
    res.cookie('session', token, {
        httpOnly: true,
         secure: true,
        sameSite: 'none',
        maxAge: 8 * 60 * 60 * 1000, // 8 שעות
    });
    console.log('setAuthCookie', sessionId);
    if (sessionId) {
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
             secure: true,
            sameSite: 'none',
            maxAge: 8 * 60 * 60 * 1000, // 8 שעות
        });
    }
};
export const setRefreshCookie = (res: Response, refreshToken: string): void => {
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ימים
    });
};

export const clearAuthCookie = (res: Response): void => {
    res.clearCookie('session', {
        httpOnly: true,
         secure: true,
        sameSite: 'none',
    });
    res.clearCookie('sessionId', {
        httpOnly: true,
         secure: true,
        sameSite: 'none',
    });
    res.clearCookie('refreshToken', {
        httpOnly: true,
         secure: true,
        sameSite: 'none',
    });
};
// Function to get the current user ID from the session cookie

export const getUserFromCookie = (req: Request): { userId: string; email: string; googleId: string ;role:UserRole } | null => {
    const sessionToken = req.cookies.session;
    const sessionId = req.cookies.sessionId;

    // בדיקה בסיסית שה-cookies קיימים ולא ריקים
    if (!sessionToken || !sessionId || sessionToken.trim() === '' || sessionId.trim() === '') {
        console.warn('Missing or empty session cookies');
        return null;
    }

    try {
        const payload = verifyJwtToken(sessionToken);

        // בדיקה שה-payload מכיל את השדות הנדרשים
        if (!payload || typeof payload.userId !== 'string' || typeof payload.email !== 'string' || typeof payload.googleId !== 'string') {
            console.warn('Invalid token payload structure');
            return null;
        }

        const userId = payload.userId;

        const isValidSession = userTokenService.validateSession(userId, sessionId);
        if (!isValidSession) {
            console.warn('Invalid session for user');
            return null;
        }

        return {
            userId,
            email: payload.email,
            googleId: payload.googleId,
            role: payload.role
        };
    } catch (error) {
        console.error('Error verifying JWT token:', error);
        return null;
    }
};


export const refreshUserToken = async (sessionToken: string, sessionId: string): Promise<string> => {
    const payload = verifyJwtToken(sessionToken);

    const userId: string = payload.userId;
    const isValidSession = await userTokenService.validateSession(userId, sessionId);
    if (!isValidSession) {
        throw new Error('INVALID_SESSION');
    }
    const UserTokenRecord = await userTokenService.findByUserId(userId);
    //if userTokenRecord is null, then the user is not logged in
    if (!UserTokenRecord)
        throw new Error('TOKEN_NOT_FOUND');
    await userTokenService.getAccessTokenByUserId(userId);
    const newJwt = generateJwtToken({
        userId,
        email: payload.email,
        googleId: payload.googleId,
        role: payload.role
    });
    return newJwt;
}

export const saveUserTokens = async (userId: string, refreshToken: string, access_token: string, sessionId?: string): Promise<void> => {
    const userTokenService = new UserTokenService();
    await userTokenService.saveTokens(userId, refreshToken, access_token, sessionId);

}
export const logoutUser = async (userId: string, res: Response): Promise<void> => {
    await userTokenService.invalidateSession(userId);
    clearAuthCookie(res);
};
export const saveSessionId= async (userId: string, sessionId: string): Promise<void> => {
    await userTokenService.saveSessionId(userId, sessionId);
}