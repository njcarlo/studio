'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
    COORD_POTENTIAL_MENTEES, COORD_MENTORS, COORD_GROUPS, COORD_NOTIFICATIONS,
    type CoordPotentialMentee, type CoordMentor, type CoordGroup,
} from '@/lib/data';
import { HUB_APPLICATIONS_KEY } from '@/components/C2SHubModal';
import { SharedDashboardTab, CHURCH_WIDE_DATA } from '@/components/DashboardSharedWidgets';
import type { ReactNode } from 'react';
import {
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar,
    LineChart, Line, CartesianGrid, XAxis, YAxis, Legend,
} from 'recharts';

const TOOLTIP_STYLE = {
    borderRadius: '10px', border: 'none',
    boxShadow: '0 4px 16px rgba(0,0,0,0.10)', fontSize: '12px', padding: '8px 14px',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#5b50d6', '#e91e8c', '#0b9b8a', '#e67700', '#6741d9'];
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

// ─── Nav ─────────────────────────────────────────────────────────────────────
const COORD_NAV = [
    { key: 'dashboard',        label: 'Dashboard',             icon: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zm-2-4H10v-2h8v2zm-4 4H10v-2h4v2zm4-8H10V6h8v2z' },
    { key: 'notifs',           label: 'Notifications',          icon: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z' },
    { key: 'potential',        label: 'Potential Mentees',      icon: 'M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
    { key: 'potential_c2s',    label: 'Potential C2S Groups',   icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
    { key: 'mentors',          label: 'Mentors',                icon: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z' },
    { key: 'groups',           label: 'C2S Groups',             icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
    { key: 'reports',          label: 'Reports',                icon: 'M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z' },
];

// ─── Assign to Mentor Modal ───────────────────────────────────────────────────
function AssignMentorModal({ mentee, mentors, onClose, onAssign }: {
    mentee: CoordPotentialMentee;
    mentors: CoordMentor[];
    onClose: () => void;
    onAssign: (menteeId: string, mentorName: string) => void;
}) {
    const [selected, setSelected] = useState('');
    const available = mentors.filter(m => m.status === 'Active' && m.availableSlots > 0);

    return (
        <>
            <div className="fixed inset-0 z-[100] bg-black/40" onClick={onClose} />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 flex flex-col gap-5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Assign to Mentor</h2>
                            <p className="text-xs text-gray-400 mt-0.5">For <span className="font-semibold text-gray-700">{mentee.name}</span></p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                        </button>
                    </div>
                    <div className="bg-[#f8f9fc] rounded-xl p-4 text-xs text-gray-600">
                        <p className="font-semibold text-gray-800 mb-1">Preferred Groups</p>
                        <p>{mentee.preferredGroups.join(', ')}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className="text-xs font-semibold text-gray-700">Select Mentor</p>
                        {available.length === 0 && (
                            <p className="text-xs text-gray-400 italic">No available mentors with open slots.</p>
                        )}
                        {available.map(m => (
                            <label key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${selected === m.name ? 'border-[#0b9b8a] bg-[#f0fdf9]' : 'border-gray-100 hover:border-gray-200'}`}>
                                <input type="radio" name="mentor" value={m.name} checked={selected === m.name} onChange={() => setSelected(m.name)} className="sr-only" />
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0" style={{ background: m.color }}>{m.initials}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                                    <p className="text-xs text-gray-400">{m.group} · {m.availableSlots} slots left</p>
                                </div>
                                {selected === m.name && (
                                    <svg className="w-5 h-5 text-[#0b9b8a] shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                )}
                            </label>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 text-sm font-semibold text-gray-600 border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                        <button
                            onClick={() => { if (selected) { onAssign(mentee.id, selected); onClose(); } }}
                            disabled={!selected}
                            className="flex-1 text-sm font-semibold text-white px-4 py-2.5 rounded-lg transition-colors disabled:opacity-40"
                            style={{ background: '#0b9b8a' }}>
                            Assign
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ─── View Details Modal ───────────────────────────────────────────────────────
function ViewDetailsModal({ mentee, onClose, onAssign, onRecommend }: {
    mentee: CoordPotentialMentee;
    onClose: () => void;
    onAssign: () => void;
    onRecommend: () => void;
}) {
    return (
        <>
            <div className="fixed inset-0 z-[100] bg-black/40" onClick={onClose} />
            <div className="fixed top-0 right-0 bottom-0 z-[101] w-[480px] max-w-full bg-white shadow-2xl flex flex-col overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Potential Mentee Details</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Submitted {mentee.dateSubmitted}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
                    {/* Identity */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0" style={{ background: avatarColor(mentee.id) }}>{mentee.initials}</div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-gray-900 text-base">{mentee.name}</p>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[mentee.status]}`}>{mentee.status}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{mentee.age} · {mentee.gender} · {mentee.phone}</p>
                        </div>
                    </div>
                    {/* Personal Info */}
                    <section className="rounded-xl border border-gray-100 bg-[#f8f9fc] overflow-hidden">
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-2">Personal Information</p>
                        <div className="divide-y divide-gray-100">
                            {[
                                { label: 'Email',              value: mentee.email },
                                { label: 'Phone',              value: mentee.phone },
                                { label: 'Birthday',           value: mentee.birthday },
                                { label: 'Barangay',           value: mentee.barangay },
                                { label: 'Facebook',           value: `Facebook.com/${mentee.facebook}` },
                                { label: 'First Attended',     value: mentee.firstAttended },
                                { label: 'Source',             value: mentee.source },
                                { label: 'Group Type',         value: mentee.groupType },
                            ].map(r => (
                                <div key={r.label} className="flex items-center justify-between px-4 py-2.5">
                                    <span className="text-xs text-gray-500">{r.label}</span>
                                    <span className="text-xs font-medium text-gray-800">{r.value}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                    {/* Preferred Groups */}
                    <section className="rounded-xl border border-gray-100 bg-[#f8f9fc] overflow-hidden">
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-2">Preferred Groups (up to 2)</p>
                        <div className="divide-y divide-gray-100">
                            {mentee.preferredGroups.map((g, i) => (
                                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                                    <span className="text-xs text-gray-500">Choice {i + 1}</span>
                                    <span className="text-xs font-medium text-gray-800">{g}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                    {/* Notes */}
                    <section className="rounded-xl bg-[#f8f9fc] border border-gray-100 px-4 py-3">
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Notes</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{mentee.notes}</p>
                    </section>
                    {mentee.assignedMentor && (
                        <section className="rounded-xl bg-[#f0fdf9] border border-[#bbf7d0] px-4 py-3">
                            <p className="text-[9px] font-semibold text-[#0b9b8a] uppercase tracking-widest mb-1">Assigned Mentor</p>
                            <p className="text-sm font-bold text-gray-900">{mentee.assignedMentor}</p>
                        </section>
                    )}
                </div>
                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                    <button onClick={onAssign} className="flex-1 text-sm font-semibold text-white py-2.5 rounded-lg transition-colors" style={{ background: '#0b9b8a' }}>
                        Assign to Mentor
                    </button>
                    <button onClick={onRecommend} className="flex-1 text-sm font-semibold text-gray-700 border border-gray-200 hover:border-gray-300 py-2.5 rounded-lg transition-colors">
                        Recommend Group
                    </button>
                </div>
            </div>
        </>
    );
}

// ─── Recommend Group Modal ────────────────────────────────────────────────────
function RecommendGroupModal({ mentee, groups, onClose, onConfirm }: {
    mentee: CoordPotentialMentee;
    groups: CoordGroup[];
    onClose: () => void;
    onConfirm: (menteeId: string, groupName: string) => void;
}) {
    const [selected, setSelected] = useState('');
    const [done, setDone] = useState(false);
    const available = groups.filter(g => g.status === 'Open');
    return (
        <>
            <div className="fixed inset-0 z-[200] bg-black/40" onClick={onClose} />
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 flex flex-col gap-5" onClick={e => e.stopPropagation()}>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Recommend Another Group</h2>
                        <p className="text-xs text-gray-400 mt-0.5">For <span className="font-semibold text-gray-700">{mentee.name}</span></p>
                    </div>
                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                        {available.map(g => (
                            <label key={g.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${selected === g.name ? 'border-[#0b9b8a] bg-[#f0fdf9]' : 'border-gray-100 hover:border-gray-200'}`}>
                                <input type="radio" name="group" value={g.name} checked={selected === g.name} onChange={() => setSelected(g.name)} className="sr-only" />
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0" style={{ background: g.mentorColor }}>{g.mentorInitials}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900">{g.name}</p>
                                    <p className="text-xs text-gray-400">{g.barangay} · {g.availableSlots} slots · {g.type}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 text-sm font-semibold text-gray-600 border border-gray-200 px-4 py-2.5 rounded-lg">Cancel</button>
                        <button
                            onClick={() => { if (selected) { setDone(true); setTimeout(() => { onConfirm(mentee.id, selected); onClose(); }, 800); } }}
                            disabled={!selected}
                            className="flex-1 text-sm font-semibold text-white px-4 py-2.5 rounded-lg transition-colors disabled:opacity-40"
                            style={{ background: done ? '#22c55e' : '#0b9b8a' }}>
                            {done ? 'Recommended!' : 'Confirm'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ─── Potential Mentees Tab ────────────────────────────────────────────────────
function PotentialMenteesTab({
    mentees, mentors, groups, statuses, onAssign, onStatusUpdate,
}: {
    mentees: CoordPotentialMentee[];
    mentors: CoordMentor[];
    groups: CoordGroup[];
    statuses: Record<string, CoordPotentialMentee['status']>;
    onAssign: (id: string, mentor: string) => void;
    onStatusUpdate: (id: string, status: CoordPotentialMentee['status']) => void;
}) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<string>('All');
    const [viewingMentee, setViewingMentee] = useState<CoordPotentialMentee | null>(null);
    const [assigningMentee, setAssigningMentee] = useState<CoordPotentialMentee | null>(null);
    const [recommendingMentee, setRecommendingMentee] = useState<CoordPotentialMentee | null>(null);

    const STATUS_FILTERS = ['All', 'New', 'Waiting for Assignment', 'Assigned to Mentor', 'Interview Scheduled', 'Interview Completed', 'Accepted'];

    const resolved = mentees.map(m => ({ ...m, status: (statuses[m.id] ?? m.status) as CoordPotentialMentee['status'] }));
    const filtered = resolved.filter(m => {
        const ms = search.toLowerCase();
        return (filter === 'All' || m.status === filter) &&
            (m.name.toLowerCase().includes(ms) || m.barangay.toLowerCase().includes(ms) || m.preferredGroups.some(g => g.toLowerCase().includes(ms)));
    });

    return (
        <div>
            {viewingMentee && (
                <ViewDetailsModal
                    mentee={{ ...viewingMentee, status: statuses[viewingMentee.id] ?? viewingMentee.status } as CoordPotentialMentee}
                    onClose={() => setViewingMentee(null)}
                    onAssign={() => { setViewingMentee(null); setAssigningMentee(viewingMentee); }}
                    onRecommend={() => { setViewingMentee(null); setRecommendingMentee(viewingMentee); }}
                />
            )}
            {assigningMentee && (
                <AssignMentorModal
                    mentee={assigningMentee}
                    mentors={mentors}
                    onClose={() => setAssigningMentee(null)}
                    onAssign={(id, mentor) => { onAssign(id, mentor); onStatusUpdate(id, 'Assigned to Mentor'); }}
                />
            )}
            {recommendingMentee && (
                <RecommendGroupModal
                    mentee={recommendingMentee}
                    groups={groups}
                    onClose={() => setRecommendingMentee(null)}
                    onConfirm={(id) => onStatusUpdate(id, 'Waiting for Assignment')}
                />
            )}

            <div className="mb-6">
                <h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Potential Mentees</h1>
                <p className="text-sm text-gray-400 mt-1">All incoming potential mentees for this cluster.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
                    <input type="text" placeholder="Search name, barangay, group..." value={search} onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b9b8a] w-56 bg-white" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {STATUS_FILTERS.map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${filter === f ? 'bg-[#0b9b8a] text-white border-[#0b9b8a]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-[#f8f9fc] text-[10px] text-gray-400 uppercase tracking-widest">
                            {['Name', 'Preferred Group (max 2)', 'Barangay', 'Type', 'Date Submitted', 'Status', 'Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filtered.map(m => (
                            <tr key={m.id} className="hover:bg-[#f8f9fc] transition-colors">
                                <td className="px-4 py-3.5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0" style={{ background: avatarColor(m.id) }}>{m.initials}</div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-xs">{m.name}</p>
                                            <p className="text-[10px] text-gray-400">{m.age} · {m.gender}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3.5">
                                    <div className="flex flex-col gap-0.5">
                                        {m.preferredGroups.map((g, i) => (
                                            <span key={i} className="text-[11px] text-gray-700 leading-snug">
                                                <span className="text-gray-400 mr-1">{i + 1}.</span>{g}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-3.5 text-xs text-gray-600">{m.barangay}</td>
                                <td className="px-4 py-3.5">
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.groupType === 'Community-based' ? 'bg-[#d3f9f0] text-[#0c8a6e]' : 'bg-[#e0f0ff] text-[#1971c2]'}`}>
                                        {m.groupType}
                                    </span>
                                </td>
                                <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{m.dateSubmitted}</td>
                                <td className="px-4 py-3.5">
                                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_STYLE[m.status]}`}>{m.status}</span>
                                </td>
                                <td className="px-4 py-3.5">
                                    <div className="flex items-center gap-1.5 flex-nowrap">
                                        <button onClick={() => setViewingMentee(m)} className="text-[11px] font-semibold text-[#0b9b8a] hover:underline whitespace-nowrap">View</button>
                                        <span className="text-gray-200">|</span>
                                        <button onClick={() => setAssigningMentee(m)} className="text-[11px] font-semibold text-[#5b50d6] hover:underline whitespace-nowrap">Assign</button>
                                        <span className="text-gray-200">|</span>
                                        <button onClick={() => setRecommendingMentee(m)} className="text-[11px] font-semibold text-gray-500 hover:underline whitespace-nowrap">Recommend</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">No potential mentees found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Mentors Tab ──────────────────────────────────────────────────────────────
function MentorsTab({ mentors }: { mentors: CoordMentor[] }) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
    const filtered = mentors.filter(m => {
        const ms = search.toLowerCase();
        return (filter === 'All' || m.status === filter) &&
            (m.name.toLowerCase().includes(ms) || m.group.toLowerCase().includes(ms) || m.barangay.toLowerCase().includes(ms));
    });
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Mentors</h1>
                <p className="text-sm text-gray-400 mt-1">All mentors within the cluster.</p>
            </div>
            <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
                    <input type="text" placeholder="Search mentors..." value={search} onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b9b8a] w-52 bg-white" />
                </div>
                {(['All', 'Active', 'Inactive'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors ${filter === f ? 'bg-[#0b9b8a] text-white border-[#0b9b8a]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>{f}</button>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {filtered.map(m => {
                    const slotPct = Math.round((m.activeMentees / m.groupCapacity) * 100);
                    return (
                        <div key={m.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0" style={{ background: m.color }}>{m.initials}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-bold text-gray-900 text-base leading-tight">{m.name}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{m.group} · {m.barangay}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${m.status === 'Active' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-gray-100 text-gray-500'}`}>{m.status}</span>
                                    </div>
                                    <div className="flex gap-4 mt-1.5 text-[11px] text-gray-500">
                                        <span>📞 {m.phone}</span>
                                        <span>✉ {m.email}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: 'Active Mentees',    value: m.activeMentees,   color: '#0b9b8a' },
                                    { label: 'Available Slots',   value: m.availableSlots,  color: m.availableSlots > 0 ? '#5b50d6' : '#e67700' },
                                    { label: 'Group Capacity',    value: m.groupCapacity,   color: '#1971c2' },
                                ].map(s => (
                                    <div key={s.label} className="bg-[#f8f9fc] rounded-xl p-3 text-center">
                                        <p className="text-xl font-black leading-none mb-0.5" style={{ color: s.color }}>{s.value}</p>
                                        <p className="text-[10px] text-gray-400">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                            {/* Capacity bar */}
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-[11px] text-gray-500">Group Capacity Used</span>
                                    <span className="text-[11px] font-semibold text-gray-700">{slotPct}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all" style={{ width: `${slotPct}%`, background: slotPct >= 100 ? '#e67700' : '#0b9b8a' }} />
                                </div>
                            </div>
                            {/* Availability badge */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Availability</span>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${m.availableSlots > 0 && m.status === 'Active' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[#991b1b]'}`}>
                                    {m.availableSlots > 0 && m.status === 'Active' ? `${m.availableSlots} slots available` : 'Not Available'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── C2S Groups Tab ───────────────────────────────────────────────────────────
function GroupsTab({ groups }: { groups: CoordGroup[] }) {
    const [filter, setFilter] = useState<'All' | 'Community-based' | 'Church-based'>('All');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'Full' | 'Closed'>('All');
    const filtered = groups.filter(g => (filter === 'All' || g.type === filter) && (statusFilter === 'All' || g.status === statusFilter));
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">C2S Groups</h1>
                <p className="text-sm text-gray-400 mt-1">All groups within the cluster.</p>
            </div>
            <div className="flex items-center gap-2 mb-5 flex-wrap">
                {(['All', 'Community-based', 'Church-based'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${filter === f ? 'bg-[#0b9b8a] text-white border-[#0b9b8a]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>{f}</button>
                ))}
                <div className="w-px h-5 bg-gray-200 mx-1" />
                {(['All', 'Open', 'Full', 'Closed'] as const).map(f => (
                    <button key={f} onClick={() => setStatusFilter(f)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${statusFilter === f ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>{f}</button>
                ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-[#f8f9fc] text-[10px] text-gray-400 uppercase tracking-widest">
                            {['Group Name', 'Mentor', 'Barangay', 'Type', 'Members', 'Capacity', 'Available', 'Status', 'Schedule'].map(h => (
                                <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filtered.map(g => {
                            const pct = Math.round((g.members / g.capacity) * 100);
                            return (
                                <tr key={g.id} className="hover:bg-[#f8f9fc] transition-colors">
                                    <td className="px-4 py-3.5 font-semibold text-gray-900 text-sm">{g.name}</td>
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0" style={{ background: g.mentorColor }}>{g.mentorInitials}</div>
                                            <span className="text-xs text-gray-700 whitespace-nowrap">{g.mentor}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">{g.barangay}</td>
                                    <td className="px-4 py-3.5">
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${g.type === 'Community-based' ? 'bg-[#d3f9f0] text-[#0c8a6e]' : 'bg-[#e0f0ff] text-[#1971c2]'}`}>{g.type}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 100 ? '#e67700' : '#0b9b8a' }} />
                                            </div>
                                            <span className="text-xs font-semibold text-gray-700">{g.members}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-xs text-center text-gray-600">{g.capacity}</td>
                                    <td className="px-4 py-3.5 text-center">
                                        <span className={`text-xs font-bold ${g.availableSlots > 0 ? 'text-[#0b9b8a]' : 'text-[#e67700]'}`}>{g.availableSlots}</span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${g.status === 'Open' ? 'bg-[#dcfce7] text-[#166534]' : g.status === 'Full' ? 'bg-[#fef9c3] text-[#92400e]' : 'bg-gray-100 text-gray-500'}`}>{g.status}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{g.schedule}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Reports Tab (with embedded map) ─────────────────────────────────────────
function CoordReportsTab({ clusterName, groups, reportsContent }: {
    clusterName: string;
    groups: CoordGroup[];
    reportsContent?: ReactNode;
}) {
    const [mapType, setMapType] = useState<'All' | 'Community-based' | 'Church-based'>('All');
    const filteredGroups = mapType === 'All' ? groups : groups.filter(g => g.type === mapType);
    const mapGroups = coordGroupsToMapGroups(filteredGroups);

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

            {/* Charts (passed from dashboard/page.tsx) */}
            {reportsContent}

            {/* Summary stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mb-10">
                {[
                    { value: COORD_POTENTIAL_MENTEES.length,                                  label: 'Total Potential',  sub: 'All statuses',      color: '#0b9b8a' },
                    { value: COORD_POTENTIAL_MENTEES.filter(m => m.status === 'New').length,  label: 'New This Week',    sub: 'Not yet processed', color: '#e91e8c' },
                    { value: COORD_MENTORS.filter(m => m.status === 'Active').length,          label: 'Active Mentors',   sub: 'Available',         color: '#5b50d6' },
                    { value: COORD_GROUPS.filter(g => g.status === 'Open').length,            label: 'Open Groups',      sub: 'Accepting now',     color: '#1971c2' },
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
                <p className="text-sm text-gray-400 mt-0.5">Group distribution within the cluster — powered by OpenStreetMap.</p>
            </div>
            <div className="flex items-center gap-2 mb-4">
                {(['All', 'Community-based', 'Church-based'] as const).map(t => (
                    <button key={t} onClick={() => setMapType(t)}
                        className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors ${mapType === t ? 'bg-[#0b9b8a] text-white border-[#0b9b8a]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>{t}</button>
                ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4" style={{ height: 420 }}>
                <ClusterMapDynamic groups={mapGroups} accentColor="#0b9b8a" />
            </div>
            <div className="flex items-center gap-6 mb-5">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ background: '#0b9b8a' }} />
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
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 shadow"
                            style={{ background: g.type === 'Church-based' ? '#1971c2' : '#0b9b8a' }}>{g.members}</div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm">{g.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{g.barangay} · {g.mentor}</p>
                        </div>
                        <div className="text-right shrink-0 flex flex-col gap-1">
                            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${g.type === 'Community-based' ? 'bg-[#d3f9f0] text-[#0c8a6e]' : 'bg-[#e0f0ff] text-[#1971c2]'}`}>{g.type}</span>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${g.status === 'Open' ? 'bg-[#dcfce7] text-[#166534]' : g.status === 'Full' ? 'bg-[#fef9c3] text-[#92400e]' : 'bg-gray-100 text-gray-500'}`}>{g.status}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Map Tab ──────────────────────────────────────────────────────────────────
import dynamic from 'next/dynamic';
import type { ClusterMapGroup } from '@/components/ClusterMap';

const ClusterMapDynamic = dynamic(() => import('@/components/ClusterMap'), { ssr: false });

function coordGroupsToMapGroups(groups: CoordGroup[]): ClusterMapGroup[] {
    // lat/lng approximate positions for each barangay group
    const coords: Record<string, { lat: number; lng: number }> = {
        'cg1': { lat: 14.3450, lng: 120.9280 },
        'cg2': { lat: 14.3380, lng: 120.9520 },
        'cg3': { lat: 14.3180, lng: 120.9400 },
        'cg4': { lat: 14.3320, lng: 120.9200 },
        'cg5': { lat: 14.3550, lng: 120.9350 },
        'cg6': { lat: 14.3480, lng: 120.9450 },
    };
    return groups.map(g => ({
        id: g.id, name: g.name, barangay: g.barangay,
        type: g.type, members: g.members, capacity: g.capacity,
        mentor: g.mentor, status: g.status,
        lat: coords[g.id]?.lat ?? 14.3294,
        lng: coords[g.id]?.lng ?? 120.9367,
    }));
}

function CoordMapTab({ groups }: { groups: CoordGroup[] }) {
    const [mapType, setMapType] = useState<'All' | 'Community-based' | 'Church-based'>('All');
    const filtered = mapType === 'All' ? groups : groups.filter(g => g.type === mapType);
    const mapGroups = coordGroupsToMapGroups(filtered);

    return (
        <div>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Interactive Map</h1>
                    <p className="text-sm text-gray-400 mt-1">Group distribution within the cluster — powered by OpenStreetMap.</p>
                </div>
            </div>
            <div className="flex items-center gap-2 mb-5">
                {(['All', 'Community-based', 'Church-based'] as const).map(t => (
                    <button key={t} onClick={() => setMapType(t)}
                        className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors ${mapType === t ? 'bg-[#0b9b8a] text-white border-[#0b9b8a]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>{t}</button>
                ))}
            </div>

            {/* OSM Map */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6" style={{ height: 440 }}>
                <ClusterMapDynamic groups={mapGroups} accentColor="#0b9b8a" />
            </div>

            {/* Legend + group list */}
            <div className="flex items-center gap-6 mb-5">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ background: '#0b9b8a' }} />
                    <span className="text-xs text-gray-600 font-medium">Community-based</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ background: '#1971c2' }} />
                    <span className="text-xs text-gray-600 font-medium">Church-based</span>
                </div>
                <p className="text-xs text-gray-400 ml-auto">Click a marker to see group details</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filtered.map(g => (
                    <div key={g.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 shadow"
                            style={{ background: g.type === 'Church-based' ? '#1971c2' : '#0b9b8a' }}>{g.members}</div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm">{g.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{g.barangay} · {g.mentor}</p>
                        </div>
                        <div className="text-right shrink-0 flex flex-col gap-1">
                            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${g.type === 'Community-based' ? 'bg-[#d3f9f0] text-[#0c8a6e]' : 'bg-[#e0f0ff] text-[#1971c2]'}`}>{g.type}</span>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${g.status === 'Open' ? 'bg-[#dcfce7] text-[#166534]' : g.status === 'Full' ? 'bg-[#fef9c3] text-[#92400e]' : 'bg-gray-100 text-gray-500'}`}>{g.status}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Dashboard Notifications (shown at bottom of Dashboard tab) ──────────────
function CoordDashboardNotifications() {
    const [notifs, setNotifs] = useState(COORD_NOTIFICATIONS);
    const unread = notifs.filter(n => !n.read).length;
    const iconMap: Record<string, { bg: string; color: string; path: string }> = {
        new_mentee: { bg: '#ede9fe', color: '#6741d9', path: 'M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
        accepted:   { bg: '#dcfce7', color: '#166534', path: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' },
        reassign:   { bg: '#fef9c3', color: '#92400e', path: 'M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z' },
        capacity:   { bg: '#fee2e2', color: '#991b1b', path: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z' },
        interview:  { bg: '#d3f9f0', color: '#0c8a6e', path: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z' },
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
                        className="text-xs font-semibold text-[#0b9b8a] hover:underline">Mark all as read</button>
                )}
            </div>
            <div className="divide-y divide-gray-50">
                {notifs.map(n => {
                    const ic = iconMap[n.type] ?? iconMap.new_mentee;
                    return (
                        <div key={n.id} onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                            className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition-colors hover:bg-gray-50 ${!n.read ? 'bg-[#f0fdf9]' : ''}`}>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: ic.bg }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill={ic.color}><path d={ic.path}/></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-snug ${n.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>{n.text}</p>
                                <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                            </div>
                            {!n.read && <div className="w-2 h-2 rounded-full bg-[#0b9b8a] shrink-0 mt-1.5" />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────
function CoordNotifsTab() {
    const [notifs, setNotifs] = useState(COORD_NOTIFICATIONS);
    const unread = notifs.filter(n => !n.read).length;
    const iconMap: Record<string, { bg: string; color: string; path: string }> = {
        new_mentee: { bg: '#ede9fe', color: '#6741d9', path: 'M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
        accepted:   { bg: '#dcfce7', color: '#166534', path: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' },
        reassign:   { bg: '#fef9c3', color: '#92400e', path: 'M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z' },
        capacity:   { bg: '#fee2e2', color: '#991b1b', path: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z' },
        interview:  { bg: '#d3f9f0', color: '#0c8a6e', path: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z' },
    };
    return (
        <div>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Notifications</h1>
                    <p className="text-sm text-gray-400 mt-1">{unread} unread</p>
                </div>
                {unread > 0 && (
                    <button onClick={() => setNotifs(prev => prev.map(n => ({ ...n, read: true })))} className="text-xs font-semibold text-[#0b9b8a] hover:underline">Mark all as read</button>
                )}
            </div>
            <div className="flex flex-col gap-3">
                {notifs.map(n => {
                    const ic = iconMap[n.type] ?? iconMap.new_mentee;
                    return (
                        <div key={n.id} onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                            className={`bg-white rounded-2xl border p-5 flex items-start gap-4 cursor-pointer transition-colors ${n.read ? 'border-gray-100' : 'border-[#0b9b8a]/30 bg-[#f0fdf9]'}`}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: ic.bg }}>
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill={ic.color}><path d={ic.path}/></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-snug ${n.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>{n.text}</p>
                                <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                            </div>
                            {!n.read && <div className="w-2 h-2 rounded-full bg-[#0b9b8a] shrink-0 mt-1.5" />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Hub Application type ─────────────────────────────────────────────────────
interface HubApplication {
    id: string;
    name: string;
    barangay: string;
    phone: string;
    schedule: string;
    family: number;
    potential: number;
    submitted: string;
    status: 'Pending' | 'Approved' | 'Rejected';
}

const HUB_STATUS_STYLE: Record<string, string> = {
    'Pending':  'bg-[#fef9c3] text-[#92400e]',
    'Approved': 'bg-[#dcfce7] text-[#166534]',
    'Rejected': 'bg-[#fee2e2] text-[#991b1b]',
};

// ─── Potential C2S Groups Tab ─────────────────────────────────────────────────
function PotentialC2SGroupsTab() {
    const [apps, setApps] = useState<HubApplication[]>([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
    const [viewing, setViewing] = useState<HubApplication | null>(null);
    const [confirm, setConfirm] = useState<{ id: string; name: string; action: 'Approved' | 'Rejected' } | null>(null);

    function load() {
        try {
            const stored = JSON.parse(localStorage.getItem(HUB_APPLICATIONS_KEY) ?? '[]') as HubApplication[];
            setApps(stored);
        } catch { setApps([]); }
    }

    useEffect(() => {
        load();
        const handler = () => load();
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    function updateStatus(id: string, status: HubApplication['status']) {
        const updated = apps.map(a => a.id === id ? { ...a, status } : a);
        setApps(updated);
        localStorage.setItem(HUB_APPLICATIONS_KEY, JSON.stringify(updated));
        if (viewing?.id === id) setViewing(prev => prev ? { ...prev, status } : null);
        setConfirm(null);
    }

    function requestAction(app: HubApplication, action: 'Approved' | 'Rejected') {
        setConfirm({ id: app.id, name: app.name, action });
    }

    const filtered = apps.filter(a => {
        const s = search.toLowerCase();
        return (filter === 'All' || a.status === filter) &&
            (a.name.toLowerCase().includes(s) || a.barangay.toLowerCase().includes(s));
    });

    return (
        <div>
            {/* ── Confirmation dialog ── */}
            {confirm && (
                <>
                    <div className="fixed inset-0 z-[200] bg-black/40" onClick={() => setConfirm(null)} />
                    <div className="fixed inset-0 z-[201] flex items-center justify-center p-4" onClick={() => setConfirm(null)}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 flex flex-col gap-5" onClick={e => e.stopPropagation()}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${confirm.action === 'Approved' ? 'bg-[#d3f9f0]' : 'bg-[#fee2e2]'}`}>
                                {confirm.action === 'Approved'
                                    ? <svg className="w-6 h-6 text-[#0b9b8a]" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                    : <svg className="w-6 h-6 text-[#e6184d]" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                                }
                            </div>
                            <div className="text-center">
                                <h3 className="text-base font-bold text-gray-900 mb-1">
                                    {confirm.action === 'Approved' ? 'Approve Application?' : 'Reject Application?'}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {confirm.action === 'Approved'
                                        ? <>Are you sure you want to <span className="font-semibold text-[#0b9b8a]">approve</span> the hub application of <span className="font-semibold text-gray-700">{confirm.name}</span>?</>
                                        : <>Are you sure you want to <span className="font-semibold text-[#e6184d]">reject</span> the hub application of <span className="font-semibold text-gray-700">{confirm.name}</span>?</>
                                    }
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setConfirm(null)}
                                    className="flex-1 text-sm font-semibold text-gray-600 border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={() => updateStatus(confirm.id, confirm.action)}
                                    className="flex-1 text-sm font-semibold text-white px-4 py-2.5 rounded-lg transition-colors"
                                    style={{ background: confirm.action === 'Approved' ? '#0b9b8a' : '#e6184d' }}>
                                    {confirm.action === 'Approved' ? 'Yes, Approve' : 'Yes, Reject'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Detail slide-over */}
            {viewing && (
                <>
                    <div className="fixed inset-0 z-[100] bg-black/40" onClick={() => setViewing(null)} />
                    <div className="fixed top-0 right-0 bottom-0 z-[101] w-[420px] max-w-full bg-white shadow-2xl flex flex-col overflow-hidden">
                        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Hub Application</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Submitted {viewing.submitted}</p>
                            </div>
                            <button onClick={() => setViewing(null)} className="text-gray-400 hover:text-gray-700 p-1">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
                            {/* Name + status */}
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#e0f7f5] flex items-center justify-center text-[#0b9b8a] font-black text-lg shrink-0">
                                    {viewing.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-gray-900 text-base">{viewing.name}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${HUB_STATUS_STYLE[viewing.status]}`}>{viewing.status}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">{viewing.barangay} · {viewing.phone}</p>
                                </div>
                            </div>
                            {/* Details */}
                            <section className="rounded-xl border border-gray-100 bg-[#f8f9fc] overflow-hidden">
                                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-2">Application Details</p>
                                <div className="divide-y divide-gray-100">
                                    {[
                                        { label: 'Preferred Schedule', value: viewing.schedule },
                                        { label: 'Potential C2S Members', value: String(viewing.potential) },
                                        { label: 'Date Submitted', value: viewing.submitted },
                                    ].map(r => (
                                        <div key={r.label} className="flex items-center justify-between px-4 py-2.5">
                                            <span className="text-xs text-gray-500">{r.label}</span>
                                            <span className="text-xs font-medium text-gray-800">{r.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                        {/* Footer actions */}
                        {viewing.status === 'Pending' && (
                            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                                <button
                                    onClick={() => requestAction(viewing, 'Approved')}
                                    className="flex-1 text-sm font-semibold text-white py-2.5 rounded-lg"
                                    style={{ background: '#0b9b8a' }}>
                                    Approve
                                </button>
                                <button
                                    onClick={() => requestAction(viewing, 'Rejected')}
                                    className="flex-1 text-sm font-semibold text-white py-2.5 rounded-lg"
                                    style={{ background: '#e6184d' }}>
                                    Reject
                                </button>
                            </div>
                        )}
                        {viewing.status !== 'Pending' && (
                            <div className="px-6 py-4 border-t border-gray-100">
                                <button
                                    onClick={() => updateStatus(viewing.id, 'Pending')}
                                    className="w-full text-sm font-semibold text-gray-600 border border-gray-200 py-2.5 rounded-lg hover:bg-gray-50">
                                    Reset to Pending
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            <div className="mb-6">
                <h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Potential C2S Groups</h1>
                <p className="text-sm text-gray-400 mt-1">Applications to host a Connect2Souls devotion hub.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
                    <input type="text" placeholder="Search name or barangay..." value={search} onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b9b8a] w-56 bg-white" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${filter === f ? 'bg-[#0b9b8a] text-white border-[#0b9b8a]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                            {f}
                        </button>
                    ))}
                </div>
                <span className="ml-auto text-xs text-gray-400">{filtered.length} application{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
                    <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                    <p className="text-sm text-gray-400 font-medium">No applications yet</p>
                    <p className="text-xs text-gray-300 mt-1">Hub applications from C2S Finder will appear here.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#f8f9fc] text-[10px] text-gray-400 uppercase tracking-widest">
                                {['Applicant', 'Barangay', 'Schedule', 'Potential Members', 'Date Submitted', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(a => (
                                <tr key={a.id} className="hover:bg-[#f8f9fc] transition-colors">
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-full bg-[#e0f7f5] flex items-center justify-center text-[#0b9b8a] text-[10px] font-black shrink-0">
                                                {a.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-xs">{a.name}</p>
                                                <p className="text-[10px] text-gray-400">{a.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-xs text-gray-600">{a.barangay}</td>
                                    <td className="px-4 py-3.5 text-xs text-gray-600">{a.schedule}</td>
                                    <td className="px-4 py-3.5 text-xs text-gray-600 text-center">{a.potential}</td>
                                    <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{a.submitted}</td>
                                    <td className="px-4 py-3.5">
                                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${HUB_STATUS_STYLE[a.status]}`}>{a.status}</span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center gap-1.5 flex-nowrap">
                                            <button onClick={() => setViewing(a)} className="text-[11px] font-semibold text-[#0b9b8a] hover:underline whitespace-nowrap">View</button>
                                            {a.status === 'Pending' && (
                                                <>
                                                    <span className="text-gray-200">|</span>
                                                    <button onClick={() => requestAction(a, 'Approved')} className="text-[11px] font-semibold text-[#166534] hover:underline whitespace-nowrap">Approve</button>
                                                    <span className="text-gray-200">|</span>
                                                    <button onClick={() => requestAction(a, 'Rejected')} className="text-[11px] font-semibold text-[#e6184d] hover:underline whitespace-nowrap">Reject</button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ─── Main Coordinator Dashboard ───────────────────────────────────────────────
export default function CoordinatorDashboard({ onLogout, reportsContent }: { onLogout: () => void; reportsContent?: ReactNode }) {
    const { user } = useAuth();
    const [activeNav, setActiveNav] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const clusterName = user?.cluster ?? 'Outreach Cluster 4';

    // local state for mutations
    const [menteeStatuses, setMenteeStatuses] = useState<Record<string, CoordPotentialMentee['status']>>({});
    const [assignedMentors, setAssignedMentors] = useState<Record<string, string>>({});
    const [hubPendingCount, setHubPendingCount] = useState(0);

    useEffect(() => {
        function countPending() {
            try {
                const stored = JSON.parse(localStorage.getItem(HUB_APPLICATIONS_KEY) ?? '[]') as { status: string }[];
                setHubPendingCount(stored.filter(a => a.status === 'Pending').length);
            } catch { setHubPendingCount(0); }
        }
        countPending();
        window.addEventListener('storage', countPending);
        return () => window.removeEventListener('storage', countPending);
    }, []);

    function handleAssign(id: string, mentor: string) {
        setAssignedMentors(prev => ({ ...prev, [id]: mentor }));
        setMenteeStatuses(prev => ({ ...prev, [id]: 'Assigned to Mentor' }));
    }
    function handleStatusUpdate(id: string, status: CoordPotentialMentee['status']) {
        setMenteeStatuses(prev => ({ ...prev, [id]: status }));
    }

    const resolvedMentees = COORD_POTENTIAL_MENTEES.map(m => ({
        ...m,
        status: (menteeStatuses[m.id] ?? m.status) as CoordPotentialMentee['status'],
        assignedMentor: assignedMentors[m.id] ?? m.assignedMentor,
    }));

    // Dashboard stats
    const newCount       = resolvedMentees.filter(m => m.status === 'New').length;
    const waitingCount   = resolvedMentees.filter(m => m.status === 'Waiting for Assignment').length;
    const assignedToday  = resolvedMentees.filter(m => m.status === 'Assigned to Mentor').length;
    const activeMentors  = COORD_MENTORS.filter(m => m.status === 'Active').length;
    const openGroups     = COORD_GROUPS.filter(g => g.status === 'Open').length;
    const communityCount = COORD_GROUPS.filter(g => g.type === 'Community-based').length;
    const churchCount    = COORD_GROUPS.filter(g => g.type === 'Church-based').length;
    const unreadCount    = COORD_NOTIFICATIONS.filter(n => !n.read).length;

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
                <p className="px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Menu</p>
                <nav className="px-3 flex flex-col gap-1 flex-1 overflow-y-auto">
                    {COORD_NAV.map(item => (
                        <button key={item.key} onClick={() => { setActiveNav(item.key); setSidebarOpen(false); }}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full text-left relative ${activeNav === item.key ? 'text-gray-800 bg-white shadow-sm' : 'text-gray-500 hover:bg-white/60'}`}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill={activeNav === item.key ? '#0b9b8a' : '#aaa'}>
                                <path d={item.icon} />
                            </svg>
                            {item.label}
                            {item.key === 'potential' && (newCount + waitingCount) > 0 && (
                                <span className="ml-auto text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full shrink-0" style={{ background: '#dde0f5', color: '#6366c1' }}>{newCount + waitingCount}</span>
                            )}
                            {item.key === 'notifs' && unreadCount > 0 && (
                                <span className="ml-auto text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full shrink-0" style={{ background: '#dde0f5', color: '#6366c1' }}>{unreadCount}</span>
                            )}
                            {item.key === 'potential_c2s' && hubPendingCount > 0 && (
                                <span className="ml-auto text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full shrink-0" style={{ background: '#fef9c3', color: '#92400e' }}>{hubPendingCount}</span>
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

                    {/* -- Dashboard -- */}
                    {activeNav === 'dashboard' && (
                        <div>
                            <div className="mb-5">
                                <h1 className="text-2xl font-black text-gray-900">Connect 2 Souls</h1>
                                <p className="text-sm text-gray-400 mt-0.5">Connect, disciple and guide souls on their spiritual journey through meaningful relationships and faithful follow-up.</p>
                            </div>
                            <SharedDashboardTab data={CHURCH_WIDE_DATA} />
                        </div>
                    )}
                    {/* ── Potential Mentees Tab ── */}
                    {activeNav === 'potential' && (
                        <PotentialMenteesTab
                            mentees={resolvedMentees}
                            mentors={COORD_MENTORS}
                            groups={COORD_GROUPS}
                            statuses={menteeStatuses}
                            onAssign={handleAssign}
                            onStatusUpdate={handleStatusUpdate}
                        />
                    )}

                    {/* ── Potential C2S Groups Tab ── */}
                    {activeNav === 'potential_c2s' && <PotentialC2SGroupsTab />}

                    {/* ── Mentors Tab ── */}
                    {activeNav === 'mentors' && <MentorsTab mentors={COORD_MENTORS} />}

                    {/* ── Groups Tab ── */}
                    {activeNav === 'groups' && <GroupsTab groups={COORD_GROUPS} />}

                    {/* ── Reports Tab ── */}
                    {activeNav === 'reports' && <CoordReportsTab clusterName={clusterName} groups={COORD_GROUPS} reportsContent={reportsContent} />}

                    {/* ── Notifications Tab ── */}
                    {activeNav === 'notifs' && <CoordNotifsTab />}

            </div>
        </div>
    );
}
