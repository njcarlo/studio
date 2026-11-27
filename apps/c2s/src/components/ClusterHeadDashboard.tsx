'use client';

import CustomSelect from '@/components/CustomSelect';
import ActionMenu, { ActionIcons } from '@/components/ActionMenu';
import { WorkerSinceValue } from '@/components/WorkerIdentityBits';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
    CH_COORDINATORS, CH_MENTORS, CH_POTENTIAL_MENTEES, CH_ACTIVE_MENTEES,
    CH_CLUSTER_GROUPS, CH_NOTIFICATIONS, INACTIVE_MENTEES,
    type C2SCoordinator, type ClusterMentor, type ClusterPotentialMentee, type Mentee,
} from '@/lib/data';
import { SharedDashboardTab, CHURCH_WIDE_DATA } from '@/components/DashboardSharedWidgets';
import DashboardWelcomeBanner from '@/components/DashboardWelcomeBanner';
import Image from 'next/image';
import Link from 'next/link';
import MenteeProfileModal from '@/components/MenteeProfileModal';
import DevotionalProgressModal from '@/components/DevotionalProgressModal';
import { SidebarCollapseButton, SidebarNavList, SidebarSettingsDropdown, SettingsPageView, useScrollToTop, type MySettingsSection, type SidebarNavEntry } from '@/components/SettingsModal';
import { SidebarBrandHeader, DashboardTopHeader } from '@/components/DashboardHeader';
import { exportToCsv } from '@/lib/export-csv';
import type { ReactNode } from 'react';
import {
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar,
    LineChart, Line, CartesianGrid, XAxis, YAxis, Legend,
} from 'recharts';

const TOOLTIP_STYLE = {
    borderRadius: '10px', border: 'none',
    boxShadow: '0 4px 16px rgba(0,0,0,0.10)', fontSize: '12px', padding: '8px 14px',
};

// ─── Color helpers ──────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#D97706', '#D97706', '#0284C7', '#e67700', '#D97706'];
function avatarColor(id: string) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ─── Status badge styles ─────────────────────────────────────────────────────
const CLUSTER_STATUS_STYLE: Record<string, string> = {
    'New': 'bg-[#1d4ed8] text-white',
    'Waiting for Assignment': 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]',
    'Assigned to Mentor': 'bg-[#D97706] text-white',
    'Interview Scheduled': 'bg-[#D97706] text-white',
    'Interview Completed': 'bg-[#0284C7] text-white',
    'Accepted': 'bg-[#166534] text-white',
};

// ─── Report data (used in dashboard/page.tsx for chart rendering) ────────────
export const CH_GROWTH_DATA = [
    { month: 'Feb', mentees: 3, mentors: 3 },
    { month: 'Mar', mentees: 4, mentors: 3 },
    { month: 'Apr', mentees: 4, mentors: 4 },
    { month: 'May', mentees: 5, mentors: 4 },
    { month: 'Jun', mentees: 5, mentors: 4 },
    { month: 'Jul', mentees: 6, mentors: 4 },
];
export const CH_MENTOR_REPORT_DATA = CH_MENTORS.map(m => ({ name: m.name.split(' ')[0], attendance: m.attendance, completion: m.completion }));
export const CH_COORD_REPORT_DATA = CH_COORDINATORS.map(c => ({ name: c.name.split(' ')[0], assigned: c.assignedPotential, pending: c.pendingAssignments }));
export const CH_BARANGAY_DATA = CH_CLUSTER_GROUPS.map(g => ({ name: g.barangay, members: g.members }));

export type CHReportSection = 'mentor' | 'coordinator' | 'barangay' | 'growth';

