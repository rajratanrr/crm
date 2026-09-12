import { prisma } from "../lib/prisma";
import { Request, Response } from 'express';
import { BusinessDomain, PaymentMethod, PaymentType, PaymentStatus } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

// Helper: determine if a payment counts as "received" money
// ADVANCE and DONE = received. PENDING = not yet received.
// If paymentStatus is null (legacy records), treat as received (backward compat).
function isReceived(paymentStatus: PaymentStatus | null | undefined): boolean {
  if (!paymentStatus) return true; // legacy records without status = treat as received
  return paymentStatus === 'ADVANCE' || paymentStatus === 'DONE';
}

export const getPayments = asyncHandler(async (req: Request, res: Response) => {
  const { domain, projectId, contractId, customerId, search, page = '1', limit = '50' } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where: any = {};

  if (domain && (domain === 'WEDDING' || domain === 'FASHION' || domain === 'GENERAL')) {
    where.domain = domain as BusinessDomain;
  }
  if (projectId) where.projectId = projectId;
  if (contractId) where.contractId = contractId;
  if (customerId) where.customerId = customerId;

  if (search) {
    where.OR = [
      { customer: { fullName: { contains: search, mode: 'insensitive' } } },
      { project: { name: { contains: search, mode: 'insensitive' } } },
      { contract: { contractNumber: { contains: search, mode: 'insensitive' } } },
      { transactionId: { contains: search, mode: 'insensitive' } },
      { reference: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { paymentDate: 'desc' },
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        project: { select: { id: true, name: true, projectNumber: true, projectType: true, budget: true } },
        contract: { select: { id: true, contractNumber: true, finalAmount: true } },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  res.json({
    success: true,
    data: payments,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

export const getFinanceSummary = asyncHandler(async (req: Request, res: Response) => {
  const { domain } = req.query as Record<string, string>;
  const wherePayment: any = {};
  const whereProject: any = {};

  if (domain && (domain === 'WEDDING' || domain === 'FASHION')) {
    wherePayment.domain = domain as BusinessDomain;
    whereProject.projectType = domain as any;
  }

  const [allPayments, allProjects] = await Promise.all([
    prisma.payment.findMany({
      where: wherePayment,
      select: { amount: true, domain: true, paymentStatus: true },
    }),
    prisma.project.findMany({
      where: whereProject,
      select: { budget: true, projectType: true },
    }),
  ]);

  // Only count payments that are RECEIVED (ADVANCE or DONE, or legacy null)
  const receivedPayments = allPayments.filter(p => isReceived(p.paymentStatus));
  const pendingPayments = allPayments.filter(p => !isReceived(p.paymentStatus));

  const totalReceived = receivedPayments.reduce((s, p) => s + Number(p.amount), 0);
  const weddingReceived = receivedPayments
    .filter(p => p.domain === 'WEDDING')
    .reduce((s, p) => s + Number(p.amount), 0);
  const fashionReceived = receivedPayments
    .filter(p => p.domain === 'FASHION')
    .reduce((s, p) => s + Number(p.amount), 0);

  const totalPendingAmt = pendingPayments.reduce((s, p) => s + Number(p.amount), 0);

  const totalRevenue = allProjects.reduce((s, p) => s + Number(p.budget), 0);

  // Outstanding = total project budgets minus what has been received
  const outstanding = Math.max(0, totalRevenue - totalReceived);

  res.json({
    success: true,
    data: {
      totalReceived,
      totalPending: outstanding,
      totalPendingRecords: totalPendingAmt,
      totalRevenue,
      weddingReceived,
      fashionReceived,
      breakdown: {
        wedding: { received: weddingReceived },
        fashion: { received: fashionReceived },
      },
    },
  });
});

export const getPayment = asyncHandler(async (req: Request, res: Response) => {
  const payment = await prisma.payment.findUnique({
    where: { id: req.params.id },
    include: { customer: true, contract: true, project: true },
  });
  if (!payment) throw new ApiError(404, 'Payment not found');
  res.json({ success: true, data: payment });
});

export const createPayment = asyncHandler(async (req: Request, res: Response) => {
  const {
    customerId,
    projectId,
    contractId,
    domain,
    amount,
    paymentMethod = 'UPI',
    paymentType = 'ADVANCE',
    paymentStatus,
    paymentDate = new Date(),
    transactionId,
    reference,
    notes,
  } = req.body;

  if (!customerId || !amount) {
    throw new ApiError(400, 'Customer and amount are required');
  }
  if (Number(amount) <= 0) {
    throw new ApiError(400, 'Payment amount must be greater than 0');
  }

  // Validate customer exists
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new ApiError(400, 'Customer not found');

  let resolvedDomain: BusinessDomain = (domain as BusinessDomain) || 'WEDDING';

  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new ApiError(400, 'Project not found');
    resolvedDomain = project.projectType === 'FASHION' ? 'FASHION' : 'WEDDING';
  }

  // Determine paymentStatus: if explicitly provided use it, else derive from paymentType for compat
  let resolvedStatus: PaymentStatus | undefined;
  if (paymentStatus && ['ADVANCE', 'PENDING', 'DONE'].includes(paymentStatus)) {
    resolvedStatus = paymentStatus as PaymentStatus;
  } else {
    // Map legacy paymentType to paymentStatus for new payments
    resolvedStatus = 'ADVANCE';
  }

  const payment = await prisma.payment.create({
    data: {
      customerId,
      projectId: projectId || null,
      contractId: contractId || null,
      domain: resolvedDomain,
      amount: Number(amount),
      paymentMethod: paymentMethod as PaymentMethod,
      paymentType: paymentType as PaymentType,
      paymentStatus: resolvedStatus,
      paymentDate: new Date(paymentDate),
      transactionId: transactionId || null,
      reference: reference || null,
      notes: notes || null,
    },
    include: {
      customer: { select: { id: true, fullName: true } },
      project: { select: { id: true, name: true, projectType: true } },
      contract: { select: { id: true, contractNumber: true } },
    },
  });

  res.status(201).json({ success: true, data: payment });
});

export const updatePayment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = await prisma.payment.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'Payment not found');

  const data: any = { ...req.body };

  if (data.amount !== undefined) {
    if (Number(data.amount) <= 0) throw new ApiError(400, 'Amount must be greater than 0');
    data.amount = Number(data.amount);
  }
  if (data.paymentDate) data.paymentDate = new Date(data.paymentDate);
  if (data.paymentStatus && !['ADVANCE', 'PENDING', 'DONE'].includes(data.paymentStatus)) {
    throw new ApiError(400, 'Invalid paymentStatus. Must be ADVANCE, PENDING, or DONE');
  }

  // Strip read-only / relation fields
  delete data.id;
  delete data.createdAt;
  delete data.customer;
  delete data.project;
  delete data.contract;

  const payment = await prisma.payment.update({
    where: { id },
    data,
    include: {
      customer: { select: { id: true, fullName: true } },
      project: { select: { id: true, name: true, projectType: true } },
      contract: { select: { id: true, contractNumber: true } },
    },
  });

  res.json({ success: true, data: payment });
});

export const patchPayment = asyncHandler(async (req: Request, res: Response, next: any) => {
  // Same as updatePayment but for PATCH (partial update)
  return updatePayment(req, res, next);
});

export const deletePayment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.payment.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'Payment not found');
  await prisma.payment.delete({ where: { id } });
  res.json({ success: true, message: 'Payment deleted successfully' });
});
