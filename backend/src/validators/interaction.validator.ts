import { z } from 'zod';

export const createInteractionSchema = z.object({
  type: z.enum(['CALL','EMAIL','WHATSAPP','MEETING','NOTE']),
  subject: z.string().max(200).optional().nullable(),
  notes: z.string().optional().nullable(),
  interactionDate: z.string().optional(),
});

export type CreateInteractionInput = z.infer<typeof createInteractionSchema>;
