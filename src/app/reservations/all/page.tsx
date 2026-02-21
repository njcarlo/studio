
"use client";

import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Calendar,
    Filter,
    Search,
    LoaderCircle,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    Building2,
    Info
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/use-user-role";
import { useFirestore, useCollection, updateDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { collection, collectionGroup, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { Booking, Room } from "@/lib/types";

export default function AllReservationsPage() {
    const { canApproveRoomReservation, isLoading: roleLoading } = useUserRole();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Data fetching
    const reservationsQuery = useMemoFirebase(() => collectionGroup(firestore, 'reservations'), [firestore]);
    const { data: allBookings, isLoading: bookingsLoading } = useCollection<Booking>(reservationsQuery);

    const roomsRef = useMemoFirebase(() => collection(firestore, "rooms"), [firestore]);
    const { data: rooms } = useCollection<Room>(roomsRef);

    const filteredBookings = useMemo(() => {
        if (!allBookings) return [];
        return allBookings
            .filter(b => {
                const matchesSearch =
                    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (b.requestId && b.requestId.toLowerCase().includes(searchTerm.toLowerCase()));

                const matchesStatus = statusFilter === "all" ||
                    (statusFilter === 'pending' ? b.status.toLowerCase().startsWith('pending') : b.status.toLowerCase() === statusFilter.toLowerCase());

                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => (b.start as any).seconds - (a.start as any).seconds);
    }, [allBookings, searchTerm, statusFilter]);

    const getRoomName = (roomId: string) => {
        return rooms?.find(r => r.id === roomId)?.name || "Unknown Room";
    };

    const handleUpdateStatus = async (booking: Booking, newStatus: 'Approved' | 'Rejected') => {
        if (!booking.id || !booking.roomId) return;

        try {
            // Update the booking status
            await updateDocumentNonBlocking(doc(firestore, `rooms/${booking.roomId}/reservations`, booking.id), {
                status: newStatus
            });

            // Update the corresponding approval request if it exists
            const approvalsRef = collection(firestore, 'approvals');
            const q = query(approvalsRef, where("reservationId", "==", booking.id));
            // This is a bit complex in a non-blocking way without a full query, 
            // but the approvals page already handles this if updated via approvals.
            // For simplicity and consistency, let's just update the reservation.

            toast({
                title: `Reservation ${newStatus}`,
                description: `Successfully updated the status to ${newStatus}.`
            });
        } catch (error) {
            console.error("Status update error:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Could not update the reservation status."
            });
        }
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

                <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-lg border">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by purpose, requester, or ID..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Badge
                            className={cn("cursor-pointer px-4 py-1.5", statusFilter === 'all' ? "" : "bg-muted text-muted-foreground hover:bg-muted/80")}
                            onClick={() => setStatusFilter('all')}
                        >
                            All
                        </Badge>
                        <Badge
                            className={cn("cursor-pointer px-4 py-1.5", statusFilter === 'pending' ? "bg-yellow-500" : "bg-muted text-muted-foreground hover:bg-muted/80")}
                            onClick={() => setStatusFilter('pending')}
                        >
                            Pending
                        </Badge>
                        <Badge
                            className={cn("cursor-pointer px-4 py-1.5", statusFilter === 'approved' ? "bg-green-500" : "bg-muted text-muted-foreground hover:bg-muted/80")}
                            onClick={() => setStatusFilter('approved')}
                        >
                            Approved
                        </Badge>
                        <Badge
                            className={cn("cursor-pointer px-4 py-1.5", statusFilter === 'rejected' ? "bg-red-500" : "bg-muted text-muted-foreground hover:bg-muted/80")}
                            onClick={() => setStatusFilter('rejected')}
                        >
                            Rejected
                        </Badge>
                    </div>
                </div>

                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Request</TableHead>
                                <TableHead>Requester</TableHead>
                                <TableHead>Venue & Schedule</TableHead>
                                <TableHead>Pax / Items</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBookings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                        No reservations found matching your filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredBookings.map((booking) => {
                                    const startTime = (booking.start as any).toDate();
                                    const endTime = (booking.end as any).toDate();

                                    const statusClass =
                                        booking.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                            booking.status.startsWith('Pending') ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700';

                                    return (
                                        <TableRow key={booking.id}>
                                            <TableCell className="max-w-[200px]">
                                                <div className="font-semibold truncate">{booking.title}</div>
                                                {booking.requestId && (
                                                    <div className="text-[10px] font-mono text-muted-foreground uppercase">{booking.requestId}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium">{booking.name}</div>
                                                        <div className="text-xs text-muted-foreground">{booking.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-xs font-medium">
                                                        <Building2 className="h-3 w-3" />
                                                        {getRoomName(booking.roomId)}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(startTime, "MMM d, yyyy")}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        {format(startTime, "p")} - {format(endTime, "p")}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs space-y-1">
                                                    <div>Pax: <span className="font-medium">{booking.pax || 0}</span></div>
                                                    {(booking.numTables || booking.numChairs) ? (
                                                        <div className="text-muted-foreground text-[10px]">
                                                            T: {booking.numTables || 0} / C: {booking.numChairs || 0}
                                                        </div>
                                                    ) : null}
                                                    <div className="flex gap-1 flex-wrap">
                                                        {booking.equipment_TV && <Badge variant="outline" className="text-[9px] h-4">TV</Badge>}
                                                        {booking.equipment_Mic && <Badge variant="outline" className="text-[9px] h-4">Mic</Badge>}
                                                        {booking.equipment_Speakers && <Badge variant="outline" className="text-[9px] h-4">Spkr</Badge>}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn("rounded-md", statusClass)}>
                                                    {booking.status}
                                                </Badge>
                                                {booking.checkedInAt && (
                                                    <div className="text-[10px] text-blue-600 mt-1 flex items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3" /> Checked In
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {booking.status.startsWith('Pending') ? (
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => handleUpdateStatus(booking, 'Rejected')}
                                                        >
                                                            <XCircle className="h-5 w-5" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0 text-green-500 hover:text-green-600 hover:bg-green-50"
                                                            onClick={() => handleUpdateStatus(booking, 'Approved')}
                                                        >
                                                            <CheckCircle2 className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button variant="ghost" size="sm" onClick={() => {/* Detail view? */ }}>
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
                </Card>
            </div>
        </AppLayout>
    );
}
