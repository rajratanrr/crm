import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const prisma = new PrismaClient();

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const { type, status, customerId, search } = req.query as Record<string, string>;

  const where: any = {};
  if (type && (type === 'WEDDING' || type === 'FASHION')) {
    where.projectType = type;
  }
  if (status) {
    where.status = status;
  }
  if (customerId) {
    where.customerId = customerId;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { projectNumber: { contains: search, mode: 'insensitive' } },
      { customer: { fullName: { contains: search, mode: 'insensitive' } } },
      { brand: { contains: search, mode: 'insensitive' } },
    ];
  }

  const projects = await prisma.project.findMany({
    where,
    include: {
      customer: { select: { id: true, fullName: true, phone: true, email: true, clientType: true } },
      payments: { select: { id: true, amount: true, paymentDate: true, paymentMethod: true } },
      contracts: { select: { id: true, contractNumber: true, finalAmount: true, status: true } },
      tasks: { select: { id: true, status: true } },
      deliverables: { select: { id: true, status: true, type: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = projects.map((p) => {
    const totalPaid = p.payments.reduce((acc, pay) => acc + Number(pay.amount), 0);
    const budgetNum = Number(p.budget);
    const remaining = Math.max(0, budgetNum - totalPaid);
    return {
      ...p,
      totalPaid,
      remainingAmount: remaining,
    };
  });

  res.json({ success: true, data: formatted });
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      events: { include: { subEvents: true, assignments: { include: { employee: true } } } },
      contracts: { include: { items: true } },
      payments: { orderBy: { paymentDate: 'desc' } },
      tasks: { include: { assignedEmployee: true } },
      deliverables: true,
      studioBookings: true,
    },
  });

  if (!project) throw new ApiError(404, 'Project not found');

  const totalPaid = project.payments.reduce((acc, pay) => acc + Number(pay.amount), 0);
  const budgetNum = Number(project.budget);
  const remaining = Math.max(0, budgetNum - totalPaid);

  res.json({
    success: true,
    data: {
      ...project,
      totalPaid,
      remainingAmount: remaining,
    },
  });
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    projectType,
    status = 'PLANNING',
    customerId,
    budget = 0,
    startDate,
    endDate,
    weddingDate,
    venue,
    city,
    functions,
    brand,
    shootType,
    studioLocation,
    creativeTeam,
    modelsInfo,
    garmentsInfo,
    notes,
  } = req.body;

  if (!name || !customerId || !startDate) {
    throw new ApiError(400, 'Project name, customer, and start date are required');
  }

  const prefix = projectType === 'FASHION' ? 'FSH' : 'WED';
  const count = await prisma.project.count({ where: { projectType } });
  const projectNumber = `${prefix}-${String(count + 1).padStart(4, '0')}`;

  const project = await prisma.project.create({
    data: {
      projectNumber,
      name,
      projectType: projectType === 'FASHION' ? 'FASHION' : 'WEDDING',
      status,
      customerId,
      budget: Number(budget) || 0,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      weddingDate: weddingDate ? new Date(weddingDate) : null,
      venue,
      city,
      functions,
      brand,
      shootType,
      studioLocation,
      creativeTeam,
      modelsInfo,
      garmentsInfo,
      notes,
    },
    include: { customer: true },
  });

  res.status(201).json({ success: true, data: project });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = { ...req.body };

  if (data.startDate) data.startDate = new Date(data.startDate);
  if (data.endDate) data.endDate = new Date(data.endDate);
  if (data.weddingDate) data.weddingDate = new Date(data.weddingDate);
  if (data.budget !== undefined) data.budget = Number(data.budget);

  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;
  delete data.projectNumber;
  delete data.customer;
  delete data.payments;
  delete data.contracts;
  delete data.events;
  delete data.tasks;
  delete data.deliverables;
  delete data.studioBookings;

  const project = await prisma.project.update({
    where: { id },
    data,
    include: { customer: true },
  });

  res.json({ success: true, data: project });
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.project.delete({ where: { id } });
  res.json({ success: true, message: 'Project deleted successfully' });
});
