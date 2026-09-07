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
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginSchema, registerSchema } from '../validators/auth.validator';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, getUsers);
router.patch('/users/:id/toggle', authenticate, toggleUserStatus);
router.delete('/users/:id', authenticate, deleteUser);
router.post('/logout', authenticate, logout);

export default router;
