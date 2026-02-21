
"use client";

import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    Clock,
    MapPin,
    CheckCircle2,
    Timer,
    XCircle,
    LoaderCircle,
    ScanLine,
    Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/use-user-role";
import { useFirestore, useUser, useCollection, updateDocumentNonBlocking, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, collectionGroup, query, where, serverTimestamp, Timestamp as FirebaseTimestamp, doc } from "firebase/firestore";
import { format, isAfter, isBefore, addMinutes, subMinutes } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { Booking, Room } from "@/lib/types";

export default function MyReservationsPage() {
    const { workerProfile, isLoading: roleLoading } = useUserRole();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Data fetching
    const reservationsQuery = useMemoFirebase(() => collectionGroup(firestore, 'reservations'), [firestore]);
    const { data: allBookings, isLoading: bookingsLoading } = useCollection<Booking>(reservationsQuery);

    const roomsRef = useMemoFirebase(() => collection(firestore, "rooms"), [firestore]);
    const { data: rooms } = useCollection<Room>(roomsRef);

    const myBookings = useMemo(() => {
        if (!allBookings || !workerProfile) return [];
        return allBookings
            .filter(b => b.workerProfileId === workerProfile.id)
            .sort((a, b) => (b.start as any).seconds - (a.start as any).seconds);
    }, [allBookings, workerProfile]);

    const getRoomName = (roomId: string) => {
        return rooms?.find(r => r.id === roomId)?.name || "Unknown Room";
    };

    const handleCheckIn = async (booking: Booking) => {
        if (!booking.id || !booking.roomId) return;

        try {
            // Update the reservation document
            await updateDocumentNonBlocking(doc(firestore, `rooms/${booking.roomId}/reservations`, booking.id), {
                checkedInAt: serverTimestamp()
            });

            // Create a scan log
            await addDocumentNonBlocking(collection(firestore, "scan_logs"), {
                scannerId: workerProfile?.id,
                scannerName: `${workerProfile?.firstName} ${workerProfile?.lastName}`,
                timestamp: serverTimestamp(),
                scanType: 'Room Check-in',
                details: `Self check-in for: ${booking.title}`,
                reservationId: booking.id,
                targetUserId: workerProfile?.id,
                targetUserName: `${workerProfile?.firstName} ${workerProfile?.lastName}`
            });

            toast({
                title: "Checked In Successfully",
                description: `You have checked into ${getRoomName(booking.roomId)}.`
            });
        } catch (error) {
            console.error("Check-in error:", error);
            toast({
                variant: "destructive",
                title: "Check-in Failed",
                description: "Could not complete check-in. Please try again."
            });
        }
    };

    const canCheckIn = (booking: Booking) => {
        if (booking.status !== 'Approved' || booking.checkedInAt) return false;

        const now = new Date();
        const start = (booking.start as any).toDate();
        const end = (booking.end as any).toDate();

        // Allow check-in 15 minutes before and anytime during the booking
        const allowStart = subMinutes(start, 15);
        return isAfter(now, allowStart) && isBefore(now, end);
    };

    const isLoading = roleLoading || bookingsLoading;

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-headline font-bold">My Reservations</h1>
                        <p className="text-muted-foreground">Manage and check-in to your requested room bookings.</p>
                    </div>
                    <Button onClick={() => window.location.href = '/reservations/new'}>
                        New Reservation
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : myBookings.length === 0 ? (
                    <Card className="p-12 text-center">
                        <div className="flex justify-center mb-4">
                            <Info className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <CardTitle>No Reservations Found</CardTitle>
                        <CardDescription className="mt-2">
                            You haven't made any room reservations yet.
                        </CardDescription>
                        <Button className="mt-6" variant="outline" onClick={() => window.location.href = '/reservations/new'}>
                            Make your first reservation
                        </Button>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {myBookings.map((booking) => {
                            const startTime = (booking.start as any).toDate();
                            const endTime = (booking.end as any).toDate();
                            const isUpcoming = isAfter(startTime, new Date());
                            const isPast = isBefore(endTime, new Date());

                            const statusColor =
                                booking.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                    booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

                            return (
                                <Card key={booking.id} className={cn(
                                    "transition-all border-l-4",
                                    booking.status === 'Approved' ? "border-l-green-500" :
                                        booking.status === 'Pending' ? "border-l-yellow-500" : "border-l-red-500"
                                )}>
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row justify-between gap-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Badge className={cn("px-2 py-0.5", statusColor)}>
                                                        {booking.status}
                                                    </Badge>
                                                    {booking.checkedInAt && (
                                                        <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50 flex gap-1">
                                                            <CheckCircle2 className="h-3 w-3" /> Checked In
                                                        </Badge>
                                                    )}
                                                    {booking.requestId && (
                                                        <span className="text-xs font-mono text-muted-foreground">#{booking.requestId}</span>
                                                    )}
                                                </div>

                                                <h3 className="text-xl font-bold">{booking.title}</h3>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <MapPin className="h-4 w-4" />
                                                        <span>{getRoomName(booking.roomId)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Calendar className="h-4 w-4" />
                                                        <span>{format(startTime, "PPP")}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Clock className="h-4 w-4" />
                                                        <span>{format(startTime, "p")} - {format(endTime, "p")}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Timer className="h-4 w-4" />
                                                        <span>Requested on: {booking.dateRequested ? format((booking.dateRequested as any).toDate(), "PP") : "N/A"}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col justify-center gap-2 min-w-[150px]">
                                                {canCheckIn(booking) ? (
                                                    <Button onClick={() => handleCheckIn(booking)} className="w-full bg-blue-600 hover:bg-blue-700">
                                                        <ScanLine className="mr-2 h-4 w-4" /> Check In
                                                    </Button>
                                                ) : booking.checkedInAt ? (
                                                    <div className="text-center text-xs text-green-600 font-medium bg-green-50 p-2 rounded border border-green-100">
                                                        Checked in at {format((booking.checkedInAt as any).toDate(), "p")}
                                                    </div>
                                                ) : isPast && booking.status === 'Approved' ? (
                                                    <div className="text-center text-xs text-muted-foreground bg-muted p-2 rounded">
                                                        Reservation Completed
                                                    </div>
                                                ) : null}

                                                <Button variant="outline" className="w-full" onClick={() => {/* TODO: View Details */ }}>
                                                    View Details
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
