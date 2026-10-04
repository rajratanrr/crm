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
export const getPaymentsByClient = asyncHandler(async (req: Request, res: Response) => {
  const { domain, search } = req.query as Record<string, string>;
  const paymentWhere: any = {};
  const projectWhere: any = {};

  if (domain && (domain === 'WEDDING' || domain === 'FASHION' || domain === 'GENERAL')) {
    paymentWhere.domain = domain as BusinessDomain;
    projectWhere.projectType = domain as any;
  }

  // Find all payments and projects matching domain filter
  const [allPayments, allProjects] = await Promise.all([
    prisma.payment.findMany({
      where: paymentWhere,
      orderBy: { paymentDate: 'desc' },
      include: {
        customer: { select: { id: true, fullName: true, phone: true, email: true } },
        project: { select: { id: true, name: true, projectNumber: true, projectType: true, budget: true } },
        contract: { select: { id: true, contractNumber: true, finalAmount: true } },
      },
    }),
    prisma.project.findMany({
      where: projectWhere,
      select: {
        id: true,
        name: true,
        projectNumber: true,
        projectType: true,
        budget: true,
        baseBudget: true,
        studioAmount: true,
        customerId: true,
        customer: { select: { id: true, fullName: true, phone: true, email: true } },
      },
    }),
  ]);

  // Group payments and projects by customerId
  const customerMap = new Map<string, {
    customer: any;
    projects: Map<string, any>;
    payments: any[];
  }>();

  // First, add all projects
  for (const prj of allProjects) {
    const custId = prj.customerId || 'unassigned';
    if (!customerMap.has(custId)) {
      customerMap.set(custId, {
        customer: prj.customer || { id: custId, fullName: 'Direct Client', phone: '' },
        projects: new Map(),
        payments: [],
      });
    }
    customerMap.get(custId)!.projects.set(prj.id, prj);
  }

  // Then add all payments
  for (const p of allPayments) {
    const custId = p.customerId || 'unassigned';
    if (!customerMap.has(custId)) {
      customerMap.set(custId, {
        customer: p.customer || { id: custId, fullName: 'Direct Client', phone: '' },
        projects: new Map(),
        payments: [],
      });
    }
    const entry = customerMap.get(custId)!;
    entry.payments.push(p);
    if (p.project) {
      entry.projects.set(p.project.id, p.project);
    }
  }

  // Compute aggregations per customer
  const clientRows = Array.from(customerMap.values()).map(entry => {
    const projectList = Array.from(entry.projects.values());
    const projectTotalBudget = projectList.reduce((sum, prj) => {
      const b = Number(prj.budget) || 0;
      if (b > 0) return sum + b;
      return sum + (Number(prj.baseBudget) || Number(prj.studioAmount) || 0);
    }, 0);
    
    // Total received = payments with ADVANCE or DONE (or legacy without status)
    const receivedPayments = entry.payments.filter(p => isReceived(p.paymentStatus));
    const totalPaid = receivedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // If there are projects with budgets, use projectTotalBudget. Else if contracts with finalAmount, use that.
    // If no project budget exists, fallback to totalPaid so pending is 0 unless pending payment records exist.
    const pendingPaymentRecords = entry.payments.filter(p => !isReceived(p.paymentStatus));
    const pendingRecordAmount = pendingPaymentRecords.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const totalAmount = projectTotalBudget > 0 ? projectTotalBudget : (totalPaid + pendingRecordAmount);
    const pendingAmount = Math.max(0, totalAmount - totalPaid);

    let status = 'CLEARED';
    if (pendingAmount > 0 && totalPaid > 0) {
      status = 'PARTIAL';
    } else if (pendingAmount > 0 && totalPaid === 0) {
      status = 'PENDING';
    }

    return {
      customerId: entry.customer.id,
      customer: entry.customer,
      projects: projectList,
      totalAmount,
      totalPaid,
      pendingAmount,
      status,
      paymentsCount: entry.payments.length,
      payments: entry.payments,
    };
  });

  // Apply search filter if present
  let filteredRows = clientRows;
  if (search) {
    const q = search.toLowerCase();
    filteredRows = clientRows.filter(r => 
      r.customer.fullName?.toLowerCase().includes(q) ||
      r.customer.phone?.toLowerCase().includes(q) ||
      r.projects.some(p => p.name?.toLowerCase().includes(q))
    );
  }

  res.json({
    success: true,
    data: filteredRows,
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
      select: { budget: true, baseBudget: true, studioAmount: true, projectType: true },
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

  const totalRevenue = allProjects.reduce((s, p) => {
    const b = Number(p.budget) || 0;
    if (b > 0) return s + b;
    return s + (Number(p.baseBudget) || Number(p.studioAmount) || 0);
  }, 0);

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

  let resolvedProjectId = projectId && projectId !== '' ? projectId : null;
  let resolvedContractId = contractId && contractId !== '' ? contractId : null;

  if (resolvedContractId && !resolvedProjectId) {
    const contract = await prisma.contract.findUnique({ where: { id: resolvedContractId } });
    if (contract?.projectId) {
      resolvedProjectId = contract.projectId;
    }
  }

  let resolvedDomain: BusinessDomain = (domain as BusinessDomain) || 'WEDDING';

  if (resolvedProjectId) {
    const project = await prisma.project.findUnique({ where: { id: resolvedProjectId } });
    if (!project) throw new ApiError(400, 'Project not found');
    resolvedDomain = project.projectType === 'FASHION' ? 'FASHION' : 'WEDDING';

    if (!resolvedContractId) {
      const existingContract = await prisma.contract.findFirst({ where: { projectId: resolvedProjectId } });
      if (existingContract) {
        resolvedContractId = existingContract.id;
      }
    }
  }

  // Determine paymentStatus: if explicitly provided use it, else derive from paymentType for compat
  let resolvedStatus: PaymentStatus | undefined;
  if (paymentStatus && ['ADVANCE', 'PENDING', 'DONE'].includes(paymentStatus)) {
    resolvedStatus = paymentStatus as PaymentStatus;
  } else {
    // Map legacy paymentType to paymentStatus for new payments
    resolvedStatus = 'ADVANCE';
  }

  // Validate against pending amount if customer has projects
  const customerProjects = await prisma.project.findMany({
    where: { customerId },
    select: { id: true, budget: true, baseBudget: true, studioAmount: true },
  });
  if (customerProjects.length > 0) {
    const totalShootAmount = customerProjects.reduce((sum, p) => {
      const b = Number(p.budget) || 0;
      if (b > 0) return sum + b;
      return sum + (Number(p.baseBudget) || Number(p.studioAmount) || 0);
    }, 0);
    const existingPayments = await prisma.payment.findMany({
      where: { customerId },
      select: { amount: true, paymentStatus: true },
    });
    const totalPaid = existingPayments
      .filter((p) => isReceived(p.paymentStatus))
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const remainingPending = Math.max(0, totalShootAmount - totalPaid);
    if (totalShootAmount > 0 && Number(amount) > remainingPending) {
      throw new ApiError(
        400,
        `Cannot receive more than pending amount. Remaining balance is ₹${remainingPending}. You entered ₹${amount}.`
      );
    }
  }

  const payment = await prisma.payment.create({
    data: {
      customerId,
      projectId: resolvedProjectId,
      contractId: resolvedContractId,
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

    const targetCustId = data.customerId || existing.customerId;
    const customerProjects = await prisma.project.findMany({
      where: { customerId: targetCustId },
      select: { id: true, budget: true, baseBudget: true, studioAmount: true },
    });
    if (customerProjects.length > 0) {
      const totalShootAmount = customerProjects.reduce((sum, p) => {
        const b = Number(p.budget) || 0;
        if (b > 0) return sum + b;
        return sum + (Number(p.baseBudget) || Number(p.studioAmount) || 0);
      }, 0);
      const existingPayments = await prisma.payment.findMany({
        where: { customerId: targetCustId, id: { not: id } },
        select: { amount: true, paymentStatus: true },
      });
      const otherPaid = existingPayments
        .filter((p) => isReceived(p.paymentStatus))
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const remainingPending = Math.max(0, totalShootAmount - otherPaid);
      if (totalShootAmount > 0 && Number(data.amount) > remainingPending) {
        throw new ApiError(
          400,
          `Cannot receive more than pending amount. Remaining balance is ₹${remainingPending}. You entered ₹${data.amount}.`
        );
      }
    }
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
