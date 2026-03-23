"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { BookingForm } from "@/components/venue-assistance/booking-form";
import { usePermissionsStore } from "@studio/store";
import { useShallow } from "zustand/react/shallow";
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle } from "lucide-react";
import { createVenueBooking, createRecurringBooking } from "@/actions/venue-assistance";
import type { CreateVenueBookingData, CreateRecurringBookingData } from "@/actions/venue-assistance";

export default function VenuePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { isLoading, workerProfile } = usePermissionsStore(
        useShallow((s) => ({
            isLoading: s.isLoading,
            workerProfile: s.workerProfile,
        }))
    );

    const handleSubmit = async (
        data: CreateVenueBookingData | CreateRecurringBookingData,
        isRecurring: boolean,
    ) => {
        setIsSubmitting(true);
        try {
            if (isRecurring) {
                const result = await createRecurringBooking(data as CreateRecurringBookingData);
                toast({
                    title: "Recurring booking created",
                    description: `${result.occurrenceCount} occurrence${result.occurrenceCount !== 1 ? "s" : ""} scheduled. Ministries have been notified.`,
                });
            } else {
                await createVenueBooking(data as CreateVenueBookingData);
                toast({
                    title: "Booking submitted",
                    description: "Your booking has been submitted. Ministries have been notified.",
                });
            }
            router.push("/venue/my");
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Submission failed",
                description: err?.message ?? "Could not submit booking. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center py-10">
                    <LoaderCircle className="h-8 w-8 animate-spin" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-headline font-bold">Book a Venue</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Reserve a room and coordinate ministry assistance for your event.
                </p>
            </div>

            {workerProfile ? (
                <BookingForm
                    workerProfileId={workerProfile.id}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />
            ) : (
                <p className="text-muted-foreground">
                    You must have a worker profile to book a venue.
                </p>
            )}
        </AppLayout>
    );
}
