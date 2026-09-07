import { z } from 'zod';

export const createPackageSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  description: z.string().optional().nullable(),
  basePrice: z.number().min(0, 'Price cannot be negative'),
  duration: z.string().max(100).optional().nullable(),
  isActive: z.boolean().optional(),
  services: z.array(z.object({
    serviceName: z.string().min(1).max(150),
    description: z.string().optional().nullable(),
    quantity: z.number().int().min(1).default(1),
  })).optional(),
});

export const updatePackageSchema = createPackageSchema.partial();

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
