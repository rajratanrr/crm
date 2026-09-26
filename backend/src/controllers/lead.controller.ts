import { prisma } from "../lib/prisma";
import { Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { generateLeadNumber, generateCustomerCode } from '../utils/generateCode';



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
  const { customerName, customerPhone, name, phone, eventDate, estimatedDate, ...leadData } = req.body;

  const leadName = name || customerName || 'Prospective Client';
  const leadPhone = phone || customerPhone || '9876543210';
  const targetDate = estimatedDate || eventDate ? new Date(estimatedDate || eventDate) : null;

  // If no customerId but has name/phone, create or link customer
  let customerId = leadData.customerId;
  if (!customerId && (customerName || name) && (customerPhone || phone)) {
    const custPhone = customerPhone || phone;
    let customer = await prisma.customer.findFirst({ where: { phone: custPhone } });
    if (!customer) {
      const code = await generateCustomerCode();
      customer = await prisma.customer.create({
        data: { customerCode: code, fullName: leadName, phone: custPhone, source: leadData.source },
      });
    }
    customerId = customer.id;
  }

  const leadNumber = await generateLeadNumber();

  const lead = await prisma.lead.create({
    data: {
      ...leadData,
      leadNumber,
      name: leadName,
      phone: leadPhone,
      customerId: customerId || undefined,
      estimatedDate: targetDate,
    },
    include: { customer: { select: { id: true, fullName: true, phone: true } }, assignedUser: { select: { id: true, name: true } } },
  });

  res.status(201).json({ success: true, data: lead });
});

export const updateLead = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.lead.findUnique({ where: { id: req.params.id } });
  if (!existing) throw ApiError.notFound('Lead not found');

  const { eventDate, estimatedDate, customerName, customerPhone, ...rest } = req.body;
  const targetDate = estimatedDate !== undefined
    ? (estimatedDate ? new Date(estimatedDate) : null)
    : (eventDate !== undefined ? (eventDate ? new Date(eventDate) : null) : undefined);

  const lead = await prisma.lead.update({
    where: { id: req.params.id },
    data: {
      ...rest,
      ...(targetDate !== undefined && { estimatedDate: targetDate }),
      ...(customerName && !rest.name && { name: customerName }),
      ...(customerPhone && !rest.phone && { phone: customerPhone }),
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
