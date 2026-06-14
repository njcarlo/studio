import { z } from 'zod';

export const slotTypeSchema = z.enum(['Standard', 'Main', 'Mid', 'Open']);
export type SlotType = z.infer<typeof slotTypeSchema>;

export const createServiceScheduleSchema = z.object({
  date: z.coerce.date(),
  title: z.string().optional(),
  notes: z.string().optional(),
  createdBy: z.string().min(1),
});

export const updateServiceScheduleSchema = z.object({
  title: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
});

const templateRoleSchema = z.object({
  roleName: z.string().min(1),
  count: z.number().int().positive(),
  notes: z.string().optional(),
  order: z.number().int().optional(),
});

export const createServiceTemplateSchema = z.object({
  ministryId: z.string().min(1),
  name: z.string().min(1),
  isDefault: z.boolean().optional(),
  createdBy: z.string().min(1),
  roles: z.array(templateRoleSchema),
});

export const updateServiceTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
  roles: z.array(templateRoleSchema).optional(),
});

export const createWorshipSlotSchema = z.object({
  scheduleId: z.string().min(1),
  ministryId: z.string().nullable().optional(),
  slotName: z.string().min(1),
  notes: z.string().optional(),
  order: z.number().int().optional(),
});

export const updateWorshipSlotSchema = z.object({
  slotName: z.string().min(1).optional(),
  notes: z.string().optional(),
  order: z.number().int().optional(),
});

export type CreateServiceScheduleInput = z.infer<typeof createServiceScheduleSchema>;
export type UpdateServiceScheduleInput = z.infer<typeof updateServiceScheduleSchema>;
export type CreateServiceTemplateInput = z.infer<typeof createServiceTemplateSchema>;
export type UpdateServiceTemplateInput = z.infer<typeof updateServiceTemplateSchema>;
export type CreateWorshipSlotInput = z.infer<typeof createWorshipSlotSchema>;
export type UpdateWorshipSlotInput = z.infer<typeof updateWorshipSlotSchema>;
