import { z } from 'zod';

export const createDeliverableSchema = z.object({
  eventId: z.string().uuid(),
  contractId: z.string().uuid().optional().nullable(),
  type: z.enum(['RAW_PHOTOS','EDITED_PHOTOS','HIGHLIGHT_VIDEO','FULL_WEDDING_VIDEO','CINEMATIC_FILM','TEASER','REEL','ALBUM']),
  quantity: z.number().int().min(1).default(1),
  dueDate: z.string().optional().nullable(),
  status: z.enum(['PENDING','IN_PRODUCTION','READY','DELIVERED']).optional(),
  deliveryDate: z.string().optional().nullable(),
  deliveryLink: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateDeliverableSchema = createDeliverableSchema.partial();

export const updateDeliverableStatusSchema = z.object({
  status: z.enum(['PENDING','IN_PRODUCTION','READY','DELIVERED']),
  deliveryDate: z.string().optional().nullable(),
  deliveryLink: z.string().optional().nullable(),
});

export type CreateDeliverableInput = z.infer<typeof createDeliverableSchema>;
