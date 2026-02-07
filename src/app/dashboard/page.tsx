"use client";

import React from "react";
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
    // --- PLACEHOLDER DATA ---
    const pendingApprovals = "3";
    const totalWorkers = "12";
    const upcomingBookingsCount = "5";
    const todaysAttendance = "8";

    const attendanceChartData = [
        { date: "Mon", attendance: 5 },
        { date: "Tue", attendance: 8 },
        { date: "Wed", attendance: 6 },
        { date: "Thu", attendance: 9 },
        { date: "Fri", attendance: 7 },
        { date: "Sat", attendance: 4 },
        { date: "Sun", attendance: 2 },
    ];
    
    const upcomingBookingsForList = [
        {
            id: '1',
            title: 'Weekly Team Sync',
            roomName: 'Conference Room A',
            workerName: 'Alice Johnson',
            date: 'Aug 1, 2024',
            status: 'Approved'
        },
        {
            id: '2',
            title: 'Design Review',
            roomName: 'Focus Room 1',
            workerName: 'Bob Williams',
            date: 'Aug 1, 2024',
            status: 'Approved'
        },
        {
            id: '3',
            title: 'Client Meeting',
            roomName: 'Main Hall',
            workerName: 'Charlie Brown',
            date: 'Aug 2, 2024',
            status: 'Pending'
        },
    ];

  return (
    <AppLayout>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-headline font-bold tracking-tight">
          Dashboard
        </h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Pending Approvals"
            value={pendingApprovals}
            icon={CheckSquare}
            description="Items needing review"
            link="/approvals"
          />
          <StatsCard
            title="Total Workers"
            value={totalWorkers}
            icon={Users}
            description="Active and pending staff"
            link="/workers"
          />
          <StatsCard
            title="Upcoming Bookings"
            value={upcomingBookingsCount}
            icon={Calendar}
            description="Scheduled room reservations"
            link="/rooms"
          />
           <StatsCard
            title="Today's Attendance"
            value={todaysAttendance}
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
                    {upcomingBookingsForList?.map(booking => (
                        <div key={booking.id} className="flex items-start space-x-4">
                            <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                                <Calendar className="h-5 w-5"/>
                            </div>
                            <div>
                                <p className="font-semibold">{booking.title}</p>
                                 <p className="text-sm text-muted-foreground">
                                    in {booking.roomName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    by {booking.workerName} - {booking.date}
                                </p>
                            </div>
                             <Badge variant={booking.status === 'Approved' ? 'default' : 'secondary'} className={`ml-auto ${booking.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{booking.status}</Badge>
                        </div>
                    ))}
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
