import { prisma } from "../lib/prisma";
import { Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';



// ─── MODELS ──────────────────────────────────────────

export const getModels = asyncHandler(async (req: Request, res: Response) => {
  const { search, status, gender } = req.query as Record<string, string>;
  const where: any = {};
  if (status) where.status = status;
  if (gender) where.gender = gender;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { agency: { contains: search, mode: 'insensitive' } },
      { instagram: { contains: search, mode: 'insensitive' } },
    ];
  }

  const models = await prisma.model.findMany({
    where,
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: models });
});

export const createModel = asyncHandler(async (req: Request, res: Response) => {
  const { name, agency, phone, email, instagram, gender, height, measurements, dayRate, status, notes } = req.body;
  if (!name) throw new ApiError(400, 'Model name is required');

  const model = await prisma.model.create({
    data: {
      name,
      agency,
      phone,
      email,
      instagram,
      gender,
      height,
      measurements,
      dayRate: dayRate ? Number(dayRate) : null,
      status: status || 'AVAILABLE',
      notes,
    },
  });
  res.status(201).json({ success: true, data: model });
});

export const updateModel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = { ...req.body };
  if (data.dayRate !== undefined) data.dayRate = data.dayRate ? Number(data.dayRate) : null;
  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;

  const model = await prisma.model.update({ where: { id }, data });
  res.json({ success: true, data: model });
});

export const deleteModel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.model.delete({ where: { id } });
  res.json({ success: true, message: 'Model deleted successfully' });
});

// ─── GARMENTS ────────────────────────────────────────

export const getGarments = asyncHandler(async (req: Request, res: Response) => {
  const { search, category, status, brand } = req.query as Record<string, string>;
  const where: any = {};
  if (category) where.category = category;
  if (status) where.status = status;
  if (brand) where.brand = brand;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
    ];
  }

  const garments = await prisma.garment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: garments });
});

export const createGarment = asyncHandler(async (req: Request, res: Response) => {
  const { name, code, brand, category, size, color, condition, status, shootReference, notes } = req.body;
  if (!name) throw new ApiError(400, 'Garment name is required');

  const garmentCode = code || `GAR-${String(Date.now()).slice(-6)}`;
  const garment = await prisma.garment.create({
    data: {
      code: garmentCode,
      name,
      brand,
      category,
      size,
      color,
      condition: condition || 'EXCELLENT',
      status: status || 'AVAILABLE',
      shootReference,
      notes,
    },
  });
  res.status(201).json({ success: true, data: garment });
});

export const updateGarment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = { ...req.body };
  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;

  const garment = await prisma.garment.update({ where: { id }, data });
  res.json({ success: true, data: garment });
});

export const deleteGarment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.garment.delete({ where: { id } });
  res.json({ success: true, message: 'Garment deleted successfully' });
});

// ─── STUDIO BOOKINGS ─────────────────────────────────

export const getBookings = asyncHandler(async (req: Request, res: Response) => {
  const { date, studioBay, status } = req.query as Record<string, string>;
  const where: any = {};
  if (date) where.date = new Date(date);
  if (studioBay) where.studioBay = studioBay;
  if (status) where.status = status;

  const bookings = await prisma.studioBooking.findMany({
    where,
    include: {
      project: { select: { id: true, name: true, projectNumber: true, projectType: true } },
      customer: { select: { id: true, fullName: true, phone: true } },
    },
    orderBy: { date: 'asc' },
  });
  res.json({ success: true, data: bookings });
});

export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const { studioBay, bayName, date, startTime, endTime, projectId, customerId, bookedBy, purpose, cost, totalAmount, notes } = req.body;
  const finalBay = studioBay || bayName;
  const finalCost = cost || totalAmount;
  if (!finalBay || !date) throw new ApiError(400, 'Studio bay and date are required');

  const count = await prisma.studioBooking.count();
  const bookingNumber = `BK-${String(count + 1).padStart(4, '0')}`;

  const booking = await prisma.studioBooking.create({
    data: {
      bookingNumber,
      studioBay: finalBay,
      date: new Date(date),
      startTime,
      endTime,
      projectId: projectId || null,
      customerId: customerId || null,
      bookedBy,
      purpose,
      cost: finalCost ? Number(finalCost) : null,
      notes,
    },
    include: { project: true, customer: true },
  });
  res.status(201).json({ success: true, data: booking });
});

export const updateBooking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = { ...req.body };
  if (data.date) data.date = new Date(data.date);
  if (data.cost !== undefined) data.cost = data.cost ? Number(data.cost) : null;
  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;
  delete data.bookingNumber;
  delete data.project;
  delete data.customer;

  const booking = await prisma.studioBooking.update({
    where: { id },
    data,
    include: { project: true, customer: true },
  });
  res.json({ success: true, data: booking });
});

export const deleteBooking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.studioBooking.delete({ where: { id } });
  res.json({ success: true, message: 'Studio booking deleted successfully' });
});
