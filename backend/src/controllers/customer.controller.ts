import { prisma } from "../lib/prisma";
import { Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { generateCustomerCode } from '../utils/generateCode';



export const getCustomers = asyncHandler(async (req: Request, res: Response) => {
  const { search, city, source, clientType, page = '1', limit = '50' } = req.query as any;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where: any = {};
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } },
      { customerCode: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (city) where.city = { equals: city, mode: 'insensitive' };
  if (source) where.source = { equals: source, mode: 'insensitive' };
  if (clientType && (clientType === 'WEDDING' || clientType === 'FASHION')) where.clientType = clientType;

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { events: true, contracts: true, projects: true } },
        contracts: {
          select: {
            id: true,
            projectId: true,
            finalAmount: true,
          },
        },
        projects: {
          select: {
            id: true,
            budget: true,
          },
        },
        payments: {
          select: {
            amount: true,
          },
        },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  const data = customers.map((c) => {
    const contractSum = c.contracts.reduce((sum, con) => sum + Number(con.finalAmount), 0);
    const linkedProjectIds = new Set(c.contracts.map(con => con.projectId).filter(Boolean));
    const unlinkedProjectsSum = c.projects
      .filter(p => !linkedProjectIds.has(p.id))
      .reduce((sum, p) => sum + Number(p.budget), 0);
    const totalContractValue = contractSum + unlinkedProjectsSum;

    const totalPaid = c.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remainingAmount = Math.max(0, totalContractValue - totalPaid);

    const { contracts: _, projects: __, payments: ___, ...customer } = c;
    return {
      ...customer,
      totalContractValue,
      totalPaid,
      remainingAmount,
    };
  });

  res.json({ success: true, data, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
});

export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: {
      events: { orderBy: { startDate: 'desc' } },
      contracts: { include: { payments: true, event: true, package: true, project: true }, orderBy: { createdAt: 'desc' } },
      projects: { orderBy: { createdAt: 'desc' } },
      payments: { orderBy: { paymentDate: 'desc' } },
      invoices: { orderBy: { createdAt: 'desc' } },
      interactions: { orderBy: { interactionDate: 'desc' }, include: { user: { select: { name: true } } } },
      tasks: { orderBy: { createdAt: 'desc' } },
      _count: { select: { events: true, contracts: true, payments: true } },
    },
  });

  if (!customer) throw ApiError.notFound('Customer not found');

  const contractSum = customer.contracts.reduce((sum, con) => sum + Number(con.finalAmount), 0);
  const linkedProjectIds = new Set(customer.contracts.map(con => con.projectId).filter(Boolean));
  const unlinkedProjectsSum = (customer.projects || [])
    .filter(p => !linkedProjectIds.has(p.id))
    .reduce((sum, p) => sum + Number(p.budget), 0);
  const totalContractValue = contractSum + unlinkedProjectsSum;
  const totalPaid = customer.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remainingAmount = Math.max(0, totalContractValue - totalPaid);

  res.json({
    success: true,
    data: { ...customer, totalContractValue, totalPaid, remainingAmount },
  });
});

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customerCode = await generateCustomerCode();
  const customer = await prisma.customer.create({
    data: { ...req.body, customerCode },
  });
  res.status(201).json({ success: true, data: customer });
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!existing) throw ApiError.notFound('Customer not found');

  const customer = await prisma.customer.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json({ success: true, data: customer });
});

export const deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { contracts: true, events: true } } },
  });
  if (!existing) throw ApiError.notFound('Customer not found');
  if (existing._count.contracts > 0) throw ApiError.badRequest('Cannot delete customer with existing contracts');

  await prisma.customer.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Customer deleted' });
});
