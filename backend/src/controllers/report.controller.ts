import { prisma } from "../lib/prisma";
import { Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler';



export const getRevenueReport = asyncHandler(async (req: Request, res: Response) => {
  const payments = await prisma.payment.findMany({ select: { amount: true, paymentDate: true, paymentMethod: true }, orderBy: { paymentDate: 'asc' } });
  const monthly: Record<string, number> = {};
  const byMethod: Record<string, number> = {};
  payments.forEach((p) => {
    const key = `${p.paymentDate.getFullYear()}-${String(p.paymentDate.getMonth() + 1).padStart(2, '0')}`;
    monthly[key] = (monthly[key] || 0) + Number(p.amount);
    byMethod[p.paymentMethod] = (byMethod[p.paymentMethod] || 0) + Number(p.amount);
  });
  res.json({ success: true, data: { monthly: Object.entries(monthly).map(([m, a]) => ({ month: m, amount: a })), byMethod: Object.entries(byMethod).map(([m, a]) => ({ method: m, amount: a })) } });
});

export const getCustomerReport = asyncHandler(async (req: Request, res: Response) => {
  const customers = await prisma.customer.findMany({ select: { createdAt: true } });
  const monthly: Record<string, number> = {};
  customers.forEach((c) => {
    const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, '0')}`;
    monthly[key] = (monthly[key] || 0) + 1;
  });
  res.json({ success: true, data: { monthly: Object.entries(monthly).map(([m, c]) => ({ month: m, count: c })), total: customers.length } });
});

export const getLeadReport = asyncHandler(async (req: Request, res: Response) => {
  const leads = await prisma.lead.groupBy({ by: ['status'], _count: true });
  res.json({ success: true, data: leads.map((l) => ({ status: l.status, count: l._count })) });
});

export const getEventReport = asyncHandler(async (req: Request, res: Response) => {
  const [byType, byStatus, byMonth] = await Promise.all([
    prisma.event.groupBy({ by: ['eventType'], _count: true }),
    prisma.event.groupBy({ by: ['status'], _count: true }),
    prisma.event.findMany({ select: { startDate: true } }),
  ]);
  const monthly: Record<string, number> = {};
  byMonth.forEach((e) => {
    const key = `${e.startDate.getFullYear()}-${String(e.startDate.getMonth() + 1).padStart(2, '0')}`;
    monthly[key] = (monthly[key] || 0) + 1;
  });
  res.json({ success: true, data: { byType: byType.map((e) => ({ type: e.eventType, count: e._count })), byStatus: byStatus.map((e) => ({ status: e.status, count: e._count })), monthly: Object.entries(monthly).map(([m, c]) => ({ month: m, count: c })) } });
});

export const getPackageReport = asyncHandler(async (req: Request, res: Response) => {
  const packages = await prisma.package.findMany({ include: { _count: { select: { contracts: true } }, contracts: { select: { finalAmount: true } } } });
  const data = packages.map((p) => ({ name: p.name, contractCount: p._count.contracts, totalRevenue: p.contracts.reduce((s, c) => s + Number(c.finalAmount), 0) }));
  res.json({ success: true, data });
});

export const getPaymentReport = asyncHandler(async (req: Request, res: Response) => {
  const payments = await prisma.payment.findMany({ select: { amount: true, paymentDate: true, paymentType: true } });
  const byType: Record<string, number> = {};
  payments.forEach((p) => { byType[p.paymentType] = (byType[p.paymentType] || 0) + Number(p.amount); });
  res.json({ success: true, data: { byType: Object.entries(byType).map(([t, a]) => ({ type: t, amount: a })), total: payments.reduce((s, p) => s + Number(p.amount), 0) } });
});

export const getTeamReport = asyncHandler(async (req: Request, res: Response) => {
  const employees = await prisma.employee.findMany({ where: { isActive: true }, include: { _count: { select: { assignments: true, tasks: true } } } });
  res.json({ success: true, data: employees.map((e) => ({ name: e.name, role: e.role, assignments: e._count.assignments, tasks: e._count.tasks })) });
});

export const getSearchResults = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query as any;
  if (!q || q.length < 2) return res.json({ success: true, data: [] });
  const [customers, events, contracts] = await Promise.all([
    prisma.customer.findMany({ where: { OR: [{ fullName: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }, { customerCode: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] }, take: 5, select: { id: true, fullName: true, customerCode: true, phone: true } }),
    prisma.event.findMany({ where: { eventName: { contains: q, mode: 'insensitive' } }, take: 5, select: { id: true, eventName: true, eventType: true } }),
    prisma.contract.findMany({ where: { contractNumber: { contains: q, mode: 'insensitive' } }, take: 5, select: { id: true, contractNumber: true } }),
  ]);
  res.json({ success: true, data: { customers: customers.map((c) => ({ ...c, type: 'customer' })), events: events.map((e) => ({ ...e, type: 'event' })), contracts: contracts.map((c) => ({ ...c, type: 'contract' })) } });
});
