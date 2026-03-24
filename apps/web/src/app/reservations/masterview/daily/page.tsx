"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Info,
  LoaderCircle,
  Mic,
  Tv,
  Speaker,
} from "lucide-react";
import { format, addDays, subDays, isSameDay, isToday } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import type { Booking, Room, Area, Worker } from "@studio/types";
import { Badge } from "@studio/ui";
import { cn, toJsDate } from "@/lib/utils";
import { useUserRole } from "@/hooks/use-user-role";
import { getAreas, getBookings, getRooms, getWorkers } from "@/actions/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@studio/ui";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@studio/ui";
import { Separator } from "@studio/ui";

export default function DailyViewPage() {
  const { canViewScheduleMasterview, isLoading: roleLoading } = useUserRole();
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Data fetching
  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: getRooms,
  });
  const { data: areas, isLoading: areasLoading } = useQuery({
    queryKey: ["areas"],
    queryFn: getAreas,
  });
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => getBookings(),
  });
  const { data: workers, isLoading: workersLoading } = useQuery({
    queryKey: ["workers"],
    queryFn: getWorkers,
  });

  const isLoading =
    roomsLoading ||
    areasLoading ||
    bookingsLoading ||
    workersLoading ||
    roleLoading;

  // Permission guard
  React.useEffect(() => {
    if (!roleLoading && !canViewScheduleMasterview) {
      router.replace("/dashboard");
    }
  }, [canViewScheduleMasterview, roleLoading, router]);

  const handlePrev = () => setCurrentDate(subDays(currentDate, 1));
  const handleNext = () => setCurrentDate(addDays(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleBookingClick = (booking: any) => {
    setSelectedBooking(booking);
    setIsDetailsOpen(true);
  };

  // Filter to this day's approved bookings only
  const dayBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter(
      (b) =>
        b.status === "Approved" &&
        b.start &&
        isSameDay(toJsDate(b.start), currentDate),
    );
  }, [bookings, currentDate]);

  // Group by area → room
  const groupedData = useMemo(() => {
    if (!rooms || !areas || dayBookings.length === 0) return [];

    const groups: Record<
      string,
      {
        areaName: string;
        order: number;
        items: { room: any; bookings: any[] }[];
      }
    > = {};

    dayBookings.forEach((booking) => {
      const room = rooms.find((r) => r.id === booking.roomId);
      if (!room) return;

      const area = areas.find(
        (a) => a.id === room.areaId || a.areaId === room.areaId,
      );
      const areaId = area?.id || "unassigned";
      const areaName = area?.name || "Unassigned Area";

      if (!groups[areaId]) {
        groups[areaId] = {
          areaName,
          order: area ? (areas.indexOf(area) ?? 999) : 999,
          items: [],
        };
      }

      let roomItem = groups[areaId].items.find((i) => i.room.id === room.id);
      if (!roomItem) {
        roomItem = { room, bookings: [] };
        groups[areaId].items.push(roomItem);
      }
      roomItem.bookings.push(booking);
    });

    // Sort bookings within each room by start time
    Object.values(groups).forEach((group) => {
      group.items.forEach((item) => {
        item.bookings.sort(
          (a, b) => toJsDate(a.start).getTime() - toJsDate(b.start).getTime(),
        );
      });
      group.items.sort((a, b) => a.room.name.localeCompare(b.room.name));
    });

    return Object.entries(groups).sort((a, b) =>
      a[1].areaName.localeCompare(b[1].areaName),
    );
  }, [rooms, areas, dayBookings]);

  const totalBookings = dayBookings.length;
  const totalRooms = groupedData.reduce(
    (acc, [, g]) => acc + g.items.length,
    0,
  );

  if (roleLoading) return null;
  if (!canViewScheduleMasterview) return null;

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto pb-20 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b">
          <div>
            <h1 className="text-3xl font-headline font-bold">Daily View</h1>
            <p className="text-muted-foreground">
              Approved reservations grouped by area and room.
            </p>
          </div>

          {/* Date Navigator */}
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-1 bg-card border rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                className="h-8 w-8 rounded-md"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <button
                onClick={handleToday}
                className="px-4 py-1.5 rounded-md transition-colors hover:bg-muted text-center"
              >
                <p
                  className={cn(
                    "text-base font-semibold leading-none",
                    isToday(currentDate) ? "text-primary" : "text-foreground",
                  )}
                >
                  {format(currentDate, "MMMM d, yyyy")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(currentDate, "EEEE")}
                  {isToday(currentDate) && (
                    <span className="text-primary"> · Today</span>
                  )}
                </p>
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="h-8 w-8 rounded-md"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick stats */}
            {!isLoading && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">
                    Bookings
                  </span>
                  <p className="text-base font-semibold leading-none">
                    {totalBookings}
                  </p>
                </div>
                <div className="w-px h-6 bg-border" />
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">
                    Rooms In Use
                  </span>
                  <p className="text-base font-semibold leading-none">
                    {totalRooms}
                  </p>
                </div>
                <div className="w-px h-6 bg-border" />
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">Areas</span>
                  <p className="text-base font-semibold leading-none">
                    {groupedData.length}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading schedule...</p>
          </div>
        ) : groupedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4">
              <CalendarIcon
                className="h-10 w-10 text-muted-foreground/30"
                strokeWidth={1.5}
              />
            </div>
            <h3 className="text-xl font-semibold">All Clear</h3>
            <p className="text-sm text-muted-foreground max-w-xs mt-2">
              No approved reservations on{" "}
              <span className="font-semibold text-foreground">
                {format(currentDate, "MMMM d, yyyy")}
              </span>
              .
            </p>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={handlePrev} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> Previous Day
              </Button>
              <Button variant="outline" onClick={handleNext} className="gap-2">
                Next Day <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedData.map(([areaId, group]) => (
              <section key={areaId}>
                {/* Area label */}
                <div className="flex items-center gap-3 mb-3">
                  <div>
                    <h2 className="text-sm font-semibold">{group.areaName}</h2>
                    <p className="text-xs text-muted-foreground">
                      {group.items.length}{" "}
                      {group.items.length === 1 ? "room" : "rooms"} ·{" "}
                      {group.items.reduce((s, i) => s + i.bookings.length, 0)}{" "}
                      bookings
                    </p>
                  </div>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Rooms table */}
                <div className="rounded-lg border overflow-hidden bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[180px] h-9 px-3 text-xs">
                          Room
                        </TableHead>
                        <TableHead className="w-[200px] h-9 px-3 text-xs">
                          Time Slot
                        </TableHead>
                        <TableHead className="h-9 px-3 text-xs">
                          Event
                        </TableHead>
                        <TableHead className="w-[80px] h-9 px-3 text-xs text-center">
                          AV
                        </TableHead>
                        <TableHead className="w-[90px] h-9 px-3 text-xs text-center">
                          Visuals
                        </TableHead>
                        <TableHead className="w-[50px] h-9" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((item) =>
                        item.bookings.map((booking, bIdx) => {
                          const isFirstBookingInRoom = bIdx === 0;
                          const isLastBookingInRoom =
                            bIdx === item.bookings.length - 1;
                          return (
                            <TableRow
                              key={booking.id}
                              className={cn(
                                "group",
                                !isLastBookingInRoom &&
                                  "border-b border-dashed border-muted",
                                isLastBookingInRoom && "border-b border-border",
                              )}
                            >
                              {/* Room name — only show on first booking */}
                              <TableCell className="py-2 px-3 align-middle">
                                {isFirstBookingInRoom && (
                                  <div>
                                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                                      {item.room.name}
                                    </p>
                                    <div className="flex items-center gap-1">
                                      <span
                                        className={cn(
                                          "inline-block h-1.5 w-1.5 rounded-full",
                                          item.bookings.length > 0
                                            ? "bg-emerald-500"
                                            : "bg-muted-foreground/30",
                                        )}
                                      />
                                      <span className="text-xs text-muted-foreground">
                                        {item.bookings.length}{" "}
                                        {item.bookings.length === 1
                                          ? "booking"
                                          : "bookings"}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </TableCell>

                              {/* Time */}
                              <TableCell className="px-3 py-2 align-middle">
                                <p className="text-sm">
                                  {format(toJsDate(booking.start), "h:mm a")} –{" "}
                                  {format(toJsDate(booking.end), "h:mm a")}
                                </p>
                              </TableCell>

                              {/* Event details */}
                              <TableCell className="px-3 py-2 align-middle max-w-xs">
                                <p className="text-sm font-medium">
                                  {booking.title}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {booking.purpose || "Regular meeting"}
                                </p>
                              </TableCell>

                              {/* AV Equipment */}
                              <TableCell className="text-center px-3 py-2 align-middle">
                                {booking.equipment_Mic ||
                                booking.equipment_Speakers ? (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <Mic className="h-4 w-4 text-emerald-500" />
                                    <span className="text-[10px] text-emerald-600">
                                      Yes
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground/40">
                                    —
                                  </span>
                                )}
                              </TableCell>

                              {/* Visuals */}
                              <TableCell className="text-center px-3 py-2 align-middle">
                                {booking.equipment_TV ? (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <Tv className="h-4 w-4 text-blue-500" />
                                    <span className="text-[10px] text-blue-600">
                                      Yes
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground/40">
                                    —
                                  </span>
                                )}
                              </TableCell>

                              {/* Info button */}
                              <TableCell className="px-3 py-2 align-middle text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
                                  onClick={() => handleBookingClick(booking)}
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        }),
                      )}
                    </TableBody>
                  </Table>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <BookingDetailsSheet
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        booking={selectedBooking}
        roomName={
          selectedBooking
            ? (rooms?.find((r) => r.id === selectedBooking.roomId)?.name ??
              "Unknown Room")
            : ""
        }
        workers={workers ?? []}
      />
    </AppLayout>
  );
}

// ─── Booking Detail Sheet ───────────────────────────────────────────────────

function BookingDetailsSheet({
  isOpen,
  onClose,
  booking,
  roomName,
  workers,
}: {
  isOpen: boolean;
  onClose: () => void;
  booking: any | null;
  roomName: string;
  workers: any[];
}) {
  if (!booking) return null;

  const startTime = toJsDate(booking.start);
  const endTime = toJsDate(booking.end);

  const getUserName = (userId: string) => {
    const user = workers.find((w) => w.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown";
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-6 border-b">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 text-xs">
              {booking.status}
            </Badge>
          </div>
          <SheetTitle className="text-2xl font-headline font-bold">
            {booking.title}
          </SheetTitle>
          <SheetDescription>
            Reservation detail summary and equipment requirements
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-4">
            <DetailRow label="Location" value={roomName} />
            <DetailRow label="Date" value={format(startTime, "PPPP")} />
            <DetailRow
              label="Schedule"
              value={`${format(startTime, "h:mm a")} – ${format(endTime, "h:mm a")}`}
            />
            <DetailRow
              label="Requested By"
              value={getUserName((booking as any).workerProfileId)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">
              Purpose
            </h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {booking.purpose ||
                "No specific purpose provided for this reservation."}
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground">
              Technical Requirements
            </h4>
            <div className="grid grid-cols-1 gap-2">
              <EquipmentStatus
                label="Television / Multimedia"
                active={!!booking.equipment_TV}
                icon={Tv}
              />
              <EquipmentStatus
                label="Microphone / Audio"
                active={!!booking.equipment_Mic}
                icon={Mic}
              />
              <EquipmentStatus
                label="Sound System / Speakers"
                active={!!booking.equipment_Speakers}
                icon={Speaker}
              />
            </div>
          </div>

          <Button variant="outline" className="w-full mt-4" onClick={onClose}>
            Close Details
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Shared Micro-Components ─────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function EquipmentStatus({
  label,
  active,
  icon: Icon,
}: {
  label: string;
  active: boolean;
  icon: any;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-2.5 rounded-lg border transition-colors",
        active
          ? "bg-green-50 border-green-100 dark:bg-green-900/10 dark:border-green-900/20"
          : "opacity-50",
      )}
    >
      <div className="flex items-center gap-2.5">
        <Icon
          className={cn(
            "h-4 w-4",
            active ? "text-green-600" : "text-muted-foreground",
          )}
        />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span
        className={cn(
          "text-xs",
          active ? "text-green-600" : "text-muted-foreground/40",
        )}
      >
        {active ? "Yes" : "No"}
      </span>
    </div>
  );
}
