"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@studio/ui";
import { HeartHandshake, LoaderCircle, CheckCircle2, MapPin, Calendar } from "lucide-react";
import { getPublicC2SGroups, submitC2SJoinRequest } from "@/actions/c2s";

export default function C2SJoinPage() {
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["public-c2s-groups"],
    queryFn: async () => {
      const res = await getPublicC2SGroups();
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  const [groupId, setGroupId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await submitC2SJoinRequest({
        groupId,
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        message: message || undefined,
      });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => setSubmitted(true),
  });

  const selectedGroup = groups?.find((g) => g.id === groupId);
  const isValid = groupId && firstName.trim() && lastName.trim() && email.trim();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-3">
            <HeartHandshake className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Connect 2 Souls</h1>
          <p className="text-gray-600 mt-1">Request to join a mentoring group</p>
        </div>

        <Card className="shadow-lg">
          {submitted ? (
            <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <h2 className="text-xl font-semibold">Request Submitted</h2>
              <p className="text-muted-foreground max-w-sm">
                Your request to join{" "}
                <strong>{selectedGroup?.name ?? "this group"}</strong> has been sent to the
                mentor for review. You'll receive an email once it's been decided.
              </p>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle>Join Request</CardTitle>
                <CardDescription>
                  Choose a group and fill in your details. The group's mentor will review your
                  request.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="group">Group</Label>
                  {groupsLoading ? (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Loading groups...
                    </div>
                  ) : (
                    <Select value={groupId} onValueChange={setGroupId}>
                      <SelectTrigger id="group">
                        <SelectValue placeholder="Select a group" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups?.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {selectedGroup && (selectedGroup.location || selectedGroup.meetingSchedule) && (
                    <div className="text-xs text-muted-foreground space-y-1 pt-1">
                      {selectedGroup.meetingSchedule && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" /> {selectedGroup.meetingSchedule}
                        </div>
                      )}
                      {selectedGroup.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" /> {selectedGroup.location}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message (optional)</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell the mentor a bit about yourself..."
                  />
                </div>

                <Button
                  className="w-full"
                  disabled={!isValid || submitMutation.isPending}
                  onClick={() => submitMutation.mutate()}
                >
                  {submitMutation.isPending ? (
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Submit Request
                </Button>
                {submitMutation.isError && (
                  <p className="text-sm text-destructive text-center">
                    Something went wrong. Please try again.
                  </p>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
