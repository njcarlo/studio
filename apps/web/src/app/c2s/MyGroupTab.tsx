"use client";

import React, { useState } from "react";
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
import { Checkbox } from "@studio/ui";
import { Badge } from "@studio/ui";
import { Avatar, AvatarFallback } from "@studio/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@studio/ui";
import {
  MapPin,
  Calendar,
  BookOpen,
  Save,
  LoaderCircle,
  ClipboardCheck,
  PlusCircle,
  Users,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { C2SGroup, C2SMentee } from "@studio/types";
import { useToast } from "@/hooks/use-toast";
import { toJsDate } from "@/lib/utils";
import {
  getMyC2SGroup,
  updateMyC2SGroupProfile,
  createC2SSessionAction,
  getC2SSessionsForGroupAction,
} from "@/actions/c2s";

type GroupWithMentees = C2SGroup & { mentees: C2SMentee[] };

const GroupProfileCard = ({ group }: { group: GroupWithMentees }) => {
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

const RecordSessionDialog = ({
  group,
  open,
  onOpenChange,
}: {
  group: GroupWithMentees;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [module, setModule] = useState(group.currentModule || "");
  const [notes, setNotes] = useState("");
  const [attendance, setAttendance] = useState<Record<string, boolean>>(
    () => Object.fromEntries(group.mentees.map((m) => [m.id, true])),
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await createC2SSessionAction(group.id, {
        date: new Date(date),
        module: module || null,
        notes: notes || null,
        attendance: group.mentees.map((m) => ({ menteeId: m.id, present: !!attendance[m.id] })),
      });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast({ title: "Session recorded" });
      queryClient.invalidateQueries({ queryKey: ["c2s-sessions", group.id] });
      onOpenChange(false);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Could not record session" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session-date">Date</Label>
              <Input id="session-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-module">Module</Label>
              <Input id="session-module" value={module} onChange={(e) => setModule(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="session-notes">Notes</Label>
            <Textarea id="session-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Attendance</Label>
            {group.mentees.length === 0 ? (
              <p className="text-sm text-muted-foreground">No mentees in this group yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {group.mentees.map((m) => (
                  <label
                    key={m.id}
                    className="flex items-center gap-3 rounded-lg border border-border/50 p-2.5 cursor-pointer"
                  >
                    <Checkbox
                      checked={!!attendance[m.id]}
                      onCheckedChange={(checked) =>
                        setAttendance((prev) => ({ ...prev, [m.id]: !!checked }))
                      }
                    />
                    <span className="text-sm font-medium">
                      {m.firstName} {m.lastName}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            {createMutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const GroupSessionsCard = ({ group }: { group: GroupWithMentees }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["c2s-sessions", group.id],
    queryFn: async () => {
      const res = await getC2SSessionsForGroupAction(group.id);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  const menteeName = (menteeId: string) => {
    const mentee = group.mentees.find((m) => m.id === menteeId);
    return mentee ? `${mentee.firstName} ${mentee.lastName}` : "Unknown";
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" /> Sessions
          </CardTitle>
          <CardDescription>Past sessions and mentee attendance.</CardDescription>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Record Session
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : sessions && sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="rounded-lg border border-border/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">
                    {toJsDate(session.date).toLocaleDateString()}
                    {session.module ? ` — ${session.module}` : ""}
                  </div>
                  <Badge variant="secondary">
                    {session.attendance.filter((a) => a.present).length}/{session.attendance.length} present
                  </Badge>
                </div>
                {session.notes && <p className="text-sm text-muted-foreground">{session.notes}</p>}
                <div className="flex flex-wrap gap-2">
                  {session.attendance.map((a) => (
                    <Badge key={a.id} variant={a.present ? "default" : "outline"} className="text-[11px]">
                      {menteeName(a.menteeId)}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">No sessions recorded yet.</p>
        )}
      </CardContent>
      <RecordSessionDialog group={group} open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </Card>
  );
};

const GroupMenteesCard = ({ group }: { group: GroupWithMentees }) => (
  <Card className="border-border/50 shadow-sm">
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" /> Mentees ({group.mentees.length})
      </CardTitle>
    </CardHeader>
    <CardContent>
      {group.mentees.length === 0 ? (
        <p className="text-sm text-muted-foreground">No mentees in this group yet.</p>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {group.mentees.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-2.5">
              <Avatar className="h-9 w-9">
                <AvatarFallback>{m.firstName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-semibold">{m.firstName} {m.lastName}</p>
                <p className="text-[10px] text-muted-foreground">{m.email}</p>
              </div>
              <Badge
                variant={
                  m.status === "Completed" ? "default" : m.status === "Dropped" ? "destructive" : "secondary"
                }
                className="text-[11px]"
              >
                {m.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

export default function MyGroupTab() {
  const { data: groups, isLoading } = useQuery({
    queryKey: ["my-c2s-group"],
    queryFn: async () => {
      const res = await getMyC2SGroup();
      if (!res.success) throw new Error(res.error);
      return res.data as GroupWithMentees[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-2xl bg-muted/5">
        <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium">No group assigned</h3>
        <p className="text-muted-foreground">
          You haven't been assigned as a mentor for any Connect 2 Souls group yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.id} className="space-y-6">
          <GroupProfileCard group={group} />
          <GroupMenteesCard group={group} />
          <GroupSessionsCard group={group} />
        </div>
      ))}
    </div>
  );
}
