import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
  customerId: z.string().uuid().optional().nullable(),
  eventId: z.string().uuid().optional().nullable(),
  priority: z.enum(['LOW','MEDIUM','HIGH','URGENT']).optional(),
  status: z.enum(['TODO','IN_PROGRESS','COMPLETED','OVERDUE']).optional(),
  dueDate: z.string().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const updateTaskStatusSchema = z.object({
  status: z.enum(['TODO','IN_PROGRESS','COMPLETED','OVERDUE']),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
