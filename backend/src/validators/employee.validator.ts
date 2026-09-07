import { z } from 'zod';

export const createEmployeeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().max(180).optional().nullable().or(z.literal('')),
  role: z.enum(['PHOTOGRAPHER','VIDEOGRAPHER','DRONE_OPERATOR','EDITOR','ALBUM_DESIGNER','MANAGER','SALES_EXECUTIVE','ACCOUNTANT']),
  specialization: z.string().max(150).optional().nullable(),
  availability: z.string().max(100).optional().nullable(),
  joiningDate: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
