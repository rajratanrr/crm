import { prisma } from "../lib/prisma";
import { Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { generateInvoiceNumber } from '../utils/generateCode';

const invoiceIncludes = {
  customer: {
    select: {
      id: true,
      fullName: true,
      companyName: true,
      email: true,
      phone: true,
      address: true,
      clientType: true,
    },
  },
  contract: {
    select: {
      id: true,
      contractNumber: true,
      finalAmount: true,
      status: true,
      project: {
        select: {
          id: true,
          name: true,
          projectNumber: true,
          projectType: true,
          brand: true,
        },
      },
      event: {
        select: {
          id: true,
          eventName: true,
        },
      },
      items: true,
      payments: true,
    },
  },
};

export const getInvoices = asyncHandler(async (req: Request, res: Response) => {
  const { status, domain, customerId, contractId, search, page = '1', limit = '100' } = req.query as any;
  const take = parseInt(limit) > 0 ? parseInt(limit) : 100;
  const skip = (parseInt(page) - 1) * take;

  const where: any = {};
  if (status && status !== 'ALL') where.status = status;
  if (customerId) where.customerId = customerId;
  if (contractId) where.contractId = contractId;

  if (domain && (domain === 'WEDDING' || domain === 'FASHION')) {
    where.contract = {
      project: {
        projectType: domain,
      },
    };
  }

  if (search && String(search).trim()) {
    const s = String(search).trim();
    where.OR = [
      { invoiceNumber: { contains: s, mode: 'insensitive' } },
      { customer: { fullName: { contains: s, mode: 'insensitive' } } },
      { customer: { companyName: { contains: s, mode: 'insensitive' } } },
      { contract: { contractNumber: { contains: s, mode: 'insensitive' } } },
      { contract: { project: { name: { contains: s, mode: 'insensitive' } } } },
      { contract: { project: { brand: { contains: s, mode: 'insensitive' } } } },
    ];
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: invoiceIncludes,
    }),
    prisma.invoice.count({ where }),
  ]);

  res.json({
    success: true,
    data: invoices,
    pagination: {
      total,
      page: parseInt(page),
      limit: take,
      pages: Math.ceil(total / take),
    },
  });
});

export const getInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: {
      customer: true,
      contract: {
        include: {
          items: true,
          payments: true,
          event: true,
          project: {
            include: {
              customer: true,
            },
          },
        },
      },
    },
  });
  if (!invoice) throw ApiError.notFound('Invoice not found');
  res.json({ success: true, data: invoice });
});

export const createInvoice = asyncHandler(async (req: Request, res: Response) => {
  const { contractId } = req.body;
  let customerId = req.body.customerId;

  if (!customerId && contractId) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { customerId: true },
    });
    if (contract?.customerId) {
      customerId = contract.customerId;
    }
  }

  if (!customerId) {
    throw ApiError.badRequest('Customer ID is required');
  }

  const invoiceNumber = await generateInvoiceNumber();
  const subtotal = Number(req.body.subtotal) || 0;
  const discount = Number(req.body.discount) || 0;
  const tax = Number(req.body.tax) || 0;
  const total = subtotal - discount + tax;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      contractId,
      customerId,
      subtotal,
      discount,
      tax,
      total,
      status: req.body.status || 'DRAFT',
      issueDate: new Date(req.body.issueDate),
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
      pdfUrl: req.body.pdfUrl || null,
    },
    include: invoiceIncludes,
  });

  res.status(201).json({ success: true, data: invoice });
});

export const updateInvoice = asyncHandler(async (req: Request, res: Response) => {
  const data: any = { ...req.body };

  if (data.issueDate) data.issueDate = new Date(data.issueDate);
  if (data.dueDate) data.dueDate = new Date(data.dueDate);

  if (data.subtotal !== undefined || data.discount !== undefined || data.tax !== undefined) {
    const existing = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound('Invoice not found');

    const subtotal = data.subtotal !== undefined ? Number(data.subtotal) : Number(existing.subtotal);
    const discount = data.discount !== undefined ? Number(data.discount) : Number(existing.discount);
    const tax = data.tax !== undefined ? Number(data.tax) : Number(existing.tax);
    data.subtotal = subtotal;
    data.discount = discount;
    data.tax = tax;
    data.total = subtotal - discount + tax;
  }

  const invoice = await prisma.invoice.update({
    where: { id: req.params.id },
    data,
    include: invoiceIncludes,
  });

  res.json({ success: true, data: invoice });
});

export const updateInvoiceStatus = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await prisma.invoice.update({
    where: { id: req.params.id },
    data: { status: req.body.status },
    include: invoiceIncludes,
  });
  res.json({ success: true, data: invoice });
});

export const deleteInvoice = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Invoice not found');

  await prisma.invoice.delete({ where: { id } });
  res.json({ success: true, message: 'Invoice deleted successfully' });
});
