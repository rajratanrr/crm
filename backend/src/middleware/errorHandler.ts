import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // CORS policy denial
  if (err?.message && err.message.includes('CORS policy')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Request origin not allowed by CORS policy',
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  // Handle Prisma unique constraint violation safely without leaking column names
  if (err?.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'A record with this unique field already exists',
      errors: [],
    });
  }

  // Handle Prisma relation constraint violation
  if (err?.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'Cannot complete operation due to referenced relations',
      errors: [],
    });
  }

  // Generic server error — never leak stack trace or internal SQL in production
  console.error('Unhandled server error:', err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error. Request logged.',
    errors: [],
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    errors: [],
  });
};
