"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@studio/ui";
import { Button } from "@studio/ui";
import { Label } from "@studio/ui";
import { Input } from "@studio/ui";
import { Textarea } from "@studio/ui";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@studio/ui";
import { CalendarHeart, LoaderCircle, CheckCircle2, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { getPublicEvents, submitEventSignup } from "@/actions/events";
import { getYoutubeThumbnail } from "@/lib/youtube";

export default function PublicEventsPage() {
    const { data: events, isLoading } = useQuery({
        queryKey: ["public-events"],
        queryFn: async () => {
            const res = await getPublicEvents();
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
    });

    const [signupEvent, setSignupEvent] = useState<{ id: string; title: string } | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [guestCount, setGuestCount] = useState(1);
    const [notes, setNotes] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const submitMutation = useMutation({
        mutationFn: async () => {
            if (!signupEvent) return;
            const res = await submitEventSignup(signupEvent.id, {
                name,
                email,
                phone: phone || undefined,
                guestCount,
                notes: notes || undefined,
            });
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => setSubmitted(true),
    });

    const resetForm = () => {
        setName("");
        setEmail("");
        setPhone("");
        setGuestCount(1);
        setNotes("");
        setSubmitted(false);
    };

    const isValid = name.trim() && email.trim();

    return (
        <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6">
            <div className="w-full max-w-2xl py-10">
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-3">
                        <CalendarHeart className="h-8 w-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">Upcoming Events</h1>
                    <p className="text-gray-600 mt-1">
                        Browse upcoming church events and sign up to attend.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : !events || events.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center text-muted-foreground">
                        No upcoming events have been published yet. Please check back later.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {events.map((event) => (
                            <Card key={event.id} className="shadow-md overflow-hidden">
                                {getYoutubeThumbnail((event as any).videoUrl) && (
                                    <img
                                        src={getYoutubeThumbnail((event as any).videoUrl)!}
                                        alt={event.title}
                                        className="w-full aspect-video object-cover"
                                    />
                                )}
                                <CardHeader>
                                    <CardTitle>{event.title}</CardTitle>
                                    <CardDescription className="flex flex-wrap items-center gap-3 mt-1">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="h-4 w-4" />
                                            {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
                                            {event.startTime && ` · ${event.startTime}`}
                                            {event.endTime && `–${event.endTime}`}
                                        </span>
                                        {event.location && (
                                            <span className="flex items-center gap-1.5">
                                                <MapPin className="h-4 w-4" />
                                                {event.location}
                                            </span>
                                        )}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {event.description && (
                                        <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                                    )}
                                    <Button
                                        onClick={() => {
                                            resetForm();
                                            setSignupEvent({ id: event.id, title: event.title });
                                        }}
                                    >
                                        Sign Up
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={!!signupEvent} onOpenChange={(open) => !open && setSignupEvent(null)}>
                <DialogContent>
                    {submitted ? (
                        <div className="flex flex-col items-center text-center py-8 space-y-4">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                            <h2 className="text-xl font-semibold">Sign-up Submitted</h2>
                            <p className="text-muted-foreground max-w-sm">
                                Thanks for signing up for {signupEvent?.title}! We look forward to seeing you.
                            </p>
                            <Button onClick={() => setSignupEvent(null)}>Close</Button>
                        </div>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle>Sign Up — {signupEvent?.title}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 py-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="signup-name">Name</Label>
                                    <Input id="signup-name" value={name} onChange={(e) => setName(e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="signup-email">Email</Label>
                                    <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="signup-phone">Phone (optional)</Label>
                                        <Input id="signup-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="signup-guests">Number of Guests</Label>
                                        <Input
                                            id="signup-guests"
                                            type="number"
                                            min={1}
                                            value={guestCount}
                                            onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="signup-notes">Notes (optional)</Label>
                                    <Textarea id="signup-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setSignupEvent(null)}>Cancel</Button>
                                <Button disabled={!isValid || submitMutation.isPending} onClick={() => submitMutation.mutate()}>
                                    {submitMutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Submit
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
