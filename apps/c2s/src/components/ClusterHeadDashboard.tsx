'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
    CH_COORDINATORS, CH_MENTORS, CH_POTENTIAL_MENTEES, CH_ACTIVE_MENTEES,
    CH_CLUSTER_GROUPS, CH_NOTIFICATIONS, INACTIVE_MENTEES,
    type C2SCoordinator, type ClusterMentor, type ClusterPotentialMentee, type Mentee,
} from '@/lib/data';
import { SharedDashboardTab, CHURCH_WIDE_DATA } from '@/components/DashboardSharedWidgets';
import Image from 'next/image';
import Link from 'next/link';
import MenteeProfileModal from '@/components/MenteeProfileModal';
import DevotionalProgressModal from '@/components/DevotionalProgressModal';
import SettingsModal from '@/components/SettingsModal';
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
const AVATAR_COLORS = ['#5b50d6', '#5b50d6', '#0b9b8a', '#e67700', '#6741d9'];
function avatarColor(id: string) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ─── Status badge styles ─────────────────────────────────────────────────────
const CLUSTER_STATUS_STYLE: Record<string, string> = {
    'New':                  'bg-[#1d4ed8] text-white',
    'Waiting for Assignment': 'bg-[#b45309] text-white',
    'Assigned to Mentor':   'bg-[#6741d9] text-white',
    'Interview Scheduled':  'bg-[#5b50d6] text-white',
    'Interview Completed':  'bg-[#0c8a6e] text-white',
    'Accepted':             'bg-[#166534] text-white',
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
export const CH_COORD_REPORT_DATA  = CH_COORDINATORS.map(c => ({ name: c.name.split(' ')[0], assigned: c.assignedPotential, pending: c.pendingAssignments }));
export const CH_BARANGAY_DATA      = CH_CLUSTER_GROUPS.map(g => ({ name: g.barangay, members: g.members }));

// ─── NAV items ────────────────────────────────────────────────────────────────
const CH_NAV = [
    { key: 'dashboard',    label: 'Dashboard',         icon: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zm-2-4H10v-2h8v2zm-4 4H10v-2h4v2zm4-8H10V6h8v2z' },
    { key: 'notifications', label: 'Notifications',    icon: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z' },
    { key: 'coordinators', label: 'C2S Coordinators',  icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
    { key: 'mentors',      label: 'Mentors',            icon: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z' },
    { key: 'potential',    label: 'Potential Mentees',  icon: 'M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
    { key: 'mentees',      label: 'Mentees',            icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
    { key: 'reports',      label: 'Reports',            icon: 'M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

// Schedule Interview modal removed from Cluster Head — moved to CoordinatorDashboard

// ─── Coordinator Detail Panel ─────────────────────────────────────────────────
function CoordinatorPanel({ coord, onClose }: { coord: C2SCoordinator; onClose: () => void }) {
    return (
        <>
            <div className="fixed inset-0 z-[100] bg-black/40" onClick={onClose} />
            <div className="fixed top-0 right-0 bottom-0 z-[101] w-[440px] max-w-full bg-white shadow-2xl flex flex-col overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Coordinator Profile</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Activity Overview</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-black shrink-0" style={{ background: coord.color }}>
                            {coord.initials}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-base">{coord.name}</p>
                            <p className="text-xs text-gray-400">{coord.barangay}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${coord.status === 'Active' ? 'bg-[#16a34a] text-white' : 'bg-gray-400 text-white'}`}>{coord.status}</span>
                        </div>
                    </div>
                    <section className="rounded-xl border border-gray-100 overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-2">Contact Info</p>
                        <div className="divide-y divide-gray-100">
                            {[{ label: 'Phone', value: coord.phone }, { label: 'Email', value: coord.email }].map(r => (
                                <div key={r.label} className="flex items-center justify-between px-4 py-2.5">
                                    <span className="text-xs text-gray-500">{r.label}</span>
                                    <span className="text-xs font-medium text-gray-800">{r.value}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Assigned Potential', value: coord.assignedPotential, color: '#6741d9' },
                            { label: 'Pending',            value: coord.pendingAssignments, color: '#e67700' },
                            { label: 'Avg Days',           value: coord.avgAssignmentDays,  color: '#0b9b8a' },
                        ].map(s => (
                            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                                <p className="text-2xl font-black leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
                                <p className="text-[10px] text-gray-400">{s.label}</p>
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
    const [mapType, setMapType] = useState<'Community-based' | 'Church-based' | 'All'>('All');
    const filtered = mapType === 'All' ? CH_CLUSTER_GROUPS : CH_CLUSTER_GROUPS.filter(g => g.type === mapType);
    const mapGroups = chGroupsToMapGroups(filtered);

    return (
        <div>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Interactive Map</h1>
                    <p className="text-sm text-gray-400 mt-1">Group distribution across the cluster barangays — powered by OpenStreetMap.</p>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-5">
                {(['All', 'Community-based', 'Church-based'] as const).map(t => (
                    <button key={t} onClick={() => setMapType(t as any)}
                        className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors ${mapType === t ? 'bg-[#6741d9] text-white border-[#6741d9]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                        {t}
                    </button>
                ))}
            </div>

            {/* Real OSM Map */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6 map-container">
                <ClusterMapDynamic groups={mapGroups} accentColor="#6741d9" />
            </div>

            {/* Legend */}
            <div className="flex items-center flex-wrap gap-x-6 gap-y-2 mb-5">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ background: '#6741d9' }} />
                    <span className="text-xs text-gray-600 font-medium">Community-based</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ background: '#1971c2' }} />
                    <span className="text-xs text-gray-600 font-medium">Church-based</span>
                </div>
                <p className="text-xs text-gray-400 sm:ml-auto hidden sm:block">Click a marker to see group details</p>
            </div>

            {/* Groups list */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filtered.map(g => (
                    <div key={g.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
                            style={{ background: g.type === 'Church-based' ? '#1971c2' : '#6741d9' }}>
                            {g.members}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm">{g.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{g.barangay} · {g.mentor}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${g.type === 'Church-based' ? 'bg-[#6741d9] text-white' : 'bg-[#0b9b8a] text-white'}`}>
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
    const [mapType, setMapType] = useState<'All' | 'Community-based' | 'Church-based'>('All');
    const filteredGroups = mapType === 'All' ? CH_CLUSTER_GROUPS : CH_CLUSTER_GROUPS.filter(g => g.type === mapType);
    const mapGroups = chGroupsToMapGroups(filteredGroups);

    return (
        <div>
            <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
                <div>
                    <h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Reports</h1>
                    <p className="text-xs text-gray-400 mt-0.5">{clusterName}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-2 rounded-lg bg-white hover:border-gray-300 transition-colors">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5z"/></svg>
                        Export PDF
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-2 rounded-lg bg-white hover:border-gray-300 transition-colors">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5z"/></svg>
                        Export Excel
                    </button>
                </div>
            </div>

            {/* Charts */}
            {reportsContent}

            {/* Summary stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mb-10">
                {[
                    { value: `${CH_MENTORS.length}`,           label: 'Total Mentors',     sub: clusterName,        color: '#6741d9' },
                    { value: `${CH_POTENTIAL_MENTEES.length}`, label: 'Potential Mentees', sub: 'All statuses',     color: '#5b50d6' },
                    { value: `${CH_ACTIVE_MENTEES.length}`,    label: 'Active Mentees',    sub: 'In discipleship',  color: '#0b9b8a' },
                    { value: `${CH_COORDINATORS.length}`,      label: 'C2S Coordinators',  sub: 'Active only',      color: '#e67700' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <p className="text-3xl font-black leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-sm font-semibold text-gray-800">{s.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* ── Interactive Map section ── */}
            <div className="mb-4">
                <h2 className="text-lg font-black text-gray-900">Interactive Map</h2>
                <p className="text-sm text-gray-400 mt-0.5">Group distribution across the cluster barangays — powered by OpenStreetMap.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
                {(['All', 'Community-based', 'Church-based'] as const).map(t => (
                    <button key={t} onClick={() => setMapType(t)}
                        className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors ${mapType === t ? 'bg-[#6741d9] text-white border-[#6741d9]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>{t}</button>
                ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4 map-container">
                <ClusterMapDynamic groups={mapGroups} accentColor="#6741d9" />
            </div>
            <div className="flex items-center flex-wrap gap-x-6 gap-y-2 mb-5">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ background: '#6741d9' }} />
                    <span className="text-xs text-gray-600 font-medium">Community-based</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ background: '#1971c2' }} />
                    <span className="text-xs text-gray-600 font-medium">Church-based</span>
                </div>
                <p className="text-xs text-gray-400 sm:ml-auto hidden sm:block">Click a marker to see group details</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredGroups.map(g => (
                    <div key={g.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
                            style={{ background: g.type === 'Church-based' ? '#1971c2' : '#6741d9' }}>{g.members}</div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm">{g.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{g.barangay} · {g.mentor}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${g.type === 'Church-based' ? 'bg-[#6741d9] text-white' : 'bg-[#0b9b8a] text-white'}`}>
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
        if (type === 'new_potential') return { bg: '#ede9fe', dot: '#6741d9', icon: <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/> };
        if (type === 'assignment') return { bg: '#e0f0ff', dot: '#1971c2', icon: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/> };
        return { bg: '#d3f9f0', dot: '#0b9b8a', icon: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/> };
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
                        className="text-xs font-semibold text-[#6741d9] hover:underline">Mark all as read</button>
                )}
            </div>
            <div className="divide-y divide-gray-50">
                {notifs.map(n => {
                    const ic = iconFor(n.type);
                    return (
                        <div key={n.id} onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                            className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition-colors hover:bg-gray-50 ${!n.read ? 'bg-[#faf8ff]' : ''}`}>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: ic.bg }}>
                                <svg className="w-4.5 h-4.5" width="18" height="18" viewBox="0 0 24 24" fill={ic.dot}>{ic.icon}</svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-snug ${n.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>{n.text}</p>
                                <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                            </div>
                            {!n.read && <div className="w-2 h-2 rounded-full bg-[#6741d9] shrink-0 mt-1.5" />}
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
        if (type === 'new_potential') return { bg: '#ede9fe', dot: '#6741d9', icon: <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/> };
        if (type === 'assignment') return { bg: '#e0f0ff', dot: '#1971c2', icon: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/> };
        return { bg: '#d3f9f0', dot: '#0b9b8a', icon: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/> };
    };
    return (
        <div>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Notifications</h1>
                    <p className="text-sm text-gray-400 mt-1">{unread} unread notification{unread !== 1 ? 's' : ''}</p>
                </div>
                {unread > 0 && (
                    <button onClick={() => setNotifs(prev => prev.map(n => ({ ...n, read: true })))}
                        className="text-xs font-semibold text-[#6741d9] hover:underline">Mark all as read</button>
                )}
            </div>
            <div className="flex flex-col gap-3">
                {notifs.map(n => {
                    const ic = iconFor(n.type);
                    return (
                        <div key={n.id} className={`bg-white rounded-2xl border p-5 flex items-start gap-4 transition-colors ${n.read ? 'border-gray-100' : 'border-[#6741d9]/30 bg-[#faf8ff]'}`}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: ic.bg }}>
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill={ic.dot}>{ic.icon}</svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-snug ${n.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>{n.text}</p>
                                <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                            </div>
                            {!n.read && <div className="w-2 h-2 rounded-full bg-[#6741d9] shrink-0 mt-1.5" />}
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
        if (s === 'Active')          return 'bg-[#16a34a] text-white';
        if (s === 'Needs Follow-up') return 'bg-[#b45309] text-white';
        return 'bg-gray-400 text-white';
    };

    return (
        <div>
            {/* Back link */}
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 font-medium mb-6 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
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
                            <h1 className="text-2xl font-bold text-gray-900">{mentor.name}</h1>
                            <span className={`text-[15px] font-bold px-2.5 py-1 rounded-full ${mentor.status === 'Active' ? 'bg-[#16a34a] text-white' : 'bg-gray-400 text-white'}`}>
                                {mentor.status}
                            </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-0.5">{mentor.id}</p>
                    </div>
                </div>

                {/* 4-field info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                    <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Contact</p>
                        <div className="flex items-center gap-2 text-sm text-gray-800">
                            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                            {mentor.phone}
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Email</p>
                        <div className="flex items-center gap-2 text-sm text-gray-800">
                            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                            {mentor.email}
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Barangay</p>
                        <div className="flex items-center gap-2 text-sm text-gray-800">
                            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                            {mentor.barangay}
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Address</p>
                        <div className="flex items-center gap-2 text-sm text-gray-800">
                            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                            {mentor.groups[0]?.address ?? mentor.group}
                        </div>
                    </div>
                </div>
            </div>

            {/* My Groups section */}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                        <h2 className="text-lg font-bold text-gray-900">Groups</h2>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 ml-6">All C2S groups assigned to this mentor.</p>
                </div>
                <span className="text-xs font-semibold text-[#6741d9] bg-[#ede9fe] px-3 py-1 rounded-full">
                    {mentor.groups.length} group{mentor.groups.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {mentor.groups.map((g, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between gap-5">
                        <div>
                            <p className="font-bold text-gray-900 text-lg mb-3">{g.name}</p>
                            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                                    {g.barangay}
                                </span>
                                {g.schedule && (
                                    <span className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
                                        {g.schedule}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <span className="flex items-center gap-2 text-sm text-gray-400">
                                Active Mentees
                                <span className="text-base font-bold text-[#6741d9]">{g.mentees}</span>
                            </span>
                            <button
                                onClick={() => setViewingGroup(g.name)}
                                className="text-sm font-semibold text-[#6741d9] hover:underline">
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
                        <div className="fixed inset-0 z-[100] bg-black/40" onClick={() => { setViewingGroup(null); setMenteeSearch(''); setMenteeStatusFilter('All'); }} />
                        <div className="fixed inset-0 z-[101] flex items-center justify-center p-3 sm:p-6" onClick={() => { setViewingGroup(null); setMenteeSearch(''); setMenteeStatusFilter('All'); }}>
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]" onClick={e => e.stopPropagation()}>

                                {/* Modal header */}
                                <div className="px-5 sm:px-8 pt-6 pb-5 border-b border-gray-100 flex items-start justify-between shrink-0">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{grp.name}</h2>
                                        <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500">
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                                                {grp.barangay}
                                            </span>
                                            {grp.schedule && (
                                                <span className="flex items-center gap-1.5">
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
                                                    {grp.schedule}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={() => { setViewingGroup(null); setMenteeSearch(''); setMenteeStatusFilter('All'); }} className="text-gray-400 hover:text-gray-700 p-1 transition-colors">
                                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                                    </button>
                                </div>

                                {/* Search + filter + count */}
                                <div className="px-4 sm:px-8 py-3 border-b border-gray-100 flex items-center gap-2 shrink-0">
                                    <div className="relative flex-1 min-w-0">
                                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
                                        <input
                                            type="text"
                                            placeholder=""
                                            value={menteeSearch}
                                            onChange={e => setMenteeSearch(e.target.value)}
                                            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6741d9] bg-white"
                                        />
                                    </div>
                                    <select
                                        value={menteeStatusFilter}
                                        onChange={e => setMenteeStatusFilter(e.target.value)}
                                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#6741d9] cursor-pointer shrink-0"
                                    >
                                        {statusOptions.map(o => <option key={o}>{o}</option>)}
                                    </select>
                                    <span className="text-xs font-semibold text-[#6741d9] bg-[#ede9fe] px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
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
                                                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
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
export default function ClusterHeadDashboard({ onLogout, reportsContent }: { onLogout: () => void; reportsContent?: ReactNode }) {
    const { user } = useAuth();
    const [activeNav, setActiveNav] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [mentorProfilePage, setMentorProfilePage] = useState<ClusterMentor | null>(null);
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
        const matchSearch = m.name.toLowerCase().includes(ms) || m.group.toLowerCase().includes(ms);
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
    const totalMentors        = CH_MENTORS.length;
    const totalPotential      = CH_POTENTIAL_MENTEES.length;
    const totalActiveMentees  = CH_ACTIVE_MENTEES.length;
    const communityGroups     = CH_CLUSTER_GROUPS.filter(g => g.type === 'Community-based').length;
    const churchGroups        = CH_CLUSTER_GROUPS.filter(g => g.type === 'Church-based').length;
    const activeGroups        = CH_CLUSTER_GROUPS.length;
    const totalCoordinators   = CH_COORDINATORS.length;
    const totalAssigned       = CH_COORDINATORS.reduce((s, c) => s + c.assignedPotential, 0);
    const totalPending        = CH_COORDINATORS.reduce((s, c) => s + c.pendingAssignments, 0);
    const avgDays             = Math.round(CH_COORDINATORS.reduce((s, c) => s + c.avgAssignmentDays, 0) / CH_COORDINATORS.length);

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
                    className="fixed inset-0 z-[1001] bg-black/40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Left Sidebar ── */}
            <aside className={`sidebar-nav w-56 border-r flex flex-col pt-6 pb-4 fixed top-nav-fixed bottom-0 left-0 z-[1002] transition-transform duration-200
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <p className="px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Menu</p>
                <nav className="px-3 flex flex-col gap-1 flex-1 overflow-y-auto">
                    {CH_NAV.map((item) => (
                        <button key={item.key} onClick={() => { setActiveNav(item.key); setSidebarOpen(false); if (item.key !== 'mentors') setMentorProfilePage(null); }}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full text-left relative ${activeNav === item.key ? 'nav-item-active text-gray-800 shadow-sm' : 'text-gray-500 hover:bg-white/60 dark:hover:bg-white/10'}`}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill={activeNav === item.key ? '#6741d9' : '#aaa'}>
                                <path d={item.icon} />
                            </svg>
                            {item.label}
                            {item.key === 'notifications' && unreadCount > 0 && (
                                <span className="ml-auto text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full bg-[#5b50d6] text-white shrink-0">{unreadCount}</span>
                            )}
                        </button>
                    ))}
                </nav>
                {/* Settings at bottom */}
                <div className="mt-auto px-3 pt-3 border-t border-gray-100 mx-2">
                    <button
                        onClick={() => { setShowSettings(true); setSidebarOpen(false); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full text-left text-gray-500 hover:bg-white/60"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#aaa">
                            <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87a.47.47 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.47.47 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.37 1.04.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 0 0-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                        </svg>
                        Settings
                    </button>
                </div>
            </aside>
            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

            {/* ── Main ── */}
            <div className="w-full md:ml-56 pb-16 min-w-0 overflow-x-hidden">

                    {/* Mobile sticky menu bar */}
                    <div className="md:hidden fixed top-nav-fixed left-0 right-0 z-20 mobile-menu-bar px-4 py-2.5 flex items-center gap-2">
                        <button
                            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open menu"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                            </svg>
                        </button>
                        <span className="text-xs text-gray-400 ml-1">
                            {activeNav === 'dashboard' ? 'Dashboard' : CH_NAV.find(n => n.key === activeNav)?.label ?? ''}
                        </span>
                    </div>

                    <div className="pt-[72px] md:pt-5 px-4 sm:px-6">
                    {activeNav === 'dashboard' && (
                        <div>
                            <div className="mb-5">
                                <h1 className="text-2xl font-black text-gray-900">Connect 2 Souls</h1>
                                <p className="text-sm text-gray-400 mt-0.5">Connect, disciple and guide souls on their spiritual journey through meaningful relationships and faithful follow-up.</p>
                            </div>
                            <SharedDashboardTab data={CHURCH_WIDE_DATA} />
                        </div>
                    )}


                    {/* ── Coordinators Tab ── */}
                    {activeNav === 'coordinators' && (
                        <div>
                            <div className="mb-6">
                                <h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">C2S Coordinators</h1>
                                <p className="text-sm text-gray-400 mt-1">Monitor coordinator activities within {clusterName}.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
                                {[
                                    { label: 'Assigned Potential', value: totalAssigned, color: '#6741d9' },
                                    { label: 'Pending Assignments', value: totalPending, color: '#e67700' },
                                    { label: 'Avg Assignment Time', value: `${avgDays} days`, color: '#0b9b8a' },
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
                                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${c.status === 'Active' ? 'bg-[#16a34a] text-white' : 'bg-gray-400 text-white'}`}>{c.status}</span>
                                                </div>
                                                <div className="flex gap-3 mt-2 text-xs text-gray-500">
                                                    <span>{c.phone}</span>
                                                    <span className="truncate">{c.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { label: 'Assigned',  value: c.assignedPotential, color: '#6741d9' },
                                                { label: 'Pending',   value: c.pendingAssignments, color: '#e67700' },
                                                { label: 'Avg Days',  value: `${c.avgAssignmentDays}d`, color: '#0b9b8a' },
                                            ].map(s => (
                                                <div key={s.label} className="rounded-xl p-3 text-center border" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}>
                                                    <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
                                                    <p className="text-[10px] text-gray-400">{s.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="rounded-xl p-3" style={{ background: 'var(--bg-subtle)' }}>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Recent Activities</p>
                                            {c.recentActivities.slice(0, 2).map((a, i) => (
                                                <p key={i} className="text-xs text-gray-600 leading-snug mb-1">• {a.text} <span className="text-gray-400 text-[10px]">({a.time})</span></p>
                                            ))}
                                        </div>
                                        <button onClick={() => setViewingCoord(c)} className="text-xs font-semibold text-white px-4 py-2 rounded-lg transition-colors" style={{ background: '#6741d9' }}>
                                            View Full Profile
                                        </button>
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
                                <h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Mentors</h1>
                                <p className="text-sm text-gray-400 mt-1">All mentors within {clusterName}.</p>
                            </div>

                            {/* Info banner */}
                            <div className="flex items-start gap-3 bg-[#5b50d6] rounded-xl px-4 py-3 mb-6">
                                <svg className="w-4 h-4 text-[#6741d9] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                                <p className="text-xs text-white">Mentors are created exclusively through the Endorsement Approval process. No manual creation allowed.</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                <div className="relative flex-1 max-w-xs">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
                                    <input type="text" placeholder="Search mentors..." value={mentorSearch} onChange={e => setMentorSearch(e.target.value)}
                                        className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6741d9] w-full bg-white" />
                                </div>
                                {(['All', 'Active', 'Inactive'] as const).map(f => (
                                    <button key={f} onClick={() => setMentorFilter(f)}
                                        className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors ${mentorFilter === f ? 'bg-[#6741d9] text-white border-[#6741d9]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>{f}</button>
                                ))}
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
                                                        </div>
                                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${m.status === 'Active' ? 'bg-[#16a34a] text-white' : 'bg-gray-400 text-white'}`}>{m.status}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-base text-gray-500">
                                                        <span className="flex items-center gap-1.5">
                                                            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                                                            {m.barangay}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                                                            {m.phone}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                                                            {m.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* My Groups section */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                                                        <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                                                        Groups
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-[#6741d9]">{m.groups.length} group{m.groups.length !== 1 ? 's' : ''}</span>
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
                                                    <button onClick={() => setMentorProfilePage(m)} className="mt-2 text-xs font-semibold text-[#6741d9] hover:underline">
                                                        +{extraGroups} more
                                                    </button>
                                                )}
                                            </div>

                                            {/* View Profile */}
                                            <button onClick={() => setMentorProfilePage(m)} className="self-start text-xs font-semibold text-gray-700 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                                                View Profile
                                            </button>
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
                                <h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Potential Mentees</h1>
                                <p className="text-sm text-gray-400 mt-1">All new potential mentees within {clusterName}.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 mb-6">
                                <div className="relative w-full sm:w-auto">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
                                    <input type="text" placeholder="Search..." value={potentialSearch} onChange={e => setPotentialSearch(e.target.value)}
                                        className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6741d9] w-full sm:w-48 bg-white" />
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                {statusFilters.map(f => (
                                    <button key={f} onClick={() => setPotentialFilter(f)}
                                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${potentialFilter === f ? 'bg-[#6741d9] text-white border-[#6741d9]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>{f}</button>
                                ))}
                                </div>
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
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.sourceColor}`}>{m.source}</span>
                                        </div>
                                        <p className="text-xs text-gray-600">{m.requestedGroup}</p>
                                        <p className="text-xs text-gray-500">{m.assignedCoordinator ?? '—'}</p>
                                        <span className={`self-start text-[10px] font-semibold px-2.5 py-1 rounded-full ${CLUSTER_STATUS_STYLE[m.clusterStatus]}`}>{m.clusterStatus}</span>
                                    </div>
                                ))}
                                {filteredPotential.length === 0 && (
                                    <div className="p-10 text-center">
                                        <p className="font-semibold text-gray-700 text-sm">No potential mentees found</p>
                                    </div>
                                )}
                            </div>
                            {/* Desktop table */}
                            <div className="hidden sm:block bg-white rounded-2xl border border-gray-200">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-[#f8f9fc] text-[10px] text-gray-400 uppercase tracking-widest">
                                            {['Name', 'Age / Gender', 'Source', 'Requested Group', 'Coordinator', 'Status'].map(h => (
                                                <th key={h} className="px-3 py-3 text-left font-semibold">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredPotential.map(m => (
                                            <tr key={m.id} className="hover:bg-[#f8f9fc] transition-colors">
                                                <td className="px-3 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0" style={{ background: avatarColor(m.id) }}>{m.initials}</div>
                                                        <span className="font-semibold text-gray-900">{m.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3.5 text-xs text-gray-500">{m.age} · {m.gender}</td>
                                                <td className="px-3 py-3.5"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.sourceColor}`}>{m.source}</span></td>
                                                <td className="px-3 py-3.5 text-xs text-gray-600">{m.requestedGroup}</td>
                                                <td className="px-3 py-3.5 text-xs text-gray-500">{m.assignedCoordinator ?? '—'}</td>
                                                <td className="px-3 py-3.5">
                                                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${CLUSTER_STATUS_STYLE[m.clusterStatus]}`}>{m.clusterStatus}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                        const totalMentees    = CH_ACTIVE_MENTEES.length + INACTIVE_MENTEES.filter(m => m.reason !== 'Transferred').length;
                        const activeCnt       = CH_ACTIVE_MENTEES.length;
                        const inactiveCnt     = INACTIVE_MENTEES.filter(m => m.reason === 'Inactive').length;
                        const transferredCnt  = INACTIVE_MENTEES.filter(m => m.reason === 'Transferred').length;
                        const activePct       = Math.round((activeCnt / totalMentees) * 100);
                        // donut params
                        const r = 40, circ = 2 * Math.PI * r;
                        const dash = (activePct / 100) * circ;

                        const reasonBadge = (r: string) => {
                            if (r === 'Completed')  return 'border border-[#22c55e] text-[#15803d]';
                            if (r === 'Transferred') return 'border border-[#3b82f6] text-[#1d4ed8]';
                            return 'border border-gray-300 text-gray-500';
                        };

                        return (
                        <div>
                            <div className="mb-6">
                                <h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Mentees</h1>
                                <p className="text-sm text-gray-400 mt-1">Connect, disciple and guide souls on their spiritual journey through meaningful relationships and faithful follow-up.</p>
                            </div>

                            {/* ── Stats row ── */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-8 items-stretch">
                                {/* Donut card */}
                                <div className="bg-white rounded-2xl border border-gray-200 px-5 py-5 flex items-center gap-5 sm:shrink-0">
                                    <div className="min-w-0 flex-1 sm:flex-none">
                                        <p className="text-sm font-bold text-gray-800 leading-tight">Mentee Status</p>
                                        <p className="text-[11px] text-gray-400 mb-4">Active vs Inactive</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-700 mb-2">
                                            <span className="w-3 h-3 rounded-full bg-[#3b82f6] shrink-0" />
                                            Active&nbsp;<span className="font-bold">{activeCnt}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <span className="w-3 h-3 rounded-full bg-gray-200 shrink-0" />
                                            Inactive&nbsp;<span className="font-bold">{INACTIVE_MENTEES.length}</span>
                                        </div>
                                    </div>
                                    <div className="relative shrink-0 w-[120px] h-[120px] sm:w-[140px] sm:h-[140px]">
                                        <svg width="120" height="120" viewBox="0 0 140 140" className="sm:hidden">
                                            <circle cx="70" cy="70" r="52" fill="none" stroke="#e5e7eb" strokeWidth="14" />
                                            <circle cx="70" cy="70" r="52" fill="none" stroke="#3b82f6" strokeWidth="14"
                                                strokeDasharray={`${(activePct / 100) * (2 * Math.PI * 52)} ${(2 * Math.PI * 52) - (activePct / 100) * (2 * Math.PI * 52)}`}
                                                strokeLinecap="butt"
                                                transform="rotate(-90 70 70)" />
                                        </svg>
                                        <svg width="140" height="140" viewBox="0 0 140 140" className="hidden sm:block">
                                            <circle cx="70" cy="70" r="52" fill="none" stroke="#e5e7eb" strokeWidth="14" />
                                            <circle cx="70" cy="70" r="52" fill="none" stroke="#3b82f6" strokeWidth="14"
                                                strokeDasharray={`${(activePct / 100) * (2 * Math.PI * 52)} ${(2 * Math.PI * 52) - (activePct / 100) * (2 * Math.PI * 52)}`}
                                                strokeLinecap="butt"
                                                transform="rotate(-90 70 70)" />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-xl sm:text-2xl font-black text-gray-900 leading-none">{activePct}%</span>
                                            <span className="text-[9px] text-gray-400 uppercase tracking-wide mt-1">ACTIVE</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stat cards — 2x2 on mobile, row on desktop */}
                                <div className="grid grid-cols-2 sm:grid-cols-1 sm:flex sm:flex-1 gap-4">
                                    {[
                                        { label: 'Total Mentees', value: totalMentees,   color: '#6741d9' },
                                        { label: 'Active',        value: activeCnt,      color: '#ef4444' },
                                        { label: 'Inactive',      value: inactiveCnt,    color: '#3b82f6' },
                                        { label: 'Transferred',   value: transferredCnt, color: '#0b9b8a' },
                                    ].map(s => (
                                        <div key={s.label} className="bg-white rounded-2xl border border-gray-200 px-4 sm:px-7 py-5 flex flex-col justify-center sm:flex-1 dark:bg-gray-800 dark:border-gray-700">
                                            <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-2 dark:text-gray-300">{s.label}</p>
                                            <p className="font-black leading-none" style={{ color: s.color, fontSize: 'clamp(1.75rem, 5vw, 2.75rem)' }}>{s.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Active Mentees cards ── */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-sm font-bold text-gray-700">Active Mentees <span className="text-gray-400 font-normal">({filteredActiveMentees.length})</span></h2>
                                    <div className="relative">
                                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
                                        <input type="text" placeholder="Search mentees..." value={activeMenteeSearch} onChange={e => setActiveMenteeSearch(e.target.value)}
                                            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6741d9] bg-white w-52" />
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
                                                </div>
                                                <div>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[11px] text-gray-500">{m.currentModule}</span>
                                                        <span className="text-[11px] font-semibold text-gray-700">{m.progress}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full" style={{ width: `${m.progress}%`, background: '#6741d9' }} />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setViewingActiveMentee(m)} className="text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-300 transition-colors">View Profile</button>
                                                    <button onClick={() => setUpdatingMentee(m)} className="text-xs font-semibold text-[#6741d9] border border-[#6741d9] px-3 py-1.5 rounded-lg hover:bg-[#f5f3ff] transition-colors">Devotional</button>
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
                                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${reasonBadge(m.reason)}`}>{m.reason}</span>
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
                                        <table className="w-full text-sm min-w-[520px]">
                                            <thead>
                                                <tr className="border-b border-gray-100 text-[10px] text-gray-400 uppercase tracking-widest">
                                                    {['Name', 'Assigned Group', 'Date Became Inactive', 'Last Devotional Manual', 'Reason', 'Actions'].map(h => (
                                                        <th key={h} className="px-3 py-3.5 text-left font-semibold">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {filtered.map(m => (
                                                    <tr key={m.id} className="hover:bg-[#f8f9fc] transition-colors">
                                                        <td className="px-3 py-4 font-semibold text-gray-900">{m.name}</td>
                                                        <td className="px-3 py-4 text-gray-500">{m.assignedGroup}</td>
                                                        <td className="px-3 py-4 text-gray-500">{m.dateInactive}</td>
                                                        <td className="px-3 py-4 text-gray-500">{m.lastModule}</td>
                                                        <td className="px-3 py-4">
                                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${reasonBadge(m.reason)}`}>{m.reason}</span>
                                                        </td>
                                                        <td className="px-3 py-4">
                                                            <button
                                                                onClick={() => setViewingActiveMentee(buildFakeMentee(m))}
                                                                className="text-xs text-gray-500 hover:underline font-medium"
                                                            >View Profile</button>
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
                    {activeNav === 'reports' && <CHReportsTab clusterName={clusterName} reportsContent={reportsContent} />}

                    {/* ── Notifications Tab ── */}
                    {activeNav === 'notifications' && <NotificationsTab />}

                </div>{/* end inner pt-5 div */}
            </div>
        </div>
    );
}
