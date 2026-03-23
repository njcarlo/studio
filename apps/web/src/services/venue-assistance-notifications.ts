import { prisma } from '@studio/database/prisma';
import { EmailService } from './email-service';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? '';

function requestLink(bookingId: string): string {
    return `${APP_URL}/venue/${bookingId}`;
}

// ---------------------------------------------------------------------------
// notifyMinistryHeadNewRequest
// Requirement 4.1, 4.2 — sent when an AssistanceRequest is generated
// ---------------------------------------------------------------------------

export interface NotifyMinistryHeadNewRequestParams {
    ministryHeadEmail: string;
    ministryHeadId: string;
    ministryName: string;
    requestId: string;
    bookingId: string;
    bookingTitle: string;
    roomName: string;
    eventStart: Date;
}

export async function notifyMinistryHeadNewRequest(
    params: NotifyMinistryHeadNewRequestParams,
): Promise<void> {
    const {
        ministryHeadEmail,
        ministryHeadId,
        ministryName,
        requestId,
        bookingId,
        bookingTitle,
        roomName,
        eventStart,
    } = params;

    const link = requestLink(bookingId);
    const title = `New Assistance Request: ${bookingTitle}`;
    const body = `Your ministry (${ministryName}) has a new assistance request for "${bookingTitle}" in ${roomName} on ${eventStart.toDateString()}. Please review and respond.`;

    await prisma.inAppNotification.create({
        data: { userId: ministryHeadId, title, body, link },
    });

    await EmailService.sendEmail({
        to: ministryHeadEmail,
        subject: title,
        html: `<p>${body}</p><p><a href="${link}">View Request</a></p>`,
        text: `${body}\n\nView Request: ${link}`,
    });
}

// ---------------------------------------------------------------------------
// notifyMinistryHeadBookingApproved
// Requirement 4.3 — reminder when booking is approved and requests still Pending
// ---------------------------------------------------------------------------

export interface NotifyMinistryHeadBookingApprovedParams {
    ministryHeadEmail: string;
    ministryHeadId: string;
    ministryName: string;
    requestId: string;
    bookingId: string;
    bookingTitle: string;
    roomName: string;
    eventStart: Date;
}

export async function notifyMinistryHeadBookingApproved(
    params: NotifyMinistryHeadBookingApprovedParams,
): Promise<void> {
    const {
        ministryHeadEmail,
        ministryHeadId,
        ministryName,
        bookingId,
        bookingTitle,
        roomName,
        eventStart,
    } = params;

    const link = requestLink(bookingId);
    const title = `Booking Approved — Response Needed: ${bookingTitle}`;
    const body = `The booking "${bookingTitle}" in ${roomName} on ${eventStart.toDateString()} has been approved. Your ministry (${ministryName}) still has a pending assistance request. Please respond as soon as possible.`;

    await prisma.inAppNotification.create({
        data: { userId: ministryHeadId, title, body, link },
    });

    await EmailService.sendEmail({
        to: ministryHeadEmail,
        subject: title,
        html: `<p>${body}</p><p><a href="${link}">View Request</a></p>`,
        text: `${body}\n\nView Request: ${link}`,
    });
}

// ---------------------------------------------------------------------------
// notifyRequesterDecline
// Requirement 4.6 — sent to booking requester when ministry head declines any item
// ---------------------------------------------------------------------------

export interface NotifyRequesterDeclineParams {
    requesterEmail: string;
    requesterId: string;
    ministryName: string;
    bookingTitle: string;
    requestId: string;
    bookingId: string;
    explanation?: string;
}

export async function notifyRequesterDecline(
    params: NotifyRequesterDeclineParams,
): Promise<void> {
    const {
        requesterEmail,
        requesterId,
        ministryName,
        bookingTitle,
        bookingId,
        explanation,
    } = params;

    const link = requestLink(bookingId);
    const title = `Assistance Declined for: ${bookingTitle}`;
    const explanationText = explanation ? ` Reason: ${explanation}` : '';
    const body = `The ministry "${ministryName}" has declined one or more assistance items for your booking "${bookingTitle}".${explanationText}`;

    await prisma.inAppNotification.create({
        data: { userId: requesterId, title, body, link },
    });

    await EmailService.sendEmail({
        to: requesterEmail,
        subject: title,
        html: `<p>${body}</p><p><a href="${link}">View Booking</a></p>`,
        text: `${body}\n\nView Booking: ${link}`,
    });
}

// ---------------------------------------------------------------------------
// notifyStatusChange
// Requirement 4.1, 5.7 — sent to requester + manage_venue_assistance users
// ---------------------------------------------------------------------------

export interface NotifyStatusChangeParams {
    requesterEmail: string;
    requesterId: string;
    ministryName: string;
    bookingTitle: string;
    requestId: string;
    bookingId: string;
    newStatus: string;
    adminUserIds: string[];
    adminEmails: string[];
}

