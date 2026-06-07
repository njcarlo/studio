import { z } from 'zod';

export const createMealStubSchema = z.object({
    workerId: z.string().min(1),
    workerName: z.string().min(1),
    status: z.string().min(1),
    stubType: z.string().optional(),
    assignedBy: z.string().optional(),
    assignedByName: z.string().optional(),
    date: z.coerce.date().optional(),
    scheduleId: z.string().optional(),
});

export const updateMealStubSchema = z.object({
    workerId: z.string().optional(),
    workerName: z.string().optional(),
    status: z.string().optional(),
    stubType: z.string().optional(),
    assignedBy: z.string().optional(),
    assignedByName: z.string().optional(),
    date: z.coerce.date().optional(),
    scheduleId: z.string().optional(),
});

export const createAttendanceRecordSchema = z.object({
    workerProfileId: z.string().min(1),
    type: z.string().min(1),
});

export type CreateMealStubInput = z.infer<typeof createMealStubSchema>;
export type UpdateMealStubInput = z.infer<typeof updateMealStubSchema>;
export type CreateAttendanceRecordInput = z.infer<typeof createAttendanceRecordSchema>;
