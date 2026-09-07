import { prisma } from "../lib/prisma";
import { Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';



export const getDeliverables = asyncHandler(async (req: Request, res: Response) => {
  const { status, search, page = '1', limit = '20' } = req.query as any;
  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { event: { eventName: { contains: search, mode: 'insensitive' } } },
      { event: { customer: { fullName: { contains: search, mode: 'insensitive' } } } },
    ];
  }
  const [deliverables, total] = await Promise.all([
    prisma.deliverable.findMany({
      where, skip: (parseInt(page) - 1) * parseInt(limit), take: parseInt(limit),
      orderBy: { dueDate: 'asc' },
      include: {
        event: { include: { customer: { select: { id: true, fullName: true } } } },
        contract: { select: { id: true, contractNumber: true } },
      },
    }),
    prisma.deliverable.count({ where }),
  ]);
  res.json({ success: true, data: deliverables, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
});

export const getDeliverable = asyncHandler(async (req: Request, res: Response) => {
  const d = await prisma.deliverable.findUnique({
    where: { id: req.params.id },
    include: { event: { include: { customer: true } }, contract: true },
  });
  if (!d) throw ApiError.notFound('Deliverable not found');
  res.json({ success: true, data: d });
});

export const createDeliverable = asyncHandler(async (req: Request, res: Response) => {
  const data = { ...req.body };
  if (data.dueDate) data.dueDate = new Date(data.dueDate);
  if (data.deliveryDate) data.deliveryDate = new Date(data.deliveryDate);
  const d = await prisma.deliverable.create({ data, include: { event: { include: { customer: { select: { fullName: true } } } } } });
  res.status(201).json({ success: true, data: d });
});

export const updateDeliverable = asyncHandler(async (req: Request, res: Response) => {
  const data = { ...req.body };
  if (data.dueDate) data.dueDate = new Date(data.dueDate);
  if (data.deliveryDate) data.deliveryDate = new Date(data.deliveryDate);
  const d = await prisma.deliverable.update({ where: { id: req.params.id }, data });
  res.json({ success: true, data: d });
});

export const updateDeliverableStatus = asyncHandler(async (req: Request, res: Response) => {
  const data: any = { status: req.body.status };
  if (req.body.deliveryDate) data.deliveryDate = new Date(req.body.deliveryDate);
  if (req.body.deliveryLink) data.deliveryLink = req.body.deliveryLink;
  const d = await prisma.deliverable.update({ where: { id: req.params.id }, data });
  res.json({ success: true, data: d });
});
