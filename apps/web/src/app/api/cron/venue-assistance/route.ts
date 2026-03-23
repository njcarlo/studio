import { prisma } from '@studio/database/prisma';
import { NextResponse } from 'next/server';
import { fulfillCompletedBookings } from '@/actions/venue-assistance';
import {
    notifySlaEscalation,
    notifyPreEventReminder,
} from '@/services/venue-assistance-notifications';

export async function GET(request: Request) {
    // Verify Authorization: Bearer <CRON_SECRET>
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Fulfill completed bookings (In_Progress → Fulfilled)
        const fulfillResult = await fulfillCompletedBookings();

        // 2. SLA escalation check
        const setting = await prisma.venueAssistanceSetting.findUnique({
            where: { id: 'global' },
        });
        const slaDays = setting?.slaDays ?? 3;

        const slaThreshold = new Date();
        slaThreshold.setDate(slaThreshold.getDate() - slaDays);

        const overdueRequests = await prisma.assistanceRequest.findMany({
            where: {
                status: 'Pending',
                createdAt: { lt: slaThreshold },
                slaEscalatedAt: null,
            },
            include: {
                booking: { include: { room: true } },
            },
        });

        // Find all users with manage_venue_assistance permission for admin notifications
        const adminWorkers = await prisma.worker.findMany({
            where: {
                role: { permissions: { has: 'manage_venue_assistance' } },
            },
            select: { id: true, email: true },
        });
        const adminUserIds = adminWorkers.map(w => w.id);
        const adminEmails = adminWorkers.map(w => w.email).filter((e): e is string => !!e);

        let escalatedCount = 0;
        for (const req of overdueRequests) {
            // Resolve ministry head
            const ministry = await prisma.ministry.findUnique({
                where: { id: req.ministryId },
            });
            if (!ministry?.headId) continue;

            const head = await prisma.worker.findUnique({
                where: { id: ministry.headId },
            });
            if (!head?.email) continue;

            const daysPending = Math.floor(
                (Date.now() - req.createdAt.getTime()) / (1000 * 60 * 60 * 24),
            );

            await notifySlaEscalation({
                ministryHeadEmail: head.email,
                ministryHeadId: head.id,
                ministryName: req.ministryId,
                requestId: req.id,
                bookingId: req.bookingId,
                bookingTitle: req.booking.title,
                daysPending,
                adminUserIds,
                adminEmails,
            });

            await prisma.assistanceRequest.update({
                where: { id: req.id },
                data: { slaEscalatedAt: new Date() },
            });

            await prisma.venueAuditLog.create({
                data: {
                    requestId: req.id,
                    action: 'sla_escalated',
                    actorId: 'system',
                    after: { daysPending },
                    triggerSource: 'sla_cron',
                },
            });

            escalatedCount++;
        }

        // 3. Pre-event reminder (bookings starting within 3 days with non-Approved/Partial requests)
        const now = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const upcomingBookings = await prisma.venueBooking.findMany({
            where: {
                start: { gte: now, lte: threeDaysFromNow },
                status: { not: 'Cancelled' },
                assistanceRequests: {
                    some: {
                        status: { notIn: ['Approved', 'Partial'] },
                    },
                },
            },
            include: {
                assistanceRequests: {
                    where: {
                        status: { notIn: ['Approved', 'Partial'] },
                    },
                },
            },
        });

        let remindersCount = 0;
        for (const booking of upcomingBookings) {
            for (const req of booking.assistanceRequests) {
                const ministry = await prisma.ministry.findUnique({
                    where: { id: req.ministryId },
                });
                if (!ministry?.headId) continue;

                const head = await prisma.worker.findUnique({
                    where: { id: ministry.headId },
                });
                if (!head?.email) continue;

                await notifyPreEventReminder({
                    ministryHeadEmail: head.email,
                    ministryHeadId: head.id,
                    ministryName: req.ministryId,
                    requestId: req.id,
                    bookingId: booking.id,
                    bookingTitle: booking.title,
                    eventStart: booking.start,
                    currentStatus: req.status,
                });

                remindersCount++;
            }
        }

        return NextResponse.json({
            ok: true,
            fulfilled: fulfillResult.fulfilledCount,
            escalated: escalatedCount,
            reminders: remindersCount,
        });
    } catch (error) {
        console.error('Cron /api/cron/venue-assistance error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
