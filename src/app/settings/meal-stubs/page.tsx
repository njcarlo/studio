"use client";

import React, { useState, useMemo } from "react";
import { collection, doc, updateDoc } from "firebase/firestore";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoaderCircle, Utensils, Save, Search, Settings2 } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import type { Ministry } from "@/lib/types";
import { useUserRole } from "@/hooks/use-user-role";
import { useAuditLog } from "@/hooks/use-audit-log";
import { useToast } from "@/hooks/use-toast";

export default function MealStubAllocationPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { isSuperAdmin, canManageMinistries, isLoading: isRoleLoading } = useUserRole();
    const { toast } = useToast();
    const { logAction } = useAuditLog();

    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState<string | null>(null);

    // Local state for edits before saving
    const [edits, setEdits] = useState<Record<string, { weekday?: number; sunday?: number }>>({});

    const ministriesRef = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, "ministries");
    }, [firestore, user]);
    const { data: ministries, isLoading: ministriesLoading } = useCollection<Ministry>(ministriesRef);

    const filteredMinistries = useMemo(() => {
        if (!ministries) return [];
        return ministries.filter(m =>
            m.name.toLowerCase().includes(search.toLowerCase()) ||
            m.department.toLowerCase().includes(search.toLowerCase())
        ).sort((a, b) => a.department.localeCompare(b.department) || a.name.localeCompare(b.name));
    }, [ministries, search]);

    const handleEdit = (ministryId: string, field: 'weekday' | 'sunday', value: string) => {
        const num = parseInt(value);
        if (isNaN(num) || num < 0) return;

        setEdits(prev => ({
            ...prev,
            [ministryId]: {
                ...prev[ministryId],
                [field]: num
            }
        }));
    };

    const handleSave = async (ministry: Ministry) => {
        const update = edits[ministry.id];
        if (!update) return;

        setSaving(ministry.id);
        try {
            const dataToSave: any = {};
            if (update.weekday !== undefined) dataToSave.mealStubWeekdayLimit = update.weekday;
            if (update.sunday !== undefined) dataToSave.mealStubSundayLimit = update.sunday;

            await updateDoc(doc(firestore, "ministries", ministry.id), dataToSave);
            await logAction('Updated Meal Stub Allocation', 'Settings', `Updated limits for ${ministry.name}: Weekday=${dataToSave.mealStubWeekdayLimit ?? ministry.mealStubWeekdayLimit}, Sunday=${dataToSave.mealStubSundayLimit ?? ministry.mealStubSundayLimit}`);

            toast({ title: "Allocation Updated", description: `Limits for ${ministry.name} have been saved.` });

            // Clear edits for this ministry
            const newEdits = { ...edits };
            delete newEdits[ministry.id];
            setEdits(newEdits);
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Save Failed", description: "Could not update ministry allocation." });
        } finally {
            setSaving(null);
        }
    };

    const isLoading = ministriesLoading || isRoleLoading;

    if (isLoading) {
        return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
    }

    if (!isSuperAdmin && !canManageMinistries) {
        return (
            <AppLayout>
                <Card>
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>You do not have permission to manage meal stub allocations.</CardDescription>
                    </CardHeader>
                </Card>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-headline font-bold">Meal Stub Allocation</h1>
                    <p className="text-sm text-muted-foreground">Configure weekly meal stub limits per ministry.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search ministries..."
                                className="pl-9"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ministry</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead className="w-[150px]">Weekday Limit</TableHead>
                                    <TableHead className="w-[150px]">Sunday Limit</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMinistries.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                            No ministries found.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {filteredMinistries.map(ministry => {
                                    const currentEdits = edits[ministry.id] || {};
                                    const weekdayVal = currentEdits.weekday ?? ministry.mealStubWeekdayLimit ?? 5;
                                    const sundayVal = currentEdits.sunday ?? ministry.mealStubSundayLimit ?? 2;
                                    const hasChanges = currentEdits.weekday !== undefined || currentEdits.sunday !== undefined;

                                    return (
                                        <TableRow key={ministry.id}>
                                            <TableCell className="font-medium">{ministry.name}</TableCell>
                                            <TableCell>{ministry.department}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="20"
                                                    value={weekdayVal}
                                                    onChange={e => handleEdit(ministry.id, 'weekday', e.target.value)}
                                                    className="w-20"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="20"
                                                    value={sundayVal}
                                                    onChange={e => handleEdit(ministry.id, 'sunday', e.target.value)}
                                                    className="w-20"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    disabled={!hasChanges || saving === ministry.id}
                                                    onClick={() => handleSave(ministry)}
                                                >
                                                    {saving === ministry.id ? (
                                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Save className="h-4 w-4 mr-2" />
                                                    )}
                                                    Save
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div className="mt-6">
                <Card className="bg-muted/30 border-dashed">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <Settings2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Default Allocations</p>
                                <p className="text-xs text-muted-foreground">
                                    If no limit is set for a ministry, the system defaults to:
                                </p>
                                <ul className="text-xs text-muted-foreground list-disc list-inside mt-2">
                                    <li>Weekday: 5 stubs per week</li>
                                    <li>Sunday: 2 stubs per week</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
