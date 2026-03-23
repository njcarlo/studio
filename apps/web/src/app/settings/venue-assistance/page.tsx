"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
    Sheet,
    SheetContent,
} from "@studio/ui";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@studio/ui";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@studio/ui";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@studio/ui";
import { Badge } from "@studio/ui";
import { Alert, AlertDescription } from "@studio/ui";
import { LoaderCircle, MoreHorizontal, PlusCircle, AlertTriangle, ShieldAlert } from "lucide-react";
import { usePermissionsStore } from "@studio/store";
import { useShallow } from "zustand/react/shallow";
import { useToast } from "@/hooks/use-toast";
import { getRooms, getMinistries } from "@/actions/db";
import {
    getAllAssistanceConfigs,
    deleteAssistanceConfig,
} from "@/actions/venue-assistance";
import { AssistanceConfigForm } from "@/components/venue-assistance/assistance-config-form";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AssistanceConfig = Awaited<ReturnType<typeof getAllAssistanceConfigs>>[number];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function VenueAssistanceSettingsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const {
        isLoading: isPermissionsLoading,
        canManageVenueAssistance,
        canManageOwnMinistryAssistance,
        workerProfile,
        myMinistryIds,
    } = usePermissionsStore(
        useShallow((s) => ({
            isLoading: s.isLoading,
            canManageVenueAssistance: s.canManageVenueAssistance,
            canManageOwnMinistryAssistance: s.canManageOwnMinistryAssistance,
            workerProfile: s.workerProfile,
            myMinistryIds: s.myMinistryIds,
        }))
    );

    const canAccess = canManageVenueAssistance || canManageOwnMinistryAssistance;

    // ── Data fetching ────────────────────────────────────────────────────────
    const { data: allRooms = [], isLoading: isRoomsLoading } = useQuery({
        queryKey: ["rooms"],
        queryFn: getRooms,
        enabled: canAccess,
    });

    const { data: allMinistries = [], isLoading: isMinistriesLoading } = useQuery({
        queryKey: ["ministries"],
        queryFn: getMinistries,
        enabled: canAccess,
    });

    const { data: configs = [], isLoading: isConfigsLoading } = useQuery({
        queryKey: ["assistanceConfigs"],
        queryFn: getAllAssistanceConfigs,
        enabled: canAccess,
    });

    // ── Scoped data for ministry-head users ──────────────────────────────────
    const visibleMinistries = useMemo(() => {
        if (canManageVenueAssistance) return allMinistries;
        // Ministry head: only their own ministries
        return allMinistries.filter((m) => myMinistryIds.includes(m.id));
    }, [canManageVenueAssistance, allMinistries, myMinistryIds]);

    const visibleRooms = useMemo(() => {
        if (canManageVenueAssistance) return allRooms;
        // Ministry head: only rooms that have a config for their ministry,
        // plus allow creating new configs for any room
        return allRooms;
    }, [canManageVenueAssistance, allRooms]);

    const visibleConfigs = useMemo(() => {
        if (canManageVenueAssistance) return configs;
        // Ministry head: only configs for their ministries
        return configs.filter((c) => myMinistryIds.includes(c.ministryId));
    }, [canManageVenueAssistance, configs, myMinistryIds]);

    // ── Sheet / dialog state ─────────────────────────────────────────────────
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingConfig, setEditingConfig] = useState<AssistanceConfig | null>(null);
    const [configToDelete, setConfigToDelete] = useState<AssistanceConfig | null>(null);

    // ── Helpers ──────────────────────────────────────────────────────────────
    const getRoomName = (roomId: string) =>
        allRooms.find((r) => r.id === roomId)?.name ?? roomId;

    const getMinistryName = (ministryId: string) =>
        allMinistries.find((m) => m.id === ministryId)?.name ?? ministryId;

    // Group configs by room
    const configsByRoom = useMemo(() => {
        const map = new Map<string, AssistanceConfig[]>();
        for (const config of visibleConfigs) {
            const roomId = config.roomId;
            if (!map.has(roomId)) map.set(roomId, []);
            map.get(roomId)!.push(config);
        }
        return map;
    }, [visibleConfigs]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const openCreate = () => {
        setEditingConfig(null);
        setIsSheetOpen(true);
    };

    const openEdit = (config: AssistanceConfig) => {
        setEditingConfig(config);
        setIsSheetOpen(true);
    };

    const handleSheetSuccess = () => {
        setIsSheetOpen(false);
        setEditingConfig(null);
        queryClient.invalidateQueries({ queryKey: ["assistanceConfigs"] });
    };

    const handleDelete = async () => {
        if (!configToDelete || !workerProfile) return;

        // Permission check: ministry head can only delete their own ministry's configs
        if (!canManageVenueAssistance && !myMinistryIds.includes(configToDelete.ministryId)) {
            toast({
                variant: "destructive",
                title: "Permission denied",
                description: "You can only delete configurations for your own ministry.",
            });
            setConfigToDelete(null);
            return;
        }

        try {
            await deleteAssistanceConfig(configToDelete.id, workerProfile.id);
            toast({ title: "Configuration deleted" });
            queryClient.invalidateQueries({ queryKey: ["assistanceConfigs"] });
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Delete failed",
                description: err?.message ?? "Could not delete configuration.",
            });
        } finally {
            setConfigToDelete(null);
        }
    };

    // ── Loading / access states ───────────────────────────────────────────────
    const isLoading = isPermissionsLoading || isRoomsLoading || isMinistriesLoading || isConfigsLoading;

    if (isPermissionsLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center py-10">
                    <LoaderCircle className="h-8 w-8 animate-spin" />
                </div>
            </AppLayout>
        );
    }

    if (!canAccess) {
        return (
            <AppLayout>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-destructive" />
                            Access Denied
                        </CardTitle>
                        <CardDescription>
                            You do not have permission to manage venue assistance configurations.
                            Contact an administrator to request access.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-headline font-bold">Venue Assistance</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Configure which ministries provide assistance for each room.
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <PlusCircle className="mr-2 h-4 w-4" /> New Configuration
                </Button>
            </div>

            {/* Ministry-head scope notice */}
            {!canManageVenueAssistance && canManageOwnMinistryAssistance && (
                <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        You can only manage configurations for your own{" "}
                        {visibleMinistries.length === 1 ? "ministry" : "ministries"}.
                    </AlertDescription>
                </Alert>
            )}

            <div className="mt-6 space-y-6">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <LoaderCircle className="h-8 w-8 animate-spin" />
                    </div>
                ) : configsByRoom.size === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-muted-foreground">
                            No assistance configurations yet. Click &quot;New Configuration&quot; to get started.
                        </CardContent>
                    </Card>
                ) : (
                    Array.from(configsByRoom.entries()).map(([roomId, roomConfigs]) => (
                        <Card key={roomId}>
                            <CardHeader>
                                <CardTitle className="text-base">{getRoomName(roomId)}</CardTitle>
                                <CardDescription>
                                    {roomConfigs.length} ministr{roomConfigs.length === 1 ? "y" : "ies"} configured
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Ministry</TableHead>
                                            <TableHead>Items</TableHead>
                                            <TableHead>Required</TableHead>
                                            <TableHead className="w-[80px] text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {roomConfigs.map((config) => {
                                            const canModify =
                                                canManageVenueAssistance ||
                                                myMinistryIds.includes(config.ministryId);

                                            return (
                                                <TableRow key={config.id}>
                                                    <TableCell className="font-medium">
                                                        {getMinistryName(config.ministryId)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {config.items.map((item) => (
                                                                <Badge key={item.id} variant="secondary">
                                                                    {item.name}
                                                                    {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {config.items.filter((i) => i.isRequired).length} /{" "}
                                                        {config.items.length}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {canModify ? (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem
                                                                        onSelect={() => setTimeout(() => openEdit(config), 100)}
                                                                    >
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onSelect={() => setTimeout(() => setConfigToDelete(config), 100)}
                                                                        className="text-destructive"
                                                                    >
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">No access</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Create / Edit Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-lg overflow-y-auto">
                    {workerProfile && (
                        <AssistanceConfigForm
                            existingConfig={
                                editingConfig
                                    ? {
                                          id: editingConfig.id,
                                          roomId: editingConfig.roomId,
                                          ministryId: editingConfig.ministryId,
                                          items: editingConfig.items.map((i) => ({
                                              id: i.id,
                                              name: i.name,
                                              description: i.description ?? "",
                                              quantity: i.quantity,
                                              isRequired: i.isRequired,
                                          })),
                                      }
                                    : null
                            }
                            rooms={visibleRooms.map((r) => ({
                                id: r.id,
                                name: r.name,
                                area: r.area
                                    ? {
                                          name: r.area.name,
                                          branch: r.area.branch ?? undefined,
                                      }
                                    : null,
                            }))}
                            ministries={visibleMinistries}
                            actorId={workerProfile.id}
                            onSuccess={handleSheetSuccess}
                            onClose={() => setIsSheetOpen(false)}
                        />
                    )}
                </SheetContent>
            </Sheet>

            {/* Delete confirmation */}
            <AlertDialog open={!!configToDelete} onOpenChange={(open) => !open && setConfigToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the{" "}
                            <strong>{configToDelete ? getMinistryName(configToDelete.ministryId) : ""}</strong>{" "}
                            configuration for{" "}
                            <strong>{configToDelete ? getRoomName(configToDelete.roomId) : ""}</strong>?
                            This will not affect existing assistance requests already generated from it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
