import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const prisma = new PrismaClient();

export const getPayments = asyncHandler(async (req: Request, res: Response) => {
  const { search, page = '1', limit = '20' } = req.query as any;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where: any = {};
  if (search) {
    where.OR = [
      { customer: { fullName: { contains: search, mode: 'insensitive' } } },
      { contract: { contractNumber: { contains: search, mode: 'insensitive' } } },
      { transactionId: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where, skip, take: parseInt(limit), orderBy: { paymentDate: 'desc' },
      include: {
        customer: { select: { id: true, fullName: true } },
        contract: { select: { id: true, contractNumber: true } },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  res.json({ success: true, data: payments, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
});

export const getPayment = asyncHandler(async (req: Request, res: Response) => {
  const payment = await prisma.payment.findUnique({
    where: { id: req.params.id },
    include: { customer: true, contract: true },
  });
  if (!payment) throw ApiError.notFound('Payment not found');
  res.json({ success: true, data: payment });
});

export const createPayment = asyncHandler(async (req: Request, res: Response) => {
  const paymentData = req.body;

  // Use database transaction for financial operations
  const payment = await prisma.$transaction(async (tx) => {
    const contract = await tx.contract.findUnique({
      where: { id: paymentData.contractId },
      include: { payments: { select: { amount: true } } },
    });
    if (!contract) throw ApiError.notFound('Contract not found');

    const totalPaid = contract.payments.reduce((s, p) => s + Number(p.amount), 0);
    const remaining = Number(contract.finalAmount) - totalPaid;

    if (paymentData.paymentType !== 'ADDITIONAL_SERVICE' && paymentData.amount > remaining) {
      throw ApiError.badRequest(`Payment exceeds remaining balance of ₹${remaining.toLocaleString('en-IN')}`);
    }

    const p = await tx.payment.create({
      data: {
        ...paymentData,
        paymentDate: new Date(paymentData.paymentDate),
      },
      include: {
        customer: { select: { id: true, fullName: true } },
        contract: { select: { id: true, contractNumber: true } },
      },
    });
    return p;
  });

  res.status(201).json({ success: true, data: payment });
});

export const deletePayment = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.payment.findUnique({ where: { id: req.params.id } });
  if (!existing) throw ApiError.notFound('Payment not found');
  await prisma.payment.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Payment deleted' });
});

export const getPaymentStats = asyncHandler(async (req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todayPayments, monthPayments, totalPayments, contracts] = await Promise.all([
    prisma.payment.aggregate({ where: { paymentDate: { gte: today, lt: tomorrow } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { paymentDate: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.contract.findMany({
      where: { status: { in: ['ACTIVE', 'SIGNED'] } },
      include: { payments: { select: { amount: true } } },
    }),
  ]);

  const pendingPayments = contracts.reduce((sum, c) => {
    const paid = c.payments.reduce((s, p) => s + Number(p.amount), 0);
    return sum + (Number(c.finalAmount) - paid);
  }, 0);

  res.json({
    success: true,
    data: {
      todayCollection: Number(todayPayments._sum.amount || 0),
      monthCollection: Number(monthPayments._sum.amount || 0),
      totalRevenue: Number(totalPayments._sum.amount || 0),
      pendingPayments,
    },
  });
});
