import { z } from 'zod';

export const createContractSchema = z.object({
  customerId: z.string().uuid('Valid customer ID is required'),
  projectId: z.string().uuid().optional().nullable().or(z.literal('')),
  eventId: z.string().uuid().optional().nullable().or(z.literal('')),
  packageId: z.string().uuid().optional().nullable().or(z.literal('')),
  contractDate: z.string().min(1, 'Contract date is required'),
  subtotal: z.number().min(0, 'Subtotal cannot be negative'),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  status: z.enum(['DRAFT', 'SENT', 'SIGNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional().default('DRAFT'),
  termsAndConditions: z.string().optional().nullable(),
  items: z.array(z.object({
    serviceName: z.string().min(1).max(150),
    description: z.string().optional().nullable(),
    quantity: z.number().int().min(1).default(1),
    unitPrice: z.number().min(0),
  })).optional(),
});

export const updateContractSchema = createContractSchema.partial();

export const updateContractStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'SIGNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;

