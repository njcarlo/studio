'use client';

import { useState } from 'react';
import {
    MH_CLUSTERS, MH_COORDINATORS, MH_ALL_MENTORS, MH_POTENTIAL_MENTEES,
    MH_ACTIVE_MENTEES_LIST, MH_NOTIFICATIONS,
    type OutreachCluster,
} from '@/lib/data';
import ClusterMap, { DASMARIÑAS_GROUPS, type ClusterMapGroup } from './ClusterMap';
import {
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
    PieChart, Pie, Cell, Tooltip, Legend, CartesianGrid, XAxis, YAxis,
} from 'recharts';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#5b50d6', '#e91e8c', '#0b9b8a', '#e67700', '#6741d9', '#1971c2'];
function avatarColor(id: string) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
const STATUS_STYLE: Record<string, string> = {
    'New':                    'bg-[#dbeafe] text-[#1d4ed8]',
    'Waiting for Assignment': 'bg-[#fef9c3] text-[#92400e]',
    'Assigned to Mentor':     'bg-[#ede9fe] text-[#6741d9]',
    'Interview Scheduled':    'bg-[#fde8ef] text-[#e6184d]',
    'Interview Completed':    'bg-[#d3f9f0] text-[#0c8a6e]',
    'Accepted':               'bg-[#dcfce7] text-[#166534]',
};
const TOOLTIP_STYLE = {
    borderRadius: '10px', border: 'none',
    boxShadow: '0 4px 16px rgba(0,0,0,0.10)', fontSize: '12px', padding: '8px 14px',
};

