import rateLimit from 'express-rate-limit';

// Global API rate limiter: 10,000 requests per 15 minutes per IP (allows auto-sync polling)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS' || req.path === '/health',
  message: {
    success: false,
    message: 'Too many requests from this IP. Please wait a few minutes before trying again.',
  },
});

// Login rate limiter: 50 attempts per 15 minutes per IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
  skip: (req) => req.method === 'OPTIONS',
  message: {
    success: false,
    message: 'Too many failed login attempts. Please wait a few minutes before trying again.',
  },
});

// Strict Register rate limiter: 30 accounts created per hour per IP
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: {
    success: false,
    message: 'Too many registration requests. Please try again later.',
  },
});

// Search & heavy queries limiter: 500 requests per minute
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: {
    success: false,
    message: 'Search query rate limit exceeded. Please slow down.',
  },
});
