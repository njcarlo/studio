"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  Checkbox,
} from "@studio/ui";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  LoaderCircle,
  XCircle,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/use-user-role";
import { useAuthStore } from "@studio/store";
import { useQuery } from "@tanstack/react-query";
import {
  getRooms,
  getAreas,
  getMinistries,
  getVenueElements,
  getBookingsForRoomOnDate,
  createBooking,
  createApproval,
} from "@/actions/db";
import { useToast } from "@/hooks/use-toast";
import type { Room, Area, Ministry, VenueElement } from "@studio/types";

export default function NewReservationPage() {
  const { user } = useAuthStore();
  const { workerProfile, isSuperAdmin, isLoading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const router = useRouter();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedRequestId, setGeneratedRequestId] = useState("");

  // Form states
  const [requesterName, setRequesterName] = useState("");
  const [ministryId, setMinistryId] = useState("");
  const [email, setEmail] = useState("");
  const [purpose, setPurpose] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [roomId, setRoomId] = useState("");
  const [pax, setPax] = useState("");
  const [numTables, setNumTables] = useState("");
  const [numChairs, setNumChairs] = useState("");
  const [requestedElements, setRequestedElements] = useState<string[]>([]);
  const [guidelinesAccepted, setGuidelinesAccepted] = useState(false);

  // Initialize Request ID and User defaults
  useEffect(() => {
    setGeneratedRequestId(
      `REQ-${Math.floor(1000 + Math.random() * 9000)}`
    );
  }, []);

  useEffect(() => {
    if (workerProfile) {
      setRequesterName(
        `${workerProfile.firstName} ${workerProfile.lastName}`
      );
      setEmail(workerProfile.email || user?.email || "");
      if (workerProfile.majorMinistryId) {
        setMinistryId(workerProfile.majorMinistryId);
      }
    } else if (user) {
      setRequesterName(user.email?.split("@")[0] || "System Admin");
      setEmail(user.email || "admin@gmail.com");
    }
  }, [workerProfile, user]);

  // Data fetching
  const { data: rooms } = useQuery({
    queryKey: ["rooms"],
    queryFn: getRooms,
  });

  const { data: areas } = useQuery({
    queryKey: ["areas"],
    queryFn: getAreas,
  });

  const { data: ministries } = useQuery({
    queryKey: ["ministries"],
    queryFn: getMinistries,
  });

  const { data: venueElements } = useQuery({
    queryKey: ["venue-elements"],
    queryFn: getVenueElements,
  });

  const selectedRoom = useMemo(() => {
    return rooms?.find((r) => r.id === roomId);
  }, [rooms, roomId]);

  // Time slots from 8:00 AM to 8:00 PM (in 30-min intervals)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 20; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === 20 && m > 0) continue;
        const hour24 = h.toString().padStart(2, "0");
        const minute = m.toString().padStart(2, "0");
        const val = `${hour24}:${minute}`;

        const period = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 === 0 ? 12 : h % 12;
        const disp = `${h12}:${minute} ${period}`;
        slots.push({ value: val, display: disp });
      }
    }
    return slots;
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!purpose.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Purpose",
        description: "Please provide the purpose of your reservation.",
      });
      return;
    }

    if (!selectedDate) {
      toast({
        variant: "destructive",
        title: "Missing Date",
        description: "Please select a date for the reservation.",
      });
      return;
    }

    if (!startTime || !endTime) {
      toast({
        variant: "destructive",
        title: "Missing Time",
        description: "Please specify both start and end times.",
      });
      return;
    }

    if (!roomId) {
      toast({
        variant: "destructive",
        title: "Missing Room",
        description: "Please select a floor and room.",
      });
      return;
    }

    const paxNum = parseInt(pax);
    if (!paxNum || paxNum <= 0) {
      toast({
        variant: "destructive",
        title: "Missing Pax",
        description: "Please enter the number of attendees (Pax).",
      });
      return;
    }

    if (selectedRoom && paxNum > selectedRoom.capacity) {
      toast({
        variant: "destructive",
        title: "Capacity Exceeded",
        description: `This room holds a maximum of ${selectedRoom.capacity} people. Please pick a larger room.`,
      });
      return;
    }

    if (!guidelinesAccepted) {
      toast({
        variant: "destructive",
        title: "Guidelines Required",
        description:
          "Please accept the ORS Guidelines before submitting your request.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);

      const parsedDate = new Date(selectedDate);
      const start = new Date(parsedDate);
      start.setHours(startH, startM, 0, 0);

      const end = new Date(parsedDate);
      end.setHours(endH, endM, 0, 0);

      if (start >= end) {
        toast({
          variant: "destructive",
          title: "Invalid Time",
          description: "End time must be after start time.",
        });
        setIsSubmitting(false);
        return;
      }

      // Check conflicts
      const existingReservations = await getBookingsForRoomOnDate(
        roomId,
        parsedDate
      );
      let hasConflict = false;
      let conflictingStatus = "";
      let conflictingRequester = "";

      for (const res of existingReservations) {
        if (res.status === "Rejected") continue;

        const resStart = new Date(res.start);
        const resEnd = new Date(res.end);

        if (resStart && resEnd && start < resEnd && end > resStart) {
          hasConflict = true;
          if (res.status === "Approved") {
            conflictingStatus = "Approved";
            conflictingRequester = res.name;
            break;
          } else if (res.status.startsWith("Pending")) {
            conflictingStatus = "Pending";
            conflictingRequester = res.name;
          }
        }
      }

      if (hasConflict && conflictingStatus === "Approved") {
        toast({
          variant: "destructive",
          title: "Slot Unavailable",
          description: `This time slot is already approved for ${conflictingRequester}.`,
        });
        setIsSubmitting(false);
        return;
      }

      const effectiveWorkerId =
        workerProfile?.id || "worker-system-admin";

      const bookingData = {
        requestId: generatedRequestId,
        roomId,
        title: purpose,
        purpose,
        start,
        end,
        status: "Pending Ministry Approval",
        workerProfileId: effectiveWorkerId,
        name: requesterName || "System Admin",
        ministryId: ministryId || "",
        email: email || "admin@gmail.com",
        pax: paxNum || 0,
        numTables: parseInt(numTables) || 0,
        numChairs: parseInt(numChairs) || 0,
        requestedElements,
        equipment_TV: false,
        equipment_Mic: false,
        equipment_Speakers: false,
        guidelinesAccepted: true,
      };

      const newBooking = await createBooking(bookingData);

      if (newBooking?.id) {
        await createApproval({
          requester: requesterName || "System Admin",
          type: "Room Booking",
          details:
            `"${purpose}" for room: ${selectedRoom?.name}` +
            (hasConflict && conflictingStatus === "Pending"
              ? `\n(⚠️ Conflicts with pending request by ${conflictingRequester})`
              : ""),
          date: new Date(),
          status: "Pending Ministry Approval",
          roomId,
          reservationId: newBooking.id,
          workerId: effectiveWorkerId,
          requestId: generatedRequestId,
        });

        setIsSubmitted(true);
      }
    } catch (error: any) {
      console.error("Error submitting reservation:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description:
          error?.message ||
          "There was an error submitting your request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <AppLayout>
        <div className="w-full max-w-2xl mx-auto py-12">
          <div className="bg-white dark:bg-card rounded-2xl border border-gray-200/80 dark:border-border p-8 text-center shadow-xs space-y-6">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-headline text-gray-900 dark:text-white">
                Request Submitted!
              </h2>
              <p className="text-sm text-muted-foreground">
                Your room reservation request (
                <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                  {generatedRequestId}
                </span>
                ) has been submitted and is now pending approval.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                className="rounded-xl px-5 h-9 text-xs font-semibold"
                onClick={() => router.push("/reservations/masterview/daily")}
              >
                View Calendar
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 h-9 text-xs font-semibold shadow-xs"
                onClick={() => router.push("/reservations/my")}
              >
                Go to My Reservations
              </Button>
            </div>
          </div>
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
            Reserve a Room
          </h1>
          <p className="text-sm text-muted-foreground">
            Fill out the form below to request a facility for your event or ministry.
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-200/80 dark:border-border p-6 sm:p-8 shadow-xs w-full">
          {/* Card Title & Notice */}
          <div className="mb-6 space-y-0.5">
            <h2 className="text-xl font-bold font-headline text-gray-900 dark:text-white">
              Request Information
            </h2>
            <p className="text-xs italic text-red-500 font-medium">
              All fields are required to be filled out.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Row 1: Request ID & Date Requested */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Request ID
                </label>
                <Input
                  value={generatedRequestId || "REQ-1000"}
                  disabled
                  className="bg-gray-100 dark:bg-muted text-gray-700 dark:text-gray-300 border-0 rounded-xl h-10 text-xs font-medium cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Date Requested
                </label>
                <Input
                  value={format(new Date(), "MMM d, yyyy")}
                  disabled
                  className="bg-gray-100 dark:bg-muted text-gray-700 dark:text-gray-300 border-0 rounded-xl h-10 text-xs font-medium cursor-not-allowed"
                />
              </div>
            </div>

            {/* Row 2: Requester Name & Ministry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Requester Name
                </label>
                <Input
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  placeholder="System Admin"
                  className="bg-gray-100/90 dark:bg-muted text-gray-800 dark:text-gray-100 border-0 rounded-xl h-10 text-xs font-medium focus-visible:ring-1 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Ministry
                </label>
                <Select value={ministryId} onValueChange={setMinistryId}>
                  <SelectTrigger className="bg-gray-100/90 dark:bg-muted text-gray-800 dark:text-gray-100 border-0 rounded-xl h-10 text-xs font-medium focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="Administration" />
                  </SelectTrigger>
                  <SelectContent>
                    {ministries?.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-xs">
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                className="bg-gray-100/90 dark:bg-muted text-gray-800 dark:text-gray-100 border-0 rounded-xl h-10 text-xs font-medium focus-visible:ring-1 focus-visible:ring-blue-500"
              />
            </div>

            {/* Row 4: Purpose of Reservation */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Purpose of Reservation
              </label>
              <Textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Describe the event or meeting...."
                className="border border-gray-200 dark:border-border rounded-xl min-h-[110px] p-3 text-xs leading-relaxed text-gray-800 dark:text-gray-100 focus-visible:ring-1 focus-visible:ring-blue-500"
              />
            </div>

            {/* Row 5: Select Date, Start Time, End Time */}
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Select Date
                  </label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-gray-100/90 dark:bg-muted text-gray-800 dark:text-gray-100 border-0 rounded-xl h-10 text-xs font-medium focus-visible:ring-1 focus-visible:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Start Time
                  </label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger className="bg-gray-100/90 dark:bg-muted text-gray-800 dark:text-gray-100 border-0 rounded-xl h-10 text-xs font-medium focus:ring-1 focus:ring-blue-500">
                      <SelectValue placeholder="Start" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem
                          key={`start-${slot.value}`}
                          value={slot.value}
                          className="text-xs"
                        >
                          {slot.display}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    End Time
                  </label>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger className="bg-gray-100/90 dark:bg-muted text-gray-800 dark:text-gray-100 border-0 rounded-xl h-10 text-xs font-medium focus:ring-1 focus:ring-blue-500">
                      <SelectValue placeholder="End" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem
                          key={`end-${slot.value}`}
                          value={slot.value}
                          className="text-xs"
                        >
                          {slot.display}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs italic text-red-500 font-medium mt-1.5">
                Note: Room reservations are until 8:00 pm only.
              </p>
            </div>

            {/* Row 6: Floor / Room */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Floor / Room
              </label>
              <Select value={roomId} onValueChange={setRoomId}>
                <SelectTrigger className="bg-gray-100/90 dark:bg-muted text-gray-800 dark:text-gray-100 border-0 rounded-xl h-10 text-xs font-medium focus:ring-1 focus:ring-blue-500">
                  <SelectValue placeholder="Select floor / room" />
                </SelectTrigger>
                <SelectContent>
                  {areas?.map((area) => {
                    const areaRooms = (rooms || []).filter(
                      (r) => r.areaId === area.id || r.areaId === area.areaId
                    );
                    if (areaRooms.length === 0) return null;

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
                            {area.name} – {room.name} (Cap: {room.capacity})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Row 7: Pax, No. of Tables, No. of Chairs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Pax
                </label>
                <Input
                  type="number"
                  value={pax}
                  onChange={(e) => setPax(e.target.value)}
                  placeholder="Number of people"
                  className="bg-gray-100/90 dark:bg-muted text-gray-800 dark:text-gray-100 border-0 rounded-xl h-10 text-xs font-medium focus-visible:ring-1 focus-visible:ring-blue-500"
                />
                {selectedRoom && (
                  <p
                    className={cn(
                      "text-[11px] font-medium mt-1 transition-colors",
                      parseInt(pax) > selectedRoom.capacity
                        ? "text-red-500 font-semibold"
                        : "text-muted-foreground"
                    )}
                  >
                    {parseInt(pax) > selectedRoom.capacity
                      ? `⚠️ Capacity Exceeded! Max: ${selectedRoom.capacity}`
                      : `Max room capacity: ${selectedRoom.capacity}`}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  No. of Tables
                </label>
                <Input
                  type="number"
                  value={numTables}
                  onChange={(e) => setNumTables(e.target.value)}
                  placeholder="0"
                  className="bg-gray-100/90 dark:bg-muted text-gray-800 dark:text-gray-100 border-0 rounded-xl h-10 text-xs font-medium focus-visible:ring-1 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  No. of Chairs
                </label>
                <Input
                  type="number"
                  value={numChairs}
                  onChange={(e) => setNumChairs(e.target.value)}
                  placeholder="0"
                  className="bg-gray-100/90 dark:bg-muted text-gray-800 dark:text-gray-100 border-0 rounded-xl h-10 text-xs font-medium focus-visible:ring-1 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            {/* Optional Facility Elements */}
            {selectedRoom &&
              selectedRoom.elements &&
              selectedRoom.elements.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-border/60">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Requested Equipment & Facility Elements
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedRoom.elements.map((elementId: string) => {
                      const element = venueElements?.find(
                        (e) => e.id === elementId
                      );
                      if (!element) return null;
                      return (
                        <div
                          key={element.id}
                          className="flex items-center space-x-2 bg-gray-50 dark:bg-muted/40 p-2.5 rounded-xl border border-gray-200/60 dark:border-border/60"
                        >
                          <Checkbox
                            id={`element-${element.id}`}
                            checked={requestedElements.includes(element.id)}
                            onCheckedChange={(c) => {
                              if (c) {
                                setRequestedElements((prev) => [
                                  ...prev,
                                  element.id,
                                ]);
                              } else {
                                setRequestedElements((prev) =>
                                  prev.filter((id) => id !== element.id)
                                );
                              }
                            }}
                          />
                          <label
                            htmlFor={`element-${element.id}`}
                            className="cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300 select-none"
                          >
                            {element.name}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* ORS Guidelines Section (Retained before Submit & Cancel buttons) */}
            <div className="bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200/70 dark:border-amber-900/40 space-y-2.5 mt-6">
              <div className="font-bold text-xs text-amber-800 dark:text-amber-300">
                ORS Guidelines
              </div>
              <p className="text-xs leading-relaxed text-amber-900/80 dark:text-amber-300/80">
                1. Rooms must be left clean and tidy after use.
                <br />
                2. Switch off all lights, AC, and equipment before leaving.
                <br />
                3. Report any damage immediately to the facilities manager.
              </p>
              <div className="flex items-center space-x-2 pt-1 border-t border-amber-200/50 dark:border-amber-900/30">
                <Checkbox
                  id="guidelines"
                  checked={guidelinesAccepted}
                  onCheckedChange={(c) => setGuidelinesAccepted(!!c)}
                />
                <label
                  htmlFor="guidelines"
                  className="text-xs font-semibold cursor-pointer text-amber-900 dark:text-amber-200 select-none"
                >
                  I understand and will follow the ORS guidelines
                </label>
              </div>
            </div>

            {/* Footer Buttons (Cancel & Submit) */}
            <div className="pt-4 border-t border-gray-100 dark:border-border/60 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="rounded-xl px-6 h-10 text-xs font-semibold border-gray-200 dark:border-border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !guidelinesAccepted}
                className={cn(
                  "rounded-xl px-7 h-10 text-xs font-bold shadow-xs gap-1.5 transition-all",
                  guidelinesAccepted
                    ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-sm"
                    : "bg-blue-600/40 text-white dark:bg-blue-900/40 dark:text-white/80 cursor-not-allowed"
                )}
              >
                {isSubmitting && (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                )}
                Submit
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
