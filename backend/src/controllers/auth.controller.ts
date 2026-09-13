import { prisma } from "../lib/prisma";
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

import { config } from '../config';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../middleware/auth';

const signToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: '7d' as any,
  });
};

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) throw ApiError.badRequest('Email and password are required');

  const normalizedEmail = String(email).toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw ApiError.unauthorized('Invalid email or password');

  if (!user.isActive) throw ApiError.forbidden('Account has been deactivated. Please contact an administrator.');

  const token = signToken(user.id, user.role);

  res.json({
    success: true,
    data: {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
    },
  });
});

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password, role = UserRole.SALES, phone } = req.body;
  if (!name || !email || !password) throw ApiError.badRequest('Name, email, and password are required');

  const userCount = await prisma.user.count();

  // If users already exist in the database, ONLY an authenticated OWNER or MANAGER can register new accounts
  if (userCount > 0) {
    if (!req.user || (req.user.role !== 'OWNER' && req.user.role !== 'MANAGER')) {
      throw ApiError.forbidden('Registration is restricted. Only Owners or Managers can add new user accounts.');
    }
  }

  // Validate role against UserRole enum
  const validRoles = Object.values(UserRole);
  const assignedRole = validRoles.includes(role as UserRole) ? (role as UserRole) : UserRole.SALES;

  // Prevent non-owners from creating OWNER accounts
  if (assignedRole === UserRole.OWNER && userCount > 0 && req.user?.role !== 'OWNER') {
    throw ApiError.forbidden('Only an existing Owner can grant the OWNER role');
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) throw ApiError.conflict('Email already registered');

  // Enforce strong password: minimum 8 characters
  if (String(password).length < 8) {
    throw ApiError.badRequest('Password must be at least 8 characters long');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role: assignedRole,
      phone: phone ? String(phone).trim() : null,
    },
    select: { id: true, name: true, email: true, role: true, phone: true, isActive: true, createdAt: true },
  });

  const token = signToken(user.id, user.role);
  res.status(201).json({ success: true, data: { token, user } });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, name: true, email: true, role: true, phone: true, isActive: true, createdAt: true },
  });
  if (!user || !user.isActive) throw ApiError.unauthorized('User not found or deactivated');
  res.json({ success: true, data: user });
});

export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, phone: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: users });
});

export const toggleUserStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw ApiError.notFound('User not found');

  // Prevent deactivating own account
  if (req.user?.id === id) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }

  // Prevent deactivating the last active OWNER
  if (user.role === UserRole.OWNER && user.isActive) {
    const ownerCount = await prisma.user.count({ where: { role: UserRole.OWNER, isActive: true } });
    if (ownerCount <= 1) {
      throw ApiError.forbidden('Cannot deactivate the only active Owner account');
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
    select: { id: true, name: true, email: true, role: true, phone: true, isActive: true },
  });
  res.json({ success: true, data: updated });
});

export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  if (req.user?.id === id) throw ApiError.badRequest('Cannot delete your own account');

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw ApiError.notFound('User not found');

  // Prevent deleting the last active OWNER
  if (user.role === UserRole.OWNER) {
    const ownerCount = await prisma.user.count({ where: { role: UserRole.OWNER } });
    if (ownerCount <= 1) {
      throw ApiError.forbidden('Cannot delete the only Owner account');
    }
  }

  await prisma.user.delete({ where: { id } });
  res.json({ success: true, message: 'User deleted successfully' });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
});
