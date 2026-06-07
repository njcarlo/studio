"use server";

import * as venueAssistanceService from '@/services/venue-assistance';
import {
    createVenueBookingSchema,
    createRecurringBookingSchema,
    upsertAssistanceConfigSchema,
    respondToAssistanceRequestSchema,
    bulkRespondToRecurringRequestsSchema,
    commandCenterFiltersSchema,
    updateVenueAssistanceSettingSchema,
} from '@/lib/schemas/venue-assistance.schemas';

// Re-export types/helpers consumed directly by the UI
export type { ItemStatus, RequestStatus } from '@/actions/venue-assistance-status';
export type {
    CreateVenueBookingInput as CreateVenueBookingData,
    CreateRecurringBookingInput as CreateRecurringBookingData,
    UpsertAssistanceConfigInput,
    ItemStatusUpdateInput as ItemStatusUpdate,
    CommandCenterFiltersInput as CommandCenterFilters,
} from '@/lib/schemas/venue-assistance.schemas';
export interface AssistanceConfigItemInput {
    name: string;
    description?: string;
    quantity?: number;
    isRequired?: boolean;
}

// ---------------------------------------------------------------------------
// Booking actions
// ---------------------------------------------------------------------------

/** Create a one-time venue booking and generate assistance requests. */
export async function createVenueBooking(data: {
    roomId: string;
    workerProfileId: string;
    title: string;
    purpose?: string;
    start: Date;
    end: Date;
    pax?: number;
    numTables?: number;
    numChairs?: number;
    guidelinesAccepted?: boolean;
}) {
    return venueAssistanceService.createVenueBooking(createVenueBookingSchema.parse(data));
}

/** Create a recurring booking, expand occurrences, and generate assistance requests for each. */
export async function createRecurringBooking(data: {
    roomId: string;
    workerProfileId: string;
    title: string;
    purpose?: string;
    recurrenceRule: string;
    startTime: string;
    endTime: string;
    startDate: Date;
    endDate?: Date;
    pax?: number;
    guidelinesAccepted?: boolean;
}) {
    return venueAssistanceService.createRecurringBooking(createRecurringBookingSchema.parse(data));
}

/** Cancel a single venue booking and all its pending assistance requests. */
export async function cancelVenueBooking(bookingId: string, actorId: string) {
    return venueAssistanceService.cancelVenueBooking(bookingId, actorId);
}

/** Cancel a single occurrence of a recurring booking (same as cancelVenueBooking). */
export async function cancelRecurringOccurrence(bookingId: string, actorId: string) {
    return venueAssistanceService.cancelRecurringOccurrence(bookingId, actorId);
}

/** Cancel an entire recurring series and all pending assistance requests across all occurrences. */
export async function cancelRecurringSeries(recurringBookingId: string, actorId: string) {
    return venueAssistanceService.cancelRecurringSeries(recurringBookingId, actorId);
}

// ---------------------------------------------------------------------------
// Assistance Configuration actions
// ---------------------------------------------------------------------------

/** Create or update an AssistanceConfiguration for a room+ministry pair. */
export async function upsertAssistanceConfig(
    roomId: string,
    ministryId: string,
    items: AssistanceConfigItemInput[],
    actorId: string,
) {
    const parsed = upsertAssistanceConfigSchema.parse({ roomId, ministryId, items, actorId });
    return venueAssistanceService.upsertAssistanceConfig(parsed);
}

/** Delete an AssistanceConfiguration (cascade deletes items). Does NOT affect existing requests. */
export async function deleteAssistanceConfig(configId: string, actorId: string) {
    return venueAssistanceService.deleteAssistanceConfig(configId, actorId);
}

/** Get all AssistanceConfigurations for a room, including items. */
export async function getAssistanceConfigsForRoom(roomId: string) {
    return venueAssistanceService.getAssistanceConfigsForRoom(roomId);
}

/** Get all AssistanceConfigurations for a ministry, including items. */
export async function getAssistanceConfigsForMinistry(ministryId: string) {
    return venueAssistanceService.getAssistanceConfigsForMinistry(ministryId);
}

// ---------------------------------------------------------------------------
// Assistance Request query actions
// ---------------------------------------------------------------------------

/** Get all AssistanceRequests for a booking, including items and audit logs. */
export async function getAssistanceRequestsForBooking(bookingId: string) {
    return venueAssistanceService.getAssistanceRequestsForBooking(bookingId);
}

