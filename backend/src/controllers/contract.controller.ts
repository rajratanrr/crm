import { prisma } from "../lib/prisma";
import { Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { generateContractNumber } from '../utils/generateCode';



export const getContracts = asyncHandler(async (req: Request, res: Response) => {
  const { status, search, page = '1', limit = '20' } = req.query as any;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { contractNumber: { contains: search, mode: 'insensitive' } },
      { customer: { fullName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
      where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        event: { select: { id: true, eventName: true, eventType: true } },
        project: { select: { id: true, name: true, projectType: true, projectNumber: true } },
        package: { select: { id: true, name: true } },
        payments: { select: { amount: true } },
      },
    }),
    prisma.contract.count({ where }),
  ]);

  const data = contracts.map((c) => {
    const totalPaid = c.payments.reduce((s, p) => s + Number(p.amount), 0);
    return { ...c, totalPaid, remainingAmount: Number(c.finalAmount) - totalPaid };
  });

  res.json({ success: true, data, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
});

export const getContract = asyncHandler(async (req: Request, res: Response) => {
  const contract = await prisma.contract.findUnique({
    where: { id: req.params.id },
    include: {
      customer: true, event: true, package: { include: { services: true } },
      items: true, payments: { orderBy: { paymentDate: 'desc' } },
      invoices: { orderBy: { createdAt: 'desc' } },
      deliverables: true,
    },
  });
  if (!contract) throw ApiError.notFound('Contract not found');
  const totalPaid = contract.payments.reduce((s, p) => s + Number(p.amount), 0);
  res.json({ success: true, data: { ...contract, totalPaid, remainingAmount: Number(contract.finalAmount) - totalPaid } });
});

export const createContract = asyncHandler(async (req: Request, res: Response) => {
  const { items, ...contractData } = req.body;
  const contractNumber = await generateContractNumber();
  const finalAmount = contractData.subtotal - (contractData.discount || 0) + (contractData.tax || 0);

  const contract = await prisma.$transaction(async (tx) => {
    const c = await tx.contract.create({
      data: {
        ...contractData,
        contractNumber,
        contractDate: new Date(contractData.contractDate),
        finalAmount,
        items: items ? {
          create: items.map((item: any) => ({
            serviceName: item.serviceName,
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice,
            totalPrice: (item.quantity || 1) * item.unitPrice,
          })),
        } : undefined,
      },
      include: { customer: true, event: true, items: true },
    });
    return c;
  });

  res.status(201).json({ success: true, data: contract });
});

export const updateContract = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.contract.findUnique({ where: { id: req.params.id } });
  if (!existing) throw ApiError.notFound('Contract not found');

  const { items, ...contractData } = req.body;
  if (contractData.subtotal !== undefined) {
    contractData.finalAmount = (contractData.subtotal ?? Number(existing.subtotal))
      - (contractData.discount ?? Number(existing.discount))
      + (contractData.tax ?? Number(existing.tax));
  }
  if (contractData.contractDate) contractData.contractDate = new Date(contractData.contractDate);

  const contract = await prisma.contract.update({
    where: { id: req.params.id },
    data: contractData,
    include: { customer: true, event: true, items: true },
  });
  res.json({ success: true, data: contract });
});

export const updateContractStatus = asyncHandler(async (req: Request, res: Response) => {
  const data: any = { status: req.body.status };
  if (req.body.status === 'SIGNED') data.signedAt = new Date();
  const contract = await prisma.contract.update({ where: { id: req.params.id }, data });
  res.json({ success: true, data: contract });
});
