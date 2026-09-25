import { prisma } from "../lib/prisma";
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { generateContractNumber } from '../utils/generateCode';

export const getContracts = asyncHandler(async (req: Request, res: Response) => {
  const { status, search, domain, projectId, customerId, page = '1', limit = '50' } = req.query as any;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where: any = {};

  if (status && status !== 'ALL') where.status = status;
  if (projectId) where.projectId = projectId;
  if (customerId) where.customerId = customerId;

  if (domain && (domain === 'WEDDING' || domain === 'FASHION')) {
    where.OR = [
      { project: { projectType: domain } },
      { customer: { clientType: domain } },
    ];
  }

  if (search) {
    const searchFilter = [
      { contractNumber: { contains: search, mode: 'insensitive' } },
      { customer: { fullName: { contains: search, mode: 'insensitive' } } },
      { project: { name: { contains: search, mode: 'insensitive' } } },
      { package: { name: { contains: search, mode: 'insensitive' } } },
    ];
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: searchFilter }];
      delete where.OR;
    } else {
      where.OR = searchFilter;
    }
  }

  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, fullName: true, phone: true, clientType: true } },
        event: { select: { id: true, eventName: true, eventType: true } },
        project: { select: { id: true, name: true, projectType: true, projectNumber: true, budget: true } },
        package: { select: { id: true, name: true, basePrice: true } },
        payments: { select: { id: true, amount: true, paymentStatus: true } },
        items: true,
      },
    }),
    prisma.contract.count({ where }),
  ]);

  const data = contracts.map((c) => {
    // Only count received payments (ADVANCE, DONE, or legacy null)
    const receivedPayments = c.payments.filter((p) => !p.paymentStatus || p.paymentStatus === 'ADVANCE' || p.paymentStatus === 'DONE');
    const totalPaid = receivedPayments.reduce((s, p) => s + Number(p.amount), 0);
    const finalAmount = Number(c.finalAmount);
    return {
      ...c,
      totalPaid,
      remainingAmount: Math.max(0, finalAmount - totalPaid),
    };
  });

  res.json({
    success: true,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

export const getContract = asyncHandler(async (req: Request, res: Response) => {
  const contract = await prisma.contract.findUnique({
    where: { id: req.params.id },
    include: {
      customer: true,
      event: true,
      project: true,
      package: { include: { services: true } },
      items: true,
      payments: { orderBy: { paymentDate: 'desc' } },
      invoices: { orderBy: { createdAt: 'desc' } },
      deliverables: true,
    },
  });
  if (!contract) throw ApiError.notFound('Contract not found');
  const receivedPayments = contract.payments.filter((p) => !p.paymentStatus || p.paymentStatus === 'ADVANCE' || p.paymentStatus === 'DONE');
  const totalPaid = receivedPayments.reduce((s, p) => s + Number(p.amount), 0);
  const finalAmount = Number(contract.finalAmount);
  res.json({
    success: true,
    data: {
      ...contract,
      totalPaid,
      remainingAmount: Math.max(0, finalAmount - totalPaid),
    },
  });
});

export const createContract = asyncHandler(async (req: Request, res: Response) => {
  const { items, ...contractData } = req.body;
  const contractNumber = await generateContractNumber();

  const subtotal = Number(contractData.subtotal) || 0;
  const discount = Number(contractData.discount) || 0;
  const tax = Number(contractData.tax) || 0;
  const finalAmount = Math.max(0, subtotal - discount + tax);

  // Sanitize relation foreign keys
  const customerId = contractData.customerId;
  const projectId = contractData.projectId && contractData.projectId !== '' ? contractData.projectId : null;
  const eventId = contractData.eventId && contractData.eventId !== '' ? contractData.eventId : null;
  const packageId = contractData.packageId && contractData.packageId !== '' ? contractData.packageId : null;

  const contract = await prisma.$transaction(async (tx) => {
    const c = await tx.contract.create({
      data: {
        contractNumber,
        customerId,
        projectId,
        eventId,
        packageId,
        contractDate: contractData.contractDate ? new Date(contractData.contractDate) : new Date(),
        subtotal,
        discount,
        tax,
        finalAmount,
        status: contractData.status || 'DRAFT',
        termsAndConditions: contractData.termsAndConditions || null,
        items: items && items.length > 0 ? {
          create: items.map((item: any) => ({
            serviceName: item.serviceName,
            description: item.description || null,
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || 0,
            totalPrice: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
          })),
        } : undefined,
      },
      include: {
        customer: true,
        project: true,
        package: true,
        event: true,
        items: true,
      },
    });

    // If linked to a project, sync project's budget
    if (projectId && finalAmount > 0) {
      await tx.project.update({
        where: { id: projectId },
        data: { budget: finalAmount },
      });
    }

    return c;
  });

  res.status(201).json({ success: true, data: contract });
});

export const updateContract = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.contract.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!existing) throw ApiError.notFound('Contract not found');

  const { items, ...contractData } = req.body;

  const subtotal = contractData.subtotal !== undefined ? Number(contractData.subtotal) : Number(existing.subtotal);
  const discount = contractData.discount !== undefined ? Number(contractData.discount) : Number(existing.discount);
  const tax = contractData.tax !== undefined ? Number(contractData.tax) : Number(existing.tax);
  const finalAmount = Math.max(0, subtotal - discount + tax);

  contractData.subtotal = subtotal;
  contractData.discount = discount;
  contractData.tax = tax;
  contractData.finalAmount = finalAmount;

  if (contractData.contractDate) contractData.contractDate = new Date(contractData.contractDate);
  if (contractData.projectId === '') contractData.projectId = null;
  if (contractData.eventId === '') contractData.eventId = null;
  if (contractData.packageId === '') contractData.packageId = null;

  const contract = await prisma.$transaction(async (tx) => {
    if (items && Array.isArray(items)) {
      await tx.contractItem.deleteMany({ where: { contractId: req.params.id } });
      await tx.contractItem.createMany({
        data: items.map((item: any) => ({
          contractId: req.params.id,
          serviceName: item.serviceName,
          description: item.description || null,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          totalPrice: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
        })),
      });
    }

    const updated = await tx.contract.update({
      where: { id: req.params.id },
      data: contractData,
      include: {
        customer: true,
        project: true,
        package: true,
        event: true,
        items: true,
        payments: true,
      },
    });

    // Sync project budget if linked
    const linkedProjId = updated.projectId || existing.projectId;
    if (linkedProjId && finalAmount > 0) {
      await tx.project.update({
        where: { id: linkedProjId },
        data: { budget: finalAmount },
      });
    }

    return updated;
  });

  res.json({ success: true, data: contract });
});

export const updateContractStatus = asyncHandler(async (req: Request, res: Response) => {
  const data: any = { status: req.body.status };
  if (req.body.status === 'SIGNED') data.signedAt = new Date();
  const contract = await prisma.contract.update({
    where: { id: req.params.id },
    data,
    include: { customer: true, project: true, package: true },
  });
  res.json({ success: true, data: contract });
});

export const deleteContract = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.contract.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Contract not found');

  await prisma.$transaction([
    // 1. Delete contract items
    prisma.contractItem.deleteMany({ where: { contractId: id } }),
    // 2. Unlink deliverables and invoices from this contract
    prisma.deliverable.updateMany({ where: { contractId: id }, data: { contractId: null } }),
    prisma.invoice.deleteMany({ where: { contractId: id } }),
    // 3. Unlink payments
    prisma.payment.updateMany({ where: { contractId: id }, data: { contractId: null } }),
    // 4. Delete contract
    prisma.contract.delete({ where: { id } }),
  ]);

  res.json({ success: true, message: 'Contract deleted successfully' });
});

