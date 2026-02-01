"use client";

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
  BarChart,
  Activity,
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
import { collection, query, where, Timestamp } from "firebase/firestore";
import { format, isToday } from 'date-fns';
import type { Booking, Worker, ApprovalRequest } from "@/lib/types";

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

const attendanceChartData = [
    { date: 'Mon', attendance: Math.floor(Math.random() * 20) + 30 },
    { date: 'Tue', attendance: Math.floor(Math.random() * 20) + 35 },
    { date: 'Wed', attendance: Math.floor(Math.random() * 20) + 40 },
    { date: 'Thu', attendance: Math.floor(Math.random() * 20) + 38 },
    { date: 'Fri', attendance: Math.floor(Math.random() * 20) + 42 },
    { date: 'Sat', attendance: Math.floor(Math.random() * 20) + 60 },
    { date: 'Sun', attendance: Math.floor(Math.random() * 20) + 75 },
];

function AttendanceChart() {
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
        <CardDescription>An overview of attendance for the last 7 days.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer>
            <RechartsBarChart data={attendanceChartData}>
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
    
    const approvalsRef = useMemoFirebase(() => query(collection(firestore, 'approvals'), where('status', '==', 'pending')), [firestore]);
    const { data: approvalRequests } = useCollection<ApprovalRequest>(approvalsRef);

    const workersRef = useMemoFirebase(() => collection(firestore, 'worker_profiles'), [firestore]);
    const { data: workers } = useCollection<Worker>(workersRef);

    const bookingsRef = useMemoFirebase(() => collection(firestore, 'rooms', 'R1', 'reservations'), [firestore]); // Example for one room
    const { data: bookings } = useCollection<Booking>(bookingsRef);
    
    const upcomingBookings = bookings?.filter(b => b.start && (b.start as unknown as Timestamp).toDate() > new Date());
    const todaysAttendance = workers?.filter(w => w.status === 'Active').length || 0; // Simplified

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
            description="People currently present"
            link="/attendance"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AttendanceChart />
          <Card className="col-span-1">
             <CardHeader>
                <CardTitle className="font-headline">Upcoming Bookings</CardTitle>
                <CardDescription>Next 3 scheduled room uses.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {upcomingBookings?.slice(0, 3).map(booking => (
                        <div key={booking.id} className="flex items-center space-x-4">
                            <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                                <Calendar className="h-5 w-5"/>
                            </div>
                            <div>
                                <p className="font-semibold">{booking.title}</p>
                                <p className="text-sm text-muted-foreground">
                                    {(booking.start as any)?.seconds ? format(new Date((booking.start as any).seconds * 1000), 'PP') : ''}
                                </p>
                            </div>
                             <Badge variant={booking.status === 'Approved' ? 'default' : 'secondary'} className="ml-auto bg-green-100 text-green-800">{booking.status}</Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
