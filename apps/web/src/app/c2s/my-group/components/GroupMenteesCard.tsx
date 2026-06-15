"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@studio/ui";
import { Button } from "@studio/ui";
import { Label } from "@studio/ui";
import { Input } from "@studio/ui";
import { Textarea } from "@studio/ui";
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@studio/ui";
import { Users, UserPlus, MoreHorizontal, Pencil, Trash2, LoaderCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { C2SMentee } from "@studio/types";
import { useToast } from "@/hooks/use-toast";
import {
  createMyGroupMenteeAction,
  updateMyGroupMenteeAction,
  deleteMyGroupMenteeAction,
} from "@/actions/c2s";
import type { GroupWithMentees } from "./types";

type MenteeFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: "In Progress" | "Completed" | "Dropped";
  notes: string;
};

const emptyForm: MenteeFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  status: "In Progress",
  notes: "",
};

const MenteeFormDialog = ({
  group,
  mentee,
  open,
  onOpenChange,
}: {
  group: GroupWithMentees;
  mentee: C2SMentee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<MenteeFormState>(emptyForm);

  useEffect(() => {
    if (!open) return;
    setForm(
      mentee
        ? {
            firstName: mentee.firstName,
            lastName: mentee.lastName,
            email: mentee.email,
            phone: mentee.phone,
            status: mentee.status,
            notes: mentee.notes ?? "",
          }
        : emptyForm,
    );
  }, [open, mentee]);

  const mutation = useMutation({
    mutationFn: async () => {
      const data = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        status: form.status,
        notes: form.notes.trim() || null,
      };
      const res = mentee
        ? await updateMyGroupMenteeAction(mentee.id, data)
        : await createMyGroupMenteeAction(group.id, data);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      toast({ title: mentee ? "Mentee updated" : "Mentee added" });
      queryClient.invalidateQueries({ queryKey: ["my-c2s-group"] });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Could not save mentee", description: err.message });
    },
  });

  const isValid = form.firstName.trim() && form.lastName.trim() && form.email.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mentee ? "Edit Mentee" : "Add Mentee"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mentee-firstName">First Name</Label>
              <Input
                id="mentee-firstName"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mentee-lastName">Last Name</Label>
              <Input
                id="mentee-lastName"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mentee-email">Email</Label>
              <Input
                id="mentee-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mentee-phone">Phone</Label>
              <Input
                id="mentee-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                setForm((f) => ({ ...f, status: value as MenteeFormState["status"] }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Dropped">Dropped</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mentee-notes">Notes</Label>
            <Textarea
              id="mentee-notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Private notes about this mentee's progress..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !isValid}>
            {mutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            {mentee ? "Save Changes" : "Add Mentee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DeleteMenteeAlert = ({
  mentee,
  open,
  onOpenChange,
}: {
  mentee: C2SMentee;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await deleteMyGroupMenteeAction(mentee.id);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => {
      toast({ title: "Mentee removed" });
      queryClient.invalidateQueries({ queryKey: ["my-c2s-group"] });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Could not remove mentee", description: err.message });
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Remove {mentee.firstName} {mentee.lastName}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the mentee from this group. This cannot be undone.
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
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const GroupMenteesCard = ({ group }: { group: GroupWithMentees }) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingMentee, setEditingMentee] = useState<C2SMentee | null>(null);
  const [deletingMentee, setDeletingMentee] = useState<C2SMentee | null>(null);

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Mentees ({group.mentees.length})
        </CardTitle>
        <Button
          onClick={() => {
            setEditingMentee(null);
            setFormOpen(true);
          }}
        >
          <UserPlus className="mr-2 h-4 w-4" /> Add Mentee
        </Button>
      </CardHeader>
      <CardContent>
        {group.mentees.length === 0 ? (
          <p className="text-sm text-muted-foreground">No mentees in this group yet.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {group.mentees.map((m) => (
              <div key={m.id} className="flex items-start gap-3 rounded-lg border border-border/50 p-2.5">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{m.firstName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">
                    {m.firstName} {m.lastName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{m.email}</p>
                  {m.notes && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.notes}</p>
                  )}
                </div>
                <Badge
                  variant={
                    m.status === "Completed" ? "default" : m.status === "Dropped" ? "destructive" : "secondary"
                  }
                  className="text-[11px]"
                >
                  {m.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1 -mt-1 shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingMentee(m);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeletingMentee(m)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <MenteeFormDialog group={group} mentee={editingMentee} open={formOpen} onOpenChange={setFormOpen} />
      {deletingMentee && (
        <DeleteMenteeAlert
          mentee={deletingMentee}
          open={!!deletingMentee}
          onOpenChange={(open) => !open && setDeletingMentee(null)}
        />
      )}
    </Card>
  );
};
