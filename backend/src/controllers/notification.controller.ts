import { prisma } from "../lib/prisma";
import { Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';



export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const unreadCount = await prisma.notification.count({ where: { userId: req.user!.id, isRead: false } });
  res.json({ success: true, data: notifications, unreadCount });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
  res.json({ success: true, message: 'Marked as read' });
});

export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.notification.updateMany({ where: { userId: req.user!.id, isRead: false }, data: { isRead: true } });
  res.json({ success: true, message: 'All marked as read' });
});
