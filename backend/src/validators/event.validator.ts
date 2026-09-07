import { z } from 'zod';

export const createEventSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  eventName: z.string().min(1, 'Event name is required').max(200),
  eventType: z.enum(['WEDDING','PRE_WEDDING','ENGAGEMENT','RECEPTION','HALDI','MEHENDI','SANGEET','BIRTHDAY','CORPORATE','FASHION','OTHER']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().nullable(),
  venue: z.string().max(250).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  guestCount: z.number().int().min(0).optional().nullable(),
  status: z.enum(['UPCOMING','IN_PROGRESS','COMPLETED','CANCELLED']).optional(),
  specialRequirements: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  subEvents: z.array(z.object({
    name: z.string().min(1).max(150),
    date: z.string().optional().nullable(),
    startTime: z.string().optional().nullable(),
    endTime: z.string().optional().nullable(),
    venue: z.string().max(250).optional().nullable(),
    notes: z.string().optional().nullable(),
  })).optional(),
});

export const updateEventSchema = createEventSchema.partial();

export const createAssignmentSchema = z.object({
  employeeId: z.string().uuid(),
  role: z.string().max(100).optional().nullable(),
  callTime: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
