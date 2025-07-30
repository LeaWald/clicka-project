import { handleGoogleAuthCode, handleGoogleIdTokenLogin, handleLoginWithPassword, logout, refreshTokenHandler, registerUser } from '../controllers/authController';
import { authMiddleware, verifySession } from '../middlewares/authMiddleware';
import express from 'express';

const routerAuth = express.Router();

routerAuth.post('/refresh', refreshTokenHandler);
routerAuth.post('/google', handleGoogleAuthCode);
routerAuth.post('/logout', logout);
routerAuth.post('/google-login', handleGoogleIdTokenLogin);
routerAuth.post('/loginWithPassword', handleLoginWithPassword);
routerAuth.post('/registerUserPassword', registerUser);
routerAuth.get('/verify', authMiddleware, verifySession, (req, res) => {
  const user = (req as any).user;
  const sessionId = (req as any).sessionId;
  res.status(200).json({ user, sessionId });
});

export default routerAuth;