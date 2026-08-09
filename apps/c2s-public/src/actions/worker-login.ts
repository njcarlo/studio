"use server";

import {
    ok,
    err,
    toErrorMessage,
    checkWorkerIdCredentials,
    isEmailTaken,
    commitWorkerEmailClaim,
    type ActionResponse,
} from '@studio/core-engine';
import { firebaseAdminAuth } from '@/lib/firebase-admin';

/**
 * First-time sign-in for workers migrated from ORS: Worker ID + legacy
 * password once, then they choose the email they will log in with from then on.
 */

/** `getUserByEmail` throws instead of returning null; normalize that. */
async function findFirebaseUser(email: string) {
    try {
        return await firebaseAdminAuth.getUserByEmail(email);
    } catch (error: unknown) {
        if ((error as { code?: string })?.code === 'auth/user-not-found') return null;
        throw error;
    }
}

export type WorkerIdStep =
    | { step: 'claim'; claimToken: string; suggestedEmail: string | null; firstName: string }
    | { step: 'use_email'; email: string };

/**
 * Step 1 — verify the Worker ID pair. Either the worker still needs to claim an
 * email, or they already have and should use the email form.
 */
export async function startWorkerIdLogin(
    workerId: string,
    legacyPassword: string,
): Promise<ActionResponse<WorkerIdStep>> {
    try {
        const result = await checkWorkerIdCredentials(workerId, legacyPassword);

        switch (result.status) {
            case 'needs_claim':
                return ok({
                    step: 'claim',
                    // The row id is only useful with a verified credential, and
                    // step 2 re-verifies the pair before committing anything.
                    claimToken: result.workerRowId,
                    suggestedEmail: result.suggestedEmail,
                    firstName: result.firstName,
                });
            case 'already_claimed':
                return ok({ step: 'use_email', email: result.email });
            default:
                return err(result.error);
        }
    } catch (e) {
        return err(toErrorMessage(e));
    }
}

/**
 * Step 2 — the worker picks their email and a new password. Re-verifies the
 * Worker ID pair so a claim token alone is never enough, creates or updates the
 * Firebase user, then closes the Worker ID path for good.
 */
export async function completeWorkerIdClaim(input: {
    workerId: string;
    legacyPassword: string;
    email: string;
    newPassword: string;
}): Promise<ActionResponse<{ email: string }>> {
    try {
        const email = input.email.trim().toLowerCase();

        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            return err('Enter a valid email address.');
        }
        if (input.newPassword.length < 8) {
            return err('Choose a password of at least 8 characters.');
        }

        const check = await checkWorkerIdCredentials(input.workerId, input.legacyPassword);
        if (check.status === 'already_claimed') {
            return err('This Worker ID has already been set up. Please sign in with your email.');
        }
        if (check.status !== 'needs_claim') {
            return err(check.error);
        }

        if (await isEmailTaken(email, check.workerRowId)) {
            return err('That email is already used by another worker.');
        }

        // Reuse the Firebase account attached to the worker's current address
        // when there is one, so the same uid survives the email change.
        const existing = check.suggestedEmail ? await findFirebaseUser(check.suggestedEmail) : null;
        const atNewAddress = await findFirebaseUser(email);

        if (atNewAddress && (!existing || atNewAddress.uid !== existing.uid)) {
            return err('That email is already registered. Please sign in with it instead.');
        }

        if (existing) {
            await firebaseAdminAuth.updateUser(existing.uid, {
                email,
                password: input.newPassword,
                emailVerified: true,
            });
        } else {
            await firebaseAdminAuth.createUser({
                email,
                password: input.newPassword,
                emailVerified: true,
            });
        }

        await commitWorkerEmailClaim(check.workerRowId, email);

        return ok({ email });
    } catch (e) {
        return err(toErrorMessage(e));
    }
}