/** Get all AssistanceRequests for a ministry (ministry head's inbox). */
export async function getAssistanceRequestsForMinistry(ministryId: string) {
    return venueAssistanceService.getAssistanceRequestsForMinistry(ministryId);
}

// ---------------------------------------------------------------------------
// Assistance Response actions
// ---------------------------------------------------------------------------

/**
 * Respond to an assistance request: update item statuses, derive request status,
 * set respondedAt/respondedBy, notify requester and manage_venue_assistance users,
 * write audit log.
 */
export async function respondToAssistanceRequest(
    requestId: string,
    itemStatuses: { itemId: string; status: 'Approved' | 'Declined'; adjustedQty?: number; adjustedDesc?: string }[],
    explanation: string | undefined,
    responderId: string,
) {
    const parsed = respondToAssistanceRequestSchema.parse({ requestId, itemStatuses, explanation, responderId });
    return venueAssistanceService.respondToAssistanceRequest(
        parsed.requestId,
        parsed.itemStatuses,
        parsed.explanation,
        parsed.responderId,
    );
}

/**
 * Apply the same response to all Pending AssistanceRequests for a
 * (recurringBookingId, ministryId) pair.
 */
export async function bulkRespondToRecurringRequests(
    recurringBookingId: string,
    ministryId: string,
    itemStatuses: { itemId: string; status: 'Approved' | 'Declined'; adjustedQty?: number; adjustedDesc?: string }[],
    explanation: string | undefined,
    responderId: string,
) {
    const parsed = bulkRespondToRecurringRequestsSchema.parse({
        recurringBookingId, ministryId, itemStatuses, explanation, responderId,
    });
    return venueAssistanceService.bulkRespondToRecurringRequests(
        parsed.recurringBookingId,
        parsed.ministryId,
        parsed.itemStatuses,
        parsed.explanation,
        parsed.responderId,
    );
}

// ---------------------------------------------------------------------------
// Check-in and fulfillment actions
// ---------------------------------------------------------------------------

/**
 * Called when a booking QR code is scanned on the room display.
 * Updates Approved and Partial requests → In_Progress.
 * Does NOT touch Declined or Cancelled requests.
 */
export async function handleBookingCheckIn(bookingId: string) {
    return venueAssistanceService.handleBookingCheckIn(bookingId);
}

/**
 * Called by cron job: find bookings where end < now, update their
 * In_Progress requests → Fulfilled.
 */
export async function fulfillCompletedBookings() {
    return venueAssistanceService.fulfillCompletedBookings();
}

// ---------------------------------------------------------------------------
// Admin / Command Center actions
// ---------------------------------------------------------------------------

/**
 * Get all assistance requests for the command center, with optional filtering.
 */
export async function getCommandCenterData(filters: {
    status?: string;
    ministryId?: string;
    dateFrom?: Date;
    dateTo?: Date;
} = {}) {
    return venueAssistanceService.getCommandCenterData(commandCenterFiltersSchema.parse(filters));
}

/** Get all audit log entries for a specific assistance request. */
export async function getAuditLogsForRequest(requestId: string) {
    return venueAssistanceService.getAuditLogsForRequest(requestId);
}

/** Update the global SLA setting (requires manage_venue_assistance permission). */
export async function updateVenueAssistanceSetting(slaDays: number, actorId: string) {
    const parsed = updateVenueAssistanceSettingSchema.parse({ slaDays, actorId });
    return venueAssistanceService.updateVenueAssistanceSetting(parsed.slaDays, parsed.actorId);
}

// ---------------------------------------------------------------------------
// Booking query actions
// ---------------------------------------------------------------------------

/** Get all venue bookings with room and assistance request summaries. */
export async function getVenueBookings() {
    return venueAssistanceService.getVenueBookings();
}

/** Get all venue bookings for a specific worker profile. */
export async function getMyVenueBookings(workerProfileId: string) {
    return venueAssistanceService.getMyVenueBookings(workerProfileId);
}

/** Get a single venue booking with full assistance request details. */
export async function getVenueBooking(bookingId: string) {
    return venueAssistanceService.getVenueBooking(bookingId);
}

/** Get all AssistanceConfigurations with room and ministry info, including items. */
export async function getAllAssistanceConfigs() {
    return venueAssistanceService.getAllAssistanceConfigs();
}
