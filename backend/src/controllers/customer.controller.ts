import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { generateCustomerCode } from '../utils/generateCode';

const prisma = new PrismaClient();

export const getCustomers = asyncHandler(async (req: Request, res: Response) => {
  const { search, city, source, page = '1', limit = '20' } = req.query as any;
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

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { events: true, contracts: true } },
        contracts: {
          select: {
            finalAmount: true,
            payments: { select: { amount: true } },
          },
        },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  const data = customers.map((c) => {
    const totalContractValue = c.contracts.reduce((sum, con) => sum + Number(con.finalAmount), 0);
    const totalPaid = c.contracts.reduce(
      (sum, con) => sum + con.payments.reduce((psum, p) => psum + Number(p.amount), 0),
      0
    );
    const { contracts: _, ...customer } = c;
    return {
      ...customer,
      totalContractValue,
      totalPaid,
      remainingAmount: totalContractValue - totalPaid,
    };
  });

  res.json({ success: true, data, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
});

export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: {
      events: { orderBy: { startDate: 'desc' } },
      contracts: { include: { payments: true, event: true, package: true }, orderBy: { createdAt: 'desc' } },
      payments: { orderBy: { paymentDate: 'desc' } },
      invoices: { orderBy: { createdAt: 'desc' } },
      interactions: { orderBy: { interactionDate: 'desc' }, include: { user: { select: { name: true } } } },
      tasks: { orderBy: { createdAt: 'desc' } },
      _count: { select: { events: true, contracts: true, payments: true } },
    },
  });

  if (!customer) throw ApiError.notFound('Customer not found');

  const totalContractValue = customer.contracts.reduce((sum, c) => sum + Number(c.finalAmount), 0);
  const totalPaid = customer.payments.reduce((sum, p) => sum + Number(p.amount), 0);

  res.json({
    success: true,
    data: { ...customer, totalContractValue, totalPaid, remainingAmount: totalContractValue - totalPaid },
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
