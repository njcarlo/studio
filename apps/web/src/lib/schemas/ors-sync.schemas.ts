import { z } from 'zod';

export const orsWorkerSchema = z.object({
  id: z.number(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  mobile: z.string().nullable().optional(),
  ministry_id: z.number().nullable().optional(),
  sec_ministry_id: z.number().nullable().optional(),
  status: z.string().nullable().optional(),
  worker_type: z.string().nullable().optional(),
  qrdata: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  birthdate: z.string().nullable().optional(),
  start_month: z.string().nullable().optional(),
  start_year: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  biometrics_id: z.number().nullable().optional(),
  password: z.string().nullable().optional(),
}).passthrough();

export const importOrsNewWorkersOptionsSchema = z.object({
  defaultRoleId: z.enum(['viewer', 'worker']), // Whitelist allowed default roles
  ministryIdMap: z.record(z.string(), z.string()),
  migratePasswordHash: z.boolean(),
});

export const syncUpdatedWorkerItemSchema = z.union([
  orsWorkerSchema,
  z.object({
    worker: orsWorkerSchema,
    fields: z.array(z.string()).optional(),
  })
]);
