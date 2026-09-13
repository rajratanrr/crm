import { z } from 'zod';

export const createCustomerSchema = z.object({
  fullName: z.string().min(1, 'Name is required').max(150),
  phone: z.string().min(1, 'Phone is required').max(20),
  alternatePhone: z.string().max(20).optional().nullable(),
  email: z.string().email('Invalid email').max(180).optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  pincode: z.string().max(10).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  clientType: z.enum(['WEDDING', 'FASHION']).optional().default('WEDDING'),
  companyName: z.string().max(150).optional().nullable(),
  notes: z.string().optional().nullable(),
  clientModels: z.array(z.object({
    modelId: z.string(),
    defaultRate: z.union([z.number(), z.string()]).optional().default(0),
    notes: z.string().optional().nullable(),
  })).optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const bulkImportCustomerSchema = z.object({
  customers: z.array(createCustomerSchema).min(1, 'At least one customer is required'),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type BulkImportCustomerInput = z.infer<typeof bulkImportCustomerSchema>;
