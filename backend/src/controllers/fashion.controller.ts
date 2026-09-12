import { prisma } from "../lib/prisma";
import { Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';



// ─── MODELS ──────────────────────────────────────────

export const getModels = asyncHandler(async (req: Request, res: Response) => {
  const { search, gender } = req.query as Record<string, string>;
  const where: any = {};
  if (gender) where.gender = gender;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { agency: { contains: search, mode: 'insensitive' } },
      { instagram: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const models = await prisma.model.findMany({
    where,
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: models });
});

export const createModel = asyncHandler(async (req: Request, res: Response) => {
  const {
    name, agency, phone, email, instagram, gender,
    height, measurements, shootCategories, preferredShootType, notes,
  } = req.body;
  if (!name) throw new ApiError(400, 'Model name is required');

  // shootCategories is stored as a JSON string array
  const categoriesStr = Array.isArray(shootCategories)
    ? JSON.stringify(shootCategories)
    : shootCategories
    ? String(shootCategories)
    : null;

  const model = await prisma.model.create({
    data: {
      name,
      agency: agency || null,
      phone: phone || null,
      email: email || null,
      instagram: instagram || null,
      gender: gender || null,
      height: height || null,
      measurements: measurements || null,
      shootCategories: categoriesStr,
      preferredShootType: preferredShootType || null,
      notes: notes || null,
      // dayRate and status kept in DB for backward compat, defaulted to null/AVAILABLE
    },
  });
  res.status(201).json({ success: true, data: model });
});

export const updateModel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data: any = { ...req.body };

  if (data.shootCategories !== undefined) {
    data.shootCategories = Array.isArray(data.shootCategories)
      ? JSON.stringify(data.shootCategories)
      : data.shootCategories
      ? String(data.shootCategories)
      : null;
  }

  // Remove read-only fields
  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;
  delete data.projectAssignments;
  // Keep dayRate removal: if not sent, don't update it
  if (data.dayRate !== undefined) data.dayRate = data.dayRate ? Number(data.dayRate) : null;

  const model = await prisma.model.update({ where: { id }, data });
  res.json({ success: true, data: model });
});

export const deleteModel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  // Remove from project assignments first
  await prisma.fashionProjectModel.deleteMany({ where: { modelId: id } });
  await prisma.model.delete({ where: { id } });
  res.json({ success: true, message: 'Model deleted successfully' });
});

// ─── GARMENTS (preserved for backward compat) ────────

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

// ─── STUDIO BOOKINGS (preserved for backward compat) ─

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

// ─── FASHION GARMENT REQUIREMENTS ────────────────────

export const getGarmentRequirements = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.query as Record<string, string>;
  if (!projectId) throw new ApiError(400, 'projectId is required');

  const requirements = await prisma.fashionGarmentRequirement.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ success: true, data: requirements });
});

export const createGarmentRequirement = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, clothType, dressName, quantity } = req.body;
  if (!projectId || !clothType || !dressName) {
    throw new ApiError(400, 'projectId, clothType, and dressName are required');
  }
  const qty = parseInt(String(quantity), 10);
  if (isNaN(qty) || qty < 0) {
    throw new ApiError(400, 'Quantity must be a non-negative integer');
  }

  const requirement = await prisma.fashionGarmentRequirement.create({
    data: { projectId, clothType, dressName, quantity: qty },
  });
  res.status(201).json({ success: true, data: requirement });
});

export const updateGarmentRequirement = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data: any = { ...req.body };
  if (data.quantity !== undefined) {
    const qty = parseInt(String(data.quantity), 10);
    if (isNaN(qty) || qty < 0) throw new ApiError(400, 'Quantity must be a non-negative integer');
    data.quantity = qty;
  }
  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;
  delete data.projectId;

  const requirement = await prisma.fashionGarmentRequirement.update({ where: { id }, data });
  res.json({ success: true, data: requirement });
});

export const deleteGarmentRequirement = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.fashionGarmentRequirement.delete({ where: { id } });
  res.json({ success: true, message: 'Garment requirement deleted' });
});

// Bulk upsert garment requirements for a project (replaces all rows)
export const bulkUpsertGarmentRequirements = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { requirements } = req.body; // array of { clothType, dressName, quantity }

  if (!Array.isArray(requirements)) throw new ApiError(400, 'requirements must be an array');

  // Delete existing and recreate
  await prisma.$transaction([
    prisma.fashionGarmentRequirement.deleteMany({ where: { projectId } }),
    prisma.fashionGarmentRequirement.createMany({
      data: requirements.map((r: any) => ({
        projectId,
        clothType: r.clothType,
        dressName: r.dressName,
        quantity: parseInt(String(r.quantity), 10) || 0,
      })),
    }),
  ]);

  const updated = await prisma.fashionGarmentRequirement.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ success: true, data: updated });
});

// ─── FASHION PROJECT MODEL ASSIGNMENTS ───────────────

export const getProjectModels = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.query as Record<string, string>;
  if (!projectId) throw new ApiError(400, 'projectId is required');

  const assignments = await prisma.fashionProjectModel.findMany({
    where: { projectId },
    include: {
      model: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          gender: true,
          shootCategories: true,
          preferredShootType: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ success: true, data: assignments });
});

export const createProjectModel = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, modelId, clientId, modelRate, notes } = req.body;
  if (!projectId || !modelId) throw new ApiError(400, 'projectId and modelId are required');

  const rate = modelRate !== undefined ? Number(modelRate) : 0;
  if (isNaN(rate) || rate < 0) throw new ApiError(400, 'Model rate must be >= 0');

  // Check unique constraint — update if already exists
  const existing = await prisma.fashionProjectModel.findFirst({
    where: { projectId, modelId },
  });

  if (existing) {
    const updated = await prisma.fashionProjectModel.update({
      where: { id: existing.id },
      data: { modelRate: rate, clientId: clientId || null, notes: notes || null },
      include: { model: { select: { id: true, name: true, phone: true, gender: true, shootCategories: true } } },
    });
    return res.json({ success: true, data: updated });
  }

  const assignment = await prisma.fashionProjectModel.create({
    data: {
      projectId,
      modelId,
      clientId: clientId || null,
      modelRate: rate,
      notes: notes || null,
    },
    include: { model: { select: { id: true, name: true, phone: true, gender: true, shootCategories: true } } },
  });
  res.status(201).json({ success: true, data: assignment });
});

export const updateProjectModel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data: any = { ...req.body };
  if (data.modelRate !== undefined) {
    const rate = Number(data.modelRate);
    if (isNaN(rate) || rate < 0) throw new ApiError(400, 'Model rate must be >= 0');
    data.modelRate = rate;
  }
  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;
  delete data.projectId;
  delete data.modelId;
  delete data.model;

  const assignment = await prisma.fashionProjectModel.update({
    where: { id },
    data,
    include: { model: { select: { id: true, name: true, phone: true, gender: true, shootCategories: true } } },
  });
  res.json({ success: true, data: assignment });
});

export const deleteProjectModel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.fashionProjectModel.delete({ where: { id } });
  res.json({ success: true, message: 'Model removed from project' });
});
