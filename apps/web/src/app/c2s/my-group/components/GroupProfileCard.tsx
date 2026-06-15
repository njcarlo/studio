"use client";

import { useState } from "react";
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
import { MapPin, Calendar, BookOpen, Save, LoaderCircle, Users } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { updateMyC2SGroupProfile } from "@/actions/c2s";
import type { GroupWithMentees } from "./types";

export const GroupProfileCard = ({ group }: { group: GroupWithMentees }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useState(group.location || "");
  const [meetingSchedule, setMeetingSchedule] = useState(group.meetingSchedule || "");
  const [currentModule, setCurrentModule] = useState(group.currentModule || "");

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await updateMyC2SGroupProfile(group.id, {
        location,
        meetingSchedule,
        currentModule,
      });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast({ title: "Group profile updated" });
      queryClient.invalidateQueries({ queryKey: ["my-c2s-group"] });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Update failed" });
    },
  });

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> {group.name}
        </CardTitle>
        <CardDescription>
          Update your group's location, meeting schedule, and current module.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor={`location-${group.id}`} className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Location
            </Label>
            <Input
              id={`location-${group.id}`}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Room 201"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`schedule-${group.id}`} className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Meeting Schedule
            </Label>
            <Input
              id={`schedule-${group.id}`}
              value={meetingSchedule}
              onChange={(e) => setMeetingSchedule(e.target.value)}
              placeholder="e.g. Saturdays 4PM"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`module-${group.id}`} className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> Current Module
            </Label>
            <Input
              id={`module-${group.id}`}
              value={currentModule}
              onChange={(e) => setCurrentModule(e.target.value)}
              placeholder="e.g. Module 3: Identity in Christ"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
