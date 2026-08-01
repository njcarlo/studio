'use client';

import { useState } from 'react';
import {
    MH_CLUSTERS, MH_COORDINATORS, MH_ALL_MENTORS, MH_POTENTIAL_MENTEES,
    MH_ACTIVE_MENTEES_LIST, MH_NOTIFICATIONS,
    type OutreachCluster,
} from '@/lib/data';
import { SharedDashboardTab, CHURCH_WIDE_DATA } from '@/components/DashboardSharedWidgets';
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

// ─── Dashboard Notifications panel ───────────────────────────────────────────
function MHDashboardNotifications() {
    const [notifs, setNotifs] = useState(MH_NOTIFICATIONS);
    const unread = notifs.filter(n => !n.read).length;
    const NOTIF_ICON: Record<string, { bg: string; dot: string }> = {
        worker:      { bg: '#ede9fe', dot: '#5b50d6' },
        worker_id:   { bg: '#fde8ef', dot: '#e91e8c' },
        coordinator: { bg: '#d3f9f0', dot: '#0b9b8a' },
        mentor:      { bg: '#fef3c7', dot: '#e67700' },
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
                        className="text-xs font-semibold text-[#5b50d6] hover:underline">Mark all as read</button>
                )}
            </div>
            <div className="divide-y divide-gray-50">
                {notifs.map(n => {
                    const ic = NOTIF_ICON[n.type] ?? { bg: '#f3f4f6', dot: '#9ca3af' };
                    return (
                        <div key={n.id} onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                            className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition-colors hover:bg-gray-50 ${!n.read ? 'bg-[#faf8ff]' : ''}`}>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: ic.bg }}>
                                <div className="w-3 h-3 rounded-full" style={{ background: ic.dot }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-snug ${n.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>{n.text}</p>
                                <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                            </div>
                            {!n.read && <div className="w-2 h-2 rounded-full bg-[#5b50d6] shrink-0 mt-1.5" />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function DashboardTab() {
    return (
        <div>
            <div className="mb-5">
                <h1 className="text-2xl font-black text-gray-900">Connect 2 Souls</h1>
                <p className="text-sm text-gray-400 mt-0.5">Connect, disciple and guide souls on their spiritual journey through meaningful relationships and faithful follow-up.</p>
            </div>
            <SharedDashboardTab data={CHURCH_WIDE_DATA} />
        </div>
    );
}


// ─── Clusters Tab ─────────────────────────────────────────────────────────────
function MentorProfileView({ mentor, cluster, onClose }: { mentor: typeof MH_ALL_MENTORS[0]; cluster: OutreachCluster; onClose: () => void }) {
    const mentees = MH_ACTIVE_MENTEES_LIST.filter(m => m.mentor === mentor.name);
    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[200] bg-black/40" onClick={onClose} />
            {/* Modal */}
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
                    {/* Header */}
                    <div className="flex items-start justify-between px-6 pt-6 pb-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{mentor.name}</h2>
                            <p className="text-sm text-gray-400 mt-0.5">Outreach · {cluster.name}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-full border border-gray-200 transition-colors">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                        </button>
                    </div>

                    {/* Info Cards */}
                    <div className="px-6 pb-4 grid grid-cols-2 gap-3">
                        {[
                            { label: 'Contact',        value: mentor.phone },
                            { label: 'Department',     value: 'Outreach' },
                            { label: 'Cluster',        value: cluster.name },
                            { label: 'Date Assigned',  value: mentor.dateAssigned },
                            { label: 'Status',         value: mentor.status },
                            { label: 'Active Mentees', value: String(mentor.activeMentees) },
                        ].map((f) => (
                            <div key={f.label} className="rounded-2xl border border-gray-200 bg-white px-4 py-3.5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                <p className="text-xs text-gray-400 mb-1">{f.label}</p>
                                <p className="text-sm font-bold text-gray-900">{f.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* My Mentees */}
                    <div className="px-6 pb-6">
                        <h3 className="font-bold text-gray-900 text-sm mb-3">My Mentees</h3>
                        {mentees.length === 0 ? (
                            <p className="text-sm text-gray-400">No active mentees assigned.</p>
                        ) : (
                            <div className="rounded-xl border border-gray-200 overflow-hidden">
                                {/* Table Header */}
                                <div className="grid grid-cols-12 px-4 py-2 bg-[#f8f9fc] border-b border-gray-100">
                                    <p className="col-span-4 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Name</p>
                                    <p className="col-span-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Module</p>
                                    <p className="col-span-5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Progress</p>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {mentees.map((mt) => (
                                        <div key={mt.id} className="grid grid-cols-12 items-center px-4 py-3">
                                            <p className="col-span-4 text-sm font-semibold text-gray-900">{mt.name}</p>
                                            <p className="col-span-3 text-xs text-gray-500">{mt.module}</p>
                                            <div className="col-span-5 flex items-center gap-2">
                                                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                                    <div className="h-1.5 rounded-full" style={{ width: `${mt.progress}%`, background: '#5b50d6' }} />
                                                </div>
                                                <span className="text-xs font-semibold text-gray-600 w-8 text-right shrink-0">{mt.progress}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

function ClusterDetailPanel({ cluster, onClose }: { cluster: OutreachCluster; onClose: () => void }) {
    const [viewingMentor, setViewingMentor] = useState<typeof MH_ALL_MENTORS[0] | null>(null);
    const mentors = MH_ALL_MENTORS.filter(m => m.cluster === cluster.name);
    const totalMembers = cluster.totalActiveMentees + cluster.totalPotentialMentees;

    return (
        <div className="flex flex-col gap-6">
            {/* Mentor Profile Modal */}
            {viewingMentor && (
                <MentorProfileView mentor={viewingMentor} cluster={cluster} onClose={() => setViewingMentor(null)} />
            )}
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">{cluster.name}</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Led by {cluster.clusterHead}</p>
                </div>
                <button onClick={onClose} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-2 bg-white transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                    All Clusters
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: 'Mentors',  value: cluster.totalMentors,   color: '#0b9b8a', icon: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z' },
                    { label: 'Mentees',  value: totalMembers,           color: '#5b50d6', icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.color + '18' }}>
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill={s.color}><path d={s.icon}/></svg>
                        </div>
                        <div>
                            <p className="text-2xl font-black leading-none" style={{ color: s.color }}>{s.value}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Mentor Directory */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div className="px-6 py-4 border-b border-gray-50">
                    <h2 className="font-bold text-gray-900 text-base">Mentor Directory</h2>
                    <p className="text-xs text-gray-400 mt-0.5">All mentors currently assigned to this cluster</p>
                </div>
                <div className="p-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                    {mentors.map((m) => (
                        <div key={m.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex flex-col gap-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div>
                                <p className="text-sm font-bold text-gray-900">{m.name}</p>
                                <p className="text-xs text-gray-400">{cluster.name}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Mentees</p>
                                <p className="text-sm font-bold text-gray-800 mt-0.5">{m.activeMentees}</p>
                            </div>
                            <button onClick={() => setViewingMentor(m)} className="text-xs font-semibold text-white py-2.5 rounded-xl w-full transition-colors" style={{ background: '#5b50d6' }}>View Profile</button>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}

function ClustersTab() {
    const [viewing, setViewing] = useState<OutreachCluster | null>(null);
    if (viewing) {
        return <ClusterDetailPanel cluster={viewing} onClose={() => setViewing(null)} />;
    }
    return (
        <div>
            <div className="mb-6"><h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Clusters</h1><p className="text-sm text-gray-400 mt-1">All Outreach Clusters under the ministry.</p></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {MH_CLUSTERS.map((c) => (
                    <div key={c.id} className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg leading-tight">{c.name}</h3>

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
                        <div className="grid grid-cols-3 gap-2">
                            {[{ label: 'Members', value: c.totalGroups, color: '#5b50d6' }, { label: 'Mentors', value: c.totalMentors, color: '#0b9b8a' }, { label: 'Active', value: c.totalActiveMentees, color: '#1971c2' }].map((s) => (
                                <div key={s.label} className="bg-[#f8f9fc] rounded-xl px-2 py-3 text-center">
                                    <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
                                    <p className="text-[9px] text-gray-400 mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setViewing(c)} className="text-xs font-semibold text-white px-4 py-2.5 rounded-xl transition-colors w-full" style={{ background: '#5b50d6' }}>View Cluster</button>
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
export default function DepartmentHeadDashboard() {
    const [activeNav, setActiveNav] = useState<NavKey>('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const unreadCount = MH_NOTIFICATIONS.filter((n) => !n.read).length;

    function navigate(key: NavKey) {
        setActiveNav(key);
        setSidebarOpen(false);
    }

    return (
        <div className="flex min-h-screen" style={{ background: '#EEF2F7' }}>

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
                {/* MENU label */}
                <p className="px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Menu</p>

                {/* Nav items */}
                <nav className="px-3 flex flex-col gap-1 overflow-y-auto flex-1">
                    {MH_NAV.map((item) => (
                        <button key={item.key} onClick={() => navigate(item.key)}
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

            {/* ── Main content ── */}
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
