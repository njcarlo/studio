"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Calendar, Input, Popover, PopoverContent, PopoverTrigger } from "@studio/ui";
import { LoaderCircle, PlusCircle, Search, Trash2, X } from "lucide-react";
import { upsertAssignment, deleteAssignment, getEligibleWorkers } from "@/actions/schedule";
import { useToast } from "@/hooks/use-toast";

type Assignment = {
    id: string;
    scheduleId: string;
    ministryId: string;
    roleName: string;
    workerId: string | null;
    workerName: string | null;
    slotType: string | null;
    order: number;
};

type Schedule = {
    id: string;
    title: string;
    date: string | Date;
    assignments: Assignment[];
};

type Ministry = { id: string; name: string };

type EligibleWorker = { id: string; firstName: string; lastName: string; workerId: string | null };

function CellPicker({
    ministryId,
    assignment,
    onAssigned,
}: {
    ministryId: string;
    assignment: Assignment;
    onAssigned: (workerId: string | null, workerName: string | null) => void;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<EligibleWorker[]>([]);
    const [loading, setLoading] = useState(false);

    const search = async (q: string) => {
        setQuery(q);
        setLoading(true);
        try {
            const workers = await getEligibleWorkers({ ministryId, query: q, limit: 20 });
            setResults(workers as any);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) search(""); }}>
            <PopoverTrigger asChild>
                <button className="w-full min-w-[110px] rounded px-2 py-1.5 text-center hover:bg-blue-50 transition">
                    {assignment.workerName || <span className="text-gray-400">— assign —</span>}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2">
                <div className="relative mb-2">
                    <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input
                        value={query}
                        onChange={(e) => search(e.target.value)}
                        placeholder="Search worker..."
                        className="pl-7 h-8 text-sm"
                        autoFocus
                    />
                </div>
                {loading ? (
                    <div className="flex justify-center py-3"><LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                ) : (
                    <div className="max-h-56 overflow-y-auto space-y-0.5">
                        {assignment.workerId && (
                            <button
                                onClick={() => { onAssigned(null, null); setOpen(false); }}
                                className="w-full text-left px-2 py-1.5 text-sm rounded text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                            >
                                <X className="h-3.5 w-3.5" /> Clear assignment
                            </button>
                        )}
                        {results.length === 0 && !loading && (
                            <div className="px-2 py-3 text-sm text-gray-400 italic">No workers found</div>
                        )}
                        {results.map((w) => (
                            <button
                                key={w.id}
                                onClick={() => { onAssigned(w.id, `${w.firstName} ${w.lastName}`); setOpen(false); }}
                                className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-blue-50"
                            >
                                {w.firstName} {w.lastName}
                            </button>
                        ))}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

function DatePickerPopover({
    trigger,
    selected,
    onSelect,
}: {
    trigger: ReactNode;
    selected?: Date;
    onSelect: (date: Date) => void;
}) {
    const [open, setOpen] = useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={(date) => {
                        if (!date) return;
                        onSelect(date);
                        setOpen(false);
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}

export function MonthEditorMatrix({
    schedules,
    ministries,
    onAddDate,
    onRescheduleDate,
}: {
    schedules: Schedule[];
    ministries: Ministry[];
    onAddDate?: (date: Date) => void;
    onRescheduleDate?: (scheduleId: string, date: Date) => void;
}) {
    const { toast } = useToast();
    const qc = useQueryClient();
    const [, startTransition] = useTransition();
    const [addingRoleFor, setAddingRoleFor] = useState<string | null>(null);
    const [newRoleName, setNewRoleName] = useState("");
    const [addingSlotFor, setAddingSlotFor] = useState<string | null>(null);
    const [newSlotTypeName, setNewSlotTypeName] = useState("");
    const [busy, setBusy] = useState(false);

    const ministryName = (id: string) => ministries.find((m) => m.id === id)?.name || id;

    const sorted = useMemo(
        () => [...schedules].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        [schedules],
    );

    const dateColumns = useMemo(
        () => sorted.map((s) => ({ dateKey: format(new Date(s.date), "yyyy-MM-dd"), scheduleId: s.id })),
        [sorted],
    );

    const ministrySections = useMemo(() => {
        const byMinistry = new Map<string, Assignment[]>();
        for (const schedule of sorted) {
            for (const a of schedule.assignments) {
                const list = byMinistry.get(a.ministryId) ?? [];
                list.push(a);
                byMinistry.set(a.ministryId, list);
            }
        }

        return Array.from(byMinistry.entries())
            .map(([ministryId, rows]) => {
                const dateKeyByScheduleId = new Map(dateColumns.map((d) => [d.scheduleId, d.dateKey]));
                const slotsByDate = new Map<string, string[]>();
                for (const { dateKey } of dateColumns) {
                    const slotTypes = Array.from(new Set(
                        rows.filter((r) => dateKeyByScheduleId.get(r.scheduleId) === dateKey).map((r) => r.slotType || "Standard"),
                    ));
                    if (slotTypes.length) slotsByDate.set(dateKey, slotTypes);
                }
                const roleNames = Array.from(new Set(rows.map((r) => r.roleName)));
                return { ministryId, name: ministryName(ministryId), rows, slotsByDate, roleNames };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [sorted, dateColumns]);

    const findAssignment = (section: typeof ministrySections[number], roleName: string, scheduleId: string, slotType: string) =>
        section.rows.find((r) => r.roleName === roleName && r.scheduleId === scheduleId && (r.slotType || "Standard") === slotType);

    const handleAssign = (assignment: Assignment, workerId: string | null, workerName: string | null) => {
        startTransition(async () => {
            const res: any = await upsertAssignment({
                id: assignment.id,
                scheduleId: assignment.scheduleId,
                ministryId: assignment.ministryId,
                roleName: assignment.roleName,
                workerId,
                workerName,
                order: assignment.order,
                slotType: assignment.slotType || undefined,
            });
            if (!res?.success) {
                toast({ title: "Failed to update", description: res?.error, variant: "destructive" });
                return;
            }
            toast({ title: workerId ? "Assigned" : "Cleared" });
            qc.invalidateQueries({ queryKey: ["service-schedules"] });
        });
    };

    const handleRemoveRole = (section: typeof ministrySections[number], roleName: string) => {
        const ids = section.rows.filter((r) => r.roleName === roleName).map((r) => r.id);
        if (!confirm(`Remove "${roleName}" from all ${ids.length} date(s) this month?`)) return;
        startTransition(async () => {
            const results: any[] = await Promise.all(ids.map((id) => deleteAssignment(id)));
            const failed = results.find((r) => !r?.success);
            if (failed) {
                toast({ title: "Failed to remove role", description: failed.error, variant: "destructive" });
                return;
            }
            toast({ title: "Role removed" });
            qc.invalidateQueries({ queryKey: ["service-schedules"] });
        });
    };

    const handleAddRole = async (ministryId: string) => {
        if (!newRoleName.trim()) return;
        setBusy(true);
        try {
            const nextOrder = Math.max(0, ...sorted.map((s) => s.assignments.filter((a) => a.ministryId === ministryId).length)) + 1;
            const results: any[] = await Promise.all(
                sorted.map((s) =>
                    upsertAssignment({
                        scheduleId: s.id,
                        ministryId,
                        roleName: newRoleName.trim(),
                        order: nextOrder,
                        slotType: "Standard",
                    }),
                ),
            );
            const failed = results.find((r) => !r?.success);
            if (failed) {
                toast({ title: "Failed to add role", description: failed.error, variant: "destructive" });
                return;
            }
            toast({ title: `Added "${newRoleName.trim()}" across ${sorted.length} date(s)` });
            setNewRoleName("");
            setAddingRoleFor(null);
            qc.invalidateQueries({ queryKey: ["service-schedules"] });
        } finally {
            setBusy(false);
        }
    };

    const handleAddSlot = async (ministryId: string) => {
        const slotType = newSlotTypeName.trim();
        if (!slotType) return;
        setBusy(true);
        try {
            const section = ministrySections.find((s) => s.ministryId === ministryId);
            if (!section) return;
            const tasks = section.roleNames.flatMap((roleName) => {
                const order = section.rows.find((r) => r.roleName === roleName)?.order ?? 0;
                return sorted.map((s) =>
                    upsertAssignment({
                        scheduleId: s.id,
                        ministryId,
                        roleName,
                        order,
                        slotType,
                    }),
                );
            });
            const results: any[] = await Promise.all(tasks);
            const failed = results.find((r) => !r?.success);
            if (failed) {
                toast({ title: "Failed to add slot", description: failed.error, variant: "destructive" });
                return;
            }
            toast({ title: `Added "${slotType}" slot across ${sorted.length} date(s)` });
            setNewSlotTypeName("");
            setAddingSlotFor(null);
            qc.invalidateQueries({ queryKey: ["service-schedules"] });
        } finally {
            setBusy(false);
        }
    };

    if (sorted.length === 0) {
        return <div className="bg-white rounded-xl shadow-md p-8 text-center text-muted-foreground">No schedules exist for this month yet.</div>;
    }

    return (
        <div className="space-y-6">
            {ministrySections.map((section) => (
                <div key={section.ministryId} className="overflow-x-auto rounded-lg border shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr>
                                <th
                                    colSpan={2 + dateColumns.reduce((n, dc) => n + (section.slotsByDate.get(dc.dateKey)?.length ?? 0), 0)}
                                    className="bg-blue-600 px-3 py-2 text-left font-semibold text-white"
                                >
                                    {section.name}
                                </th>
                            </tr>
                            <tr className="bg-blue-50">
                                <th className="px-3 py-2 text-left font-medium text-gray-700 border-r whitespace-nowrap">Role</th>
                                {dateColumns.map(({ dateKey, scheduleId }) => {
                                    const slotTypes = section.slotsByDate.get(dateKey) ?? [];
                                    if (!slotTypes.length) return null;
                                    const dateObj = new Date(dateKey);
                                    return (
                                        <th key={dateKey} colSpan={slotTypes.length} className="px-3 py-2 text-center font-medium text-gray-700 border-l whitespace-nowrap">
                                            <DatePickerPopover
                                                selected={dateObj}
                                                onSelect={(date) => onRescheduleDate?.(scheduleId, date)}
                                                trigger={
                                                    <button className="rounded px-1.5 py-0.5 hover:bg-blue-100 transition" title="Click to change date">
                                                        {format(dateObj, "MMM d")}
                                                    </button>
                                                }
                                            />
                                        </th>
                                    );
                                })}
                                <th rowSpan={2} className="border-l px-2 align-middle bg-blue-50">
                                    <DatePickerPopover
                                        onSelect={(date) => onAddDate?.(date)}
                                        trigger={
                                            <button title="Add date" className="flex items-center justify-center rounded-full p-1.5 hover:bg-blue-100 transition">
                                                <PlusCircle className="h-4 w-4 text-blue-600" />
                                            </button>
                                        }
                                    />
                                </th>
                            </tr>
                            <tr className="bg-blue-50/60">
                                <th className="border-r" />
                                {dateColumns.flatMap(({ dateKey }) => {
                                    const slotTypes = section.slotsByDate.get(dateKey) ?? [];
                                    return slotTypes.map((slotType) => (
                                        <th key={`${dateKey}-${slotType}`} className="px-3 py-1.5 text-center text-xs font-medium text-gray-500 border-l">
                                            {slotType}
                                        </th>
                                    ));
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {section.roleNames.map((roleName, i) => (
                                <tr key={roleName} className={i % 2 ? "bg-white" : "bg-gray-50"}>
                                    <td className="px-3 py-1.5 font-medium text-gray-800 border-r border-t">
                                        <div className="flex items-center justify-between gap-1">
                                            {roleName}
                                            <button onClick={() => handleRemoveRole(section, roleName)} title="Remove role">
                                                <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-600" />
                                            </button>
                                        </div>
                                    </td>
                                    {dateColumns.flatMap(({ dateKey, scheduleId }) => {
                                        const slotTypes = section.slotsByDate.get(dateKey) ?? [];
                                        return slotTypes.map((slotType) => {
                                            const assignment = findAssignment(section, roleName, scheduleId, slotType);
                                            return (
                                                <td key={`${dateKey}-${slotType}`} className="p-0 text-center border-l border-t">
                                                    {assignment ? (
                                                        <CellPicker
                                                            ministryId={section.ministryId}
                                                            assignment={assignment}
                                                            onAssigned={(workerId, workerName) => handleAssign(assignment, workerId, workerName)}
                                                        />
                                                    ) : (
                                                        <span className="text-gray-300 text-xs">assign worker</span>
                                                    )}
                                                </td>
                                            );
                                        });
                                    })}
                                    <td className="border-l border-t" />
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="border-t bg-gray-50 px-3 py-2 flex flex-wrap items-center gap-2">
                        {addingRoleFor === section.ministryId ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    value={newRoleName}
                                    onChange={(e) => setNewRoleName(e.target.value)}
                                    placeholder="New role name"
                                    className="h-8 max-w-[220px] text-sm"
                                    autoFocus
                                    onKeyDown={(e) => e.key === "Enter" && handleAddRole(section.ministryId)}
                                />
                                <Button size="sm" disabled={busy} onClick={() => handleAddRole(section.ministryId)}>
                                    {busy && <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Add
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setAddingRoleFor(null); setNewRoleName(""); }}>Cancel</Button>
                            </div>
                        ) : (
                            <Button size="sm" variant="outline" onClick={() => setAddingRoleFor(section.ministryId)}>
                                <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add role (applies to all {sorted.length} dates)
                            </Button>
                        )}

                        {addingSlotFor === section.ministryId ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    value={newSlotTypeName}
                                    onChange={(e) => setNewSlotTypeName(e.target.value)}
                                    placeholder="New slot name (e.g. Late)"
                                    className="h-8 max-w-[220px] text-sm"
                                    autoFocus
                                    onKeyDown={(e) => e.key === "Enter" && handleAddSlot(section.ministryId)}
                                />
                                <Button size="sm" disabled={busy} onClick={() => handleAddSlot(section.ministryId)}>
                                    {busy && <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Add
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setAddingSlotFor(null); setNewSlotTypeName(""); }}>Cancel</Button>
                            </div>
                        ) : (
                            <Button size="sm" variant="outline" onClick={() => setAddingSlotFor(section.ministryId)}>
                                <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add slot (applies to all roles & dates)
                            </Button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
