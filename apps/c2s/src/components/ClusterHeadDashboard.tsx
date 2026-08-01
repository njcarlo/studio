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
const AVATAR_COLORS = ['#5b50d6', '#e91e8c', '#0b9b8a', '#e67700', '#6741d9'];
function avatarColor(id: string) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ─── Status badge styles ─────────────────────────────────────────────────────
const CLUSTER_STATUS_STYLE: Record<string, string> = {
    'New':                  'bg-[#dbeafe] text-[#1d4ed8]',
    'Waiting for Assignment': 'bg-[#fef9c3] text-[#92400e]',
    'Assigned to Mentor':   'bg-[#ede9fe] text-[#6741d9]',
    'Interview Scheduled':  'bg-[#fde8ef] text-[#e6184d]',
    'Interview Completed':  'bg-[#d3f9f0] text-[#0c8a6e]',
    'Accepted':             'bg-[#dcfce7] text-[#166534]',
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
    { key: 'mentees',      label: 'Active Mentees',     icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
    { key: 'reports',      label: 'Reports',            icon: 'M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Read-only interview scheduling modal for Cluster Head */
function InterviewModal({ mentee, onClose }: { mentee: ClusterPotentialMentee; onClose: () => void }) {
    const [date, setDate] = useState(mentee.interviewDate ?? '');
    const [time, setTime] = useState('10:00');
    const [notes, setNotes] = useState('');
    const [done, setDone] = useState(false);
    return (
        <>
            <div className="fixed inset-0 z-[100] bg-black/40" onClick={onClose} />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 flex flex-col gap-5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Schedule Interview</h2>
                            <p className="text-xs text-gray-400 mt-0.5">For {mentee.name}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                        </button>
                    </div>
                    <div className="flex flex-col gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Interview Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6741d9]" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Interview Time</label>
                            <input type="time" value={time} onChange={e => setTime(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6741d9]" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
                            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                                placeholder="Interview notes or preparation..."
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6741d9] resize-none" />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 text-sm font-semibold text-gray-600 border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                        <button
                            onClick={() => { setDone(true); setTimeout(onClose, 900); }}
                            className="flex-1 text-sm font-semibold text-white px-4 py-2.5 rounded-lg transition-colors"
                            style={{ background: done ? '#22c55e' : '#6741d9' }}>
                            {done ? 'Scheduled!' : 'Schedule Interview'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

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
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${coord.status === 'Active' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-gray-100 text-gray-500'}`}>{coord.status}</span>
                        </div>
                    </div>
                    <section className="rounded-xl border border-gray-100 bg-[#f8f9fc] overflow-hidden">
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
            <div className="flex items-center gap-2 mb-5">
                {(['All', 'Community-based', 'Church-based'] as const).map(t => (
                    <button key={t} onClick={() => setMapType(t as any)}
                        className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors ${mapType === t ? 'bg-[#6741d9] text-white border-[#6741d9]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                        {t}
                    </button>
                ))}
            </div>

            {/* Real OSM Map */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6" style={{ height: 440 }}>
                <ClusterMapDynamic groups={mapGroups} accentColor="#6741d9" />
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mb-5">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ background: '#6741d9' }} />
                    <span className="text-xs text-gray-600 font-medium">Community-based</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ background: '#1971c2' }} />
                    <span className="text-xs text-gray-600 font-medium">Church-based</span>
                </div>
                <p className="text-xs text-gray-400 ml-auto">Click a marker to see group details</p>
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
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${g.type === 'Church-based' ? 'bg-[#ede9fe] text-[#6741d9]' : 'bg-[#d3f9f0] text-[#0c8a6e]'}`}>
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
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Reports</h1>
                    <p className="text-xs text-gray-400 mt-0.5">{clusterName}</p>
                </div>
                <div className="flex items-center gap-2">
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
                    { value: `${CH_POTENTIAL_MENTEES.length}`, label: 'Potential Mentees', sub: 'All statuses',     color: '#e91e8c' },
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
            <div className="flex items-center gap-2 mb-4">
                {(['All', 'Community-based', 'Church-based'] as const).map(t => (
                    <button key={t} onClick={() => setMapType(t)}
                        className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors ${mapType === t ? 'bg-[#6741d9] text-white border-[#6741d9]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>{t}</button>
                ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4" style={{ height: 420 }}>
                <ClusterMapDynamic groups={mapGroups} accentColor="#6741d9" />
            </div>
            <div className="flex items-center gap-6 mb-5">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ background: '#6741d9' }} />
                    <span className="text-xs text-gray-600 font-medium">Community-based</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ background: '#1971c2' }} />
                    <span className="text-xs text-gray-600 font-medium">Church-based</span>
                </div>
                <p className="text-xs text-gray-400 ml-auto">Click a marker to see group details</p>
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
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${g.type === 'Church-based' ? 'bg-[#ede9fe] text-[#6741d9]' : 'bg-[#d3f9f0] text-[#0c8a6e]'}`}>
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
    const [menteeSearch, setMenteeSearch] = useState('');
    const [menteeGroupFilter, setMenteeGroupFilter] = useState('All Groups');
    const [menteeStatusFilter, setMenteeStatusFilter] = useState('All Statuses');
    const [viewingGroup, setViewingGroup] = useState<string | null>(null);

    const groupOptions = ['All Groups', ...mentor.groups.map(g => g.name)];
    const statusOptions = ['All Statuses', 'Active', 'Needs Follow-up', 'Inactive'];

    const filteredMentees = mentor.mentees.filter(mt => {
        const matchSearch = mt.name.toLowerCase().includes(menteeSearch.toLowerCase());
        const matchGroup  = menteeGroupFilter  === 'All Groups'   || mt.group  === menteeGroupFilter;
        const matchStatus = menteeStatusFilter === 'All Statuses' || mt.status === menteeStatusFilter;
        return matchSearch && matchGroup && matchStatus;
    });

    const statusBadge = (s: string) => {
        if (s === 'Active')          return 'bg-[#dcfce7] text-[#166534]';
        if (s === 'Needs Follow-up') return 'bg-[#fef3c7] text-[#92400e]';
        return 'bg-gray-100 text-gray-500';
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
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${mentor.status === 'Active' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-gray-100 text-gray-500'}`}>
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
                        <h2 className="text-lg font-bold text-gray-900">My Groups</h2>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 ml-6">All C2S groups assigned to this mentor.</p>
                </div>
                <span className="text-xs font-semibold text-[#6741d9] bg-[#ede9fe] px-3 py-1 rounded-full">
                    {mentor.groups.length} group{mentor.groups.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {mentor.groups.map((g, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col justify-between gap-4">
                        <div>
                            <p className="font-semibold text-gray-900 text-sm mb-2">{g.name}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
                                <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                                    {g.barangay}
                                </span>
                                {g.schedule && (
                                    <span className="flex items-center gap-1">
                                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
                                        {g.schedule}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                Active Mentees
                                <span className="text-sm font-bold text-[#6741d9]">{g.mentees}</span>
                            </span>
                            <button
                                onClick={() => setViewingGroup(g.name)}
                                className="text-[10px] font-semibold text-[#6741d9] hover:underline">
                                View Details
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Group Detail Modal ── */}
            {viewingGroup && (() => {
                const grp = mentor.groups.find(g => g.name === viewingGroup)!;
                const grpMentees = mentor.mentees.filter(mt => mt.group === viewingGroup);
                return (
                    <>
                        <div className="fixed inset-0 z-[100] bg-black/40" onClick={() => setViewingGroup(null)} />
                        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4" onClick={() => setViewingGroup(null)}>
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                                {/* Modal header */}
                                <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between">
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900">{grp.name}</h2>
                                        <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                                                {grp.barangay}
                                            </span>
                                            {grp.schedule && (
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
                                                    {grp.schedule}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={() => setViewingGroup(null)} className="text-gray-400 hover:text-gray-700 p-1 transition-colors">
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                                    </button>
                                </div>

                                {/* Mentee count pill */}
                                <div className="px-6 py-3 border-b border-gray-50 flex items-center gap-2">
                                    <span className="text-xs font-semibold text-[#6741d9] bg-[#ede9fe] px-2.5 py-1 rounded-full">
                                        {grpMentees.length} mentee{grpMentees.length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {/* Mentee list */}
                                <div className="overflow-y-auto max-h-[60vh] divide-y divide-gray-50">
                                    {grpMentees.length === 0 ? (
                                        <div className="p-10 text-center">
                                            <p className="text-sm font-semibold text-gray-600">No mentees in this group</p>
                                        </div>
                                    ) : grpMentees.map(mt => (
                                        <div key={mt.id} className="flex items-start gap-4 px-6 py-4">
                                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0" style={{ background: mt.color }}>
                                                {mt.initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900 leading-tight">{mt.name}</p>
                                                        <p className="text-[10px] text-gray-400">{mt.id}</p>
                                                    </div>
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusBadge(mt.status)}`}>
                                                        {mt.status}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                                                    <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
                                                    {mt.lesson}
                                                </p>
                                                <div className="flex items-center gap-4 mt-1.5 text-[10px] text-gray-400">
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

            {/* ── Mentees section ── */}
            <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">Mentees</h2>
                <p className="text-xs text-gray-400 mt-0.5">All mentees under this mentor across every group. View-only.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
                    <input type="text" placeholder="Search mentees..." value={menteeSearch} onChange={e => setMenteeSearch(e.target.value)}
                        className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6741d9] w-48 bg-white" />
                </div>
                <div className="relative">
                    <select value={menteeGroupFilter} onChange={e => setMenteeGroupFilter(e.target.value)}
                        className="text-xs border border-gray-200 rounded-xl px-3 py-2 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-[#6741d9] appearance-none cursor-pointer">
                        {groupOptions.map(o => <option key={o}>{o}</option>)}
                    </select>
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                </div>
                <div className="relative">
                    <select value={menteeStatusFilter} onChange={e => setMenteeStatusFilter(e.target.value)}
                        className="text-xs border border-gray-200 rounded-xl px-3 py-2 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-[#6741d9] appearance-none cursor-pointer">
                        {statusOptions.map(o => <option key={o}>{o}</option>)}
                    </select>
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                </div>
            </div>

            {/* Mentee cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMentees.map(mt => (
                    <div key={mt.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0" style={{ background: mt.color }}>
                                {mt.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-1">
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm leading-tight">{mt.name}</p>
                                        <p className="text-[10px] text-gray-400">{mt.id}</p>
                                    </div>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${statusBadge(mt.status)}`}>
                                        {mt.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-0.5 text-[11px] text-gray-500">
                            <span className="flex items-center gap-1.5 flex-wrap">
                                <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                                <span className="font-medium text-gray-700">{mt.group}</span>
                                <span className="text-gray-300">·</span>
                                <span>{mt.barangay}</span>
                                <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
                                <span className="font-semibold text-gray-700">{mt.lesson}</span>
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 border-t border-gray-100 pt-2.5">
                            <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                                Devotion: {mt.devotionDate}
                            </span>
                            <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 5h-2v6l5.25 3.15.75-1.23-4-2.42V7z"/></svg>
                                Att: {mt.attendanceDate}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {filteredMentees.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                    <p className="text-sm font-semibold text-gray-700">No mentees found</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
                </div>
            )}
        </div>
    );
}

// ─── Main Cluster Head Dashboard ─────────────────────────────────────────────
export default function ClusterHeadDashboard({ onLogout, reportsContent }: { onLogout: () => void; reportsContent?: ReactNode }) {
    const { user } = useAuth();
    const [activeNav, setActiveNav] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [viewingCoord, setViewingCoord] = useState<C2SCoordinator | null>(null);
    const [mentorProfilePage, setMentorProfilePage] = useState<ClusterMentor | null>(null);
    const [interviewMentee, setInterviewMentee] = useState<ClusterPotentialMentee | null>(null);
    const [viewingActiveMentee, setViewingActiveMentee] = useState<Mentee | null>(null);
    const [mentorSearch, setMentorSearch] = useState('');
    const [mentorFilter, setMentorFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
    const [potentialSearch, setPotentialSearch] = useState('');
    const [potentialFilter, setPotentialFilter] = useState<string>('All');
    const [activeMenteeSearch, setActiveMenteeSearch] = useState('');
    const clusterName = user?.cluster ?? 'Outreach Cluster 4';
    const unreadCount = CH_NOTIFICATIONS.filter(n => !n.read).length;

    const allMentors = CH_MENTORS;
    const filteredMentors = allMentors.filter(m => {
        const ms = mentorSearch.toLowerCase();
        const matchSearch = m.name.toLowerCase().includes(ms) || m.group.toLowerCase().includes(ms);
        const matchFilter = mentorFilter === 'All' || m.status === mentorFilter;
        return matchSearch && matchFilter;
    });

    const statusFilters = ['All', 'New', 'Waiting for Assignment', 'Assigned to Mentor', 'Interview Scheduled', 'Interview Completed', 'Accepted'];
    const filteredPotential = CH_POTENTIAL_MENTEES.filter(m => {
        const ms = potentialSearch.toLowerCase();
        const matchSearch = m.name.toLowerCase().includes(ms);
        const matchFilter = potentialFilter === 'All' || m.clusterStatus === potentialFilter;
        return matchSearch && matchFilter;
    });

    const filteredActiveMentees = CH_ACTIVE_MENTEES.filter(m => m.name.toLowerCase().includes(activeMenteeSearch.toLowerCase()));

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
        <div className="flex min-h-screen" style={{ background: '#EEF2F7' }}>
            {/* Modals */}
            {viewingCoord && <CoordinatorPanel coord={viewingCoord} onClose={() => setViewingCoord(null)} />}
            {interviewMentee && <InterviewModal mentee={interviewMentee} onClose={() => setInterviewMentee(null)} />}
            {viewingActiveMentee && <MenteeProfileModal mentee={viewingActiveMentee} onClose={() => setViewingActiveMentee(null)} />}

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Left Sidebar ── */}
            <aside className={`w-56 shrink-0 bg-[#f4f5f7] border-r border-gray-200 flex flex-col pt-6 pb-4 fixed top-16 bottom-0 left-0 z-40 transition-transform duration-200
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <p className="px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Menu</p>
                <nav className="px-3 flex flex-col gap-1 flex-1 overflow-y-auto">
                    {CH_NAV.map((item) => (
                        <button key={item.key} onClick={() => { setActiveNav(item.key); setSidebarOpen(false); if (item.key !== 'mentors') setMentorProfilePage(null); }}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full text-left relative ${activeNav === item.key ? 'text-gray-800 bg-white shadow-sm' : 'text-gray-500 hover:bg-white/60'}`}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill={activeNav === item.key ? '#6741d9' : '#aaa'}>
                                <path d={item.icon} />
                            </svg>
                            {item.label}
                            {item.key === 'notifications' && unreadCount > 0 && (
                                <span className="ml-auto text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full bg-[#e91e8c] text-white shrink-0">{unreadCount}</span>
                            )}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* ── Main ── */}
            <div className="md:ml-56 flex-1 pt-6 px-4 sm:px-6 pb-16">

                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden mb-4 flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                        </svg>
                        Menu
                    </button>

                    {/* ── Dashboard Tab ── */}
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
                            <div className="grid grid-cols-3 gap-4 mb-7">
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
                                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${c.status === 'Active' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
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
                                                <div key={s.label} className="bg-[#f8f9fc] rounded-xl p-3 text-center">
                                                    <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
                                                    <p className="text-[10px] text-gray-400">{s.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="bg-[#f8f9fc] rounded-xl p-3">
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
                            <div className="flex items-start gap-3 bg-[#f0eeff] border border-[#d8d0f5] rounded-xl px-4 py-3 mb-6">
                                <svg className="w-4 h-4 text-[#6741d9] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                                <p className="text-xs text-[#5b3fc4]">Mentors are created exclusively through the Endorsement Approval process. No manual creation allowed.</p>
                            </div>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
                                    <input type="text" placeholder="Search mentors..." value={mentorSearch} onChange={e => setMentorSearch(e.target.value)}
                                        className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6741d9] w-52 bg-white" />
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
                                                            <p className="font-bold text-gray-900 text-base leading-tight">{m.name}</p>
                                                            <p className="text-[11px] text-gray-400 font-medium mt-0.5">{m.id}</p>
                                                        </div>
                                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${m.status === 'Active' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-gray-100 text-gray-500'}`}>{m.status}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                                                            {m.barangay}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                                                            {m.phone}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
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
                                                        My Groups
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-[#6741d9]">{m.groups.length} group{m.groups.length !== 1 ? 's' : ''}</span>
                                                </div>

                                                <div className="flex flex-col divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                                                    {visibleGroups.map((g, i) => (
                                                        <div key={i} className="flex items-center justify-between px-3 py-2.5">
                                                            <div>
                                                                <p className="text-xs font-semibold text-gray-800">{g.name}</p>
                                                                <p className="text-[10px] text-gray-400">{g.barangay}</p>
                                                            </div>
                                                            <span className="text-[11px] font-semibold text-[#6741d9]">{g.mentees} Mentees</span>
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
                            <div className="flex flex-wrap items-center gap-2 mb-6">
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
                                    <input type="text" placeholder="Search..." value={potentialSearch} onChange={e => setPotentialSearch(e.target.value)}
                                        className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6741d9] w-48 bg-white" />
                                </div>
                                {statusFilters.map(f => (
                                    <button key={f} onClick={() => setPotentialFilter(f)}
                                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${potentialFilter === f ? 'bg-[#6741d9] text-white border-[#6741d9]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>{f}</button>
                                ))}
                            </div>
                            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-[#f8f9fc] text-[10px] text-gray-400 uppercase tracking-widest">
                                            {['Name', 'Age / Gender', 'Source', 'Requested Group', 'Coordinator', 'Status', 'Actions'].map(h => (
                                                <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredPotential.map(m => (
                                            <tr key={m.id} className="hover:bg-[#f8f9fc] transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0" style={{ background: avatarColor(m.id) }}>{m.initials}</div>
                                                        <span className="font-semibold text-gray-900">{m.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-xs text-gray-500">{m.age} · {m.gender}</td>
                                                <td className="px-5 py-3.5"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.sourceColor}`}>{m.source}</span></td>
                                                <td className="px-5 py-3.5 text-xs text-gray-600">{m.requestedGroup}</td>
                                                <td className="px-5 py-3.5 text-xs text-gray-500">{m.assignedCoordinator ?? '—'}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${CLUSTER_STATUS_STYLE[m.clusterStatus]}`}>{m.clusterStatus}</span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => setInterviewMentee(m)} className="text-xs font-semibold text-[#6741d9] hover:underline">Schedule Interview</button>
                                                    </div>
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

                    {/* ── Active Mentees Tab ── */}
                    {activeNav === 'mentees' && (
                        <div>
                            <div className="mb-6">
                                <h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Active Mentees</h1>
                                <p className="text-sm text-gray-400 mt-1">All active mentees under {clusterName}.</p>
                            </div>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
                                    <input type="text" placeholder="Search mentees..." value={activeMenteeSearch} onChange={e => setActiveMenteeSearch(e.target.value)}
                                        className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6741d9] w-52 bg-white" />
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-[#f8f9fc] text-[10px] text-gray-400 uppercase tracking-widest">
                                            {['Name', 'Assigned Group', 'Connected Since', 'Devotional Status', 'Progress', 'Actions'].map(h => (
                                                <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredActiveMentees.map(m => (
                                            <tr key={m.id} className="hover:bg-[#f8f9fc] transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0" style={{ background: avatarColor(m.id) }}>{m.initials}</div>
                                                        <span className="font-semibold text-gray-900">{m.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-xs text-gray-500">{m.assignedGroup}</td>
                                                <td className="px-5 py-3.5 text-xs text-gray-500">{m.connectedSince}</td>
                                                <td className="px-5 py-3.5 text-xs text-gray-500">{m.module}, {m.lesson}</td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div className="h-full rounded-full" style={{ width: `${m.progress}%`, background: '#6741d9' }} />
                                                        </div>
                                                        <span className="text-xs text-gray-400">{m.progress}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <button onClick={() => setViewingActiveMentee(m)} className="text-xs text-[#6741d9] hover:underline font-medium">View Profile</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── Reports Tab ── */}
                    {activeNav === 'reports' && <CHReportsTab clusterName={clusterName} reportsContent={reportsContent} />}

                    {/* ── Notifications Tab ── */}
                    {activeNav === 'notifications' && <NotificationsTab />}

            </div>
        </div>
    );
}
