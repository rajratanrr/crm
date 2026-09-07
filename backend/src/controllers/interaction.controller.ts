import { prisma } from "../lib/prisma";
import { Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';



export const getInteractions = asyncHandler(async (req: Request, res: Response) => {
  const interactions = await prisma.interaction.findMany({
    where: { customerId: req.params.customerId },
    orderBy: { interactionDate: 'desc' },
    include: { user: { select: { id: true, name: true } } },
  });
  res.json({ success: true, data: interactions });
});

export const createInteraction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const interaction = await prisma.interaction.create({
    data: {
      ...req.body,
      customerId: req.params.customerId,
      userId: req.user?.id,
      interactionDate: req.body.interactionDate ? new Date(req.body.interactionDate) : new Date(),
    },
    include: { user: { select: { id: true, name: true } } },
  });
  res.status(201).json({ success: true, data: interaction });
});

export const deleteInteraction = asyncHandler(async (req: Request, res: Response) => {
  await prisma.interaction.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Interaction deleted' });
});
