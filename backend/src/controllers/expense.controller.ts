import { prisma } from "../lib/prisma";
import { Request, Response } from 'express';
import { PrismaClient, BusinessDomain } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';



export const getExpenses = asyncHandler(async (req: Request, res: Response) => {
  const { domain, category, search } = req.query as Record<string, string>;
  const where: any = {};
  if (domain && Object.values(BusinessDomain).includes(domain as BusinessDomain)) {
    where.domain = domain as BusinessDomain;
  }
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { expenseNumber: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
      { vendor: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { expenseDate: 'desc' },
  });

  const totalAmount = expenses.reduce((acc, e) => acc + Number(e.amount), 0);

  res.json({
    success: true,
    data: expenses,
    summary: { totalAmount },
  });
});

export const createExpense = asyncHandler(async (req: Request, res: Response) => {
  const { category, domain = 'GENERAL', amount, expenseDate, paymentMethod = 'BANK_TRANSFER', vendor, description, receiptUrl } = req.body;
  if (!category || !amount || !expenseDate) {
    throw new ApiError(400, 'Category, amount, and expense date are required');
  }

  const count = await prisma.expense.count();
  const expenseNumber = `EXP-${String(count + 1).padStart(4, '0')}`;

  const expense = await prisma.expense.create({
    data: {
      expenseNumber,
      category,
      domain: domain as BusinessDomain,
      amount: Number(amount),
      expenseDate: new Date(expenseDate),
      paymentMethod,
      vendor,
      description,
      receiptUrl,
    },
  });
  res.status(201).json({ success: true, data: expense });
});

export const updateExpense = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = { ...req.body };
  if (data.expenseDate) data.expenseDate = new Date(data.expenseDate);
  if (data.amount !== undefined) data.amount = Number(data.amount);
  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;
  delete data.expenseNumber;

  const expense = await prisma.expense.update({ where: { id }, data });
  res.json({ success: true, data: expense });
});

export const deleteExpense = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.expense.delete({ where: { id } });
  res.json({ success: true, message: 'Expense deleted successfully' });
});
