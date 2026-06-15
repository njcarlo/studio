"use client";

import { useEffect, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@studio/ui";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@studio/ui";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@studio/ui";
import {
  ClipboardCheck,
  PlusCircle,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { C2SSession, C2SAttendanceRecord } from "@studio/types";
import { useToast } from "@/hooks/use-toast";
import { toJsDate } from "@/lib/utils";
import {
  createC2SSessionAction,
  updateC2SSessionAction,
  deleteC2SSessionAction,
  getC2SSessionsForGroupAction,
} from "@/actions/c2s";
import type { GroupWithMentees } from "./types";

type SessionWithAttendance = C2SSession & { attendance: C2SAttendanceRecord[] };

const SessionFormDialog = ({
  group,
  session,
  open,
  onOpenChange,
}: {
  group: GroupWithMentees;
  session: SessionWithAttendance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [module, setModule] = useState("");
  const [notes, setNotes] = useState("");
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;
    if (session) {
      setDate(toJsDate(session.date).toISOString().slice(0, 10));
      setModule(session.module ?? "");
      setNotes(session.notes ?? "");
      setAttendance(Object.fromEntries(session.attendance.map((a) => [a.menteeId, a.present])));
    } else {
      setDate(today);
      setModule(group.currentModule || "");
      setNotes("");
      setAttendance(Object.fromEntries(group.mentees.map((m) => [m.id, true])));
    }
  }, [open, session, group, today]);

  const mutation = useMutation({
    mutationFn: async () => {
      const attendanceData = group.mentees.map((m) => ({ menteeId: m.id, present: !!attendance[m.id] }));
      const res = session
        ? await updateC2SSessionAction(session.id, {
            date: new Date(date),
            module: module || null,
            notes: notes || null,
            attendance: attendanceData,
          })
        : await createC2SSessionAction(group.id, {
            date: new Date(date),
            module: module || null,
            notes: notes || null,
            attendance: attendanceData,
          });
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast({ title: session ? "Session updated" : "Session recorded" });
      queryClient.invalidateQueries({ queryKey: ["c2s-sessions", group.id] });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Could not save session", description: err.message });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{session ? "Edit Session" : "Record Session"}</DialogTitle>
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
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            {session ? "Save Changes" : "Save Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DeleteSessionAlert = ({
  groupId,
  session,
  open,
  onOpenChange,
}: {
  groupId: string;
  session: SessionWithAttendance;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await deleteC2SSessionAction(session.id);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => {
      toast({ title: "Session deleted" });
      queryClient.invalidateQueries({ queryKey: ["c2s-sessions", groupId] });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Could not delete session", description: err.message });
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this session?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the session and its attendance records. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const GroupSessionsCard = ({ group }: { group: GroupWithMentees }) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionWithAttendance | null>(null);
  const [deletingSession, setDeletingSession] = useState<SessionWithAttendance | null>(null);

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
        <Button
          onClick={() => {
            setEditingSession(null);
            setFormOpen(true);
          }}
        >
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
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold">
                    {toJsDate(session.date).toLocaleDateString()}
                    {session.module ? ` — ${session.module}` : ""}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {session.attendance.filter((a) => a.present).length}/{session.attendance.length} present
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingSession(session);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeletingSession(session)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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
      <SessionFormDialog group={group} session={editingSession} open={formOpen} onOpenChange={setFormOpen} />
      {deletingSession && (
        <DeleteSessionAlert
          groupId={group.id}
          session={deletingSession}
          open={!!deletingSession}
          onOpenChange={(open) => !open && setDeletingSession(null)}
        />
      )}
    </Card>
  );
};