export async function notifyStatusChange(
    params: NotifyStatusChangeParams,
): Promise<void> {
    const {
        requesterEmail,
        requesterId,
        ministryName,
        bookingTitle,
        bookingId,
        newStatus,
        adminUserIds,
        adminEmails,
    } = params;

    const link = requestLink(bookingId);
    const title = `Assistance Request Updated: ${bookingTitle}`;
    const body = `The assistance request from ministry "${ministryName}" for your booking "${bookingTitle}" is now ${newStatus}.`;

    // Notify requester
    await prisma.inAppNotification.create({
        data: { userId: requesterId, title, body, link },
    });

    // Notify admins (in-app)
    if (adminUserIds.length > 0) {
        await prisma.inAppNotification.createMany({
            data: adminUserIds.map(userId => ({ userId, title, body, link })),
        });
    }

    // Email requester
    await EmailService.sendEmail({
        to: requesterEmail,
        subject: title,
        html: `<p>${body}</p><p><a href="${link}">View Request</a></p>`,
        text: `${body}\n\nView Request: ${link}`,
    });

    // Email admins
    if (adminEmails.length > 0) {
        await EmailService.sendEmail({
            to: adminEmails,
            subject: `[Admin] ${title}`,
            html: `<p>${body}</p><p><a href="${link}">View Request</a></p>`,
            text: `${body}\n\nView Request: ${link}`,
        });
    }
}

// ---------------------------------------------------------------------------
// notifySlaEscalation
// Requirement 4.4, 7.2, 7.3 — sent when request has been Pending > SLA days
// ---------------------------------------------------------------------------

export interface NotifySlaEscalationParams {
    ministryHeadEmail: string;
    ministryHeadId: string;
    ministryName: string;
    requestId: string;
    bookingId: string;
    bookingTitle: string;
    daysPending: number;
    adminUserIds: string[];
    adminEmails: string[];
}

export async function notifySlaEscalation(
    params: NotifySlaEscalationParams,
): Promise<void> {
    const {
        ministryHeadEmail,
        ministryHeadId,
        ministryName,
        bookingId,
        bookingTitle,
        daysPending,
        adminUserIds,
        adminEmails,
    } = params;

    const link = requestLink(bookingId);
    const title = `SLA Overdue: Assistance Request for ${bookingTitle}`;
    const body = `The assistance request from ministry "${ministryName}" for booking "${bookingTitle}" has been pending for ${daysPending} day(s) without a response. Please take action.`;

    // Notify ministry head
    await prisma.inAppNotification.create({
        data: { userId: ministryHeadId, title, body, link },
    });

    // Notify admins (in-app)
    if (adminUserIds.length > 0) {
        await prisma.inAppNotification.createMany({
            data: adminUserIds.map(userId => ({ userId, title, body, link })),
        });
    }

    // Email ministry head
    await EmailService.sendEmail({
        to: ministryHeadEmail,
        subject: title,
        html: `<p>${body}</p><p><a href="${link}">View Request</a></p>`,
        text: `${body}\n\nView Request: ${link}`,
    });

    // Email admins
    if (adminEmails.length > 0) {
        await EmailService.sendEmail({
            to: adminEmails,
            subject: `[Admin] ${title}`,
            html: `<p>${body}</p><p><a href="${link}">View Request</a></p>`,
            text: `${body}\n\nView Request: ${link}`,
        });
    }
}

// ---------------------------------------------------------------------------
// notifyPreEventReminder
// Requirement 4.5 — sent when event is 3 days away and request not Approved/Partial
// ---------------------------------------------------------------------------

export interface NotifyPreEventReminderParams {
    ministryHeadEmail: string;
    ministryHeadId: string;
    ministryName: string;
    requestId: string;
    bookingId: string;
    bookingTitle: string;
    eventStart: Date;
    currentStatus: string;
}

export async function notifyPreEventReminder(
    params: NotifyPreEventReminderParams,
): Promise<void> {
    const {
        ministryHeadEmail,
        ministryHeadId,
        ministryName,
        bookingId,
        bookingTitle,
        eventStart,
        currentStatus,
    } = params;

    const link = requestLink(bookingId);
    const title = `Upcoming Event Reminder: ${bookingTitle}`;
    const body = `The event "${bookingTitle}" is in 3 days (${eventStart.toDateString()}). Your ministry (${ministryName}) has an assistance request that is currently "${currentStatus}". Please respond before the event.`;

    await prisma.inAppNotification.create({
        data: { userId: ministryHeadId, title, body, link },
    });

    await EmailService.sendEmail({
        to: ministryHeadEmail,
        subject: title,
        html: `<p>${body}</p><p><a href="${link}">View Request</a></p>`,
        text: `${body}\n\nView Request: ${link}`,
    });
}

// ---------------------------------------------------------------------------
// notifyMinistryHeadCancellation
// Requirement 3.4 — sent when a booking is cancelled and requests were Pending
// ---------------------------------------------------------------------------

export interface NotifyMinistryHeadCancellationParams {
    ministryHeadEmail: string;
    ministryHeadId: string;
    ministryName: string;
    requestId: string;
    bookingId: string;
    bookingTitle: string;
}

export async function notifyMinistryHeadCancellation(
    params: NotifyMinistryHeadCancellationParams,
): Promise<void> {
    const {
        ministryHeadEmail,
        ministryHeadId,
        ministryName,
        bookingId,
        bookingTitle,
    } = params;

    const link = requestLink(bookingId);
    const title = `Booking Cancelled: ${bookingTitle}`;
    const body = `The booking "${bookingTitle}" has been cancelled. The assistance request for your ministry (${ministryName}) has been cancelled as well. No further action is needed.`;

    await prisma.inAppNotification.create({
        data: { userId: ministryHeadId, title, body, link },
    });

    await EmailService.sendEmail({
        to: ministryHeadEmail,
        subject: title,
        html: `<p>${body}</p><p><a href="${link}">View Booking</a></p>`,
        text: `${body}\n\nView Booking: ${link}`,
    });
}
