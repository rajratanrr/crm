import { z } from 'zod';

export const createInvoiceSchema = z.object({
  contractId: z.string().uuid(),
  customerId: z.string().uuid(),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().optional().nullable(),
  subtotal: z.number().min(0),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  status: z.enum(['DRAFT','SENT','PAID','OVERDUE','CANCELLED']).optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(['DRAFT','SENT','PAID','OVERDUE','CANCELLED']),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
