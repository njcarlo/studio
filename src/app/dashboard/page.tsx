
"use client";

import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AppLayout } from "@/components/layout/app-layout";
import {
  CheckSquare,
  Users,
  Calendar,
  UserCheck,
} from "lucide-react";
import {
  Bar,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, Timestamp, collectionGroup } from "firebase/firestore";
import { format, isToday, startOfDay, subDays } from 'date-fns';
import type { Booking, Worker, ApprovalRequest, AttendanceRecord, Room } from "@/lib/types";
import { useUserRole } from "@/hooks/use-user-role";

type StatsCardProps = {
  title: string;
  value: string;
  icon: React.ElementType;
  description: string;
  link: string;
};

function StatsCard({ title, value, icon: Icon, description, link }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        <Link href={link} className="text-sm font-medium text-primary hover:underline mt-2 block">
          View All
        </Link>
      </CardContent>
    </Card>
  );
}

function AttendanceChart({ data }: { data: any[] }) {
    const chartConfig = {
      attendance: {
        label: "Attendance",
        color: "hsl(var(--primary))",
      },
    };
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="font-headline">Weekly Attendance</CardTitle>
        <CardDescription>An overview of unique worker check-ins for the last 7 days.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer>
            <RechartsBarChart data={data}>
              <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
              <Tooltip cursor={{fill: 'hsla(var(--primary), 0.1)'}} content={<ChartTooltipContent />} />
              <Bar dataKey="attendance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
    const firestore = useFirestore();
    const { viewAsRole, isLoading: isRoleLoading } = useUserRole();
    const isAdmin = viewAsRole === 'Admin' || viewAsRole === 'Super Admin';
    
    // --- QUERIES ---
    const approvalsRef = useMemoFirebase(() => query(collection(firestore, 'approvals'), where('status', '==', 'Pending')), [firestore]);
    const { data: approvalRequests } = useCollection<ApprovalRequest>(approvalsRef);

    const workersRef = useMemoFirebase(() => collection(firestore, 'worker_profiles'), [firestore]);
    const { data: workers } = useCollection<Worker>(workersRef);

    const roomsRef = useMemoFirebase(() => collection(firestore, "rooms"), [firestore]);
    const { data: rooms } = useCollection<Room>(roomsRef);

    const bookingsQuery = useMemoFirebase(() => collectionGroup(firestore, 'reservations'), [firestore]);
    const { data: allBookings } = useCollection<Booking>(bookingsQuery);

    const attendanceQuery = useMemoFirebase(() => {
      // Only run this broad query if the user is an admin and role is loaded.
      if (isRoleLoading || !isAdmin) {
          return null;
      }
      const sevenDaysAgo = subDays(new Date(), 6);
      return query(
        collection(firestore, "attendance_records"),
        where('time', '>=', startOfDay(sevenDaysAgo)),
        where('type', '==', 'Clock In')
      );
    }, [firestore, isAdmin, isRoleLoading]);
    const { data: attendanceLog } = useCollection<AttendanceRecord>(attendanceQuery);


    // --- DATA PROCESSING ---
    const upcomingBookings = useMemo(() => {
        if (!allBookings) return [];
        const now = new Date();
        return allBookings.filter(b => b.start && (b.start as unknown as Timestamp).toDate() > now);
    }, [allBookings]);
    
    const todaysAttendance = useMemo(() => {
        if (!attendanceLog) return 0;
        const todaysRecords = attendanceLog.filter(log => log.time && isToday((log.time as unknown as Timestamp).toDate()));
        const uniqueWorkers = new Set(todaysRecords.map(log => log.workerProfileId));
        return uniqueWorkers.size;
    }, [attendanceLog]);

    const attendanceChartData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = subDays(new Date(), i);
            return {
                date: format(d, 'E'),
                fullDate: format(d, 'yyyy-MM-dd'),
                attendance: 0,
            };
        }).reverse();

        if (attendanceLog) {
            const dailyUniqueWorkers = new Map<string, Set<string>>();

            for (const log of attendanceLog) {
                if (log.time) {
                    const logDateStr = format((log.time as unknown as Timestamp).toDate(), 'yyyy-MM-dd');
                    if (!dailyUniqueWorkers.has(logDateStr)) {
                        dailyUniqueWorkers.set(logDateStr, new Set());
                    }
                    dailyUniqueWorkers.get(logDateStr)!.add(log.workerProfileId);
                }
            }
            
            last7Days.forEach(day => {
                day.attendance = dailyUniqueWorkers.get(day.fullDate)?.size || 0;
            });
        }
        
        return last7Days;
    }, [attendanceLog]);

    const upcomingBookingsForList = upcomingBookings
        ?.sort((a,b) => (a.start as any).seconds - (b.start as any).seconds)
        .slice(0, 3);

  return (
    <AppLayout>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-headline font-bold tracking-tight">
          Dashboard
        </h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Pending Approvals"
            value={approvalRequests?.length.toString() ?? '0'}
            icon={CheckSquare}
            description="Items needing review"
            link="/approvals"
          />
          <StatsCard
            title="Total Workers"
            value={workers?.length.toString() ?? '0'}
            icon={Users}
            description="Active and pending staff"
            link="/workers"
          />
          <StatsCard
            title="Upcoming Bookings"
            value={upcomingBookings?.length.toString() ?? '0'}
            icon={Calendar}
            description="Scheduled room reservations"
            link="/rooms"
          />
           <StatsCard
            title="Today's Attendance"
            value={todaysAttendance.toString()}
            icon={UserCheck}
            description="Unique workers present today"
            link="/attendance"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AttendanceChart data={attendanceChartData} />
          <Card className="col-span-1">
             <CardHeader>
                <CardTitle className="font-headline">Upcoming Bookings</CardTitle>
                <CardDescription>Next 3 scheduled room uses.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {upcomingBookingsForList?.map(booking => {
                        const worker = workers?.find(w => w.id === booking.workerProfileId);
                        const workerName = worker ? `${worker.firstName} ${worker.lastName}` : '...';
                        const room = rooms?.find(r => r.id === booking.roomId);
                        const roomName = room ? room.name : '...';
                        
                        return (
                        <div key={booking.id} className="flex items-start space-x-4">
                            <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                                <Calendar className="h-5 w-5"/>
                            </div>
                            <div>
                                <p className="font-semibold">{booking.title}</p>
                                 <p className="text-sm text-muted-foreground">
                                    in {roomName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    by {workerName} - {(booking.start as any)?.seconds ? format(new Date((booking.start as any).seconds * 1000), 'PP') : ''}
                                </p>
                            </div>
                             <Badge variant={booking.status === 'Approved' ? 'default' : 'secondary'} className="ml-auto bg-green-100 text-green-800">{booking.status}</Badge>
                        </div>
                        )
                    })}
                     {!upcomingBookingsForList || upcomingBookingsForList.length === 0 && (
                        <p className="text-sm text-center text-muted-foreground py-4">No upcoming bookings.</p>
                    )}
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
