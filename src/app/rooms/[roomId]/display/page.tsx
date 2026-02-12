"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { collection, doc, query, where, Timestamp } from 'firebase/firestore';
import type { Room, Booking, User, Location } from '@/lib/types';
import { format, isToday } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, DoorOpen, VideoOff, LoaderCircle } from 'lucide-react';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';

const ClockComponent = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="text-3xl sm:text-4xl lg:text-5xl font-bold font-mono">
            {format(time, 'h:mm:ss a')}
        </div>
    );
};

export default function RoomDisplayPage() {
    const params = useParams();
    const roomId = params.roomId as string;
    const firestore = useFirestore();

    const roomRef = useMemoFirebase(() => doc(firestore, 'rooms', roomId), [firestore, roomId]);
    const { data: room, isLoading: roomLoading } = useDoc<Room>(roomRef);
    
    const locationsRef = useMemoFirebase(() => collection(firestore, 'locations'), [firestore]);
    const { data: locations, isLoading: locationsLoading } = useCollection<Location>(locationsRef);

    const bookingsRef = useMemoFirebase(() => query(collection(firestore, 'rooms', roomId, 'reservations'), where('status', '==', 'Approved')), [firestore, roomId]);
    const { data: allBookings, isLoading: bookingsLoading } = useCollection<Booking>(bookingsRef);

    const usersRef = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
    const { data: users, isLoading: usersLoading } = useCollection<User>(usersRef);

    const todaysBookings = allBookings
        ?.map(b => ({ ...b, start: (b.start as any).toDate(), end: (b.end as any).toDate() }))
        .filter(b => isToday(b.start))
        .sort((a, b) => a.start.getTime() - b.start.getTime()) || [];

    const isLoading = roomLoading || bookingsLoading || usersLoading || locationsLoading;
    const location = locations?.find(l => l.id === room?.locationId);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
                <LoaderCircle className="h-12 w-12 animate-spin" />
            </div>
        );
    }
    
    if (!room) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold">Room Not Found</h1>
                </div>
            </div>
        )
    }

    const now = new Date();
    const currentBooking = todaysBookings.find(b => now >= b.start && now <= b.end);
    const nextBooking = todaysBookings.find(b => now < b.start);
    
    const qrCodeUrl = currentBooking ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`ROOM_CHECKIN:${currentBooking.id}`)}&bgcolor=374151&color=ffffff&qzone=1` : '';

    const getUserName = (userId: string) => {
        const user = users?.find(w => w.id === userId);
        return user ? `${user.firstName} ${user.lastName}` : userId;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 flex flex-col">
            <header className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
                <div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-headline">{room.name}</h1>
                    {location && <p className="text-xl sm:text-2xl text-gray-300">{location.name}</p>}
                    <p className="text-lg sm:text-xl lg:text-2xl text-gray-400 flex items-center gap-2 mt-2">
                        <Calendar className="h-6 w-6" />
                        {format(new Date(), 'EEEE, MMMM do')}
                    </p>
                </div>
                <div className="text-left sm:text-right">
                    <ClockComponent />
                </div>
            </header>

            <main className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                <Card className={`md:col-span-2 bg-gray-800 border-2 border-gray-700 text-white flex flex-col justify-center items-center p-4 ${currentBooking ? 'border-red-500' : 'border-green-500'}`}>
                    <CardHeader className="items-center text-center">
                        <CardTitle className="text-3xl lg:text-4xl font-headline mb-2">
                            {currentBooking ? 'Room in Use' : 'Room Available'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center w-full">
                        {currentBooking ? (
                            <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8 w-full">
                                <div className="text-center lg:text-left">
                                    <p className="text-2xl lg:text-3xl font-semibold">{currentBooking.title}</p>
                                    <p className="text-xl lg:text-2xl text-gray-300 mt-2">
                                        {format(currentBooking.start, 'h:mm a')} - {format(currentBooking.end, 'h:mm a')}
                                    </p>
                                    <p className="text-lg lg:text-xl text-gray-400 mt-1">Booked by {getUserName((currentBooking as any).workerProfileId)}</p>
                                </div>
                                <div className="flex flex-col items-center gap-2 p-4 bg-gray-700 rounded-lg mt-4 lg:mt-0">
                                    <Image 
                                        src={qrCodeUrl}
                                        alt="Check-in QR Code" 
                                        width={200} 
                                        height={200}
                                        className="rounded-md"
                                    />
                                    <p className="text-sm text-gray-300 font-semibold mt-2">Scan to Check In</p>
                                </div>
                            </div>
                        ) : (
                           <div className="flex flex-col items-center gap-4 py-8">
                             <DoorOpen className="h-16 w-16 md:h-24 md:w-24 text-green-400" />
                             {nextBooking ? (
                                 <p className="text-lg md:text-xl text-gray-300 mt-4">Next booking at {format(nextBooking.start, 'h:mm a')}</p>
                             ) : (
                                <p className="text-lg md:text-xl text-gray-300 mt-4">No more bookings for today</p>
                             )}
                           </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700 text-white">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl lg:text-3xl">Today's Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {todaysBookings.length > 0 ? (
                             <div className="space-y-4">
                                {todaysBookings.map(booking => (
                                    <div key={booking.id} className={`p-4 rounded-lg flex items-start gap-4 ${now >= booking.start && now <= booking.end ? 'bg-red-900/50' : now > booking.end ? 'bg-gray-700 opacity-60' : 'bg-gray-700/50'}`}>
                                        <Clock className="h-5 w-5 mt-1 text-gray-400 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold">{booking.title}</p>
                                            <p className="text-sm text-gray-300">{format(booking.start, 'h:mm a')} - {format(booking.end, 'h:mm a')}</p>
                                            <p className="text-xs text-gray-400">by {getUserName((booking as any).workerProfileId)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-10">
                                <VideoOff className="h-12 w-12 md:h-16 md:h-16 mb-4" />
                                <p>No bookings for today.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
