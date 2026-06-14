"use server";

import { revalidatePath } from 'next/cache';
import { withPublicAction, resolveCallerCtx } from '@/lib/auth/with-permission';
import * as AvailabilityService from '@/services/availability';

// Worker-managed availability (SRD 5.2.2) — self-service, scoped to the caller.

export const getMyAvailability = withPublicAction(async () => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');
    return AvailabilityService.getAvailability(ctx.workerId);
});

export const setRecurringUnavailability = withPublicAction(async (days: number[]) => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');
    const result = await AvailabilityService.setRecurringUnavailability(ctx.workerId, days);
    revalidatePath('/my-schedule');
    return result;
});

export const addOneTimeUnavailability = withPublicAction(async (date: Date, note?: string) => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');
    const result = await AvailabilityService.addOneTimeUnavailability(ctx.workerId, date, note);
    revalidatePath('/my-schedule');
    return result;
});

export const removeUnavailability = withPublicAction(async (id: string) => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');
    await AvailabilityService.removeUnavailability(ctx.workerId, id);
    revalidatePath('/my-schedule');
});
