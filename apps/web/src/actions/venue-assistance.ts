"use server";

import { prisma } from '@studio/database/prisma';
import * as venueAssistanceService from '@/services/venue-assistance';
import { requirePermission } from '@/lib/auth/require-permission';
import { resolveCallerCtx, type CallerCtx } from '@/lib/auth/with-permission';
import { PERMISSIONS } from '@/lib/permissions/registry';
import {
    createVenueBookingSchema,
    createRecurringBookingSchema,
    upsertAssistanceConfigSchema,
    respondToAssistanceRequestSchema,
    bulkRespondToRecurringRequestsSchema,
    commandCenterFiltersSchema,
    updateVenueAssistanceSettingSchema,
} from '@/lib/schemas/venue-assistance.schemas';

// Re-export types/helpers consumed directly by the UI.
// NOTE: `export type {...} from '...'` re-export syntax is rejected by Next's
// "use server" transform ("Only async functions are allowed to be exported in
// a 'use server' file") — import as types and re-export local aliases instead.
import type { ItemStatus as _ItemStatus, RequestStatus as _RequestStatus } from '@/actions/venue-assistance-status';
import type {
    CreateVenueBookingInput as _CreateVenueBookingInput,
    CreateRecurringBookingInput as _CreateRecurringBookingInput,
    UpsertAssistanceConfigInput as _UpsertAssistanceConfigInput,
    ItemStatusUpdateInput as _ItemStatusUpdateInput,
    CommandCenterFiltersInput as _CommandCenterFiltersInput,
} from '@/lib/schemas/venue-assistance.schemas';

export type ItemStatus = _ItemStatus;
export type RequestStatus = _RequestStatus;
export type CreateVenueBookingData = _CreateVenueBookingInput;
export type CreateRecurringBookingData = _CreateRecurringBookingInput;
export type UpsertAssistanceConfigInput = _UpsertAssistanceConfigInput;
export type ItemStatusUpdate = _ItemStatusUpdateInput;
export type CommandCenterFilters = _CommandCenterFiltersInput;
export type AssistanceConfigItemInput = {
    name: string;
    description?: string;
    quantity?: number;
    isRequired?: boolean;
};

// ---------------------------------------------------------------------------
// Authorization helpers
//
// Every mutating action derives the caller's identity from the session
// (resolveCallerCtx) instead of trusting an actorId/responderId/workerProfileId
// passed by the client. See docs/SERVER_ACTION_AUTH_LAYER_PLAN.md → "Venue
// Assistance — Residual Authorization Findings".
// ---------------------------------------------------------------------------

async function requireCaller(): Promise<CallerCtx> {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');
    return ctx;
}

/**
 * True if the caller holds a permission, checking both the new `module:action`
 * key and its legacy flat-string equivalent (resolveCallerCtx surfaces both).
 */
function callerHas(ctx: CallerCtx, key: string, legacyKey?: string): boolean {
    return ctx.isSuperAdmin || ctx.permissions.has(key) || (!!legacyKey && ctx.permissions.has(legacyKey));
}

/** Can act on ANY ministry's venue assistance. */
function canManageAllAssistance(ctx: CallerCtx): boolean {
    return callerHas(ctx, PERMISSIONS.venue_assistance.manage, 'manage_venue_assistance');
}

/**
 * Authorize responding to / configuring a specific ministry's assistance:
 * manage-all, or manage-own-ministry while being that ministry's head.
 */
async function assertMinistryAssistanceAuth(ctx: CallerCtx, ministryId: string): Promise<void> {
    if (canManageAllAssistance(ctx)) return;
    if (callerHas(ctx, PERMISSIONS.venue_assistance.manage_own_ministry, 'manage_own_ministry_assistance')) {
        const ministry = await prisma.ministry.findUnique({
            where: { id: ministryId },
            select: { headId: true },
        });
        if (ministry?.headId === ctx.workerId) return;
        throw new Error('You can only manage venue assistance for your own ministry.');
    }
    throw new Error('You do not have permission to manage venue assistance.');
}

