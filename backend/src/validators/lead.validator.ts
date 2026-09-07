import { z } from 'zod';

export const createLeadSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  eventType: z.enum(['WEDDING','PRE_WEDDING','ENGAGEMENT','RECEPTION','HALDI','MEHENDI','SANGEET','BIRTHDAY','CORPORATE','FASHION','OTHER']).optional().nullable(),
  eventDate: z.string().optional().nullable(),
  estimatedBudget: z.number().min(0).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  status: z.enum(['NEW','CONTACTED','MEETING_SCHEDULED','QUOTATION_SENT','NEGOTIATION','WON','LOST']).optional(),
  assignedTo: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const updateLeadStatusSchema = z.object({
  status: z.enum(['NEW','CONTACTED','MEETING_SCHEDULED','QUOTATION_SENT','NEGOTIATION','WON','LOST']),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
