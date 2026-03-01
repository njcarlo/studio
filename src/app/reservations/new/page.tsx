
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
    PlusCircle,
    Building2,
    Calendar as CalendarIcon, // Renamed to avoid conflict with Calendar component
    Clock,
    Users,
    Info,
    CheckCircle2,
    LoaderCircle,
    XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/use-user-role";
import { useFirestore, useUser, useCollection, addDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp, Timestamp as FirebaseTimestamp, query, where, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Room, Branch, Area, Ministry, VenueElement } from "@/lib/types";

export default function NewReservationPage() {
    const { user } = useUser();
    const { workerProfile, isSuperAdmin, isLoading: roleLoading } = useUserRole();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [newRequestId, setNewRequestId] = useState("");
    const [generatedRequestId, setGeneratedRequestId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initializations
    useEffect(() => {
        setGeneratedRequestId(`REQ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    }, []);

    // Form states
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [locationId, setLocationId] = useState("");
    const [roomId, setRoomId] = useState("");
    const [purpose, setPurpose] = useState("");
    const [pax, setPax] = useState("");
    const [numTables, setNumTables] = useState("");
    const [numChairs, setNumChairs] = useState("");
    const [requestedElements, setRequestedElements] = useState<string[]>([]);
    const [guidelinesAccepted, setGuidelinesAccepted] = useState(false);

    // Data fetching
    const roomsRef = useMemoFirebase(() => collection(firestore, "rooms"), [firestore]);
    const { data: rooms } = useCollection<Room>(roomsRef);

    const branchesRef = useMemoFirebase(() => collection(firestore, "branches"), [firestore]);
    const { data: branches } = useCollection<Branch>(branchesRef);

    const areasRef = useMemoFirebase(() => collection(firestore, "areas"), [firestore]);
    const { data: areas } = useCollection<Area>(areasRef);

    const ministriesRef = useMemoFirebase(() => collection(firestore, "ministries"), [firestore]);
    const { data: ministries } = useCollection<Ministry>(ministriesRef);

    const venueElementsRef = useMemoFirebase(() => collection(firestore, "venueElements"), [firestore]);
    const { data: venueElements } = useCollection<VenueElement>(venueElementsRef);

    const workerMinistry = useMemo(() => {
        if (!workerProfile || !ministries) return null;
        return ministries.find(m => m.id === workerProfile.majorMinistryId);
    }, [workerProfile, ministries]);

    const selectedRoom = useMemo(() => {
        return rooms?.find(r => r.id === roomId);
    }, [rooms, roomId]);

    // Generate time slots (6:00 AM - 9:00 PM)
    const timeSlots = useMemo(() => {
        const slots = [];
        for (let h = 6; h <= 21; h++) {
            for (let m = 0; m < 60; m += 30) {
                if (h === 21 && m > 0) continue;
                const hour = h.toString().padStart(2, '0');
                const minute = m.toString().padStart(2, '0');
                const value = `${hour}:${minute}`;

                const displayHour = h % 12 || 12;
                const ampm = h < 12 ? 'AM' : 'PM';
                const display = `${displayHour}:${minute.padStart(2, '0')} ${ampm}`;

                slots.push({ value, display });
            }
        }
        return slots;
    }, []);



    const handleSave = async () => {
        if ((!workerProfile && !isSuperAdmin) || !roomId || !date || !startTime || !endTime || !purpose || !guidelinesAccepted) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Please fill in all required fields and accept the guidelines."
            });
            return;
        }

        const paxNum = parseInt(pax);
        if (selectedRoom && paxNum > selectedRoom.capacity) {
            toast({
                variant: "destructive",
                title: "Capacity Exceeded",
                description: `Selected room capacity is ${selectedRoom.capacity}.`
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const requestId = generatedRequestId;

            const [startH, startM] = startTime.split(':').map(Number);
            const [endH, endM] = endTime.split(':').map(Number);

            const start = new Date(date);
            start.setHours(startH, startM, 0, 0);

            const end = new Date(date);
            end.setHours(endH, endM, 0, 0);

            if (start >= end) {
                toast({
                    variant: "destructive",
                    title: "Invalid Time",
                    description: "End time must be after start time."
                });
                setIsSubmitting(false);
                return;
            }

            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const q = query(
                collection(firestore, 'rooms', roomId, 'reservations'),
                where('start', '>=', FirebaseTimestamp.fromDate(startOfDay)),
                where('start', '<=', FirebaseTimestamp.fromDate(endOfDay))
            );

            const querySnapshot = await getDocs(q);
            const existingReservations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

            let hasConflict = false;
            let conflictingStatus = '';
            let conflictingRequester = '';

            for (const res of existingReservations) {
                if (res.status === 'Rejected') continue;

                const resStart = res.start?.toDate();
                const resEnd = res.end?.toDate();

                if (resStart && resEnd && start < resEnd && end > resStart) {
                    hasConflict = true;
                    if (res.status === 'Approved') {
                        conflictingStatus = 'Approved';
                        conflictingRequester = res.name;
                        break;
                    } else if (res.status.startsWith('Pending')) {
                        conflictingStatus = 'Pending';
                        conflictingRequester = res.name;
                    }
                }
            }

            if (hasConflict) {
                if (conflictingStatus === 'Approved') {
                    toast({
                        variant: "destructive",
                        title: "Slot Unavailable",
                        description: `This time slot is already approved for ${conflictingRequester}.`
                    });
                    setIsSubmitting(false);
                    return;
                } else if (conflictingStatus === 'Pending') {
                    toast({
                        title: "Pending Conflict",
                        description: `There is already a pending request for this time slot by ${conflictingRequester}. Your request is submitted but subject to approval.`,
                    });
                }
            }

            const requesterName = workerProfile
                ? `${workerProfile.firstName} ${workerProfile.lastName}`
                : (user?.displayName || user?.email?.split('@')[0] || "System Admin");
            const requesterEmail = workerProfile?.email || user?.email || "admin@system.com";
            const requesterMinistryId = workerProfile?.majorMinistryId || "";

            const bookingData = {
                requestId,
                roomId,
                title: purpose, // Using purpose as title for compatibility
                purpose,
                start: FirebaseTimestamp.fromDate(start),
                end: FirebaseTimestamp.fromDate(end),
                status: 'Pending Ministry Approval',
                workerProfileId: workerProfile?.id || "system-admin",
                name: requesterName,
                ministryId: requesterMinistryId,
                email: requesterEmail,
                dateRequested: serverTimestamp(),
                pax: paxNum || 0,
                numTables: parseInt(numTables) || 0,
                numChairs: parseInt(numChairs) || 0,
                requestedElements,
                // Kept for legacy typing compatibility if needed
                equipment_TV: false,
                equipment_Mic: false,
                equipment_Speakers: false,
                guidelinesAccepted: true,
            };

            const reservationRef = await addDocumentNonBlocking(collection(firestore, 'rooms', roomId, 'reservations'), bookingData);

            if (reservationRef?.id) {
                await addDocumentNonBlocking(collection(firestore, 'approvals'), {
                    requester: requesterName,
                    type: 'Room Booking',
                    details: `"${purpose}" for room: ${selectedRoom?.name}` + (hasConflict && conflictingStatus === 'Pending' ? `\n(⚠️ Conflicts with pending request by ${conflictingRequester})` : ""),
                    date: serverTimestamp(),
                    status: 'Pending Ministry Approval',
                    roomId,
                    reservationId: reservationRef.id,
                    workerId: workerProfile?.id || "system-admin",
                    requestId
                });

                setNewRequestId(reservationRef.id);
                setIsSubmitted(true);
            }
        } catch (error) {
            console.error("Error submitting reservation:", error);
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: "There was an error submitting your request. Please try again."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <AppLayout>
                <div className="max-w-2xl mx-auto py-12">
                    <Card className="text-center p-8">
                        <CardHeader>
                            <div className="flex justify-center mb-4">
                                <CheckCircle2 className="h-16 w-16 text-green-500" />
                            </div>
                            <CardTitle className="text-3xl font-headline">Request Submitted!</CardTitle>
                            <CardDescription className="text-lg">
                                Your room reservation request has been successfully submitted and is now pending approval.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">
                                You can view the status of your request in "My Reservations".
                            </p>
                        </CardContent>
                        <CardFooter className="flex justify-center gap-4">
                            <Button variant="outline" onClick={() => router.push("/reservations/calendar")}>
                                View Calendar
                            </Button>
                            <Button onClick={() => router.push("/reservations/my")}>
                                View My Requests
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    if (roleLoading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AppLayout>
        );
    }

    if (!workerProfile && !isSuperAdmin) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center space-y-4 max-w-md mx-auto p-6 bg-card rounded-xl border shadow-sm">
                        <XCircle className="h-12 w-12 text-destructive mx-auto" />
                        <h2 className="text-xl font-bold font-headline">Worker Profile Not Found</h2>
                        <p className="text-muted-foreground">
                            We couldn't find your worker record (email: <span className="font-semibold">{user?.email}</span>) in the system.
                            Please contact an administrator to ensure you are registered as a worker.
                        </p>
                        <Button onClick={() => window.location.href = '/dashboard'}>
                            Return to Dashboard
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-headline font-bold">Reserve a Room</h1>
                    <p className="text-muted-foreground">Fill out the form below to request a facility for your event or ministry.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Request Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Request ID</Label>
                                <Input value={generatedRequestId || "Generating..."} disabled className="bg-muted font-mono" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Date Requested</Label>
                                <Input value={format(new Date(), "PP")} disabled className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Requester Name</Label>
                                <Input
                                    value={workerProfile
                                        ? `${workerProfile.firstName} ${workerProfile.lastName}`
                                        : (user?.displayName || user?.email?.split('@')[0] || "System Admin")
                                    }
                                    disabled
                                    className="bg-muted"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Ministry</Label>
                                <Input value={workerMinistry?.name || (isSuperAdmin ? "Administration" : "Loading...")} disabled className="bg-muted" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-muted-foreground">Email</Label>
                                <Input value={workerProfile?.email || user?.email || ""} disabled className="bg-muted" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="purpose">Purpose of Reservation</Label>
                            <Textarea
                                id="purpose"
                                placeholder="Describe the event or meeting..."
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                            <div className="space-y-2">
                                <Label>Select Date</Label>
                                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={(d) => {
                                                if (d) {
                                                    setDate(d);
                                                    setIsCalendarOpen(false);
                                                }
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <p className="text-[11px] text-orange-500 font-medium mt-1 italic">
                                    Note: Room reservations are until 9:00 pm only!
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <Label>Start Time</Label>
                                    <Select value={startTime} onValueChange={setStartTime}>
                                        <SelectTrigger><SelectValue placeholder="Start" /></SelectTrigger>
                                        <SelectContent>
                                            {timeSlots.map(slot => <SelectItem key={`start-${slot.value}`} value={slot.value}>{slot.display}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>End Time</Label>
                                    <Select value={endTime} onValueChange={setEndTime}>
                                        <SelectTrigger><SelectValue placeholder="End" /></SelectTrigger>
                                        <SelectContent>
                                            {timeSlots.slice(1).map(slot => <SelectItem key={`end-${slot.value}`} value={slot.value}>{slot.display}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="location">Location / Branch</Label>
                                <Select value={locationId} onValueChange={(val) => { setLocationId(val); setRoomId(""); }}>
                                    <SelectTrigger id="location"><SelectValue placeholder="Select Location" /></SelectTrigger>
                                    <SelectContent>
                                        {branches?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="room">Venue / Room</Label>
                                <Select value={roomId} onValueChange={setRoomId} disabled={!locationId}>
                                    <SelectTrigger id="room"><SelectValue placeholder="Select Room" /></SelectTrigger>
                                    <SelectContent>
                                        {areas?.filter(a => a.branchId === locationId).map(area => (
                                            <SelectGroup key={area.id}>
                                                <SelectLabel className="px-2 font-bold">{area.name}</SelectLabel>
                                                {(rooms || [])
                                                    .filter(r => r.areaId === (area.areaId || area.id))
                                                    .sort((a, b) => {
                                                        const weightA = a.weight ?? 0;
                                                        const weightB = b.weight ?? 0;
                                                        if (weightA !== weightB) return weightA - weightB;
                                                        return a.name.localeCompare(b.name);
                                                    })
                                                    .map(room => (
                                                        <SelectItem key={room.id} value={room.id}>
                                                            {room.name} (Cap: {room.capacity})
                                                        </SelectItem>
                                                    ))}
                                            </SelectGroup>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="pax">Pax</Label>
                                <Input
                                    id="pax"
                                    type="number"
                                    value={pax}
                                    onChange={(e) => setPax(e.target.value)}
                                    placeholder="Number of people"
                                    className={cn(selectedRoom && parseInt(pax) > selectedRoom.capacity && "border-destructive focus-visible:ring-destructive")}
                                />
                                {selectedRoom && (
                                    <p className={cn(
                                        "text-[11px] font-medium mt-1 transition-colors",
                                        parseInt(pax) > selectedRoom.capacity ? "text-destructive flex items-center gap-1" : "text-muted-foreground"
                                    )}>
                                        {parseInt(pax) > selectedRoom.capacity ? (
                                            <>
                                                <Info className="h-3 w-3" />
                                                <span>Capacity Exceeded! Max: {selectedRoom.capacity}. Please pick a larger room.</span>
                                            </>
                                        ) : (
                                            <span>Max capacity of this room: {selectedRoom.capacity}</span>
                                        )}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tables"># of Tables</Label>
                                <Input
                                    id="tables"
                                    type="number"
                                    value={numTables}
                                    onChange={(e) => setNumTables(e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="chairs"># of Chairs</Label>
                                <Input
                                    id="chairs"
                                    type="number"
                                    value={numChairs}
                                    onChange={(e) => setNumChairs(e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {selectedRoom && selectedRoom.elements && selectedRoom.elements.length > 0 && (
                            <div className="space-y-3 border-t pt-4">
                                <Label>Facility Elements</Label>
                                <p className="text-sm text-muted-foreground mb-3">Select the items you need for your reservation.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {selectedRoom.elements.map(elementId => {
                                        const element = venueElements?.find(e => e.id === elementId);
                                        if (!element) return null;
                                        return (
                                            <div key={element.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`element-${element.id}`}
                                                    checked={requestedElements.includes(element.id)}
                                                    onCheckedChange={(c) => {
                                                        if (c) {
                                                            setRequestedElements(prev => [...prev, element.id]);
                                                        } else {
                                                            setRequestedElements(prev => prev.filter(id => id !== element.id));
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor={`element-${element.id}`} className="cursor-pointer flex flex-col items-start gap-1">
                                                    <span>{element.name}</span>
                                                    <span className="text-[10px] text-muted-foreground border px-1.5 py-0.5 rounded-full">{element.category.toUpperCase()}</span>
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-900/30 space-y-3">
                            <div className="font-bold flex items-center gap-2 text-orange-700 dark:text-orange-400">
                                <span>ORS Guidelines</span>
                            </div>
                            <p className="text-sm text-orange-800/80 dark:text-orange-300/80">
                                1. Rooms must be left clean and tidy after use.<br />
                                2. Switch off all lights, AC, and equipment before leaving.<br />
                                3. Report any damage immediately to the facilities manager.
                            </p>
                            <div className="flex items-center space-x-2 pt-1">
                                <Checkbox id="guidelines" checked={guidelinesAccepted} onCheckedChange={(c) => setGuidelinesAccepted(!!c)} />
                                <Label htmlFor="guidelines" className="text-sm font-semibold cursor-pointer text-orange-800 dark:text-orange-300">
                                    I understand and will follow the ORS guidelines
                                </Label>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t p-6">
                        <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSubmitting}>
                            {isSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Submit Request
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}
