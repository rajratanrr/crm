import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const prisma = new PrismaClient();

export const getTasks = asyncHandler(async (req: Request, res: Response) => {
  const { status, priority, assignedTo, eventId, page = '1', limit = '50' } = req.query as any;
  const where: any = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assignedTo) where.assignedTo = assignedTo;
  if (eventId) where.eventId = eventId;

  const tasks = await prisma.task.findMany({
    where, orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    include: {
      assignedEmployee: { select: { id: true, name: true } },
      customer: { select: { id: true, fullName: true } },
      event: { select: { id: true, eventName: true } },
    },
  });
  res.json({ success: true, data: tasks });
});

export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: { assignedEmployee: true, customer: true, event: true },
  });
  if (!task) throw ApiError.notFound('Task not found');
  res.json({ success: true, data: task });
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const data = { ...req.body };
  if (data.dueDate) data.dueDate = new Date(data.dueDate);
  const task = await prisma.task.create({
    data,
    include: { assignedEmployee: { select: { id: true, name: true } } },
  });
  res.status(201).json({ success: true, data: task });
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const data = { ...req.body };
  if (data.dueDate) data.dueDate = new Date(data.dueDate);
  const task = await prisma.task.update({
    where: { id: req.params.id }, data,
    include: { assignedEmployee: { select: { id: true, name: true } } },
  });
  res.json({ success: true, data: task });
});

export const updateTaskStatus = asyncHandler(async (req: Request, res: Response) => {
  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: { status: req.body.status },
  });
  res.json({ success: true, data: task });
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  await prisma.task.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Task deleted' });
});