const CH_REPORT_NAV_ITEMS: { key: `reports_${CHReportSection}`; label: string; iconKind: 'stroke'; icon: string }[] = [
    { key: 'reports_mentor', label: 'Per Mentor', iconKind: 'stroke', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
    { key: 'reports_coordinator', label: 'Per Coordinator', iconKind: 'stroke', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75' },
    { key: 'reports_barangay', label: 'Per Barangay', iconKind: 'stroke', icon: 'M3 21h18 M5 21V7l7-4 7 4v14 M9 21v-6h6v6' },
    { key: 'reports_growth', label: 'Monthly Growth', iconKind: 'stroke', icon: 'M3 17l6-6 4 4 8-8 M17 7h4v4' },
];

// ─── NAV items ────────────────────────────────────────────────────────────────
const CH_NAV = [
    { key: 'dashboard', label: 'Dashboard', icon: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zm-2-4H10v-2h8v2zm-4 4H10v-2h4v2zm4-8H10V6h8v2z' },
    { key: 'notifications', label: 'Notifications', icon: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z' },
    { key: 'coordinators', label: 'C2S Coordinators', icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
    { key: 'mentors', label: 'Mentors', icon: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z' },
    { key: 'potential', label: 'Potential Mentees', icon: 'M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
    { key: 'mentees', label: 'Mentees', icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
    { key: 'reports', label: 'Reports', icon: 'M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

// Schedule Interview modal removed from Cluster Head — moved to CoordinatorDashboard

// ─── Coordinator Detail Panel ─────────────────────────────────────────────────
function CoordinatorPanel({ coord, onClose }: { coord: C2SCoordinator; onClose: () => void }) {
    return (
        <>
            <div className="fixed inset-0 z-[9999] bg-black/50" onClick={onClose} />
            <div className="fixed top-0 right-0 bottom-0 z-[10000] w-[440px] max-w-full bg-white shadow-2xl flex flex-col overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Coordinator Profile</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Activity Overview</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-black shrink-0" style={{ background: coord.color }}>
                            {coord.initials}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-base">{coord.name}</p>
                            <p className="text-xs text-gray-400">{coord.barangay} · <span className="font-semibold text-[#181F26] dark:text-[#E6EDF3] tabular-nums">{coord.workerId}</span></p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${coord.status === 'Active' ? 'bg-[#16a34a] text-white' : 'bg-gray-400 text-white'}`}>{coord.status}</span>
                        </div>
                    </div>
                    <section className="rounded-xl border border-gray-100 overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-2">Coordinator Details</p>
                        <div className="divide-y divide-gray-100">
                            <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                                <span className="text-xs text-gray-500">Worker ID</span>
                                <span className="text-xs font-bold text-[#181F26] dark:text-[#E6EDF3] tabular-nums">{coord.workerId}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                                <span className="text-xs text-gray-500">Worker Since (ID Issued)</span>
                                <WorkerSinceValue createdAt={coord.workerIdCreatedAt} className="text-xs justify-end" />
                            </div>
                            {[{ label: 'Phone', value: coord.phone }, { label: 'Email', value: coord.email }].map(r => (
                                <div key={r.label} className="flex items-center justify-between px-4 py-2.5">
                                    <span className="text-xs text-gray-500">{r.label}</span>
                                    <span className="text-xs font-medium text-gray-800">{r.value}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {[
                            { label: 'Assigned Potential', value: coord.assignedPotential, color: '#D97706' },
                            { label: 'Pending', value: coord.pendingAssignments, color: '#e67700' },
                            { label: 'Avg Days', value: coord.avgAssignmentDays, color: '#0284C7' },
                        ].map(s => (
                            <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-2 py-2.5 sm:p-3 text-center">
                                <p className="text-2xl font-black leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
                                <p className="text-[0.75rem] text-gray-400 whitespace-nowrap">{s.label}</p>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-2">Recent Activities</p>
                        <div className="divide-y divide-gray-50">
                            {coord.recentActivities.map((a, i) => (
                                <div key={i} className="flex items-start gap-3 px-4 py-3">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: coord.color + '22' }}>
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: coord.color }} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-700 leading-snug">{a.text}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{a.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// ─── Interactive Map Tab ──────────────────────────────────────────────────────
import dynamic from 'next/dynamic';
import type { ClusterMapGroup } from '@/components/ClusterMap';

const ClusterMapDynamic = dynamic(() => import('@/components/ClusterMap'), { ssr: false });

function chGroupsToMapGroups(groups: typeof CH_CLUSTER_GROUPS): ClusterMapGroup[] {
    return groups.map(g => ({
        id: g.id, name: g.name, barangay: g.barangay,
        type: g.type, members: g.members,
        capacity: g.type === 'Community-based' ? 12 : 11,
        mentor: g.mentor, status: 'Open',
        lat: g.lat, lng: g.lng,
    }));
}

function MapTab() {
    const [mapFilter, setMapFilter] = useState<'All' | 'Open' | 'Full'>('All');
    const communityGroups = CH_CLUSTER_GROUPS.filter(g => g.type === 'Community-based');
    const allMapGroups = chGroupsToMapGroups(communityGroups);
    const mapGroups = mapFilter === 'All' ? allMapGroups : allMapGroups.filter(g => g.status === mapFilter);

    return (
        <div>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-[1.75rem] font-extrabold tracking-[0.02em] uppercase text-gray-900 leading-tight">Interactive Map</h1>
                    <p className="text-sm text-gray-400 mt-1">Community-based group distribution across the cluster barangays — powered by OpenStreetMap.</p>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-5">
                <CustomSelect
                    value={mapFilter}
                    onChange={e => setMapFilter(e.target.value as any)}
                    className="min-w-[180px]"
                >
                    <option value="All">All Community-based</option>
                    <option value="Open">Available</option>
                    <option value="Full">Full</option>
                </CustomSelect>
            </div>

            {/* Real OSM Map */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6 map-container">
                <ClusterMapDynamic groups={mapGroups} accentColor="#047857" />
            </div>

            {/* Legend */}
            <div className="flex items-center flex-wrap gap-x-6 gap-y-2 mb-5">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ background: '#047857' }} />
                    <span className="text-xs text-gray-600 font-medium">Community-based</span>
                </div>
                <p className="text-xs text-gray-400 sm:ml-auto hidden sm:block">Click a marker to see group details</p>
            </div>

            {/* Groups list */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {mapGroups.map(g => (
                    <div key={g.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
                            style={{ background: '#047857' }}>
                            {g.members}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm">{g.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{g.barangay} · {g.mentor}</p>
                        </div>
                        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 bg-[#E0F2FE] text-[#0369A1]">
                            {g.type}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Reports Tab (with embedded map) ─────────────────────────────────────────
// Charts are rendered in dashboard/page.tsx (where recharts resolves correctly)
// and passed in as reportsContent prop
function CHReportsTab({ clusterName, reportsContent }: { clusterName: string; reportsContent?: ReactNode }) {
    const [mapFilter, setMapFilter] = useState<'All' | 'Open' | 'Full'>('All');
    const communityGroups = CH_CLUSTER_GROUPS.filter(g => g.type === 'Community-based');
    const allMapGroups = chGroupsToMapGroups(communityGroups);
    const mapGroups = mapFilter === 'All' ? allMapGroups : allMapGroups.filter(g => g.status === mapFilter);

    function handleExportCsv() {
        const slug = clusterName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        exportToCsv(
            `${slug || 'cluster'}-groups-report.csv`,
            ['Group Name', 'Barangay', 'Type', 'Members', 'Capacity', 'Mentor', 'Status'],
            mapGroups.map((g) => [g.name, g.barangay, g.type, g.members, g.capacity, g.mentor, g.status]),
        );
    }

    return (
        <div>
            <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
                <div>
                    <h1 className="text-[1.75rem] font-extrabold tracking-[0.02em] uppercase text-gray-900 leading-tight">Reports</h1>
                    <p className="text-xs text-gray-400 mt-0.5">{clusterName}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center justify-center gap-1.5 h-[2.375rem] px-[1.125rem] py-2 text-[0.8125rem] font-semibold text-[#181F26] dark:text-[#E6EDF3] border border-[#E2E8E5] dark:border-[#2A323D] rounded-[0.625rem] bg-white dark:bg-[#1A2026] hover:bg-[#F8FAFC] dark:hover:bg-[#222933] leading-none transition-colors cursor-pointer"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5z" /></svg>
                        Export CSV / Excel
                    </button>
                </div>
            </div>

            {/* Summary stat cards */}
            <div className="c2s-kpi-shell mb-6">
                <div className="c2s-kpi-grid">
                    {[
                        { value: `${CH_MENTORS.length}`, label: 'Total Mentors', sub: clusterName, icon: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z' },
                        { value: `${CH_POTENTIAL_MENTEES.length}`, label: 'Potential Mentees', sub: 'All statuses', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
                        { value: `${CH_ACTIVE_MENTEES.length}`, label: 'Active Mentees', sub: 'In discipleship', icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z' },
                        { value: `${CH_COORDINATORS.length}`, label: 'C2S Coordinators', sub: 'Active only', icon: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z' },
                    ].map(s => (
                        <div key={s.label} className="kpi-card c2s-kpi-card bg-white rounded-2xl border border-[#E2E8E5]">
                            <div className="c2s-kpi-card-top">
                                <p className="c2s-kpi-label">{s.label}</p>
                                <div className="kpi-icon-badge c2s-kpi-badge">
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d={s.icon} /></svg>
                                </div>
                            </div>
                            <div className="c2s-kpi-bottom">
                                <p className="kpi-value c2s-kpi-number">{s.value}</p>
                                <p className="text-xs text-[#64748B] dark:text-[#9BA7B4] mt-1.5">{s.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Charts */}
            <div className="mb-10">{reportsContent}</div>

            {/* ── Interactive Map section ── */}
            <div className="mb-4">
                <h2 className="text-lg font-black text-gray-900">Interactive Map</h2>
                <p className="text-sm text-gray-400 mt-0.5">Community-based group distribution across the cluster barangays — powered by OpenStreetMap.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <CustomSelect
                    value={mapFilter}
                    onChange={e => setMapFilter(e.target.value as any)}
                    className="min-w-[180px]"
                >
                    <option value="All">All Community-based</option>
                    <option value="Open">Available</option>
                    <option value="Full">Full</option>
                </CustomSelect>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4 map-container">
                <ClusterMapDynamic groups={mapGroups} accentColor="#047857" />
            </div>
            <div className="flex items-center flex-wrap gap-x-6 gap-y-2 mb-5">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ background: '#047857' }} />
                    <span className="text-xs text-gray-600 font-medium">Community-based</span>
                </div>
                <p className="text-xs text-gray-400 sm:ml-auto hidden sm:block">Click a marker to see group details</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {mapGroups.map(g => (
                    <div key={g.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
                            style={{ background: '#047857' }}>{g.members}</div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm">{g.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{g.barangay} · {g.mentor}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${g.type === 'Church-based' ? 'bg-[#D97706] text-white' : 'bg-[#0284C7] text-white'}`}>
                            {g.type}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Dashboard Notifications (shown at bottom of Dashboard tab) ──────────────
function DashboardNotifications() {
    const [notifs, setNotifs] = useState(CH_NOTIFICATIONS);
    const unread = notifs.filter(n => !n.read).length;
    const iconFor = (type: string) => {
        if (type === 'new_potential') return { bg: '#FEF3C7', dot: '#D97706', icon: <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /> };
        if (type === 'assignment') return { bg: '#e0f0ff', dot: '#1971c2', icon: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /> };
        return { bg: '#FEF3C7', dot: '#0284C7', icon: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /> };
    };
    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <div>
                    <h2 className="font-bold text-gray-900 text-base">Dashboard Notifications</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{unread > 0 ? `${unread} unread` : 'All caught up'}</p>
                </div>
                {unread > 0 && (
                    <button onClick={() => setNotifs(prev => prev.map(n => ({ ...n, read: true })))}
                        className="text-xs font-semibold text-[#D97706] hover:underline">Mark all as read</button>
                )}
            </div>
            <div className="divide-y divide-gray-50">
                {notifs.map(n => {
                    const ic = iconFor(n.type);
                    return (
                        <div key={n.id} onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                            className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition-colors hover:bg-gray-50 ${!n.read ? 'bg-[#FEF3C7]' : ''}`}>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: ic.bg }}>
                                <svg className="w-4.5 h-4.5" width="18" height="18" viewBox="0 0 24 24" fill={ic.dot}>{ic.icon}</svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-snug ${n.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>{n.text}</p>
                                <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                            </div>
                            {!n.read && <div className="w-2 h-2 rounded-full bg-[#D97706] shrink-0 mt-1.5" />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────
function NotificationsTab() {
    const [notifs, setNotifs] = useState(CH_NOTIFICATIONS);
    const unread = notifs.filter(n => !n.read).length;
    const iconFor = (type: string) => {
        if (type === 'new_potential') return { bg: '#FEF3C7', dot: '#D97706', icon: <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /> };
        if (type === 'assignment') return { bg: '#e0f0ff', dot: '#1971c2', icon: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /> };
        return { bg: '#FEF3C7', dot: '#0284C7', icon: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /> };
    };
    return (
        <div>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-[1.75rem] font-extrabold tracking-[0.02em] uppercase text-gray-900 leading-tight">Notifications</h1>
                    <p className="text-sm text-gray-400 mt-1">{unread} unread notification{unread !== 1 ? 's' : ''}</p>
                </div>
                {unread > 0 && (
                    <button onClick={() => setNotifs(prev => prev.map(n => ({ ...n, read: true })))}
                        className="text-xs font-semibold text-[#D97706] hover:underline">Mark all as read</button>
                )}
            </div>
            <div className="flex flex-col gap-3">
                {notifs.map(n => {
                    const ic = iconFor(n.type);
                    return (
                        <div key={n.id} className={`bg-white rounded-2xl border p-5 flex items-start gap-4 transition-colors ${n.read ? 'border-gray-100' : 'border-[#D97706]/30 bg-[#FEF3C7]'}`}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: ic.bg }}>
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill={ic.dot}>{ic.icon}</svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-snug ${n.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>{n.text}</p>
                                <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                            </div>
                            {!n.read && <div className="w-2 h-2 rounded-full bg-[#D97706] shrink-0 mt-1.5" />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Mentor Profile Page (inline, replaces mentors list) ─────────────────────
function CHMentorProfilePage({ mentor, onBack }: { mentor: ClusterMentor; onBack: () => void }) {
    const [viewingGroup, setViewingGroup] = useState<string | null>(null);
    const [menteeSearch, setMenteeSearch] = useState('');
    const [menteeStatusFilter, setMenteeStatusFilter] = useState('All');

    const statusOptions = ['All', 'Active', 'Needs Follow-up', 'Inactive'];

    const statusBadge = (s: string) => {
        if (s === 'Active') return 'bg-[#16a34a] text-white';
        if (s === 'Needs Follow-up') return 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]';
        return 'bg-gray-400 text-white';
    };

    return (
        <div>
            {/* Back link */}
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 font-medium mb-6 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                Back to Mentors
            </button>

            {/* Hero card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <div className="flex items-start gap-5 mb-6">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-black shrink-0"
                        style={{ background: mentor.color }}>
                        {mentor.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <h1 className="text-[1.75rem] font-extrabold tracking-[0.02em] uppercase text-gray-900 leading-tight">{mentor.name}</h1>
                            <span className={`text-[15px] font-bold px-2.5 py-1 rounded-full ${mentor.status === 'Active' ? 'bg-[#16a34a] text-white' : 'bg-gray-400 text-white'}`}>
                                {mentor.status}
                            </span>
                        </div>
                        <p className="text-sm font-bold text-[#181F26] dark:text-[#E6EDF3] mt-0.5 tabular-nums">{mentor.workerId}</p>
                    </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                    <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Worker ID</p>
                        <p className="text-sm font-bold text-[#181F26] dark:text-[#E6EDF3] tabular-nums">{mentor.workerId}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Worker Since (ID Issued)</p>
                        <WorkerSinceValue createdAt={mentor.workerIdCreatedAt} className="text-sm" />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Contact</p>
                        <div className="flex items-center gap-2 text-sm text-gray-800">
                            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" /></svg>
                            {mentor.phone}
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Email</p>
                        <div className="flex items-center gap-2 text-sm text-gray-800">
                            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
                            {mentor.email}
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Barangay</p>
                        <div className="flex items-center gap-2 text-sm text-gray-800">
                            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                            {mentor.barangay}
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Address</p>
                        <div className="flex items-center gap-2 text-sm text-gray-800">
                            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
                            {mentor.groups[0]?.address ?? mentor.group}
                        </div>
                    </div>
                </div>
            </div>

            {/* My Groups section */}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
                        <h2 className="text-lg font-bold text-gray-900">Groups</h2>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 ml-6">All C2S groups assigned to this mentor.</p>
                </div>
                <span className="text-xs font-semibold text-[#D97706] bg-[#FEF3C7] px-3 py-1 rounded-full">
                    {mentor.groups.length} group{mentor.groups.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="grid gap-4 mb-8 items-stretch" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))' }}>
                {mentor.groups.map((g, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between gap-5">
                        <div>
                            <p className="font-bold text-gray-900 text-lg mb-3">{g.name}</p>
                            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                                    {g.barangay}
                                </span>
                                {g.schedule && (
                                    <span className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" /></svg>
                                        {g.schedule}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <span className="flex items-center gap-2 text-sm text-gray-400">
                                Active Mentees
                                <span className="text-base font-bold text-[#D97706]">{g.mentees}</span>
                            </span>
                            <button
                                onClick={() => setViewingGroup(g.name)}
                                className="text-sm font-semibold text-[#D97706] hover:underline">
                                View Mentees
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Group Detail Modal ── */}
            {viewingGroup && (() => {
                const grp = mentor.groups.find(g => g.name === viewingGroup)!;
                const allGrpMentees = mentor.mentees.filter(mt => mt.group === viewingGroup);
                const grpMentees = allGrpMentees.filter(mt => {
                    const matchSearch = mt.name.toLowerCase().includes(menteeSearch.toLowerCase());
                    const matchStatus = menteeStatusFilter === 'All' || mt.status === menteeStatusFilter;
                    return matchSearch && matchStatus;
                });
                return (
                    <>
                        <div className="fixed inset-0 z-[9999] bg-black/50" onClick={() => { setViewingGroup(null); setMenteeSearch(''); setMenteeStatusFilter('All'); }} />
                        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6" onClick={() => { setViewingGroup(null); setMenteeSearch(''); setMenteeStatusFilter('All'); }}>
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]" onClick={e => e.stopPropagation()}>

                                {/* Modal header */}
                                <div className="px-5 sm:px-8 pt-6 pb-5 border-b border-gray-100 flex items-start justify-between shrink-0">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{grp.name}</h2>
                                        <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500">
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                                                {grp.barangay}
                                            </span>
                                            {grp.schedule && (
                                                <span className="flex items-center gap-1.5">
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" /></svg>
                                                    {grp.schedule}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={() => { setViewingGroup(null); setMenteeSearch(''); setMenteeStatusFilter('All'); }} className="text-gray-400 hover:text-gray-700 p-1 transition-colors">
                                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                                    </button>
                                </div>

                                {/* Search + filter + count */}
                                <div className="px-4 sm:px-8 py-3 border-b border-gray-100 flex items-center gap-2 shrink-0">
                                    <div className="relative flex-1 min-w-0">
                                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" /></svg>
                                        <input
                                            type="text"
                                            placeholder=""
                                            value={menteeSearch}
                                            onChange={e => setMenteeSearch(e.target.value)}
                                            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D97706] bg-white"
                                        />
                                    </div>
                                    <CustomSelect
                                        value={menteeStatusFilter}
                                        onChange={e => setMenteeStatusFilter(e.target.value)}
                                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#D97706] cursor-pointer shrink-0"
                                    >
                                        {statusOptions.map(o => <option key={o} value={o}>{o === 'All' ? 'All Statuses' : o}</option>)}
                                    </CustomSelect>
                                    <span className="text-xs font-semibold text-[#D97706] bg-[#FEF3C7] px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
                                        {grpMentees.length} mentee{grpMentees.length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {/* Mentee list */}
                                <div className="overflow-y-auto divide-y divide-gray-50">
                                    {grpMentees.length === 0 ? (
                                        <div className="p-12 text-center">
                                            <p className="text-sm font-semibold text-gray-600">No mentees found</p>
                                            <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter.</p>
                                        </div>
                                    ) : grpMentees.map(mt => (
                                        <div key={mt.id} className="flex items-start gap-3 px-4 sm:px-8 py-4">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0" style={{ background: mt.color }}>
                                                {mt.initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 leading-tight truncate">{mt.name}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">{mt.id}</p>
                                                    </div>
                                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${statusBadge(mt.status)}`}>
                                                        {mt.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1.5">
                                                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" /></svg>
                                                    {mt.lesson}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1 text-xs text-gray-400">
                                                    <span>Devotion: {mt.devotionDate}</span>
                                                    <span>Att: {mt.attendanceDate}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                );
            })()}


        </div>
    );
}

// ─── Main Cluster Head Dashboard ─────────────────────────────────────────────
export default function ClusterHeadDashboard({
    onLogout,
    reportsContent,
    renderReportsContent,
}: {
    onLogout: () => void;
    reportsContent?: ReactNode;
    renderReportsContent?: (tab: CHReportSection) => ReactNode;
}) {
    const { user } = useAuth();
    const [activeNav, setActiveNav] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [settingsSection, setSettingsSection] = useState<MySettingsSection | null>(null);
    const [viewingCoord, setViewingCoord] = useState<C2SCoordinator | null>(null);
    const [mentorProfilePage, setMentorProfilePage] = useState<ClusterMentor | null>(null);
    useScrollToTop(`${activeNav}:${settingsSection ?? ''}:${mentorProfilePage?.id ?? ''}`);
    const [viewingActiveMentee, setViewingActiveMentee] = useState<Mentee | null>(null);
    const [updatingMentee, setUpdatingMentee] = useState<Mentee | null>(null);
    const [inactiveMenuOpenId, setInactiveMenuOpenId] = useState<string | null>(null);
    const [inactiveMenteesList, setInactiveMenteesList] = useState(() => INACTIVE_MENTEES.map(m => ({ ...m })));
    const [mentorSearch, setMentorSearch] = useState('');
    const [mentorFilter, setMentorFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
    const [potentialSearch, setPotentialSearch] = useState('');
    const [potentialFilter, setPotentialFilter] = useState<string>('All');
    const [activeMenteeSearch, setActiveMenteeSearch] = useState('');
    const [inactiveMenteeSearch, setInactiveMenteeSearch] = useState('');
    const [activeMentees, setActiveMentees] = useState(() => CH_ACTIVE_MENTEES.map(m => ({ ...m })));
    const clusterName = user?.cluster ?? 'Outreach Cluster 4';
    const unreadCount = CH_NOTIFICATIONS.filter(n => !n.read).length;

    const allMentors = CH_MENTORS;
    const filteredMentors = allMentors.filter(m => {
        const ms = mentorSearch.toLowerCase();
        const matchSearch = m.name.toLowerCase().includes(ms) || m.group.toLowerCase().includes(ms) || m.workerId.toLowerCase().includes(ms);
        const matchFilter = mentorFilter === 'All' || m.status === mentorFilter;
        return matchSearch && matchFilter;
    });

    const statusFilters = ['All', 'New', 'Waiting for Assignment', 'Assigned to Mentor', 'Interview Scheduled', 'Accepted'];
    const filteredPotential = CH_POTENTIAL_MENTEES.filter(m => {
        const ms = potentialSearch.toLowerCase();
        const matchSearch = m.name.toLowerCase().includes(ms);
        const matchFilter = potentialFilter === 'All' || m.clusterStatus === potentialFilter;
        return matchSearch && matchFilter;
    });

    const filteredActiveMentees = activeMentees.filter(m => m.name.toLowerCase().includes(activeMenteeSearch.toLowerCase()));
    const filteredInactiveMentees = INACTIVE_MENTEES.filter(m => m.name.toLowerCase().includes(inactiveMenteeSearch.toLowerCase()));

    // stat helpers
    const totalMentors = CH_MENTORS.length;
    const totalPotential = CH_POTENTIAL_MENTEES.length;
    const totalActiveMentees = CH_ACTIVE_MENTEES.length;
    const communityGroups = CH_CLUSTER_GROUPS.filter(g => g.type === 'Community-based').length;
    const churchGroups = CH_CLUSTER_GROUPS.filter(g => g.type === 'Church-based').length;
    const activeGroups = CH_CLUSTER_GROUPS.length;
    const totalCoordinators = CH_COORDINATORS.length;
    const totalAssigned = CH_COORDINATORS.reduce((s, c) => s + c.assignedPotential, 0);
    const totalPending = CH_COORDINATORS.reduce((s, c) => s + c.pendingAssignments, 0);
    const avgDays = Math.round(CH_COORDINATORS.reduce((s, c) => s + c.avgAssignmentDays, 0) / CH_COORDINATORS.length);

    return (
        <div className="flex min-h-screen dashboard-shell overflow-x-hidden" style={{ background: 'var(--bg-page)' }}>
            {/* Modals */}
            {viewingCoord && <CoordinatorPanel coord={viewingCoord} onClose={() => setViewingCoord(null)} />}
            {updatingMentee && (
                <DevotionalProgressModal
                    mentee={updatingMentee}
                    onClose={() => setUpdatingMentee(null)}
                    onSave={(progress, currentModule, currentLesson, moduleShort, lessonShort) => {
                        setActiveMentees(prev => prev.map(m =>
                            m.id === updatingMentee.id
                                ? { ...m, progress, module: moduleShort, lesson: lessonShort, currentModule, currentLesson }
                                : m
                        ));
                        setUpdatingMentee(null);
                    }}
                />
            )}

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Left Sidebar (full viewport height with brand header) ── */}
            <aside className={`sidebar-nav ${sidebarCollapsed ? 'w-72 md:w-[68px]' : 'w-72'} border-r flex flex-col pt-0 pb-4 fixed top-0 bottom-0 left-0 ${sidebarOpen ? 'z-50 translate-x-0' : 'z-40 -translate-x-full md:translate-x-0'} transition-all duration-200`}>
                <SidebarBrandHeader collapsed={sidebarCollapsed} />
                <div className={`flex items-center pt-4 mb-3 ${sidebarCollapsed ? 'justify-between px-5 md:justify-center md:px-0 md:mb-2' : 'justify-between px-4'}`}>
                    <p className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest ${sidebarCollapsed ? 'md:hidden' : ''}`}>Menu</p>
                    <SidebarCollapseButton collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} />
                </div>
                <SidebarNavList
                    entries={[
                        { kind: 'item', item: CH_NAV.find(n => n.key === 'dashboard')! },
                        {
                            kind: 'group',
                            group: {
                                id: 'leadership',
                                label: 'Leadership',
                                icon: CH_NAV.find(n => n.key === 'coordinators')!.icon,
                                items: [
                                    CH_NAV.find(n => n.key === 'coordinators')!,
                                    CH_NAV.find(n => n.key === 'mentors')!,
                                ],
                            },
                        },
                        {
                            kind: 'group',
                            group: {
                                id: 'mentees',
                                label: 'Mentees',
                                icon: CH_NAV.find(n => n.key === 'mentees')!.icon,
                                items: [
                                    CH_NAV.find(n => n.key === 'potential')!,
                                    CH_NAV.find(n => n.key === 'mentees')!,
                                ],
                            },
                        },
                        {
                            kind: 'group',
                            group: {
                                id: 'reports',
                                label: 'Reports',
                                icon: CH_NAV.find(n => n.key === 'reports')!.icon,
                                items: CH_REPORT_NAV_ITEMS,
                            },
                        },
                        { kind: 'item', item: { ...CH_NAV.find(n => n.key === 'notifications')!, badge: unreadCount } },
                    ] as SidebarNavEntry[]}
                    activeKey={!settingsSection ? activeNav : null}
                    collapsed={sidebarCollapsed}
                    accentColor="#0E5B52"
                    onSelect={(key) => {
                        setActiveNav(key);
                        setSettingsSection(null);
                        setSidebarOpen(false);
                        if (key !== 'mentors') setMentorProfilePage(null);
                    }}
                />
                {/* Settings dropdown at bottom */}
                <SidebarSettingsDropdown
                    activeSection={settingsSection}
                    collapsed={sidebarCollapsed}
                    onExpandSidebar={() => setSidebarCollapsed(false)}
                    onSelect={(sec) => { setSettingsSection(sec); setSidebarOpen(false); }}
                />
            </aside>

            {/* ── Main ── */}
            <div className={`w-full flex-1 ${sidebarCollapsed ? 'md:ml-[68px]' : 'md:ml-72'} pb-16 min-w-0 overflow-x-hidden transition-[margin] duration-200`}>

                <DashboardTopHeader
                    pageTitle={
                        settingsSection === 'profile'
                            ? 'My Profile'
                            : settingsSection
                            ? 'Settings'
                            : activeNav === 'dashboard'
                                ? 'Dashboard'
                                : activeNav.startsWith('reports_')
                                    ? (CH_REPORT_NAV_ITEMS.find(r => r.key === activeNav)?.label ?? 'Reports')
                                    : CH_NAV.find(n => n.key === activeNav)?.label ?? ''
                    }
                    onOpenMenu={() => setSidebarOpen(true)}
                    onOpenProfile={() => { setSettingsSection('profile'); setSidebarOpen(false); }}
                    onLogout={onLogout}
                />

                <div className="pt-4 md:pt-5 px-4 sm:px-6">
                    {settingsSection ? (
                        <SettingsPageView section={settingsSection} />
                    ) : (
                        <>
                            {activeNav === 'dashboard' && (
                                <div>
                                    <DashboardWelcomeBanner fallbackRole="cluster_head" />
                                    <SharedDashboardTab data={CHURCH_WIDE_DATA} />
                                </div>
                            )}


                            {/* ── Coordinators Tab ── */}
                            {activeNav === 'coordinators' && (
                                <div>
                                    <div className="mb-6">
                                        <h1 className="text-[1.75rem] font-extrabold tracking-[0.02em] uppercase text-gray-900 leading-tight">C2S Coordinators</h1>
                                        <p className="text-sm text-gray-400 mt-1">Monitor coordinator activities within {clusterName}.</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
                                        {[
                                            { label: 'Assigned Potential', value: totalAssigned, color: '#D97706' },
                                            { label: 'Pending Assignments', value: totalPending, color: '#e67700' },
                                            { label: 'Avg Assignment Time', value: `${avgDays} days`, color: '#0284C7' },
                                        ].map(s => (
                                            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
                                                <p className="text-3xl font-black leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
                                                <p className="text-sm font-semibold text-gray-700">{s.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                        {CH_COORDINATORS.map(c => (
                                            <div key={c.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0" style={{ background: c.color }}>{c.initials}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <p className="font-bold text-gray-900">{c.name}</p>
                                                                <p className="text-xs text-gray-400 mt-0.5">{c.barangay}</p>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${c.status === 'Active' ? 'bg-[#16a34a] text-white' : 'bg-gray-400 text-white'}`}>{c.status}</span>
                                                                <ActionMenu
                                                                    ariaLabel={`${c.name} actions`}
                                                                    items={[
                                                                        { label: 'View Full Profile', icon: ActionIcons.view, onClick: () => setViewingCoord(c) },
                                                                    ]}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-3 mt-2 text-xs text-gray-500">
                                                            <span>{c.phone}</span>
                                                            <span className="truncate">{c.email}</span>
                                                        </div>
                                                        <p className="text-xs font-bold text-[#181F26] dark:text-[#E6EDF3] tabular-nums mt-2">{c.workerId}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 min-[360px]:grid-cols-3 gap-2">
                                                    {[
                                                        { label: 'Assigned', value: c.assignedPotential, color: '#D97706' },
                                                        { label: 'Pending', value: c.pendingAssignments, color: '#e67700' },
                                                        { label: 'Avg Days', value: `${c.avgAssignmentDays}d`, color: '#0284C7' },
                                                    ].map(s => (
                                                        <div key={s.label} className="rounded-xl px-1.5 py-2.5 sm:p-3 text-center border" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}>
                                                            <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
                                                            <p className="text-[0.75rem] text-gray-400 whitespace-nowrap">{s.label}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="rounded-xl p-3" style={{ background: 'var(--bg-subtle)' }}>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Recent Activities</p>
                                                    {c.recentActivities.slice(0, 2).map((a, i) => (
                                                        <p key={i} className="text-xs text-gray-600 leading-snug mb-1">• {a.text} <span className="text-gray-400 text-[10px]">({a.time})</span></p>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Mentors Tab ── */}
                            {activeNav === 'mentors' && (
                                mentorProfilePage ? (
                                    <CHMentorProfilePage
                                        mentor={mentorProfilePage}
                                        onBack={() => setMentorProfilePage(null)}
                                    />
                                ) : (
                                    <div>
                                        <div className="mb-6">
                                            <h1 className="text-[1.75rem] font-extrabold tracking-[0.02em] uppercase text-gray-900 leading-tight">Mentors</h1>
                                            <p className="text-sm text-gray-400 mt-1">All mentors within {clusterName}.</p>
                                        </div>

                                        {/* Info banner */}
                                        <div className="flex items-start gap-3 bg-[#D97706] rounded-xl px-4 py-3 mb-6">
                                            <svg className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                                            <p className="text-xs text-white">Mentors are created exclusively through the Endorsement Approval process. No manual creation allowed.</p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 mb-6">
                                            <div className="relative w-full sm:w-64">
                                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" /></svg>
                                                <input type="text" placeholder="Search mentors..." value={mentorSearch} onChange={e => setMentorSearch(e.target.value)}
                                                    className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97706] w-full bg-white" />
                                            </div>
                                            <CustomSelect
                                                value={mentorFilter}
                                                onChange={e => setMentorFilter(e.target.value as any)}
                                                className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#D97706] min-w-[130px]"
                                            >
                                                <option value="All">All Statuses</option>
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </CustomSelect>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                            {filteredMentors.map(m => {
                                                const visibleGroups = m.groups.slice(0, 3);
                                                const extraGroups = m.groups.length - visibleGroups.length;
                                                return (
                                                    <div key={m.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
                                                        {/* Header */}
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0" style={{ background: m.color }}>{m.initials}</div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div>
                                                                        <p className="font-bold text-gray-900 text-xl leading-tight">{m.name}</p>
                                                                        <p className="text-xs font-bold text-[#181F26] dark:text-[#E6EDF3] tabular-nums mt-1">{m.workerId}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${m.status === 'Active' ? 'bg-[#16a34a] text-white' : 'bg-gray-400 text-white'}`}>{m.status}</span>
                                                                        <ActionMenu
                                                                            ariaLabel={`${m.name} actions`}
                                                                            items={[
                                                                                { label: 'View Profile', icon: ActionIcons.view, onClick: () => setMentorProfilePage(m) },
                                                                            ]}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-base text-gray-500">
                                                                    <span className="flex items-center gap-1.5">
                                                                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                                                                        {m.barangay}
                                                                    </span>
                                                                    <span className="flex items-center gap-1.5">
                                                                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" /></svg>
                                                                        {m.phone}
                                                                    </span>
                                                                    <span className="flex items-center gap-1.5">
                                                                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
                                                                        {m.email}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* My Groups section */}
                                                        <div>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                                                                    <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
                                                                    Groups
                                                                </div>
                                                                <span className="text-[11px] font-semibold text-[#D97706]">{m.groups.length} group{m.groups.length !== 1 ? 's' : ''}</span>
                                                            </div>

                                                            <div className="flex flex-col divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                                                                {visibleGroups.map((g, i) => (
                                                                    <div key={i} className="flex items-center px-3 py-2.5">
                                                                        <div>
                                                                            <p className="text-xs font-semibold text-gray-800">{g.name}</p>
                                                                            <p className="text-[10px] text-gray-400">{g.barangay}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {extraGroups > 0 && (
                                                                <button onClick={() => setMentorProfilePage(m)} className="mt-2 text-xs font-semibold text-[#D97706] hover:underline">
                                                                    +{extraGroups} more
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )
                            )}

                            {/* ── Potential Mentees Tab ── */}
                            {activeNav === 'potential' && (
                                <div>
                                    <div className="mb-6">
                                        <h1 className="text-[1.75rem] font-extrabold tracking-[0.02em] uppercase text-gray-900 leading-tight">Potential Mentees</h1>
                                        <p className="text-sm text-gray-400 mt-1">All new potential mentees within {clusterName}.</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 mb-6">
                                        <div className="relative w-full sm:w-64">
                                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" /></svg>
                                            <input type="text" placeholder="Search..." value={potentialSearch} onChange={e => setPotentialSearch(e.target.value)}
                                                className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97706] w-full bg-white" />
                                        </div>
                                        <CustomSelect
                                            value={potentialFilter}
                                            onChange={e => setPotentialFilter(e.target.value as any)}
                                            className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#D97706] min-w-[150px]"
                                        >
                                            {statusFilters.map(f => (
                                                <option key={f} value={f}>{f === 'All' ? 'All Statuses' : f}</option>
                                            ))}
                                        </CustomSelect>
                                    </div>
                                    {/* Mobile cards */}
                                    <div className="sm:hidden bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
                                        {filteredPotential.map(m => (
                                            <div key={m.id} className="p-4 flex flex-col gap-2.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0" style={{ background: avatarColor(m.id) }}>{m.initials}</div>
                                                    <span className="font-semibold text-gray-900 text-sm">{m.name}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                                    <span>{m.age} · {m.gender}</span>
                                                    <span className={`inline-flex items-center whitespace-nowrap leading-none text-[10px] font-semibold px-2.5 py-1 rounded-full ${m.sourceColor}`}>{m.source}</span>
                                                </div>
                                                <p className="text-xs text-gray-600">{m.requestedGroup}</p>
                                                <p className="text-xs text-gray-500">{m.assignedCoordinator ?? '—'}</p>
                                                <span className={`self-start inline-flex items-center whitespace-nowrap leading-none text-[10px] font-semibold px-2.5 py-1 rounded-full ${CLUSTER_STATUS_STYLE[m.clusterStatus]}`}>{m.clusterStatus}</span>
                                            </div>
                                        ))}
                                        {filteredPotential.length === 0 && (
                                            <div className="p-10 text-center">
                                                <p className="font-semibold text-gray-700 text-sm">No potential mentees found</p>
                                            </div>
                                        )}
                                    </div>
                                    {/* Desktop table */}
                                    <div className="hidden sm:block bg-white rounded-2xl border border-gray-200 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full table-auto text-sm">
                                                <colgroup>
                                                    <col className="w-[22%]" />
                                                    <col className="w-[14%]" />
                                                    <col className="w-[16%]" />
                                                    <col className="w-[18%]" />
                                                    <col className="w-[16%]" />
                                                    <col className="w-[14%]" />
                                                </colgroup>
                                                <thead>
                                                    <tr className="table-header-row">
                                                        {['Name', 'Age / Gender', 'Source', 'Requested Group', 'Coordinator', 'Status'].map((h, idx, arr) => (
                                                            <th key={h} className={`px-6 py-4 font-semibold ${idx === arr.length - 1 ? 'table-col-center text-center' : 'text-left'}`}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredPotential.map(m => (
                                                        <tr key={m.id} className="transition-colors">
                                                            <td className="px-6 py-4 text-left">
                                                                <div className="flex items-center justify-start gap-2.5">
                                                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0" style={{ background: avatarColor(m.id) }}>{m.initials}</div>
                                                                    <span className="font-bold text-[#181F26] dark:text-[#E6EDF3]">{m.name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs text-[#64748B] dark:text-[#9BA7B4] text-left tabular-nums">{m.age} · {m.gender}</td>
                                                            <td className="px-6 py-4 text-left"><span className={`inline-flex items-center leading-none text-[10px] font-semibold px-2.5 py-1 rounded-full ${m.sourceColor}`}>{m.source}</span></td>
                                                            <td className="px-6 py-4 text-xs text-[#64748B] dark:text-[#9BA7B4] text-left">{m.requestedGroup}</td>
                                                            <td className="px-6 py-4 text-xs text-[#64748B] dark:text-[#9BA7B4] text-left">{m.assignedCoordinator ?? '—'}</td>
                                                            <td className="px-6 py-4 table-col-center text-center">
                                                                <span className={`inline-flex items-center justify-center leading-none text-[10px] font-semibold px-2.5 py-1 rounded-full ${CLUSTER_STATUS_STYLE[m.clusterStatus]}`}>{m.clusterStatus}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {filteredPotential.length === 0 && (
                                            <div className="p-12 text-center">
                                                <p className="font-semibold text-gray-700 text-sm">No potential mentees found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── Mentees Tab ── */}
                            {activeNav === 'mentees' && (() => {
                                const totalMentees = CH_ACTIVE_MENTEES.length + INACTIVE_MENTEES.filter(m => m.reason !== 'Transferred').length;
                                const activeCnt = CH_ACTIVE_MENTEES.length;
                                const inactiveCnt = INACTIVE_MENTEES.filter(m => m.reason === 'Inactive').length;
                                const transferredCnt = INACTIVE_MENTEES.filter(m => m.reason === 'Transferred').length;
                                const activePct = Math.round((activeCnt / totalMentees) * 100);
                                // donut params
                                const r = 40, circ = 2 * Math.PI * r;
                                const dash = (activePct / 100) * circ;

                                const reasonBadge = (r: string) => {
                                    if (r === 'Completed') return 'border border-[#22c55e] text-[#15803d]';
                                    if (r === 'Transferred') return 'border border-[#3b82f6] text-[#1d4ed8]';
                                    return 'border border-gray-300 text-gray-500';
                                };

                                return (
                                    <div>
                                        <div className="mb-6">
                                            <h1 className="text-[1.75rem] font-extrabold tracking-[0.02em] uppercase text-gray-900 leading-tight">Mentees</h1>
                                            <p className="text-sm text-gray-400 mt-1">Connect, disciple and guide souls on their spiritual journey through meaningful relationships and faithful follow-up.</p>
                                        </div>

                                        {/* ── Stats row ── */}
                                        <div className="c2s-kpi-shell mb-8">
                                            <div className="c2s-kpi-5-grid">
                                                {/* Donut card */}
                                                <div className="kpi-card c2s-kpi-donut-card bg-white rounded-2xl border border-[#E2E8E5] dark:bg-[#1A2026] dark:border-[#2A323D]">
                                                    <div className="min-w-0 flex flex-col justify-between gap-2">
                                                        <div>
                                                            <p className="text-sm font-bold text-[#181F26] dark:text-[#E6EDF3] leading-tight">Mentee Status</p>
                                                            <p className="text-xs text-[#64748B] dark:text-[#9BA7B4] mt-0.5">Active vs Inactive</p>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2 text-xs text-[#181F26] dark:text-[#E6EDF3]">
                                                                <span className="w-2.5 h-2.5 rounded-full bg-[#0E5B52] dark:bg-[#2A9D8F] shrink-0" />
                                                                <span className="text-[#64748B] dark:text-[#9BA7B4]">Active</span>
                                                                <span className="font-bold tabular-nums">{activeCnt}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-[#9BA7B4]">
                                                                <span className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-[#2A323D] shrink-0" />
                                                                <span>Inactive</span>
                                                                <span className="font-bold tabular-nums">{INACTIVE_MENTEES.length}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="relative shrink-0 w-[92px] h-[92px] flex items-center justify-center">
                                                        <svg width="92" height="92" viewBox="0 0 92 92" aria-hidden="true">
                                                            <circle cx="46" cy="46" r="36" fill="none" stroke="#e5e7eb" className="dark:stroke-[#2A323D]" strokeWidth="8" />
                                                            <circle cx="46" cy="46" r="36" fill="none" stroke="#0E5B52" className="dark:stroke-[#2A9D8F]" strokeWidth="8"
                                                                strokeDasharray={`${(activePct / 100) * (2 * Math.PI * 36)} ${(2 * Math.PI * 36) - (activePct / 100) * (2 * Math.PI * 36)}`}
                                                                strokeLinecap="round"
                                                                transform="rotate(-90 46 46)" />
                                                        </svg>
                                                        <div className="c2s-donut-center">
                                                            <span className="c2s-donut-pct">{activePct}%</span>
                                                            <span className="c2s-donut-sub">ACTIVE</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Stat cards */}
                                                {[
                                                    { label: 'Total Mentees', value: totalMentees, icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z' },
                                                    { label: 'Active', value: activeCnt, icon: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' },
                                                    { label: 'Inactive', value: inactiveCnt, icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' },
                                                    { label: 'Transferred', value: transferredCnt, icon: 'M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z' },
                                                ].map(s => (
                                                    <div key={s.label} className="kpi-card c2s-kpi-card bg-white rounded-2xl border border-[#E2E8E5] dark:bg-[#1A2026] dark:border-[#2A323D]">
                                                        <div className="c2s-kpi-card-top">
                                                            <p className="c2s-kpi-label">{s.label}</p>
                                                            <div className="kpi-icon-badge c2s-kpi-badge">
                                                                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d={s.icon} /></svg>
                                                            </div>
                                                        </div>
                                                        <div className="c2s-kpi-bottom">
                                                            <p className="kpi-value c2s-kpi-number">{s.value}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* ── Active Mentees cards ── */}
                                        <div className="mb-8">
                                            <div className="flex items-center justify-between mb-3">
                                                <h2 className="text-sm font-bold text-gray-700">Active Mentees <span className="text-gray-400 font-normal">({filteredActiveMentees.length})</span></h2>
                                                <div className="relative">
                                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" /></svg>
                                                    <input type="text" placeholder="Search mentees..." value={activeMenteeSearch} onChange={e => setActiveMenteeSearch(e.target.value)}
                                                        className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97706] bg-white w-52" />
                                                </div>
                                            </div>
                                            {filteredActiveMentees.length === 0 ? (
                                                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                                                    <p className="text-sm text-gray-400">No active mentees found.</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    {filteredActiveMentees.map(m => (
                                                        <div key={m.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                                                                    style={{ background: avatarColor(m.id) }}>{m.initials}</div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-bold text-gray-900 truncate">{m.name}</p>
                                                                    <p className="text-xs text-gray-400">{m.assignedGroup} · Since {m.connectedSince}</p>
                                                                </div>
                                                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#16a34a] text-white shrink-0">Active</span>
                                                                <ActionMenu
                                                                    ariaLabel={`${m.name} actions`}
                                                                    items={[
                                                                        { label: 'View Profile', icon: ActionIcons.view, onClick: () => setViewingActiveMentee(m) },
                                                                        { label: 'Devotional', icon: ActionIcons.clipboard, tone: 'positive', onClick: () => setUpdatingMentee(m) },
                                                                    ]}
                                                                />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-[11px] text-gray-500">{m.currentModule}</span>
                                                                    <span className="text-[11px] font-semibold text-gray-700">{m.progress}%</span>
                                                                </div>
                                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                    <div className="h-full rounded-full" style={{ width: `${m.progress}%`, background: '#D97706' }} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* ── Inactive Mentees table ── */}
                                        {(() => {
                                            const filtered = inactiveMenteesList.filter(m => m.name.toLowerCase().includes(inactiveMenteeSearch.toLowerCase()));

                                            const buildFakeMentee = (m: typeof filtered[0]): Mentee => ({
                                                id: m.id,
                                                initials: m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
                                                name: m.name,
                                                assignedGroup: m.assignedGroup,
                                                connectedSince: m.dateInactive,
                                                module: m.lastModule.split(',')[0]?.trim() ?? 'Module 1',
                                                lesson: m.lastModule.split(',')[1]?.trim() ?? 'Lesson 1',
                                                progress: 0,
                                                email: '—', phone: '—', age: 0,
                                                birthday: '—', gender: '—', facebook: '—',
                                                firstAttended: '—',
                                                currentModule: m.lastModule,
                                                currentLesson: '',
                                                mentorNotes: '',
                                                trainings: [],
                                            });

                                            return (
                                                <div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h2 className="text-sm font-bold text-gray-700">Inactive Mentees <span className="text-gray-400 font-normal">({filtered.length})</span></h2>
                                                    </div>

                                                    {/* Mobile cards */}
                                                    <div className="sm:hidden bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
                                                        {filtered.length === 0 && (
                                                            <div className="p-10 text-center text-sm text-gray-400">No inactive mentees found.</div>
                                                        )}
                                                        {filtered.map(m => (
                                                            <div key={m.id} className="p-4 flex flex-col gap-2">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div>
                                                                        <p className="font-bold text-gray-900 text-sm">{m.name}</p>
                                                                        <p className="text-xs text-gray-400">{m.assignedGroup}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${reasonBadge(m.reason)}`}>{m.reason}</span>
                                                                        <ActionMenu
                                                                            ariaLabel={`${m.name} actions`}
                                                                            items={[
                                                                                { label: 'View Profile', icon: ActionIcons.view, onClick: () => setViewingActiveMentee(buildFakeMentee(m)) },
                                                                            ]}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                                                                    <span><span className="text-gray-400">Inactive: </span>{m.dateInactive}</span>
                                                                    <span><span className="text-gray-400">Last: </span>{m.lastModule}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Desktop table */}
                                                    <div className="hidden sm:block overflow-x-auto bg-white rounded-2xl border border-gray-200">
                                                        <table className="w-full table-auto text-sm">
                                                            <colgroup>
                                                                <col className="w-[19%]" />
                                                                <col className="w-[18%]" />
                                                                <col className="w-[17%]" />
                                                                <col className="w-[22%]" />
                                                                <col className="w-[14%]" />
                                                                <col className="w-[10%]" />
                                                            </colgroup>
                                                            <thead>
                                                                <tr className="table-header-row">
                                                                    {['Name', 'Assigned Group', 'Date Became Inactive', 'Last Devotional Manual', 'Reason', 'Actions'].map((h, idx, arr) => (
                                                                        <th key={h} className={`px-6 py-4 font-semibold ${idx === arr.length - 1 ? 'table-col-center text-center' : 'text-left'}`}>{h}</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {filtered.map(m => (
                                                                    <tr key={m.id} className="transition-colors">
                                                                        <td className="px-6 py-4 font-bold text-[#181F26] dark:text-[#E6EDF3] text-left">{m.name}</td>
                                                                        <td className="px-6 py-4 text-[#64748B] dark:text-[#9BA7B4] text-left">{m.assignedGroup}</td>
                                                                        <td className="px-6 py-4 text-[#64748B] dark:text-[#9BA7B4] text-left tabular-nums">{m.dateInactive}</td>
                                                                        <td className="px-6 py-4 text-[#64748B] dark:text-[#9BA7B4] text-left">{m.lastModule}</td>
                                                                        <td className="px-6 py-4 text-left">
                                                                            <span className={`inline-flex items-center justify-center leading-none text-xs font-semibold px-2.5 py-1 rounded-full ${reasonBadge(m.reason)}`}>{m.reason}</span>
                                                                        </td>
                                                                        <td className="px-6 py-4 table-col-center text-center">
                                                                            <ActionMenu
                                                                                ariaLabel={`${m.name} actions`}
                                                                                items={[
                                                                                    { label: 'View Profile', icon: ActionIcons.view, onClick: () => setViewingActiveMentee(buildFakeMentee(m)) },
                                                                                ]}
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                        {filtered.length === 0 && (
                                                            <div className="p-10 text-center text-sm text-gray-400">No inactive mentees found.</div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                );
                            })()}

                            {/* ── Reports Tab ── */}
                            {activeNav.startsWith('reports_') && (
                                <CHReportsTab
                                    clusterName={clusterName}
                                    reportsContent={
                                        renderReportsContent
                                            ? renderReportsContent(activeNav.replace('reports_', '') as CHReportSection)
                                            : reportsContent
                                    }
                                />
                            )}

                            {/* ── Notifications Tab ── */}
                            {activeNav === 'notifications' && <NotificationsTab />}
                        </>
                    )}

                </div>{/* end inner pt-5 div */}
            </div>
        </div>
    );
}
