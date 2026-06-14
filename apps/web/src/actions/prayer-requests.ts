"use server";

import { revalidatePath } from 'next/cache';
import { withPublicAction, resolveCallerCtx } from '@/lib/auth/with-permission';
import * as PrayerRequestsService from '@/services/prayer-requests';

function assertCanManagePastoral(ctx: { isSuperAdmin: boolean; permissions: Set<string> }) {
    if (!ctx.isSuperAdmin && !ctx.permissions.has('pastoral:manage')) {
        throw new Error('You do not have permission to do this.');
    }
}

export const submitPrayerRequest = withPublicAction(async (input: PrayerRequestsService.PrayerRequestInput) => {
    return PrayerRequestsService.createPrayerRequest(input);
});

export const getPrayerRequestsAction = withPublicAction(async () => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');
    assertCanManagePastoral(ctx);

    return PrayerRequestsService.getPrayerRequests();
});

export const updatePrayerRequestStatusAction = withPublicAction(
    async (id: string, data: PrayerRequestsService.UpdatePrayerRequestInput) => {
        const ctx = await resolveCallerCtx();
        if (!ctx) throw new Error('You must be logged in to do this.');
        assertCanManagePastoral(ctx);

        const request = await PrayerRequestsService.updatePrayerRequestStatus(id, data);
        revalidatePath('/pastoral');
        return request;
    },
);
