"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { RadioGroup, RadioGroupItem } from "@studio/ui";
import { HandHeart, LoaderCircle, CheckCircle2 } from "lucide-react";
import { submitPrayerRequest } from "@/actions/prayer-requests";

export default function PublicPrayerRequestsPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [type, setType] = useState<"Prayer" | "Counselling">("Prayer");
    const [message, setMessage] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const submitMutation = useMutation({
        mutationFn: async () => {
            const res = await submitPrayerRequest({
                name,
                email,
                phone: phone || undefined,
                type,
                message,
            });
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => setSubmitted(true),
    });

    const isValid = name.trim() && email.trim() && message.trim();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6">
            <div className="w-full max-w-lg">
                <div className="text-center mb-6">
                    <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-3">
                        <HandHeart className="h-8 w-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">Prayer & Counselling</h1>
                    <p className="text-gray-600 mt-1">
                        Submit a request and our pastoral team will reach out to you.
                    </p>
                </div>

                <Card className="shadow-lg">
                    {submitted ? (
                        <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                            <h2 className="text-xl font-semibold">Request Submitted</h2>
                            <p className="text-muted-foreground max-w-sm">
                                Thank you for reaching out. Our pastoral team has been notified and will
                                follow up with you soon.
                            </p>
                        </CardContent>
                    ) : (
                        <>
                            <CardHeader>
                                <CardTitle>Submit a Request</CardTitle>
                                <CardDescription>
                                    All requests are kept confidential and reviewed by our pastoral team.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Request Type</Label>
                                    <RadioGroup value={type} onValueChange={(v) => setType(v as "Prayer" | "Counselling")} className="flex gap-6">
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="Prayer" id="type-prayer" />
                                            <Label htmlFor="type-prayer" className="cursor-pointer">Prayer</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="Counselling" id="type-counselling" />
                                            <Label htmlFor="type-counselling" className="cursor-pointer">Counselling</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="prayer-name">Name</Label>
                                    <Input id="prayer-name" value={name} onChange={(e) => setName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="prayer-email">Email</Label>
                                    <Input id="prayer-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="prayer-phone">Phone (optional)</Label>
                                    <Input id="prayer-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="prayer-message">
                                        {type === "Prayer" ? "Prayer Request" : "What would you like to discuss?"}
                                    </Label>
                                    <Textarea
                                        id="prayer-message"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={5}
                                    />
                                </div>
                                <Button
                                    className="w-full"
                                    disabled={!isValid || submitMutation.isPending}
                                    onClick={() => submitMutation.mutate()}
                                >
                                    {submitMutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Submit Request
                                </Button>
                            </CardContent>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}
