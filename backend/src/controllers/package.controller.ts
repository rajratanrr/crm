import { prisma } from "../lib/prisma";
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

export const getPackages = asyncHandler(async (req: Request, res: Response) => {
  const { domain, search } = req.query as any;
  const where: any = { isActive: true };

  if (domain && (domain === 'WEDDING' || domain === 'FASHION')) {
    where.domain = domain;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const packages = await prisma.package.findMany({
    where,
    orderBy: { basePrice: 'asc' },
    include: {
      services: { orderBy: { serviceName: 'asc' } },
      _count: { select: { contracts: true } },
    },
  });

  res.json({ success: true, data: packages });
});

export const getPackage = asyncHandler(async (req: Request, res: Response) => {
  const pkg = await prisma.package.findUnique({
    where: { id: req.params.id },
    include: { services: true, _count: { select: { contracts: true } } },
  });
  if (!pkg) throw ApiError.notFound('Package not found');
  res.json({ success: true, data: pkg });
});

export const createPackage = asyncHandler(async (req: Request, res: Response) => {
  const { services, ...pkgData } = req.body;
  const pkg = await prisma.package.create({
    data: {
      ...pkgData,
      basePrice: Number(pkgData.basePrice) || 0,
      domain: pkgData.domain || 'WEDDING',
      services: services && services.length > 0 ? {
        create: services.map((s: any) => ({
          serviceName: s.serviceName,
          description: s.description || null,
          quantity: Number(s.quantity) || 1,
        })),
      } : undefined,
    },
    include: { services: true },
  });
  res.status(201).json({ success: true, data: pkg });
});

export const updatePackage = asyncHandler(async (req: Request, res: Response) => {
  const { services, ...pkgData } = req.body;
  if (pkgData.basePrice !== undefined) {
    pkgData.basePrice = Number(pkgData.basePrice) || 0;
  }

  const pkg = await prisma.$transaction(async (tx) => {
    if (services && Array.isArray(services)) {
      await tx.packageService.deleteMany({ where: { packageId: req.params.id } });
      await tx.packageService.createMany({
        data: services.map((s: any) => ({
          packageId: req.params.id,
          serviceName: s.serviceName,
          description: s.description || null,
          quantity: Number(s.quantity) || 1,
        })),
      });
    }

    return tx.package.update({
      where: { id: req.params.id },
      data: pkgData,
      include: { services: true, _count: { select: { contracts: true } } },
    });
  });

  res.json({ success: true, data: pkg });
});

export const deletePackage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.package.findUnique({
    where: { id },
    include: { _count: { select: { contracts: true } } },
  });
  if (!existing) throw ApiError.notFound('Package not found');

  if (existing._count.contracts > 0) {
    // If contracts use this package, soft delete so historical records stay intact
    await prisma.package.update({ where: { id }, data: { isActive: false } });
    res.json({ success: true, message: 'Package deactivated (archived) because it is linked to contracts' });
  } else {
    // Hard delete services and package if no contracts link to it
    await prisma.packageService.deleteMany({ where: { packageId: id } });
    await prisma.package.delete({ where: { id } });
    res.json({ success: true, message: 'Package deleted successfully' });
  }
});

