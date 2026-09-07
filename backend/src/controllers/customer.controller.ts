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
  const { id } = req.params;
  const existing = await prisma.customer.findUnique({
    where: { id },
  });
  if (!existing) throw ApiError.notFound("Customer not found");

  // 1. Delete associated payments
  await prisma.payment.deleteMany({ where: { customerId: id } });

  // 2. Delete contract items & contracts
  const contracts = await prisma.contract.findMany({ where: { customerId: id }, select: { id: true } });
  const contractIds = contracts.map(c => c.id);
  if (contractIds.length > 0) {
    await prisma.contractItem.deleteMany({ where: { contractId: { in: contractIds } } });
    await prisma.contract.deleteMany({ where: { customerId: id } });
  }

  // 3. Delete invoices
  await prisma.invoice.deleteMany({ where: { customerId: id } });

  // 4. Delete event assignments, subEvents, & events
  const events = await prisma.event.findMany({ where: { customerId: id }, select: { id: true } });
  const eventIds = events.map(e => e.id);
  if (eventIds.length > 0) {
    await prisma.eventAssignment.deleteMany({ where: { eventId: { in: eventIds } } });
    await prisma.eventSubEvent.deleteMany({ where: { eventId: { in: eventIds } } });
    await prisma.event.deleteMany({ where: { customerId: id } });
  }

  // 5. Delete deliverables & tasks linked to customer or customer projects
  const projects = await prisma.project.findMany({ where: { customerId: id }, select: { id: true } });
  const projectIds = projects.map(p => p.id);
  if (projectIds.length > 0) {
    await prisma.deliverable.deleteMany({ where: { projectId: { in: projectIds } } });
    await prisma.task.deleteMany({ where: { projectId: { in: projectIds } } });
    await prisma.project.deleteMany({ where: { customerId: id } });
  } else {
    await prisma.task.deleteMany({ where: { customerId: id } });
  }

  // 6. Delete interactions, studio bookings, leads
  await prisma.interaction.deleteMany({ where: { customerId: id } });
  await prisma.studioBooking.deleteMany({ where: { customerId: id } });
  await prisma.lead.updateMany({ where: { customerId: id }, data: { customerId: null } });

  // 7. Delete customer
  await prisma.customer.delete({ where: { id } });

  res.json({ success: true, message: "Customer and all associated records deleted successfully" });
});
