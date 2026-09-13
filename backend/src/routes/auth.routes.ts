import { Router } from 'express';
import {
  login,
  register,
  getMe,
  getUsers,
  toggleUserStatus,
  deleteUser,
  logout,
} from '../controllers/auth.controller';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginSchema, registerSchema } from '../validators/auth.validator';
import { loginLimiter, registerLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public auth routes with strict brute force protection
router.post('/login', loginLimiter, validate(loginSchema), login);

// Register: rate-limited, checks for admin permission (or initial bootstrap if zero users)
router.post('/register', registerLimiter, optionalAuthenticate, validate(registerSchema), register);

// Authenticated session routes
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

// Owner/Manager user management (prevents unauthorized user modification or deactivation)
router.get('/users', authenticate, authorize('OWNER', 'MANAGER'), getUsers);
router.patch('/users/:id/toggle', authenticate, authorize('OWNER', 'MANAGER'), toggleUserStatus);
router.delete('/users/:id', authenticate, authorize('OWNER'), deleteUser);

export default router;
