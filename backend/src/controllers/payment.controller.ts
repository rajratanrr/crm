import { prisma } from "../lib/prisma";
import { Request, Response } from 'express';
import { PrismaClient, BusinessDomain, PaymentMethod, PaymentType } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';



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
  const whereContract: any = {};

  if (domain && (domain === 'WEDDING' || domain === 'FASHION')) {
    wherePayment.domain = domain as BusinessDomain;
    whereProject.projectType = domain as any;
  }

  const [allPayments, allProjects, allContracts] = await Promise.all([
    prisma.payment.findMany({ where: wherePayment, select: { amount: true, domain: true } }),
    prisma.project.findMany({ where: whereProject, select: { budget: true, projectType: true } }),
    prisma.contract.findMany({ where: whereContract, select: { finalAmount: true } }),
  ]);

  const totalReceived = allPayments.reduce((s, p) => s + Number(p.amount), 0);
  const weddingReceived = allPayments.filter((p) => p.domain === 'WEDDING').reduce((s, p) => s + Number(p.amount), 0);
  const fashionReceived = allPayments.filter((p) => p.domain === 'FASHION').reduce((s, p) => s + Number(p.amount), 0);

  const totalRevenue = allProjects.length > 0
    ? allProjects.reduce((s, p) => s + Number(p.budget), 0)
    : allContracts.reduce((s, c) => s + Number(c.finalAmount), 0);

  const totalPending = Math.max(0, totalRevenue - totalReceived);

  res.json({
    success: true,
    data: {
      totalReceived,
      totalPending,
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
    paymentDate = new Date(),
    transactionId,
    notes,
  } = req.body;

  if (!customerId || !amount) {
    throw new ApiError(400, 'Customer and amount are required');
  }

  let resolvedDomain: BusinessDomain = (domain as BusinessDomain) || 'WEDDING';

  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (project) {
      resolvedDomain = project.projectType === 'FASHION' ? 'FASHION' : 'WEDDING';
    }
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
      paymentDate: new Date(paymentDate),
      transactionId,
      notes,
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
  const data = { ...req.body };

  if (data.amount !== undefined) data.amount = Number(data.amount);
  if (data.paymentDate) data.paymentDate = new Date(data.paymentDate);

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

export const deletePayment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.payment.delete({ where: { id } });
  res.json({ success: true, message: 'Payment deleted successfully' });
});
