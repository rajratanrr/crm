import rateLimit from 'express-rate-limit';

// Global API rate limiter: 300 requests per 15 minutes per IP
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please wait a few minutes before trying again.',
  },
});

// Strict Login rate limiter: 10 attempts per 15 minutes per IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many failed login attempts. Account temporarily throttled for security. Please try again in 15 minutes.',
  },
});

// Strict Register rate limiter: 10 accounts created per hour per IP
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many registration requests. Please try again later.',
  },
});

// Search & heavy queries limiter: 60 requests per minute
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Search query rate limit exceeded. Please slow down.',
  },
});
