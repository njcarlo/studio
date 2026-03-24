"use client";

import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import { Button } from "@studio/ui";
import { Badge } from "@studio/ui";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@studio/ui";
import {
    Calendar,
    Search,
    LoaderCircle,
    CheckCircle2,
    XCircle,
    Clock,
    Building2,
} from "lucide-react";
import { Input } from "@studio/ui";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/use-user-role";
import { useQuery } from "@tanstack/react-query";
import { getBookings, getRooms, getVenueElements } from "@/actions/db";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useBookingMutations } from "@/hooks/use-booking-mutations";
import type { Booking, VenueElement } from "@studio/types";

export default function AllReservationsPage() {
    const { canApproveRoomReservation, isLoading: roleLoading } = useUserRole();
    const { toast } = useToast();

    const { updateStatus, isUpdatingStatus } = useBookingMutations();

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

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

    const filteredBookings = useMemo(() => {
        if (!allBookings) return [];
        return allBookings
            .filter((b: any) => {
                const matchesSearch =
                    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (b.requestId && b.requestId.toLowerCase().includes(searchTerm.toLowerCase()));

                const matchesStatus = statusFilter === "all" ||
                    (statusFilter === 'pending' ? b.status.toLowerCase().startsWith('pending') : b.status.toLowerCase() === statusFilter.toLowerCase());

                return matchesSearch && matchesStatus;
            })
            .sort((a: any, b: any) => new Date(b.start).getTime() - new Date(a.start).getTime());
    }, [allBookings, searchTerm, statusFilter]);

    const getRoomName = (roomId: string) => {
        return (rooms as any[])?.find((r: any) => r.id === roomId)?.name || "Unknown Room";
    };

    const handleUpdateStatus = (booking: any, newStatus: 'Approved' | 'Rejected') => {
        updateStatus({ booking, newStatus });
    };

    if (roleLoading || bookingsLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center py-20">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AppLayout>
        );
    }

    if (!canApproveRoomReservation) {
        return (
            <AppLayout>
                <Card className="max-w-md mx-auto mt-20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-500" />
                            Access Denied
                        </CardTitle>
                        <CardDescription>
                            You do not have the required permissions (Admin or Admin Assistant) to view all reservations.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full" onClick={() => window.location.href = '/dashboard'}>
                            Return to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-headline font-bold">All Reservations</h1>
                        <p className="text-muted-foreground">Admin view of all facility reservation requests across the system.</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3 items-center bg-card p-3 rounded-lg border">
                    <div className="relative flex-grow w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by purpose, requester, or ID..."
                            className="pl-10 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Badge
                            className={cn("cursor-pointer px-3 py-1 text-xs", statusFilter === 'all' ? "" : "bg-muted text-muted-foreground hover:bg-muted/80")}
                            onClick={() => setStatusFilter('all')}
                        >
                            All
                        </Badge>
                        <Badge
                            className={cn("cursor-pointer px-3 py-1 text-xs", statusFilter === 'pending' ? "bg-yellow-500" : "bg-muted text-muted-foreground hover:bg-muted/80")}
                            onClick={() => setStatusFilter('pending')}
                        >
                            Pending
                        </Badge>
                        <Badge
                            className={cn("cursor-pointer px-3 py-1 text-xs", statusFilter === 'approved' ? "bg-green-500" : "bg-muted text-muted-foreground hover:bg-muted/80")}
                            onClick={() => setStatusFilter('approved')}
                        >
                            Approved
                        </Badge>
                        <Badge
                            className={cn("cursor-pointer px-3 py-1 text-xs", statusFilter === 'rejected' ? "bg-red-500" : "bg-muted text-muted-foreground hover:bg-muted/80")}
                            onClick={() => setStatusFilter('rejected')}
                        >
                            Rejected
                        </Badge>
                    </div>
                </div>

                <div className="rounded-lg border overflow-hidden bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="h-9 px-3 text-xs">Request</TableHead>
                                <TableHead className="h-9 px-3 text-xs">Requester</TableHead>
                                <TableHead className="h-9 px-3 text-xs">Venue & Schedule</TableHead>
                                <TableHead className="h-9 px-3 text-xs">Pax / Items</TableHead>
                                <TableHead className="h-9 px-3 text-xs">Status</TableHead>
                                <TableHead className="h-9 px-3 text-xs text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBookings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                                        No reservations found matching your filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredBookings.map((booking: any) => {
                                    const startTime = new Date(booking.start);
                                    const endTime = new Date(booking.end);

                                    const statusClass =
                                        booking.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            booking.status.startsWith('Pending') ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

                                    return (
                                        <TableRow key={booking.id}>
                                            <TableCell className="py-2 px-3 max-w-[200px]">
                                                <div className="font-medium text-sm truncate">{booking.title}</div>
                                                {booking.requestId && (
                                                    <div className="text-[10px] font-mono text-muted-foreground">{booking.requestId}</div>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-2 px-3">
                                                <div className="text-sm font-medium">{booking.name}</div>
                                                <div className="text-xs text-muted-foreground">{booking.email}</div>
                                            </TableCell>
                                            <TableCell className="py-2 px-3">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-1.5 text-sm font-medium">
                                                        <Building2 className="h-3 w-3 text-muted-foreground" />
                                                        {getRoomName(booking.roomId)}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(startTime, "MMM d, yyyy")}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        {format(startTime, "p")} – {format(endTime, "p")}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2 px-3">
                                                <div className="text-xs space-y-0.5">
                                                    <div>Pax: <span className="font-medium">{booking.pax || 0}</span></div>
                                                    {(booking.numTables || booking.numChairs) ? (
                                                        <div className="text-muted-foreground">
                                                            T: {booking.numTables || 0} / C: {booking.numChairs || 0}
                                                        </div>
                                                    ) : null}
                                                    <div className="flex gap-1 flex-wrap">
                                                        {booking.requestedElements?.map((elId: string) => {
                                                            const el = (venueElements as any[])?.find((v: any) => v.id === elId);
                                                            let shortName = el?.name || elId;
                                                            if (shortName.length > 8) shortName = shortName.substring(0, 6) + '..';
                                                            return <Badge key={elId} variant="outline" className="text-[9px] h-4 px-1">{shortName}</Badge>;
                                                        })}
                                                        {booking.equipment_TV && <Badge variant="outline" className="text-[9px] h-4 px-1">TV</Badge>}
                                                        {booking.equipment_Mic && <Badge variant="outline" className="text-[9px] h-4 px-1">Mic</Badge>}
                                                        {booking.equipment_Speakers && <Badge variant="outline" className="text-[9px] h-4 px-1">Spkr</Badge>}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2 px-3">
                                                <Badge className={cn("rounded-md text-xs", statusClass)}>
                                                    {booking.status}
                                                </Badge>
                                                {booking.checkedInAt && (
                                                    <div className="text-[10px] text-blue-600 mt-1 flex items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3" /> Checked In
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-2 px-3 text-right">
                                                {booking.status.startsWith('Pending') ? (
                                                    <div className="flex justify-end gap-1.5">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => handleUpdateStatus(booking, 'Rejected')}
                                                            disabled={isUpdatingStatus}
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 w-7 p-0 text-green-500 hover:text-green-600 hover:bg-green-50"
                                                            onClick={() => handleUpdateStatus(booking, 'Approved')}
                                                            disabled={isUpdatingStatus}
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => {}}>
                                                        View
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
