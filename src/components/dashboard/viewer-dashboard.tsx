"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, collectionGroup, query, where, Timestamp } from 'firebase/firestore';
import { format, isToday, isAfter } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, QrCode, Calendar, ArrowRight } from 'lucide-react';
import type { Booking, Room } from '@/lib/types';

export function ViewerDashboard() {
    const { user } = useUser();
    const firestore = useFirestore();

    const userQrCodeUrl = user ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(user.uid)}` : '';

    const roomsRef = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, 'rooms');
    }, [firestore, user]);
    const { data: rooms, isLoading: roomsLoading } = useCollection<Room>(roomsRef);

    const bookingsQuery = useMemoFirebase(() => {
        if (!user) return null;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        return query(
            collectionGroup(firestore, 'reservations'),
            where('workerProfileId', '==', user.uid),
            where('status', '==', 'Approved'),
            where('start', '>=', Timestamp.fromDate(todayStart))
        );
    }, [firestore, user]);
    const { data: bookings, isLoading: bookingsLoading } = useCollection<Booking>(bookingsQuery);

    const upcomingBookings = bookings
        ?.map(b => ({ ...b, start: (b.start as any).toDate(), end: (b.end as any).toDate() }))
        .filter(b => isToday(b.start) || isAfter(b.start, new Date()))
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .slice(0, 3) || [];

    const getRoomName = (roomId: string) => {
        return rooms?.find(r => r.id === roomId)?.name || 'Unknown Room';
    };

    const isLoading = bookingsLoading || roomsLoading;

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 flex flex-col items-center justify-center text-center">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2 mx-auto"><QrCode /> Your Personal QR Code</CardTitle>
                    <CardDescription>Use this for attendance and meal stubs.</CardDescription>
                </CardHeader>
                <CardContent>
                    {userQrCodeUrl ? (
                        <Link href="/attendance">
                            <Image src={userQrCodeUrl} alt="Your personal QR code" width={150} height={150} />
                        </Link>
                    ) : (
                        <LoaderCircle className="h-10 w-10 animate-spin" />
                    )}
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Calendar /> Upcoming Bookings</CardTitle>
                    <CardDescription>Your next three approved room reservations.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-24">
                            <LoaderCircle className="h-6 w-6 animate-spin" />
                        </div>
                    ) : upcomingBookings.length > 0 ? (
                        <div className="space-y-4">
                            {upcomingBookings.map(booking => (
                                <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                                    <div>
                                        <p className="font-semibold">{booking.title}</p>
                                        <p className="text-sm text-muted-foreground">{getRoomName(booking.roomId)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-sm">{format(booking.start, 'MMM d')}</p>
                                        <p className="text-xs text-muted-foreground">{format(booking.start, 'p')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center h-24 text-muted-foreground">
                            <p>You have no upcoming bookings.</p>
                            <Button variant="link" asChild className="mt-2">
                                <Link href="/rooms">Book a room <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
