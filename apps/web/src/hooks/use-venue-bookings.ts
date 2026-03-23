'use client';

import { useQuery } from '@tanstack/react-query';
import {
    getVenueBookings,
    getMyVenueBookings,
    getVenueBooking,
} from '@/actions/venue-assistance';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const venueBookingKeys = {
    all: ['venueBookings'] as const,
    mine: (workerProfileId: string) => ['venueBookings', 'mine', workerProfileId] as const,
    detail: (bookingId: string) => ['venueBookings', 'detail', bookingId] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Fetch all venue bookings. */
export function useVenueBookings() {
    const { data, isLoading, error } = useQuery({
        queryKey: venueBookingKeys.all,
        queryFn: getVenueBookings,
    });

    return {
        bookings: data ?? [],
        isLoading,
        error,
    };
}

/** Fetch bookings for a specific worker profile. */
export function useMyVenueBookings(workerProfileId: string) {
    const { data, isLoading, error } = useQuery({
        queryKey: venueBookingKeys.mine(workerProfileId),
        queryFn: () => getMyVenueBookings(workerProfileId),
        enabled: !!workerProfileId,
    });

    return {
        bookings: data ?? [],
        isLoading,
        error,
    };
}

/** Fetch a single booking with its assistance requests and audit logs. */
export function useVenueBooking(bookingId: string) {
    const { data, isLoading, error } = useQuery({
        queryKey: venueBookingKeys.detail(bookingId),
        queryFn: () => getVenueBooking(bookingId),
        enabled: !!bookingId,
    });

    return {
        booking: data ?? null,
        isLoading,
        error,
    };
}
