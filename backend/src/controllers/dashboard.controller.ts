import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';

const prisma = new PrismaClient();

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const [
    totalCustomers, upcomingEvents, activeContracts,
    totalRevenueAgg, contracts, pendingDeliverables
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.event.count({ where: { status: 'UPCOMING', startDate: { gte: new Date() } } }),
    prisma.contract.count({ where: { status: { in: ['ACTIVE', 'SIGNED'] } } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.contract.findMany({
      where: { status: { in: ['ACTIVE', 'SIGNED'] } },
      include: { payments: { select: { amount: true } } },
    }),
    prisma.deliverable.count({ where: { status: { in: ['PENDING', 'IN_PRODUCTION'] } } }),
  ]);

  const pendingPayments = contracts.reduce((sum, c) => {
    const paid = c.payments.reduce((s, p) => s + Number(p.amount), 0);
    return sum + Math.max(0, Number(c.finalAmount) - paid);
  }, 0);

  res.json({
    success: true,
    data: {
      totalCustomers,
      upcomingEvents,
      activeContracts,
      totalRevenue: Number(totalRevenueAgg._sum.amount || 0),
      pendingPayments,
      pendingDeliverables,
    },
  });
});

export const getRevenue = asyncHandler(async (req: Request, res: Response) => {
  const payments = await prisma.payment.findMany({
    select: { amount: true, paymentDate: true },
    orderBy: { paymentDate: 'asc' },
  });

  const monthlyRevenue: Record<string, number> = {};
  payments.forEach((p) => {
    const key = `${p.paymentDate.getFullYear()}-${String(p.paymentDate.getMonth() + 1).padStart(2, '0')}`;
    monthlyRevenue[key] = (monthlyRevenue[key] || 0) + Number(p.amount);
  });

  const data = Object.entries(monthlyRevenue).map(([month, amount]) => ({ month, amount }));
  res.json({ success: true, data });
});

export const getUpcomingEvents = asyncHandler(async (req: Request, res: Response) => {
  const events = await prisma.event.findMany({
    where: { startDate: { gte: new Date() }, status: { in: ['UPCOMING', 'IN_PROGRESS'] } },
    orderBy: { startDate: 'asc' },
    take: 10,
    include: { customer: { select: { id: true, fullName: true, phone: true } }, _count: { select: { assignments: true } } },
  });
  res.json({ success: true, data: events });
});

export const getRecentCustomers = asyncHandler(async (req: Request, res: Response) => {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { _count: { select: { events: true, contracts: true } } },
  });
  res.json({ success: true, data: customers });
});

export const getPaymentAlerts = asyncHandler(async (req: Request, res: Response) => {
  const contracts = await prisma.contract.findMany({
    where: { status: { in: ['ACTIVE', 'SIGNED'] } },
    include: {
      customer: { select: { id: true, fullName: true, phone: true } },
      event: { select: { id: true, eventName: true, startDate: true } },
      payments: { select: { amount: true } },
    },
  });

  const alerts = contracts
    .map((c) => {
      const paid = c.payments.reduce((s, p) => s + Number(p.amount), 0);
      const remaining = Number(c.finalAmount) - paid;
      return { ...c, totalPaid: paid, remainingAmount: remaining };
    })
    .filter((c) => c.remainingAmount > 0)
    .sort((a, b) => {
      const aDate = a.event?.startDate ? new Date(a.event.startDate).getTime() : Infinity;
      const bDate = b.event?.startDate ? new Date(b.event.startDate).getTime() : Infinity;
      return aDate - bDate;
    })
    .slice(0, 10);

  res.json({ success: true, data: alerts });
});

export const getPendingTasks = asyncHandler(async (req: Request, res: Response) => {
  const tasks = await prisma.task.findMany({
    where: { status: { in: ['TODO', 'IN_PROGRESS'] } },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    take: 10,
    include: {
      assignedEmployee: { select: { id: true, name: true } },
      event: { select: { id: true, eventName: true } },
    },
  });
  res.json({ success: true, data: tasks });
});
