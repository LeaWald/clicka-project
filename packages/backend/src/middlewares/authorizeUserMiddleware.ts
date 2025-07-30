import { Request, Response, NextFunction } from 'express';
import { UserRole } from "shared-types";
import { verifyJwtToken } from '../services/authService';

// Auth middleware to check user permissions
export const authorizeUser = (permission: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            // Retrieve the token from cookies
            const sessionToken = req.cookies.session;

            if (!sessionToken) {
                console.log('No auth token provided');
                res.status(401).json({ error: 'Authentication required' });
                return;
            }

            const payload = verifyJwtToken(sessionToken);

            // Extract the role from the token
            const userRole = payload.role as UserRole;
            console.log('User role:', userRole);


            // Check if the token contains a role
            if (!userRole) {
                res.status(401).json({ error: 'Invalid token - missing role' });
                return;
            }

            if (permission.includes(userRole)) {
                console.log(permission);

                next();
            } else {
                res.status(403).send('Forbidden');
            }

        } catch (error) {
            console.error('Token verification failed:', error);
        }
    };
};