import crypto from 'node:crypto';
import { prisma } from '@studio/database/prisma';

/**
 * Worker ID sign-in and the one-time email claim.
 *
 * Workers migrated from ORS have a Worker ID and an MD5 legacy password but no
 * Firebase account. The first time they sign in they identify themselves with
 * that pair, choose the email address they will use from then on, and set a
 * real password. After that the Worker ID path is closed to them and they sign
 * in by email like everyone else.
 *
 * This module owns the database half only — verifying the legacy credential,
 * rate limiting, auditing and committing the claim. Creating the Firebase user
 * is the host app's job, so core-engine keeps no dependency on firebase-admin.
 */

const LOGIN_WINDOW_MINUTES = 15;
const MAX_FAILED_ATTEMPTS = 5;

export type WorkerIdCheck =
    /** Credentials good, but the worker has not chosen their email yet. */
    | { status: 'needs_claim'; workerId: string; workerRowId: string; suggestedEmail: string | null; firstName: string }
    /** Already claimed — they should use the email form. */
    | { status: 'already_claimed'; email: string }
    | { status: 'invalid'; error: string }
    | { status: 'inactive'; error: string }
    | { status: 'rate_limited'; error: string };

function md5(value: string): string {
    return crypto.createHash('md5').update(value).digest('hex').toLowerCase();
}

async function logAuthEvent(
    action: 'worker_id_login' | 'worker_id_login_failed' | 'worker_email_claimed',
    details: string,
    targetId?: string,
): Promise<void> {
    try {
        await prisma.transactionLog.create({
            data: { action, module: 'auth', details, targetId },
        });
    } catch {
        // Auditing must never block the auth flow.
    }
}

async function recentFailures(workerId: string): Promise<number> {
    return prisma.transactionLog.count({
        where: {
            module: 'auth',
            action: 'worker_id_login_failed',
            targetId: workerId,
            timestamp: { gte: new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60 * 1000) },
        },
    });
}

/**
 * Verifies a Worker ID + legacy password pair and reports what the caller
 * should do next. Never reveals whether the Worker ID exists.
 */
export async function checkWorkerIdCredentials(
    workerId: string,
    legacyPassword: string,
): Promise<WorkerIdCheck> {
    const genericError = 'Invalid Worker ID or password.';

    if (!workerId?.trim() || !legacyPassword) {
        return { status: 'invalid', error: genericError };
    }
    const id = workerId.trim();

    if ((await recentFailures(id)) >= MAX_FAILED_ATTEMPTS) {
        await logAuthEvent('worker_id_login_failed', `Rate limit hit for worker #${id}`, id);
        return { status: 'rate_limited', error: 'Too many failed attempts. Please try again later.' };
    }

    const worker = await prisma.worker.findFirst({
        where: { workerId: id },
        select: {
            id: true,
            email: true,
            status: true,
            firstName: true,
            legacyPasswordHash: true,
            passwordChangeRequired: true,
            legacyMigratedAt: true,
        },
    });

    if (!worker) {
        await logAuthEvent('worker_id_login_failed', `Unknown worker #${id}`, id);
        return { status: 'invalid', error: genericError };
    }

    if (worker.status !== 'Active') {
        await logAuthEvent('worker_id_login_failed', `Inactive account for worker #${id}`, id);
        return {
            status: 'inactive',
            error: 'Your account is inactive. Please contact your administrator.',
        };
    }

    // Already migrated: the Worker ID path is one-time, so send them to email.
    const storedHash = (worker.legacyPasswordHash ?? '').trim().toLowerCase();
    if (!storedHash && worker.legacyMigratedAt) {
        return { status: 'already_claimed', email: worker.email };
    }
    if (!storedHash) {
        await logAuthEvent('worker_id_login_failed', `No legacy credential for worker #${id}`, id);
        return { status: 'invalid', error: genericError };
    }

    if (md5(legacyPassword) !== storedHash) {
        await logAuthEvent('worker_id_login_failed', `Password mismatch for worker #${id}`, id);
        return { status: 'invalid', error: genericError };
    }

    await logAuthEvent('worker_id_login', `Worker #${id} verified via Worker ID`, worker.id);

    return {
        status: 'needs_claim',
        workerId: id,
        workerRowId: worker.id,
        suggestedEmail: worker.email || null,
        firstName: worker.firstName,
    };
}

/** True if `email` belongs to a different worker already. */
export async function isEmailTaken(email: string, exceptWorkerRowId: string): Promise<boolean> {
    const existing = await prisma.worker.findFirst({
        where: {
            email: { equals: email.trim().toLowerCase(), mode: 'insensitive' },
            id: { not: exceptWorkerRowId },
        },
        select: { id: true },
    });
    return !!existing;
}

/**
 * Commits the claim: the worker's chosen email becomes their login, the legacy
 * credential is destroyed and the migration is stamped so the Worker ID path
 * cannot be used again.
 */
export async function commitWorkerEmailClaim(
    workerRowId: string,
    email: string,
    source = 'C2S Worker ID Login',
): Promise<void> {
    const normalized = email.trim().toLowerCase();

    await prisma.worker.update({
        where: { id: workerRowId },
        data: {
            email: normalized,
            legacyPasswordHash: null,
            passwordChangeRequired: false,
            legacyMigratedAt: new Date(),
            legacyMigratedFrom: source,
        },
    });

    await logAuthEvent(
        'worker_email_claimed',
        `Worker claimed ${normalized} via ${source}`,
        workerRowId,
    );
}
