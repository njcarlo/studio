"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Search,
  CheckCircle2,
  Tv,
  Mic,
  Speaker,
  LoaderCircle,
} from "lucide-react";
import { format, isAfter, isBefore, startOfToday } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import type { Booking, Room, Area, Worker, VenueElement, Ministry } from "@studio/types";
import { Badge } from "@studio/ui";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Separator,
  Input,
  Button,
} from "@studio/ui";

const ITEMS_PER_PAGE = 6;

export default function MasterviewPage() {
  const { canViewScheduleMasterview, isLoading: roleLoading } = useUserRole();
  const router = useRouter();

  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"history" | "upcoming">("history");

  // Fetch live data directly from Database actions via React Query
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

  const handleBookingClick = (booking: any) => {
    setSelectedBooking(booking);
    setIsDetailsOpen(true);
  };

  // Filter & process approved bookings
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];

    let result = [...bookings]
      .filter((b) => b.status === "Approved")
      .sort(
        (a, b) => toJsDate(b.start).getTime() - toJsDate(a.start).getTime()
      );

    if (viewMode === "upcoming") {
      const today = startOfToday();
      result = result.filter((b) => isAfter(toJsDate(b.end), today));
      result.sort(
        (a, b) => toJsDate(a.start).getTime() - toJsDate(b.start).getTime()
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((b) => {
        const room = rooms?.find((r) => r.id === b.roomId);
        const area = areas?.find(
          (a) => a.id === room?.areaId || a.areaId === room?.areaId
        );
        const worker = workers?.find((w) => w.id === b.workerProfileId);
        const requesterName = worker
          ? `${worker.firstName} ${worker.lastName}`
          : b.name || "";

        return (
          b.title.toLowerCase().includes(query) ||
          b.purpose?.toLowerCase().includes(query) ||
          room?.name.toLowerCase().includes(query) ||
          area?.name.toLowerCase().includes(query) ||
          requesterName.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [bookings, viewMode, searchQuery, rooms, areas, workers]);

  // Pagination calculation
  const totalRecords = filteredBookings.length;
  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE) || 1;

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBookings.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBookings, currentPage]);

  // Calculate visible page numbers for pagination
  const visiblePageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 3;
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  if (roleLoading) return null;
  if (!canViewScheduleMasterview) return null;

  return (
    <AppLayout>
      <div className="w-full space-y-6 pb-12">
        {/* Header Section */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">
            Schedule Masterview
          </h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive reservation manifest and facility utilization.
          </p>
        </div>

        {/* Search Bar & View Mode Toggle Card */}
        <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-card-dark flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by title, purpose, or room..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 text-sm h-10 bg-background border-border/60 rounded-xl"
            />
          </div>

          <div className="bg-muted/50 p-1 rounded-xl flex items-center self-end sm:self-auto border border-border/40">
            <button
              type="button"
              onClick={() => { setViewMode("history"); setCurrentPage(1); }}
              className={cn(
                "px-5 py-1.5 text-xs font-semibold rounded-lg transition-all",
                viewMode === "history"
                  ? "bg-card shadow-xs text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              History
            </button>
            <button
              type="button"
              onClick={() => { setViewMode("upcoming"); setCurrentPage(1); }}
              className={cn(
                "px-5 py-1.5 text-xs font-semibold rounded-lg transition-all",
                viewMode === "upcoming"
                  ? "bg-card shadow-xs text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Upcoming
            </button>
          </div>
        </div>

        {/* Table Container Card */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark overflow-hidden flex flex-col min-h-[480px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3 flex-grow">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading schedule records...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center flex-grow">
              <h3 className="text-lg font-semibold text-foreground">No Reservations Found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                No approved reservations match your current search criteria.
              </p>
            </div>
          ) : (
            <>
              {/* ── MOBILE CARD LIST (hidden on lg+) ── */}
              <div className="flex flex-col divide-y divide-gray-100 dark:divide-border lg:hidden flex-grow">
                {paginatedBookings.map((booking) => {
                  const room = rooms?.find((r) => r.id === booking.roomId);
                  const area = areas?.find(
                    (a) => a.id === room?.areaId || a.areaId === room?.areaId
                  );
                  const startTime = toJsDate(booking.start);
                  const endTime = toJsDate(booking.end);
                  const hasEquipment = booking.equipment_TV || booking.equipment_Mic || booking.equipment_Speakers;
                  const hasRequestedElements = booking.requestedElements && booking.requestedElements.length > 0;

                  return (
                    <div
                      key={booking.id}
                      className="p-4 hover:bg-gray-50/60 dark:hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          {/* Title */}
                          <p className="font-bold text-sm text-gray-800 dark:text-gray-100 leading-snug truncate">
                            {booking.title}
                          </p>
                          {/* Venue */}
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            📍 {room?.name || "Unassigned"} · {area?.name || "First Floor"}
                          </p>
                          {/* Date & Time */}
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            📅 {format(startTime, "MMM d, yyyy")} · {format(startTime, "h:mm a")} – {format(endTime, "h:mm a")}
                          </p>
                          {/* Requirements */}
                          {(hasRequestedElements || hasEquipment) && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {hasRequestedElements
                                ? booking.requestedElements.map((elId: string) => {
                                    const el = venueElements?.find((v) => v.id === elId);
                                    return (
                                      <Badge key={elId} variant="outline" className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 rounded-md">
                                        {el ? el.name : elId}
                                      </Badge>
                                    );
                                  })
                                : <>
                                    {booking.equipment_TV && <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 rounded-md">TV</Badge>}
                                    {booking.equipment_Mic && <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 rounded-md">Mic</Badge>}
                                    {booking.equipment_Speakers && <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 rounded-md">Audio</Badge>}
                                  </>
                              }
                            </div>
                          )}
                        </div>
                        {/* Info button */}
                        <button
                          type="button"
                          onClick={() => handleBookingClick(booking)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-muted shrink-0"
                        >
                          <Info className="h-4 w-4 stroke-[1.75]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── DESKTOP TABLE (hidden on mobile) ── */}
              <div className="hidden lg:block overflow-x-auto flex-grow">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60">
                      <TableHead className="font-bold text-muted-foreground text-[11px] uppercase tracking-wider h-11 px-8 text-left w-[24%]">
                        Venue
                      </TableHead>
                      <TableHead className="font-bold text-muted-foreground text-[11px] uppercase tracking-wider h-11 px-6 text-left w-[26%]">
                        Date & Time
                      </TableHead>
                      <TableHead className="font-bold text-muted-foreground text-[11px] uppercase tracking-wider h-11 px-6 text-left w-[26%]">
                        Event Details
                      </TableHead>
                      <TableHead className="font-bold text-muted-foreground text-[11px] uppercase tracking-wider h-11 px-6 text-center w-[18%]">
                        Requirements
                      </TableHead>
                      <TableHead className="w-[6%] h-11 px-6" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedBookings.map((booking) => {
                      const room = rooms?.find((r) => r.id === booking.roomId);
                      const area = areas?.find(
                        (a) => a.id === room?.areaId || a.areaId === room?.areaId
                      );
                      const startTime = toJsDate(booking.start);
                      const endTime = toJsDate(booking.end);

                      const hasEquipment =
                        booking.equipment_TV ||
                        booking.equipment_Mic ||
                        booking.equipment_Speakers;
                      const hasRequestedElements =
                        booking.requestedElements &&
                        booking.requestedElements.length > 0;

                      return (
                        <TableRow
                          key={booking.id}
                          className="hover:bg-muted/20 border-b border-border/40 transition-colors"
                        >
                          {/* Venue */}
                          <TableCell className="py-4 px-8 align-middle">
                            <p className="font-bold text-sm text-foreground leading-snug">
                              {room?.name || "Unassigned Room"}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {area?.name || "First Floor"}
                            </p>
                          </TableCell>

                          {/* Date & Time */}
                          <TableCell className="py-4 px-6 align-middle">
                            <p className="font-bold text-sm text-foreground leading-snug">
                              {format(startTime, "MMMM d, yyyy")}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {format(startTime, "h:mm a")} – {format(endTime, "h:mm a")}
                            </p>
                          </TableCell>

                          {/* Event Details */}
                          <TableCell className="py-4 px-6 align-middle">
                            <p className="font-bold text-sm text-foreground leading-snug">
                              {booking.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                              {booking.purpose || "Meeting"}
                            </p>
                          </TableCell>

                          {/* Requirements */}
                          <TableCell className="py-4 px-6 align-middle text-center">
                            {hasRequestedElements ? (
                              <div className="flex flex-wrap gap-1 justify-center max-w-[180px] mx-auto">
                                {booking.requestedElements.map((elId: string) => {
                                  const el = venueElements?.find((v) => v.id === elId);
                                  return (
                                    <Badge
                                      key={elId}
                                      variant="outline"
                                      className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 rounded-md"
                                    >
                                      {el ? el.name : elId}
                                    </Badge>
                                  );
                                })}
                              </div>
                            ) : hasEquipment ? (
                              <div className="flex flex-wrap gap-1 justify-center max-w-[180px] mx-auto">
                                {booking.equipment_TV && (
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800 rounded-md">
                                    TV
                                  </Badge>
                                )}
                                {booking.equipment_Mic && (
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 rounded-md">
                                    Mic
                                  </Badge>
                                )}
                                {booking.equipment_Speakers && (
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800 rounded-md">
                                    Audio
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground/50">None</span>
                            )}
                          </TableCell>

                          {/* Info Button */}
                          <TableCell className="py-4 px-6 align-middle text-right">
                            <button
                              type="button"
                              onClick={() => handleBookingClick(booking)}
                              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
                              title="View details"
                            >
                              <Info className="h-4 w-4 stroke-[1.75]" />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {/* end desktop table */}
              
              {/* Pagination Footer */}
              <div className="mt-auto p-4 px-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  Showing{" "}
                  {totalRecords > 0
                    ? `${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, totalRecords)}`
                    : "0"}{" "}
                  of {totalRecords} records
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {visiblePageNumbers.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "h-8 w-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all",
                        currentPage === page
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "border border-border text-foreground hover:bg-muted"
                      )}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Booking Details Sheet (View Only) */}
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
        areaName={
          selectedBooking
            ? areas?.find((a) => {
                const r = rooms?.find((rm) => rm.id === selectedBooking.roomId);
                return a.id === r?.areaId || a.areaId === r?.areaId;
              })?.name || "First Floor"
            : ""
        }
        workers={workers || []}
        venueElements={venueElements || []}
        ministries={ministries || []}
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
  workers,
  venueElements,
  ministries,
}: {
  isOpen: boolean;
  onClose: () => void;
  booking: any | null;
  roomName: string;
  areaName: string;
  workers: Worker[];
  venueElements: any[];
  ministries: Ministry[];
}) => {
  if (!booking) return null;

  const startTime = toJsDate(booking.start);
  const endTime = toJsDate(booking.end);
  const requesterWorker = workers?.find(
    (w) => w.id === booking.workerProfileId
  );
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
            <DetailRow
              label="Requested By"
              value={
                requesterWorker
                  ? `${requesterWorker.firstName} ${requesterWorker.lastName}`
                  : booking.name || "Unknown"
              }
            />
            {ministry && (
              <DetailRow label="Ministry" value={ministry.name} />
            )}
            <DetailRow label="Headcount (Pax)" value={`${booking.pax || 0} pax`} />
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">
              Purpose
            </h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {booking.purpose || "No specific purpose provided for this reservation."}
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
