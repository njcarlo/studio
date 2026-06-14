'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getMyNotifications,
    getMyUnreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    getMyNotificationPreference,
    updateMyNotificationPreference,
} from '@/actions/notifications';

const NOTIFICATIONS_POLL_MS = 60_000;

export function useMyNotifications() {
    const qc = useQueryClient();
    const listKey = ['my-notifications'];
    const countKey = ['my-notifications-unread-count'];

    const { data: notifications, isLoading } = useQuery({
        queryKey: listKey,
        queryFn: async () => {
            const res = await getMyNotifications();
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        refetchInterval: NOTIFICATIONS_POLL_MS,
    });

    const { data: unreadCount } = useQuery({
        queryKey: countKey,
        queryFn: async () => {
            const res = await getMyUnreadNotificationCount();
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        refetchInterval: NOTIFICATIONS_POLL_MS,
    });

    const invalidate = () => {
        qc.invalidateQueries({ queryKey: listKey });
        qc.invalidateQueries({ queryKey: countKey });
    };

    const markReadMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await markNotificationRead(id);
            if (!res.success) throw new Error(res.error);
        },
        onSuccess: invalidate,
    });

    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            const res = await markAllNotificationsRead();
            if (!res.success) throw new Error(res.error);
        },
        onSuccess: invalidate,
    });

    return {
        isLoading,
        notifications: notifications || [],
        unreadCount: unreadCount || 0,
        markRead: markReadMutation.mutateAsync,
        markAllRead: markAllReadMutation.mutateAsync,
    };
}

export function useMyNotificationPreference() {
    const qc = useQueryClient();
    const key = ['my-notification-preference'];

    const { data, isLoading } = useQuery({
        queryKey: key,
        queryFn: async () => {
            const res = await getMyNotificationPreference();
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (emailEnabled: boolean) => {
            const res = await updateMyNotificationPreference(emailEnabled);
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });

    return {
        isLoading,
        emailEnabled: data?.emailEnabled ?? true,
        setEmailEnabled: updateMutation.mutateAsync,
    };
}
