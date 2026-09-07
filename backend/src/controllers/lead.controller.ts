import { prisma } from "../lib/prisma";
import { Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';



export const getLeads = asyncHandler(async (req: Request, res: Response) => {
  const { status, search, page = '1', limit = '50' } = req.query as any;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { customer: { fullName: { contains: search, mode: 'insensitive' } } },
      { notes: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where, skip, take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, fullName: true, phone: true, email: true } },
        assignedUser: { select: { id: true, name: true } },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  res.json({ success: true, data: leads, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
});

export const getLead = asyncHandler(async (req: Request, res: Response) => {
  const lead = await prisma.lead.findUnique({
    where: { id: req.params.id },
    include: {
      customer: true,
      assignedUser: { select: { id: true, name: true } },
    },
  });
  if (!lead) throw ApiError.notFound('Lead not found');
  res.json({ success: true, data: lead });
});

export const createLead = asyncHandler(async (req: Request, res: Response) => {
  const { customerName, customerPhone, ...leadData } = req.body;

  // If no customerId but has name/phone, create or link customer
  if (!leadData.customerId && customerName && customerPhone) {
    let customer = await prisma.customer.findFirst({ where: { phone: customerPhone } });
    if (!customer) {
      const code = `CUST-${String(Date.now()).slice(-4)}`;
      customer = await prisma.customer.create({
        data: { customerCode: code, fullName: customerName, phone: customerPhone, source: leadData.source },
      });
    }
    leadData.customerId = customer.id;
  }

  const lead = await prisma.lead.create({
    data: {
      ...leadData,
      eventDate: leadData.eventDate ? new Date(leadData.eventDate) : null,
    },
    include: { customer: { select: { id: true, fullName: true, phone: true } }, assignedUser: { select: { id: true, name: true } } },
  });

  res.status(201).json({ success: true, data: lead });
});

export const updateLead = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.lead.findUnique({ where: { id: req.params.id } });
  if (!existing) throw ApiError.notFound('Lead not found');

  const lead = await prisma.lead.update({
    where: { id: req.params.id },
    data: {
      ...req.body,
      eventDate: req.body.eventDate ? new Date(req.body.eventDate) : undefined,
    },
    include: { customer: { select: { id: true, fullName: true, phone: true } }, assignedUser: { select: { id: true, name: true } } },
  });

  res.json({ success: true, data: lead });
});

export const updateLeadStatus = asyncHandler(async (req: Request, res: Response) => {
  const lead = await prisma.lead.update({
    where: { id: req.params.id },
    data: { status: req.body.status },
    include: { customer: { select: { id: true, fullName: true, phone: true } }, assignedUser: { select: { id: true, name: true } } },
  });
  res.json({ success: true, data: lead });
});

export const deleteLead = asyncHandler(async (req: Request, res: Response) => {
  await prisma.lead.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Lead deleted' });
});
