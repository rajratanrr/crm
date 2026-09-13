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
    select: {
      id: true,
      name: true,
      agency: true,
      phone: true,
      email: true,
      instagram: true,
      gender: true,
      height: true,
      measurements: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  res.json({ success: true, data: models });
});

export const getModel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const model = await prisma.model.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      agency: true,
      phone: true,
      email: true,
      instagram: true,
      gender: true,
      height: true,
      measurements: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      projectAssignments: {
        include: {
          project: {
            select: {
              id: true,
              name: true,
              projectNumber: true,
              shootDate: true,
              status: true,
              customer: { select: { id: true, fullName: true, companyName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!model) throw new ApiError(404, 'Model not found');
  res.json({ success: true, data: model });
});

export const createModel = asyncHandler(async (req: Request, res: Response) => {
  const { name, agency, phone, email, instagram, gender, height, measurements, notes } = req.body;
  if (!name) throw new ApiError(400, 'Model name is required');

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
      notes: notes || null,
    },
    select: {
      id: true, name: true, agency: true, phone: true, email: true,
      instagram: true, gender: true, height: true, measurements: true,
      notes: true, createdAt: true, updatedAt: true,
    },
  });
  res.status(201).json({ success: true, data: model });
});

export const updateModel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  // Only allow safe fields — explicitly exclude fields removed from UI
  const { name, agency, phone, email, instagram, gender, height, measurements, notes } = req.body;

  const data: any = {};
  if (name !== undefined) data.name = name;
  if (agency !== undefined) data.agency = agency || null;
  if (phone !== undefined) data.phone = phone || null;
  if (email !== undefined) data.email = email || null;
  if (instagram !== undefined) data.instagram = instagram || null;
  if (gender !== undefined) data.gender = gender || null;
  if (height !== undefined) data.height = height || null;
  if (measurements !== undefined) data.measurements = measurements || null;
  if (notes !== undefined) data.notes = notes || null;

  const model = await prisma.model.update({
    where: { id },
    data,
    select: {
      id: true, name: true, agency: true, phone: true, email: true,
      instagram: true, gender: true, height: true, measurements: true,
      notes: true, createdAt: true, updatedAt: true,
    },
  });
  res.json({ success: true, data: model });
});

export const deleteModel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  // Remove project assignments first (model itself is not deleted from client/project views)
  await prisma.fashionProjectModel.deleteMany({ where: { modelId: id } });
  await prisma.model.delete({ where: { id } });
  res.json({ success: true, message: 'Model deleted successfully' });
});

// ─── FASHION GARMENT REQUIREMENTS ────────────────────

export const getGarmentRequirements = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, clientId } = req.query as Record<string, string>;

  const where: any = {};
  if (projectId) where.projectId = projectId;
  if (clientId) where.clientId = clientId;
  if (!projectId && !clientId) throw new ApiError(400, 'projectId or clientId is required');

  const requirements = await prisma.fashionGarmentRequirement.findMany({
    where,
    include: {
      project: { select: { id: true, name: true, shootDate: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ success: true, data: requirements });
});

export const createGarmentRequirement = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, clientId, clothType, dressName, quantity } = req.body;
  if (!projectId || !clothType || !dressName) {
    throw new ApiError(400, 'projectId, clothType, and dressName are required');
  }
  const qty = parseInt(String(quantity), 10);
  if (isNaN(qty) || qty < 0) {
    throw new ApiError(400, 'Quantity must be a non-negative integer');
  }

  // Auto-resolve clientId from project if not provided
  let resolvedClientId = clientId || null;
  if (!resolvedClientId) {
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { customerId: true } });
    if (project) resolvedClientId = project.customerId;
  }

  const requirement = await prisma.fashionGarmentRequirement.create({
    data: { projectId, clientId: resolvedClientId, clothType, dressName, quantity: qty },
    include: { project: { select: { id: true, name: true, shootDate: true } } },
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
  delete data.project;
  delete data.client;

  const requirement = await prisma.fashionGarmentRequirement.update({
    where: { id },
    data,
    include: { project: { select: { id: true, name: true, shootDate: true } } },
  });
  res.json({ success: true, data: requirement });
});

