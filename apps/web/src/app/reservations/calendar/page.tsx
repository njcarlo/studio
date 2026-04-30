"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@studio/ui";
import {
  PlusCircle,
  Users,
  Tv,
  Projector,
  Mic,
  Monitor,
  LoaderCircle,
  Calendar as CalendarIcon,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Timer,
  Info,
  Building2,
} from "lucide-react";
import { Label } from "@studio/ui";
import { Badge } from "@studio/ui";
import { Separator } from "@studio/ui";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@studio/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@studio/ui";
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
  eachDayOfInterval,
  isSameDay,
  isToday,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  isSameMonth,
} from "date-fns";
import { cn, toJsDate } from "@/lib/utils";
import type {
  Booking,
  Room,
  Worker,
  Area,
  Branch,
  VenueElement,
} from "@studio/types";
import { useUserRole } from "@/hooks/use-user-role";
import { useQuery } from "@tanstack/react-query";
import {
  getAreas,
  getBookings,
  getBranches,
  getRooms,
  getVenueElements,
  getWorkers,
} from "@/actions/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@studio/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@studio/ui";

const DayView = ({
  bookings,
  rooms,
  workers,
  date,
  areas,
  onBookingClick,
}: {
  bookings: any[];
  rooms: any[] | undefined;
  workers: any[] | undefined;
  date: Date;
  areas: any[] | undefined;
  onBookingClick: (b: any) => void;
}) => {
  if (!date) return null;

  if (!rooms || rooms.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No rooms match the current filter.
      </p>
    );
  }

  const dayBookings = bookings.filter(
    (b) => b.start && isSameDay(toJsDate(b.start), date),
  );

  const getUserName = (userId: string) => {
    const user = workers?.find((w) => w.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown";
  };

  const dayStartHour = 6;
  const dayEndHour = 21;
  const totalHours = dayEndHour - dayStartHour;

  const timeToPosition = (time: Date) => {
    const hours = time.getHours() + time.getMinutes() / 60;
    const position = ((hours - dayStartHour) / totalHours) * 100;
    return Math.max(0, position);
  };

  const durationToWidth = (start: Date, end: Date) => {
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return (durationHours / totalHours) * 100;
  };

  const timeSlots = Array.from(
    { length: totalHours },
    (_, i) => dayStartHour + i,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Daily Schedule</CardTitle>
        <CardDescription>
          Visual timeline of all room bookings for the selected day.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 p-0 sm:p-6">
        {/* Mobile: vertical list view */}
        <div className="sm:hidden px-4 pb-4 pt-2 space-y-6">
          {(() => {
            const groupedRooms: Record<string, Room[]> = {};
            rooms.forEach((room) => {
              const areaId = room.areaId || "unassigned";
              if (!groupedRooms[areaId]) groupedRooms[areaId] = [];
              groupedRooms[areaId].push(room);
            });

            return Object.entries(groupedRooms).map(([areaId, areaRooms]) => {
              const areaName =
                areaId === "unassigned"
                  ? "Unassigned Area"
                  : areas?.find((a) => a.areaId === areaId)?.name || "Unknown Area";

              return (
                <div key={areaId} className="space-y-3">
                  <div className="font-bold text-sm text-primary/80 pl-2 border-l-2 border-primary/50 tracking-wider uppercase">
                    {areaName}
                  </div>
                  {areaRooms.map((room) => {
                    const roomBookings = dayBookings.filter((b) => b.roomId === room.id);
                    return (
                      <div key={room.id} className="rounded-lg border bg-muted/20 overflow-hidden">
                        <div className="px-3 py-2 bg-muted/40 border-b">
                          <p className="text-sm font-semibold">{room.name}</p>
                        </div>
                        {roomBookings.length === 0 ? (
                          <p className="text-xs text-muted-foreground px-3 py-2 italic">No bookings</p>
                        ) : (
                          <div className="divide-y">
                            {roomBookings
                              .sort((a, b) => toJsDate(a.start).getTime() - toJsDate(b.start).getTime())
                              .map((booking) => {
                                const bookingStart = toJsDate(booking.start);
                                const bookingEnd = toJsDate(booking.end);
                                const statusClass =
                                  booking.status === "Approved"
                                    ? "bg-green-50 border-l-4 border-l-green-500"
                                    : booking.status.startsWith("Pending")
                                      ? "bg-yellow-50 border-l-4 border-l-yellow-500"
                                      : "bg-red-50 border-l-4 border-l-red-500";
                                return (
                                  <div
                                    key={booking.id}
                                    onClick={() => onBookingClick(booking)}
                                    className={`px-3 py-2 cursor-pointer ${statusClass}`}
                                  >
                                    <p className="text-sm font-semibold">{booking.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(bookingStart, "p")} – {format(bookingEnd, "p")}
                                    </p>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            });
          })()}
        </div>

        {/* Desktop: horizontal timeline */}
        <div className="hidden sm:block overflow-x-auto">
        <div className="space-y-4 min-w-[600px] px-4 pb-4 pt-2">
          <div className="relative border-b pb-2">
            <div className="grid grid-cols-[8rem_1fr] gap-2">
              <div />
              <div
                className="grid text-xs text-muted-foreground text-center"
                style={{
                  gridTemplateColumns: `repeat(${totalHours}, minmax(0, 1fr))`,
                }}
              >
                {timeSlots.map((hour) => (
                  <div key={hour}>
                    {hour % 12 || 12}
                    {hour < 12 ? "am" : "pm"}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {(() => {
              const groupedRooms: Record<string, Room[]> = {};
              rooms.forEach((room) => {
                const areaId = room.areaId || "unassigned";
                if (!groupedRooms[areaId]) groupedRooms[areaId] = [];
                groupedRooms[areaId].push(room);
              });

              return Object.entries(groupedRooms).map(([areaId, areaRooms]) => {
                const areaName =
                  areaId === "unassigned"
                    ? "Unassigned Area"
                    : areas?.find((a) => a.areaId === areaId)?.name ||
                      "Unknown Area";

                return (
                  <div key={areaId} className="space-y-2">
                    <div className="font-bold text-sm text-primary/80 mb-2 pl-2 border-l-2 border-primary/50 tracking-wider uppercase">
                      {areaName}
                    </div>
                    {areaRooms.map((room) => {
                      const roomBookings = dayBookings.filter(
                        (b) => b.roomId === room.id,
                      );

                      return (
                        <div
                          key={room.id}
                          className="grid grid-cols-[8rem_1fr] items-center gap-2"
                        >
                          <div className="font-semibold text-sm text-muted-foreground truncate pr-2 text-right">
                            {room.name}
                          </div>
                          <div className="relative h-16 bg-muted/50 rounded-lg">
                            {timeSlots.slice(1).map((hour) => (
                              <div
                                key={`line-${hour}`}
                                className="absolute h-full border-l"
                                style={{
                                  left: `${((hour - dayStartHour) / totalHours) * 100}%`,
                                }}
                              />
                            ))}
                            {roomBookings.map((booking) => {
                              const bookingStart = toJsDate(booking.start);
                              const bookingEnd = toJsDate(booking.end);
                              const left = timeToPosition(bookingStart);
                              const width = durationToWidth(bookingStart, bookingEnd);
                              const statusClass =
                                booking.status === "Approved"
                                  ? "bg-green-500/80 border-green-700 hover:bg-green-500"
                                  : booking.status.startsWith("Pending")
                                    ? "bg-yellow-500/80 border-yellow-700 hover:bg-yellow-500"
                                    : "bg-red-500/80 border-red-700 hover:bg-red-500";

                              return (
                                <TooltipProvider key={booking.id}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div
                                        onClick={() => onBookingClick(booking)}
                                        className={`absolute top-1 bottom-1 p-2 rounded-lg text-white overflow-hidden border transition-colors cursor-pointer ${statusClass}`}
                                        style={{
                                          left: `${left}%`,
                                          width: `${width}%`,
                                          minWidth: "20px",
                                        }}
                                      >
                                        <p className="text-xs font-bold truncate">
                                          {booking.title}
                                        </p>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="font-bold">{booking.title}</p>
                                      <p>{format(bookingStart, "p")} - {format(bookingEnd, "p")}</p>
                                      <p>Status: {booking.status}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })()}
          </div>
        </div>
        </div>
      </CardContent>
    </Card>
  );
};

const WeekView = ({
  bookings,
  rooms,
  workers,
  date,
  onDateSelect,
  onBookingClick,
}: {
  bookings: any[];
  rooms?: any[];
  workers?: any[];
  date: Date;
  onDateSelect: (date: Date) => void;
  onBookingClick: (b: any) => void;
}) => {
  const start = startOfWeek(date);
  const end = endOfWeek(date);
  const weekDates = eachDayOfInterval({ start, end });

  const weekBookings = useMemo(
    () =>
      bookings.filter((b) => {
        if (!b.start) return false;
        const bookingDate = toJsDate(b.start);
        return isWithinInterval(bookingDate, { start, end });
      }),
    [bookings, start, end],
  );

  const getRoomName = (roomId: string) =>
    rooms?.find((r) => r.id === roomId)?.name || "Unknown Room";

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden w-full">
      <div className="grid grid-cols-7 divide-x">
        {weekDates.map((day) => {
          const dayBookings = weekBookings
            .filter((b) => b.start && isSameDay(toJsDate(b.start), day))
            .sort((a, b) => toJsDate(a.start).getTime() - toJsDate(b.start).getTime());

          return (
            <div key={day.toString()} className="flex flex-col">
              {/* Day header */}
              <button
                onClick={() => onDateSelect(day)}
                className={cn(
                  "py-2 sm:py-3 text-center border-b transition-colors hover:bg-accent/30",
                  isToday(day) && "bg-primary/5",
                )}
              >
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span className="hidden sm:inline">{format(day, "EEE")}</span>
                  <span className="sm:hidden">{format(day, "EEEEE")}</span>
                </p>
                <p
                  className={cn(
                    "text-base sm:text-2xl font-bold mt-0.5 mx-auto h-7 w-7 sm:h-10 sm:w-10 flex items-center justify-center rounded-full transition-colors",
                    isToday(day) && "bg-primary text-primary-foreground",
                    !isToday(day) && "text-foreground",
                  )}
                >
                  {format(day, "d")}
                </p>
              </button>

              {/* Bookings */}
              <div className="flex-grow min-h-[120px] sm:min-h-[200px]">
                {/* Desktop: full cards */}
                <div className="hidden sm:block p-2 space-y-1.5">
                  {dayBookings.map((booking) => {
                    const pill =
                      booking.status === "Approved"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : booking.status.startsWith("Pending")
                          ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                          : "bg-red-100 text-red-800 border-red-200";
                    return (
                      <TooltipProvider key={booking.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              onClick={() => onBookingClick(booking)}
                              className={cn(
                                "p-2 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity",
                                pill,
                              )}
                            >
                              <p className="text-xs font-semibold truncate">{booking.title}</p>
                              <p className="text-[10px] opacity-70 truncate mt-0.5">
                                {getRoomName(booking.roomId)}
                              </p>
                              <p className="text-[10px] opacity-70 truncate">
                                {format(toJsDate(booking.start), "p")}
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-bold">{booking.title}</p>
                            <p>Room: {getRoomName(booking.roomId)}</p>
                            <p>
                              {format(toJsDate(booking.start), "p")} –{" "}
                              {format(toJsDate(booking.end), "p")}
                            </p>
                            <p>Status: {booking.status}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
                {/* Mobile: compact pills */}
                <div className="sm:hidden p-0.5 space-y-0.5">
                  {dayBookings.slice(0, 3).map((booking) => {
                    const pill =
                      booking.status === "Approved"
                        ? "bg-green-100 text-green-800"
                        : booking.status.startsWith("Pending")
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800";
                    return (
                      <div
                        key={booking.id}
                        onClick={() => onBookingClick(booking)}
                        className={cn(
                          "w-full text-[9px] font-medium px-1 py-0.5 rounded truncate cursor-pointer",
                          pill,
                        )}
                      >
                        {booking.title}
                      </div>
                    );
                  })}
                  {dayBookings.length > 3 && (
                    <p className="text-[9px] text-muted-foreground px-1">
                      +{dayBookings.length - 3}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MonthView = ({
  bookings,
  onDateSelect,
  selectedDate,
  onBookingClick,
}: {
  bookings: any[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
  onBookingClick: (b: any) => void;
}) => {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  const monthDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Cycle through a palette of distinct colors for bookings
  const colorPalette = [
    "bg-blue-400 hover:bg-blue-500 text-white",
    "bg-emerald-400 hover:bg-emerald-500 text-white",
    "bg-orange-400 hover:bg-orange-500 text-white",
    "bg-violet-400 hover:bg-violet-500 text-white",
    "bg-rose-400 hover:bg-rose-500 text-white",
    "bg-cyan-400 hover:bg-cyan-500 text-white",
    "bg-amber-400 hover:bg-amber-500 text-white",
  ];

  // Assign a stable color per booking id
  const getColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colorPalette[Math.abs(hash) % colorPalette.length];
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden w-full">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b bg-background">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground border-r last:border-r-0"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 divide-x divide-y">
        {monthDays.map((day) => {
          const dayBookings = bookings
            .filter((b) => b.start && isSameDay(toJsDate(b.start), day))
            .sort((a, b) => toJsDate(a.start).getTime() - toJsDate(b.start).getTime());

          const isCurrentMonth = isSameMonth(day, selectedDate);

          return (
            <div
              key={day.toString()}
              onClick={() => onDateSelect(day)}
              className={cn(
                "min-h-[60px] sm:min-h-[110px] p-0.5 sm:p-1.5 flex flex-col cursor-pointer transition-colors",
                !isCurrentMonth && "bg-muted/30",
                isCurrentMonth && "hover:bg-accent/20",
              )}
            >
              {/* Date number */}
              <div className="flex justify-end px-0.5 sm:px-1 mb-0.5 sm:mb-1">
                <span
                  className={cn(
                    "text-xs sm:text-sm font-medium h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center rounded-full",
                    !isCurrentMonth && "text-muted-foreground/40",
                    isCurrentMonth && !isToday(day) && "text-foreground",
                    isToday(day) && "bg-primary text-primary-foreground font-bold text-[10px] sm:text-xs",
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>

              {/* Event bars — hidden on mobile, show dot indicator instead */}
              <div className="flex-grow overflow-hidden">
                <div className="hidden sm:block space-y-0.5">
                  {dayBookings.slice(0, 4).map((booking) => (
                    <div
                      key={booking.id}
                      onClick={(e) => { e.stopPropagation(); onBookingClick(booking); }}
                      className={cn(
                        "w-full text-[11px] font-medium px-2 py-0.5 rounded truncate cursor-pointer transition-colors",
                        getColor(booking.id),
                      )}
                      title={booking.title}
                    >
                      {booking.title}
                    </div>
                  ))}
                  {dayBookings.length > 4 && (
                    <p className="text-[10px] text-muted-foreground font-medium px-1">
                      +{dayBookings.length - 4} more
                    </p>
                  )}
                </div>
                {/* Mobile: dot indicators */}
                {dayBookings.length > 0 && (
                  <div className="sm:hidden flex flex-wrap gap-0.5 justify-center mt-0.5">
                    {dayBookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking.id}
                        onClick={(e) => { e.stopPropagation(); onBookingClick(booking); }}
                        className={cn("h-1.5 w-1.5 rounded-full", getColor(booking.id).split(" ")[0])}
                      />
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function ReservationCalendarPage() {
  const { canCreateRoomReservation } = useUserRole();
  const router = useRouter();

  const [view, setView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduleFilter, setScheduleFilter] = useState("all");

  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleBookingClick = (booking: any) => {
    setSelectedBooking(booking);
    setIsDetailsOpen(true);
  };

  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: getRooms,
  });
  const { data: workers, isLoading: workersLoading } = useQuery({
    queryKey: ["workers"],
    queryFn: getWorkers,
  });
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => getBookings(),
  });
  const { data: branches, isLoading: branchesLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: getBranches,
  });
  const { data: areas, isLoading: areasLoading } = useQuery({
    queryKey: ["areas"],
    queryFn: getAreas,
  });
  const { data: venueElements, isLoading: venueElementsLoading } = useQuery({
    queryKey: ["venue-elements"],
    queryFn: getVenueElements,
  });

  const [branchFilter, setBranchFilter] = useState<string>("");

  // Default to Dasmarinas once branches load
  React.useEffect(() => {
    if (branches && branches.length > 0 && !branchFilter) {
      const dasma = branches.find((b) =>
        b.name.toLowerCase().includes("dasma"),
      );
      if (dasma) {
        setBranchFilter(dasma.id);
      } else {
        setBranchFilter("all");
      }
    }
  }, [branches, branchFilter]);

  const isLoading =
    roomsLoading ||
    bookingsLoading ||
    workersLoading ||
    branchesLoading ||
    areasLoading ||
    venueElementsLoading;

  const filteredRoomsForDayView = useMemo(() => {
    if (view !== "day" || !rooms || !bookings) return rooms || [];

    let result = rooms;

    // Apply Location / Branch Filter
    if (branchFilter && branchFilter !== "all" && areas) {
      const branchAreaIds = new Set(
        areas.filter((a) => a.branchId === branchFilter).map((a) => a.areaId),
      );
      result = result.filter((r) => branchAreaIds.has(r.areaId));
    }

    const dayBookings = bookings.filter(
      (b) => b.start && isSameDay(toJsDate(b.start), currentDate) && b.status !== "Rejected",
    );
    const scheduledRoomIds = new Set(dayBookings.map((b) => b.roomId));

    if (scheduleFilter === "scheduled") {
      result = result.filter((r) => scheduledRoomIds.has(r.id));
    } else if (scheduleFilter === "available") {
      result = result.filter((r) => !scheduledRoomIds.has(r.id));
    }
    return result;
  }, [view, rooms, bookings, currentDate, scheduleFilter, branchFilter, areas]);

  const handlePrev = () => {
    if (view === "day") setCurrentDate(subDays(currentDate, 1));
    else if (view === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (view === "day") setCurrentDate(addDays(currentDate, 1));
    else if (view === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    setView("day");
  };

  // Exclude rejected bookings from the calendar views
  const visibleBookings = useMemo(
    () => (bookings || []).filter((b: any) => b.status !== "Rejected"),
    [bookings],
  );

  const dateRangeDisplay = useMemo(() => {
    if (view === "day") return format(currentDate, "MMMM d, yyyy");
    if (view === "week") {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    }
    return format(currentDate, "MMMM yyyy");
  }, [currentDate, view]);

  return (
    <AppLayout>
      {/* Toolbar */}
      <div className="flex flex-col gap-2 mb-4">
        {/* Row 1: nav arrows + date label + view tabs */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handlePrev} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-sm sm:text-base font-semibold tracking-tight whitespace-nowrap">
              {dateRangeDisplay}
            </h2>
            <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as "month" | "week" | "day")}
          >
            <TabsList className="h-8">
              <TabsTrigger value="month" className="text-xs sm:text-sm px-2 sm:px-4">Month</TabsTrigger>
              <TabsTrigger value="week" className="text-xs sm:text-sm px-2 sm:px-4">Week</TabsTrigger>
              <TabsTrigger value="day" className="text-xs sm:text-sm px-2 sm:px-4">Day</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {/* Row 2: Today + Book a Room */}
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleToday} className="h-8 px-3 text-xs sm:text-sm font-medium">
            Today
          </Button>
          {canCreateRoomReservation && (
            <Button onClick={() => router.push("/reservations/new")} className="h-8 gap-1 text-xs sm:text-sm">
              <PlusCircle className="h-3.5 w-3.5" /> Book a Room
            </Button>
          )}
        </div>
      </div>

      {view === "day" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 mb-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="branch-filter" className="text-sm font-medium shrink-0">
              Location:
            </Label>
            <Select
              value={branchFilter || "all"}
              onValueChange={setBranchFilter}
            >
              <SelectTrigger id="branch-filter" className="flex-1">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {branches?.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="schedule-filter" className="text-sm font-medium shrink-0">
              Show rooms:
            </Label>
            <Select value={scheduleFilter} onValueChange={setScheduleFilter}>
              <SelectTrigger id="schedule-filter" className="flex-1">
                <SelectValue placeholder="Filter rooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                <SelectItem value="scheduled">With Schedule</SelectItem>
                <SelectItem value="available">Without Schedule</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="mt-2 w-full">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <LoaderCircle className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {view === "month" && (
              <MonthView
                bookings={visibleBookings}
                onDateSelect={handleDateSelect}
                selectedDate={currentDate}
                onBookingClick={handleBookingClick}
              />
            )}
            {view === "week" && (
              <WeekView
                bookings={visibleBookings}
                rooms={rooms || []}
                workers={workers || []}
                date={currentDate}
                onDateSelect={handleDateSelect}
                onBookingClick={handleBookingClick}
              />
            )}
            {view === "day" && (
              <DayView
                bookings={visibleBookings}
                rooms={filteredRoomsForDayView || []}
                workers={workers || []}
                date={currentDate}
                areas={areas || []}
                onBookingClick={handleBookingClick}
              />
            )}
          </>
        )}
      </div>

      <BookingDetailsSheet
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        booking={selectedBooking}
        roomName={
          selectedBooking
            ? rooms?.find((r) => r.id === selectedBooking.roomId)?.name ||
              "Unknown Room"
            : ""
        }
        workers={workers || []}
        venueElements={venueElements || []}
      />
    </AppLayout>
  );
}

const BookingDetailsSheet = ({
  isOpen,
  onClose,
  booking,
  roomName,
  workers,
  venueElements,
}: {
  isOpen: boolean;
  onClose: () => void;
  booking: any | null;
  roomName: string;
  workers: any[];
  venueElements: any[];
}) => {
  if (!booking) return null;

  const startTime = toJsDate(booking.start);
  const endTime = toJsDate(booking.end);

  const getUserName = (userId: string) => {
    const user = workers?.find((w) => w.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown";
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge
              className={cn(
                "px-2 py-0.5",
                booking.status === "Approved"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : booking.status.startsWith("Pending")
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
              )}
            >
              {booking.status}
            </Badge>
            {booking.requestId && (
              <span className="text-xs font-mono text-muted-foreground">
                ID: {booking.requestId}
              </span>
            )}
          </div>
          <SheetTitle className="text-2xl font-headline font-bold">
            {booking.title}
          </SheetTitle>
          <SheetDescription>
            Reservation Details & Requirements
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <div>
                <p className="font-semibold">{roomName}</p>
                <p className="text-muted-foreground text-xs">Venue Location</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <div>
                <p className="font-semibold">{format(startTime, "PPPP")}</p>
                <p className="text-muted-foreground text-xs">Event Date</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="font-semibold">
                  {format(startTime, "p")} - {format(endTime, "p")}
                </p>
                <p className="text-muted-foreground text-xs">Reserved Time</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Purpose
            </h4>
            <p className="text-sm leading-relaxed">
              {booking.purpose || "No description provided."}
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold">{booking.pax}</p>
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">
                Pax
              </p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Building2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold">{booking.numTables || 0}</p>
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">
                Tables
              </p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Info className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold">{booking.numChairs || 0}</p>
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">
                Chairs
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Requested Elements
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {booking.requestedElements && booking.requestedElements.length > 0
                ? booking.requestedElements.map((elId: string) => {
                    const el = venueElements.find((v) => v.id === elId);
                    return (
                      <div
                        key={elId}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>
                          {el ? el.name : elId}{" "}
                          <span className="text-xs text-muted-foreground ml-1">
                            ({el?.category || "Unknown"})
                          </span>
                        </span>
                      </div>
                    );
                  })
                : null}

              {/* Legacy fallback */}
              {(!booking.requestedElements ||
                booking.requestedElements.length === 0) && (
                <>
                  {booking.equipment_TV && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Television / Display (Legacy)</span>
                    </div>
                  )}
                  {booking.equipment_Mic && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Microphone System (Legacy)</span>
                    </div>
                  )}
                  {booking.equipment_Speakers && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Sound System / Speakers (Legacy)</span>
                    </div>
                  )}
                  {!booking.equipment_TV &&
                    !booking.equipment_Mic &&
                    !booking.equipment_Speakers && (
                      <p className="text-sm text-muted-foreground italic">
                        No elements requested.
                      </p>
                    )}
                </>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Timer className="h-3 w-3" />
              <span>
                Requested on:{" "}
                {booking.dateRequested
                  ? format(toJsDate(booking.dateRequested), "PPP p")
                  : "N/A"}
              </span>
            </div>

          </div>

          <Button variant="outline" className="w-full mt-4" onClick={onClose}>
            Close Details
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
