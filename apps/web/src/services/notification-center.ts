import { prisma } from '@studio/database/prisma';
import { EmailService } from '@/services/email-service';

/**
 * In-app notification centre + email fan-out (Layer 3), gated by per-worker
 * `NotificationPreference`. Distinct from `NotificationService`
 * (notification-service.ts), which handles approval-request/password-reset
 * emails to external recipients.
 *
 * `notify()` always writes the `InAppNotification` row first (so the centre
 * retains full history even if email fails/is disabled), then sends an email
 * if the worker has `emailEnabled` (default true) and has an email address.
 * Email failures are logged but never throw — callers (approval engine, cron
 * jobs, etc.) must not fail because a notification's email leg failed.
 */

/** Actor used for `writeAudit()` calls from unattended jobs (Layer 5 cron). */
export const SYSTEM_ACTOR = { workerId: 'system', email: 'system@cog-app.internal', userName: 'System' };

export type NotifyInput = {
    title: string;
    body: string;
    link?: string;
};

export async function notify(workerId: string, input: NotifyInput) {
    const inApp = await prisma.inAppNotification.create({
        data: { userId: workerId, title: input.title, body: input.body, link: input.link },
    });

    try {
        const [worker, pref] = await Promise.all([
            prisma.worker.findUnique({ where: { id: workerId }, select: { email: true } }),
            prisma.notificationPreference.findUnique({ where: { workerId } }),
        ]);

        const emailEnabled = pref?.emailEnabled ?? true;
        if (emailEnabled && worker?.email) {
            await EmailService.sendEmail({
                to: worker.email,
                subject: input.title,
                html: `<p>${input.body}</p>${input.link ? `<p><a href="${input.link}">View details</a></p>` : ''}`,
                text: input.body,
            });
        }
    } catch (e) {
        console.error('[notification-center] email send failed:', e);
    }

    return inApp;
}

/** Sends the same notification to multiple workers (deduped). */
export async function notifyMany(workerIds: (string | null | undefined)[], input: NotifyInput) {
    const ids = new Set(workerIds.filter((id): id is string => !!id));
    for (const id of ids) {
        await notify(id, input);
    }
}

// ── In-app notification centre ──────────────────────────────────────────

export async function getNotifications(workerId: string, opts?: { limit?: number }) {
    return prisma.inAppNotification.findMany({
        where: { userId: workerId },
        orderBy: { createdAt: 'desc' },
        take: opts?.limit ?? 50,
    });
}

export async function getUnreadCount(workerId: string) {
    return prisma.inAppNotification.count({ where: { userId: workerId, read: false } });
}

export async function markNotificationRead(workerId: string, id: string) {
    return prisma.inAppNotification.updateMany({ where: { id, userId: workerId }, data: { read: true } });
}

export async function markAllNotificationsRead(workerId: string) {
    return prisma.inAppNotification.updateMany({ where: { userId: workerId, read: false }, data: { read: true } });
}

// ── Preferences ──────────────────────────────────────────────────────────

export async function getNotificationPreference(workerId: string) {
    const row = await prisma.notificationPreference.findUnique({ where: { workerId } });
    return { emailEnabled: row?.emailEnabled ?? true };
}

export async function setNotificationPreference(workerId: string, emailEnabled: boolean) {
    await prisma.notificationPreference.upsert({
        where: { workerId },
        update: { emailEnabled },
        create: { workerId, emailEnabled },
    });
    return { emailEnabled };
}
