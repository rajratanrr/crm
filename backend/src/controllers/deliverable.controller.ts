import { prisma } from "../lib/prisma";
import { Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const deliverableIncludes = {
  event: {
    include: {
      customer: { select: { id: true, fullName: true, phone: true } },
    },
  },
  project: {
    include: {
      customer: { select: { id: true, fullName: true, companyName: true, phone: true } },
    },
  },
  contract: { select: { id: true, contractNumber: true } },
};

export const getDeliverables = asyncHandler(async (req: Request, res: Response) => {
  const { status, domain, projectId, eventId, search, page = '1', limit = '100' } = req.query as any;
  const where: any = {};

  if (status && status !== 'ALL') where.status = status;
  if (domain && (domain === 'WEDDING' || domain === 'FASHION')) where.domain = domain;
  if (projectId) where.projectId = projectId;
  if (eventId) where.eventId = eventId;

  if (search && String(search).trim()) {
    const s = String(search).trim();
    where.OR = [
      { notes: { contains: s, mode: 'insensitive' } },
      { deliveryLink: { contains: s, mode: 'insensitive' } },
      { event: { eventName: { contains: s, mode: 'insensitive' } } },
      { event: { customer: { fullName: { contains: s, mode: 'insensitive' } } } },
      { project: { name: { contains: s, mode: 'insensitive' } } },
      { project: { brand: { contains: s, mode: 'insensitive' } } },
      { project: { customer: { fullName: { contains: s, mode: 'insensitive' } } } },
      { project: { customer: { companyName: { contains: s, mode: 'insensitive' } } } },
    ];
  }

  const take = parseInt(limit) > 0 ? parseInt(limit) : 100;
  const skip = (parseInt(page) - 1) * take;

  const [deliverables, total] = await Promise.all([
    prisma.deliverable.findMany({
      where,
      skip,
      take,
      orderBy: { dueDate: 'asc' },
      include: deliverableIncludes,
    }),
    prisma.deliverable.count({ where }),
  ]);

  res.json({
    success: true,
    data: deliverables,
    pagination: {
      total,
      page: parseInt(page),
      limit: take,
      pages: Math.ceil(total / take),
    },
  });
});

export const getDeliverable = asyncHandler(async (req: Request, res: Response) => {
  const d = await prisma.deliverable.findUnique({
    where: { id: req.params.id },
    include: deliverableIncludes,
  });
  if (!d) throw ApiError.notFound('Deliverable not found');
  res.json({ success: true, data: d });
});

export const createDeliverable = asyncHandler(async (req: Request, res: Response) => {
  const data: any = { ...req.body };

  // Sanitize empty strings for foreign keys
  if (!data.eventId || data.eventId === '') delete data.eventId;
  if (!data.projectId || data.projectId === '') delete data.projectId;
  if (!data.contractId || data.contractId === '') delete data.contractId;

  // Auto-detect domain if not provided
  if (!data.domain) {
    if (data.projectId) {
      const proj = await prisma.project.findUnique({
        where: { id: data.projectId },
        select: { projectType: true },
      });
      if (proj?.projectType) {
        data.domain = proj.projectType;
      }
    } else if (data.eventId) {
      data.domain = 'WEDDING';
    }
  }

  if (data.dueDate) data.dueDate = new Date(data.dueDate);
  if (data.deliveryDate) data.deliveryDate = new Date(data.deliveryDate);
  if (data.quantity) data.quantity = Number(data.quantity);

  const d = await prisma.deliverable.create({
    data,
    include: deliverableIncludes,
  });

  res.status(201).json({ success: true, data: d });
});

export const updateDeliverable = asyncHandler(async (req: Request, res: Response) => {
  const data: any = { ...req.body };

  if (data.eventId === '') data.eventId = null;
  if (data.projectId === '') data.projectId = null;
  if (data.contractId === '') data.contractId = null;

  if (data.dueDate) data.dueDate = new Date(data.dueDate);
  if (data.deliveryDate) data.deliveryDate = new Date(data.deliveryDate);
  if (data.quantity) data.quantity = Number(data.quantity);

  const d = await prisma.deliverable.update({
    where: { id: req.params.id },
    data,
    include: deliverableIncludes,
  });

  res.json({ success: true, data: d });
});

export const updateDeliverableStatus = asyncHandler(async (req: Request, res: Response) => {
  const data: any = { status: req.body.status };
  if (req.body.deliveryDate) {
    data.deliveryDate = new Date(req.body.deliveryDate);
  } else if (req.body.status === 'DELIVERED') {
    data.deliveryDate = new Date();
  }
  if (req.body.deliveryLink !== undefined) {
    data.deliveryLink = req.body.deliveryLink;
  }

  const d = await prisma.deliverable.update({
    where: { id: req.params.id },
    data,
    include: deliverableIncludes,
  });

  res.json({ success: true, data: d });
});

export const deleteDeliverable = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.deliverable.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Deliverable not found');

  await prisma.deliverable.delete({ where: { id } });
  res.json({ success: true, message: 'Deliverable deleted successfully' });
});
