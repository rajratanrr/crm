import { Request, Response, NextFunction, RequestHandler } from 'express';

export const asyncHandler = (fn: (req: any, res: any, next: any) => Promise<any>): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
