import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { generateInvoiceNumber } from '../utils/generateCode';

const prisma = new PrismaClient();

export const getInvoices = asyncHandler(async (req: Request, res: Response) => {
  const { status, search, page = '1', limit = '20' } = req.query as any;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: 'insensitive' } },
      { customer: { fullName: { contains: search, mode: 'insensitive' } } },
    ];
  }
  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, fullName: true } },
        contract: { select: { id: true, contractNumber: true } },
      },
    }),
    prisma.invoice.count({ where }),
  ]);
  res.json({ success: true, data: invoices, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
});

export const getInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: { customer: true, contract: { include: { items: true, payments: true, event: true } } },
  });
  if (!invoice) throw ApiError.notFound('Invoice not found');
  res.json({ success: true, data: invoice });
});

export const createInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoiceNumber = await generateInvoiceNumber();
  const total = req.body.subtotal - (req.body.discount || 0) + (req.body.tax || 0);
  const invoice = await prisma.invoice.create({
    data: {
      ...req.body,
      invoiceNumber,
      total,
      issueDate: new Date(req.body.issueDate),
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
    },
    include: { customer: { select: { id: true, fullName: true } }, contract: { select: { id: true, contractNumber: true } } },
  });
  res.status(201).json({ success: true, data: invoice });
});

export const updateInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await prisma.invoice.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json({ success: true, data: invoice });
});

export const updateInvoiceStatus = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await prisma.invoice.update({ where: { id: req.params.id }, data: { status: req.body.status } });
  res.json({ success: true, data: invoice });
});
