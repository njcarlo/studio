"use client";

import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LoaderCircle, LineChart, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, collectionGroup, Timestamp } from "firebase/firestore";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, addDays, subWeeks, addWeeks, subMonths, addMonths } from "date-fns";
import type { AttendanceRecord, MealStub, Booking, Worker, Room } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const ReportContainer = ({ children }: { children: React.ReactNode }) => {
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
    const [currentDate, setCurrentDate] = useState(new Date());

    const handlePrev = () => {
        if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1));
        else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
        else setCurrentDate(subMonths(currentDate, 1));
    };

    const handleNext = () => {
        if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
        else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
        else setCurrentDate(addMonths(currentDate, 1));
    };
    
    const handleToday = () => setCurrentDate(new Date());

    const dateRange = useMemo(() => {
        if (viewMode === 'day') return { start: startOfDay(currentDate), end: endOfDay(currentDate) };
        if (viewMode === 'week') return { start: startOfWeek(currentDate), end: endOfWeek(currentDate) };
        return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
    }, [currentDate, viewMode]);

    const dateRangeDisplay = useMemo(() => {
        if (viewMode === 'day') return format(currentDate, 'MMMM d, yyyy');
        if (viewMode === 'week') {
            const start = startOfWeek(currentDate);
            const end = endOfWeek(currentDate);
            return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
        }
        return format(currentDate, 'MMMM yyyy');
    }, [currentDate, viewMode]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                 <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrev}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" onClick={handleToday}>Today</Button>
                    <Button variant="outline" size="icon" onClick={handleNext}><ChevronRight className="h-4 w-4" /></Button>
                    
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn( "w-[240px] justify-start text-left font-normal" )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRangeDisplay}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={currentDate}
                                onSelect={(date) => date && setCurrentDate(date)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="flex items-center gap-2">
                   <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full sm:w-auto">
                        <TabsList>
                            <TabsTrigger value="day">Day</TabsTrigger>
                            <TabsTrigger value="week">Week</TabsTrigger>
                            <TabsTrigger value="month">Month</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>
            
            {React.Children.map(children, child =>
                React.isValidElement(child)
                ? React.cloneElement(child as React.ReactElement<any>, { dateRange })
                : child
            )}
        </div>
    );
};

