import { z } from 'zod';

export const createVenueBookingSchema = z.object({
    roomId: z.string().min(1),
    workerProfileId: z.string().min(1),
    title: z.string().min(1),
    purpose: z.string().optional(),
    start: z.coerce.date(),
    end: z.coerce.date(),
    pax: z.number().int().nonnegative().optional(),
    numTables: z.number().int().nonnegative().optional(),
    numChairs: z.number().int().nonnegative().optional(),
    guidelinesAccepted: z.boolean().optional(),
});

export const createRecurringBookingSchema = z.object({
    roomId: z.string().min(1),
    workerProfileId: z.string().min(1),
    title: z.string().min(1),
    purpose: z.string().optional(),
    recurrenceRule: z.string().min(1),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    pax: z.number().int().nonnegative().optional(),
    guidelinesAccepted: z.boolean().optional(),
});

const assistanceConfigItemSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    quantity: z.number().int().positive().optional(),
    isRequired: z.boolean().optional(),
});

export const upsertAssistanceConfigSchema = z.object({
    roomId: z.string().min(1),
    ministryId: z.string().min(1),
    items: z.array(assistanceConfigItemSchema),
    actorId: z.string().min(1),
});

const itemStatusUpdateSchema = z.object({
    itemId: z.string().min(1),
    status: z.enum(['Approved', 'Declined']),
    adjustedQty: z.number().int().nonnegative().optional(),
    adjustedDesc: z.string().optional(),
});

export const respondToAssistanceRequestSchema = z.object({
    requestId: z.string().min(1),
    itemStatuses: z.array(itemStatusUpdateSchema),
    explanation: z.string().optional(),
    responderId: z.string().min(1),
});

export const bulkRespondToRecurringRequestsSchema = z.object({
    recurringBookingId: z.string().min(1),
    ministryId: z.string().min(1),
    itemStatuses: z.array(itemStatusUpdateSchema),
    explanation: z.string().optional(),
    responderId: z.string().min(1),
});

export const commandCenterFiltersSchema = z.object({
    status: z.string().optional(),
    ministryId: z.string().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
});

export const updateVenueAssistanceSettingSchema = z.object({
    slaDays: z.number().int().min(1),
    actorId: z.string().min(1),
});

export type CreateVenueBookingInput = z.infer<typeof createVenueBookingSchema>;
export type CreateRecurringBookingInput = z.infer<typeof createRecurringBookingSchema>;
export type UpsertAssistanceConfigInput = z.infer<typeof upsertAssistanceConfigSchema>;
export type ItemStatusUpdateInput = z.infer<typeof itemStatusUpdateSchema>;
export type RespondToAssistanceRequestInput = z.infer<typeof respondToAssistanceRequestSchema>;
export type BulkRespondToRecurringRequestsInput = z.infer<typeof bulkRespondToRecurringRequestsSchema>;
export type CommandCenterFiltersInput = z.infer<typeof commandCenterFiltersSchema>;
export type UpdateVenueAssistanceSettingInput = z.infer<typeof updateVenueAssistanceSettingSchema>;
