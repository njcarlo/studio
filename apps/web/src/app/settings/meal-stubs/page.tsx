"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@studio/ui";
import { Input } from "@studio/ui";
import { Button } from "@studio/ui";
import { Badge } from "@studio/ui";
import { Checkbox } from "@studio/ui";
import { LoaderCircle, Utensils, Save, Search, ChevronDown, ChevronRight, Settings2, ShieldCheck } from "lucide-react";
import type { Ministry, Department, MealStubSettings } from "@studio/types";
import { useUserRole } from "@/hooks/use-user-role";
import { useAuditLog } from "@/hooks/use-audit-log";
import { useToast } from "@/hooks/use-toast";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@studio/ui";
import { useMinistries } from "@/hooks/use-ministries";
import { useDepartments } from "@/hooks/use-departments";
import { useSettings } from "@/hooks/use-settings";

const DEPARTMENTS: Department[] = ['Worship', 'Outreach', 'Relationship', 'Discipleship', 'Administration'];
const WEEKDAYS = [
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
];

export default function MealStubAllocationPage() {
    const { isSuperAdmin, canManageMinistries, isLoading: isRoleLoading } = useUserRole();
    const { toast } = useToast();
    const { logAction } = useAuditLog();

    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState<string | null>(null);
    const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set(DEPARTMENTS));

    // Local state for edits
    const [ministryEdits, setMinistryEdits] = useState<Record<string, number>>({});
    const [deptEdits, setDeptEdits] = useState<Record<string, number>>({});
    const [tempDisabledDays, setTempDisabledDays] = useState<number[]>([]);

    const { ministries, isLoading: ministriesLoading, updateMinistry } = useMinistries();
    const { departments, isLoading: departmentsLoading, upsertDepartment } = useDepartments();
    const { settings: globalSettings, isLoading: settingsLoading, updateSettings } = useSettings('mealstubs');

    useEffect(() => {
        if ((globalSettings as any)?.disabledVolunteerDays) {
            setTempDisabledDays((globalSettings as any).disabledVolunteerDays);
        }
    }, [globalSettings]);

    // --- Department Pool Helpers ---
    const getDeptInfo = (dept: string) => (departments as any[])?.find(d => d.id === dept);

    const getDeptAllocated = (dept: string) => {
        const deptMinistries = (ministries as any[])?.filter(m => m.department === dept) || [];
        return deptMinistries.reduce((sum, m) => {
            const edit = ministryEdits[m.id];
            return sum + (edit !== undefined ? edit : (m.mealStubWeeklyLimit || 0));
        }, 0);
    };

    const getDeptPool = (dept: string) => {
        const info = getDeptInfo(dept);
        const edit = deptEdits[dept];
        return edit !== undefined ? edit : (info?.mealStubWeekdayAllocation || 0);
    };

    // --- Edit Handlers ---
    const handleDeptEdit = (dept: string, value: string) => {
        const num = parseInt(value) || 0;
        if (num < 0) return;
        setDeptEdits(prev => ({ ...prev, [dept]: num }));
    };

    const handleMinistryEdit = (ministryId: string, value: string) => {
        const num = parseInt(value) || 0;
        if (num < 0) return;
        setMinistryEdits(prev => ({ ...prev, [ministryId]: num }));
    };

    const toggleDisabledDay = (day: number) => {
        setTempDisabledDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    // --- Save Actions ---
    const handleSaveSettings = async () => {
        setSaving('settings');
        try {
            await updateSettings({
                disabledVolunteerDays: tempDisabledDays
            });
            toast({ title: "Global Settings Saved", description: "Volunteer day restrictions updated." });
            await logAction('Updated Meal Stub Settings', 'Settings', `Disabled volunteer days: ${tempDisabledDays.join(', ')}`);
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Save Failed" });
        } finally {
            setSaving(null);
        }
    };

    const handleSaveDeptPool = async (dept: string) => {
        const value = deptEdits[dept];
        if (value === undefined) return;

        setSaving(`dept-${dept}`);
        try {
            await upsertDepartment({
                id: dept,
                data: {
                    mealStubWeekdayAllocation: value,
                }
            });

            toast({ title: "Department Pool Updated", description: `${dept} allocation saved.` });
            setDeptEdits(prev => {
                const next = { ...prev };
                delete next[dept];
                return next;
            });
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Save Failed" });
        } finally {
            setSaving(null);
        }
    };

    const handleSaveMinistry = async (ministry: Ministry) => {
        const value = ministryEdits[ministry.id];
        if (value === undefined) return;

        const deptTotal = getDeptPool(ministry.department);
        const currentAllocated = getDeptAllocated(ministry.department);

        if (currentAllocated > deptTotal) {
            toast({
                variant: "destructive",
                title: "Exceeds Department Pool",
                description: `Distribution for ${ministry.department} (${currentAllocated}) exceeds the pool of ${deptTotal}.`
            });
            return;
        }

        setSaving(ministry.id);
        try {
            await updateMinistry({
                id: ministry.id,
                data: {
                    mealStubWeeklyLimit: value
                }
            });
            await logAction('Updated Ministry Allocation', 'Settings', `Updated weekly limit for ${ministry.name}: ${value}`);
            toast({ title: "Ministry Allocation Saved" });
            setMinistryEdits(prev => {
                const next = { ...prev };
                delete next[ministry.id];
                return next;
            });
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Save Failed" });
        } finally {
            setSaving(null);
        }
    };

    const toggleDept = (dept: string) => {
        setExpandedDepts(prev => {
            const next = new Set(prev);
            if (next.has(dept)) next.delete(dept);
            else next.add(dept);
            return next;
        });
    };

    const isLoading = ministriesLoading || departmentsLoading || isRoleLoading || settingsLoading;

    if (isLoading) {
        return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
    }

    if (!isSuperAdmin && !canManageMinistries) {
        return (
            <AppLayout>
                <Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>Unauthorized access.</CardDescription></CardHeader></Card>
            </AppLayout>
        );
    }

    const hasSettingsChanges = JSON.stringify(tempDisabledDays.sort()) !== JSON.stringify(((globalSettings as any)?.disabledVolunteerDays || []).sort());

    return (
        <AppLayout>
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                    <Utensils className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-headline font-bold">Meal Stub Allocation</h1>
                </div>
                <p className="text-sm text-muted-foreground">Manage consolidated department pools and distribution to ministries.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3 mb-8">
                {/* Global Volunteer Settings */}
                <Card className="lg:col-span-1 border-amber-200">
                    <CardHeader className="pb-3 text-amber-900 bg-amber-50/50">
                        <div className="flex items-center gap-2">
                            <Settings2 className="h-4 w-4" />
                            <CardTitle className="text-sm">Volunteer Weekday Controls</CardTitle>
                        </div>
                        <CardDescription className="text-amber-700/70 text-[11px]">
                            Disable volunteer allocation for specific days (Mon-Sat).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {WEEKDAYS.map(day => (
                                <div key={day.value} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`day-${day.value}`}
                                        checked={tempDisabledDays.includes(day.value)}
                                        onCheckedChange={() => toggleDisabledDay(day.value)}
                                    />
                                    <label htmlFor={`day-${day.value}`} className="text-xs font-medium leading-none cursor-pointer">
                                        {day.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <Button
                            className="w-full h-8 text-xs bg-amber-600 hover:bg-amber-700"
                            disabled={!hasSettingsChanges || saving === 'settings'}
                            onClick={handleSaveSettings}
                        >
                            {saving === 'settings' && <LoaderCircle className="h-3 w-3 animate-spin mr-2" />}
                            Update Restrictions
                        </Button>
                    </CardContent>
                </Card>

                {/* Pool Overview / Help */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            <CardTitle className="text-sm">Allocation Rules</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                        <div className="space-y-4">
                            <p>Workers are limited to <span className="font-bold text-foreground">1 meal stub per day</span>. Assignments are managed through ministry distributions from the department's weekly pool.</p>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <p className="font-bold text-foreground">Weekly Pool Distribution</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Managed via "Weekly Limit" below.</li>
                                        <li>Each issued stub (any day) deducts from the pool.</li>
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <p className="font-bold text-foreground">Volunteer Restrictions</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Always limited to 1 per day.</li>
                                        <li>Controlled by the day-of-week checkboxes.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="relative mb-6 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search ministries..."
                    className="pl-9"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="space-y-6">
                {DEPARTMENTS.map(dept => {
                    const pool = getDeptPool(dept);
                    const allocated = getDeptAllocated(dept);
                    const isExpanded = expandedDepts.has(dept);
                    const hasDeptEdits = deptEdits[dept] !== undefined;

                    const pct = pool > 0 ? Math.round((allocated / pool) * 100) : 0;
                    const isOver = allocated > pool;
                    const remaining = pool - allocated;

                    const deptMinistries = ((ministries as any[])?.filter(m => m.department === dept) || [])
                        .filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()))
                        .sort((a, b) => a.name.localeCompare(b.name));

                    if (search && deptMinistries.length === 0) return null;

                    return (
                        <Card key={dept} className="overflow-hidden">
                            <Collapsible open={isExpanded} onOpenChange={() => toggleDept(dept)}>
                                <CollapsibleTrigger asChild>
                                    <div className="cursor-pointer hover:bg-muted/30 transition-colors py-4 px-6 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                            <div>
                                                <h3 className="text-base font-bold">{dept} Department</h3>
                                                <p className="text-xs text-muted-foreground">{deptMinistries.length} ministries</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={`font-mono px-3 py-1 ${isOver ? 'bg-destructive/10 text-destructive border-destructive/30' : 'bg-primary/5 text-primary border-primary/20'}`}>
                                            Weekly Pool: {allocated} / {pool}
                                        </Badge>
                                    </div>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <CardContent className="pt-0">
                                        <div className="bg-muted/40 border rounded-lg p-4 mb-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Department Weekly Pool</h4>
                                                <Button
                                                    size="sm" variant="outline"
                                                    disabled={!hasDeptEdits || saving === `dept-${dept}`}
                                                    onClick={() => handleSaveDeptPool(dept)}
                                                    className="h-7 text-xs"
                                                >
                                                    {saving === `dept-${dept}` ? <LoaderCircle className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                                                    Save Pool
                                                </Button>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-6 items-center">
                                                <div className="space-y-2">
                                                    <Input
                                                        type="number" min="0" value={pool}
                                                        onChange={e => handleDeptEdit(dept, e.target.value)}
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="h-2 w-full bg-background rounded-full overflow-hidden border">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${isOver ? 'bg-destructive' : 'bg-primary'}`}
                                                            style={{ width: `${Math.min(100, pct)}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between text-[10px]">
                                                        <span className="text-muted-foreground">Allocated: {allocated}</span>
                                                        <span className={isOver ? 'text-destructive font-bold' : 'text-muted-foreground'}>
                                                            {isOver ? `Over by ${Math.abs(remaining)}` : `${remaining} available`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-md border overflow-hidden">
                                            <Table>
                                                <TableHeader><TableRow className="bg-muted/30">
                                                    <TableHead className="text-xs">Ministry</TableHead>
                                                    <TableHead className="text-xs w-[130px]">Weekly Limit</TableHead>
                                                    <TableHead className="text-xs text-right w-[80px]"></TableHead>
                                                </TableRow></TableHeader>
                                                <TableBody>
                                                    {deptMinistries.map(m => {
                                                        const editVal = ministryEdits[m.id];
                                                        const current = editVal !== undefined ? editVal : (m.mealStubWeeklyLimit || 0);
                                                        const changed = editVal !== undefined;
                                                        return (
                                                            <TableRow key={m.id}>
                                                                <TableCell className="font-medium text-sm">{m.name}</TableCell>
                                                                <TableCell>
                                                                    <Input
                                                                        type="number" min="0" value={current}
                                                                        onChange={e => handleMinistryEdit(m.id, e.target.value)}
                                                                        className="w-24 h-8 text-sm"
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <Button size="sm" variant="ghost" disabled={!changed || saving === m.id} onClick={() => handleSaveMinistry(m)} className="h-8 w-8 p-0">
                                                                        {saving === m.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className={`h-4 w-4 ${changed ? 'text-primary' : 'text-muted-foreground'}`} />}
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                    <TableRow className="bg-muted/20 font-semibold italic">
                                                        <TableCell className="text-xs text-muted-foreground">Allocated to Ministries</TableCell>
                                                        <TableCell><span className={`text-sm ${isOver ? 'text-destructive' : ''}`}>{allocated}</span> / {pool}</TableCell>
                                                        <TableCell />
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </CollapsibleContent>
                            </Collapsible>
                        </Card>
                    );
                })}
            </div>
        </AppLayout>
    );
}
