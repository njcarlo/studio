"use client";

import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardTitle, CardDescription } from "@studio/ui";
import { Button } from "@studio/ui";
import { Badge } from "@studio/ui";
import {
    Calendar,
    Clock,
    MapPin,
    CheckCircle2,
    Timer,
    XCircle,
    LoaderCircle,
    ScanLine,
    Info,
    Users,
    Building2
} from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@studio/ui";
import { Separator } from "@studio/ui";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/use-user-role";
import { useAuthStore } from "@studio/store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getBookings, getRooms, getVenueElements, updateBooking, createScanLog } from "@/actions/db";
import { format, isAfter, isBefore, subMinutes } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { VenueElement } from "@studio/types";

export default function MyReservationsPage() {
    const { user } = useAuthStore();
    const { workerProfile, isLoading: roleLoading } = useUserRole();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const { data: allBookings, isLoading: bookingsLoading } = useQuery({
        queryKey: ["bookings"],
        queryFn: () => getBookings(),
    });

    const { data: rooms } = useQuery({
        queryKey: ["rooms"],
        queryFn: getRooms,
    });

    const { data: venueElements } = useQuery({
        queryKey: ["venue-elements"],
        queryFn: getVenueElements,
    });

    const myBookings = useMemo(() => {
        if (!allBookings) return [];
        return (allBookings as any[])
            .filter((b: any) => {
                const matchesProfile = workerProfile && b.workerProfileId === workerProfile.id;
                const matchesEmail = user?.email && (b.email === user.email || b.requesterEmail === user.email);
                return matchesProfile || matchesEmail;
            })
            .sort((a: any, b: any) => new Date(b.start).getTime() - new Date(a.start).getTime());
    }, [allBookings, workerProfile, user]);

    const getRoomName = (roomId: string) => {
        return (rooms as any[])?.find((r: any) => r.id === roomId)?.name || "Unknown Room";
    };

    const handleCheckIn = async (booking: any) => {
        if (!booking.id) return;

        try {
            await updateBooking(booking.id, { checkedInAt: new Date() });

            await createScanLog({
                scannerId: workerProfile?.id || "system-admin",
                scannerName: workerProfile ? `${workerProfile.firstName} ${workerProfile.lastName}` : "System Admin",
                scanType: 'Room Check-in',
                details: `Self check-in for: ${booking.title}`,
                reservationId: booking.id,
                targetUserId: workerProfile?.id,
                targetUserName: workerProfile ? `${workerProfile.firstName} ${workerProfile.lastName}` : undefined,
            });

            queryClient.invalidateQueries({ queryKey: ['bookings'] });
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

    const canCheckIn = (booking: any) => {
        if (booking.status !== 'Approved' || booking.checkedInAt) return false;
        const now = new Date();
        const start = new Date(booking.start);
        const end = new Date(booking.end);
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
                        {myBookings.map((booking: any) => {
                            const startTime = new Date(booking.start);
                            const endTime = new Date(booking.end);
                            const isUpcoming = isAfter(startTime, new Date());
                            const isPast = isBefore(endTime, new Date());

                            const statusColor =
                                booking.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                    booking.status.startsWith('Pending') ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

                            return (
                                <Card key={booking.id} className={cn(
                                    "transition-all border-l-4",
                                    booking.status === 'Approved' ? "border-l-green-500" :
                                        booking.status.startsWith('Pending') ? "border-l-yellow-500" : "border-l-red-500"
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
                                                        <span>Requested on: {booking.dateRequested ? format(new Date(booking.dateRequested), "PP") : "N/A"}</span>
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
                                                        Checked in at {format(new Date(booking.checkedInAt), "p")}
                                                    </div>
                                                ) : isPast && booking.status === 'Approved' ? (
                                                    <div className="text-center text-xs text-muted-foreground bg-muted p-2 rounded">
                                                        Reservation Completed
                                                    </div>
                                                ) : null}

                                                <Button variant="outline" className="w-full" onClick={() => {
                                                    setSelectedBooking(booking);
                                                    setIsDetailsOpen(true);
                                                }}>
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

                <BookingDetailsSheet
                    isOpen={isDetailsOpen}
                    onClose={() => setIsDetailsOpen(false)}
                    booking={selectedBooking}
                    roomName={selectedBooking ? getRoomName(selectedBooking.roomId) : ""}
                    venueElements={(venueElements as any[]) || []}
                />
            </div>
        </AppLayout>
    );
}

const BookingDetailsSheet = ({ isOpen, onClose, booking, roomName, venueElements }: { isOpen: boolean; onClose: () => void; booking: any | null; roomName: string; venueElements: any[]; }) => {
    if (!booking) return null;

    const startTime = new Date(booking.start);
    const endTime = new Date(booking.end);

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge className={cn(
                            "px-2 py-0.5",
                            booking.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                booking.status.startsWith('Pending') ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        )}>
                            {booking.status}
                        </Badge>
                        {booking.requestId && (
                            <span className="text-xs font-mono text-muted-foreground">ID: {booking.requestId}</span>
                        )}
                    </div>
                    <SheetTitle className="text-2xl font-headline font-bold">{booking.title}</SheetTitle>
                    <SheetDescription>Reservation Details & Requirements</SheetDescription>
                </SheetHeader>

                <div className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm">
                            <MapPin className="h-4 w-4 text-primary" />
                            <div>
                                <p className="font-semibold">{roomName}</p>
                                <p className="text-muted-foreground text-xs">Venue Location</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar className="h-4 w-4 text-primary" />
                            <div>
                                <p className="font-semibold">{format(startTime, "PPPP")}</p>
                                <p className="text-muted-foreground text-xs">Event Date</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Clock className="h-4 w-4 text-primary" />
                            <div>
                                <p className="font-semibold">{format(startTime, "p")} - {format(endTime, "p")}</p>
                                <p className="text-muted-foreground text-xs">Reserved Time</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Purpose</h4>
                        <p className="text-sm leading-relaxed">{booking.purpose || "No description provided."}</p>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-lg font-bold">{booking.pax}</p>
                            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Pax</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <Building2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-lg font-bold">{booking.numTables || 0}</p>
                            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Tables</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <Info className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-lg font-bold">{booking.numChairs || 0}</p>
                            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Chairs</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Requested Elements</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {booking.requestedElements && booking.requestedElements.length > 0 ? (
                                booking.requestedElements.map((elId: string) => {
                                    const el = venueElements.find((v: any) => v.id === elId);
                                    return (
                                        <div key={elId} className="flex items-center gap-2 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            <span>{el ? el.name : elId} <span className="text-xs text-muted-foreground ml-1">({el?.category || "Unknown"})</span></span>
                                        </div>
                                    );
                                })
                            ) : null}

                            {(!booking.requestedElements || booking.requestedElements.length === 0) && (
                                <>
                                    {booking.equipment_TV && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            <span>Television / Display (Legacy)</span>
                                        </div>
                                    )}
                                    {booking.equipment_Mic && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            <span>Microphone System (Legacy)</span>
                                        </div>
                                    )}
                                    {booking.equipment_Speakers && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            <span>Sound System / Speakers (Legacy)</span>
                                        </div>
                                    )}
                                    {!booking.equipment_TV && !booking.equipment_Mic && !booking.equipment_Speakers && (
                                        <p className="text-sm text-muted-foreground italic">No elements requested.</p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Timer className="h-3 w-3" />
                            <span>Requested on: {booking.dateRequested ? format(new Date(booking.dateRequested), "PPP p") : "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>Requested by: {booking.name}</span>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full mt-4" onClick={onClose}>Close Details</Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};
