import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  date: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  videoUrl: z.string().optional(),
  createdBy: z.string().min(1),
});

export const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  date: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  videoUrl: z.string().nullable().optional(),
  scheduleId: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export const addEventRoomSchema = z.object({
  eventId: z.string().min(1),
  roomId: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

export const updateEventRoomSchema = z.object({
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

export const upsertEventAssignmentSchema = z.object({
  id: z.string().optional(),
  eventId: z.string().min(1),
  ministryId: z.string().min(1),
  roleName: z.string().min(1),
  workerId: z.string().nullable().optional(),
  workerName: z.string().nullable().optional(),
  notes: z.string().optional(),
  order: z.number().int().optional(),
});

export const addEventEquipmentSchema = z.object({
  eventId: z.string().min(1),
  itemId: z.string().min(1),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

export const updateEventEquipmentSchema = z.object({
  quantity: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type AddEventRoomInput = z.infer<typeof addEventRoomSchema>;
export type UpdateEventRoomInput = z.infer<typeof updateEventRoomSchema>;
export type UpsertEventAssignmentInput = z.infer<typeof upsertEventAssignmentSchema>;
export type AddEventEquipmentInput = z.infer<typeof addEventEquipmentSchema>;
export type UpdateEventEquipmentInput = z.infer<typeof updateEventEquipmentSchema>;
