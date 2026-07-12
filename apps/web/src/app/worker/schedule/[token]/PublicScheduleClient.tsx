"use client";

import { useState, useMemo, useTransition } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Search,
    Calendar,
    Download,
    Printer,
    CheckCircle2,
    Clock,
    XCircle,
    ChevronDown,
    ChevronLeft,
    MapPin,
    Users,
    Layers,
    Info,
    RefreshCw
} from "lucide-react";
import {
    getTenantConfig,
    tenantDisplayName,
    tenantFileSlug,
    tenantInitials,
} from "@studio/core-engine/tenant";

interface Assignment {
    id: string;
    scheduleId: string;
    ministryId: string;
    roleName: string;
    workerId: string | null;
    workerName: string | null;
    notes: string | null;
    rehearsalDate: string | Date | null;
    rehearsalTime: string | null;
    acknowledgedAt: string | Date | null;
    attendanceStatus: string;
}

interface Schedule {
    id: string;
    title: string;
    date: string | Date;
    notes: string | null;
    status: string;
    isPublic: boolean;
    publicToken: string | null;
    updatedAt: string | Date;
    assignments: Assignment[];
}

interface PublicScheduleClientProps {
    schedule: Schedule;
    ministries: { id: string; name: string }[];
    publicSchedules: {
        id: string;
        title: string;
        date: string | Date;
        publicToken: string | null;
        status: string;
    }[];
}

