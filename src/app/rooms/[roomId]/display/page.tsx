"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { rooms, bookings as allBookings } from '@/lib/placeholder-data';
import type { Room, Booking } from '@/lib/types';
import { format, isToday } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, DoorOpen, VideoOff } from 'lucide-react';

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
    const [room, setRoom] = useState<Room | null>(null);
    const [todaysBookings, setTodaysBookings] = useState<Booking[]>([]);

    useEffect(() => {
        const currentRoom = rooms.find(r => r.id === roomId);
        if (currentRoom) {
            setRoom(currentRoom);
        }

        const filteredBookings = allBookings
            .filter(b => b.roomId === roomId && isToday(b.start) && b.status === 'Approved')
            .sort((a, b) => a.start.getTime() - b.start.getTime());
        setTodaysBookings(filteredBookings);

    }, [roomId]);


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
    
    const qrCodeUrl = currentBooking ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`ROOM_CHECKIN:${currentBooking.id}`)}&bgcolor=374151&color=ffffff&qzone=1` : '';

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 flex flex-col">
            <header className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
                <div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-headline">{room.name}</h1>
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
                                    <p className="text-lg lg:text-xl text-gray-400 mt-1">Booked by {currentBooking.workerName}</p>
                                </div>
                                <div className="flex flex-col items-center gap-2 p-3 bg-gray-700 rounded-lg mt-4 lg:mt-0">
                                    <Image 
                                        src={qrCodeUrl}
                                        alt="Check-in QR Code" 
                                        width={120} 
                                        height={120}
                                        className="rounded-md"
                                    />
                                    <p className="text-xs text-gray-300 font-semibold mt-1">Scan to Check In</p>
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
                                            <p className="text-xs text-gray-400">by {booking.workerName}</p>
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