const AttendanceReport = ({ dateRange }: { dateRange: { start: Date; end: Date }}) => {
    const firestore = useFirestore();
    const { data: workers } = useCollection<Worker>(collection(firestore, "workers"));
    
    const attendanceQuery = useMemoFirebase(() => {
        return query(
            collection(firestore, 'attendance_records'),
            where('time', '>=', Timestamp.fromDate(dateRange.start)),
            where('time', '<=', Timestamp.fromDate(dateRange.end)),
            orderBy('time', 'desc')
        );
    }, [firestore, dateRange]);
    const { data: attendance, isLoading } = useCollection<AttendanceRecord>(attendanceQuery);

    const getWorkerName = (id: string) => {
        const worker = workers?.find(w => w.id === id);
        return worker ? `${worker.firstName} ${worker.lastName}` : 'Unknown';
    }

    const stats = useMemo(() => {
        if (!attendance) return { clockIns: 0, clockOuts: 0 };
        return {
            clockIns: attendance.filter(a => a.type === 'Clock In').length,
            clockOuts: attendance.filter(a => a.type === 'Clock Out').length,
        };
    }, [attendance]);

    return (
        <div className="space-y-4">
             <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Total Clock Ins</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{stats.clockIns}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Total Clock Outs</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{stats.clockOuts}</p></CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader><CardTitle>Attendance Log</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Worker</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && <TableRow><TableCell colSpan={3} className="text-center"><LoaderCircle className="h-6 w-6 animate-spin"/></TableCell></TableRow>}
                            {!isLoading && attendance?.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell>{getWorkerName(log.workerProfileId)}</TableCell>
                                    <TableCell>{log.type}</TableCell>
                                    <TableCell>{format(log.time.toDate(), 'Pp')}</TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && attendance?.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">No records found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
};

const MealStubsReport = ({ dateRange }: { dateRange: { start: Date; end: Date }}) => {
    const firestore = useFirestore();
    
    const mealstubsQuery = useMemoFirebase(() => {
        return query(
            collection(firestore, 'mealstubs'),
            where('date', '>=', Timestamp.fromDate(dateRange.start)),
            where('date', '<=', Timestamp.fromDate(dateRange.end)),
            orderBy('date', 'desc')
        );
    }, [firestore, dateRange]);
    const { data: mealstubs, isLoading } = useCollection<MealStub>(mealstubsQuery);

    const stats = useMemo(() => {
        if (!mealstubs) return { issued: 0, claimed: 0 };
        return {
            issued: mealstubs.length,
            claimed: mealstubs.filter(s => s.status === 'Claimed').length,
        };
    }, [mealstubs]);
    
    return (
        <div className="space-y-4">
             <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Total Issued</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{stats.issued}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Total Claimed</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{stats.claimed}</p></CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader><CardTitle>Meal Stub Log</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Worker</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && <TableRow><TableCell colSpan={3} className="text-center"><LoaderCircle className="h-6 w-6 animate-spin"/></TableCell></TableRow>}
                            {!isLoading && mealstubs?.map(stub => (
                                <TableRow key={stub.id}>
                                    <TableCell>{stub.workerName}</TableCell>
                                    <TableCell>{format(stub.date.toDate(), 'P')}</TableCell>
                                    <TableCell>
                                        <Badge variant={stub.status === 'Issued' ? 'default' : 'secondary'} className={stub.status === 'Issued' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                                            {stub.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                             {!isLoading && mealstubs?.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">No records found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
};

const ReservationsReport = ({ dateRange }: { dateRange: { start: Date; end: Date }}) => {
    const firestore = useFirestore();
    const { data: workers } = useCollection<Worker>(collection(firestore, "workers"));
    const { data: rooms } = useCollection<Room>(collection(firestore, "rooms"));

    const reservationsQuery = useMemoFirebase(() => {
        return query(
            collectionGroup(firestore, 'reservations'),
            where('start', '>=', Timestamp.fromDate(dateRange.start)),
            where('start', '<=', Timestamp.fromDate(dateRange.end)),
            orderBy('start', 'desc')
        );
    }, [firestore, dateRange]);
    const { data: reservations, isLoading } = useCollection<Booking>(reservationsQuery);

    const getWorkerName = (id: string) => {
        const worker = workers?.find(w => w.id === id);
        return worker ? `${worker.firstName} ${worker.lastName}` : 'Unknown';
    }
    const getRoomName = (id: string) => rooms?.find(r => r.id === id)?.name || 'Unknown';

     const stats = useMemo(() => {
        if (!reservations) return { total: 0, approved: 0, pending: 0, rejected: 0 };
        return {
            total: reservations.length,
            approved: reservations.filter(r => r.status === 'Approved').length,
            pending: reservations.filter(r => r.status === 'Pending').length,
            rejected: reservations.filter(r => r.status === 'Rejected').length,
        };
    }, [reservations]);
    
    return (
         <div className="space-y-4">
             <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader><CardTitle>Total</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{stats.total}</p></CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Approved</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{stats.approved}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Pending</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{stats.pending}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Rejected</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{stats.rejected}</p></CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader><CardTitle>Reservations Log</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Room</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Booked By</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && <TableRow><TableCell colSpan={5} className="text-center"><LoaderCircle className="h-6 w-6 animate-spin"/></TableCell></TableRow>}
                            {!isLoading && reservations?.map(res => (
                                <TableRow key={res.id}>
                                    <TableCell>{getRoomName(res.roomId)}</TableCell>
                                    <TableCell>{res.title}</TableCell>
                                    <TableCell>{res.workerProfileId ? getWorkerName(res.workerProfileId) : 'N/A'}</TableCell>
                                    <TableCell>{format(res.start.toDate(), 'Pp')} - {format(res.end.toDate(), 'p')}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            res.status === 'Approved' ? 'default' : res.status === 'Pending' ? 'secondary' : 'destructive'
                                        } className={
                                            res.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                            res.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                        }>
                                            {res.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                             {!isLoading && reservations?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">No records found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
};


export default function ReportsPage() {
    const { canViewReports, isLoading } = useUserRole();

    if (isLoading) {
        return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
    }

    if (!canViewReports) {
        return (
            <AppLayout>
                <Card>
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>You do not have permission to view this page.</CardDescription>
                    </CardHeader>
                </Card>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex items-center gap-2 mb-4">
                <LineChart className="h-6 w-6" />
                <h1 className="text-2xl font-headline font-bold">Reports</h1>
            </div>
            <Tabs defaultValue="attendance">
                <TabsList>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="mealstubs">Meal Stubs</TabsTrigger>
                    <TabsTrigger value="reservations">Room Reservations</TabsTrigger>
                </TabsList>
                <TabsContent value="attendance" className="mt-4">
                    <ReportContainer>
                        <AttendanceReport dateRange={{start: new Date(), end: new Date()}} />
                    </ReportContainer>
                </TabsContent>
                <TabsContent value="mealstubs" className="mt-4">
                    <ReportContainer>
                        <MealStubsReport dateRange={{start: new Date(), end: new Date()}}/>
                    </ReportContainer>
                </TabsContent>
                <TabsContent value="reservations" className="mt-4">
                     <ReportContainer>
                        <ReservationsReport dateRange={{start: new Date(), end: new Date()}} />
                    </ReportContainer>
                </TabsContent>
            </Tabs>
        </AppLayout>
    );
}