/** Authorize cancelling a booking: the booking's owner, or a venue manager. */
function assertCanCancelBooking(ctx: CallerCtx, ownerId: string | null | undefined): void {
    if (ownerId && ownerId === ctx.workerId) return;
    if (canManageAllAssistance(ctx) || callerHas(ctx, PERMISSIONS.venues.update, 'edit_room_reservation')) return;
    throw new Error('You do not have permission to cancel this booking.');
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
    const ctx = await requireCaller();
    // Book as yourself; only a venue manager may attribute a booking to another worker.
    const workerProfileId = canManageAllAssistance(ctx) ? (data.workerProfileId || ctx.workerId) : ctx.workerId;
    return venueAssistanceService.createVenueBooking(createVenueBookingSchema.parse({ ...data, workerProfileId }));
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
    const ctx = await requireCaller();
    const workerProfileId = canManageAllAssistance(ctx) ? (data.workerProfileId || ctx.workerId) : ctx.workerId;
    return venueAssistanceService.createRecurringBooking(createRecurringBookingSchema.parse({ ...data, workerProfileId }));
}

/** Cancel a single venue booking and all its pending assistance requests. */
export async function cancelVenueBooking(bookingId: string) {
    const ctx = await requireCaller();
    const booking = await prisma.venueBooking.findUnique({
        where: { id: bookingId },
        select: { workerProfileId: true },
    });
    if (!booking) throw new Error('Booking not found.');
    assertCanCancelBooking(ctx, booking.workerProfileId);
    return venueAssistanceService.cancelVenueBooking(bookingId, ctx.workerId);
}

/** Cancel a single occurrence of a recurring booking (same as cancelVenueBooking). */
export async function cancelRecurringOccurrence(bookingId: string) {
    const ctx = await requireCaller();
    const booking = await prisma.venueBooking.findUnique({
        where: { id: bookingId },
        select: { workerProfileId: true },
    });
    if (!booking) throw new Error('Booking not found.');
    assertCanCancelBooking(ctx, booking.workerProfileId);
    return venueAssistanceService.cancelRecurringOccurrence(bookingId, ctx.workerId);
}

/** Cancel an entire recurring series and all pending assistance requests across all occurrences. */
export async function cancelRecurringSeries(recurringBookingId: string) {
    const ctx = await requireCaller();
    const series = await prisma.recurringBooking.findUnique({
        where: { id: recurringBookingId },
        select: { workerProfileId: true },
    });
    if (!series) throw new Error('Recurring booking not found.');
    assertCanCancelBooking(ctx, series.workerProfileId);
    return venueAssistanceService.cancelRecurringSeries(recurringBookingId, ctx.workerId);
}

// ---------------------------------------------------------------------------
// Assistance Configuration actions
// ---------------------------------------------------------------------------

/** Create or update an AssistanceConfiguration for a room+ministry pair. */
export async function upsertAssistanceConfig(
    roomId: string,
    ministryId: string,
    items: AssistanceConfigItemInput[],
) {
    const ctx = await requireCaller();
    const parsed = upsertAssistanceConfigSchema.parse({ roomId, ministryId, items, actorId: ctx.workerId });
    return venueAssistanceService.upsertAssistanceConfig(parsed);
}

/** Delete an AssistanceConfiguration (cascade deletes items). Does NOT affect existing requests. */
export async function deleteAssistanceConfig(configId: string) {
    const ctx = await requireCaller();
    return venueAssistanceService.deleteAssistanceConfig(configId, ctx.workerId);
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
) {
    const ctx = await requireCaller();
    const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId },
        select: { ministryId: true },
    });
    if (!request) throw new Error('Assistance request not found.');
    await assertMinistryAssistanceAuth(ctx, request.ministryId);

    const parsed = respondToAssistanceRequestSchema.parse({
        requestId, itemStatuses, explanation, responderId: ctx.workerId,
    });
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
) {
    const ctx = await requireCaller();
    await assertMinistryAssistanceAuth(ctx, ministryId);

    const parsed = bulkRespondToRecurringRequestsSchema.parse({
        recurringBookingId, ministryId, itemStatuses, explanation, responderId: ctx.workerId,
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

// NOTE: fulfillCompletedBookings is intentionally NOT exported as a Server
// Action. It runs only from the CRON_SECRET-gated /api/cron/venue-assistance
// route, which calls the service function directly. Exposing it here made it a
// publicly-callable, unauthenticated mutation (see the auth findings doc).

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
export async function updateVenueAssistanceSetting(slaDays: number) {
    const { workerId } = await requirePermission(PERMISSIONS.venue_assistance.manage);
    const parsed = updateVenueAssistanceSettingSchema.parse({ slaDays, actorId: workerId });
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
