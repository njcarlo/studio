import { z } from 'zod';

export const createWorkerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  roleId: z.string().optional().nullable(),
  status: z.string().optional(),
  majorMinistryId: z.string().optional().nullable(),
  minorMinistryId: z.string().optional().nullable(),
  employmentType: z.string().optional(),
  workerId: z.string().optional(),
  avatarUrl: z.string().url().optional().nullable().or(z.literal('')),
  qrToken: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  birthday: z.string().optional().nullable().or(z.date().optional().nullable()),
  gender: z.string().optional().nullable(),
  legacyPasswordHash: z.string().optional().nullable(),
  legacyMigratedAt: z.string().optional().nullable().or(z.date().optional().nullable()),
  passwordChangeRequired: z.boolean().optional(),
  firstLogin: z.boolean().optional(),
});

export const updateWorkerSchema = createWorkerSchema.partial();

export type CreateWorkerInput = z.infer<typeof createWorkerSchema>;
export type UpdateWorkerInput = z.infer<typeof updateWorkerSchema>;
