import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const prisma = new PrismaClient();

export const getPackages = asyncHandler(async (req: Request, res: Response) => {
  const packages = await prisma.package.findMany({
    orderBy: { basePrice: 'asc' },
    include: { services: true, _count: { select: { contracts: true } } },
  });
  res.json({ success: true, data: packages });
});

export const getPackage = asyncHandler(async (req: Request, res: Response) => {
  const pkg = await prisma.package.findUnique({
    where: { id: req.params.id },
    include: { services: true },
  });
  if (!pkg) throw ApiError.notFound('Package not found');
  res.json({ success: true, data: pkg });
});

export const createPackage = asyncHandler(async (req: Request, res: Response) => {
  const { services, ...pkgData } = req.body;
  const pkg = await prisma.package.create({
    data: { ...pkgData, services: services ? { create: services } : undefined },
    include: { services: true },
  });
  res.status(201).json({ success: true, data: pkg });
});

export const updatePackage = asyncHandler(async (req: Request, res: Response) => {
  const { services, ...pkgData } = req.body;
  if (services) {
    await prisma.packageService.deleteMany({ where: { packageId: req.params.id } });
  }
  const pkg = await prisma.package.update({
    where: { id: req.params.id },
    data: {
      ...pkgData,
      services: services ? { create: services } : undefined,
    },
    include: { services: true },
  });
  res.json({ success: true, data: pkg });
});

export const deletePackage = asyncHandler(async (req: Request, res: Response) => {
  await prisma.package.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ success: true, message: 'Package deactivated' });
});
