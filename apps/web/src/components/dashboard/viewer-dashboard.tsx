"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@studio/database";
import { format, isToday, isAfter } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@studio/ui";
import { Button } from "@studio/ui";
import { Badge } from "@studio/ui";
import {
  LoaderCircle,
  QrCode,
  Calendar,
  ArrowRight,
  RefreshCw,
  Utensils,
  PlusCircle,
  Clock,
  History,
  CheckCircle2,
} from "lucide-react";
import type { Booking, Room, AttendanceRecord, MealStub } from "@studio/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@studio/ui";
import { useUserRole } from "@/hooks/use-user-role";
import { useRooms } from "@/hooks/use-rooms";
import { useBookings } from "@/hooks/use-bookings";
import { useAttendance } from "@/hooks/use-attendance";
import { useMealStubs } from "@/hooks/use-meal-stubs";
import { cn } from "@/lib/utils";

export function ViewerDashboard() {
  const { user } = useUser();
  const { workerProfile, canCreateRoomReservation } = useUserRole();

  const [qrSeed, setQrSeed] = useState(Date.now());
  const refreshCodes = () => setQrSeed(Date.now());

  const activeUserId = workerProfile?.id || user?.uid;

  const combinedData = activeUserId ? `COG_USER:${activeUserId}:${qrSeed}` : "";
  const combinedQrUrl = combinedData
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(combinedData)}`
    : "";

  const { rooms, isLoading: roomsLoading } = useRooms();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { bookings, isLoading: bookingsLoading } = useBookings(
    activeUserId ? { workerProfileId: activeUserId, dateFrom: todayStart } : {}
  );

  const { attendanceRecords: attendanceHistory, isLoading: attendanceLoading } = useAttendance(
    activeUserId ? { workerProfileId: activeUserId } : {}
  );

  const { mealStubs: mealStubsHistory, isLoading: mealStubsLoading } = useMealStubs(
    activeUserId ? { workerId: activeUserId } : {}
  );

  const upcomingBookings = (bookings as any[])
    .filter(
      (b) =>
        b.status === "Approved" &&
        (isToday(new Date(b.start)) || isAfter(new Date(b.start), new Date())),
    )
    .slice(0, 3) || [];

  const getRoomName = (roomId: string) => {
    return rooms?.find((r) => r.id === roomId)?.name || "Unknown Room";
  };

  const isLoading =
    bookingsLoading || roomsLoading || attendanceLoading || mealStubsLoading;

  return (
    <Tabs defaultValue="id" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="id">Identification & Meals</TabsTrigger>
        <TabsTrigger value="room">Room Reservation</TabsTrigger>
      </TabsList>

      <TabsContent value="id" className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          <Card className="flex flex-col items-center justify-between text-center p-6 sm:p-8 w-full lg:max-w-md shrink-0">
            <CardHeader className="p-2">
              <CardTitle className="font-headline text-2xl flex items-center justify-center gap-2">
                <QrCode className="h-6 w-6" /> Your QR Code
              </CardTitle>
              <CardDescription className="text-base text-balance mt-2">
                Scan this at any COG App station for attendance or to claim your
                meal stub.
              </CardDescription>
            </CardHeader>
            <CardContent className="py-6 flex justify-center w-full">
              {combinedQrUrl ? (
                <div className="bg-white p-4 rounded-xl shadow-inner border inline-block">
                  <Image
                    src={combinedQrUrl}
                    alt="Your QR Code"
                    width={256}
                    height={256}
                    className="rounded-lg w-full max-w-[200px] h-auto sm:max-w-none"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center p-12">
                  <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
                </div>
              )}
            </CardContent>
            <div className="pb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshCodes}
                className="mt-2"
              >
                <RefreshCw className="h-3 w-3 mr-2" /> Refresh QR Code
              </Button>
            </div>
          </Card>

          <Card className="w-full max-w-2xl mx-auto flex-grow h-fit">
            <CardHeader className="pb-3 px-4 sm:px-6">
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest meal stubs and attendance records.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-0">
              <div className="space-y-0">
                {/* Combined logs in chronological order */}
                {(() => {
                  const logs = [
                    ...(attendanceHistory || []).map((a) => ({
                      id: a.id,
                      type: "attendance",
                      title: a.type,
                      time: a.time instanceof Date ? a.time : new Date((a.time as any)?.seconds * 1000),
                      status: "Logged",
                    })),
                    ...(mealStubsHistory || []).map((m) => ({
                      id: m.id,
                      type: "mealstub",
                      title: "Meal Stub",
                      time: m.date instanceof Date ? m.date : new Date((m.date as any)?.seconds * 1000),
                      status: m.status,
                    })),
                  ].sort((a, b) => b.time.getTime() - a.time.getTime());

                  if (logs.length === 0 && !isLoading) {
                    return (
                      <p className="px-6 py-8 text-sm text-muted-foreground text-center">
                        No recent activity found.
                      </p>
                    );
                  }

                  return logs.map((log, i) => (
                    <div
                      key={log.id}
                      className={cn(
                        "flex items-center justify-between px-4 sm:px-6 py-4 transition-colors hover:bg-muted/50",
                        i !== logs.length - 1 && "border-bottom border-b",
                      )}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div
                          className={cn(
                            "p-2 rounded-full shrink-0",
                            log.type === "attendance"
                              ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
                          )}
                        >
                          {log.type === "attendance" ? (
                            <Clock className="h-4 w-4" />
                          ) : (
                            <Utensils className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {log.title}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {format(log.time, "MMM d, yyyy • h:mm a")}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          log.status === "Claimed" || log.status === "Logged"
                            ? "secondary"
                            : "default"
                        }
                        className={cn(
                          "text-[9px] sm:text-[10px] px-2 py-0 h-5 shrink-0",
                          log.status === "Claimed" &&
                          "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400",
                          log.status === "Issued" &&
                          "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
                        )}
                      >
                        {log.status}
                      </Badge>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="room">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="font-headline text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Upcoming Bookings
              </CardTitle>
              <CardDescription>
                Your next three approved reservations.
              </CardDescription>
            </div>
            {canCreateRoomReservation && (
              <Button asChild size="sm">
                <Link href="/rooms">
                  <PlusCircle className="mr-2 h-4 w-4" /> Book a Room
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <LoaderCircle className="h-6 w-6 animate-spin" />
              </div>
            ) : upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-secondary"
                  >
                    <div>
                      <p className="font-semibold">{booking.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {getRoomName(booking.roomId)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {format(booking.start, "MMM d")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(booking.start, "p")}
                      </p>
                    </div>
                  </div>
                ))}
                <Button variant="link" asChild className="w-full">
                  <Link href="/rooms">
                    View Calendar <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground">
                  You have no upcoming approved bookings.
                </p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/rooms">
                    Open Calendar <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
