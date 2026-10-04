import { prisma } from "../lib/prisma";
import { Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';



export const getEmployees = asyncHandler(async (req: Request, res: Response) => {
  const { domain } = req.query as Record<string, string>;
  const where: any = {};
  if (domain) {
    where.domain = domain.toUpperCase();
  }

  const employees = await prisma.employee.findMany({
    where,
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

const normalizeRole = (role?: string) => {
  if (!role) return 'PHOTOGRAPHER';
  const clean = role.toUpperCase().trim().replace(/[\s\/-]+/g, '_');
  const valid = [
    'PHOTOGRAPHER', 'VIDEOGRAPHER', 'DRONE_OPERATOR', 'EDITOR', 'ALBUM_DESIGNER',
    'MANAGER', 'SALES_EXECUTIVE', 'ACCOUNTANT', 'STYLIST', 'MAKEUP_ARTIST',
    'PHOTO_EDITOR', 'VIDEO_EDITOR', 'SALES_PERSON', 'ACCOUNTS', 'PRODUCT_MANAGER',
    'STEEM_BOY', 'HELPING_HAND', 'ROTE_BOY', 'SHOOT_MANAGER',
    'TRADITIONAL_PHOTOGRAPHER', 'TRADITIONAL_VIDEOGRAPHER', 'CANDID_PHOTOGRAPHER',
    'CINEMATIC_VIDEOGRAPHER', 'DRONE', 'MOBILE_CONTENT_CREATOR',
    'TRADITIONAL_PHOTO_EDITOR', 'TRADITIONAL_VIDEO_EDITOR', 'CANDID_PHOTO_EDITOR',
    'CINEMATIC_VIDEO_EDITOR', 'DRONE_EDITOR', 'MOBILE_REEL_CONTENT_EDITOR', 'OTHER'
  ];
  return (valid.includes(clean) ? clean : 'OTHER') as any;
};

export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  const data = { ...req.body };
  if (data.joiningDate) data.joiningDate = new Date(data.joiningDate);
  if (data.role) data.role = normalizeRole(data.role);
  const employee = await prisma.employee.create({ data });
  res.status(201).json({ success: true, data: employee });
});

export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const data = { ...req.body };
  if (data.joiningDate) data.joiningDate = new Date(data.joiningDate);
  if (data.role) data.role = normalizeRole(data.role);
  const employee = await prisma.employee.update({ where: { id: req.params.id }, data });
  res.json({ success: true, data: employee });
});

export const deleteEmployee = asyncHandler(async (req: Request, res: Response) => {
  await prisma.employee.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ success: true, message: 'Employee deactivated' });
});
