import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const prisma = new PrismaClient();

export const getEmployees = asyncHandler(async (req: Request, res: Response) => {
  const employees = await prisma.employee.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { assignments: true, tasks: true } } },
  });
  res.json({ success: true, data: employees });
});

export const getEmployee = asyncHandler(async (req: Request, res: Response) => {
  const employee = await prisma.employee.findUnique({
    where: { id: req.params.id },
    include: {
      assignments: { include: { event: { include: { customer: { select: { fullName: true } } } } }, orderBy: { event: { startDate: 'desc' } } },
      tasks: { orderBy: { dueDate: 'asc' } },
    },
  });
  if (!employee) throw ApiError.notFound('Employee not found');
  res.json({ success: true, data: employee });
});

export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  const data = { ...req.body };
  if (data.joiningDate) data.joiningDate = new Date(data.joiningDate);
  const employee = await prisma.employee.create({ data });
  res.status(201).json({ success: true, data: employee });
});

export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const data = { ...req.body };
  if (data.joiningDate) data.joiningDate = new Date(data.joiningDate);
  const employee = await prisma.employee.update({ where: { id: req.params.id }, data });
  res.json({ success: true, data: employee });
});

export const deleteEmployee = asyncHandler(async (req: Request, res: Response) => {
  await prisma.employee.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ success: true, message: 'Employee deactivated' });
});
