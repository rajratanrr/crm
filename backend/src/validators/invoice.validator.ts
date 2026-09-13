import { z } from 'zod';

export const createInvoiceSchema = z.object({
  contractId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().optional().nullable(),
  subtotal: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  pdfUrl: z.string().optional().nullable(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

