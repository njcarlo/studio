"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@studio/ui";
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
    AlertDialogCancel,
    AlertDialogAction,
} from "@studio/ui";
import { Input } from "@studio/ui";
import { Label } from "@studio/ui";
import { Textarea } from "@studio/ui";
import { Switch } from "@studio/ui";
import { Badge } from "@studio/ui";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@studio/ui";
import { LoaderCircle, PlusCircle, BookOpen, Pencil, Trash2 } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import {
    getSermons,
    createSermonAction,
    updateSermonAction,
    deleteSermonAction,
} from "@/actions/sermons";
import type { Sermon } from "@studio/types";
import { toJsDate } from "@/lib/utils";

type FormState = {
    title: string;
    speaker: string;
    date: string;
    scripture: string;
    description: string;
    videoUrl: string;
    audioUrl: string;
    isPublic: boolean;
};

const EMPTY_FORM: FormState = {
    title: "",
    speaker: "",
    date: new Date().toISOString().slice(0, 10),
    scripture: "",
    description: "",
    videoUrl: "",
    audioUrl: "",
    isPublic: true,
};

export default function SermonsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { canManageContent, isLoading: isPermissionsLoading } = useUserRole();

    const { data: sermons = [], isLoading } = useQuery({
        queryKey: ["sermons"],
        queryFn: async () => {
            const res = await getSermons();
            if (!res.success) throw new Error(res.error);
            return res.data as Sermon[];
        },
        enabled: canManageContent,
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [deleteTarget, setDeleteTarget] = useState<Sermon | null>(null);

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["sermons"] });

    const createMutation = useMutation({
        mutationFn: async () => {
            const res = await createSermonAction({
                title: form.title,
                speaker: form.speaker || null,
                date: new Date(form.date),
                scripture: form.scripture || null,
                description: form.description || null,
                videoUrl: form.videoUrl || null,
                audioUrl: form.audioUrl || null,
                isPublic: form.isPublic,
            });
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            toast({ title: "Sermon added" });
            invalidate();
            setIsDialogOpen(false);
        },
        onError: () => toast({ variant: "destructive", title: "Could not add sermon" }),
    });

    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!editingId) return;
            const res = await updateSermonAction(editingId, {
                title: form.title,
                speaker: form.speaker || null,
                date: new Date(form.date),
                scripture: form.scripture || null,
                description: form.description || null,
                videoUrl: form.videoUrl || null,
                audioUrl: form.audioUrl || null,
                isPublic: form.isPublic,
            });
            if (!res.success) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            toast({ title: "Sermon updated" });
            invalidate();
            setIsDialogOpen(false);
        },
        onError: () => toast({ variant: "destructive", title: "Could not update sermon" }),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await deleteSermonAction(id);
            if (!res.success) throw new Error(res.error);
        },
        onSuccess: () => {
            toast({ title: "Sermon deleted" });
            invalidate();
            setDeleteTarget(null);
        },
        onError: () => toast({ variant: "destructive", title: "Could not delete sermon" }),
    });

    const openCreateDialog = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setIsDialogOpen(true);
    };

    const openEditDialog = (sermon: Sermon) => {
        setEditingId(sermon.id);
        setForm({
            title: sermon.title,
            speaker: sermon.speaker ?? "",
            date: toJsDate(sermon.date).toISOString().slice(0, 10),
            scripture: sermon.scripture ?? "",
            description: sermon.description ?? "",
            videoUrl: sermon.videoUrl ?? "",
            audioUrl: sermon.audioUrl ?? "",
            isPublic: sermon.isPublic,
        });
        setIsDialogOpen(true);
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;

    if (!isPermissionsLoading && !canManageContent) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                    <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                    <h2 className="text-xl font-semibold">Access Denied</h2>
                    <p className="text-muted-foreground text-center max-w-md">
                        You don't have permission to manage sermons. Contact an administrator to
                        request access.
                    </p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex flex-col space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Sermons</h1>
                        <p className="text-muted-foreground">
                            Manage the sermon catalogue shown on the public sermons page.
                        </p>
                    </div>
                    <Button onClick={openCreateDialog}>
                        <PlusCircle className="mr-2 h-4 w-4" /> New Sermon
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" /> Sermon Catalogue
                        </CardTitle>
                        <CardDescription>
                            Sermons marked "Public" appear on{" "}
                            <code className="text-xs">/public/sermons</code>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : sermons.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-8 text-center">
                                No sermons yet.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Speaker</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Visibility</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sermons.map((sermon) => (
                                        <TableRow key={sermon.id}>
                                            <TableCell className="font-medium">{sermon.title}</TableCell>
                                            <TableCell>{sermon.speaker || "—"}</TableCell>
                                            <TableCell>{toJsDate(sermon.date).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={sermon.isPublic ? "default" : "secondary"}>
                                                    {sermon.isPublic ? "Public" : "Private"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(sermon)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(sermon)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Sermon" : "New Sermon"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="sermon-title">Title</Label>
                                <Input
                                    id="sermon-title"
                                    value={form.title}
                                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sermon-speaker">Speaker</Label>
                                <Input
                                    id="sermon-speaker"
                                    value={form.speaker}
                                    onChange={(e) => setForm((f) => ({ ...f, speaker: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sermon-date">Date</Label>
                                <Input
                                    id="sermon-date"
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sermon-scripture">Scripture Reference</Label>
                            <Input
                                id="sermon-scripture"
                                value={form.scripture}
                                onChange={(e) => setForm((f) => ({ ...f, scripture: e.target.value }))}
                                placeholder="e.g. John 3:16"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sermon-description">Description</Label>
                            <Textarea
                                id="sermon-description"
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="sermon-video">Video URL</Label>
                                <Input
                                    id="sermon-video"
                                    value={form.videoUrl}
                                    onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sermon-audio">Audio URL</Label>
                                <Input
                                    id="sermon-audio"
                                    value={form.audioUrl}
                                    onChange={(e) => setForm((f) => ({ ...f, audioUrl: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                            <div>
                                <Label htmlFor="sermon-public">Public</Label>
                                <p className="text-xs text-muted-foreground">
                                    Show this sermon on the public sermons page.
                                </p>
                            </div>
                            <Switch
                                id="sermon-public"
                                checked={form.isPublic}
                                onCheckedChange={(checked) => setForm((f) => ({ ...f, isPublic: checked }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => (editingId ? updateMutation.mutate() : createMutation.mutate())}
                            disabled={!form.title.trim() || isSaving}
                        >
                            {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {editingId ? "Save Changes" : "Add Sermon"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Sermon</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deleteTarget?.title}"? This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
