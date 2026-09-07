import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const prisma = new PrismaClient();

export const getEvents = asyncHandler(async (req: Request, res: Response) => {
  const { eventType, status, city, search, page = '1', limit = '20' } = req.query as any;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where: any = {};
  if (eventType) where.eventType = eventType;
  if (status) where.status = status;
  if (city) where.city = { equals: city, mode: 'insensitive' };
  if (search) {
    where.OR = [
      { eventName: { contains: search, mode: 'insensitive' } },
      { customer: { fullName: { contains: search, mode: 'insensitive' } } },
    ];
  }
  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where, skip, take: parseInt(limit),
      orderBy: { startDate: 'desc' },
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        assignments: { include: { employee: { select: { id: true, name: true, role: true } } } },
        contracts: { select: { id: true, contractNumber: true, status: true, finalAmount: true } },
        _count: { select: { subEvents: true, tasks: true, deliverables: true } },
      },
    }),
    prisma.event.count({ where }),
  ]);
  res.json({ success: true, data: events, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
});

export const getEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: {
      customer: true,
      subEvents: { orderBy: { date: 'asc' } },
      assignments: { include: { employee: true } },
      contracts: { include: { payments: true, items: true, package: true } },
      tasks: { orderBy: { dueDate: 'asc' }, include: { assignedEmployee: { select: { id: true, name: true } } } },
      deliverables: { orderBy: { dueDate: 'asc' } },
    },
  });
  if (!event) throw ApiError.notFound('Event not found');
  res.json({ success: true, data: event });
});

export const getUpcomingEvents = asyncHandler(async (req: Request, res: Response) => {
  const events = await prisma.event.findMany({
    where: { startDate: { gte: new Date() }, status: { in: ['UPCOMING', 'IN_PROGRESS'] } },
    orderBy: { startDate: 'asc' },
    take: 10,
    include: { customer: { select: { id: true, fullName: true, phone: true } }, _count: { select: { assignments: true } } },
  });
  res.json({ success: true, data: events });
});

export const getCalendarEvents = asyncHandler(async (req: Request, res: Response) => {
  const { start, end } = req.query as any;
  const where: any = {};
  if (start) where.startDate = { gte: new Date(start) };
  if (end) where.startDate = { ...where.startDate, lte: new Date(end) };

  const events = await prisma.event.findMany({
    where,
    include: { customer: { select: { fullName: true } } },
    orderBy: { startDate: 'asc' },
  });
  res.json({ success: true, data: events });
});

export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const { subEvents, ...eventData } = req.body;
  const event = await prisma.event.create({
    data: {
      ...eventData,
      startDate: new Date(eventData.startDate),
      endDate: eventData.endDate ? new Date(eventData.endDate) : null,
      subEvents: subEvents ? { create: subEvents.map((s: any) => ({ ...s, date: s.date ? new Date(s.date) : null })) } : undefined,
    },
    include: { customer: { select: { id: true, fullName: true } }, subEvents: true },
  });
  res.status(201).json({ success: true, data: event });
});

export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!existing) throw ApiError.notFound('Event not found');
  const { subEvents, ...eventData } = req.body;
  const event = await prisma.event.update({
    where: { id: req.params.id },
    data: {
      ...eventData,
      startDate: eventData.startDate ? new Date(eventData.startDate) : undefined,
      endDate: eventData.endDate ? new Date(eventData.endDate) : undefined,
    },
  });
  res.json({ success: true, data: event });
});

export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { contracts: true } } },
  });
  if (!existing) throw ApiError.notFound('Event not found');
  if (existing._count.contracts > 0) throw ApiError.badRequest('Cannot delete event with contracts');
  await prisma.event.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Event deleted' });
});

export const createAssignment = asyncHandler(async (req: Request, res: Response) => {
  const eventId = req.params.id;
  const { employeeId, role, callTime, notes } = req.body;
  const existing = await prisma.eventAssignment.findUnique({
    where: { eventId_employeeId: { eventId, employeeId } },
  });
  if (existing) throw ApiError.conflict('Employee already assigned to this event');
  const assignment = await prisma.eventAssignment.create({
    data: { eventId, employeeId, role, notes },
    include: { employee: true },
  });
  res.status(201).json({ success: true, data: assignment });
});

export const deleteAssignment = asyncHandler(async (req: Request, res: Response) => {
  await prisma.eventAssignment.delete({ where: { id: req.params.assignmentId } });
  res.json({ success: true, message: 'Assignment removed' });
});
