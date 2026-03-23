'use client';

import { useQuery } from '@tanstack/react-query';
import {
    getAssistanceRequestsForBooking,
    getAssistanceRequestsForMinistry,
    getCommandCenterData,
    type CommandCenterFilters,
} from '@/actions/venue-assistance';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const assistanceRequestKeys = {
    forBooking: (bookingId: string) => ['assistanceRequests', 'booking', bookingId] as const,
    forMinistry: (ministryId: string) => ['assistanceRequests', 'ministry', ministryId] as const,
    commandCenter: (filters: CommandCenterFilters) => ['assistanceRequests', 'commandCenter', filters] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Fetch all assistance requests for a booking (booking detail view). */
export function useAssistanceRequestsForBooking(bookingId: string) {
    const { data, isLoading, error } = useQuery({
        queryKey: assistanceRequestKeys.forBooking(bookingId),
        queryFn: () => getAssistanceRequestsForBooking(bookingId),
        enabled: !!bookingId,
    });

    return {
        requests: data ?? [],
        isLoading,
        error,
    };
}

/** Fetch all assistance requests for a ministry (ministry head's inbox). */
export function useAssistanceRequestsForMinistry(ministryId: string) {
    const { data, isLoading, error } = useQuery({
        queryKey: assistanceRequestKeys.forMinistry(ministryId),
        queryFn: () => getAssistanceRequestsForMinistry(ministryId),
        enabled: !!ministryId,
    });

    return {
        requests: data ?? [],
        isLoading,
        error,
    };
}

/** Fetch command center data with optional filters (admin view). */
export function useCommandCenterData(filters: CommandCenterFilters = {}) {
    const { data, isLoading, error } = useQuery({
        queryKey: assistanceRequestKeys.commandCenter(filters),
        queryFn: () => getCommandCenterData(filters),
    });

    return {
        requests: data ?? [],
        isLoading,
        error,
    };
}
