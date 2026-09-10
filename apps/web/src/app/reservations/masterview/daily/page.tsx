"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  CheckCircle2,
  Tv,
  Mic,
  Speaker,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
} from "date-fns";
import { useQuery } from "@tanstack/react-query";
import type { Booking, Room, Area, Worker, VenueElement, Ministry } from "@studio/types";
import {
  Badge,
  Button,
  Separator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@studio/ui";
import { cn, toJsDate } from "@/lib/utils";
import { useUserRole } from "@/hooks/use-user-role";
import {
  getAreas,
  getBookings,
  getRooms,
  getVenueElements,
  getWorkers,
  getMinistries,
} from "@/actions/db";
import { EditReservationDialog } from "@/components/reservations/edit-reservation-dialog";

type CalendarViewMode = "month" | "week" | "day";

// Color styles for reservation badge pills
const EVENT_COLORS = [
  {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-900 dark:text-blue-200",
    border: "border-l-blue-500",
  },
  {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-900 dark:text-emerald-200",
    border: "border-l-emerald-500",
  },
  {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-900 dark:text-purple-200",
    border: "border-l-purple-500",
  },
  {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-900 dark:text-amber-200",
    border: "border-l-amber-500",
  },
  {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-900 dark:text-rose-200",
    border: "border-l-rose-500",
  },
];

export default function ScheduleCalendarPage() {
  const { canViewScheduleMasterview, isLoading: roleLoading } = useUserRole();
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("day");
  const [selectedAreaId, setSelectedAreaId] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch data live from Database queries
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

  const { data: venueElements, isLoading: venueElementsLoading } = useQuery({
    queryKey: ["venue-elements"],
    queryFn: getVenueElements,
  });

  const { data: ministries, isLoading: ministriesLoading } = useQuery({
    queryKey: ["ministries"],
    queryFn: getMinistries,
  });

  const isLoading =
    roomsLoading ||
    areasLoading ||
    bookingsLoading ||
    workersLoading ||
    roleLoading ||
    venueElementsLoading ||
    ministriesLoading;

  // Protected route check
  React.useEffect(() => {
    if (!roleLoading && !canViewScheduleMasterview) {
      router.replace("/dashboard");
    }
  }, [canViewScheduleMasterview, roleLoading, router]);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleBookingClick = (booking: any) => {
    setSelectedBooking(booking);
    setIsDetailsOpen(true);
  };

  // Title text calculation
  const calendarTitle = useMemo(() => {
    if (viewMode === "month") {
      return format(currentDate, "MMMM yyyy");
    }
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    }
    return format(currentDate, "EEEE, MMMM d, yyyy");
  }, [currentDate, viewMode]);

  // Approved bookings only
  const approvedBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter((b) => b.status === "Approved");
  }, [bookings]);

  // Days for Month View Grid (Sun-Sat)
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Days for Week View
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Rooms for Day View filtered by chosen Area/Floor
  const dayRooms = useMemo(() => {
    if (!rooms) return [];
    if (selectedAreaId === "all") return rooms;
    return rooms.filter((r) => r.areaId === selectedAreaId);
  }, [rooms, selectedAreaId]);

  if (roleLoading) return null;
  if (!canViewScheduleMasterview) return null;

  return (
    <AppLayout>
      <div className="w-full space-y-6 pb-12">
        {/* Header Section */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-headline text-gray-900 dark:text-white">
            Schedule Calendar
          </h1>
          <p className="text-sm text-muted-foreground">
            View and manage room reservations across all facilities.
          </p>
        </div>

        {/* Navigation & View Mode Card */}
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-200/80 dark:border-border p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Date Navigator */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-muted text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              title="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="font-bold text-sm sm:text-base text-gray-800 dark:text-foreground text-center min-w-[160px]">
              {calendarTitle}
            </span>

            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-muted text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              title="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* View Mode Pill Switcher */}
          <div className="bg-gray-100 dark:bg-muted p-1 rounded-xl flex items-center border border-gray-200/50 dark:border-border/50">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={cn(
                "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all",
                viewMode === "month"
                  ? "bg-white dark:bg-card shadow-xs text-gray-800 dark:text-foreground"
                  : "text-gray-500 hover:text-gray-800 dark:text-muted-foreground dark:hover:text-foreground"
              )}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={cn(
                "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all",
                viewMode === "week"
                  ? "bg-white dark:bg-card shadow-xs text-gray-800 dark:text-foreground"
                  : "text-gray-500 hover:text-gray-800 dark:text-muted-foreground dark:hover:text-foreground"
              )}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode("day")}
              className={cn(
                "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all",
                viewMode === "day"
                  ? "bg-white dark:bg-card shadow-xs text-gray-800 dark:text-foreground"
                  : "text-gray-500 hover:text-gray-800 dark:text-muted-foreground dark:hover:text-foreground"
              )}
            >
              Day
            </button>
          </div>
        </div>

        {/* Floor / Area selector for Day view */}
        {viewMode === "day" && (
          <div className="flex items-center justify-end gap-2.5">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              Show rooms:
            </span>
            <Select
              value={selectedAreaId}
              onValueChange={setSelectedAreaId}
            >
              <SelectTrigger className="w-[190px] h-9 text-xs rounded-xl border-gray-200 dark:border-border bg-white dark:bg-card font-medium">
                <SelectValue placeholder="Select Floor / Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-medium">
                  All Floors & Areas
                </SelectItem>
                {areas?.map((area) => (
                  <SelectItem
                    key={area.id}
                    value={area.id}
                    className="text-xs font-medium"
                  >
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-200/80 dark:border-border p-6 shadow-xs overflow-hidden min-h-[520px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading calendar schedules...
              </p>
            </div>
          ) : viewMode === "month" ? (
            /* Month View Grid */
            <div className="space-y-3">
              {/* Day Headers (Sun - Sat) */}
              <div className="grid grid-cols-7 gap-3">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (dayName) => (
                    <div
                      key={dayName}
                      className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2"
                    >
                      {dayName}
                    </div>
                  )
                )}
              </div>

              {/* 7-column Days Grid */}
              <div className="grid grid-cols-7 gap-3">
                {monthDays.map((day, idx) => {
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isDayToday = isToday(day);

                  // Find bookings for this day
                  const dayEvents = approvedBookings.filter((b) =>
                    isSameDay(toJsDate(b.start), day)
                  );

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "min-h-[110px] md:min-h-[125px] p-2.5 rounded-2xl border transition-all flex flex-col justify-between",
                        isCurrentMonth
                          ? "bg-white dark:bg-card border-gray-200/70 dark:border-border/70 hover:border-gray-300 dark:hover:border-border"
                          : "bg-gray-50/80 dark:bg-muted/20 border-gray-100 dark:border-border/40 text-gray-400 dark:text-gray-600"
                      )}
                    >
                      {/* Top Header: Day Number */}
                      <div className="flex items-center justify-between mb-1.5">
                        {isDayToday ? (
                          <span className="w-5 h-5 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center text-[11px] font-bold shadow-xs">
                            {format(day, "d")}
                          </span>
                        ) : (
                          <span
                            className={cn(
                              "text-xs font-bold px-0.5",
                              isCurrentMonth
                                ? "text-gray-700 dark:text-gray-300"
                                : "text-gray-400 dark:text-gray-600"
                            )}
                          >
                            {format(day, "d")}
                          </span>
                        )}
                      </div>

                      {/* Event Items */}
                      <div className="space-y-1 overflow-y-auto max-h-[80px]">
                        {dayEvents.map((booking, bIdx) => {
                          const room = rooms?.find(
                            (r) => r.id === booking.roomId
                          );
                          const color =
                            EVENT_COLORS[bIdx % EVENT_COLORS.length];
                          const startTime = toJsDate(booking.start);

                          return (
                            <div
                              key={booking.id}
                              onClick={() => handleBookingClick(booking)}
                              className={cn(
                                "border-l-[3px] rounded-md py-1 px-1.5 text-[10px] font-medium truncate cursor-pointer hover:opacity-90 transition-all flex items-center gap-1",
                                color.bg,
                                color.text,
                                color.border
                              )}
                              title={`${booking.title} - ${room?.name || "Room"} (${format(startTime, "h:mm a")})`}
                            >
                              <span className="font-semibold shrink-0">
                                {format(startTime, "HH:mm")}
                              </span>
                              <span className="truncate">
                                {room?.name || booking.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : viewMode === "week" ? (
            /* Week Hourly Time Grid Matrix - scrollable on mobile */
            <div className="overflow-x-auto -mx-6">
              <div className="min-w-[600px] px-6">
                {/* Header Row: Days of the Week */}
                <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-gray-200 dark:border-border">
                  <div className="border-r border-gray-200/80 dark:border-border/80 py-3" />

                  {weekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className="py-3 px-2 text-center border-r border-gray-200/80 dark:border-border/80 last:border-r-0"
                    >
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {format(day, "EEE")}
                      </p>
                      <p
                        className={cn(
                          "text-base font-bold mt-0.5",
                          isToday(day)
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-gray-800 dark:text-gray-100"
                        )}
                      >
                        {format(day, "d")}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Hourly Rows (8 AM to 8 PM) */}
                {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(
                  (hour) => {
                    const hourLabel =
                      hour === 12
                        ? "12 PM"
                        : hour > 12
                          ? `${hour - 12} PM`
                          : `${hour} AM`;

                    return (
                      <div
                        key={hour}
                        className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-gray-200/70 dark:border-border/70 min-h-[52px]"
                      >
                        {/* Time Label on left */}
                        <div className="border-r border-gray-200/80 dark:border-border/80 text-xs font-medium text-gray-400 dark:text-gray-500 flex items-center justify-center p-2 select-none">
                          {hourLabel}
                        </div>

                        {/* 7 Day Slot Cells */}
                        {weekDays.map((day, dIdx) => {
                          const slotBookings = approvedBookings.filter((b) => {
                            const start = toJsDate(b.start);
                            return (
                              isSameDay(start, day) &&
                              start.getHours() === hour
                            );
                          });

                          return (
                            <div
                              key={dIdx}
                              className="border-r border-gray-200/70 dark:border-border/70 last:border-r-0 p-1 relative flex flex-col justify-center"
                            >
                              {slotBookings.map((booking, bIdx) => {
                                const room = rooms?.find(
                                  (r) => r.id === booking.roomId
                                );
                                const color =
                                  EVENT_COLORS[bIdx % EVENT_COLORS.length];
                                const startTime = toJsDate(booking.start);

                                return (
                                  <div
                                    key={booking.id}
                                    onClick={() =>
                                      handleBookingClick(booking)
                                    }
                                    className={cn(
                                      "w-full h-full min-h-[36px] rounded-md border-l-[3px] px-2 py-1 text-xs font-medium flex items-center cursor-pointer hover:opacity-90 transition-all truncate shadow-2xs",
                                      color.bg,
                                      color.text,
                                      color.border
                                    )}
                                    title={`${booking.title} - ${room?.name || "Room"} (${format(startTime, "h:mm a")})`}
                                  >
                                    <span className="truncate">
                                      {room?.name || booking.title}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          ) : (
            /* Day View — vertical room list on mobile, grid on desktop */
            <div>
              {/* ── MOBILE: vertical list of rooms with their bookings ── */}
              <div className="lg:hidden space-y-3">
                {dayRooms.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">No rooms found.</p>
                ) : (
                  dayRooms.map((room) => {
                    const roomBookings = approvedBookings
                      .filter((b) =>
                        b.roomId === room.id &&
                        isSameDay(toJsDate(b.start), currentDate)
                      )
                      .sort((a, b) => toJsDate(a.start).getTime() - toJsDate(b.start).getTime());

                    return (
                      <div key={room.id} className="rounded-xl border border-gray-200 dark:border-border overflow-hidden">
                        <div className="bg-gray-50 dark:bg-muted/40 px-4 py-2.5 border-b border-gray-200 dark:border-border">
                          <p className="text-xs font-bold text-gray-700 dark:text-gray-200">{room.name}</p>
                        </div>
                        {roomBookings.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 italic">No reservations today</div>
                        ) : (
                          <div className="divide-y divide-gray-100 dark:divide-border">
                            {roomBookings.map((booking) => {
                              const worker = workers?.find((w) => w.id === booking.workerProfileId);
                              const startTime = toJsDate(booking.start);
                              const endTime = toJsDate(booking.end);
                              const requesterName = worker ? `${worker.firstName} ${worker.lastName}` : booking.name || "Requester";
                              return (
                                <div key={booking.id} onClick={() => handleBookingClick(booking)} className="px-4 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors border-l-[3px] border-l-blue-500">
                                  <div>
                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-snug">{booking.title}</p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{requesterName}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">{format(startTime, "h:mm a")}</p>
                                    <p className="text-[10px] text-gray-400">– {format(endTime, "h:mm a")}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* ── DESKTOP: original horizontal grid ── */}
              <div className="hidden lg:block overflow-x-auto">
                <div style={{ minWidth: `${Math.max(700, dayRooms.length * 130 + 70)}px` }}>
                  <div className="grid border-b border-gray-200 dark:border-border" style={{ gridTemplateColumns: `70px repeat(${Math.max(1, dayRooms.length)}, minmax(120px, 1fr))` }}>
                    <div className="border-r border-gray-200/80 dark:border-border/80 py-3" />
                    {dayRooms.map((room) => (
                      <div key={room.id} className="py-3 px-2 text-center border-r border-gray-200/80 dark:border-border/80 last:border-r-0">
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">{room.name}</p>
                      </div>
                    ))}
                  </div>
                  {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((hour) => {
                    const hourLabel = hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
                    return (
                      <div key={hour} className="grid border-b border-gray-200/70 dark:border-border/70 min-h-[52px]" style={{ gridTemplateColumns: `70px repeat(${Math.max(1, dayRooms.length)}, minmax(120px, 1fr))` }}>
                        <div className="border-r border-gray-200/80 dark:border-border/80 text-xs font-medium text-gray-400 dark:text-gray-500 flex items-center justify-center p-2 select-none">{hourLabel}</div>
                        {dayRooms.map((room) => {
                          const slotBookings = approvedBookings.filter((b) => {
                            const start = toJsDate(b.start);
                            return b.roomId === room.id && isSameDay(start, currentDate) && start.getHours() === hour;
                          });
                          return (
                            <div key={room.id} className="border-r border-gray-200/70 dark:border-border/70 last:border-r-0 p-1 relative flex flex-col justify-center">
                              {slotBookings.map((booking) => {
                                const worker = workers?.find((w) => w.id === booking.workerProfileId);
                                const startTime = toJsDate(booking.start);
                                const endTime = toJsDate(booking.end);
                                const requesterName = worker ? `${worker.firstName} ${worker.lastName}` : booking.name || "Requester";
                                return (
                                  <div key={booking.id} onClick={() => handleBookingClick(booking)} className="w-full h-full min-h-[38px] rounded-md border-l-[3px] border-l-blue-500 bg-blue-50/90 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200 px-2 py-1 flex flex-col justify-center cursor-pointer hover:opacity-90 transition-all shadow-2xs" title={`${booking.title} (${format(startTime, "h:mm a")} - ${format(endTime, "h:mm a")})`}>
                                    <span className="text-[11px] font-bold leading-tight">{format(startTime, "HH:mm")}-{format(endTime, "HH:mm")}</span>
                                    <span className="text-[10px] text-gray-600 dark:text-gray-300 truncate leading-tight mt-0.5">{requesterName}</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Room Availability Section for Day view */}
        {viewMode === "day" && !isLoading && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">
                Room Availability
              </h3>
            </div>

            <div className="space-y-2.5">
              {dayRooms.map((room) => {
                const roomBookings = approvedBookings.filter(
                  (b) =>
                    b.roomId === room.id &&
                    isSameDay(toJsDate(b.start), currentDate)
                );
                const isAvailable = roomBookings.length === 0;

                return (
                  <div
                    key={room.id}
                    className="w-full bg-white dark:bg-card rounded-2xl border border-gray-200/80 dark:border-border p-4 px-6 flex items-center justify-between shadow-xs hover:border-gray-300 transition-all"
                  >
                    <span className="font-bold text-sm text-gray-800 dark:text-gray-100">
                      {room.name}
                    </span>

                    {isAvailable ? (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        Available
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                        Reserved ({roomBookings.length} booking
                        {roomBookings.length > 1 ? "s" : ""})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Edit Reservation Dialog Form */}
      <EditReservationDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        booking={selectedBooking}
        ministries={ministries || []}
        workers={workers || []}
      />
    </AppLayout>
  );
}
