"use server";

import { revalidatePath } from 'next/cache';
import { withPublicAction, resolveCallerCtx } from '@/lib/auth/with-permission';
import * as SermonsService from '@/services/sermons';

function assertCanManageContent(ctx: { isSuperAdmin: boolean; permissions: Set<string> }) {
    if (!ctx.isSuperAdmin && !ctx.permissions.has('content:manage')) {
        throw new Error('You do not have permission to do this.');
    }
}

export const getSermons = withPublicAction(async () => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');
    assertCanManageContent(ctx);

    return SermonsService.listSermons();
});

export const getPublicSermons = withPublicAction(async () => {
    return SermonsService.listPublicSermons();
});

export const getPublicSermon = withPublicAction(async (id: string) => {
    const sermon = await SermonsService.getPublicSermon(id);
    if (!sermon) throw new Error('Sermon not found');
    return sermon;
});

export const createSermonAction = withPublicAction(async (data: SermonsService.SermonInput) => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');
    assertCanManageContent(ctx);

    const sermon = await SermonsService.createSermon(ctx.workerId, data);
    revalidatePath('/sermons');
    revalidatePath('/public/sermons');
    return sermon;
});

export const updateSermonAction = withPublicAction(async (id: string, data: Partial<SermonsService.SermonInput>) => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');
    assertCanManageContent(ctx);

    const sermon = await SermonsService.updateSermon(id, data);
    revalidatePath('/sermons');
    revalidatePath('/public/sermons');
    return sermon;
});

export const deleteSermonAction = withPublicAction(async (id: string) => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');
    assertCanManageContent(ctx);

    await SermonsService.deleteSermon(id);
    revalidatePath('/sermons');
    revalidatePath('/public/sermons');
});