export const deleteGarmentRequirement = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.fashionGarmentRequirement.delete({ where: { id } });
  res.json({ success: true, message: 'Garment requirement deleted' });
});

// Bulk upsert garment requirements for a project
export const bulkUpsertGarmentRequirements = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { requirements } = req.body;

  if (!Array.isArray(requirements)) throw new ApiError(400, 'requirements must be an array');

  // Auto-resolve clientId from project
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { customerId: true } });
  const resolvedClientId = project?.customerId || null;

  await prisma.$transaction([
    prisma.fashionGarmentRequirement.deleteMany({ where: { projectId } }),
    prisma.fashionGarmentRequirement.createMany({
      data: requirements.map((r: any) => ({
        projectId,
        clientId: resolvedClientId,
        clothType: r.clothType,
        dressName: r.dressName,
        quantity: parseInt(String(r.quantity), 10) || 0,
      })),
    }),
  ]);

  const updated = await prisma.fashionGarmentRequirement.findMany({
    where: { projectId },
    include: { project: { select: { id: true, name: true, shootDate: true } } },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ success: true, data: updated });
});

// ─── FASHION PROJECT MODEL ASSIGNMENTS ───────────────

export const getProjectModels = asyncHandler(async (req: Request, res: Response) => {
  // Supports both query param and route param
  const projectId = (req.params.projectId as string) || (req.query.projectId as string);
  if (!projectId) throw new ApiError(400, 'projectId is required');

  const assignments = await prisma.fashionProjectModel.findMany({
    where: { projectId },
    include: {
      model: {
        select: {
          id: true, name: true, phone: true, email: true, gender: true,
          agency: true, instagram: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ success: true, data: assignments });
});

export const createProjectModel = asyncHandler(async (req: Request, res: Response) => {
  // Supports both route param and body for projectId
  const projectId = (req.params.projectId as string) || req.body.projectId;
  const { modelId, clientId, modelRate, notes } = req.body;
  if (!projectId || !modelId) throw new ApiError(400, 'projectId and modelId are required');

  const rate = modelRate !== undefined ? Number(modelRate) : 0;
  if (isNaN(rate) || rate < 0) throw new ApiError(400, 'Model rate must be >= 0');

  // Auto-resolve clientId from project if not provided
  let resolvedClientId = clientId || null;
  if (!resolvedClientId) {
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { customerId: true } });
    if (project) resolvedClientId = project.customerId;
  }

  // Update if already exists (upsert pattern)
  const existing = await prisma.fashionProjectModel.findFirst({ where: { projectId, modelId } });

  if (existing) {
    const updated = await prisma.fashionProjectModel.update({
      where: { id: existing.id },
      data: { modelRate: rate, clientId: resolvedClientId, notes: notes || null },
      include: { model: { select: { id: true, name: true, phone: true, gender: true, agency: true } } },
    });
    return res.json({ success: true, data: updated });
  }

  const assignment = await prisma.fashionProjectModel.create({
    data: {
      projectId,
      modelId,
      clientId: resolvedClientId,
      modelRate: rate,
      notes: notes || null,
    },
    include: { model: { select: { id: true, name: true, phone: true, gender: true, agency: true } } },
  });
  res.status(201).json({ success: true, data: assignment });
});

export const updateProjectModel = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id || req.params.assignmentId;
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
  delete data.client;

  const assignment = await prisma.fashionProjectModel.update({
    where: { id },
    data,
    include: { model: { select: { id: true, name: true, phone: true, gender: true, agency: true } } },
  });
  res.json({ success: true, data: assignment });
});

export const deleteProjectModel = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id || req.params.assignmentId;
  await prisma.fashionProjectModel.delete({ where: { id } });
  res.json({ success: true, message: 'Model removed from project' });
});

// ─── CLIENT FINANCIAL SUMMARY ─────────────────────────

