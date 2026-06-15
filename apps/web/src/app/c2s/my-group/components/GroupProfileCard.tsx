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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@studio/ui";
import { MapPin, Calendar, BookOpen, Save, LoaderCircle, Users, Tag, MapPinned } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { updateMyC2SGroupProfile } from "@/actions/c2s";
import type { GroupWithMentees } from "./types";

const MEETUP_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const GroupProfileCard = ({ group }: { group: GroupWithMentees }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useState(group.location || "");
  const [meetingSchedule, setMeetingSchedule] = useState(group.meetingSchedule || "");
  const [currentModule, setCurrentModule] = useState(group.currentModule || "");
  const [ageGroupLabel, setAgeGroupLabel] = useState(group.ageGroupLabel || "");
  const [ageRangeMin, setAgeRangeMin] = useState(group.ageRangeMin?.toString() || "");
  const [ageRangeMax, setAgeRangeMax] = useState(group.ageRangeMax?.toString() || "");
  const [meetupDay, setMeetupDay] = useState(group.meetupDay || "");
  const [demographics, setDemographics] = useState((group.demographics || []).join(", "));
  const [mapX, setMapX] = useState(group.mapX?.toString() || "");
  const [mapY, setMapY] = useState(group.mapY?.toString() || "");

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await updateMyC2SGroupProfile(group.id, {
        location,
        meetingSchedule,
        currentModule,
        ageGroupLabel: ageGroupLabel || null,
        ageRangeMin: ageRangeMin ? parseInt(ageRangeMin, 10) : null,
        ageRangeMax: ageRangeMax ? parseInt(ageRangeMax, 10) : null,
        meetupDay: meetupDay || null,
        demographics: demographics
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        mapX: mapX ? parseFloat(mapX) : null,
        mapY: mapY ? parseFloat(mapY) : null,
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
          Update your group's profile. These details power the public Group Finder.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor={`location-${group.id}`} className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Barangay / Subdivision
            </Label>
            <Input
              id={`location-${group.id}`}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Burol Main"
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
              placeholder="e.g. Friday · 7:00 PM"
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

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor={`age-group-${group.id}`} className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" /> Age Group
            </Label>
            <Input
              id={`age-group-${group.id}`}
              value={ageGroupLabel}
              onChange={(e) => setAgeGroupLabel(e.target.value)}
              placeholder="e.g. Young Adults"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" /> Age Range
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                value={ageRangeMin}
                onChange={(e) => setAgeRangeMin(e.target.value)}
                placeholder="Min"
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="number"
                min={0}
                value={ageRangeMax}
                onChange={(e) => setAgeRangeMax(e.target.value)}
                placeholder="Max"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`meetup-day-${group.id}`} className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Meetup Day
            </Label>
            <Select value={meetupDay} onValueChange={setMeetupDay}>
              <SelectTrigger id={`meetup-day-${group.id}`}>
                <SelectValue placeholder="Select a day" />
              </SelectTrigger>
              <SelectContent>
                {MEETUP_DAYS.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`demographics-${group.id}`} className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" /> Demographics
            </Label>
            <Input
              id={`demographics-${group.id}`}
              value={demographics}
              onChange={(e) => setDemographics(e.target.value)}
              placeholder="e.g. Single Only, Couples: Married"
            />
            <p className="text-xs text-muted-foreground">Comma-separated tags shown on your group's card.</p>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <MapPinned className="h-3.5 w-3.5" /> Map Position (%)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                value={mapX}
                onChange={(e) => setMapX(e.target.value)}
                placeholder="X"
              />
              <Input
                type="number"
                min={0}
                max={100}
                value={mapY}
                onChange={(e) => setMapY(e.target.value)}
                placeholder="Y"
              />
            </div>
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
