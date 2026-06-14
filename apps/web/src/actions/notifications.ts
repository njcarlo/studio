"use server";

import { revalidatePath } from 'next/cache';
import { withPublicAction, resolveCallerCtx } from '@/lib/auth/with-permission';
import * as NotificationCenter from '@/services/notification-center';

// In-app notification centre + preferences (Layer 3) — self-service, scoped
// to the caller.

export const getMyNotifications = withPublicAction(async () => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');
    return NotificationCenter.getNotifications(ctx.workerId);
});

export const getMyUnreadNotificationCount = withPublicAction(async () => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');
    return NotificationCenter.getUnreadCount(ctx.workerId);
});

export const markNotificationRead = withPublicAction(async (id: string) => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');
    await NotificationCenter.markNotificationRead(ctx.workerId, id);
    revalidatePath('/');
});

export const markAllNotificationsRead = withPublicAction(async () => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');
    await NotificationCenter.markAllNotificationsRead(ctx.workerId);
    revalidatePath('/');
});

export const getMyNotificationPreference = withPublicAction(async () => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');
    return NotificationCenter.getNotificationPreference(ctx.workerId);
});

export const updateMyNotificationPreference = withPublicAction(async (emailEnabled: boolean) => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');
    const result = await NotificationCenter.setNotificationPreference(ctx.workerId, emailEnabled);
    revalidatePath('/profile');
    return result;
});
