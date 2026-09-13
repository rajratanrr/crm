import { prisma } from "../lib/prisma";
import { Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { generateContractNumber } from '../utils/generateCode';

// Helper: only ADVANCE/DONE count as received money
function isReceived(paymentStatus: string | null | undefined): boolean {
  if (!paymentStatus) return true; // legacy null = treat as received
  return paymentStatus === 'ADVANCE' || paymentStatus === 'DONE';
}

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const { type, status, customerId, search } = req.query as Record<string, string>;

  const where: any = {};
  if (type && (type === 'WEDDING' || type === 'FASHION')) {
    where.projectType = type;
  }
  if (status) {
    where.status = status;
  }
  if (customerId) {
    where.customerId = customerId;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { projectNumber: { contains: search, mode: 'insensitive' } },
      { customer: { fullName: { contains: search, mode: 'insensitive' } } },
      { brand: { contains: search, mode: 'insensitive' } },
    ];
  }

  const projects = await prisma.project.findMany({
    where,
    include: {
      customer: { select: { id: true, fullName: true, phone: true, email: true, clientType: true } },
      payments: { select: { id: true, amount: true, paymentDate: true, paymentMethod: true, paymentStatus: true } },
      contracts: { select: { id: true, contractNumber: true, finalAmount: true, status: true } },
      tasks: { select: { id: true, status: true } },
      deliverables: { select: { id: true, status: true, type: true } },
      garmentRequirements: true,
      modelAssignments: {
        include: {
          model: { select: { id: true, name: true, phone: true, gender: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = projects.map((p) => {
    const receivedPayments = p.payments.filter((pay) => isReceived(pay.paymentStatus));
    const totalReceived = receivedPayments.reduce((acc, pay) => acc + Number(pay.amount), 0);
    const contractAmount = Number(p.budget); // budget column = contractAmount
    const baseBudgetNum = Number(p.baseBudget);
    const totalModelCost = p.modelAssignments.reduce((s, ma) => s + Number(ma.modelRate), 0);
    const totalBudget = baseBudgetNum + totalModelCost;
    const pendingAmount = Math.max(0, contractAmount - totalReceived);
    return {
      ...p,
      contractAmount,
      baseBudget: baseBudgetNum,
      totalModelCost,
      totalBudget,
      totalReceived,
      totalPaid: totalReceived, // alias for backward compat
      remainingAmount: pendingAmount,
      pendingAmount,
    };
  });

  res.json({ success: true, data: formatted });
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      events: { include: { subEvents: true, assignments: { include: { employee: true } } } },
      contracts: { include: { items: true } },
      payments: { orderBy: { paymentDate: 'desc' } },
      tasks: { include: { assignedEmployee: true } },
      deliverables: true,
      studioBookings: true,
      garmentRequirements: { orderBy: { createdAt: 'asc' } },
      modelAssignments: {
        include: {
          model: { select: { id: true, name: true, phone: true, email: true, gender: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!project) throw new ApiError(404, 'Project not found');

  const receivedPayments = project.payments.filter((pay: any) => isReceived(pay.paymentStatus));
  const totalReceived = receivedPayments.reduce((acc: number, pay: any) => acc + Number(pay.amount), 0);
  const contractAmount = Number(project.budget);
  const baseBudgetNum = Number(project.baseBudget);
  const totalModelCost = (project.modelAssignments as any[]).reduce((s, ma) => s + Number(ma.modelRate), 0);
  const totalBudget = baseBudgetNum + totalModelCost;
  const pendingAmount = Math.max(0, contractAmount - totalReceived);

  res.json({
    success: true,
    data: {
      ...project,
      contractAmount,
      baseBudget: baseBudgetNum,
      totalModelCost,
      totalBudget,
      totalReceived,
      totalPaid: totalReceived,
      remainingAmount: pendingAmount,
      pendingAmount,
    },
  });
});

export const getProjectFinancialSummary = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      payments: { select: { amount: true, paymentStatus: true } },
      modelAssignments: { select: { modelRate: true } },
    },
  });

  if (!project) throw new ApiError(404, 'Project not found');

  const totalReceived = project.payments
    .filter((p) => isReceived(p.paymentStatus))
    .reduce((s, p) => s + Number(p.amount), 0);

  const contractAmount = Number(project.budget);
  const baseBudgetNum = Number(project.baseBudget);
  const totalModelCost = project.modelAssignments.reduce((s, ma) => s + Number(ma.modelRate), 0);
  const totalBudget = baseBudgetNum + totalModelCost;
  const pendingAmount = Math.max(0, contractAmount - totalReceived);

  res.json({
    success: true,
    data: {
      projectId: id,
      baseBudget: baseBudgetNum,
      totalModelCost,
      totalBudget,
      contractAmount,
      totalReceived,
      pendingAmount,
    },
  });
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    projectType,
    status = 'PLANNING',
    customerId,
    budget = 0,      // contractAmount (client-facing)
    baseBudget = 0,  // internal production budget
    startDate,
    endDate,
    weddingDate,
    venue,
    city,
    functions,
    brand,
    shootType,
    studioLocation,
    shootDate,
    driveLink,
    creativeTeam,
    modelsInfo,
    garmentsInfo,
    notes,
  } = req.body;

  if (!name || !customerId) {
    throw new ApiError(400, 'Project name and customer are required');
  }

  // For FASHION projects, startDate is not user-facing — use shootDate or today
  const isFashion = projectType === 'FASHION';
  let resolvedStartDate: Date;
  if (startDate) {
    resolvedStartDate = new Date(startDate);
  } else if (isFashion && shootDate) {
    resolvedStartDate = new Date(shootDate);
  } else {
    resolvedStartDate = new Date();
  }

  const prefix = isFashion ? 'FSH' : 'WED';
  const count = await prisma.project.count({ where: { projectType: isFashion ? 'FASHION' : 'WEDDING' } });
  const projectNumber = `${prefix}-${String(count + 1).padStart(4, '0')}`;

  const project = await prisma.project.create({
    data: {
      projectNumber,
      name,
      projectType: isFashion ? 'FASHION' : 'WEDDING',
      status,
      customerId,
      budget: Number(budget) || 0,
      baseBudget: Number(baseBudget) || 0,
      startDate: resolvedStartDate,
      endDate: endDate ? new Date(endDate) : null,
      weddingDate: weddingDate ? new Date(weddingDate) : null,
      venue,
      city,
      functions,
      brand,
      shootType,
      studioLocation,
      shootDate: shootDate ? new Date(shootDate) : null,
      driveLink: driveLink || null,
      creativeTeam,
      modelsInfo,
      garmentsInfo,
      notes,
    },
    include: { customer: true },
  });

  // Auto-create contract if contractAmount (budget) > 0
  const budgetNum = Number(budget) || 0;
  if (budgetNum > 0) {
    try {
      const contractNumber = await generateContractNumber();
      await prisma.contract.create({
        data: {
          contractNumber,
          customerId,
          projectId: project.id,
          contractDate: resolvedStartDate,
          subtotal: budgetNum,
          finalAmount: budgetNum,
          status: "SIGNED",
          termsAndConditions: `Service agreement for ${name} (${project.projectType})`,
        },
      });
    } catch (contractErr) {
      console.error("Failed to auto-create contract for project:", contractErr);
    }
  }

  // Handle model assignments for FASHION projects
  if (isFashion && customerId) {
    try {
      let assignmentsToCreate: any[] = [];
      if (Array.isArray(req.body.modelAssignments) && req.body.modelAssignments.length > 0) {
        assignmentsToCreate = req.body.modelAssignments.map((ma: any) => ({
          projectId: project.id,
          modelId: ma.modelId,
          clientId: customerId,
          modelRate: Number(ma.modelRate) || 0,
          notes: ma.notes || null,
        }));
      } else {
        // Auto-inherit models & rates configured on client
        const clientDefaults = await prisma.fashionClientModel.findMany({
          where: { clientId: customerId },
        });
        if (clientDefaults.length > 0) {
          assignmentsToCreate = clientDefaults.map((cd) => ({
            projectId: project.id,
            modelId: cd.modelId,
            clientId: customerId,
            modelRate: Number(cd.defaultRate) || 0,
            notes: cd.notes || null,
          }));
        }
      }

      if (assignmentsToCreate.length > 0) {
        await prisma.fashionProjectModel.createMany({
          data: assignmentsToCreate,
        });
      }
    } catch (modelErr) {
      console.error("Failed to assign models to project:", modelErr);
    }
  }

  const fullProject = await prisma.project.findUnique({
    where: { id: project.id },
    include: {
      customer: true,
      modelAssignments: {
        include: {
          model: { select: { id: true, name: true, phone: true, gender: true } },
        },
      },
    },
  });

  res.status(201).json({ success: true, data: fullProject || project });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data: any = { ...req.body };

  if (data.startDate) data.startDate = new Date(data.startDate);
  if (data.endDate) data.endDate = new Date(data.endDate);
  if (data.weddingDate) data.weddingDate = new Date(data.weddingDate);
  if (data.shootDate) data.shootDate = new Date(data.shootDate);
  if (data.driveLink !== undefined) data.driveLink = data.driveLink || null;

  // Handle contractAmount alias → budget column
  if (data.contractAmount !== undefined) {
    data.budget = Number(data.contractAmount);
    delete data.contractAmount;
  }
  if (data.budget !== undefined) {
    const newBudget = Number(data.budget);
    data.budget = newBudget;
    try {
      const existingContract = await prisma.contract.findFirst({ where: { projectId: id } });
      if (existingContract) {
        await prisma.contract.update({
          where: { id: existingContract.id },
          data: { subtotal: newBudget, finalAmount: newBudget },
        });
      } else if (newBudget > 0) {
        const prj = await prisma.project.findUnique({ where: { id } });
        if (prj) {
          const contractNumber = await generateContractNumber();
          await prisma.contract.create({
            data: {
              contractNumber,
              customerId: prj.customerId,
              projectId: prj.id,
              contractDate: prj.startDate ?? new Date(),
              subtotal: newBudget,
              finalAmount: newBudget,
              status: 'SIGNED',
              termsAndConditions: `Service agreement for ${prj.name} (${prj.projectType})`,
            },
          });
        }
      }
    } catch (syncErr) {
      console.error("Failed to sync contract on project budget update:", syncErr);
    }
  }

  if (data.baseBudget !== undefined) {
    data.baseBudget = Number(data.baseBudget) || 0;
  }

  // Strip read-only / relation fields
  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;
  delete data.projectNumber;
  delete data.customer;
  delete data.payments;
  delete data.contracts;
  delete data.events;
  delete data.tasks;
  delete data.deliverables;
  delete data.studioBookings;
  delete data.garmentRequirements;
  delete data.modelAssignments;
  // Calculated fields — not stored
  delete data.totalModelCost;
  delete data.totalBudget;
  delete data.totalReceived;
  delete data.totalPaid;
  delete data.pendingAmount;
  delete data.remainingAmount;
  delete data.contractAmount;

  const incomingModelAssignments = req.body.modelAssignments;

  const project = await prisma.project.update({
    where: { id },
    data,
    include: { customer: true },
  });

  if (Array.isArray(incomingModelAssignments)) {
    try {
      const resolvedClientId = project.customerId || null;
      await prisma.$transaction([
        prisma.fashionProjectModel.deleteMany({ where: { projectId: id } }),
        prisma.fashionProjectModel.createMany({
          data: incomingModelAssignments.map((ma: any) => ({
            projectId: id,
            modelId: ma.modelId,
            clientId: resolvedClientId,
            modelRate: Number(ma.modelRate) || 0,
            notes: ma.notes || null,
          })),
        }),
      ]);
    } catch (assignErr) {
      console.error("Failed to sync project models:", assignErr);
    }
  }

  const full = await prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      modelAssignments: {
        include: { model: { select: { id: true, name: true, phone: true, gender: true } } },
      },
    },
  });

  res.json({ success: true, data: full || project });
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Project not found");

  // 1. Delete contracts linked to this project
  const contracts = await prisma.contract.findMany({ where: { projectId: id }, select: { id: true } });
  const contractIds = contracts.map(c => c.id);
  if (contractIds.length > 0) {
    await prisma.contractItem.deleteMany({ where: { contractId: { in: contractIds } } });
    await prisma.contract.deleteMany({ where: { projectId: id } });
  }

  // 2. Delete payments linked to this project
  await prisma.payment.deleteMany({ where: { projectId: id } });

  // 3. Delete tasks and deliverables linked to this project
  await prisma.deliverable.deleteMany({ where: { projectId: id } });
  await prisma.task.deleteMany({ where: { projectId: id } });

  // 4. Delete studio bookings linked to this project
  await prisma.studioBooking.deleteMany({ where: { projectId: id } });

  // 5. Delete fashion-specific sub-records
  await prisma.fashionGarmentRequirement.deleteMany({ where: { projectId: id } });
  await prisma.fashionProjectModel.deleteMany({ where: { projectId: id } });

  // 6. Unlink events
  await prisma.event.updateMany({ where: { projectId: id }, data: { projectId: null } });

  // 7. Delete project
  await prisma.project.delete({ where: { id } });
  res.json({ success: true, message: "Project deleted successfully" });
});