// ─── Nav definition ────────────────────────────────────────────────────────────
type NavKey = 'dashboard' | 'clusters' | 'coordinators' | 'mentors' | 'potential' | 'mentees' | 'reports' | 'notifications';
const MH_NAV: { key: NavKey; label: string; icon: string }[] = [
    { key: 'dashboard',     label: 'Dashboard',          icon: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zm-2-4H10v-2h8v2zm-4 4H10v-2h4v2zm4-8H10V6h8v2z' },
    { key: 'notifications', label: 'Notifications',       icon: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z' },
    { key: 'clusters',      label: 'Clusters',            icon: 'M20 6h-2.18c.07-.44.18-.86.18-1a3 3 0 1 0-6 0c0 .14.11.56.18 1H6c-1.11 0-2 .9-2 2v11c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-8-3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm2 16H6v-2h8v2zm6-4H6v-6h14v6z' },
    { key: 'coordinators',  label: 'C2S Coordinators',    icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
    { key: 'mentors',       label: 'Mentors',             icon: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z' },
    { key: 'potential',     label: 'Potential Mentees',   icon: 'M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
    { key: 'mentees',       label: 'Active Mentees',      icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
    { key: 'reports',       label: 'Reports',             icon: 'M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z' },
];

// ─── Dashboard Tab ─────────────────────────────────────────────────────────────
const GROWTH_DATA = [
    { month: 'Feb', mentees: 22, mentors: 9  },
    { month: 'Mar', mentees: 27, mentors: 10 },
    { month: 'Apr', mentees: 30, mentors: 11 },
    { month: 'May', mentees: 33, mentors: 11 },
    { month: 'Jun', mentees: 38, mentors: 12 },
    { month: 'Jul', mentees: 42, mentors: 12 },
];
const COMMUNITY_VS_CHURCH = [
    { name: 'Community-based', value: 9, color: '#5b50d6' },
    { name: 'Church-based',    value: 3, color: '#0b9b8a' },
];

function DashboardTab() {
    const totalClusters    = MH_CLUSTERS.length;
    const totalCoordinators = MH_COORDINATORS.length;
    const totalMentors     = MH_ALL_MENTORS.length;
    const totalPotential   = MH_POTENTIAL_MENTEES.length;
    const totalActive      = MH_ACTIVE_MENTEES_LIST.length;
    const totalCommunity   = MH_CLUSTERS.reduce((s, c) => s + c.communityBased, 0);
    const totalChurch      = MH_CLUSTERS.reduce((s, c) => s + c.churchBased, 0);

    const widgets = [
        { label: 'Total Clusters',          value: totalClusters,     color: '#5b50d6', bg: '#ede9fe',
          icon: 'M20 6h-2.18c.07-.44.18-.86.18-1a3 3 0 1 0-6 0c0 .14.11.56.18 1H6c-1.11 0-2 .9-2 2v11c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-8-3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm2 16H6v-2h8v2zm6-4H6v-6h14v6z' },
        { label: 'Total Coordinators',      value: totalCoordinators, color: '#e91e8c', bg: '#fde8ef',
          icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
        { label: 'Total Mentors',           value: totalMentors,      color: '#0b9b8a', bg: '#e0f7f5',
          icon: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z' },
        { label: 'Total Potential Mentees', value: totalPotential,    color: '#e67700', bg: '#fff3e0',
          icon: 'M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
        { label: 'Total Active Mentees',    value: totalActive,       color: '#1971c2', bg: '#e0f0ff',
          icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
    ];

    return (
        <div>
            <div className="mb-5">
                <h1 className="text-2xl font-black text-gray-900">Outreach Ministry</h1>
                <p className="text-sm text-gray-400 mt-0.5">Overall monitoring of the Outreach Ministry across all clusters.</p>
            </div>

            {/* Stat widgets */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {widgets.map((w) => (
                    <div key={w.label} className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <div className="flex items-start justify-between mb-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-snug">{w.label}</span>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: w.bg }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill={w.color}><path d={w.icon}/></svg>
                            </div>
                        </div>
                        <p className="text-[2.2rem] font-normal text-gray-900 leading-none">{w.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                {/* Growth chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <h2 className="font-bold text-gray-900 text-base mb-0.5">Ministry Growth</h2>
                    <p className="text-xs text-gray-400 mb-5">Active mentees and mentors across all clusters.</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={GROWTH_DATA} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                            <Tooltip contentStyle={TOOLTIP_STYLE}/>
                            <Legend iconType="plainline" iconSize={14} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}/>
                            <Line type="monotone" dataKey="mentees" name="Active Mentees" stroke="#5b50d6" strokeWidth={2} dot={{ r: 3, fill: '#5b50d6', strokeWidth: 0 }}/>
                            <Line type="monotone" dataKey="mentors" name="Mentors"        stroke="#0b9b8a" strokeWidth={2} dot={{ r: 3, fill: '#0b9b8a', strokeWidth: 0 }}/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Community vs Church */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <h2 className="font-bold text-gray-900 text-base mb-0.5">Community vs Church-Based</h2>
                    <p className="text-xs text-gray-400 mb-3">Group type breakdown across all clusters.</p>
                    <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                            <Pie data={COMMUNITY_VS_CHURCH} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                                {COMMUNITY_VS_CHURCH.map((e) => <Cell key={e.name} fill={e.color}/>)}
                            </Pie>
                            <Tooltip contentStyle={TOOLTIP_STYLE}/>
                            <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }}/>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-auto grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-[#f8f9fc] px-3 py-2 text-center">
                            <p className="text-xl font-black text-[#5b50d6]">{totalCommunity}</p>
                            <p className="text-[10px] text-gray-400">Community</p>
                        </div>
                        <div className="rounded-xl bg-[#f8f9fc] px-3 py-2 text-center">
                            <p className="text-xl font-black text-[#0b9b8a]">{totalChurch}</p>
                            <p className="text-[10px] text-gray-400">Church-Based</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cluster summary table */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <h2 className="font-bold text-gray-900 text-base mb-0.5">Cluster Summary</h2>
                <p className="text-xs text-gray-400 mb-5">Overview of all Outreach Clusters.</p>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-gray-100">
                                {['Cluster','Cluster Head','Coordinator','Groups','Mentors','Potential','Active'].map(h => (
                                    <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-3 pr-6">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {MH_CLUSTERS.map((c) => (
                                <tr key={c.id}>
                                    <td className="py-3 pr-6 font-semibold text-gray-900">{c.name}</td>
                                    <td className="py-3 pr-6 text-gray-600">{c.clusterHead}</td>
                                    <td className="py-3 pr-6 text-gray-600">{c.coordinator}</td>
                                    <td className="py-3 pr-6 font-semibold text-gray-900">{c.totalGroups}</td>
                                    <td className="py-3 pr-6 font-semibold text-gray-900">{c.totalMentors}</td>
                                    <td className="py-3 pr-6 font-semibold text-[#e67700]">{c.totalPotentialMentees}</td>
                                    <td className="py-3 pr-6 font-semibold text-[#0b9b8a]">{c.totalActiveMentees}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── Clusters Tab ─────────────────────────────────────────────────────────────
function ClusterDetailPanel({ cluster, onClose }: { cluster: OutreachCluster; onClose: () => void }) {
    return (
        <>
            <div className="fixed inset-0 z-[100] bg-black/40" onClick={onClose}/>
            <div className="fixed top-0 right-0 bottom-0 z-[101] w-[440px] max-w-full bg-white shadow-2xl flex flex-col overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between">
                    <div><h2 className="text-lg font-semibold text-gray-900">{cluster.name}</h2><p className="text-xs text-gray-400 mt-0.5">Cluster Details</p></div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Cluster Head', name: cluster.clusterHead, color: cluster.clusterHeadColor, initials: cluster.clusterHeadInitials },
                            { label: 'C2S Coordinator', name: cluster.coordinator, color: cluster.coordinatorColor, initials: cluster.coordinatorInitials },
                        ].map((r) => (
                            <div key={r.label} className="rounded-xl border border-gray-100 bg-[#f8f9fc] px-4 py-3">
                                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-2">{r.label}</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0" style={{ background: r.color }}>{r.initials}</div>
                                    <p className="text-xs font-semibold text-gray-800">{r.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { label: 'Groups',    value: cluster.totalGroups,           color: '#5b50d6' },
                            { label: 'Mentors',   value: cluster.totalMentors,          color: '#0b9b8a' },
                            { label: 'Potential', value: cluster.totalPotentialMentees, color: '#e67700' },
                            { label: 'Active',    value: cluster.totalActiveMentees,    color: '#1971c2' },
                        ].map((s) => (
                            <div key={s.label} className="rounded-xl bg-[#f8f9fc] px-2 py-3 text-center">
                                <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                                <p className="text-[9px] text-gray-400 mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-[#f8f9fc] overflow-hidden">
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-2">Group Types</p>
                        {[{ label: 'Community-based', value: cluster.communityBased }, { label: 'Church-based', value: cluster.churchBased }].map((r) => (
                            <div key={r.label} className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100">
                                <span className="text-xs text-gray-500">{r.label}</span>
                                <span className="text-xs font-bold text-gray-800">{r.value}</span>
                            </div>
                        ))}
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-[#f8f9fc] overflow-hidden">
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-2">Barangays Covered</p>
                        <div className="flex flex-wrap gap-1.5 px-4 pb-4 pt-1">
                            {cluster.barangays.map((b) => (
                                <span key={b} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#ede9fe] text-[#6741d9]">{b}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function ClustersTab() {
    const [viewing, setViewing] = useState<OutreachCluster | null>(null);
    return (
        <div>
            {viewing && <ClusterDetailPanel cluster={viewing} onClose={() => setViewing(null)}/>}
            <div className="mb-6"><h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Clusters</h1><p className="text-sm text-gray-400 mt-1">All Outreach Clusters under the ministry.</p></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {MH_CLUSTERS.map((c) => (
                    <div key={c.id} className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg leading-tight">{c.name}</h3>
                                <div className="flex gap-2 mt-1.5">
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#ede9fe] text-[#6741d9]">{c.communityBased} Community</span>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#e0f7f5] text-[#0b9b8a]">{c.churchBased} Church</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Cluster Head</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0" style={{ background: c.clusterHeadColor }}>{c.clusterHeadInitials}</div>
                                    <p className="text-xs font-semibold text-gray-800 truncate">{c.clusterHead}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">C2S Coordinator</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0" style={{ background: c.coordinatorColor }}>{c.coordinatorInitials}</div>
                                    <p className="text-xs font-semibold text-gray-800 truncate">{c.coordinator}</p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {[{ label: 'Groups', value: c.totalGroups, color: '#5b50d6' }, { label: 'Mentors', value: c.totalMentors, color: '#0b9b8a' }, { label: 'Potential', value: c.totalPotentialMentees, color: '#e67700' }, { label: 'Active', value: c.totalActiveMentees, color: '#1971c2' }].map((s) => (
                                <div key={s.label} className="bg-[#f8f9fc] rounded-xl px-2 py-3 text-center">
                                    <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
                                    <p className="text-[9px] text-gray-400 mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setViewing(c)} className="text-xs font-semibold text-white px-4 py-2.5 rounded-xl transition-colors w-full" style={{ background: '#5b50d6' }}>View Details</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Coordinators Tab ─────────────────────────────────────────────────────────
function CoordinatorsTab() {
    const [search, setSearch] = useState('');
    const filtered = MH_COORDINATORS.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.cluster.toLowerCase().includes(search.toLowerCase()));
    return (
        <div>
            <div className="mb-6"><h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">C2S Coordinators</h1><p className="text-sm text-gray-400 mt-1">All coordinators across the Outreach Ministry.</p></div>
            <div className="flex items-center gap-3 mb-5">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
                    <input type="text" placeholder="Search coordinators..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5b50d6] w-56 bg-white"/>
                </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-[#f8f9fc]">
                            <tr>{['Coordinator Name','Cluster','Assigned Potential Mentees','Active Mentors','Status'].map((h) => (<th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-5 py-3.5">{h}</th>))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((c) => (
                                <tr key={c.id} className="hover:bg-[#fafbff] transition-colors">
                                    <td className="px-5 py-3.5"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0" style={{ background: c.color }}>{c.initials}</div><span className="font-semibold text-gray-900">{c.name}</span></div></td>
                                    <td className="px-5 py-3.5 text-gray-600">{c.cluster}</td>
                                    <td className="px-5 py-3.5 font-semibold text-gray-900">{c.assignedPotentialMentees}</td>
                                    <td className="px-5 py-3.5 font-semibold text-gray-900">{c.activeMentors}</td>
                                    <td className="px-5 py-3.5"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${c.status === 'Active' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-gray-100 text-gray-500'}`}>{c.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && <div className="p-12 text-center"><p className="text-sm font-semibold text-gray-600">No coordinators found</p></div>}
                </div>
            </div>
        </div>
    );
}

// ─── Mentors Tab ──────────────────────────────────────────────────────────────
function MentorsTab() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
    const filtered = MH_ALL_MENTORS.filter((m) => (m.name.toLowerCase().includes(search.toLowerCase()) || m.cluster.toLowerCase().includes(search.toLowerCase())) && (filter === 'All' || m.status === filter));
    return (
        <div>
            <div className="mb-6"><h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Mentors</h1><p className="text-sm text-gray-400 mt-1">All mentors across the Outreach Ministry.</p></div>
            <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
                    <input type="text" placeholder="Search mentors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5b50d6] w-52 bg-white"/>
                </div>
                {(['All','Active','Inactive'] as const).map((f) => (
                    <button key={f} onClick={() => setFilter(f)} className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors ${filter === f ? 'bg-[#5b50d6] text-white border-[#5b50d6]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>{f}</button>
                ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-[#f8f9fc]">
                            <tr>{['Name','Cluster','Total Groups','Active Mentees','Status'].map((h) => (<th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-5 py-3.5">{h}</th>))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((m) => (
                                <tr key={m.id} className="hover:bg-[#fafbff] transition-colors">
                                    <td className="px-5 py-3.5"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0" style={{ background: m.color }}>{m.initials}</div><span className="font-semibold text-gray-900">{m.name}</span></div></td>
                                    <td className="px-5 py-3.5 text-gray-600">{m.cluster}</td>
                                    <td className="px-5 py-3.5 font-semibold text-gray-900">{m.totalGroups}</td>
                                    <td className="px-5 py-3.5 font-semibold text-gray-900">{m.activeMentees}</td>
                                    <td className="px-5 py-3.5"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${m.status === 'Active' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-gray-100 text-gray-500'}`}>{m.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && <div className="p-12 text-center"><p className="text-sm font-semibold text-gray-600">No mentors found</p></div>}
                </div>
            </div>
        </div>
    );
}

// ─── Potential Mentees Tab ────────────────────────────────────────────────────
function PotentialMenteesTab() {
    const [clusterFilter, setClusterFilter] = useState('All');
    const [coordFilter,   setCoordFilter]   = useState('All');
    const [mentorFilter,  setMentorFilter]  = useState('All');
    const [barangayFilter,setBarangayFilter]= useState('All');
    const [statusFilter,  setStatusFilter]  = useState('All');

    const clusters     = ['All', ...Array.from(new Set(MH_POTENTIAL_MENTEES.map((m) => m.cluster)))];
    const coordinators = ['All', ...Array.from(new Set(MH_POTENTIAL_MENTEES.map((m) => m.coordinator)))];
    const mentors      = ['All', ...Array.from(new Set(MH_POTENTIAL_MENTEES.map((m) => m.mentor).filter((x) => x !== '—')))];
    const barangays    = ['All', ...Array.from(new Set(MH_POTENTIAL_MENTEES.map((m) => m.barangay)))];
    const statuses     = ['All','New','Waiting for Assignment','Assigned to Mentor','Interview Scheduled','Interview Completed','Accepted'];

    const filtered = MH_POTENTIAL_MENTEES.filter((m) =>
        (clusterFilter  === 'All' || m.cluster     === clusterFilter)  &&
        (coordFilter    === 'All' || m.coordinator === coordFilter)    &&
        (mentorFilter   === 'All' || m.mentor      === mentorFilter)   &&
        (barangayFilter === 'All' || m.barangay    === barangayFilter) &&
        (statusFilter   === 'All' || m.status      === statusFilter)
    );

    function Sel({ label, val, opts, onChange }: { label: string; val: string; opts: string[]; onChange: (v: string) => void }) {
        return (
            <select value={val} onChange={(e) => onChange(e.target.value)} className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#5b50d6] text-gray-700">
                {opts.map((o) => <option key={o} value={o}>{o === 'All' ? `${label}: All` : o}</option>)}
            </select>
        );
    }

    return (
        <div>
            <div className="mb-6"><h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Potential Mentees</h1><p className="text-sm text-gray-400 mt-1">Master list of all potential mentees across the Outreach Ministry.</p></div>
            <div className="flex flex-wrap gap-2 mb-5">
                <Sel label="Cluster"     val={clusterFilter}  opts={clusters}     onChange={setClusterFilter}/>
                <Sel label="Coordinator" val={coordFilter}    opts={coordinators} onChange={setCoordFilter}/>
                <Sel label="Mentor"      val={mentorFilter}   opts={mentors}      onChange={setMentorFilter}/>
                <Sel label="Barangay"    val={barangayFilter} opts={barangays}    onChange={setBarangayFilter}/>
                <Sel label="Status"      val={statusFilter}   opts={statuses}     onChange={setStatusFilter}/>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-[#f8f9fc]">
                            <tr>{['Name','Age','Gender','Cluster','Coordinator','Mentor','Barangay','Source','Status','Submitted'].map((h) => (<th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-3.5 whitespace-nowrap">{h}</th>))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((m) => (
                                <tr key={m.id} className="hover:bg-[#fafbff] transition-colors">
                                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0" style={{ background: avatarColor(m.id) }}>{m.initials}</div><span className="font-semibold text-gray-900 whitespace-nowrap">{m.name}</span></div></td>
                                    <td className="px-4 py-3 text-gray-600">{m.age}</td>
                                    <td className="px-4 py-3 text-gray-600">{m.gender}</td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{m.cluster}</td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{m.coordinator}</td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{m.mentor}</td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{m.barangay}</td>
                                    <td className="px-4 py-3"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${m.source === 'From C2S Group Finder' ? 'bg-[#e0f7f5] text-[#0b9b8a]' : 'bg-[#ede9fe] text-[#6741d9]'}`}>{m.source === 'From C2S Group Finder' ? 'Finder' : 'Recommended'}</span></td>
                                    <td className="px-4 py-3"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_STYLE[m.status] ?? ''}`}>{m.status}</span></td>
                                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{m.dateSubmitted}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && <div className="p-12 text-center"><p className="text-sm font-semibold text-gray-600">No potential mentees match the selected filters</p></div>}
                </div>
            </div>
        </div>
    );
}

// ─── Active Mentees Tab ───────────────────────────────────────────────────────
function ActiveMenteesTab() {
    const [clusterFilter, setClusterFilter] = useState('All');
    const clusters = ['All', ...Array.from(new Set(MH_ACTIVE_MENTEES_LIST.map((m) => m.cluster)))];
    const filtered = MH_ACTIVE_MENTEES_LIST.filter((m) => clusterFilter === 'All' || m.cluster === clusterFilter);

    return (
        <div>
            <div className="mb-6"><h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Active Mentees</h1><p className="text-sm text-gray-400 mt-1">Master list of all active mentees across the Outreach Ministry.</p></div>
            <div className="flex flex-wrap gap-2 mb-5">
                {clusters.map((c) => (
                    <button key={c} onClick={() => setClusterFilter(c)} className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors ${clusterFilter === c ? 'bg-[#5b50d6] text-white border-[#5b50d6]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>{c}</button>
                ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-[#f8f9fc]">
                            <tr>{['Name','Cluster','Coordinator','Mentor','Barangay','Module','Progress'].map((h) => (<th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-3.5 whitespace-nowrap">{h}</th>))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((m) => (
                                <tr key={m.id} className="hover:bg-[#fafbff] transition-colors">
                                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0" style={{ background: avatarColor(m.id) }}>{m.initials}</div><span className="font-semibold text-gray-900 whitespace-nowrap">{m.name}</span></div></td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{m.cluster}</td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{m.coordinator}</td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{m.mentor}</td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{m.barangay}</td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{m.module}</td>
                                    <td className="px-4 py-3"><div className="flex items-center gap-2 min-w-[80px]"><div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${m.progress}%`, background: '#5b50d6' }}/></div><span className="text-[10px] font-semibold text-gray-700 shrink-0">{m.progress}%</span></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && <div className="p-12 text-center"><p className="text-sm font-semibold text-gray-600">No active mentees found</p></div>}
                </div>
            </div>
        </div>
    );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────
type ReportType = 'monthly' | 'quarterly' | 'annual' | 'coordinator' | 'cluster' | 'mentor' | 'community' | 'maps';
const REPORT_GROWTH_DATA = [
    { period: 'Feb', mentees: 22, mentors: 9  },
    { period: 'Mar', mentees: 27, mentors: 10 },
    { period: 'Apr', mentees: 30, mentors: 11 },
    { period: 'May', mentees: 33, mentors: 11 },
    { period: 'Jun', mentees: 38, mentors: 12 },
    { period: 'Jul', mentees: 42, mentors: 12 },
];

// ─── Monthly report history data ──────────────────────────────────────────────
type MonthlyReportStatus = 'Submitted' | 'Pending' | 'Draft';
interface MonthlyReport {
    month: string;
    period: string;
    clusters: number;
    mentors: number;
    activeMentees: number;
    potentialMentees: number;
    newGroups: number;
    completedModules: number;
    status: MonthlyReportStatus;
    submittedBy: string;
    submittedDate: string;
}
const MONTHLY_REPORT_HISTORY: MonthlyReport[] = [
    { month: 'July 2026',      period: 'Jul 2026', clusters: 6, mentors: 20, activeMentees: 42, potentialMentees: 12, newGroups: 3, completedModules: 8,  status: 'Submitted', submittedBy: 'Pastor Ramon Dela Cruz', submittedDate: 'Jul 31, 2026' },
    { month: 'June 2026',      period: 'Jun 2026', clusters: 6, mentors: 19, activeMentees: 38, potentialMentees: 14, newGroups: 2, completedModules: 6,  status: 'Submitted', submittedBy: 'Pastor Ramon Dela Cruz', submittedDate: 'Jun 30, 2026' },
    { month: 'May 2026',       period: 'May 2026', clusters: 6, mentors: 18, activeMentees: 33, potentialMentees: 11, newGroups: 1, completedModules: 5,  status: 'Submitted', submittedBy: 'Pastor Ramon Dela Cruz', submittedDate: 'May 31, 2026' },
    { month: 'April 2026',     period: 'Apr 2026', clusters: 6, mentors: 17, activeMentees: 30, potentialMentees: 10, newGroups: 2, completedModules: 4,  status: 'Submitted', submittedBy: 'Pastor Ramon Dela Cruz', submittedDate: 'Apr 30, 2026' },
    { month: 'March 2026',     period: 'Mar 2026', clusters: 6, mentors: 16, activeMentees: 27, potentialMentees:  9, newGroups: 1, completedModules: 3,  status: 'Submitted', submittedBy: 'Pastor Ramon Dela Cruz', submittedDate: 'Mar 31, 2026' },
    { month: 'February 2026',  period: 'Feb 2026', clusters: 6, mentors: 15, activeMentees: 22, potentialMentees:  8, newGroups: 0, completedModules: 2,  status: 'Submitted', submittedBy: 'Pastor Ramon Dela Cruz', submittedDate: 'Feb 28, 2026' },
    { month: 'January 2026',   period: 'Jan 2026', clusters: 5, mentors: 14, activeMentees: 18, potentialMentees:  7, newGroups: 2, completedModules: 1,  status: 'Submitted', submittedBy: 'Pastor Ramon Dela Cruz', submittedDate: 'Jan 31, 2026' },
    { month: 'December 2025',  period: 'Dec 2025', clusters: 5, mentors: 13, activeMentees: 15, potentialMentees:  6, newGroups: 1, completedModules: 0,  status: 'Submitted', submittedBy: 'Pastor Ramon Dela Cruz', submittedDate: 'Dec 31, 2025' },
    { month: 'November 2025',  period: 'Nov 2025', clusters: 5, mentors: 12, activeMentees: 12, potentialMentees:  5, newGroups: 0, completedModules: 0,  status: 'Submitted', submittedBy: 'Pastor Ramon Dela Cruz', submittedDate: 'Nov 30, 2025' },
    { month: 'October 2025',   period: 'Oct 2025', clusters: 4, mentors: 11, activeMentees: 10, potentialMentees:  4, newGroups: 1, completedModules: 0,  status: 'Submitted', submittedBy: 'Pastor Ramon Dela Cruz', submittedDate: 'Oct 31, 2025' },
    { month: 'September 2025', period: 'Sep 2025', clusters: 4, mentors: 10, activeMentees:  8, potentialMentees:  3, newGroups: 0, completedModules: 0,  status: 'Draft',     submittedBy: '—',                     submittedDate: '—'            },
];
const CLUSTER_PERF = MH_CLUSTERS.map((c) => ({ name: c.name.replace('Cluster ',''), mentors: c.totalMentors, active: c.totalActiveMentees, potential: c.totalPotentialMentees }));

function ReportsTab() {
    const [reportType, setReportType] = useState<ReportType>('monthly');
    const [mapFilter, setMapFilter]   = useState<'All' | 'Community-based' | 'Church-based'>('All');

    const reportTypes: { key: ReportType; label: string }[] = [
        { key: 'monthly',     label: 'Monthly'            },
        { key: 'quarterly',   label: 'Quarterly'          },
        { key: 'annual',      label: 'Annual'             },
        { key: 'coordinator', label: 'Per Coordinator'    },
        { key: 'cluster',     label: 'Per Cluster'        },
        { key: 'mentor',      label: 'Per Mentor'         },
        { key: 'community',   label: 'Community Outreach' },
        { key: 'maps',        label: 'Interactive Maps'   },
    ];

    const barangayCounts: Record<string, number> = {};
    MH_CLUSTERS.forEach((c) => {
        c.barangays.forEach((b) => { barangayCounts[b] = (barangayCounts[b] ?? 0) + (c.communityBased + c.churchBased); });
    });

    const filteredGroups: ClusterMapGroup[] = mapFilter === 'All'
        ? DASMARIÑAS_GROUPS
        : DASMARIÑAS_GROUPS.filter((g) => g.type === mapFilter);

    return (
        <div>
            <div className="flex items-start justify-between mb-6">
                <div><h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Reports</h1><p className="text-sm text-gray-400 mt-1">Generate and view Outreach Ministry reports.</p></div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-2 rounded-xl bg-white hover:border-gray-300 transition-colors">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5z"/></svg>Export PDF
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-2 rounded-xl bg-white hover:border-gray-300 transition-colors">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5z"/></svg>Export Excel
                    </button>
                </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
                {reportTypes.map((r) => (
                    <button key={r.key} onClick={() => setReportType(r.key)} className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors ${reportType === r.key ? 'bg-[#5b50d6] text-white border-[#5b50d6]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>{r.label}</button>
                ))}
            </div>
            {(reportType === 'monthly' || reportType === 'quarterly' || reportType === 'annual') && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <p className="text-sm font-semibold text-gray-800 mb-4">Outreach Ministry Growth — {reportType.charAt(0).toUpperCase() + reportType.slice(1)}</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={REPORT_GROWTH_DATA} margin={{ top: 10, right: 20, left: -16, bottom: 0 }}>
                            <defs><linearGradient id="mgFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#5b50d6" stopOpacity={0.15}/><stop offset="95%" stopColor="#5b50d6" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                            <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                            <Tooltip contentStyle={TOOLTIP_STYLE}/>
                            <Legend iconType="plainline" iconSize={14} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}/>
                            <Area type="monotone" dataKey="mentees" name="Active Mentees" stroke="#5b50d6" strokeWidth={2} fill="url(#mgFill)" dot={false}/>
                            <Line type="monotone" dataKey="mentors" name="Mentors" stroke="#0b9b8a" strokeWidth={2} dot={false}/>
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* ── Monthly Report History ── */}
            {reportType === 'monthly' && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-gray-900 text-base">Monthly Report History</h2>
                            <p className="text-xs text-gray-400 mt-0.5">All submitted and draft monthly reports</p>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#ede9fe] text-[#5b50d6]">{MONTHLY_REPORT_HISTORY.filter(r => r.status === 'Submitted').length} submitted</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#f8f9fc]">
                                    {['Month', 'Clusters', 'Mentors', 'Active Mentees', 'Potential', 'New Groups', 'Modules Done', 'Status', 'Submitted By', 'Date'].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {MONTHLY_REPORT_HISTORY.map((r, i) => (
                                    <tr key={i} className="hover:bg-[#fafbff] transition-colors">
                                        <td className="px-5 py-3.5 font-semibold text-gray-900 whitespace-nowrap">{r.month}</td>
                                        <td className="px-5 py-3.5 text-center font-semibold text-gray-700">{r.clusters}</td>
                                        <td className="px-5 py-3.5 text-center font-semibold text-[#5b50d6]">{r.mentors}</td>
                                        <td className="px-5 py-3.5 text-center font-semibold text-[#0b9b8a]">{r.activeMentees}</td>
                                        <td className="px-5 py-3.5 text-center font-semibold text-[#e67700]">{r.potentialMentees}</td>
                                        <td className="px-5 py-3.5 text-center text-gray-600">{r.newGroups}</td>
                                        <td className="px-5 py-3.5 text-center text-gray-600">{r.completedModules}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                                                r.status === 'Submitted' ? 'bg-[#dcfce7] text-[#166534]' :
                                                r.status === 'Pending'   ? 'bg-[#fef9c3] text-[#92400e]' :
                                                'bg-gray-100 text-gray-500'
                                            }`}>{r.status}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">{r.submittedBy}</td>
                                        <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">{r.submittedDate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {(reportType === 'cluster' || reportType === 'coordinator' || reportType === 'mentor') && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <p className="text-sm font-semibold text-gray-800 mb-4">Performance by {reportType === 'coordinator' ? 'Coordinator' : reportType === 'cluster' ? 'Cluster' : 'Mentor'}</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={CLUSTER_PERF} margin={{ top: 10, right: 20, left: -16, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                            <Tooltip contentStyle={TOOLTIP_STYLE}/>
                            <Legend iconSize={12} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}/>
                            <Bar dataKey="active"    name="Active Mentees"    fill="#5b50d6" radius={[3,3,0,0]} barSize={22}/>
                            <Bar dataKey="potential" name="Potential Mentees" fill="#e67700" fillOpacity={0.7} radius={[3,3,0,0]} barSize={22}/>
                            <Bar dataKey="mentors"   name="Mentors"           fill="#0b9b8a" fillOpacity={0.6} radius={[3,3,0,0]} barSize={22}/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
            {reportType === 'community' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {MH_CLUSTERS.map((c) => (
                        <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            <p className="font-semibold text-gray-900 text-sm mb-3">{c.name}</p>
                            <div className="grid grid-cols-2 gap-2">
                                <div><p className="text-[9px] text-gray-400 uppercase tracking-widest">Community</p><p className="font-bold text-[#5b50d6]">{c.communityBased}</p></div>
                                <div><p className="text-[9px] text-gray-400 uppercase tracking-widest">Church</p><p className="font-bold text-[#0b9b8a]">{c.churchBased}</p></div>
                                <div><p className="text-[9px] text-gray-400 uppercase tracking-widest">Active</p><p className="font-bold text-[#1971c2]">{c.totalActiveMentees}</p></div>
                                <div><p className="text-[9px] text-gray-400 uppercase tracking-widest">Potential</p><p className="font-bold text-[#e67700]">{c.totalPotentialMentees}</p></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {reportType === 'maps' && (
                <div className="mb-6">
                    {/* Filter controls */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        {(['All', 'Community-based', 'Church-based'] as const).map((f) => (
                            <button key={f} onClick={() => setMapFilter(f)}
                                className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors ${mapFilter === f ? 'bg-[#5b50d6] text-white border-[#5b50d6]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                                {f}
                            </button>
                        ))}
                    </div>
                    {/* Map + sidebar */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ height: 460, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            <ClusterMap groups={filteredGroups} accentColor="#0b9b8a" />
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col" style={{ maxHeight: 460, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            <div className="px-5 pt-5 pb-3 border-b border-gray-50">
                                <p className="text-sm font-semibold text-gray-800">Groups by Barangay</p>
                            </div>
                            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                                {Object.entries(barangayCounts).sort((a, b) => b[1] - a[1]).map(([brgy, cnt]) => (
                                    <div key={brgy} className="flex items-center justify-between px-5 py-2.5">
                                        <span className="text-xs text-gray-700 font-medium truncate">{brgy}</span>
                                        <span className="text-xs font-bold text-[#5b50d6] shrink-0 ml-2">{cnt} groups</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Cluster coverage pills */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {MH_CLUSTERS.map((c) => (
                            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                <p className="font-semibold text-gray-900 text-sm mb-2">{c.name} Coverage</p>
                                <p className="text-xs text-gray-500 mb-2">Barangays: <span className="font-semibold text-gray-800">{c.barangays.length}</span></p>
                                <div className="flex flex-wrap gap-1">
                                    {c.barangays.map((b) => <span key={b} className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#f0effc] text-[#5b50d6]">{b}</span>)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {reportType !== 'maps' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { value: MH_CLUSTERS.length, color: '#5b50d6', label: 'Total Clusters', sub: 'Active' },
                    { value: MH_ALL_MENTORS.filter((m) => m.status === 'Active').length, color: '#0b9b8a', label: 'Active Mentors', sub: 'Outreach Ministry' },
                    { value: MH_ACTIVE_MENTEES_LIST.length, color: '#1971c2', label: 'Active Mentees', sub: '+3 this month' },
                    { value: MH_POTENTIAL_MENTEES.length, color: '#e67700', label: 'Potential Mentees', sub: 'Awaiting process' },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <p className="text-3xl font-black leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-sm font-semibold text-gray-800">{s.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                    </div>
                ))}
            </div>
            )}
        </div>
    );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────
function NotificationsTab() {
    const [notifs, setNotifs] = useState(MH_NOTIFICATIONS);
    const unreadCount = notifs.filter((n) => !n.read).length;
    const NOTIF_ICON: Record<string, { color: string; icon: string }> = {
        worker:      { color: '#5b50d6', icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
        worker_id:   { color: '#e91e8c', icon: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z' },
        coordinator: { color: '#0b9b8a', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
        mentor:      { color: '#e67700', icon: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z' },
    };
    const TYPE_LABEL: Record<string, string> = { worker: 'New Worker', worker_id: 'Worker ID', coordinator: 'Coordinator', mentor: 'Mentor' };

    return (
        <div>
            <div className="flex items-start justify-between mb-6">
                <div><h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Notifications</h1><p className="text-sm text-gray-400 mt-1">{unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}</p></div>
                {unreadCount > 0 && <button onClick={() => setNotifs((p) => p.map((n) => ({ ...n, read: true })))} className="text-xs font-semibold text-[#5b50d6] hover:underline">Mark all as read</button>}
            </div>
            <div className="flex flex-col gap-3">
                {notifs.map((n) => {
                    const s = NOTIF_ICON[n.type];
                    return (
                        <div key={n.id} className={`bg-white rounded-2xl border px-5 py-4 flex items-start gap-4 transition-all ${!n.read ? 'border-[#5b50d6]/30 shadow-sm' : 'border-gray-100'}`}>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: s.color + '20' }}>
                                <svg style={{ color: s.color, width: 18, height: 18 }} viewBox="0 0 24 24" fill="currentColor"><path d={s.icon}/></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mr-2" style={{ background: s.color + '20', color: s.color }}>{TYPE_LABEL[n.type]}</span>
                                        {!n.read && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#e91e8c]/10 text-[#e91e8c]">New</span>}
                                    </div>
                                    <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0">{n.time}</span>
                                </div>
                                <p className="text-xs font-medium text-gray-800 mt-1.5 leading-relaxed">{n.text}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main Component — uses same shell/layout as MentorDashboard ───────────────
export default function MinistryHeadDashboard() {
    const [activeNav, setActiveNav] = useState<NavKey>('dashboard');
    const unreadCount = MH_NOTIFICATIONS.filter((n) => !n.read).length;

    return (
        <div className="flex min-h-screen" style={{ background: '#EEF2F7' }}>

            {/* ── Left Sidebar — matches Mentor shell exactly ── */}
            <aside className="w-56 shrink-0 bg-[#f4f5f7] border-r border-gray-200 flex flex-col pt-6 pb-4 fixed top-16 bottom-0 left-0 z-40">
                {/* Logo + COG App */}

                {/* MENU label */}
                <p className="px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Menu</p>

                {/* Nav items */}
                <nav className="px-3 flex flex-col gap-1 overflow-y-auto flex-1">
                    {MH_NAV.map((item) => (
                        <button key={item.key} onClick={() => setActiveNav(item.key)}
                            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full text-left ${activeNav === item.key ? 'text-gray-800 bg-white shadow-sm' : 'text-gray-500 hover:bg-white/60'}`}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill={activeNav === item.key ? '#5b50d6' : '#aaa'}><path d={item.icon}/></svg>
                            {item.label}
                            {item.key === 'notifications' && unreadCount > 0 && (
                                <span className="ml-auto text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full" style={{ background: '#dde0f5', color: '#6366c1' }}>{unreadCount}</span>
                            )}
                            {item.key === 'clusters' && (
                                <span className="ml-auto text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full" style={{ background: '#dde0f5', color: '#6366c1' }}>{MH_CLUSTERS.length}</span>
                            )}
                            {item.key === 'potential' && (
                                <span className="ml-auto text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full" style={{ background: '#dde0f5', color: '#6366c1' }}>{MH_POTENTIAL_MENTEES.length}</span>
                            )}
                            {item.key === 'mentees' && (
                                <span className="ml-auto text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full" style={{ background: '#dde0f5', color: '#6366c1' }}>{MH_ACTIVE_MENTEES_LIST.length}</span>
                            )}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* ── Main content — matches Mentor shell exactly ── */}
            <div className="ml-56 flex-1 pt-6 px-6 pb-16">
                {activeNav === 'dashboard'    && <DashboardTab/>}
                {activeNav === 'clusters'     && <ClustersTab/>}
                {activeNav === 'coordinators' && <CoordinatorsTab/>}
                {activeNav === 'mentors'      && <MentorsTab/>}
                {activeNav === 'potential'    && <PotentialMenteesTab/>}
                {activeNav === 'mentees'      && <ActiveMenteesTab/>}
                {activeNav === 'reports'      && <ReportsTab/>}
                {activeNav === 'notifications'&& <NotificationsTab/>}
            </div>
        </div>
    );
}
