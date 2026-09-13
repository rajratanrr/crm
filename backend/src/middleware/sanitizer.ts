import { Request, Response, NextFunction } from 'express';

// Recursively sanitize strings in object
function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    // Strip script tags, javascript: pseudo-protocols, and dangerous HTML tags
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '') // inline event handlers (onerror=, onclick=)
      .trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      // Prevent prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      sanitized[key] = sanitizeValue(value[key]);
    }
    return sanitized;
  }
  return value;
}

export const sanitizeInputs = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
};
