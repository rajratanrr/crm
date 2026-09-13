import { prisma } from "../lib/prisma";
import { Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler';



export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const [
    totalCustomers,
    upcomingEvents,
    activeContracts,
    allPayments,
    contracts,
    pendingDeliverables,
    weddingProjectsCount,
    fashionProjectsCount,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.event.count({ where: { status: 'UPCOMING', startDate: { gte: new Date() } } }),
    prisma.contract.count({ where: { status: { in: ['ACTIVE', 'SIGNED'] } } }),
    // Fetch all payments with status so we can filter
    prisma.payment.findMany({ select: { amount: true, domain: true, paymentStatus: true } }),
    prisma.contract.findMany({
      where: { status: { in: ['ACTIVE', 'SIGNED'] } },
      include: { payments: { select: { amount: true } } },
    }),
    prisma.deliverable.count({ where: { status: { in: ['PENDING', 'IN_PRODUCTION'] } } }),
    prisma.project.count({ where: { projectType: 'WEDDING' } }),
    prisma.project.count({ where: { projectType: 'FASHION' } }),
  ]);

  // Only ADVANCE/DONE payments count as received revenue
  const isReceived = (ps: string | null | undefined) => !ps || ps === 'ADVANCE' || ps === 'DONE';
  const receivedPayments = allPayments.filter(p => isReceived(p.paymentStatus));

  const totalRevenue = receivedPayments.reduce((s, p) => s + Number(p.amount), 0);
  const weddingRevenue = receivedPayments.filter(p => p.domain === 'WEDDING').reduce((s, p) => s + Number(p.amount), 0);
  const fashionRevenue = receivedPayments.filter(p => p.domain === 'FASHION').reduce((s, p) => s + Number(p.amount), 0);

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
      totalRevenue,
      pendingPayments,
      pendingDeliverables,
      weddingProjects: weddingProjectsCount,
      fashionProjects: fashionProjectsCount,
      weddingRevenue,
      fashionRevenue,
      projectDistribution: {
        wedding: weddingProjectsCount,
        fashion: fashionProjectsCount,
        total: weddingProjectsCount + fashionProjectsCount,
      },
    },
  });
});

export const getRevenue = asyncHandler(async (req: Request, res: Response) => {
  const payments = await prisma.payment.findMany({
    select: { amount: true, paymentDate: true, domain: true },
    orderBy: { paymentDate: 'asc' },
  });

  const monthlyRevenue: Record<string, { wedding: number; fashion: number; amount: number }> = {};
  payments.forEach((p) => {
    const key = `${p.paymentDate.getFullYear()}-${String(p.paymentDate.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyRevenue[key]) {
      monthlyRevenue[key] = { wedding: 0, fashion: 0, amount: 0 };
    }
    const amt = Number(p.amount);
    monthlyRevenue[key].amount += amt;
    if (p.domain === 'FASHION') {
      monthlyRevenue[key].fashion += amt;
    } else {
      monthlyRevenue[key].wedding += amt;
    }
  });

  const data = Object.entries(monthlyRevenue).map(([month, val]) => ({
    month,
    amount: val.amount,
    wedding: val.wedding,
    fashion: val.fashion,
  }));

  res.json({ success: true, data });
});

export const getRecentProjects = asyncHandler(async (req: Request, res: Response) => {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      customer: { select: { id: true, fullName: true, phone: true } },
      payments: { select: { amount: true, paymentStatus: true } },
    },
  });

  const formatted = projects.map((p) => {
    const paid = p.payments
      .filter((pay) => !pay.paymentStatus || pay.paymentStatus === 'ADVANCE' || pay.paymentStatus === 'DONE')
      .reduce((s, pay) => s + Number(pay.amount), 0);
    return {
      ...p,
      totalPaid: paid,
      remainingAmount: Math.max(0, Number(p.budget) - paid),
    };
  });

  res.json({ success: true, data: formatted });
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
    include: { _count: { select: { events: true, contracts: true, projects: true } } },
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
      project: { select: { id: true, name: true, projectType: true } },
    },
  });
  res.json({ success: true, data: tasks });
});