export const getClientFinancialSummary = asyncHandler(async (req: Request, res: Response) => {
  const clientId = req.params.clientId || req.params.id;

  const [projects, payments, modelAssignments, garments] = await Promise.all([
    prisma.project.findMany({
      where: { customerId: clientId, projectType: 'FASHION' },
      select: { id: true, name: true, budget: true, baseBudget: true, shootDate: true, status: true, projectNumber: true },
    }),
    prisma.payment.findMany({
      where: { customerId: clientId, domain: 'FASHION' },
      select: { id: true, amount: true, paymentStatus: true, paymentDate: true, paymentMethod: true, projectId: true, notes: true },
    }),
    prisma.fashionProjectModel.findMany({
      where: { clientId },
      include: {
        model: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, shootDate: true } },
      },
    }),
    prisma.fashionGarmentRequirement.findMany({
      where: { clientId },
      include: { project: { select: { id: true, name: true, shootDate: true } } },
    }),
  ]);

  const projectIds = new Set(projects.map(p => p.id));
  const projectPayments = payments.filter(pay => pay.projectId && projectIds.has(pay.projectId));

  const totalContractValue = projects.reduce((s, p) => s + Number(p.budget), 0);
  const totalReceived = projectPayments
    .filter(p => !p.paymentStatus || p.paymentStatus === 'ADVANCE' || p.paymentStatus === 'DONE')
    .reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = Math.max(0, totalContractValue - totalReceived);
  const totalGarments = garments.reduce((s, g) => s + g.quantity, 0);

  res.json({
    success: true,
    data: {
      clientId,
      projects,
      payments: projectPayments,
      modelAssignments,
      garments,
      summary: {
        totalContractValue,
        totalReceived,
        totalPending,
        projectCount: projects.length,
        totalGarments,
      },
    },
  });
});

// ─── LEGACY (kept for backward compat, not surfaced in UI) ──

export const getGarments = asyncHandler(async (req: Request, res: Response) => {
  const garments = await prisma.garment.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data: garments });
});

export const createGarment = asyncHandler(async (req: Request, res: Response) => {
  const { name, code, brand, category, size, color, condition, status, shootReference, notes } = req.body;
  if (!name) throw new ApiError(400, 'Garment name is required');
  const garmentCode = code || `GAR-${String(Date.now()).slice(-6)}`;
  const garment = await prisma.garment.create({
    data: { code: garmentCode, name, brand, category, size, color, condition: condition || 'EXCELLENT', status: status || 'AVAILABLE', shootReference, notes },
  });
  res.status(201).json({ success: true, data: garment });
});

export const updateGarment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = { ...req.body };
  delete data.id; delete data.createdAt; delete data.updatedAt;
  const garment = await prisma.garment.update({ where: { id }, data });
  res.json({ success: true, data: garment });
});

export const deleteGarment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.garment.delete({ where: { id } });
  res.json({ success: true, message: 'Garment deleted' });
});

export const getBookings = asyncHandler(async (req: Request, res: Response) => {
  const bookings = await prisma.studioBooking.findMany({
    include: { project: true, customer: true },
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
    data: { bookingNumber, studioBay: finalBay, date: new Date(date), startTime, endTime, projectId: projectId || null, customerId: customerId || null, bookedBy, purpose, cost: finalCost ? Number(finalCost) : null, notes },
    include: { project: true, customer: true },
  });
  res.status(201).json({ success: true, data: booking });
});

export const updateBooking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data: any = { ...req.body };
  if (data.date) data.date = new Date(data.date);
  if (data.cost !== undefined) data.cost = data.cost ? Number(data.cost) : null;
  delete data.id; delete data.createdAt; delete data.updatedAt;
  delete data.bookingNumber; delete data.project; delete data.customer;
  const booking = await prisma.studioBooking.update({ where: { id }, data, include: { project: true, customer: true } });
  res.json({ success: true, data: booking });
});

export const deleteBooking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.studioBooking.delete({ where: { id } });
  res.json({ success: true, message: 'Studio booking deleted' });
});
