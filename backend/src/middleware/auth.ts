import { prisma } from "../lib/prisma";
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ApiError } from '../utils/ApiError';




export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }

    const token = authHeader.split(' ')[1];
    // Explicitly enforce HS256 algorithm to prevent algorithm confusion attacks
    const decoded = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, name: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Invalid token or inactive user');
    }

    req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(ApiError.unauthorized('Invalid or expired token'));
    }
  }
};

export const optionalAuthenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true, name: true, isActive: true },
      });
      if (user && user.isActive) {
        req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
      }
    }
  } catch {
    // Ignore in optional authenticate
  }
  next();
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }
    next();
  };
};
