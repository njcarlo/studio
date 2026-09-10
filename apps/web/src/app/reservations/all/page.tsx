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
  SelectGroup,
  SelectLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Checkbox,
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
  Filter,
  MoreHorizontal,
  LoaderCircle,
  Check,
  X,
  Trash2,
  CheckCircle2,
  Tv,
  Mic,
  Speaker,
  XCircle,
} from "lucide-react";
import { cn, toJsDate } from "@/lib/utils";
import { useUserRole } from "@/hooks/use-user-role";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBookings,
  getRooms,
  getAreas,
  getVenueElements,
  getMinistries,
  getWorkers,
  updateBooking,
  deleteBooking,
} from "@/actions/db";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { Booking, Room, Area, VenueElement, Ministry, Worker } from "@studio/types";

export default function AllReservationsPage() {
  const { canApproveRoomReservation, isLoading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const { data: workers } = useQuery({
    queryKey: ["workers"],
    queryFn: getWorkers,
  });

  const isLoading = roleLoading || bookingsLoading;

  const getRoom = (roomId: string) => {
    return (rooms as any[])?.find((r: any) => r.id === roomId);
  };

  const getArea = (areaId?: string) => {
    return (areas as any[])?.find(
      (a: any) => a.id === areaId || a.areaId === areaId
    );
  };

  const getRequesterName = (booking: any) => {
    const worker = workers?.find((w) => w.id === booking.workerProfileId);
    if (worker) return `${worker.firstName} ${worker.lastName}`;
    return booking.name || "System Admin";
  };

  const getInitials = (name: string) => {
    if (!name) return "SA";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const filteredBookings = useMemo(() => {
    if (!allBookings) return [];
    return (allBookings as any[])
      .filter((b: any) => {
        const room = getRoom(b.roomId);
        const area = getArea(room?.areaId);
        const reqName = getRequesterName(b);
        const reqId = b.requestId || `REQ-${b.id?.slice(0, 4)}`;

        // Search Filter
        const q = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !q ||
          reqId.toLowerCase().includes(q) ||
          reqName.toLowerCase().includes(q) ||
          b.title.toLowerCase().includes(q) ||
          (b.purpose && b.purpose.toLowerCase().includes(q)) ||
          (room && room.name.toLowerCase().includes(q)) ||
          (area && area.name.toLowerCase().includes(q));

        // Status Filter
        let matchesStatus = true;
        if (statusFilter !== "all") {
          if (statusFilter === "Pending") {
            matchesStatus = b.status.toLowerCase().startsWith("pending");
          } else {
            matchesStatus =
              b.status.toLowerCase() === statusFilter.toLowerCase();
          }
        }

        // Room/Floor Filter
        let matchesRoom = true;
        if (roomFilter !== "all") {
          matchesRoom = b.roomId === roomFilter || room?.areaId === roomFilter;
        }

        // Date Filter
        let matchesDate = true;
        if (dateFilter) {
          const dStr = format(toJsDate(b.start), "yyyy-MM-dd");
          matchesDate = dStr === dateFilter;
        }

        return matchesSearch && matchesStatus && matchesRoom && matchesDate;
      })
      .sort(
        (a: any, b: any) =>
          toJsDate(b.start).getTime() - toJsDate(a.start).getTime()
      );
  }, [
    allBookings,
    searchTerm,
    statusFilter,
    roomFilter,
    dateFilter,
    rooms,
    areas,
    workers,
  ]);

  // Handle Select All Checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredBookings.map((b) => b.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Handle Single Checkbox
  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // Single Status Update
  const handleStatusUpdate = async (
    bookingId: string,
    newStatus: "Approved" | "Rejected"
  ) => {
    setIsProcessing(true);
    try {
      await updateBooking(bookingId, { status: newStatus });
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast({
        title: `Reservation ${newStatus}`,
        description: `The reservation status has been changed to ${newStatus}.`,
      });
    } catch (error: any) {
      console.error("Status update error:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error?.message || "Failed to update reservation status.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Single Delete
  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to delete this reservation?")) return;

    setIsProcessing(true);
    try {
      await deleteBooking(bookingId);
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setSelectedIds((prev) => prev.filter((id) => id !== bookingId));
      toast({
        title: "Reservation Deleted",
        description: "The reservation record has been permanently deleted.",
      });
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error?.message || "Failed to delete reservation.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch Approve
  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    try {
      await Promise.all(
        selectedIds.map((id) => updateBooking(id, { status: "Approved" }))
      );
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast({
        title: "Reservations Approved",
        description: `${selectedIds.length} reservation(s) approved successfully.`,
      });
      setSelectedIds([]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Batch Approve Failed",
        description: error?.message || "Could not approve selected items.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch Reject
  const handleBatchReject = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    try {
      await Promise.all(
        selectedIds.map((id) => updateBooking(id, { status: "Rejected" }))
      );
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast({
        title: "Reservations Rejected",
        description: `${selectedIds.length} reservation(s) rejected.`,
      });
      setSelectedIds([]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Batch Reject Failed",
        description: error?.message || "Could not reject selected items.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch Delete
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to permanently delete ${selectedIds.length} selected reservation(s)?`
      )
    )
      return;

    setIsProcessing(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteBooking(id)));
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast({
        title: "Reservations Deleted",
        description: `${selectedIds.length} reservation(s) deleted successfully.`,
      });
      setSelectedIds([]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Batch Delete Failed",
        description: error?.message || "Could not delete selected items.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isAllSelected =
    filteredBookings.length > 0 &&
    selectedIds.length === filteredBookings.length;

  if (roleLoading || bookingsLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!canApproveRoomReservation) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto mt-20 bg-white dark:bg-card p-6 rounded-2xl border shadow-xs text-center space-y-4">
          <XCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold font-headline">Access Denied</h2>
          <p className="text-sm text-muted-foreground">
            You do not have the required administrative permissions to access
            all reservations.
          </p>
          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={() => (window.location.href = "/dashboard")}
          >
            Return to Dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="w-full space-y-6 pb-12">
        {/* Header Section */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-headline text-gray-900 dark:text-white">
            All Reservations
          </h1>
          <p className="text-sm text-muted-foreground">
            Administrative view of all room reservations across the church.
          </p>
        </div>

        {/* Main Card Container */}
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-200/80 dark:border-border p-6 shadow-xs overflow-hidden">
          {/* Top Controls Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search ID, requestor, room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 text-xs rounded-xl border-gray-200 dark:border-border bg-white dark:bg-card w-full"
              />
            </div>

            {/* Filters Right */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Filter className="h-4 w-4 text-gray-400 hidden sm:block mr-1" />

              {/* Status Select */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-36 text-xs rounded-xl border-gray-200 dark:border-border font-medium">
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

              {/* Floor / Room Select */}
              <Select value={roomFilter} onValueChange={setRoomFilter}>
                <SelectTrigger className="h-10 w-40 text-xs rounded-xl border-gray-200 dark:border-border font-medium">
                  <SelectValue placeholder="All Floor/Room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All Floor/Room
                  </SelectItem>
                  {areas?.map((area) => {
                    const areaRooms = (rooms || []).filter(
                      (r) => r.areaId === area.id || r.areaId === area.areaId
                    );
                    return (
                      <SelectGroup key={area.id}>
                        <SelectLabel className="text-xs font-bold text-gray-500">
                          {area.name}
                        </SelectLabel>
                        {areaRooms.map((room) => (
                          <SelectItem
                            key={room.id}
                            value={room.id}
                            className="text-xs"
                          >
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Date Filter */}
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  type="date"
                  placeholder="dd/mm/yyyy"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-8 h-10 text-xs rounded-xl border-gray-200 dark:border-border w-36"
                />
              </div>
            </div>
          </div>

          {/* Batch Action Bar */}
          {selectedIds.length > 0 && (
            <div className="bg-slate-50 dark:bg-muted/40 rounded-xl p-3 px-4 flex items-center justify-between border border-gray-200/60 dark:border-border/60 my-4 transition-all">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                {selectedIds.length} Selected
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleBatchApprove}
                  className="border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Check className="h-3.5 w-3.5" />
                  Approve
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleBatchReject}
                  className="border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Reject
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleBatchDelete}
                  className="border border-gray-300 dark:border-border text-gray-700 dark:text-gray-200 bg-white dark:bg-card hover:bg-gray-50 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5 text-gray-500" />
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="border border-gray-200/80 dark:border-border rounded-xl mt-4 overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Loading all reservations...
                </p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="py-20 text-center text-gray-400 dark:text-gray-500">
                <p className="text-sm font-medium">No reservations found.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try adjusting your search criteria or filters.
                </p>
              </div>
            ) : (
              <>
                {/* ── MOBILE CARD LIST (below lg) ── */}
                <div className="lg:hidden divide-y divide-gray-100 dark:divide-border">
                  {filteredBookings.map((booking) => {
                    const room = getRoom(booking.roomId);
                    const area = getArea(room?.areaId);
                    const requesterName = getRequesterName(booking);
                    const initials = getInitials(requesterName);
                    const startTime = toJsDate(booking.start);
                    const endTime = toJsDate(booking.end);
                    const createdDate = booking.dateRequested ? toJsDate(booking.dateRequested) : startTime;
                    const reqId = booking.requestId || `REQ-${booking.id?.slice(0, 4)}`;
                    const isChecked = selectedIds.includes(booking.id);
                    const isApproved = booking.status === "Approved";
                    const isPending = booking.status?.toLowerCase().startsWith("pending");

                    return (
                      <div key={booking.id} className={cn("p-4 transition-colors", isChecked ? "bg-blue-50/40 dark:bg-blue-950/20" : "bg-white dark:bg-card hover:bg-gray-50/60 dark:hover:bg-muted/30")}>
                        {/* Top row: checkbox + ID + status + actions */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5">
                            <Checkbox checked={isChecked} onCheckedChange={(c) => handleSelectRow(booking.id, !!c)} />
                            <span className="text-xs font-mono font-semibold text-gray-600 dark:text-gray-400">{reqId}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Approved
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {booking.status}
                              </span>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button type="button" className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-muted text-gray-500 hover:text-gray-800 transition-colors">
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => { setSelectedBooking(booking); setIsDetailsOpen(true); }} className="text-xs cursor-pointer font-medium">View Details</DropdownMenuItem>
                                {isPending && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(booking.id, "Approved")} className="text-xs cursor-pointer font-medium text-emerald-600 dark:text-emerald-400"><Check className="h-3.5 w-3.5 mr-1.5" />Approve</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(booking.id, "Rejected")} className="text-xs cursor-pointer font-medium text-rose-600 dark:text-rose-400"><X className="h-3.5 w-3.5 mr-1.5" />Reject</DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem onClick={() => handleDeleteBooking(booking.id)} className="text-xs cursor-pointer font-medium text-red-600 dark:text-red-400"><Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Requester */}
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0">{initials}</div>
                          <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{requesterName}</span>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">Room</p>
                            <p className="font-semibold text-gray-800 dark:text-gray-100">{room?.name || "—"}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-[11px]">{area?.name || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">Date</p>
                            <p className="font-semibold text-gray-800 dark:text-gray-100">{format(startTime, "MMM d, yyyy")}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-[11px]">{format(startTime, "h:mm a")} – {format(endTime, "h:mm a")}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">Pax</p>
                            <p className="font-semibold text-gray-800 dark:text-gray-100">{booking.pax || 0}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">Created</p>
                            <p className="font-semibold text-gray-800 dark:text-gray-100">{format(createdDate, "MMM d, yyyy")}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── DESKTOP TABLE (lg and above) ── */}
                <div className="hidden lg:block">
                <Table>
                <TableHeader>
                  <TableRow className="bg-[#F8F9FA] dark:bg-muted/40 hover:bg-[#F8F9FA] border-b border-gray-200 dark:border-border">
                    <TableHead className="w-12 px-4 py-3.5 text-center">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={(c) => handleSelectAll(!!c)}
                      />
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs h-12 px-4 text-center w-[12%]">
                      ID
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs h-12 px-4 text-left w-[18%]">
                      Requester
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs h-12 px-4 text-center w-[16%]">
                      Floor / Room
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs h-12 px-4 text-center w-[13%]">
                      Date
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs h-12 px-4 text-center w-[15%]">
                      Time
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs h-12 px-3 text-center w-[6%]">
                      Pax
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs h-12 px-4 text-center w-[10%]">
                      Status
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs h-12 px-4 text-center w-[10%]">
                      Created
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 dark:text-gray-200 text-xs h-12 px-4 text-center w-[6%]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => {
                    const room = getRoom(booking.roomId);
                    const area = getArea(room?.areaId);
                    const requesterName = getRequesterName(booking);
                    const initials = getInitials(requesterName);
                    const startTime = toJsDate(booking.start);
                    const endTime = toJsDate(booking.end);
                    const createdDate = booking.dateRequested
                      ? toJsDate(booking.dateRequested)
                      : startTime;

                    const reqId =
                      booking.requestId || `REQ-${booking.id?.slice(0, 4)}`;
                    const isChecked = selectedIds.includes(booking.id);

                    const isApproved = booking.status === "Approved";
                    const isPending = booking.status
                      ?.toLowerCase()
                      .startsWith("pending");

                    return (
                      <TableRow
                        key={booking.id}
                        className={cn(
                          "border-b border-gray-100 dark:border-border/60 transition-colors",
                          isChecked
                            ? "bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/60"
                            : "hover:bg-gray-50/60 dark:hover:bg-muted/30"
                        )}
                      >
                        {/* Checkbox */}
                        <TableCell className="px-4 py-4 text-center align-middle">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(c) =>
                              handleSelectRow(booking.id, !!c)
                            }
                          />
                        </TableCell>

                        {/* ID */}
                        <TableCell className="py-4 px-4 text-center align-middle font-medium text-xs text-gray-700 dark:text-gray-300 font-mono">
                          {reqId}
                        </TableCell>

                        {/* Requester with Initials Avatar */}
                        <TableCell className="py-4 px-4 align-middle">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">
                              {requesterName}
                            </span>
                          </div>
                        </TableCell>

                        {/* Floor / Room */}
                        <TableCell className="py-4 px-4 text-center align-middle">
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
                        <TableCell className="py-4 px-4 text-center align-middle text-xs text-gray-700 dark:text-gray-300 font-medium">
                          {format(startTime, "MMMM d, yyyy")}
                        </TableCell>

                        {/* Time */}
                        <TableCell className="py-4 px-4 text-center align-middle text-xs text-gray-600 dark:text-gray-400 font-medium">
                          {format(startTime, "h:mm a")} -{" "}
                          {format(endTime, "h:mm a")}
                        </TableCell>

                        {/* Pax */}
                        <TableCell className="py-4 px-3 text-center align-middle text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {booking.pax || 0}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-4 px-4 text-center align-middle">
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

                        {/* Created Date */}
                        <TableCell className="py-4 px-4 text-center align-middle text-xs text-gray-600 dark:text-gray-400 font-medium">
                          {format(createdDate, "MMMM d, yyyy")}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-4 px-4 text-center align-middle">
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

                              {isPending && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusUpdate(
                                        booking.id,
                                        "Approved"
                                      )
                                    }
                                    className="text-xs cursor-pointer font-medium text-emerald-600 dark:text-emerald-400"
                                  >
                                    <Check className="h-3.5 w-3.5 mr-1.5" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusUpdate(
                                        booking.id,
                                        "Rejected"
                                      )
                                    }
                                    className="text-xs cursor-pointer font-medium text-rose-600 dark:text-rose-400"
                                  >
                                    <X className="h-3.5 w-3.5 mr-1.5" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}

                              <DropdownMenuItem
                                onClick={() =>
                                  handleDeleteBooking(booking.id)
                                }
                                className="text-xs cursor-pointer font-medium text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
              </>
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
        requesterName={
          selectedBooking ? getRequesterName(selectedBooking) : "System Admin"
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
  requesterName,
  venueElements,
  ministries,
}: {
  isOpen: boolean;
  onClose: () => void;
  booking: any | null;
  roomName: string;
  areaName: string;
  requesterName: string;
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
            <DetailRow label="Requested By" value={requesterName} />
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
