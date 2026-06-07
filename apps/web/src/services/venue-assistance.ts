import { prisma } from '@studio/database/prisma';
import { RRule } from 'rrule';
import {
    notifyMinistryHeadNewRequest,
    notifyMinistryHeadCancellation,
} from '@/services/venue-assistance-notifications';
import { deriveRequestStatus, type ItemStatus } from '@/actions/venue-assistance-status';
import type {
    CreateVenueBookingInput,
    CreateRecurringBookingInput,
    UpsertAssistanceConfigInput,
    ItemStatusUpdateInput,
    CommandCenterFiltersInput,
} from '@/lib/schemas/venue-assistance.schemas';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a simple unique request ID (timestamp + random suffix). */
function generateRequestId(): string {
    return `REQ-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

/**
 * Resolve the ministry head's worker record for a given ministryId.
 * Returns null if the ministry or head is not found.
 */
async function resolveMinistryHead(ministryId: string) {
    const ministry = await prisma.ministry.findUnique({ where: { id: ministryId } });
    if (!ministry?.headId) return null;
    return prisma.worker.findUnique({ where: { id: ministry.headId } });
}

/**
 * Create AssistanceRequest + AssistanceRequestItem records for a single booking
 * based on the AssistanceConfigurations for its room.
 */
async function createAssistanceRequestsForBooking(
    bookingId: string,
    roomId: string,
    actorId: string,
) {
    const configs = await prisma.assistanceConfiguration.findMany({
        where: { roomId },
        include: { items: true },
    });

    for (const config of configs) {
        const request = await prisma.assistanceRequest.create({
            data: {
                bookingId,
                ministryId: config.ministryId,
                status: 'Pending',
            },
        });

        if (config.items.length > 0) {
            await prisma.assistanceRequestItem.createMany({
                data: config.items.map(item => ({
                    requestId: request.id,
                    name: item.name,
                    description: item.description ?? undefined,
                    quantity: item.quantity,
                    isRequired: item.isRequired,
                    status: 'Pending',
                })),
            });
        }

        await prisma.venueAuditLog.create({
            data: {
                requestId: request.id,
                action: 'request_created',
                actorId,
                triggerSource: 'manual',
            },
        });

        const head = await resolveMinistryHead(config.ministryId);
        if (head?.email) {
            const booking = await prisma.venueBooking.findUnique({
                where: { id: bookingId },
                include: { room: true },
            });
            notifyMinistryHeadNewRequest({
                ministryHeadEmail: head.email,
                ministryHeadId: head.id,
                ministryName: config.ministryId,
                requestId: request.id,
                bookingId,
                bookingTitle: booking?.title ?? '',
                roomName: booking?.room?.name ?? '',
                eventStart: booking?.start ?? new Date(),
            }).catch(console.error);
        }
    }
}

/**
 * Cancel all Pending AssistanceRequests for a booking and notify ministry heads.
 */
async function cancelPendingRequestsForBooking(bookingId: string, actorId: string) {
    const pendingRequests = await prisma.assistanceRequest.findMany({
        where: { bookingId, status: 'Pending' },
    });

    if (pendingRequests.length === 0) return;

    await prisma.assistanceRequest.updateMany({
        where: { bookingId, status: 'Pending' },
        data: { status: 'Cancelled' },
    });

    const booking = await prisma.venueBooking.findUnique({
        where: { id: bookingId },
        include: { room: true },
    });

    for (const req of pendingRequests) {
        await prisma.venueAuditLog.create({
            data: {
                requestId: req.id,
                action: 'request_cancelled',
                actorId,
                before: { status: 'Pending' },
                after: { status: 'Cancelled' },
                triggerSource: 'manual',
            },
        });

        const head = await resolveMinistryHead(req.ministryId);
        if (head?.email) {
            notifyMinistryHeadCancellation({
                ministryHeadEmail: head.email,
                ministryHeadId: head.id,
                ministryName: req.ministryId,
                requestId: req.id,
                bookingId,
                bookingTitle: booking?.title ?? '',
            }).catch(console.error);
        }
    }
}

/**
 * Check if an actor has permission to manage assistance configs for a ministry.
 * Throws if not authorized.
 */
export async function assertConfigPermission(actorId: string, ministryId: string) {
    const actor = await prisma.worker.findUnique({
        where: { id: actorId },
        include: { role: true },
    });

    if (!actor) throw new Error('Actor not found');

    const perms: string[] = actor.role?.permissions ?? [];

    if (perms.includes('manage_venue_assistance')) return; // full access

    if (perms.includes('manage_own_ministry_assistance')) {
        const ministry = await prisma.ministry.findUnique({ where: { id: ministryId } });
        if (ministry?.headId === actorId) return;
        throw new Error('You can only manage assistance configurations for your own ministry.');
    }

    throw new Error('You do not have permission to manage venue assistance configurations.');
}

// ---------------------------------------------------------------------------
// Booking
// ---------------------------------------------------------------------------

export async function createVenueBooking(data: CreateVenueBookingInput) {
    const booking = await prisma.venueBooking.create({
        data: {
            requestId: generateRequestId(),
            roomId: data.roomId,
            workerProfileId: data.workerProfileId,
            title: data.title,
            purpose: data.purpose,
            start: data.start,
            end: data.end,
            pax: data.pax ?? 0,
            numTables: data.numTables ?? 0,
            numChairs: data.numChairs ?? 0,
            guidelinesAccepted: data.guidelinesAccepted ?? false,
            status: 'Pending Ministry Approval',
        },
    });

    await prisma.venueAuditLog.create({
        data: {
            action: 'booking_created',
            actorId: data.workerProfileId,
            after: { bookingId: booking.id },
            triggerSource: 'manual',
        },
    });

    await createAssistanceRequestsForBooking(booking.id, data.roomId, data.workerProfileId);

    return booking;
}

export async function createRecurringBooking(data: CreateRecurringBookingInput) {
    const rule = RRule.fromString(
        data.recurrenceRule.startsWith('RRULE:')
            ? data.recurrenceRule
            : `RRULE:${data.recurrenceRule}`,
    );

    const occurrenceDates = rule.between(
        data.startDate,
        data.endDate ?? new Date(data.startDate.getTime() + 365 * 24 * 60 * 60 * 1000),
        true,
    );

    const recurringBooking = await prisma.recurringBooking.create({
        data: {
            roomId: data.roomId,
            workerProfileId: data.workerProfileId,
            title: data.title,
            purpose: data.purpose,
            recurrenceRule: data.recurrenceRule,
            startTime: data.startTime,
            endTime: data.endTime,
            startDate: data.startDate,
            endDate: data.endDate,
            pax: data.pax ?? 0,
            status: 'Active',
        },
    });

    const [startHour, startMin] = data.startTime.split(':').map(Number);
    const [endHour, endMin] = data.endTime.split(':').map(Number);

    for (const date of occurrenceDates) {
        const start = new Date(date);
        start.setHours(startHour, startMin, 0, 0);

        const end = new Date(date);
        end.setHours(endHour, endMin, 0, 0);
        if (end < start) {
            end.setDate(end.getDate() + 1);
        }

        const booking = await prisma.venueBooking.create({
            data: {
                requestId: generateRequestId(),
                roomId: data.roomId,
                workerProfileId: data.workerProfileId,
                title: data.title,
                purpose: data.purpose,
                start,
                end,
                pax: data.pax ?? 0,
                guidelinesAccepted: data.guidelinesAccepted ?? false,
                status: 'Pending Ministry Approval',
                recurringBookingId: recurringBooking.id,
            },
        });

        await prisma.venueAuditLog.create({
            data: {
                action: 'booking_created',
                actorId: data.workerProfileId,
                after: { bookingId: booking.id, recurringBookingId: recurringBooking.id },
                triggerSource: 'manual',
            },
        });

        await createAssistanceRequestsForBooking(booking.id, data.roomId, data.workerProfileId);
    }

    return { recurringBooking, occurrenceCount: occurrenceDates.length };
}

export async function cancelVenueBooking(bookingId: string, actorId: string) {
    const booking = await prisma.venueBooking.update({
        where: { id: bookingId },
        data: { status: 'Cancelled' },
    });

    await cancelPendingRequestsForBooking(bookingId, actorId);

    await prisma.venueAuditLog.create({
        data: {
            action: 'booking_cancelled',
            actorId,
            after: { bookingId, status: 'Cancelled' },
            triggerSource: 'manual',
        },
    });

    return booking;
}

export async function cancelRecurringOccurrence(bookingId: string, actorId: string) {
    return cancelVenueBooking(bookingId, actorId);
}

export async function cancelRecurringSeries(recurringBookingId: string, actorId: string) {
    await prisma.recurringBooking.update({
        where: { id: recurringBookingId },
        data: { status: 'Cancelled' },
    });

    const occurrences = await prisma.venueBooking.findMany({
        where: { recurringBookingId },
        select: { id: true },
    });

    await prisma.venueBooking.updateMany({
        where: { recurringBookingId },
        data: { status: 'Cancelled' },
    });

    for (const occ of occurrences) {
        await cancelPendingRequestsForBooking(occ.id, actorId);
    }

    await prisma.venueAuditLog.create({
        data: {
            action: 'recurring_series_cancelled',
            actorId,
            after: { recurringBookingId, status: 'Cancelled' },
            triggerSource: 'manual',
        },
    });

    return { recurringBookingId, cancelledOccurrences: occurrences.length };
}

// ---------------------------------------------------------------------------
// Assistance Configuration
// ---------------------------------------------------------------------------

export async function upsertAssistanceConfig(data: UpsertAssistanceConfigInput) {
    const { roomId, ministryId, items, actorId } = data;
    await assertConfigPermission(actorId, ministryId);

    const existing = await prisma.assistanceConfiguration.findUnique({
        where: { roomId_ministryId: { roomId, ministryId } },
    });

    let config;
    if (existing) {
        await prisma.assistanceConfigItem.deleteMany({ where: { configId: existing.id } });

        config = await prisma.assistanceConfiguration.update({
            where: { id: existing.id },
            data: {
                createdBy: actorId,
                items: {
                    create: items.map(item => ({
                        name: item.name,
                        description: item.description,
                        quantity: item.quantity ?? 1,
                        isRequired: item.isRequired ?? true,
                    })),
                },
            },
            include: { items: true },
        });

        await prisma.venueAuditLog.create({
            data: {
                configId: config.id,
                action: 'config_updated',
                actorId,
                before: { roomId, ministryId, itemCount: existing ? undefined : 0 },
                after: { roomId, ministryId, itemCount: items.length },
                triggerSource: 'manual',
            },
        });
    } else {
        config = await prisma.assistanceConfiguration.create({
            data: {
                roomId,
                ministryId,
                createdBy: actorId,
                items: {
                    create: items.map(item => ({
                        name: item.name,
                        description: item.description,
                        quantity: item.quantity ?? 1,
                        isRequired: item.isRequired ?? true,
                    })),
                },
            },
            include: { items: true },
        });

        await prisma.venueAuditLog.create({
            data: {
                configId: config.id,
                action: 'config_created',
                actorId,
                after: { roomId, ministryId, itemCount: items.length },
                triggerSource: 'manual',
            },
        });
    }

    return config;
}

export async function deleteAssistanceConfig(configId: string, actorId: string) {
    const config = await prisma.assistanceConfiguration.findUnique({
        where: { id: configId },
    });

    if (!config) throw new Error('Assistance configuration not found.');

    await assertConfigPermission(actorId, config.ministryId);

    await prisma.assistanceConfiguration.delete({ where: { id: configId } });

    await prisma.venueAuditLog.create({
        data: {
            configId,
            action: 'config_deleted',
            actorId,
            before: { roomId: config.roomId, ministryId: config.ministryId },
            triggerSource: 'manual',
        },
    });
}

export async function getAssistanceConfigsForRoom(roomId: string) {
    return prisma.assistanceConfiguration.findMany({
        where: { roomId },
        include: { items: true },
    });
}

export async function getAssistanceConfigsForMinistry(ministryId: string) {
    return prisma.assistanceConfiguration.findMany({
        where: { ministryId },
        include: { items: true },
    });
}

// ---------------------------------------------------------------------------
// Assistance Request queries
// ---------------------------------------------------------------------------

export async function getAssistanceRequestsForBooking(bookingId: string) {
    return prisma.assistanceRequest.findMany({
        where: { bookingId },
        include: {
            items: true,
            auditLogs: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: { createdAt: 'asc' },
    });
}

export async function getAssistanceRequestsForMinistry(ministryId: string) {
    return prisma.assistanceRequest.findMany({
        where: { ministryId },
        include: {
            items: true,
            booking: { include: { room: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
}

// ---------------------------------------------------------------------------
// Assistance Response
// ---------------------------------------------------------------------------

export async function respondToAssistanceRequest(
    requestId: string,
    itemStatuses: ItemStatusUpdateInput[],
    explanation: string | undefined,
    responderId: string,
) {
    const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId },
        include: {
            items: true,
            booking: { include: { room: true, worker: true } },
        },
    });

    if (!request) throw new Error('Assistance request not found.');

    const beforeStatus = request.status;

    for (const update of itemStatuses) {
        await prisma.assistanceRequestItem.update({
            where: { id: update.itemId },
            data: {
                status: update.status,
                adjustedQty: update.adjustedQty ?? null,
                adjustedDesc: update.adjustedDesc ?? null,
            },
        });
    }

    const updatedStatuses = itemStatuses.map(u => u.status as ItemStatus);
    const newStatus = deriveRequestStatus(updatedStatuses);

    const updatedRequest = await prisma.assistanceRequest.update({
        where: { id: requestId },
        data: {
            status: newStatus,
            explanation: explanation ?? null,
            respondedAt: new Date(),
            respondedBy: responderId,
        },
    });

    await prisma.venueAuditLog.create({
        data: {
            requestId,
            action: 'request_responded',
            actorId: responderId,
            before: { status: beforeStatus },
            after: {
                status: newStatus,
                itemStatuses: itemStatuses.map(u => ({ id: u.itemId, status: u.status })),
                explanation,
            },
            triggerSource: 'manual',
        },
    });

    const requester = request.booking.worker;
    const hasDecline = itemStatuses.some(u => u.status === 'Declined');

    const adminWorkers = await prisma.worker.findMany({
        where: {
            role: {
                permissions: { has: 'manage_venue_assistance' },
            },
        },
        select: { id: true, email: true },
    });

    const adminUserIds = adminWorkers.map(w => w.id);
    const adminEmails = adminWorkers.map(w => w.email).filter((e): e is string => !!e);

    if (requester?.email) {
        if (hasDecline) {
            import('@/services/venue-assistance-notifications').then(({ notifyRequesterDecline }) => {
                notifyRequesterDecline({
                    requesterEmail: requester.email!,
                    requesterId: requester.id,
                    ministryName: request.ministryId,
                    bookingTitle: request.booking.title,
                    requestId,
                    bookingId: request.bookingId,
                    explanation,
                }).catch(console.error);
            }).catch(console.error);
        }

        import('@/services/venue-assistance-notifications').then(({ notifyStatusChange }) => {
            notifyStatusChange({
                requesterEmail: requester.email!,
                requesterId: requester.id,
                ministryName: request.ministryId,
                bookingTitle: request.booking.title,
                requestId,
                bookingId: request.bookingId,
                newStatus,
                adminUserIds,
                adminEmails,
            }).catch(console.error);
        }).catch(console.error);
    }

    return updatedRequest;
}

export async function bulkRespondToRecurringRequests(
    recurringBookingId: string,
    ministryId: string,
    itemStatuses: ItemStatusUpdateInput[],
    explanation: string | undefined,
    responderId: string,
) {
    const pendingRequests = await prisma.assistanceRequest.findMany({
        where: {
            ministryId,
            status: 'Pending',
            booking: { recurringBookingId },
        },
        include: { items: true },
    });

    const itemIds = itemStatuses.map(u => u.itemId);
    const sourceItems = await prisma.assistanceRequestItem.findMany({
        where: { id: { in: itemIds } },
        select: { id: true, name: true },
    });
    const itemIdToName = Object.fromEntries(
        sourceItems.map(item => [item.id, item.name.toLowerCase()])
    );

    const results = [];
    for (const req of pendingRequests) {
        const mappedStatuses: ItemStatusUpdateInput[] = req.items.map(item => {
            const directMatch = itemStatuses.find(u => u.itemId === item.id);
            if (directMatch) return directMatch;

            const itemName = item.name.toLowerCase();
            const nameMatch = itemStatuses.find(u => {
                const sourceName = itemIdToName[u.itemId];
                return sourceName && sourceName === itemName;
            });

            if (nameMatch) {
                return {
                    itemId: item.id,
                    status: nameMatch.status,
                    adjustedQty: nameMatch.adjustedQty,
                    adjustedDesc: nameMatch.adjustedDesc,
                };
            }

            return { itemId: item.id, status: 'Approved' as const };
        });

        const result = await respondToAssistanceRequest(
            req.id,
            mappedStatuses,
            explanation,
            responderId,
        );
        results.push(result);
    }

    return { respondedCount: results.length, results };
}

// ---------------------------------------------------------------------------
// Check-in and fulfillment
// ---------------------------------------------------------------------------

export async function handleBookingCheckIn(bookingId: string) {
    const eligibleRequests = await prisma.assistanceRequest.findMany({
        where: {
            bookingId,
            status: { in: ['Approved', 'Partial'] },
        },
    });

    if (eligibleRequests.length === 0) return { updatedCount: 0 };

    await prisma.assistanceRequest.updateMany({
        where: {
            bookingId,
            status: { in: ['Approved', 'Partial'] },
        },
        data: { status: 'In_Progress' },
    });

    for (const req of eligibleRequests) {
        await prisma.venueAuditLog.create({
            data: {
                requestId: req.id,
                action: 'status_changed',
                actorId: 'system',
                before: { status: req.status },
                after: { status: 'In_Progress' },
                triggerSource: 'qr_scan',
            },
        });
    }

    return { updatedCount: eligibleRequests.length };
}

export async function fulfillCompletedBookings() {
    const now = new Date();

    const completedBookings = await prisma.venueBooking.findMany({
        where: {
            end: { lt: now },
            status: { not: 'Cancelled' },
        },
        select: { id: true },
    });

    if (completedBookings.length === 0) return { fulfilledCount: 0 };

    const bookingIds = completedBookings.map(b => b.id);

    const inProgressRequests = await prisma.assistanceRequest.findMany({
        where: {
            bookingId: { in: bookingIds },
            status: 'In_Progress',
        },
    });

    if (inProgressRequests.length === 0) return { fulfilledCount: 0 };

    await prisma.assistanceRequest.updateMany({
        where: {
            bookingId: { in: bookingIds },
            status: 'In_Progress',
        },
        data: { status: 'Fulfilled' },
    });

    for (const req of inProgressRequests) {
        await prisma.venueAuditLog.create({
            data: {
                requestId: req.id,
                action: 'status_changed',
                actorId: 'system',
                before: { status: 'In_Progress' },
                after: { status: 'Fulfilled' },
                triggerSource: 'booking_end',
            },
        });
    }

    return { fulfilledCount: inProgressRequests.length };
}

// ---------------------------------------------------------------------------
// Admin / Command Center
// ---------------------------------------------------------------------------

export async function getCommandCenterData(filters: CommandCenterFiltersInput = {}) {
    const where: Record<string, unknown> = {};

    if (filters.status) {
        where.status = filters.status;
    }

    if (filters.ministryId) {
        where.ministryId = filters.ministryId;
    }

    if (filters.dateFrom || filters.dateTo) {
        where.booking = {
            start: {
                ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
                ...(filters.dateTo ? { lte: filters.dateTo } : {}),
            },
        };
    }

    return prisma.assistanceRequest.findMany({
        where,
        include: {
            items: true,
            booking: {
                include: {
                    room: true,
                    worker: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
            },
            auditLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
    });
}

export async function getAuditLogsForRequest(requestId: string) {
    return prisma.venueAuditLog.findMany({
        where: { requestId },
        orderBy: { createdAt: 'asc' },
    });
}

export async function updateVenueAssistanceSetting(slaDays: number, actorId: string) {
    if (slaDays < 1) throw new Error('SLA days must be at least 1.');

    return prisma.venueAssistanceSetting.upsert({
        where: { id: 'global' },
        update: { slaDays, updatedBy: actorId },
        create: { id: 'global', slaDays, updatedBy: actorId },
    });
}

// ---------------------------------------------------------------------------
// Booking queries
// ---------------------------------------------------------------------------

export async function getVenueBookings() {
    return prisma.venueBooking.findMany({
        include: {
            room: true,
            assistanceRequests: { include: { items: true } },
        },
        orderBy: { start: 'desc' },
    });
}

export async function getMyVenueBookings(workerProfileId: string) {
    return prisma.venueBooking.findMany({
        where: { workerProfileId },
        include: {
            room: true,
            assistanceRequests: { include: { items: true } },
        },
        orderBy: { start: 'desc' },
    });
}

export async function getVenueBooking(bookingId: string) {
    return prisma.venueBooking.findUnique({
        where: { id: bookingId },
        include: {
            room: true,
            assistanceRequests: {
                include: {
                    items: true,
                    auditLogs: { orderBy: { createdAt: 'asc' } },
                },
            },
        },
    });
}

export async function getAllAssistanceConfigs() {
    return prisma.assistanceConfiguration.findMany({
        include: {
            items: true,
            room: true,
        },
        orderBy: [{ roomId: 'asc' }, { ministryId: 'asc' }],
    });
}