export default function PublicScheduleClient({
    schedule,
    ministries,
    publicSchedules
}: PublicScheduleClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const tenant = getTenantConfig();
    const brand = tenantDisplayName(tenant);
    const brandUpper = brand.toUpperCase();
    const brandInitials = tenantInitials(tenant);
    const fileSlug = tenantFileSlug(tenant);

    // Search and Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMinistry, setSelectedMinistry] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [showScheduleSelector, setShowScheduleSelector] = useState(false);

    const ministryMap = useMemo(() => {
        return Object.fromEntries(ministries.map(m => [m.id, m.name]));
    }, [ministries]);

    // Format display names
    const getMinistryName = (id: string) => {
        const name = ministryMap[id] || id;
        return name.replace(/^[WORDA]-/i, '');
    };

    // Filter assignments based on search and selected categories
    const filteredAssignments = useMemo(() => {
        return schedule.assignments.filter(a => {
            // Search filter
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch = !query || 
                (a.workerName || "").toLowerCase().includes(query) ||
                (a.workerId || "").toLowerCase().includes(query) ||
                (a.roleName || "").toLowerCase().includes(query) ||
                getMinistryName(a.ministryId).toLowerCase().includes(query);

            // Ministry filter
            const matchesMinistry = selectedMinistry === "all" || a.ministryId === selectedMinistry;

            // Status filter
            const status = a.attendanceStatus || "Pending";
            const matchesStatus = selectedStatus === "all" || status.toLowerCase() === selectedStatus.toLowerCase();

            return matchesSearch && matchesMinistry && matchesStatus;
        });
    }, [schedule.assignments, searchQuery, selectedMinistry, selectedStatus]);

    // Group assignments by Ministry
    const assignmentsByMinistry = useMemo(() => {
        const grouped: Record<string, Assignment[]> = {};
        for (const a of filteredAssignments) {
            if (!grouped[a.ministryId]) {
                grouped[a.ministryId] = [];
            }
            grouped[a.ministryId].push(a);
        }
        
        // Sort ministries by name
        return Object.entries(grouped).sort(([idA], [idB]) => 
            getMinistryName(idA).localeCompare(getMinistryName(idB))
        );
    }, [filteredAssignments]);

    const filledCount = useMemo(() => {
        return schedule.assignments.filter(a => a.workerId).length;
    }, [schedule.assignments]);

    const totalCount = schedule.assignments.length;
    const fillPercentage = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

    // Handle Schedule Selection
    const handleScheduleChange = (token: string) => {
        setShowScheduleSelector(false);
        startTransition(() => {
            router.push(`/worker/schedule/${token}`);
        });
    };

    // CSV Download Helpers
    const convertToCSV = (data: any[], headers: string[]) => {
        const csvRows = [];
        csvRows.push(headers.join(","));
        
        for (const row of data) {
            const values = row.map((val: any) => {
                const escaped = ("" + (val || "")).replace(/"/g, '\\"');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(","));
        }
        
        return csvRows.join("\n");
    };

    const triggerDownload = (csvContent: string, fileName: string) => {
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 1. Download Whole Schedule
    const downloadWholeSchedule = () => {
        const headers = ["Ministry", "Role", "Worker Name", "Worker ID", "Status", "Rehearsal Date", "Rehearsal Time", "Notes"];
        const data = schedule.assignments.map(a => [
            getMinistryName(a.ministryId),
            a.roleName,
            a.workerName || "Unassigned",
            a.workerId || "N/A",
            a.attendanceStatus || "Pending",
            a.rehearsalDate ? format(new Date(a.rehearsalDate), "yyyy-MM-dd") : "",
            a.rehearsalTime || "",
            a.notes || ""
        ]);
        
        const dateStr = format(new Date(schedule.date), "yyyy-MM-dd");
        const csv = convertToCSV(data, headers);
        triggerDownload(csv, `${fileSlug}_Schedule_${dateStr}_Whole.csv`);
        setShowDownloadMenu(false);
    };

    // 2. Download Ministry Schedule
    const downloadByMinistry = (ministryId: string, ministryName: string) => {
        const headers = ["Role", "Worker Name", "Worker ID", "Status", "Rehearsal Date", "Rehearsal Time", "Notes"];
        const ministryAssignments = schedule.assignments.filter(a => a.ministryId === ministryId);
        const data = ministryAssignments.map(a => [
            a.roleName,
            a.workerName || "Unassigned",
            a.workerId || "N/A",
            a.attendanceStatus || "Pending",
            a.rehearsalDate ? format(new Date(a.rehearsalDate), "yyyy-MM-dd") : "",
            a.rehearsalTime || "",
            a.notes || ""
        ]);
        
        const dateStr = format(new Date(schedule.date), "yyyy-MM-dd");
        const formattedMinistryName = ministryName.replace(/\s+/g, "_");
        const csv = convertToCSV(data, headers);
        triggerDownload(csv, `${fileSlug}_Schedule_${dateStr}_${formattedMinistryName}.csv`);
        setShowDownloadMenu(false);
    };

    // 3. Download Slots Flat List
    const downloadSlots = () => {
        const headers = ["Slot/Role", "Ministry", "Assigned Worker", "Status"];
        const data = schedule.assignments.map(a => [
            a.roleName,
            getMinistryName(a.ministryId),
            a.workerName || "Unassigned",
            a.attendanceStatus || "Pending"
        ]);
        
        const dateStr = format(new Date(schedule.date), "yyyy-MM-dd");
        const csv = convertToCSV(data, headers);
        triggerDownload(csv, `${fileSlug}_Schedule_${dateStr}_Slots.csv`);
        setShowDownloadMenu(false);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-blue-50 text-slate-900 pb-16 font-sans">
            
            {/* Custom Styles for Print */}
            <style jsx global>{`
                @media print {
                    body {
                        background: white !important;
                        color: black !important;
                        font-size: 12px !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-full-width {
                        max-width: 100% !important;
                        width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    .print-grid {
                        display: grid !important;
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 15px !important;
                    }
                    .print-card {
                        page-break-inside: avoid !important;
                        border: 1px solid #ddd !important;
                        border-radius: 6px !important;
                        padding: 12px !important;
                        background: transparent !important;
                        box-shadow: none !important;
                    }
                }
            `}</style>

            {/* Header Banner */}
            <header className="bg-white/85 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200/80 shadow-sm no-print">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    
                    {/* Brand & Navigator */}
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                        <Link
                            href="/public/services"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-sm font-medium transition"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Portal
                        </Link>

                        <div className="flex items-center gap-2">
                            {tenant.logoUrl ? (
                                <img
                                    src={tenant.logoUrl}
                                    alt={brand}
                                    className="w-10 h-10 rounded-xl object-contain shadow-md"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold text-lg">
                                    {brandInitials}
                                </div>
                            )}
                            <div>
                                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block leading-none mb-0.5">{brandUpper}</span>
                                <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none">Service Schedule</h1>
                            </div>
                        </div>

                        {/* Navigation Dropdown Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setShowScheduleSelector(!showScheduleSelector)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-200/80 text-slate-700 font-medium text-sm rounded-lg transition"
                            >
                                <Calendar className="h-4 w-4 text-slate-500" />
                                <span>Browse Schedules</span>
                                <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform ${showScheduleSelector ? 'rotate-180' : ''}`} />
                            </button>

                            {showScheduleSelector && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowScheduleSelector(false)} />
                                    <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200/80 py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                                        <div className="px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-1">
                                            Select Published Service
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            {publicSchedules.length === 0 ? (
                                                <div className="px-4 py-3 text-sm text-slate-400 italic">No other public schedules</div>
                                            ) : (
                                                publicSchedules.map(ps => (
                                                    <button
                                                        key={ps.id}
                                                        onClick={() => handleScheduleChange(ps.publicToken!)}
                                                        disabled={ps.publicToken === schedule.publicToken}
                                                        className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center justify-between text-sm transition ${
                                                            ps.publicToken === schedule.publicToken 
                                                            ? 'bg-blue-50 text-blue-700 font-semibold' 
                                                            : 'text-slate-700'
                                                        }`}
                                                    >
                                                        <div className="truncate pr-2">
                                                            <div className="font-medium truncate">{ps.title}</div>
                                                            <div className="text-xs text-slate-400">
                                                                {format(new Date(ps.date), "MMM d, yyyy")}
                                                            </div>
                                                        </div>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
                                                            ps.status === "Published" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                                                        }`}>
                                                            {ps.status}
                                                        </span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {isPending && (
                            <span className="flex items-center gap-1.5 text-xs text-blue-600 font-medium bg-blue-50 px-2.5 py-1 rounded-full animate-pulse">
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                Loading...
                            </span>
                        )}
                        
                        {/* Download Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-xl text-slate-700 font-semibold text-sm shadow-sm transition active:scale-[0.98]"
                            >
                                <Download className="h-4 w-4 text-slate-500" />
                                <span>Export / Download</span>
                                <ChevronDown className="h-3 w-3 text-slate-500" />
                            </button>

                            {showDownloadMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowDownloadMenu(false)} />
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200/80 py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                                        <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-1">
                                            Export Formats (CSV)
                                        </div>
                                        <button
                                            onClick={downloadWholeSchedule}
                                            className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 flex items-center justify-between"
                                        >
                                            <span>Whole Day Schedule</span>
                                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">All Ministries</span>
                                        </button>
                                        <button
                                            onClick={downloadSlots}
                                            className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 flex items-center justify-between"
                                        >
                                            <span>Assignments Flat List</span>
                                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Slots</span>
                                        </button>
                                        {selectedMinistry !== "all" && (
                                            <button
                                                onClick={() => downloadByMinistry(selectedMinistry, getMinistryName(selectedMinistry))}
                                                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-blue-700 bg-blue-50/50 font-medium flex items-center justify-between"
                                            >
                                                <span className="truncate">Active Ministry only</span>
                                                <span className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded shrink-0">Filter</span>
                                            </button>
                                        )}
                                        {selectedMinistry === "all" && (
                                            <div className="px-4 py-2 text-xs text-slate-400 italic">
                                                Select a ministry below to export only its specific schedule.
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Print Button */}
                        <button
                            onClick={handlePrint}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-md shadow-blue-600/10 hover:shadow-blue-600/20 transition active:scale-[0.98]"
                        >
                            <Printer className="h-4 w-4" />
                            <span>Print / Save PDF</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Print Header (Only visible when printing) */}
            <div className="hidden print:block max-w-6xl mx-auto px-4 py-6 border-b-2 border-slate-800">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">{brandUpper}</span>
                        <h1 className="text-2xl font-bold text-slate-900 mt-1">{schedule.title}</h1>
                        <p className="text-slate-500 mt-1 font-medium">
                            {format(new Date(schedule.date), "EEEE, MMMM d, yyyy")}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-semibold text-slate-700">Official Service Schedule</div>
                        <div className="text-xs text-slate-400 mt-1">Generated: {format(new Date(), "PPpp")}</div>
                    </div>
                </div>
            </div>

            {/* Main Wrapper */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 print-full-width">
                
                {/* Stats & Title Card */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 mb-8 relative overflow-hidden print-full-width">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider mb-3 no-print">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                {schedule.status}
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">{schedule.title}</h2>
                            <p className="text-slate-500 mt-1.5 flex items-center gap-2 font-medium">
                                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                                {format(new Date(schedule.date), "EEEE, MMMM d, yyyy")}
                            </p>
                        </div>
                        
                        {/* Progress Bar & Status details */}
                        <div className="bg-slate-50 rounded-2xl p-4 md:w-80 border border-slate-100 flex flex-col justify-center">
                            <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1.5">
                                <span className="uppercase tracking-wider">Fill Rate</span>
                                <span className="text-slate-800 font-black">{filledCount} / {totalCount} Slots ({fillPercentage}%)</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div 
                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${fillPercentage}%` }}
                                />
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 font-medium italic">
                                Last updated: {format(new Date(schedule.updatedAt), "MMM d, h:mm a")}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Filter and Search controls */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 mb-8 flex flex-col md:flex-row items-center gap-4 no-print">
                    
                    {/* Live Search */}
                    <div className="relative w-full md:flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by worker name, worker ID, role, or ministry..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Ministry Dropdown Filter */}
                    <div className="w-full md:w-60">
                        <select
                            value={selectedMinistry}
                            onChange={(e) => setSelectedMinistry(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        >
                            <option value="all">All Ministries</option>
                            {ministries.map(m => (
                                <option key={m.id} value={m.id}>{getMinistryName(m.id)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Attendance Filter */}
                    <div className="w-full md:w-48">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        >
                            <option value="all">All Attendance</option>
                            <option value="confirmed">✅ Confirmed</option>
                            <option value="pending">⏳ Pending</option>
                            <option value="not attending">❌ Not Attending</option>
                        </select>
                    </div>
                </div>

                {/* Main Schedule Display Grid */}
                {assignmentsByMinistry.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center text-slate-500">
                        <Layers className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        <h3 className="font-bold text-slate-800 mb-1">No schedules match your filters</h3>
                        <p className="text-sm text-slate-400 max-w-sm mx-auto">
                            Try adjusting your search query, selecting another ministry, or clearing the attendance status filter.
                        </p>
                        <button
                            onClick={() => { setSearchQuery(""); setSelectedMinistry("all"); setSelectedStatus("all"); }}
                            className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-100 transition"
                        >
                            Reset All Filters
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8 print-grid">
                        {assignmentsByMinistry.map(([ministryId, assignments]) => {
                            
                            // Group by role
                            const byRole: Record<string, Assignment[]> = {};
                            for (const a of assignments) {
                                if (!byRole[a.roleName]) {
                                    byRole[a.roleName] = [];
                                }
                                byRole[a.roleName].push(a);
                            }

                            return (
                                <section 
                                    key={ministryId} 
                                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden print-card transition hover:shadow-md hover:border-slate-300/80"
                                >
                                    {/* Ministry Card Header */}
                                    <div className="bg-slate-50 border-b border-slate-100 px-6 py-4.5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-6 rounded bg-blue-600 shrink-0" />
                                            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm">
                                                {getMinistryName(ministryId)}
                                            </h3>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-400 no-print">
                                            {assignments.length} slot{assignments.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    {/* Ministry Slots List */}
                                    <div className="divide-y divide-slate-100">
                                        {Object.entries(byRole).map(([roleName, slots]) => (
                                            <div key={roleName} className="px-6 py-4.5">
                                                
                                                {/* Role Label */}
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3.5">
                                                    {roleName}
                                                </div>

                                                {/* Assigned Worker Rows */}
                                                <div className="space-y-3">
                                                    {slots.map((slot: Assignment) => {
                                                        const status = slot.attendanceStatus || "Pending";
                                                        
                                                        // Color mappings for modern UI
                                                        const statusColors = {
                                                            Confirmed: {
                                                                bg: "bg-green-50/80",
                                                                text: "text-green-700",
                                                                border: "border-green-100",
                                                                dot: "bg-green-500",
                                                                icon: <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                                            },
                                                            Pending: {
                                                                bg: "bg-amber-50/80",
                                                                text: "text-amber-700",
                                                                border: "border-amber-100",
                                                                dot: "bg-amber-400",
                                                                icon: <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                                                            },
                                                            "Not Attending": {
                                                                bg: "bg-red-50/80",
                                                                text: "text-red-700",
                                                                border: "border-red-100",
                                                                dot: "bg-red-500",
                                                                icon: <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                                                            }
                                                        }[status as "Confirmed" | "Pending" | "Not Attending"] || {
                                                            bg: "bg-slate-50",
                                                            text: "text-slate-700",
                                                            border: "border-slate-100",
                                                            dot: "bg-slate-400",
                                                            icon: <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                                                        };

                                                        return (
                                                            <div 
                                                                key={slot.id} 
                                                                className={`rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                                                    slot.workerName 
                                                                    ? `${statusColors.bg} ${statusColors.border}` 
                                                                    : 'bg-slate-50/40 border-slate-100 border-dashed'
                                                                }`}
                                                            >
                                                                {/* Worker Info */}
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    <div className={`w-2 h-2 rounded-full shrink-0 ${slot.workerName ? statusColors.dot : 'bg-slate-300'}`} />
                                                                    {slot.workerName ? (
                                                                        <div className="truncate">
                                                                            <span className="font-semibold text-slate-800 text-sm leading-snug">
                                                                                {slot.workerName}
                                                                            </span>
                                                                            {slot.workerId && (
                                                                                <span className="text-[10px] text-slate-400 font-mono block leading-none mt-0.5">
                                                                                    ID: {slot.workerId}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-sm text-slate-400 italic font-medium">
                                                                            Unassigned
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Status & Rehearsal Info */}
                                                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                                    {slot.rehearsalDate && (
                                                                        <span className="text-[10px] font-bold text-slate-500 bg-white/70 border border-slate-200 px-2 py-1 rounded-lg flex items-center gap-1">
                                                                            <Clock className="h-3 w-3 text-slate-400" />
                                                                            <span>Rehearsal: {format(new Date(slot.rehearsalDate), "MMM d")} {slot.rehearsalTime ? `@ ${slot.rehearsalTime}` : ""}</span>
                                                                        </span>
                                                                    )}

                                                                    {slot.workerName && (
                                                                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${statusColors.text} bg-white shadow-sm border border-slate-100/50`}>
                                                                            {statusColors.icon}
                                                                            <span>{status}</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}

                {/* Additional Notes Section */}
                {schedule.notes && (
                    <div className="bg-yellow-50/60 border border-yellow-100 rounded-3xl p-6 sm:p-8 mt-8 flex gap-4 items-start print-full-width">
                        <Info className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-yellow-900 text-sm uppercase tracking-wider mb-1">Service Notes</h4>
                            <p className="text-sm text-yellow-800 leading-relaxed font-medium">{schedule.notes}</p>
                        </div>
                    </div>
                )}

                {/* Footer Brand Info */}
                <footer className="mt-16 text-center border-t border-slate-200/80 pt-8">
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        This schedule is shared publicly by {brand}. Last updated on {format(new Date(schedule.updatedAt), "PPpp")}.
                    </p>
                    <p className="text-[10px] text-slate-300 mt-1 font-semibold tracking-wider uppercase no-print">
                        © {new Date().getFullYear()} {tenant.brandName}. All rights reserved.
                    </p>
                </footer>
            </main>
        </div>
    );
}
