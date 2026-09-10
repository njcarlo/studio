"use client";

import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Button,
  Badge,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Separator,
} from "@studio/ui";
import {
  Search,
  Calendar as CalendarIcon,
  MoreHorizontal,
  LoaderCircle,
  CheckCircle2,
  Tv,
  Mic,
  Speaker,
  ScanLine,
} from "lucide-react";
import { cn, toJsDate } from "@/lib/utils";
import { useUserRole } from "@/hooks/use-user-role";
import { useAuthStore } from "@studio/store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBookings,
  getRooms,
  getAreas,
  getVenueElements,
  getMinistries,
  updateBooking,
  createScanLog,
} from "@/actions/db";
import { format, isAfter, isBefore, isToday, subMinutes } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { Booking, Room, Area, VenueElement, Ministry } from "@studio/types";

type TabFilter = "upcoming" | "active" | "history";

export default function MyReservationsPage() {
  const { user } = useAuthStore();
  const { workerProfile, isLoading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabFilter>("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Queries
  const { data: allBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => getBookings(),
  });

  const { data: rooms } = useQuery({
    queryKey: ["rooms"],
    queryFn: getRooms,
  });

  const { data: areas } = useQuery({
    queryKey: ["areas"],
    queryFn: getAreas,
  });

  const { data: venueElements } = useQuery({
    queryKey: ["venue-elements"],
    queryFn: getVenueElements,
  });

  const { data: ministries } = useQuery({
    queryKey: ["ministries"],
    queryFn: getMinistries,
  });

  const isLoading = roleLoading || bookingsLoading;

  // Filter bookings belonging to the current user
  const userBookings = useMemo(() => {
    if (!allBookings) return [];
    return (allBookings as any[]).filter((b: any) => {
      const matchesProfile =
        workerProfile && b.workerProfileId === workerProfile.id;
      const matchesEmail =
        user?.email &&
        (b.email === user.email || b.requesterEmail === user.email);
      return matchesProfile || matchesEmail;
    });
  }, [allBookings, workerProfile, user]);

  // Apply tab, search, date, and status filters
  const filteredBookings = useMemo(() => {
    let result = [...userBookings];
    const now = new Date();

    // Tab filter
    if (activeTab === "upcoming") {
      result = result.filter((b) => isAfter(toJsDate(b.start), now));
      result.sort(
        (a, b) => toJsDate(a.start).getTime() - toJsDate(b.start).getTime()
      );
    } else if (activeTab === "active") {
      result = result.filter((b) => {
        const start = toJsDate(b.start);
        const end = toJsDate(b.end);
        return isToday(start) || (isBefore(start, now) && isAfter(end, now));
      });
      result.sort(
        (a, b) => toJsDate(a.start).getTime() - toJsDate(b.start).getTime()
      );
    } else {
      // "history"
      result = result.filter((b) => isBefore(toJsDate(b.end), now));
      result.sort(
        (a, b) => toJsDate(b.start).getTime() - toJsDate(a.start).getTime()
      );
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((b) => {
        const room = rooms?.find((r) => r.id === b.roomId);
        const area = areas?.find(
          (a) => a.id === room?.areaId || a.areaId === room?.areaId
        );
        const reqId = b.requestId || `REQ-${b.id?.slice(0, 4)}`;

        return (
          reqId.toLowerCase().includes(q) ||
          b.title.toLowerCase().includes(q) ||
          b.purpose?.toLowerCase().includes(q) ||
          room?.name.toLowerCase().includes(q) ||
          area?.name.toLowerCase().includes(q)
        );
      });
    }

    // Specific Date filter
    if (dateFilter) {
      result = result.filter((b) => {
        const dStr = format(toJsDate(b.start), "yyyy-MM-dd");
        return dStr === dateFilter;
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((b) => {
        if (statusFilter === "Pending") {
          return b.status.toLowerCase().startsWith("pending");
        }
        return b.status.toLowerCase() === statusFilter.toLowerCase();
      });
    }

    return result;
  }, [
    userBookings,
    activeTab,
    searchQuery,
    dateFilter,
    statusFilter,
    rooms,
    areas,
  ]);

  const getRoom = (roomId: string) => {
    return (rooms as any[])?.find((r: any) => r.id === roomId);
  };

  const getArea = (areaId?: string) => {
    return (areas as any[])?.find(
      (a: any) => a.id === areaId || a.areaId === areaId
    );
  };

  const handleCheckIn = async (booking: any) => {
    if (!booking.id) return;

    try {
      await updateBooking(booking.id, { checkedInAt: new Date() });

      await createScanLog({
        scannerId: workerProfile?.id || "system-admin",
        scannerName: workerProfile
          ? `${workerProfile.firstName} ${workerProfile.lastName}`
          : "System Admin",
        scanType: "Room Check-in",
        details: `Self check-in for: ${booking.title}`,
        reservationId: booking.id,
        targetUserId: workerProfile?.id,
        targetUserName: workerProfile
          ? `${workerProfile.firstName} ${workerProfile.lastName}`
          : undefined,
      });

      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast({
        title: "Checked In Successfully",
        description: `You have checked into ${getRoom(booking.roomId)?.name || "the room"}.`,
      });
    } catch (error) {
      console.error("Check-in error:", error);
      toast({
        variant: "destructive",
        title: "Check-in Failed",
        description: "Could not complete check-in. Please try again.",
      });
    }
  };

  const canCheckIn = (booking: any) => {
    if (booking.status !== "Approved" || booking.checkedInAt) return false;
    const now = new Date();
    const start = toJsDate(booking.start);
    const end = toJsDate(booking.end);
    const allowStart = subMinutes(start, 15);
    return isAfter(now, allowStart) && isBefore(now, end);
  };

  return (
    <AppLayout>
      <div className="w-full space-y-6 pb-12">
        {/* Header Section */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-headline text-gray-900 dark:text-white">
            My Reservations
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your upcoming, active, and past room reservations.
          </p>
        </div>

        {/* Main Card Container */}
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-200/80 dark:border-border p-6 shadow-xs overflow-hidden">
          {/* Top Controls Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Tab Switcher Pills */}
            <div className="bg-gray-100 dark:bg-muted p-1 rounded-xl flex items-center border border-gray-200/50 dark:border-border/50 self-start">
              <button
                type="button"
                onClick={() => setActiveTab("upcoming")}
                className={cn(
                  "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  activeTab === "upcoming"
                    ? "bg-white dark:bg-card shadow-xs text-gray-800 dark:text-foreground"
                    : "text-gray-500 hover:text-gray-800 dark:text-muted-foreground dark:hover:text-foreground"
                )}
              >
                Upcoming
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("active")}
                className={cn(
                  "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  activeTab === "active"
                    ? "bg-white dark:bg-card shadow-xs text-gray-800 dark:text-foreground"
                    : "text-gray-500 hover:text-gray-800 dark:text-muted-foreground dark:hover:text-foreground"
                )}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={cn(
                  "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  activeTab === "history"
                    ? "bg-white dark:bg-card shadow-xs text-gray-800 dark:text-foreground"
                    : "text-gray-500 hover:text-gray-800 dark:text-muted-foreground dark:hover:text-foreground"
                )}
              >
                History
              </button>
            </div>

            {/* Right Controls: Search, Date Picker, Status Filter */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search ID, room..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs rounded-xl border-gray-200 dark:border-border w-44 sm:w-56"
                />
              </div>

              {/* Date Filter */}
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  type="date"
                  placeholder="dd/mm/yyyy"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-8 h-9 text-xs rounded-xl border-gray-200 dark:border-border w-36"
                />
              </div>

              {/* Status Select */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-36 text-xs rounded-xl border-gray-200 dark:border-border font-medium">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All Statuses
                  </SelectItem>
                  <SelectItem value="Approved" className="text-xs">
                    Approved
                  </SelectItem>
                  <SelectItem value="Pending" className="text-xs">
                    Pending
                  </SelectItem>
                  <SelectItem value="Rejected" className="text-xs">
                    Rejected
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table Content */}
          <div className="border border-gray-200/80 dark:border-border rounded-xl mt-6 overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Loading your reservations...
                </p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="py-20 text-center text-gray-400 dark:text-gray-500">
                <p className="text-sm font-medium">No reservations found.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You have no {activeTab} reservations matching your search.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 text-xs rounded-xl"
                  onClick={() => (window.location.href = "/reservations/new")}
                >
                  Reserve a Room
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F8F9FA] dark:bg-muted/40 hover:bg-[#F8F9FA] border-b border-gray-200 dark:border-border">
                    <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs h-12 px-6 text-center w-[14%]">
                      ID
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs h-12 px-6 text-center w-[22%]">
                      Floor / Room
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs h-12 px-6 text-center w-[18%]">
                      Date
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs h-12 px-6 text-center w-[18%]">
                      Time
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs h-12 px-4 text-center w-[8%]">
                      Pax
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs h-12 px-6 text-center w-[12%]">
                      Status
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs h-12 px-6 text-center w-[8%]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => {
                    const room = getRoom(booking.roomId);
                    const area = getArea(room?.areaId);
                    const startTime = toJsDate(booking.start);
                    const endTime = toJsDate(booking.end);
                    const reqId =
                      booking.requestId || `REQ-${booking.id?.slice(0, 4)}`;

                    const isApproved = booking.status === "Approved";
                    const isPending = booking.status
                      ?.toLowerCase()
                      .startsWith("pending");

                    return (
                      <TableRow
                        key={booking.id}
                        className="hover:bg-gray-50/60 dark:hover:bg-muted/30 border-b border-gray-100 dark:border-border/60 transition-colors"
                      >
                        {/* ID */}
                        <TableCell className="py-4 px-6 text-center align-middle font-medium text-xs text-gray-700 dark:text-gray-300 font-mono">
                          {reqId}
                        </TableCell>

                        {/* Floor / Room */}
                        <TableCell className="py-4 px-6 text-center align-middle">
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">
                              {area?.name || "5th Floor"},
                            </p>
                            <p className="text-xs text-gray-800 dark:text-gray-200 font-semibold mt-0.5">
                              {room?.name || "Sapphire"}
                            </p>
                          </div>
                        </TableCell>

                        {/* Date */}
                        <TableCell className="py-4 px-6 text-center align-middle text-xs text-gray-700 dark:text-gray-300 font-medium">
                          {format(startTime, "MMMM d, yyyy")}
                        </TableCell>

                        {/* Time */}
                        <TableCell className="py-4 px-6 text-center align-middle text-xs text-gray-600 dark:text-gray-400 font-medium">
                          {format(startTime, "h:mm a")} -{" "}
                          {format(endTime, "h:mm a")}
                        </TableCell>

                        {/* Pax */}
                        <TableCell className="py-4 px-4 text-center align-middle text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {booking.pax || 0}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-4 px-6 text-center align-middle">
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Approved
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              {booking.status}
                            </span>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-4 px-6 text-center align-middle">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-muted text-gray-500 hover:text-gray-800 transition-colors"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setIsDetailsOpen(true);
                                }}
                                className="text-xs cursor-pointer font-medium"
                              >
                                View Details
                              </DropdownMenuItem>

                              {canCheckIn(booking) && (
                                <DropdownMenuItem
                                  onClick={() => handleCheckIn(booking)}
                                  className="text-xs cursor-pointer font-medium text-blue-600"
                                >
                                  <ScanLine className="h-3.5 w-3.5 mr-1.5" />
                                  Check In
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      {/* Booking Details Sheet */}
      <BookingDetailsSheet
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        booking={selectedBooking}
        roomName={
          selectedBooking
            ? getRoom(selectedBooking.roomId)?.name || "Unknown Room"
            : ""
        }
        areaName={
          selectedBooking
            ? getArea(getRoom(selectedBooking.roomId)?.areaId)?.name ||
              "First Floor"
            : ""
        }
        venueElements={(venueElements as any[]) || []}
        ministries={(ministries as any[]) || []}
      />
    </AppLayout>
  );
}

const BookingDetailsSheet = ({
  isOpen,
  onClose,
  booking,
  roomName,
  areaName,
  venueElements,
  ministries,
}: {
  isOpen: boolean;
  onClose: () => void;
  booking: any | null;
  roomName: string;
  areaName: string;
  venueElements: any[];
  ministries: any[];
}) => {
  if (!booking) return null;

  const startTime = toJsDate(booking.start);
  const endTime = toJsDate(booking.end);
  const ministry = ministries?.find((m) => m.id === booking.ministryId);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-6 border-b text-left">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 text-xs font-semibold">
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
            <DetailRow label="Location" value={`${roomName} (${areaName})`} />
            <DetailRow label="Date" value={format(startTime, "PPPP")} />
            <DetailRow
              label="Schedule"
              value={`${format(startTime, "h:mm a")} – ${format(endTime, "h:mm a")}`}
            />
            {ministry && (
              <DetailRow label="Ministry" value={ministry.name} />
            )}
            <DetailRow
              label="Headcount (Pax)"
              value={`${booking.pax || 0} pax`}
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

          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Requested Elements & AV
            </h4>
            <div className="grid grid-cols-1 gap-2.5">
              {booking.requestedElements &&
              booking.requestedElements.length > 0 ? (
                booking.requestedElements.map((elId: string) => {
                  const el = venueElements.find((v) => v.id === elId);
                  return (
                    <div
                      key={elId}
                      className="flex items-center justify-between p-3 rounded-xl border bg-emerald-50/50 border-emerald-100 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white dark:bg-card shadow-xs">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div>
                          <span className="text-xs font-bold block">
                            {el?.name || elId}
                          </span>
                          {el?.category && (
                            <span className="text-[9px] text-emerald-600/70 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                              {el.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                        Requested
                      </span>
                    </div>
                  );
                })
              ) : booking.equipment_TV ||
                booking.equipment_Mic ||
                booking.equipment_Speakers ? (
                <>
                  {booking.equipment_TV && (
                    <div className="flex items-center justify-between p-3 rounded-xl border bg-blue-50/50 border-blue-100 text-blue-900 dark:bg-blue-950/20 dark:border-blue-900/40 dark:text-blue-300">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white dark:bg-card shadow-xs">
                          <Tv className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="text-xs font-bold">
                          Television / Presentation
                        </span>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                        Requested
                      </span>
                    </div>
                  )}
                  {booking.equipment_Mic && (
                    <div className="flex items-center justify-between p-3 rounded-xl border bg-emerald-50/50 border-emerald-100 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-300">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white dark:bg-card shadow-xs">
                          <Mic className="h-4 w-4 text-emerald-500" />
                        </div>
                        <span className="text-xs font-bold">
                          Microphone & Audio
                        </span>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                        Requested
                      </span>
                    </div>
                  )}
                  {booking.equipment_Speakers && (
                    <div className="flex items-center justify-between p-3 rounded-xl border bg-purple-50/50 border-purple-100 text-purple-900 dark:bg-purple-950/20 dark:border-purple-900/40 dark:text-purple-300">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white dark:bg-card shadow-xs">
                          <Speaker className="h-4 w-4 text-purple-500" />
                        </div>
                        <span className="text-xs font-bold">
                          Sound System / Speakers
                        </span>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
                        Requested
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-400 italic">
                  No elements were requested.
                </p>
              )}
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

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm font-medium">{value}</span>
  </div>
);
