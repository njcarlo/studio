'use client';

import { useState } from 'react';
import {
    ADMIN_WORKERS, ROLE_TEMPLATES, C2S_PERMISSIONS, AUDIT_LOGS, ADMIN_NOTIFICATIONS,
    GROUP_CAPACITY_CONFIGS, ORG_MINISTRIES, ADMIN_GROWTH_DATA, ADMIN_MINISTRY_PERF,
    DEPARTMENTS, MINISTRY_DEPARTMENTS,
    type Department,
    type AdminWorker, type RoleTemplate, type AuditLog, type AdminNotification,
    type OrgMinistry, type OrgCluster,
} from '@/lib/admin-data';
import {
    MH_CLUSTERS, MH_ALL_MENTORS, MH_COORDINATORS, MH_POTENTIAL_MENTEES, MH_ACTIVE_MENTEES_LIST,
    COORD_GROUPS,
} from '@/lib/data';
import SettingsModal from '@/components/SettingsModal';
import dynamic from 'next/dynamic';
import type { ClusterMapGroup } from '@/components/ClusterMap';
import {
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
    PieChart, Pie, Cell, Tooltip, Legend, CartesianGrid, XAxis, YAxis,
} from 'recharts';

const ClusterMapDynamic = dynamic(() => import('@/components/ClusterMap'), { ssr: false });

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#5b50d6', '#5b50d6', '#0b9b8a', '#e67700', '#6741d9', '#1971c2'];

// Shared ministry department <select> — always in sync with MINISTRY_DEPARTMENTS
function MinistryDeptSelect({
    value, onChange, className,
}: { value: string; onChange: (v: string) => void; className?: string }) {
    return (
        <select value={value} onChange={e => onChange(e.target.value)}
            className={className ?? 'text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#5b50d6] text-gray-700'}>
            <option value="All">All Departments</option>
            {DEPARTMENTS.map(dept => (
                <optgroup key={dept} label={dept.toUpperCase()}>
                    {MINISTRY_DEPARTMENTS[dept].map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </optgroup>
            ))}
        </select>
    );
}
function avatarColor(id: string) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

const TS = {
    borderRadius: '10px', border: 'none',
    boxShadow: '0 4px 16px rgba(0,0,0,0.10)', fontSize: '12px', padding: '8px 14px',
};

const ROLE_LABEL: Record<string, string> = {
    ministry_head:   'Ministry Head',
    cluster_head:    'Cluster Head',
    c2s_coordinator: 'Coordinator',
    mentor:          'Mentor',
    department_head: 'Department Head',
};
const ROLE_COLOR: Record<string, string> = {
    ministry_head:   '#0b9b8a',
    cluster_head:    '#6741d9',
    c2s_coordinator: '#5b50d6',
    mentor:          '#5b50d6',
    department_head: '#1971c2',
};

// ─── Sidebar Nav ──────────────────────────────────────────────────────────────
type AdminNav =
    | 'dashboard'
    | 'org'
    | 'workers'
    | 'groups'
    | 'potential_mentees'
    | 'active_mentees'
    | 'c2s_home'
    | 'reports'
    | 'notifications'
    | 'audit'
    | 'settings'
    | 'rbac';

interface NavItem {
    key: AdminNav;
    label: string;
    icon: string;
    badge?: number;
    section?: string;
}

const ADMIN_NAV: NavItem[] = [
    { key: 'dashboard',         label: 'Dashboard',          section: 'OVERVIEW', icon: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zm-2-4H10v-2h8v2zm-4 4H10v-2h4v2zm4-8H10V6h8v2z' },
    { key: 'org',               label: 'Departments',         section: 'OVERVIEW', icon: 'M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z' },
    { key: 'workers',           label: 'Workers',             section: 'PEOPLE',   icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
    { key: 'groups',            label: 'C2S Groups',          section: 'C2S',      icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
    { key: 'potential_mentees', label: 'Potential Mentees',   section: 'C2S',      icon: 'M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
    { key: 'active_mentees',    label: 'Active Mentees',      section: 'C2S',      icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
    { key: 'c2s_home',          label: 'C2S Home Groups',     section: 'C2S',      icon: 'M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z' },
    { key: 'reports',           label: 'Reports & Analytics', section: 'ANALYTICS',icon: 'M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z' },
    { key: 'notifications',     label: 'Notifications',       section: 'SYSTEM',   icon: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z' },
    { key: 'audit',             label: 'Audit Logs',          section: 'SYSTEM',   icon: 'M9 5H7c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-2c0-1.1-.9-2-2-2s-2 .9-2 2zm2 0h2v1h-2V5zm1 12l-3-3 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z' },
    { key: 'settings',          label: 'Settings',            section: 'SYSTEM',   icon: 'M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54A.484.484 0 0 0 14 4h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87a.47.47 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.47.47 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.37 1.04.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 0 0-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z' },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub: string; color: string; icon: string }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + '18' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={color}><path d={icon}/></svg>
                </div>
            </div>
            <p className="text-3xl font-black leading-none mb-1" style={{ color }}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
            <p className="text-xs text-gray-400">{sub}</p>
        </div>
    );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between mb-6">
            <div>
                <h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">{title}</h1>
                {sub && <p className="text-sm text-gray-400 mt-1">{sub}</p>}
            </div>
            {action}
        </div>
    );
}

// ─── Worker Detail Slide-Over ─────────────────────────────────────────────────
function WorkerDetailPanel({
    worker,
    onClose,
    onSave,
}: {
    worker: AdminWorker;
    onClose: () => void;
    onSave: (updated: AdminWorker) => void;
}) {
    const [activeTab, setActiveTab] = useState<'info' | 'permissions'>('info');

    // Editable draft state
    const [draftRole, setDraftRole]         = useState<AdminWorker['c2sRole']>(worker.c2sRole);
    const [draftStatus, setDraftStatus]     = useState<AdminWorker['status']>(worker.status);
    const [draftPerms, setDraftPerms]       = useState<string[]>([...worker.permissions]);
    const [editingRole, setEditingRole]     = useState(false);
    const [saved, setSaved]                 = useState(false);
    const [applyingTemplate, setApplyingTemplate] = useState(false);
    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
    const [selectedTemplates, setSelectedTemplates] = useState<string[]>(() => {
        // Pre-select the template matching the worker's current role
        const match = ROLE_TEMPLATES.find(rt =>
            (worker.c2sRole === 'ministry_head'   && rt.name === 'Ministry Head')   ||
            (worker.c2sRole === 'cluster_head'    && rt.name === 'Cluster Head')    ||
            (worker.c2sRole === 'c2s_coordinator' && rt.name === 'C2S Coordinator') ||
            (worker.c2sRole === 'mentor'          && rt.name === 'Mentor')
        );
        return match ? [match.id] : [];
    });

    const permGroups = [...new Set(C2S_PERMISSIONS.map(p => p.group))];
    const hasChanges =
        draftRole !== worker.c2sRole ||
        draftStatus !== worker.status ||
        JSON.stringify([...draftPerms].sort()) !== JSON.stringify([...worker.permissions].sort());

    function togglePerm(key: string) {
        setDraftPerms(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    }

    function toggleTemplateSelection(rtId: string) {
        const newSelected = selectedTemplates.includes(rtId)
            ? selectedTemplates.filter(id => id !== rtId)
            : [...selectedTemplates, rtId];
        setSelectedTemplates(newSelected);
        // Merge permissions from all selected templates
        const mergedPerms = [...new Set(
            ROLE_TEMPLATES
                .filter(rt => newSelected.includes(rt.id))
                .flatMap(rt => rt.permissions)
        )];
        setDraftPerms(mergedPerms);
    }

    function handleSave() {
        const updated: AdminWorker = {
            ...worker,
            c2sRole:     draftRole,
            status:      draftStatus,
            permissions: draftPerms,
        };
        onSave(updated);
        setSaved(true);
        setTimeout(() => { setSaved(false); }, 1800);
    }

    function handleRoleSelect(role: AdminWorker['c2sRole']) {
        setDraftRole(role);
        // Auto-apply the matching role template permissions
        const match = ROLE_TEMPLATES.find(rt =>
            rt.name.toLowerCase().replace(' ', '_') === role ||
            (role === 'ministry_head'   && rt.name === 'Ministry Head')   ||
            (role === 'cluster_head'    && rt.name === 'Cluster Head')    ||
            (role === 'c2s_coordinator' && rt.name === 'C2S Coordinator') ||
            (role === 'mentor'          && rt.name === 'Mentor')
        );
        if (match) {
            setDraftPerms([...match.permissions]);
            setSelectedTemplates([match.id]);
        } else {
            setSelectedTemplates([]);
        }
        setEditingRole(false);
    }

    const ALL_ROLES: { value: AdminWorker['c2sRole']; label: string; color: string }[] = [
        { value: 'ministry_head',   label: 'Ministry Head',   color: '#0b9b8a' },
        { value: 'cluster_head',    label: 'Cluster Head',    color: '#6741d9' },
        { value: 'c2s_coordinator', label: 'Coordinator',     color: '#5b50d6' },
        { value: 'mentor',          label: 'Mentor',          color: '#5b50d6' },
        { value: 'department_head', label: 'Department Head', color: '#1971c2' },
    ];

    return (
        <>
            <div className="fixed inset-0 z-[100] bg-black/40" onClick={onClose} />
            <div className="fixed top-0 right-0 bottom-0 z-[101] w-[500px] max-w-full bg-white shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0" style={{ background: worker.color }}>
                            {worker.initials}
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">{worker.name}</h2>
                            <p className="text-xs text-gray-400 mt-0.5">{worker.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 mt-0.5">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </button>
                </div>

                {/* Tab switcher */}
                <div className="flex border-b border-gray-100 shrink-0">
                    {(['info', 'permissions'] as const).map(t => (
                        <button key={t} onClick={() => setActiveTab(t)}
                            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === t ? 'text-[#5b50d6] border-b-2 border-[#5b50d6]' : 'text-gray-400 hover:text-gray-700'}`}>
                            {t === 'info' ? 'Worker Info' : 'Manage Permissions'}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">

                    {/* ── Worker Info Tab ── */}
                    {activeTab === 'info' && (
                        <div className="flex flex-col gap-5">

                            {/* Status badges row */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {draftRole && (
                                    <span className="text-[11px] font-bold px-3 py-1 rounded-full text-white" style={{ background: ROLE_COLOR[draftRole] ?? '#5b50d6' }}>
                                        {ROLE_LABEL[draftRole]}
                                    </span>
                                )}
                                <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${draftStatus === 'Active' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-gray-100 text-gray-500'}`}>
                                    {draftStatus}
                                </span>
                                <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${worker.workerIdStatus === 'Approved' ? 'bg-[#dbeafe] text-[#1d4ed8]' : worker.workerIdStatus === 'Pending' ? 'bg-[#fef9c3] text-[#92400e]' : 'bg-gray-100 text-gray-500'}`}>
                                    Worker ID: {worker.workerIdStatus}
                                </span>
                                {hasChanges && (
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#fef9c3] text-[#92400e]">Unsaved changes</span>
                                )}
                            </div>

                            {/* Static details */}
                            <section className="rounded-xl border border-gray-100 overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
                                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-2">Details</p>
                                <div className="divide-y divide-gray-100">
                                    {[
                                        { label: 'Phone',      value: worker.phone },
                                        { label: 'Ministry',   value: worker.ministry },
                                        { label: 'Cluster',    value: worker.cluster ?? '—' },
                                        { label: 'Date Added', value: worker.dateAdded },
                                    ].map(r => (
                                        <div key={r.label} className="flex items-center justify-between px-4 py-2.5">
                                            <span className="text-xs text-gray-500">{r.label}</span>
                                            <span className="text-xs font-medium text-gray-800">{r.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* ── Edit C2S Role ── */}
                            <section className="rounded-xl border border-gray-100 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--bg-subtle)' }}>
                                    <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">C2S Role</p>
                                    <button
                                        onClick={() => setEditingRole(!editingRole)}
                                        className={`text-[11px] font-bold px-3 py-1 rounded-full transition-colors ${editingRole ? 'bg-gray-200 text-gray-600' : 'bg-[#ede9fe] text-[#5b50d6] hover:bg-[#ddd6fe]'}`}>
                                        {editingRole ? 'Cancel' : 'Edit Role'}
                                    </button>
                                </div>

                                {!editingRole ? (
                                    /* Read-only role display */
                                    <div className="px-4 py-3 flex items-center gap-3">
                                        {draftRole ? (
                                            <>
                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: (ROLE_COLOR[draftRole] ?? '#5b50d6') + '18' }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill={ROLE_COLOR[draftRole] ?? '#5b50d6'}><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{ROLE_LABEL[draftRole]}</p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                                        {draftPerms.length} permission{draftPerms.length !== 1 ? 's' : ''} assigned
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">No C2S role assigned</p>
                                        )}
                                    </div>
                                ) : (
                                    /* Role picker */
                                    <div className="p-3 flex flex-col gap-2">
                                        <p className="text-[10px] text-gray-400 mb-1">
                                            Selecting a role will auto-apply its default permissions. You can fine-tune them in the Permissions tab.
                                        </p>
                                        {ALL_ROLES.map(r => (
                                            <button
                                                key={r.value}
                                                onClick={() => handleRoleSelect(r.value)}
                                                className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors ${draftRole === r.value ? 'border-[#5b50d6] bg-[#f5f3ff]' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: r.color + '18' }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill={r.color}><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-gray-900">{r.label}</p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                                        {ROLE_TEMPLATES.find(t =>
                                                            t.name === r.label ||
                                                            (r.value === 'c2s_coordinator' && t.name === 'C2S Coordinator')
                                                        )?.permissions.length ?? 0} default permissions
                                                    </p>
                                                </div>
                                                {draftRole === r.value && (
                                                    <svg className="w-4 h-4 text-[#5b50d6] shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                                )}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => handleRoleSelect(undefined)}
                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors ${draftRole === undefined ? 'border-[#5b50d6] bg-[#f5f3ff]' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                                            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="#9ca3af"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/></svg>
                                            </div>
                                            <p className="text-sm font-semibold text-gray-500">Remove Role</p>
                                        </button>
                                    </div>
                                )}
                            </section>

                            {/* ── Activate / Deactivate ── */}
                            <section className="rounded-xl border border-gray-100 overflow-hidden">
                                <div className="px-4 py-3" style={{ background: 'var(--bg-subtle)' }}>
                                    <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Account Status</p>
                                </div>
                                <div className="px-4 py-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {draftStatus === 'Active' ? 'Worker is Active' : 'Worker is Inactive'}
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                            {draftStatus === 'Active'
                                                ? 'Can log in and access C2S features based on role'
                                                : 'Access revoked — cannot log in'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => draftStatus === 'Active' ? setShowDeactivateConfirm(true) : setDraftStatus('Active')}
                                        className={`ml-4 shrink-0 text-xs font-bold px-4 py-2 rounded-xl border transition-colors ${draftStatus === 'Active'
                                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                                            : 'border-green-200 text-green-700 hover:bg-green-50'}`}>
                                        {draftStatus === 'Active' ? 'Deactivate' : 'Activate'}
                                    </button>
                                </div>
                            </section>

                            {/* Worker ID approval */}
                            {worker.workerIdStatus === 'Pending' && (
                                <section className="rounded-xl border border-[#fef9c3] bg-[#fffbeb] overflow-hidden">
                                    <div className="px-4 py-3 flex items-start gap-3">
                                        <svg className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-[#92400e]">Worker ID Request Pending</p>
                                            <p className="text-[11px] text-[#92400e] mt-0.5">Review and approve or reject this worker's ID request.</p>
                                        </div>
                                    </div>
                                    <div className="px-4 pb-3 flex gap-2">
                                        <button className="flex-1 text-xs font-bold text-white py-2 rounded-lg" style={{ background: '#0b9b8a' }}>
                                            Approve ID
                                        </button>
                                        <button className="flex-1 text-xs font-bold text-white py-2 rounded-lg" style={{ background: '#5b50d6' }}>
                                            Reject ID
                                        </button>
                                    </div>
                                </section>
                            )}
                        </div>
                    )}

                    {/* ── Permissions Tab ── */}
                    {activeTab === 'permissions' && (
                        <div className="flex flex-col gap-5">
                            {/* Apply template strip */}
                            <div className="rounded-xl border border-gray-100 overflow-hidden">
                                <button
                                    onClick={() => setApplyingTemplate(!applyingTemplate)}
                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors" style={{ background: 'var(--bg-subtle)' }}>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-[#5b50d6]" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/></svg>
                                        <p className="text-xs font-bold text-gray-700">Apply Role Template</p>
                                    </div>
                                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${applyingTemplate ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                                </button>
                                {applyingTemplate && (
                                    <div className="p-3 flex flex-col gap-2 border-t border-gray-100">
                                        <p className="text-[10px] text-gray-400 mb-1 px-1">Select roles to apply — permissions from all checked roles will be merged.</p>
                                        {ROLE_TEMPLATES.map(rt => {
                                            const checked = selectedTemplates.includes(rt.id);
                                            return (
                                                <button key={rt.id} onClick={() => toggleTemplateSelection(rt.id)}
                                                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-colors text-left ${checked ? 'border-[#5b50d6]/40 bg-[#f5f3ff]' : 'border-gray-100 hover:border-[#5b50d6]/30 hover:bg-[#f5f3ff]'}`}>
                                                    <div className="flex items-center gap-2.5">
                                                        {/* Checkbox indicator */}
                                                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${checked ? 'bg-[#5b50d6] border-[#5b50d6]' : 'border-gray-300 bg-white'}`}>
                                                            {checked && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                                                        </div>
                                                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: rt.color + '18' }}>
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill={rt.color}><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                                                        </div>
                                                        <span className="text-xs font-semibold text-gray-800">{rt.name}</span>
                                                    </div>
                                                    <span className="text-[10px] text-gray-400">{rt.permissions.length} perms</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <p className="text-xs text-gray-500 -mt-1">
                                <span className="font-semibold text-gray-800">{draftPerms.length}</span> of {C2S_PERMISSIONS.length} permissions enabled for {worker.name}.
                            </p>

                            {/* Permission groups */}
                            {permGroups.map(group => {
                                const perms = C2S_PERMISSIONS.filter(p => p.group === group);
                                const enabledCount = perms.filter(p => draftPerms.includes(p.key)).length;
                                const allEnabled   = enabledCount === perms.length;
                                return (
                                    <div key={group}>
                                        {/* Group header with select-all */}
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">{group}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-gray-400">{enabledCount}/{perms.length}</span>
                                                <button
                                                    onClick={() => {
                                                        if (allEnabled) {
                                                            setDraftPerms(prev => prev.filter(k => !perms.find(p => p.key === k)));
                                                        } else {
                                                            setDraftPerms(prev => [...new Set([...prev, ...perms.map(p => p.key)])]);
                                                        }
                                                    }}
                                                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-colors ${allEnabled ? 'bg-[#ede9fe] text-[#5b50d6] hover:bg-[#ddd6fe]' : 'bg-[#f3f4f6] text-gray-500 hover:bg-gray-200'}`}>
                                                    {allEnabled ? 'Deselect all' : 'Select all'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            {perms.map(p => {
                                                const enabled = draftPerms.includes(p.key);
                                                return (
                                                    <button
                                                        key={p.key}
                                                        onClick={() => togglePerm(p.key)}
                                                        className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${enabled ? 'border-[#5b50d6]/30 bg-[#f5f3ff]' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                                                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${enabled ? 'bg-[#5b50d6] border-[#5b50d6]' : 'border-gray-300 bg-white'}`}>
                                                            {enabled && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-[11px] font-mono font-semibold ${enabled ? 'text-[#4338ca]' : 'text-gray-600'}`}>{p.label}</p>
                                                            <p className="text-[10px] text-gray-400 mt-0.5">{p.description}</p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
                    <button onClick={onClose}
                        className="flex-1 text-sm font-semibold text-gray-600 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className={`flex-1 text-sm font-semibold text-white py-2.5 rounded-xl transition-colors ${!hasChanges ? 'opacity-60' : ''}`}
                        style={{ background: saved ? '#22c55e' : '#5b50d6' }}>
                        {saved ? '✓ Saved!' : 'Save Changes'}
                    </button>
                </div>

                {/* Deactivation confirmation modal */}
                {showDeactivateConfirm && (
                    <>
                        <div className="fixed inset-0 z-[110] bg-black/50" />
                        <div className="fixed inset-0 z-[111] flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">Deactivate Worker?</h3>
                                        <p className="text-xs text-gray-400 mt-0.5">This will revoke access for {worker.name}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-600 mb-5 leading-relaxed">
                                    Deactivating this worker will immediately revoke their login access and all C2S features. This action can be reversed by reactivating the account.
                                </p>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowDeactivateConfirm(false)}
                                        className="flex-1 text-sm font-semibold text-gray-600 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                                        Cancel
                                    </button>
                                    <button onClick={() => { setDraftStatus('Inactive'); setShowDeactivateConfirm(false); }}
                                        className="flex-1 text-sm font-semibold text-white py-2.5 rounded-xl bg-red-600 hover:bg-red-700 transition-colors">
                                        Deactivate
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

// ─── ADMIN DASHBOARD OVERVIEW ────────────────────────────────────────────────
function DashboardTab() {

    /* ── data ── */
    const totalActive    = MH_ACTIVE_MENTEES_LIST.length;
    const totalGroups    = COORD_GROUPS.length;
    const communityBased = COORD_GROUPS.filter(g => g.type === 'Community-based').length;
    const churchBased    = COORD_GROUPS.filter(g => g.type === 'Church-based').length;
    const onlineGroups   = Math.round(totalGroups * 0.35);
    const faceToFace     = totalGroups - onlineGroups;

    const safePct = (n: number, d: number) =>
        d > 0 ? `${Math.round((n / d) * 100)}%` : '—';

    const communityMentees = totalGroups > 0
        ? Math.round(totalActive * (communityBased / totalGroups)) : 0;
    const churchMentees  = totalActive - communityMentees;
    const f2fMentees     = Math.round(totalActive * (faceToFace / Math.max(totalGroups, 1)));
    const onlineMentees  = totalActive - f2fMentees;

    const HOME_GROUPS = [
        { id: 'hg1', name: 'Santos Family Home',    barangay: 'Burol',         coordinator: 'Rosa Castillo',     submitted: 'Aug 10, 2026', status: 'Pending'     as const },
        { id: 'hg2', name: 'Villanueva Home Group',  barangay: 'Paliparan III', coordinator: 'Ben Macaraeg',      submitted: 'Aug 11, 2026', status: 'Pending'     as const },
        { id: 'hg3', name: 'Reyes Household',        barangay: 'Sampaloc I',    coordinator: 'Sofia Aguila',      submitted: 'Aug 9, 2026',  status: 'Recommended' as const },
        { id: 'hg4', name: 'Cruz Home Fellowship',   barangay: 'Langkaan I',    coordinator: 'Patricia Bautista', submitted: 'Aug 7, 2026',  status: 'Approved'    as const },
        { id: 'hg5', name: 'Aquino Family Circle',   barangay: 'Salitran III',  coordinator: 'Ferdinand Ramos',   submitted: 'Aug 13, 2026', status: 'Pending'     as const },
        { id: 'hg6', name: 'Dela Cruz Gatherings',   barangay: 'San Agustin I', coordinator: 'Maricel Santos',    submitted: 'Aug 6, 2026',  status: 'Approved'    as const },
    ];
    const totalHomeGroups  = HOME_GROUPS.length;
    const pendingApps      = HOME_GROUPS.filter(h => h.status === 'Pending');
    const pendingCount     = pendingApps.length;
    const approvedCount    = HOME_GROUPS.filter(h => h.status === 'Approved').length;
    const recommendedCount = HOME_GROUPS.filter(h => h.status === 'Recommended').length;

    // ── Department donut data — from ORG_MINISTRIES ──────────────────────────
    const DEPT_COLORS: Record<string, string> = {
        'Worship':        '#1e3a6e',
        'Outreach':       '#e8952a',
        'Relationship':   '#b22222',
        'Discipleship':   '#2d7a2d',
        'Administration': '#1a1a1a',
    };

    const donutData = ORG_MINISTRIES.map(m => ({
        name:    m.name.replace(' Ministry', ''),
        value:   m.totalWorkers,   // use workers so all 5 depts show (Admin has 0 mentees)
        workers: m.totalWorkers,
        mentors: m.totalMentors,
        color:   DEPT_COLORS[m.name.replace(' Ministry', '')] ?? '#9ca3af',
    }));

    const totalMentees = donutData.reduce((s, d) => s + d.value, 0);
    const totalWorkers = donutData.reduce((s, d) => s + d.workers, 0);
    const totalMentors = donutData.reduce((s, d) => s + d.mentors, 0);

    /* external label with leader line — matches reference image */
    const RADIAN = Math.PI / 180;
    function OuterLabel({
        cx, cy, midAngle, outerRadius, percent,
    }: {
        cx: number; cy: number; midAngle: number;
        outerRadius: number; percent: number; name: string;
    }) {
        if (percent < 0.03) return null;
        const sin    = Math.sin(-midAngle * RADIAN);
        const cos    = Math.cos(-midAngle * RADIAN);
        const sx     = cx + (outerRadius + 6)  * cos;
        const sy     = cy + (outerRadius + 6)  * sin;
        const mx     = cx + (outerRadius + 26) * cos;
        const my     = cy + (outerRadius + 26) * sin;
        const ex     = mx + (cos >= 0 ? 14 : -14);
        const ey     = my;
        const anchor = cos >= 0 ? 'start' : 'end';
        return (
            <g>
                <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
                    stroke="#c8cdd6" fill="none" strokeWidth={1}/>
                <circle cx={ex} cy={ey} r={2} fill="#c8cdd6"/>
                <text x={ex + (cos >= 0 ? 5 : -5)} y={ey}
                    textAnchor={anchor} dominantBaseline="central"
                    fontSize={11} fill="#6b7280" fontWeight="500">
                    {`${(percent * 100).toFixed(0)}%`}
                </text>
            </g>
        );
    }


    return (
        <div className="flex flex-col gap-4">

            {/* ── SECTION 1 · Summary Cards ──────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {([
                    {
                        label: 'Total Active Mentees', value: totalActive,
                        sub: 'Church-wide C2S mentees',
                        color: '#5b50d6', bg: '#ede9fe',
                        icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
                    },
                    {
                        label: 'Total C2S Groups', value: totalGroups,
                        sub: 'Church & community based',
                        color: '#e67700', bg: '#fff3e0',
                        icon: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z',
                    },
                    {
                        label: 'C2S Home Groups', value: totalHomeGroups,
                        sub: `${approvedCount} approved · ${recommendedCount} recommended`,
                        color: '#0b9b8a', bg: '#d3f9f0',
                        icon: 'M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z',
                    },
                    {
                        label: 'Pending Applications', value: pendingCount,
                        sub: 'C2S Home awaiting review',
                        color: pendingCount > 0 ? '#5b50d6' : '#0b9b8a',
                        bg:    pendingCount > 0 ? '#ede9fe' : '#d3f9f0',
                        icon:  pendingCount > 0
                            ? 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z'
                            : 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
                    },
                ] as const).map(k => (
                    <div key={k.label}
                        className="bg-white border border-gray-100 rounded-xl p-4"
                        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide leading-tight pr-1">
                                {k.label}
                            </p>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                style={{ background: k.bg }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill={k.color}>
                                    <path d={k.icon}/>
                                </svg>
                            </div>
                        </div>
                        <p className="text-[1.9rem] font-black leading-none mb-1.5"
                            style={{ color: k.color }}>
                            {k.value.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-gray-400 leading-snug">{k.sub}</p>
                    </div>
                ))}
            </div>

            {/* ── SECTION 2 · C2S Overview ───────────────────────────────── */}
            <div className="bg-white border border-gray-100 rounded-xl"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

                {/* card header */}
                <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">C2S Overview</p>
                    <p className="text-xs text-gray-400 mt-0.5">Worker and mentor distribution by department.</p>
                </div>

                <div className="px-6 pb-6">

                    {/* ── Centered donut chart ── */}
                    <div className="flex justify-center pt-6 pb-1">
                        <ResponsiveContainer width={360} height={290}>
                            <PieChart>
                                <Pie
                                    data={donutData}
                                    cx="50%" cy="50%"
                                    innerRadius={70} outerRadius={110}
                                    dataKey="value"
                                    labelLine={false}
                                    label={OuterLabel}
                                    strokeWidth={3}
                                    stroke="#fff">
                                    {donutData.map((d, i) => <Cell key={i} fill={d.color}/>)}
                                </Pie>
                                <Tooltip contentStyle={TS} formatter={(v: number, n: string) => [v, n]}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* ── Legend centered below chart ── */}
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 pb-6">
                        {donutData.map(d => (
                            <div key={d.name} className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }}/>
                                <span className="text-xs text-gray-500">{d.name}</span>
                            </div>
                        ))}
                    </div>

                    {/* ── Table 1: Department breakdown ── */}
                    <div className="overflow-x-auto mb-6">
                        <table className="w-full text-xs">
                            <thead>
                                <tr style={{ background: 'var(--bg-subtle)' }}>
                                    {['Department', 'Workers', 'Mentors', 'C2S Coordinators', 'Total'].map(h => (
                                        <th key={h} className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {donutData.map((d, i) => {
                                    const coordinators = ORG_MINISTRIES[i]?.clusters.length ?? 0;
                                    return (
                                        <tr key={d.name} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-3 font-semibold text-gray-800">{d.name}</td>
                                            <td className="px-5 py-3 text-gray-600">{d.workers.toLocaleString()}</td>
                                            <td className="px-5 py-3 text-gray-600">{d.mentors.toLocaleString()}</td>
                                            <td className="px-5 py-3 text-gray-600">{coordinators}</td>
                                            <td className="px-5 py-3 text-gray-600">{(d.workers + d.mentors + coordinators).toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                                <tr className="border-t-2 border-gray-200 bg-gray-50">
                                    <td className="px-5 py-3 font-bold text-gray-900">Total</td>
                                    <td className="px-5 py-3 font-bold text-gray-900">{totalWorkers.toLocaleString()}</td>
                                    <td className="px-5 py-3 font-bold text-gray-900">{totalMentors.toLocaleString()}</td>
                                    <td className="px-5 py-3 font-bold text-gray-900">
                                        {ORG_MINISTRIES.reduce((s, m) => s + m.clusters.length, 0)}
                                    </td>
                                    <td className="px-5 py-3 font-bold text-gray-900">
                                        {(totalWorkers + totalMentors + ORG_MINISTRIES.reduce((s, m) => s + m.clusters.length, 0)).toLocaleString()}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* ── C2S Group Distribution — image-2 layout ── */}
                    <div className="border-t border-gray-100 pt-5">
                        <p className="text-sm font-semibold text-gray-900 mb-0.5">C2S Groups</p>
                        <p className="text-xs text-gray-400 mb-4">Where discipleship groups meet.</p>

                        {/* Stat tiles row — Church-based + Community-based */}
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            {[
                                {
                                    label: 'Church-based', value: churchBased,
                                    sub: 'Meeting in COG Satellite Churches',
                                    color: '#1971c2', bg: '#dbeafe',
                                    icon: 'M12 3L2 12h3v8h6v-5h2v5h6v-8h3L12 3zm0 2.7L19 12v7h-4v-5H9v5H5v-7l7-6.3z',
                                },
                                {
                                    label: 'Community-based', value: communityBased,
                                    sub: 'Meeting in barangays & homes',
                                    color: '#0b9b8a', bg: '#d3f9f0',
                                    icon: 'M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z',
                                },
                            ].map(t => (
                                <div key={t.label}
                                    className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-700 dark:!bg-[#2d2e2f] px-4 py-3.5"
                                    style={{ background: t.bg + '55' }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 dark:!bg-[#3a3b3c]"
                                        style={{ background: t.bg }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill={t.color}>
                                            <path d={t.icon}/>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-gray-500 mb-0.5">{t.label}</p>
                                        <p className="text-2xl font-bold leading-none" style={{ color: t.color }}>
                                            {t.value}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{t.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Department × Group-type table */}
                        <div className="overflow-x-auto mb-6">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr style={{ background: 'var(--bg-subtle)' }}>
                                        {['Department', 'Church-Based', 'Community-Based', 'Total'].map(h => (
                                            <th key={h} className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {donutData.map(d => {
                                        const cb = Math.round(d.value * (churchBased / Math.max(totalGroups, 1)));
                                        const cm = d.value - cb;
                                        return (
                                            <tr key={d.name} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-5 py-3 font-semibold text-gray-800">{d.name}</td>
                                                <td className="px-5 py-3 text-gray-600">{cb}</td>
                                                <td className="px-5 py-3 text-gray-600">{cm}</td>
                                                <td className="px-5 py-3 text-gray-600">{d.value}</td>
                                            </tr>
                                        );
                                    })}
                                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                                        <td className="px-5 py-3 font-bold text-gray-900">Total</td>
                                        <td className="px-5 py-3 font-bold text-gray-900">{churchBased}</td>
                                        <td className="px-5 py-3 font-bold text-gray-900">{communityBased}</td>
                                        <td className="px-5 py-3 font-bold text-gray-900">{totalGroups}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Meeting mode stat tiles — Face-to-Face + Online */}
                        <p className="text-sm font-semibold text-gray-900 mb-0.5">Meeting Mode</p>
                        <p className="text-xs text-gray-400 mb-4">How mentee sessions are conducted.</p>
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            {[
                                {
                                    label: 'Face-to-Face', value: faceToFace,
                                    sub: 'In-person group sessions',
                                    color: '#5b50d6', bg: '#ede9fe',
                                    icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
                                },
                                {
                                    label: 'Online', value: onlineGroups,
                                    sub: 'Virtual group sessions',
                                    color: '#5b50d6', bg: '#ede9fe',
                                    icon: 'M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z',
                                },
                            ].map(t => (
                                <div key={t.label}
                                    className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-700 dark:!bg-[#2d2e2f] px-4 py-3.5"
                                    style={{ background: t.bg + '55' }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 dark:!bg-[#3a3b3c]"
                                        style={{ background: t.bg }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill={t.color}>
                                            <path d={t.icon}/>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-gray-500 mb-0.5">{t.label}</p>
                                        <p className="text-2xl font-bold leading-none" style={{ color: t.color }}>
                                            {t.value}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{t.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Department × Meeting-mode table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr style={{ background: 'var(--bg-subtle)' }}>
                                        {['Department', 'Face-to-Face', 'Online', 'Total'].map(h => (
                                            <th key={h} className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {donutData.map(d => {
                                        const online = Math.round(d.value * (onlineGroups / Math.max(totalGroups, 1)));
                                        const f2f    = d.value - online;
                                        return (
                                            <tr key={d.name} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-5 py-3 font-semibold text-gray-800">{d.name}</td>
                                                <td className="px-5 py-3 text-gray-600">{f2f}</td>
                                                <td className="px-5 py-3 text-gray-600">{online}</td>
                                                <td className="px-5 py-3 text-gray-600">{d.value}</td>
                                            </tr>
                                        );
                                    })}
                                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                                        <td className="px-5 py-3 font-bold text-gray-900">Total</td>
                                        <td className="px-5 py-3 font-bold text-gray-900">{faceToFace}</td>
                                        <td className="px-5 py-3 font-bold text-gray-900">{onlineGroups}</td>
                                        <td className="px-5 py-3 font-bold text-gray-900">{totalGroups}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>

            {/* ── SECTION 3 · Pending C2S Home Applications ─────────────── */}
            <div className="bg-white border border-gray-100 rounded-xl"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

                {/* card header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <p className="text-sm font-semibold text-gray-900">Pending C2S Home Applications</p>
                        <p className="text-xs text-gray-400 mt-0.5">Home group applications awaiting admin review.</p>
                    </div>
                    {pendingCount > 0 ? (
                        <span className="shrink-0 ml-4 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#ede9fe] text-[#5b50d6]">
                            {pendingCount} Pending
                        </span>
                    ) : (
                        <span className="shrink-0 ml-4 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#dcfce7] text-[#166534]">
                            All clear
                        </span>
                    )}
                </div>

                {pendingCount === 0 ? (
                    /* empty state */
                    <div className="flex items-center gap-3 px-6 py-8">
                        <div className="w-8 h-8 rounded-full bg-[#dcfce7] flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-[#0b9b8a]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-700">No pending applications</p>
                            <p className="text-xs text-gray-400">All C2S Home applications have been reviewed.</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    {['Home Group', 'Barangay', 'Coordinator', 'Date Submitted', 'Status', 'Action'].map(h => (
                                        <th key={h}
                                            className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-2.5">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {pendingApps.map(app => (
                                    <tr key={app.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-900">{app.name}</td>
                                        <td className="px-4 py-3 text-gray-500">{app.barangay}</td>
                                        <td className="px-4 py-3 text-gray-500">{app.coordinator}</td>
                                        <td className="px-4 py-3 text-gray-400">{app.submitted}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#fef9c3] text-[#92400e]">
                                                Pending
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button className="text-[11px] font-semibold text-[#5b50d6] border border-[#c4bbf8] hover:bg-[#ede9fe] px-3 py-1 rounded-md transition-colors">
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}


function OrgStructureTab() {
    const [expandedMinistry, setExpandedMinistry] = useState<string | null>(null);
    const [expandedCluster, setExpandedCluster] = useState<string | null>(null);

    return (
        <div>
            <SectionHeader title="Departments" sub="WORDA — all clusters, heads, and coordinators" />
            <div className="flex flex-col gap-4">
                {ORG_MINISTRIES.map(ministry => (
                    <div key={ministry.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        {/* Ministry header */}
                        <button
                            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                            onClick={() => setExpandedMinistry(prev => prev === ministry.id ? null : ministry.id)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0" style={{ background: ministry.headColor }}>
                                    {ministry.name.replace(' Ministry', '')[0]}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-base">{ministry.name.replace(' Ministry', '')}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Head: {ministry.head}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 shrink-0">
                                <div className="hidden sm:grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                                    {[
                                        { label: 'Workers',  value: ministry.totalWorkers,  color: '#5b50d6' },
                                        { label: 'Mentors',  value: ministry.totalMentors,  color: '#0b9b8a' },
                                        { label: 'Mentees',  value: ministry.totalMentees,  color: '#5b50d6' },
                                        { label: 'Groups',   value: ministry.totalGroups,   color: '#1971c2' },
                                    ].map(s => (
                                        <div key={s.label}>
                                            <p className="text-lg font-black leading-none" style={{ color: s.color }}>{s.value}</p>
                                            <p className="text-[9px] text-gray-400">{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                                <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedMinistry === ministry.id ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                            </div>
                        </button>

                        {/* Clusters */}
                        {expandedMinistry === ministry.id && (
                            <div className="border-t border-gray-100">
                                {ministry.clusters.map((cluster, ci) => (
                                    <div key={cluster.id} className={`${ci > 0 ? 'border-t border-gray-50 dark:border-gray-700' : ''}`}>
                                        <button
                                            className="w-full flex items-center gap-4 px-6 py-3.5 text-left transition-colors dark:hover:bg-transparent"
                                            onClick={() => setExpandedCluster(prev => prev === cluster.id ? null : cluster.id)}
                                        >
                                            <div className="w-1 h-8 rounded-full ml-4 shrink-0" style={{ background: cluster.clusterHeadColor }} />
                                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{cluster.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-black shrink-0" style={{ background: cluster.clusterHeadColor }}>{cluster.clusterHeadInitials}</div>
                                                        <span className="text-xs text-gray-500">{cluster.clusterHead} <span className="text-gray-300">·</span> Cluster Head</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-black shrink-0" style={{ background: cluster.coordinatorColor }}>{cluster.coordinatorInitials}</div>
                                                    <span className="text-xs text-gray-500">{cluster.coordinator} <span className="text-gray-300">·</span> C2S Coordinator</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs">
                                                    <span className="text-[#0b9b8a] font-semibold">{cluster.mentorCount} mentors</span>
                                                    <span className="text-[#5b50d6] font-semibold">{cluster.menteeCount} mentees</span>
                                                    <span className="text-[#1971c2] font-semibold">{cluster.groupCount} groups</span>
                                                </div>
                                            </div>
                                            <svg className={`w-4 h-4 text-gray-300 transition-transform shrink-0 ${expandedCluster === cluster.id ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                                        </button>
                                        {expandedCluster === cluster.id && (
                                            <div className="px-4 sm:px-16 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                {[
                                                    { label: 'Cluster Head',    name: cluster.clusterHead,    initials: cluster.clusterHeadInitials,    color: cluster.clusterHeadColor,    role: 'Cluster Head' },
                                                    { label: 'C2S Coordinator', name: cluster.coordinator,    initials: cluster.coordinatorInitials,    color: cluster.coordinatorColor,    role: 'Coordinator' },
                                                ].map(person => (
                                                    <div key={person.label} className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'var(--bg-subtle)' }}>
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0" style={{ background: person.color }}>{person.initials}</div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-900">{person.name}</p>
                                                            <p className="text-[10px] text-gray-400">{person.role}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Workers Tab ──────────────────────────────────────────────────────────────
function WorkersTab() {
    const [workers, setWorkers] = useState<AdminWorker[]>(ADMIN_WORKERS);
    const [search, setSearch]       = useState('');
    const [roleFilter, setRoleFilter]   = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [viewingWorker, setViewingWorker] = useState<AdminWorker | null>(null);

    const roleMap: Record<string, string> = {
        'Department Head': 'department_head',
        'Ministry Head':   'ministry_head',
        'Cluster Head':    'cluster_head',
        'Coordinator':     'c2s_coordinator',
        'Mentor':          'mentor',
    };

    const filtered = workers.filter(w => {
        const ms = search.toLowerCase();
        const roleMatch = roleFilter === 'All' || w.c2sRole === roleMap[roleFilter];
        const statMatch = statusFilter === 'All' || w.status === statusFilter;
        const textMatch = w.name.toLowerCase().includes(ms) || w.email.toLowerCase().includes(ms) || (w.cluster ?? '').toLowerCase().includes(ms);
        return roleMatch && statMatch && textMatch;
    });

    function handleSave(updated: AdminWorker) {
        setWorkers(prev => prev.map(w => w.id === updated.id ? updated : w));
        // Keep the panel open with updated data
        setViewingWorker(updated);
    }

    const activeCount   = workers.filter(w => w.status === 'Active').length;
    const inactiveCount = workers.filter(w => w.status === 'Inactive').length;
    const pendingId     = workers.filter(w => w.workerIdStatus === 'Pending').length;

    return (
        <div>
            {viewingWorker && (
                <WorkerDetailPanel
                    worker={viewingWorker}
                    onClose={() => setViewingWorker(null)}
                    onSave={handleSave}
                />
            )}
            <SectionHeader title="Workers" sub="All workers with C2S access across ministries." />

            {/* Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Workers"    value={workers.length} sub="All C2S workers"   color="#5b50d6" icon="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                <StatCard label="Active"          value={activeCount}           sub="Currently active"  color="#0b9b8a" icon="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                <StatCard label="Inactive"        value={inactiveCount}         sub="Deactivated"       color="#9ca3af" icon="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z" />
                <StatCard label="Pending ID"      value={pendingId}             sub="Worker ID requests" color="#e67700" icon="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
                    <input type="text" placeholder="Search name, email, cluster..." value={search} onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5b50d6] w-full sm:w-64 bg-white" />
                </div>
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                    className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#5b50d6] text-gray-700">
                    <option value="All">All Roles</option>
                    <option value="Department Head">Department Head</option>
                    <option value="Ministry Head">Ministry Head</option>
                    <option value="Cluster Head">Cluster Head</option>
                    <option value="Coordinator">Coordinator</option>
                    <option value="Mentor">Mentor</option>
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#5b50d6] text-gray-700">
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
                <span className="ml-auto text-xs text-gray-400">{filtered.length} worker{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {filtered.length === 0 && <div className="p-12 text-center text-sm text-gray-400">No workers found</div>}
                {filtered.map(w => (
                    <div key={w.id} className="p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0" style={{ background: w.color }}>{w.initials}</div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{w.name}</p>
                                <p className="text-[10px] text-gray-400 truncate">{w.email}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                            <span>{w.ministry}</span>
                            {w.cluster && <span>{w.cluster}</span>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {w.c2sRole && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: ROLE_COLOR[w.c2sRole] ?? '#5b50d6' }}>{ROLE_LABEL[w.c2sRole]}</span>}
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${w.status === 'Active' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-gray-100 text-gray-500'}`}>{w.status}</span>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${w.workerIdStatus === 'Approved' ? 'bg-[#dbeafe] text-[#1d4ed8]' : w.workerIdStatus === 'Pending' ? 'bg-[#fef9c3] text-[#92400e]' : 'bg-gray-100 text-gray-500'}`}>{w.workerIdStatus}</span>
                            <button onClick={() => setViewingWorker(w)} className="ml-auto text-[11px] font-semibold text-[#5b50d6] hover:underline">Manage Access</button>
                        </div>
                    </div>
                ))}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div>
                    <table className="w-full text-xs min-w-[600px]">
                        <thead className="bg-[#f8f9fc]">
                            <tr>{['Worker','Ministry','Cluster','C2S Role','Status','Worker ID','Actions'].map(h => (
                                <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-3.5">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(w => (
                                <tr key={w.id} className="hover:bg-[#fafbff] transition-colors">
                                    <td className="px-3 py-3.5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0" style={{ background: w.color }}>{w.initials}</div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{w.name}</p>
                                                <p className="text-[10px] text-gray-400">{w.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3.5 text-gray-600">{w.ministry}</td>
                                    <td className="px-3 py-3.5 text-gray-600">{w.cluster ?? '—'}</td>
                                    <td className="px-3 py-3.5">
                                        {w.c2sRole ? (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: ROLE_COLOR[w.c2sRole] ?? '#5b50d6' }}>{ROLE_LABEL[w.c2sRole]}</span>
                                        ) : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-3 py-3.5">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${w.status === 'Active' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-gray-100 text-gray-500'}`}>{w.status}</span>
                                    </td>
                                    <td className="px-3 py-3.5">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${w.workerIdStatus === 'Approved' ? 'bg-[#dbeafe] text-[#1d4ed8]' : w.workerIdStatus === 'Pending' ? 'bg-[#fef9c3] text-[#92400e]' : 'bg-gray-100 text-gray-500'}`}>{w.workerIdStatus}</span>
                                    </td>
                                    <td className="px-3 py-3.5">
                                        <button onClick={() => setViewingWorker(w)} className="text-[11px] font-semibold text-[#5b50d6] hover:underline">Manage Access</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && <div className="p-12 text-center text-sm text-gray-400">No workers found</div>}
                </div>
            </div>
        </div>
    );
}

// ─── RBAC Tab ─────────────────────────────────────────────────────────────────
function RBACTab() {
    const [view, setView] = useState<'templates' | 'workers'>('templates');
    const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
    const permGroups = [...new Set(C2S_PERMISSIONS.map(p => p.group))];

    return (
        <div>
            <SectionHeader title="RBAC & Permissions" sub="Role templates, worker permissions, and component-level access control." />
            <div className="flex gap-2 mb-6">
                {(['templates', 'workers'] as const).map(t => (
                    <button key={t} onClick={() => setView(t)}
                        className={`text-xs font-semibold px-4 py-2 rounded-full border transition-colors ${view === t ? 'bg-[#5b50d6] text-white border-[#5b50d6]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                        {t === 'templates' ? 'Role Templates' : 'Worker Permissions'}
                    </button>
                ))}
            </div>

            {view === 'templates' && (
                <div className="flex flex-col gap-4">
                    {ROLE_TEMPLATES.map(rt => (
                        <div key={rt.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            <button className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                                onClick={() => setExpandedTemplate(prev => prev === rt.id ? null : rt.id)}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: rt.color + '18' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill={rt.color}><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{rt.name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{rt.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                    <div className="text-right">
                                        <p className="text-sm font-black" style={{ color: rt.color }}>{rt.permissions.length}</p>
                                        <p className="text-[10px] text-gray-400">permissions</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-gray-700">{rt.workerCount}</p>
                                        <p className="text-[10px] text-gray-400">workers</p>
                                    </div>
                                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedTemplate === rt.id ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                                </div>
                            </button>
                            {expandedTemplate === rt.id && (
                                <div className="border-t border-gray-100 px-6 py-5">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Permissions in this template</p>
                                    <div className="flex flex-wrap gap-2">
                                        {rt.permissions.map(pk => {
                                            const p = C2S_PERMISSIONS.find(x => x.key === pk);
                                            return (
                                                <div key={pk} className="flex flex-col border border-gray-100 rounded-xl px-3 py-2" style={{ background: 'var(--bg-subtle)' }}>
                                                    <span className="text-[11px] font-mono font-semibold text-gray-800">{pk}</span>
                                                    {p && <span className="text-[10px] text-gray-400 mt-0.5">{p.description}</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {view === 'workers' && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <div className="px-6 py-4 border-b border-gray-50">
                        <p className="text-sm font-bold text-gray-800">All C2S Permissions</p>
                        <p className="text-xs text-gray-400 mt-0.5">Component-level access matrix</p>
                    </div>
                    {permGroups.map(group => {
                        const perms = C2S_PERMISSIONS.filter(p => p.group === group);
                        return (
                            <div key={group} className="border-t border-gray-50">
                                <div className="px-6 py-2" style={{ background: 'var(--bg-subtle)' }}>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{group}</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y divide-gray-50">
                                    {perms.map(p => (
                                        <div key={p.key} className="flex items-center justify-between px-6 py-3">
                                            <div>
                                                <p className="text-[11px] font-mono font-semibold text-gray-800">{p.label}</p>
                                                <p className="text-[10px] text-gray-400">{p.description}</p>
                                            </div>
                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#ede9fe] text-[#6741d9] ml-4 shrink-0">{p.group}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── C2S Groups Tab ───────────────────────────────────────────────────────────
function GroupsTab() {
    const [typeFilter, setTypeFilter] = useState<'All' | 'Community-based' | 'Church-based'>('All');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'Full' | 'Closed'>('All');
    const [modeFilter, setModeFilter] = useState<'All' | 'Online' | 'Face-to-Face'>('All');
    const [search, setSearch] = useState('');

    const filtered = COORD_GROUPS.filter(g =>
        (typeFilter === 'All' || g.type === typeFilter) &&
        (statusFilter === 'All' || g.status === statusFilter) &&
        (g.name.toLowerCase().includes(search.toLowerCase()) ||
         g.barangay.toLowerCase().includes(search.toLowerCase()) ||
         (g.satellite ?? '').toLowerCase().includes(search.toLowerCase()))
    );

    const openCount  = COORD_GROUPS.filter(g => g.status === 'Open').length;
    const fullCount  = COORD_GROUPS.filter(g => g.status === 'Full').length;
    const closedCount = COORD_GROUPS.filter(g => g.status === 'Closed').length;
    const communityCount = COORD_GROUPS.filter(g => g.type === 'Community-based').length;
    const churchCount    = COORD_GROUPS.filter(g => g.type === 'Church-based').length;

    return (
        <div>
            <SectionHeader title="C2S Groups" sub="All groups across the ministry — availability, capacity, and type." />
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {[
                    { label: 'Total Groups',     value: COORD_GROUPS.length, color: '#5b50d6' },
                    { label: 'Open',             value: openCount,           color: '#0b9b8a' },
                    { label: 'Full',             value: fullCount,           color: '#e67700' },
                    { label: 'Closed',           value: closedCount,         color: '#9ca3af' },
                    { label: 'Community-based',  value: communityCount,      color: '#1971c2' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <p className="text-2xl font-black leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-[10px] text-gray-400 font-semibold">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-5">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
                    <input type="text" placeholder="Search group, barangay, or satellite..." value={search} onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5b50d6] w-56 bg-white" />
                </div>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}
                    className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#5b50d6] text-gray-700">
                    <option value="All">All Types</option>
                    <option value="Community-based">Community-based</option>
                    <option value="Church-based">Church-based</option>
                </select>
                <select value={modeFilter} onChange={e => setModeFilter(e.target.value as any)}
                    className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#5b50d6] text-gray-700">
                    <option value="All">All Meeting Modes</option>
                    <option value="Online">Online C2S</option>
                    <option value="Face-to-Face">Face-to-Face C2S</option>
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
                    className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#5b50d6] text-gray-700">
                    <option value="All">All Statuses</option>
                    <option value="Open">Open</option>
                    <option value="Full">Full</option>
                    <option value="Closed">Closed</option>
                </select>
                <span className="ml-auto text-xs text-gray-400">{filtered.length} group{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {filtered.length === 0 && <div className="p-12 text-center text-sm text-gray-400">No groups found</div>}
                {filtered.map(g => {
                    const pct = Math.round((g.members / g.capacity) * 100);
                    return (
                        <div key={g.id} className="p-4 flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-gray-900 text-sm leading-tight">{g.name}</span>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${g.status === 'Open' ? 'bg-[#dcfce7] text-[#166534]' : g.status === 'Full' ? 'bg-[#fef9c3] text-[#92400e]' : 'bg-gray-100 text-gray-500'}`}>{g.status}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0" style={{ background: g.mentorColor }}>{g.mentorInitials}</div>
                                <span className="text-xs text-gray-600">{g.mentor}</span>
                                <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${g.type === 'Community-based' ? 'bg-[#0b9b8a] text-white' : 'bg-[#1971c2] text-white'}`}>{g.type}</span>
                            </div>
                            <p className="text-xs text-gray-500">{g.type === 'Church-based' ? (g.satellite ?? '—') : g.barangay} · {g.schedule}</p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 100 ? '#e67700' : '#0b9b8a' }} />
                                </div>
                                <span className="text-xs text-gray-600">{g.members}/{g.capacity}</span>
                                <span className={`text-xs font-bold ${g.availableSlots > 0 ? 'text-[#0b9b8a]' : 'text-[#e67700]'}`}>{g.availableSlots} open</span>
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div>
                    <table className="w-full text-xs min-w-[640px]">
                        <thead className="bg-[#f8f9fc]">
                            <tr>
                                {['Group','Mentor'].map(h => (
                                    <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-3.5">{h}</th>
                                ))}
                                {typeFilter === 'All' && (
                                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-3.5">Barangay / Satellite</th>
                                )}
                                {typeFilter === 'Community-based' && (
                                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-3.5">Barangay</th>
                                )}
                                {typeFilter === 'Church-based' && (
                                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-3.5">Satellite</th>
                                )}
                                {['Type','Members','Capacity','Available','Status','Schedule'].map(h => (
                                    <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-3.5">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(g => {
                                const pct = Math.round((g.members / g.capacity) * 100);
                                return (
                                    <tr key={g.id} className="hover:bg-[#fafbff] transition-colors">
                                        <td className="px-3 py-3.5 font-bold text-gray-900">{g.name}</td>
                                        <td className="px-3 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0" style={{ background: g.mentorColor }}>{g.mentorInitials}</div>
                                                <span className="text-gray-700">{g.mentor}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3.5 text-gray-600">
                                            {g.type === 'Church-based' ? (g.satellite ?? '—') : g.barangay}
                                        </td>
                                        <td className="px-3 py-3.5">
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${g.type === 'Community-based' ? 'bg-[#0b9b8a] text-white' : 'bg-[#1971c2] text-white'}`}>{g.type}</span>
                                        </td>
                                        <td className="px-3 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 100 ? '#e67700' : '#0b9b8a' }} />
                                                </div>
                                                <span className="font-semibold text-gray-700">{g.members}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3.5 text-center text-gray-600">{g.capacity}</td>
                                        <td className="px-3 py-3.5 text-center font-bold" style={{ color: g.availableSlots > 0 ? '#0b9b8a' : '#e67700' }}>{g.availableSlots}</td>
                                        <td className="px-3 py-3.5">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${g.status === 'Open' ? 'bg-[#dcfce7] text-[#166534]' : g.status === 'Full' ? 'bg-[#fef9c3] text-[#92400e]' : 'bg-gray-100 text-gray-500'}`}>{g.status}</span>
                                        </td>
                                        <td className="px-3 py-3.5 text-gray-500">{g.schedule}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filtered.length === 0 && <div className="p-12 text-center text-sm text-gray-400">No groups found</div>}
                </div>
            </div>
        </div>
    );
}

// ─── Potential Mentees Tab ────────────────────────────────────────────────────
function PotentialMenteesTab() {
    const [deptFilter, setDeptFilter] = useState('All');
    const [statusFilter, setStatusFilter]   = useState('All');
    const [search, setSearch] = useState('');

    const statuses = ['All', 'New', 'Waiting for Assignment', 'Assigned to Mentor', 'Interview Scheduled', 'Accepted'];

    const STATUS_STYLE: Record<string, string> = {
        'New':                    'bg-[#dbeafe] text-[#1d4ed8]',
        'Waiting for Assignment': 'bg-[#fef9c3] text-[#92400e]',
        'Assigned to Mentor':     'bg-[#ede9fe] text-[#6741d9]',
        'Interview Scheduled':    'bg-[#ede9fe] text-[#5b50d6]',
        'Accepted':               'bg-[#dcfce7] text-[#166534]',
    };

    const filtered = MH_POTENTIAL_MENTEES.filter(m =>
        (deptFilter === 'All' || m.cluster === deptFilter) &&
        (statusFilter === 'All' || (m.status !== 'Interview Completed' && m.status === statusFilter) || (statusFilter === 'All')) &&
        (m.name.toLowerCase().includes(search.toLowerCase()) || m.barangay.toLowerCase().includes(search.toLowerCase()))
    ).filter(m => m.status !== 'Interview Completed' || statusFilter === 'All');

    return (
        <div>
            <SectionHeader title="Potential Mentees" sub="All incoming potential mentees across every department." />
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Total',    value: MH_POTENTIAL_MENTEES.length,                                            color: '#5b50d6' },
                    { label: 'New',      value: MH_POTENTIAL_MENTEES.filter(m => m.status === 'New').length,            color: '#1d4ed8' },
                    { label: 'Accepted', value: MH_POTENTIAL_MENTEES.filter(m => m.status === 'Accepted').length,       color: '#166534' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <p className="text-3xl font-black leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-xs text-gray-400 font-semibold">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-5">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
                    <input type="text" placeholder="Search name or barangay..." value={search} onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5b50d6] w-56 bg-white" />
                </div>
                <MinistryDeptSelect value={deptFilter} onChange={setDeptFilter} />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#5b50d6] text-gray-700">
                    {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
                </select>
                <span className="ml-auto text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {filtered.length === 0 && <div className="p-12 text-center text-sm text-gray-400">No potential mentees found</div>}
                {filtered.map(m => (
                    <div key={m.id} className="p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0" style={{ background: avatarColor(m.id) }}>{m.initials}</div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{m.name}</p>
                                <p className="text-[10px] text-gray-400">{m.age} · {m.gender} · {m.barangay}</p>
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[m.status] ?? ''}`}>{m.status}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                            <span>{m.cluster}</span>
                            <span>{m.coordinator}</span>
                            {m.mentor !== '—' && <span>{m.mentor}</span>}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${m.source === 'From C2S Group Finder' ? 'bg-[#0b9b8a] text-white' : 'bg-[#ede9fe] text-[#6741d9]'}`}>
                                {m.source === 'From C2S Group Finder' ? 'Finder' : 'Recommended'}
                            </span>
                            <span className="text-[10px] text-gray-400">{m.dateSubmitted}</span>
                        </div>
                    </div>
                ))}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div>
                    <table className="w-full text-xs min-w-[720px]">
                        <thead className="bg-[#f8f9fc]">
                            <tr>{['Name','Age','Gender','Cluster','Coordinator','Mentor','Barangay','Source','Status','Submitted'].map(h => (
                                <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-3.5">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(m => (
                                <tr key={m.id} className="hover:bg-[#fafbff] transition-colors">
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0" style={{ background: avatarColor(m.id) }}>{m.initials}</div>
                                            <span className="font-semibold text-gray-900">{m.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 text-gray-600">{m.age}</td>
                                    <td className="px-3 py-3 text-gray-600">{m.gender}</td>
                                    <td className="px-3 py-3 text-gray-600">{m.cluster}</td>
                                    <td className="px-3 py-3 text-gray-600">{m.coordinator}</td>
                                    <td className="px-3 py-3 text-gray-600">{m.mentor}</td>
                                    <td className="px-3 py-3 text-gray-600">{m.barangay}</td>
                                    <td className="px-3 py-3">
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${m.source === 'From C2S Group Finder' ? 'bg-[#0b9b8a] text-white' : 'bg-[#ede9fe] text-[#6741d9]'}`}>
                                            {m.source === 'From C2S Group Finder' ? 'Finder' : 'Recommended'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[m.status] ?? ''}`}>{m.status}</span>
                                    </td>
                                    <td className="px-3 py-3 text-gray-400">{m.dateSubmitted}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && <div className="p-12 text-center text-sm text-gray-400">No potential mentees found</div>}
                </div>
            </div>
        </div>
    );
}

// ─── Active Mentees Tab ───────────────────────────────────────────────────────
function ActiveMenteesTab() {
    const [clusterFilter, setClusterFilter] = useState('All');
    const [search, setSearch] = useState('');
    const filtered = MH_ACTIVE_MENTEES_LIST.filter(m =>
        (clusterFilter === 'All' || m.cluster === clusterFilter) &&
        (m.name.toLowerCase().includes(search.toLowerCase()) || m.barangay.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div>
            <SectionHeader title="Active Mentees" sub="All active mentees across every department and ministry." />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Active', value: MH_ACTIVE_MENTEES_LIST.length, color: '#5b50d6' },
                    { label: 'Departments',  value: MH_CLUSTERS.length,            color: '#0b9b8a' },
                    { label: 'Mentors',      value: MH_ALL_MENTORS.filter(m => m.status === 'Active').length, color: '#5b50d6' },
                    { label: 'Avg Progress', value: Math.round(MH_ACTIVE_MENTEES_LIST.reduce((s, m) => s + m.progress, 0) / (MH_ACTIVE_MENTEES_LIST.length || 1)) + '%', color: '#e67700' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <p className="text-3xl font-black leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-xs text-gray-400 font-semibold">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-5">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
                    <input type="text" placeholder="Search name or barangay..." value={search} onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5b50d6] w-56 bg-white" />
                </div>
                <MinistryDeptSelect value={clusterFilter} onChange={setClusterFilter} />
                <span className="ml-auto text-xs text-gray-400">{filtered.length} mentees</span>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {filtered.length === 0 && <div className="p-12 text-center text-sm text-gray-400">No active mentees found</div>}
                {filtered.map(m => (
                    <div key={m.id} className="p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0" style={{ background: avatarColor(m.id) }}>{m.initials}</div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{m.name}</p>
                                <p className="text-[10px] text-gray-400 truncate">{m.barangay} · {m.cluster}</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">{m.coordinator} · {m.mentor}</p>
                        <div>
                            <p className="text-[10px] text-gray-400 mb-1">{m.module}</p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${m.progress}%`, background: '#5b50d6' }}/>
                                </div>
                                <span className="text-xs font-semibold text-gray-700">{m.progress}%</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div>
                    <table className="w-full text-xs min-w-[560px]">
                        <thead className="bg-[#f8f9fc]">
                            <tr>{['Name','Cluster','Coordinator','Mentor','Barangay','Module','Progress'].map(h => (
                                <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-3.5">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(m => (
                                <tr key={m.id} className="hover:bg-[#fafbff] transition-colors">
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0" style={{ background: avatarColor(m.id) }}>{m.initials}</div>
                                            <span className="font-semibold text-gray-900">{m.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 text-gray-600">{m.cluster}</td>
                                    <td className="px-3 py-3 text-gray-600">{m.coordinator}</td>
                                    <td className="px-3 py-3 text-gray-600">{m.mentor}</td>
                                    <td className="px-3 py-3 text-gray-600">{m.barangay}</td>
                                    <td className="px-3 py-3 text-gray-600">{m.module}</td>
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${m.progress}%`, background: '#5b50d6' }}/>
                                            </div>
                                            <span className="text-[10px] font-semibold text-gray-700 shrink-0">{m.progress}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && <div className="p-12 text-center text-sm text-gray-400">No active mentees found</div>}
                </div>
            </div>
        </div>
    );
}

// ─── C2S Home Groups Tab ──────────────────────────────────────────────────────
function C2SHomeTab() {
    const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Recommended'>('All');
    const [homeSearch, setHomeSearch] = useState('');
    const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'approve' | 'reject'; name: string } | null>(null);

    const homeGroups = [
        { id: 'hg1', name: 'Santos Family Home',   barangay: 'Burol',              schedule: 'Wed 7:00 PM', potential: 6, status: 'Approved'     as const, coordinator: 'Rosa Castillo',     submitted: 'Jul 15, 2026' },
        { id: 'hg2', name: 'Villanueva Home Group', barangay: 'Paliparan III',      schedule: 'Sat 4:00 PM', potential: 5, status: 'Pending'      as const, coordinator: 'Ben Macaraeg',      submitted: 'Jul 20, 2026' },
        { id: 'hg3', name: 'Reyes Household',       barangay: 'Sampaloc I',         schedule: 'Fri 7:00 PM', potential: 4, status: 'Recommended'  as const, coordinator: 'Sofia Aguila',      submitted: 'Jul 22, 2026' },
        { id: 'hg4', name: 'Cruz Home Fellowship',  barangay: 'Langkaan I',         schedule: 'Thu 7:00 PM', potential: 7, status: 'Approved'     as const, coordinator: 'Patricia Bautista', submitted: 'Jul 10, 2026' },
        { id: 'hg5', name: 'Aquino Family Circle',  barangay: 'Salitran III',       schedule: 'Sun 4:00 PM', potential: 3, status: 'Pending'      as const, coordinator: 'Ferdinand Ramos',   submitted: 'Jul 25, 2026' },
        { id: 'hg6', name: 'Dela Cruz Gatherings',  barangay: 'San Agustin I',      schedule: 'Tue 7:00 PM', potential: 5, status: 'Approved'     as const, coordinator: 'Maricel Santos',    submitted: 'Jul 12, 2026' },
    ];
    const STATUS_STYLE: Record<string, string> = {
        'Pending':     'bg-[#fef9c3] text-[#92400e]',
        'Approved':    'bg-[#dcfce7] text-[#166534]',
        'Recommended': 'bg-[#ede9fe] text-[#6741d9]',
    };
    const filtered = homeGroups.filter(h =>
        (filter === 'All' || h.status === filter) &&
        (homeSearch === '' || h.name.toLowerCase().includes(homeSearch.toLowerCase()) || h.barangay.toLowerCase().includes(homeSearch.toLowerCase()))
    );

    return (
        <div>
            {/* Confirmation dialog */}
            {confirmAction && (
                <>
                    <div className="fixed inset-0 z-[110] bg-black/50" />
                    <div className="fixed inset-0 z-[111] flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${confirmAction.action === 'approve' ? 'bg-green-100' : 'bg-red-100'}`}>
                                    <svg className={`w-5 h-5 ${confirmAction.action === 'approve' ? 'text-green-600' : 'text-red-600'}`} viewBox="0 0 24 24" fill="currentColor">
                                        {confirmAction.action === 'approve'
                                            ? <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                            : <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                                        }
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">
                                        {confirmAction.action === 'approve' ? 'Approve Home Group?' : 'Reject Home Group?'}
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-0.5">{confirmAction.name}</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 mb-5 leading-relaxed">
                                {confirmAction.action === 'approve'
                                    ? 'This will approve the home group application and notify the coordinator. The group will be listed as active.'
                                    : 'This will reject the home group application. The coordinator will be notified. This action is significant and should be done carefully.'}
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setConfirmAction(null)}
                                    className="flex-1 text-sm font-semibold text-gray-600 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={() => setConfirmAction(null)}
                                    className={`flex-1 text-sm font-semibold text-white py-2.5 rounded-xl transition-colors ${confirmAction.action === 'approve' ? 'bg-[#0b9b8a] hover:bg-[#0a8578]' : 'bg-red-600 hover:bg-red-700'}`}>
                                    {confirmAction.action === 'approve' ? 'Yes, Approve' : 'Yes, Reject'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <SectionHeader title="C2S Home Groups" sub="Home group applications, approvals, and active C2S Home groups." />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total',        value: homeGroups.length,                                         color: '#5b50d6' },
                    { label: 'Approved',     value: homeGroups.filter(h => h.status === 'Approved').length,    color: '#0b9b8a' },
                    { label: 'Pending',      value: homeGroups.filter(h => h.status === 'Pending').length,     color: '#e67700' },
                    { label: 'Recommended',  value: homeGroups.filter(h => h.status === 'Recommended').length, color: '#6741d9' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <p className="text-3xl font-black leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-xs text-gray-400 font-semibold">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-5">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
                    <input type="text" placeholder="Search home groups..." value={homeSearch} onChange={e => setHomeSearch(e.target.value)}
                        className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5b50d6] w-56 bg-white" />
                </div>
                <select value={filter} onChange={e => setFilter(e.target.value as any)}
                    className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#5b50d6] text-gray-700">
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Recommended">Recommended</option>
                </select>
                <span className="ml-auto text-xs text-gray-400">{filtered.length} home group{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {filtered.length === 0 && <div className="p-12 text-center text-sm text-gray-400">No home groups found</div>}
                {filtered.map(h => (
                    <div key={h.id} className="p-4 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="font-bold text-gray-900 text-sm">{h.name}</p>
                                <p className="text-xs text-gray-500">{h.barangay} · {h.schedule}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLE[h.status]}`}>{h.status}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                            <span>Potential: <span className="font-semibold text-[#5b50d6]">{h.potential}</span></span>
                            <span>{h.coordinator}</span>
                            <span>{h.submitted}</span>
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button onClick={() => setConfirmAction({ id: h.id, action: 'approve', name: h.name })}
                                className="flex-1 text-xs font-semibold text-[#0b9b8a] border border-[#0b9b8a] py-1.5 rounded-lg hover:bg-[#e0f7f5] transition-colors">Approve</button>
                            <button onClick={() => setConfirmAction({ id: h.id, action: 'reject', name: h.name })}
                                className="flex-1 text-xs font-semibold text-[#5b50d6] border border-[#5b50d6] py-1.5 rounded-lg hover:bg-[#ede9fe] transition-colors">Reject</button>
                        </div>
                    </div>
                ))}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div>
                    <table className="w-full text-xs min-w-[640px]">
                        <thead className="bg-[#f8f9fc]">
                            <tr>{['Home Group','Barangay','Schedule','Potential','Coordinator','Submitted','Status','Actions'].map(h => (
                                <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-3.5">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(h => (
                                <tr key={h.id} className="hover:bg-[#fafbff] transition-colors">
                                    <td className="px-3 py-3.5 font-bold text-gray-900">{h.name}</td>
                                    <td className="px-3 py-3.5 text-gray-600">{h.barangay}</td>
                                    <td className="px-3 py-3.5 text-gray-600">{h.schedule}</td>
                                    <td className="px-3 py-3.5 text-center font-semibold text-[#5b50d6]">{h.potential}</td>
                                    <td className="px-3 py-3.5 text-gray-600">{h.coordinator}</td>
                                    <td className="px-3 py-3.5 text-gray-400">{h.submitted}</td>
                                    <td className="px-3 py-3.5">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[h.status]}`}>{h.status}</span>
                                    </td>
                                    <td className="px-3 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setConfirmAction({ id: h.id, action: 'approve', name: h.name })}
                                                className="text-[11px] font-semibold text-[#0b9b8a] hover:underline">Approve</button>
                                            <span className="text-gray-200">|</span>
                                            <button onClick={() => setConfirmAction({ id: h.id, action: 'reject', name: h.name })}
                                                className="text-[11px] font-semibold text-[#5b50d6] hover:underline">Reject</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && <div className="p-12 text-center text-sm text-gray-400">No home groups found</div>}
                </div>
            </div>
        </div>
    );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────
function ReportsTab() {
    const [reportType, setReportType] = useState<'growth' | 'ministry' | 'map'>('growth');
    const [mapFilter, setMapFilter] = useState<'All' | 'Community-based' | 'Church-based'>('All');

    const allMapGroups: ClusterMapGroup[] = COORD_GROUPS
        .filter(g => mapFilter === 'All' || g.type === mapFilter)
        .map((g, i) => ({
            id: g.id, name: g.name, barangay: g.barangay, type: g.type,
            members: g.members, capacity: g.capacity, mentor: g.mentor, status: g.status,
            lat: 14.3294 + (i * 0.008), lng: 120.9367 + (i * 0.006),
        }));

    return (
        <div>
            <SectionHeader
                title="Reports & Analytics"
                sub="Ministry-wide statistics, growth trends, and interactive maps."
                action={
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-2 rounded-xl bg-white hover:border-gray-300 transition-colors">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5z"/></svg>
                            Export PDF
                        </button>
                        <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-2 rounded-xl bg-white hover:border-gray-300 transition-colors">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5z"/></svg>
                            Export Excel
                        </button>
                    </div>
                }
            />

            <div className="flex flex-wrap gap-2 mb-6">
                {([
                    { key: 'growth',  label: 'Growth Analytics' },
                    { key: 'ministry',label: 'Ministry Reports' },
                    { key: 'map',     label: 'Interactive Map' },
                ] as const).map(r => (
                    <button key={r.key} onClick={() => setReportType(r.key)}
                        className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors ${reportType === r.key ? 'bg-[#5b50d6] text-white border-[#5b50d6]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                        {r.label}
                    </button>
                ))}
            </div>

            {/* KPI summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Active Mentees',   value: MH_ACTIVE_MENTEES_LIST.length,                             color: '#5b50d6' },
                    { label: 'Active Mentors',   value: MH_ALL_MENTORS.filter(m => m.status === 'Active').length,  color: '#0b9b8a' },
                    { label: 'Clusters',         value: MH_CLUSTERS.length,                                        color: '#5b50d6' },
                    { label: 'Potential Mentees',value: MH_POTENTIAL_MENTEES.length,                               color: '#e67700' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <p className="text-3xl font-black leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-sm font-semibold text-gray-800">{s.label}</p>
                    </div>
                ))}
            </div>

            {reportType === 'growth' && (
                <div className="flex flex-col gap-5">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <p className="text-sm font-semibold text-gray-800 mb-4">C2S Growth — Mentees, Mentors & Groups</p>
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={ADMIN_GROWTH_DATA} margin={{ top: 10, right: 20, left: -16, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="rf1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#5b50d6" stopOpacity={0.15}/><stop offset="95%" stopColor="#5b50d6" stopOpacity={0}/></linearGradient>
                                    <linearGradient id="rf2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0b9b8a" stopOpacity={0.15}/><stop offset="95%" stopColor="#0b9b8a" stopOpacity={0}/></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                                <Tooltip contentStyle={TS}/>
                                <Legend iconType="plainline" iconSize={14} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}/>
                                <Area type="monotone" dataKey="mentees" name="Active Mentees" stroke="#5b50d6" strokeWidth={2} fill="url(#rf1)" dot={false}/>
                                <Area type="monotone" dataKey="mentors" name="Mentors"        stroke="#0b9b8a" strokeWidth={2} fill="url(#rf2)" dot={false}/>
                                <Line  type="monotone" dataKey="groups"  name="Groups"         stroke="#5b50d6" strokeWidth={2} dot={false}/>
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <p className="text-sm font-semibold text-gray-800 mb-4">Performance by Cluster</p>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={MH_CLUSTERS.map(c => ({ name: c.name.replace('Cluster ', 'C'), active: c.totalActiveMentees, potential: c.totalPotentialMentees, mentors: c.totalMentors }))} margin={{ top: 10, right: 20, left: -16, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                                <Tooltip contentStyle={TS}/>
                                <Legend iconSize={12} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}/>
                                <Bar dataKey="active"    name="Active Mentees"    fill="#5b50d6" radius={[3,3,0,0]} barSize={18}/>
                                <Bar dataKey="potential" name="Potential Mentees" fill="#e67700" fillOpacity={0.7} radius={[3,3,0,0]} barSize={18}/>
                                <Bar dataKey="mentors"   name="Mentors"           fill="#0b9b8a" fillOpacity={0.6} radius={[3,3,0,0]} barSize={18}/>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {reportType === 'ministry' && (
                <>
                    {/* Mobile cards */}
                    <div className="sm:hidden bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <div className="px-4 py-3 border-b border-gray-50">
                            <p className="text-sm font-bold text-gray-800">Ministry Performance Report</p>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {ADMIN_MINISTRY_PERF.map(r => (
                                <div key={r.name} className="p-4 flex flex-col gap-1.5">
                                    <p className="font-semibold text-gray-900">{r.name}</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                        <span><span className="text-gray-400">Mentors: </span><span className="font-semibold text-[#0b9b8a]">{r.mentors}</span></span>
                                        <span><span className="text-gray-400">Groups: </span><span className="font-semibold text-[#5b50d6]">{r.groups}</span></span>
                                        <span><span className="text-gray-400">F2F: </span><span className="text-gray-600">{Math.round(r.mentees * 0.65)}</span></span>
                                        <span><span className="text-gray-400">Online: </span><span className="text-gray-600">{Math.round(r.mentees * 0.35)}</span></span>
                                        <span><span className="text-gray-400">Total: </span><span className="font-bold text-gray-900">{r.mentees}</span></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <div className="px-6 py-4 border-b border-gray-50">
                            <p className="text-sm font-bold text-gray-800">Ministry Performance Report</p>
                        </div>
                        <div>
                            <table className="w-full text-xs min-w-[480px]">
                                <thead className="bg-[#f8f9fc]">
                                    <tr>{['Ministry','Mentors','Groups','Mentees (F2F)','Mentees (Online)','Total Mentees'].map(h => (
                                        <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-3.5">{h}</th>
                                    ))}</tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {ADMIN_MINISTRY_PERF.map(r => (
                                        <tr key={r.name} className="hover:bg-[#fafbff]">
                                            <td className="px-3 py-3.5 font-semibold text-gray-900">{r.name}</td>
                                            <td className="px-3 py-3.5 font-semibold text-[#0b9b8a]">{r.mentors}</td>
                                            <td className="px-3 py-3.5 font-semibold text-[#5b50d6]">{r.groups}</td>
                                            <td className="px-3 py-3.5 text-gray-600">{Math.round(r.mentees * 0.65)}</td>
                                            <td className="px-3 py-3.5 text-gray-600">{Math.round(r.mentees * 0.35)}</td>
                                            <td className="px-3 py-3.5 font-bold text-gray-900">{r.mentees}</td>
                                        </tr>
                                    ))}
                                    <tr className="border-t-2 border-gray-200" style={{ background: 'var(--bg-subtle)' }}>
                                        <td className="px-3 py-3.5 font-black text-gray-800">Total</td>
                                        <td className="px-3 py-3.5 font-bold text-[#0b9b8a]">{ADMIN_MINISTRY_PERF.reduce((s, r) => s + r.mentors, 0)}</td>
                                        <td className="px-3 py-3.5 font-bold text-[#5b50d6]">{ADMIN_MINISTRY_PERF.reduce((s, r) => s + r.groups, 0)}</td>
                                        <td className="px-3 py-3.5 font-bold text-gray-700">{Math.round(ADMIN_MINISTRY_PERF.reduce((s, r) => s + r.mentees, 0) * 0.65)}</td>
                                        <td className="px-3 py-3.5 font-bold text-gray-700">{Math.round(ADMIN_MINISTRY_PERF.reduce((s, r) => s + r.mentees, 0) * 0.35)}</td>
                                        <td className="px-3 py-3.5 font-black text-gray-900">{ADMIN_MINISTRY_PERF.reduce((s, r) => s + r.mentees, 0)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {reportType === 'map' && (
                <div>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {(['All', 'Community-based', 'Church-based'] as const).map(f => (
                            <button key={f} onClick={() => setMapFilter(f)}
                                className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors ${mapFilter === f ? 'bg-[#5b50d6] text-white border-[#5b50d6]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>{f}</button>
                        ))}
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4 map-container" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <ClusterMapDynamic groups={allMapGroups} accentColor="#5b50d6" />
                    </div>
                    <div className="flex items-center gap-6 mb-4">
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-[#0b9b8a]"/><span className="text-xs text-gray-600 font-medium">Community-based</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-[#1971c2]"/><span className="text-xs text-gray-600 font-medium">Church-based</span></div>
                        <p className="text-xs text-gray-400 ml-auto">Click a marker for group details</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {allMapGroups.map(g => (
                            <div key={g.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 shadow" style={{ background: g.type === 'Church-based' ? '#1971c2' : '#0b9b8a' }}>{g.members}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 text-sm">{g.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{g.barangay} · {g.mentor}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${g.type === 'Community-based' ? 'bg-[#0b9b8a] text-white' : 'bg-[#1971c2] text-white'}`}>{g.type}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────
function NotificationsTab() {
    const [notifs, setNotifs] = useState<AdminNotification[]>(ADMIN_NOTIFICATIONS);
    const [typeFilter, setTypeFilter] = useState<'All' | AdminNotification['type']>('All');
    const unread = notifs.filter(n => !n.read).length;

    const NOTIF_CONFIG: Record<string, { bg: string; color: string; icon: string }> = {
        worker_id:          { bg: '#ede9fe', color: '#5b50d6', icon: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z' },
        new_registration:   { bg: '#ede9fe', color: '#6741d9', icon: 'M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
        assignment_update:  { bg: '#d3f9f0', color: '#0b9b8a', icon: 'M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z' },
        hub_update:         { bg: '#e0f7f5', color: '#0b9b8a', icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
        system_alert:       { bg: '#fee2e2', color: '#5b50d6', icon: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z' },
    };
    const PRIORITY_STYLE: Record<string, string> = {
        high:   'bg-[#fee2e2] text-[#991b1b]',
        medium: 'bg-[#fef9c3] text-[#92400e]',
        low:    'bg-[#f3f4f6] text-[#6b7280]',
    };

    const filtered = notifs.filter(n => typeFilter === 'All' || n.type === typeFilter);

    return (
        <div>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Notifications</h1>
                    <p className="text-sm text-gray-400 mt-1">{unread > 0 ? `${unread} unread` : 'All caught up'}</p>
                </div>
                {unread > 0 && (
                    <button onClick={() => setNotifs(prev => prev.map(n => ({ ...n, read: true })))}
                        className="text-xs font-semibold text-[#5b50d6] hover:underline">Mark all as read</button>
                )}
            </div>

            <div className="flex flex-col gap-3">
                {notifs.map(n => {
                    const cfg = NOTIF_CONFIG[n.type] ?? NOTIF_CONFIG.system_alert;
                    return (
                        <div key={n.id}
                            onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                            className={`bg-white rounded-2xl border px-5 py-4 flex items-start gap-4 cursor-pointer transition-colors ${n.read ? 'border-gray-100' : 'border-[#5b50d6]/25 shadow-sm'}`}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill={cfg.color}><path d={cfg.icon}/></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-xs font-bold text-gray-800">{n.title}</p>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[n.priority]}`}>{n.priority}</span>
                                    {!n.read && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#ede9fe] text-[#5b50d6]">New</span>}
                                </div>
                                <p className={`text-xs leading-relaxed ${n.read ? 'text-gray-500' : 'text-gray-800'}`}>{n.text}</p>
                                <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                            </div>
                            {!n.read && <div className="w-2 h-2 rounded-full bg-[#5b50d6] shrink-0 mt-1.5" />}
                        </div>
                    );
                })}
                {filtered.length === 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                        <p className="text-sm text-gray-400">No notifications found</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Audit Logs Tab ───────────────────────────────────────────────────────────
function AuditLogsTab() {
    const [typeFilter, setTypeFilter] = useState<'All' | AuditLog['type']>('All');
    const [severityFilter, setSeverityFilter] = useState<'All' | 'info' | 'warning' | 'critical'>('All');
    const [search, setSearch] = useState('');

    const LOG_CONFIG: Record<string, { bg: string; color: string; icon: string }> = {
        user_activity: { bg: '#dbeafe', color: '#1d4ed8', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
        assignment:    { bg: '#d3f9f0', color: '#0b9b8a', icon: 'M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z' },
        rbac_change:   { bg: '#ede9fe', color: '#6741d9', icon: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z' },
        worker_id:     { bg: '#ede9fe', color: '#5b50d6', icon: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z' },
        group_change:  { bg: '#fef9c3', color: '#92400e', icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
        system:        { bg: '#f3f4f6', color: '#6b7280', icon: 'M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54A.484.484 0 0 0 14 4h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87a.47.47 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.47.47 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.37 1.04.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 0 0-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z' },
    };

    const SEVERITY_STYLE: Record<string, string> = {
        info:     'bg-[#dbeafe] text-[#1d4ed8]',
        warning:  'bg-[#fef9c3] text-[#92400e]',
        critical: 'bg-[#fee2e2] text-[#991b1b]',
    };

    const TYPE_LABELS: Record<string, string> = {
        user_activity: 'User Activity',
        assignment:    'Assignment',
        rbac_change:   'RBAC Change',
        worker_id:     'Worker ID',
        group_change:  'Group Change',
        system:        'System',
    };

    const filtered = AUDIT_LOGS.filter(l =>
        (typeFilter === 'All' || l.type === typeFilter) &&
        (severityFilter === 'All' || l.severity === severityFilter) &&
        (l.actor.toLowerCase().includes(search.toLowerCase()) ||
         l.action.toLowerCase().includes(search.toLowerCase()) ||
         l.target.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div>
            <SectionHeader title="Audit Logs" sub="Track all user activity, RBAC changes, assignment history, and system events." />

            {/* Summary pills */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Events',  value: AUDIT_LOGS.length,                                    color: '#5b50d6' },
                    { label: 'Critical',      value: AUDIT_LOGS.filter(l => l.severity === 'critical').length, color: '#5b50d6' },
                    { label: 'Warnings',      value: AUDIT_LOGS.filter(l => l.severity === 'warning').length,  color: '#e67700' },
                    { label: 'RBAC Changes',  value: AUDIT_LOGS.filter(l => l.type === 'rbac_change').length,  color: '#6741d9' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <p className="text-2xl font-black leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-[10px] text-gray-400 font-semibold">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
                    <input type="text" placeholder="Search actor, action, target..." value={search} onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5b50d6] w-60 bg-white" />
                </div>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}
                    className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#5b50d6] text-gray-700">
                    <option value="All">All Types</option>
                    <option value="user_activity">User Activity</option>
                    <option value="assignment">Assignment</option>
                    <option value="rbac_change">Permission Change</option>
                    <option value="worker_id">Worker ID</option>
                    <option value="group_change">Group Change</option>
                    <option value="system">System</option>
                </select>
                <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value as any)}
                    className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#5b50d6] text-gray-700">
                    <option value="All">All Severities</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                </select>
                <span className="ml-auto text-xs text-gray-400">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Log list */}
            <div className="flex flex-col gap-2">
                {filtered.map(l => {
                    const cfg = LOG_CONFIG[l.type] ?? LOG_CONFIG.system;
                    return (
                        <div key={l.id} className={`bg-white rounded-2xl border p-4 flex items-start gap-4 ${l.severity === 'critical' ? 'border-red-100' : l.severity === 'warning' ? 'border-yellow-100' : 'border-gray-100'}`}
                            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill={cfg.color}><path d={cfg.icon}/></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0" style={{ background: l.actorColor }}>{l.actorInitials}</div>
                                    <span className="text-xs font-bold text-gray-900">{l.actor}</span>
                                    <span className="text-xs text-gray-400">→</span>
                                    <span className="text-xs font-semibold text-gray-700">{l.action}</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{TYPE_LABELS[l.type]}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${SEVERITY_STYLE[l.severity]}`}>{l.severity}</span>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    <span className="font-semibold text-gray-800">{l.target}</span> — {l.detail}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">{l.timestamp}</p>
                            </div>
                        </div>
                    );
                })}
                {filtered.length === 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                        <p className="text-sm text-gray-400">No audit logs found</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Role Template Row (used inside Settings RBAC section) ───────────────────
function RoleTemplateRow({ rt }: { rt: typeof ROLE_TEMPLATES[0] }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className="rounded-xl border border-gray-100 overflow-hidden">
            <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors text-left"
                style={{ background: 'var(--bg-subtle)' }}
                onClick={() => setExpanded(p => !p)}>
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: rt.color + '18' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill={rt.color}><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">{rt.name}</p>
                        <p className="text-[10px] text-gray-400">{rt.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: rt.color + '18', color: rt.color }}>
                        {rt.permissions.length} perms
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400">{rt.workerCount} workers</span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                </div>
            </button>
            {expanded && (
                <div className="p-3 border-t border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Permissions</p>
                    <div className="flex flex-wrap gap-1.5">
                        {rt.permissions.map(pk => {
                            const p = C2S_PERMISSIONS.find(x => x.key === pk);
                            return (
                                <div key={pk} className="bg-white border border-gray-100 rounded-lg px-2.5 py-1.5">
                                    <p className="text-[10px] font-mono font-semibold text-gray-700">{pk}</p>
                                    {p && <p className="text-[9px] text-gray-400 mt-0.5">{p.description}</p>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Subdivisions Section Component ─────────────────────────────────────────
const HOA_DATA = [
    { barangay: 'Burol I',        subs: ['Town & Country Ph. 1','Windward Hills'] },
    { barangay: 'Burol III',      subs: ['Acacia Homes','Tierra Verde','Windsor Homes'] },
    { barangay: 'Burol',          subs: ['Amaris Homes Dasma Ph. 2','Chester Place','Corner Stone','Cresent Hills','Summerwind Village Phase IV','Villa Isabel Village','Villa Nicasia'] },
    { barangay: 'Fatima I',       subs: ['Umakap Ka'] },
    { barangay: 'Langkaan I',     subs: ['Abot Kamay','Cedarwood','Grand Garden Villas','Kazari Residence','Westwood Highlands','Pamela Homes','Pueblo Cillo','Tierra Vista Ayana Ph. 1','Tierra Vista Ayana Ph. 2','Tierra Vista','Villa Elena Ph. 1','Villa Elena Ph. 2','Village Park','Ville De Soleil Ph. 1','Ville De Soleil Ph. 2','West Beverly Hills'] },
    { barangay: 'Langkaan II',    subs: ['Cityhomes Resortville 1','Cityhomes Resortville 2','Greenbreze Village 1','Greenbreze Village 2','Valle Verde','Solar Homes Ph. 3'] },
    { barangay: 'Paliparan I',    subs: ['Carissa Homes Dasmariñas','Dasmariñas Royale Village','Greenwoods Village Ph. 1','La Meseta','Nostalji Enclave','Pacific Parkplace Village','San Marino Square','Terra Alta Homes','Tierra Bonita','The Island Park'] },
    { barangay: 'Paliparan II',   subs: ['Camella Dasmariñas','Mabuhay Homes 2000 Ph. 1,2&4','Mabuhay Homes 2000 Ph. 3','Amalfi','St. Joseph Ridge View'] },
    { barangay: 'Paliparan III',  subs: ['Bahay Karangalan','Bahay Katuparan','Mabuhay City Dasmariñas Ph. 1-4','Ph. 2 Extension Mabuhay City'] },
    { barangay: 'Sabang',         subs: ['Dasmariñas Townsville','Dexterville Classic','Golden Ville 1','Golden Ville 2','Greensborough','Sunnydale Homes','Sunrise Hills','United Southplains'] },
    { barangay: 'Salawag',        subs: ['Armstrong Village','Avida Residences Dasmariñas','Avida Sta. Cecilia','City of San Marino','Diamond Village (Dasma 2)','Fairway View','Golden City Dasma 1 Ph. 1-5','Golden City Dasma 3 Ph. 6,7&8','Golden City Dasma 4 Ph. 9&10','Greenmeadows @ The Orchard','Mabuhay Homes 2000 Ph. V','North & South Dasma Garden Villas','Raintree (Raintree & Oakridge)','San Marino Classic','San Marino Heights','Avida Sta. Catalina Village Ph. 1','Avida Sta. Catalina Village Ph. 2','Avida Sta. Catalina Village Ph. 3','The Promenade Residences','Upehco','Viva Homes Estates','Westridge Residences'] },
    { barangay: 'Salitran I',     subs: ['Da-Ra Homes','Diamond Village','Southfields Executive Village'] },
    { barangay: 'Salitran II',    subs: ['Amaris Homes Dasma Ph. 1','Arcontica Village','Cresta Bonita','Fiesta South','Ivory Crest Village','Sunny Crest Village','United Southplains','Villa Remedios'] },
    { barangay: 'Salitran III',   subs: ["Cardinal's Dasmariñas Village Ph. 1","First United Homeowners Ass. Inc. Cardinal's Dasmariñas Village Ph. 2",'Molino Homes','Munting Nayon','South Garden Homes','St. Anthony Village','Summer Meadows','Summerwind Village 1','Summerwind Village 2','Summerwind Village 3'] },
    { barangay: 'Salitran IV',    subs: ['Andrea Ville Homes Ph. 1','Andrea Ville Homes Ph. 2','Garden Grove','Mango Village','South Meridian Ph. 1','South Meridian Ph. 2','South Meridian Ph. 3','Town & Country Ph. 2'] },
    { barangay: 'Sampaloc I',     subs: ["Cardinal's Dasmaville",'Kingsland Village','Metrogate Dasmariñas II','Doña Mercedes Village','La Mediterranea'] },
    { barangay: 'Sampaloc II',    subs: ['Caragao','Don Gregorio Heights I','Greenfield Heights','Regency Executive Townhomes','Washington Place','Mahogany','Blessed Ville','Greensite','11th Avenue','Munting Antipolo'] },
    { barangay: 'Sampaloc III',   subs: ['Airmens Village','Carmel Heights Royale','Cityview II Dasmariñas','Fatima Heights','Gawad Kalinga SMDC Bayanihan Village','Greenbreze Village 4','Greenwoods','Ligayaville',"Seamen's Village",'Villa Linda'] },
    { barangay: 'Sampaloc IV',    subs: ['Bahay Pangarap 2000','Cityhomes Dasmariñas','St. Charbel South','University Hills Estate'] },
    { barangay: 'San Agustin I',  subs: ['Metrogate Dasmariñas',"Robinson's Vineyard Ph. 2","Robinson's Vineyard Ph. 3","Robinson's Vineyard Ph. 4",'Solar Homes Ph. 1','Solar Homes Ph. 2','Vine Village','The Villas @ Dasmariñas Highland','Greenbreze Village 3'] },
    { barangay: 'San Agustin II', subs: ['Augustine Grove','Manuela Ville','Southcrest Village','Via Verde Village'] },
    { barangay: 'San Agustin III',subs: ['Villa Catalina','Villa Luisa Homes Ph. 1','Villa Luisa Homes Ph. 2','Villa Luisa Homes Ph. 3','Villa Luisa Homes Ph. 4'] },
    { barangay: 'San Jose',       subs: ['Del Remedios','Emerald Crest','Fiesta Homes','Lagmay','Medina Ville','Satellite Homes I','Satellite Homes 2','Satellite Homes 3',"St. Mary's Homes",'United Southplains','Vista Bonita','Wood Estate'] },
    { barangay: 'San Manuel II',  subs: ['Congressional South'] },
    { barangay: 'San Nicolas II', subs: ['Dexterville Royale'] },
    { barangay: 'Saint Peter I',  subs: ['Postal Village'] },
    { barangay: 'Zone I-B',       subs: ['Agustina Village','Don Gregorio Heights II','San Lorenzo Heights'] },
    { barangay: 'Zone III',       subs: ['Dasmariñas Executive Village','Deniella Homes','Roseville Subdivision','Kahaya'] },
];

// ─── Shared Validation Helpers ───────────────────────────────────────────────

/** Inline field error message */
function FieldError({ msg }: { msg: string }) {
    return (
        <p className="text-xs text-red-500 font-medium flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            {msg}
        </p>
    );
}

/** Inline save success */
function SavedBadge() {
    return (
        <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Saved successfully
        </p>
    );
}

/** Generic confirmation dialog for any delete/remove action */
function ConfirmDialog({
    title, message, warning,
    confirmLabel = 'Yes, Remove',
    confirmColor = '#ef4444',
    onConfirm, onCancel,
}: {
    title: string;
    message: React.ReactNode;
    warning?: string;
    confirmLabel?: string;
    confirmColor?: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <>
            <div className="fixed inset-0 z-[300] bg-black/40" onClick={onCancel} />
            <div className="fixed inset-0 z-[301] flex items-center justify-center p-4" onClick={onCancel}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ background: confirmColor + '15' }}>
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill={confirmColor}>
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </div>
                    <div className="text-center">
                        <h3 className="text-base font-bold text-gray-900">{title}</h3>
                        <div className="text-sm text-gray-500 mt-1.5">{message}</div>
                        {warning && (
                            <p className="text-xs font-medium mt-2" style={{ color: confirmColor }}>{warning}</p>
                        )}
                    </div>
                    <div className="flex gap-3 mt-1">
                        <button onClick={onCancel}
                            className="flex-1 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button onClick={onConfirm}
                            className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-colors"
                            style={{ background: confirmColor }}>
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ─── Subdivisions Section ─────────────────────────────────────────────────────
function SubdivisionsSection({ onSave, saved }: { onSave: () => void; saved: boolean }) {
    const [barangayFilter, setBarangayFilter] = useState('');
    const [subsDropdown, setSubsDropdown] = useState('');
    const [newSubName, setNewSubName]   = useState('');
    const [newSubBrgy, setNewSubBrgy]   = useState('');
    const [addError, setAddError]       = useState('');
    const [confirmRemove, setConfirmRemove] = useState<{ sub: string; barangay: string } | null>(null);

    const selectedGroup = HOA_DATA.find(g => g.barangay === barangayFilter);
    const totalSubs = HOA_DATA.reduce((s, g) => s + g.subs.length, 0);
    const allSubs = HOA_DATA.flatMap(g => g.subs.map(s => s.toLowerCase()));

    function handleAdd() {
        const trimmed = newSubName.trim();
        if (!trimmed) { setAddError('Subdivision name cannot be empty.'); return; }
        if (!newSubBrgy) { setAddError('Please select a barangay.'); return; }
        if (allSubs.includes(trimmed.toLowerCase())) { setAddError(`"${trimmed}" already exists.`); return; }
        setNewSubName(''); setNewSubBrgy(''); setAddError('');
        onSave();
    }

    return (
        <>
        {confirmRemove && (
            <ConfirmDialog
                title="Remove Subdivision?"
                message={<>Remove <strong>"{confirmRemove.sub}"</strong> from <strong>{confirmRemove.barangay}</strong>?</>}
                warning="This will remove it from all group location options."
                onConfirm={() => { setSubsDropdown(''); setConfirmRemove(null); onSave(); }}
                onCancel={() => setConfirmRemove(null)}
            />
        )}
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-base font-bold text-gray-900 mb-1">Subdivisions</h2>
                <p className="text-sm text-gray-400">Manage subdivisions used for C2S group location mapping. {totalSubs} total entries.</p>
            </div>

            {/* Add new */}
            <div className="flex flex-col gap-1.5">
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        value={newSubName}
                        onChange={e => { setNewSubName(e.target.value); if (addError) setAddError(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        placeholder="New subdivision name..."
                        className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${addError ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-[#5b50d6]'}`}
                    />
                    <div className="flex items-center gap-2">
                        <select
                            value={newSubBrgy}
                            onChange={e => { setNewSubBrgy(e.target.value); if (addError) setAddError(''); }}
                            className={`flex-1 min-w-0 border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white text-gray-700 ${addError && !newSubBrgy ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-[#5b50d6]'}`}
                        >
                            <option value="">Select Barangay</option>
                            <optgroup label="DASMARIÑAS">
                                {BARANGAY_DATA['Dasmariñas City'].map(b => <option key={b} value={b}>{b}</option>)}
                            </optgroup>
                            <optgroup label="SILANG">
                                {BARANGAY_DATA['Silang'].map(b => <option key={b} value={b}>{b}</option>)}
                            </optgroup>
                            <optgroup label="TRECE MARTIRES CITY">
                                {BARANGAY_DATA['Trece Martires City'].map(b => <option key={b} value={b}>{b}</option>)}
                            </optgroup>
                        </select>
                        <button onClick={handleAdd} className="px-4 py-2.5 text-sm font-semibold text-white rounded-xl shrink-0" style={{ background: '#5b50d6' }}>Add</button>
                    </div>
                </div>
                {addError ? <FieldError msg={addError} /> : saved && <SavedBadge />}
            </div>

            {/* Browse by barangay */}
            <div className="flex flex-col gap-3">
                <select value={barangayFilter} onChange={e => { setBarangayFilter(e.target.value); setSubsDropdown(''); }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b50d6] bg-white text-gray-700">
                    <option value="">— Select a barangay to browse subdivisions —</option>
                    <optgroup label="DASMARIÑAS">
                        {BARANGAY_DATA['Dasmariñas City'].map(b => {
                            const hoaGroup = HOA_DATA.find(g => g.barangay === b);
                            return <option key={b} value={b}>{b}{hoaGroup ? ` (${hoaGroup.subs.length})` : ''}</option>;
                        })}
                    </optgroup>
                    <optgroup label="SILANG">
                        {BARANGAY_DATA['Silang'].map(b => <option key={b} value={b}>{b}</option>)}
                    </optgroup>
                    <optgroup label="TRECE MARTIRES CITY">
                        {BARANGAY_DATA['Trece Martires City'].map(b => <option key={b} value={b}>{b}</option>)}
                    </optgroup>
                </select>

                {selectedGroup && (
                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between" style={{ background: 'var(--bg-subtle)' }}>
                            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">{selectedGroup.barangay}</p>
                            <span className="text-xs text-gray-400">{selectedGroup.subs.length} subdivisions</span>
                        </div>
                        <select value={subsDropdown} onChange={e => setSubsDropdown(e.target.value)}
                            className="w-full border-0 border-b border-gray-100 px-4 py-2.5 text-sm focus:outline-none bg-white text-gray-700">
                            <option value="">— Select a subdivision —</option>
                            {selectedGroup.subs.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {subsDropdown && (
                            <div className="flex items-center justify-between px-4 py-3 bg-[#f5f3ff]">
                                <span className="text-sm font-semibold text-gray-800">{subsDropdown}</span>
                                <button
                                    onClick={() => setConfirmRemove({ sub: subsDropdown, barangay: selectedGroup.barangay })}
                                    className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors flex items-center gap-1"
                                >
                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
        </>
    );
}

// ─── Barangays Section Component ──────────────────────────────────────────────
const BARANGAY_DATA = {
    'Dasmariñas City': [
        'Burol','Burol I','Burol II','Burol III','Datu Esmael',
        'Emmanuel Bergado I','Emmanuel Bergado II',
        'Fatima I','Fatima II','Fatima III','H-2',
        'Langkaan I','Langkaan II','Luzviminda I','Luzviminda II',
        'Paliparan I','Paliparan II','Paliparan III','Sabang',
        'Saint Peter I','Saint Peter II','Salawag',
        'Salitran I','Salitran II','Salitran III','Salitran IV',
        'Sampaloc I','Sampaloc II','Sampaloc III','Sampaloc IV','Sampaloc V',
        'San Agustin I','San Agustin II','San Agustin III',
        'San Andres I','San Andres II',
        'San Antonio De Padua I','San Antonio De Padua II',
        'San Dionisio','San Esteban','San Francisco I','San Francisco II',
        'San Isidro Labrador I','San Isidro Labrador II',
        'San Jose','San Juan','San Lorenzo Ruiz I','San Lorenzo Ruiz II',
        'San Luis I','San Luis II','San Manuel I','San Manuel II','San Mateo',
        'San Miguel I','San Miguel II','San Nicolas I','San Nicolas II',
        'San Roque','San Simon',
        'Santa Cristina I','Santa Cristina II','Santa Cruz I','Santa Cruz II',
        'Santa Fe','Santa Lucia','Santa Maria',
        'Santo Cristo','Santo Niño I','Santo Niño II',
        'Victoria Reyes','Zone I','Zone I-B','Zone II','Zone III','Zone IV',
    ],
    'Silang': [
        'Acacia','Adlas','Anahaw I','Anahaw II',
        'Balite I','Balite II','Balubad','Banaba','Batas',
        'Biga I','Biga II','Biluso','Bucal','Buho','Bulihan',
        'Cabangaan','Carmen',
        'Hoyo','Hukay','Iba','Inchican',
        'Ipil I','Ipil II','Kalubkob','Kaong',
        'Lalaan I','Lalaan II','Litlit','Lucsuhin','Lumil',
        'Maguyam','Malabag','Malaking Tatyao','Mataas Na Burol','Munting Ilog',
        'Narra I','Narra II','Narra III',
        'Paligawan','Pasong Langka',
        'Poblacion Barangay I','Poblacion Barangay II','Poblacion Barangay III',
        'Poblacion Barangay IV','Poblacion Barangay V',
        'Pooc I','Pooc II','Pulong Bunga','Pulong Saging','Puting Kahoy',
        'Sabutan','San Miguel I','San Miguel II','San Vicente I','San Vicente II',
        'Santol','Tartaria','Tibig','Toledo',
        'Tubuan I','Tubuan II','Tubuan III','Ulat','Yakal',
    ],
    'Trece Martires City': [
        'Aguado','Cabezas','Cabuco','Conchu','De Ocampo',
        'Gregorio','Hugo Perez','Inocencio','Lallana',
        'Lapidario','Luciano','Osorio','San Agustin',
    ],
};
const CITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'Dasmariñas City':     { bg: '#ede9fe', text: '#5b50d6', border: '#ddd6fe' },
    'Silang':              { bg: '#ede9fe', text: '#6741d9', border: '#d4c9f9' },
    'Trece Martires City': { bg: '#d3f9f0', text: '#0b9b8a', border: '#a7f3e0' },
};

function BarangaysSection({ onSave, saved }: { onSave: () => void; saved: boolean }) {
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedBarangay, setSelectedBarangay] = useState('');
    const [newBrgyName, setNewBrgyName] = useState('');
    const [newBrgyCity, setNewBrgyCity] = useState('');
    const [addError, setAddError]       = useState('');
    const [confirmRemove, setConfirmRemove] = useState<{ barangay: string; city: string } | null>(null);

    const cities = Object.keys(BARANGAY_DATA) as (keyof typeof BARANGAY_DATA)[];
    const allBarangays = cities.flatMap(c => BARANGAY_DATA[c].map(b => b.toLowerCase()));

    function handleAdd() {
        const trimmed = newBrgyName.trim();
        if (!trimmed) { setAddError('Barangay name cannot be empty.'); return; }
        if (!newBrgyCity) { setAddError('Please select a city / municipality.'); return; }
        if (allBarangays.includes(trimmed.toLowerCase())) { setAddError(`"${trimmed}" already exists.`); return; }
        setNewBrgyName(''); setNewBrgyCity(''); setAddError('');
        onSave();
    }

    function handleSelect(city: string, barangay: string) {
        setSelectedCity(city);
        setSelectedBarangay(barangay);
    }

    function handleClear() {
        setSelectedCity('');
        setSelectedBarangay('');
    }

    return (
        <>
        {confirmRemove && (
            <ConfirmDialog
                title="Remove Barangay?"
                message={<>Remove <strong>"{confirmRemove.barangay}"</strong> from <strong>{confirmRemove.city}</strong>?</>}
                warning="This will remove it from all group and subdivision options."
                onConfirm={() => { handleClear(); setConfirmRemove(null); onSave(); }}
                onCancel={() => setConfirmRemove(null)}
            />
        )}
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-base font-bold text-gray-900 mb-1">Barangays</h2>
                <p className="text-sm text-gray-400">
                    Dasmariñas City ({BARANGAY_DATA['Dasmariñas City'].length}) ·{' '}
                    Silang ({BARANGAY_DATA['Silang'].length}) ·{' '}
                    Trece Martires City ({BARANGAY_DATA['Trece Martires City'].length})
                </p>
            </div>

            {/* Add new */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newBrgyName}
                        onChange={e => { setNewBrgyName(e.target.value); if (addError) setAddError(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        placeholder="New barangay name..."
                        className={`flex-1 border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${addError ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-[#5b50d6]'}`}
                    />
                    <select
                        value={newBrgyCity}
                        onChange={e => { setNewBrgyCity(e.target.value); if (addError) setAddError(''); }}
                        className={`border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white text-gray-700 ${addError && !newBrgyCity ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-[#5b50d6]'}`}
                    >
                        <option value="">Select City / Municipality</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button onClick={handleAdd} className="px-4 py-2.5 text-sm font-semibold text-white rounded-xl shrink-0" style={{ background: '#5b50d6' }}>Add</button>
                </div>
                {addError ? <FieldError msg={addError} /> : saved && <SavedBadge />}
            </div>

            {/* One block per city — non-clickable header + dropdown */}
            <div className="flex flex-col gap-4">
                {cities.map(city => {
                    const c = CITY_COLORS[city];
                    const isThisSelected = selectedCity === city;
                    const anotherSelected = selectedCity !== '' && selectedCity !== city;

                    return (
                        <div key={city} className={`rounded-xl border overflow-hidden transition-opacity ${anotherSelected ? 'opacity-40 pointer-events-none' : ''}`}
                            style={{ borderColor: c.border }}>
                            {/* Non-clickable city label */}
                            <div className="px-4 py-3 flex items-center justify-between"
                                style={{ background: c.bg, borderBottom: `1px solid ${c.border}` }}>
                                <p className="text-sm font-bold uppercase tracking-widest" style={{ color: c.text }}>{city}</p>
                                <span className="text-xs font-semibold" style={{ color: c.text }}>{BARANGAY_DATA[city].length} barangays</span>
                            </div>
                            {/* Dropdown */}
                            <div className="p-3 bg-white">
                                <select
                                    value={isThisSelected ? selectedBarangay : ''}
                                    onChange={e => e.target.value ? handleSelect(city, e.target.value) : handleClear()}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b50d6] bg-white text-gray-700">
                                    <option value="">— Select a barangay —</option>
                                    {BARANGAY_DATA[city].map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            {/* Selected action row */}
                            {isThisSelected && selectedBarangay && (
                                <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100" style={{ background: 'var(--bg-subtle)' }}>
                                    <span className="text-sm font-semibold text-gray-800">{selectedBarangay}</span>
                                    <button
                                        onClick={() => setConfirmRemove({ barangay: selectedBarangay, city })}
                                        className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors flex items-center gap-1"
                                    >
                                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
        </>
    );
}

// ─── Ministries Section Component ────────────────────────────────────────────
// DEPARTMENTS and Department type are imported from admin-data

const DEPT_COLORS: Record<Department, { bg: string; text: string; border: string; dot: string }> = {
    Worship:        { bg: '#e8edf5', text: '#1e3a6e', border: '#c0cce0', dot: '#1e3a6e' },
    Outreach:       { bg: '#fff4e0', text: '#e8952a', border: '#ffd89b', dot: '#e8952a' },
    Relationship:   { bg: '#fbeaea', text: '#b22222', border: '#f0b8b8', dot: '#b22222' },
    Discipleship:   { bg: '#e8f5e9', text: '#2d7a2d', border: '#b8ddb8', dot: '#2d7a2d' },
    Administration: { bg: '#f0f0f0', text: '#1a1a1a', border: '#cccccc', dot: '#1a1a1a' },
};

// Pre-populated from the canonical MINISTRY_DEPARTMENTS list — editable at runtime
const INITIAL_MINISTRIES: Record<Department, string[]> = {
    Worship:        [...MINISTRY_DEPARTMENTS.Worship],
    Outreach:       [...MINISTRY_DEPARTMENTS.Outreach],
    Relationship:   [...MINISTRY_DEPARTMENTS.Relationship],
    Discipleship:   [...MINISTRY_DEPARTMENTS.Discipleship],
    Administration: [...MINISTRY_DEPARTMENTS.Administration],
};

function MinistriesSection({ onSave, saved }: { onSave: () => void; saved: boolean }) {
    const [activeDept, setActiveDept] = useState<Department>('Worship');
    const [ministries, setMinistries] = useState<Record<Department, string[]>>(INITIAL_MINISTRIES);
    const [newName, setNewName] = useState('');
    const [addError, setAddError] = useState('');

    // Confirmation dialog state
    const [confirmRemove, setConfirmRemove] = useState<{ name: string; dept: Department } | null>(null);
    const [confirmAdd, setConfirmAdd] = useState<{ name: string; dept: Department } | null>(null);

    const c = DEPT_COLORS[activeDept];
    const currentList = ministries[activeDept];
    const totalCount = DEPARTMENTS.reduce((s, d) => s + ministries[d].length, 0);

    function handleAdd() {
        const trimmed = newName.trim();
        if (!trimmed) {
            setAddError('Ministry name cannot be empty.');
            return;
        }
        if (currentList.map(m => m.toLowerCase()).includes(trimmed.toLowerCase())) {
            setAddError(`"${trimmed}" already exists under ${activeDept}.`);
            return;
        }
        setConfirmAdd({ name: trimmed, dept: activeDept });
    }

    function confirmAndAdd() {
        if (!confirmAdd) return;
        setMinistries(prev => ({ ...prev, [confirmAdd.dept]: [...prev[confirmAdd.dept], confirmAdd.name] }));
        setNewName('');
        setAddError('');
        setConfirmAdd(null);
        onSave();
    }

    function confirmAndRemove() {
        if (!confirmRemove) return;
        setMinistries(prev => ({
            ...prev,
            [confirmRemove.dept]: prev[confirmRemove.dept].filter(m => m !== confirmRemove.name),
        }));
        setConfirmRemove(null);
        onSave();
    }

    return (
        <>
        {/* ── Remove Confirmation Dialog ── */}
        {confirmRemove && (
            <ConfirmDialog
                title="Remove Ministry?"
                message={
                    <>Remove <strong>"{confirmRemove.name}"</strong> from{' '}
                    <span style={{ color: DEPT_COLORS[confirmRemove.dept].dot }}>{confirmRemove.dept}</span>?</>
                }
                warning="This will remove it from all dropdowns and filters across the system."
                onConfirm={confirmAndRemove}
                onCancel={() => setConfirmRemove(null)}
            />
        )}

        {/* ── Add Confirmation Dialog ── */}
        {confirmAdd && (
            <ConfirmDialog
                title="Add Ministry?"
                message={
                    <>Add <strong>"{confirmAdd.name}"</strong> under{' '}
                    <span style={{ color: DEPT_COLORS[confirmAdd.dept].dot }}>{confirmAdd.dept}</span>?</>
                }
                confirmLabel="Yes, Add"
                confirmColor="#5b50d6"
                onConfirm={confirmAndAdd}
                onCancel={() => setConfirmAdd(null)}
            />
        )}

        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-base font-bold text-gray-900 mb-1">Ministries</h2>
                <p className="text-sm text-gray-400">
                    Manage ministries per department. {totalCount} total {totalCount === 1 ? 'ministry' : 'ministries'}.
                </p>
            </div>

            {/* Department tabs */}
            <div className="flex flex-wrap gap-2">
                {DEPARTMENTS.map(dept => {
                    const dc = DEPT_COLORS[dept];
                    const isActive = activeDept === dept;
                    return (
                        <button key={dept}
                            onClick={() => { setActiveDept(dept); setAddError(''); }}
                            className="px-3 py-1.5 rounded-full text-xs font-bold transition-all border"
                            style={isActive
                                ? { background: dc.dot, color: '#fff', borderColor: dc.dot }
                                : { background: dc.bg, color: dc.text, borderColor: dc.border }
                            }>
                            {dept}
                            {ministries[dept].length > 0 && (
                                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
                                    style={isActive
                                        ? { background: 'rgba(255,255,255,0.3)', color: '#fff' }
                                        : { background: dc.border, color: dc.text }}>
                                    {ministries[dept].length}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Add new ministry */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newName}
                        onChange={e => { setNewName(e.target.value); if (addError) setAddError(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        placeholder={`New ministry under ${activeDept}...`}
                        className={`flex-1 border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                            addError ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-[#5b50d6]'
                        }`}
                    />
                    <button onClick={handleAdd}
                        className="px-4 py-2.5 text-sm font-semibold text-white rounded-xl shrink-0"
                        style={{ background: '#5b50d6' }}>
                        Add
                    </button>
                </div>
                {addError && <FieldError msg={addError} />}
                {saved && !addError && <SavedBadge />}
            </div>

            {/* Ministry list for active department */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: c.border }}>
                <div className="px-4 py-3 flex items-center justify-between"
                    style={{ background: c.bg, borderBottom: `1px solid ${c.border}` }}>
                    <p className="text-sm font-bold uppercase tracking-widest" style={{ color: c.text }}>
                        {activeDept}
                    </p>
                    <span className="text-xs font-semibold" style={{ color: c.text }}>
                        {currentList.length} {currentList.length === 1 ? 'ministry' : 'ministries'}
                    </span>
                </div>

                {currentList.length === 0 ? (
                    <div className="px-4 py-8 bg-white text-center">
                        <p className="text-sm text-gray-400">No ministries yet. Add one above.</p>
                    </div>
                ) : (
                    <div className="bg-white">
                        {currentList.map((ministry, idx) => (
                            <div key={ministry}
                                className={`flex items-center justify-between px-4 py-3 ${idx < currentList.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.dot }} />
                                    <span className="text-sm font-semibold text-gray-800">{ministry}</span>
                                </div>
                                <button
                                    onClick={() => setConfirmRemove({ name: ministry, dept: activeDept })}
                                    className="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors flex items-center gap-1"
                                >
                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                    </svg>
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
        </>
    );
}

// ─── Roles Section ────────────────────────────────────────────────────────────
const INITIAL_ROLES = [
    { name: 'Department Head', color: '#1971c2', perms: 6, workers: 1 },
    { name: 'Ministry Head',   color: '#0b9b8a', perms: 7, workers: 1 },
    { name: 'Cluster Head',    color: '#6741d9', perms: 4, workers: 3 },
    { name: 'C2S Coordinator', color: '#5b50d6', perms: 5, workers: 6 },
    { name: 'Mentor',          color: '#5b50d6', perms: 2, workers: 9 },
];

function RolesSection({ onSave, saved }: { onSave: () => void; saved: boolean }) {
    const [roles, setRoles]         = useState(INITIAL_ROLES);
    const [newRoleName, setNewRoleName] = useState('');
    const [addError, setAddError]   = useState('');
    const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

    function handleAdd() {
        const trimmed = newRoleName.trim();
        if (!trimmed) { setAddError('Role name cannot be empty.'); return; }
        if (roles.some(r => r.name.toLowerCase() === trimmed.toLowerCase())) {
            setAddError(`"${trimmed}" already exists.`); return;
        }
        const colors = ['#0b9b8a','#6741d9','#e67700','#1971c2','#5b50d6'];
        setRoles(prev => [...prev, {
            name: trimmed, color: colors[prev.length % colors.length], perms: 0, workers: 0,
        }]);
        setNewRoleName(''); setAddError('');
        onSave();
    }

    function confirmDeleteRole() {
        if (!confirmRemove) return;
        setRoles(prev => prev.filter(r => r.name !== confirmRemove));
        setConfirmRemove(null);
        onSave();
    }

    return (
        <>
        {confirmRemove && (
            <ConfirmDialog
                title="Remove Role?"
                message={<>Remove role <strong>"{confirmRemove}"</strong>?</>}
                warning="Workers assigned this role will lose their permissions until reassigned."
                onConfirm={confirmDeleteRole}
                onCancel={() => setConfirmRemove(null)}
            />
        )}
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-base font-bold text-gray-900 mb-1">Roles</h2>
                <p className="text-sm text-gray-400">Add and manage custom roles. New roles appear in Permissions for configuration.</p>
            </div>

            <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newRoleName}
                        onChange={e => { setNewRoleName(e.target.value); if (addError) setAddError(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        placeholder="New role name (e.g. Zone Leader)..."
                        className={`flex-1 border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${addError ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-[#5b50d6]'}`}
                    />
                    <button onClick={handleAdd} className="px-4 py-2.5 text-sm font-semibold text-white rounded-xl shrink-0" style={{ background: '#5b50d6' }}>
                        Add Role
                    </button>
                </div>
                {addError ? <FieldError msg={addError} /> : saved && <SavedBadge />}
            </div>

            <div className="flex flex-col gap-3">
                {roles.map(role => (
                    <div key={role.name} className="flex items-center justify-between p-4 rounded-xl border border-gray-100" style={{ background: 'var(--bg-subtle)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: role.color + '20' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill={role.color}><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">{role.name}</p>
                                <p className="text-xs text-gray-400">{role.perms} permissions · {role.workers} worker{role.workers !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: role.color + '20', color: role.color }}>Active</span>
                            <button className="text-xs text-[#5b50d6] hover:underline font-semibold">Edit Permissions</button>
                            <button
                                onClick={() => setConfirmRemove(role.name)}
                                className="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors flex items-center gap-1"
                            >
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        </>
    );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab({ initialSection }: { initialSection?: 'c2s_config' | 'otp' | 'notifications' | 'capacity' | 'labels' | 'rbac' | 'subdivisions' | 'barangays' | 'roles' | 'ministries' }) {
    const [activeSection, setActiveSection] = useState<'c2s_config' | 'otp' | 'notifications' | 'capacity' | 'labels' | 'rbac' | 'subdivisions' | 'barangays' | 'roles' | 'ministries'>(initialSection ?? 'c2s_config');

    // Local state for settings forms
    const [otpExpiry, setOtpExpiry] = useState(10);
    const [otpLength, setOtpLength] = useState(6);
    const [otpEnabled, setOtpEnabled] = useState(true);
    const [notifEmail, setNotifEmail]   = useState(true);
    const [notifInApp, setNotifInApp]   = useState(true);
    const [notifWorkerID, setNotifWorkerID] = useState(true);
    const [notifAssignment, setNotifAssignment] = useState(true);
    const [notifCapacity, setNotifCapacity] = useState(true);
    const [capacityConfigs, setCapacityConfigs] = useState(GROUP_CAPACITY_CONFIGS);
    const [saved, setSaved] = useState(false);

    function handleSave() {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }

    const sections = [
        { key: 'c2s_config',    label: 'C2S Configuration' },
        { key: 'otp',           label: 'OTP Settings' },
        { key: 'notifications', label: 'Notification Settings' },
        { key: 'capacity',      label: 'Group Capacity' },
        { key: 'labels',        label: 'Status / Labels' },
        { key: 'rbac',          label: 'Permissions' },
        { key: 'subdivisions',  label: 'Subdivisions' },
        { key: 'barangays',     label: 'Barangays' },
        { key: 'roles',         label: 'Roles' },
        { key: 'ministries',    label: 'Ministries' },
    ] as const;

    return (
        <div>
            <SectionHeader title="System Settings" sub="Configure C2S system behavior, OTP, notifications, and group rules." />
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left nav */}
                <aside className="lg:w-52 shrink-0 flex flex-col gap-1">
                    {sections.map(s => (
                        <button key={s.key} onClick={() => setActiveSection(s.key)}
                            className={`text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${activeSection === s.key ? 'bg-[#5b50d6] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                            {s.label}
                        </button>
                    ))}
                </aside>

                {/* Right panel */}
                <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

                    {activeSection === 'c2s_config' && (
                        <div className="flex flex-col gap-6">
                            <div>
                                <h2 className="text-base font-bold text-gray-900 mb-1">C2S Configuration</h2>
                                <p className="text-sm text-gray-400">Core settings for the Connect2Souls system.</p>
                            </div>
                            {[
                                { label: 'Ministry Name',         value: 'Connect2Souls Outreach Ministry',          type: 'text' },
                                { label: 'Church Name',           value: 'Church of God Dasmariñas',                 type: 'text' },
                                { label: 'Default Group Type',    value: 'Community-based',                          type: 'select', options: ['Community-based', 'Church-based'] },
                                { label: 'Max Preferred Groups',  value: '2',                                        type: 'number' },
                                { label: 'Mentee Interview Req.', value: 'Required before acceptance',               type: 'text' },
                            ].map(f => (
                                <div key={f.label} className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-gray-700">{f.label}</label>
                                    {f.type === 'select' ? (
                                        <select defaultValue={f.value} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b50d6] bg-white">
                                            {f.options?.map(o => <option key={o}>{o}</option>)}
                                        </select>
                                    ) : (
                                        <input type={f.type} defaultValue={f.value}
                                            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b50d6]" />
                                    )}
                                </div>
                            ))}
                            <button onClick={handleSave} className="w-full text-sm font-semibold text-white py-3 rounded-xl transition-colors" style={{ background: saved ? '#22c55e' : '#5b50d6' }}>
                                {saved ? '✓ Saved!' : 'Save Configuration'}
                            </button>
                        </div>
                    )}

                    {activeSection === 'otp' && (
                        <div className="flex flex-col gap-6">
                            <div>
                                <h2 className="text-base font-bold text-gray-900 mb-1">OTP Settings</h2>
                                <p className="text-sm text-gray-400">Configure one-time password behavior for worker access.</p>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100" style={{ background: 'var(--bg-subtle)' }}>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">OTP Authentication</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Require OTP on worker login</p>
                                </div>
                                <button onClick={() => setOtpEnabled(!otpEnabled)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${otpEnabled ? 'bg-[#5b50d6]' : 'bg-gray-300'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-transform ${otpEnabled ? 'translate-x-6' : 'translate-x-0.5'}`}/>
                                </button>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">OTP Expiry (minutes)</label>
                                <div className="flex items-center gap-3">
                                    <input type="number" value={otpExpiry} min={1} max={60} onChange={e => setOtpExpiry(Number(e.target.value))}
                                        className="w-24 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b50d6]" />
                                    <span className="text-sm text-gray-400">minutes until OTP expires</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">OTP Length</label>
                                <div className="flex gap-2">
                                    {[4, 6, 8].map(n => (
                                        <button key={n} onClick={() => setOtpLength(n)}
                                            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${otpLength === n ? 'bg-[#5b50d6] text-white border-[#5b50d6]' : 'bg-white text-gray-500 border-gray-200'}`}>
                                            {n} digits
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">Delivery Method</label>
                                <div className="flex gap-2">
                                    {['SMS', 'Email', 'Both'].map(m => (
                                        <button key={m} className="px-4 py-2 rounded-xl text-sm font-semibold border bg-white text-gray-500 border-gray-200 hover:border-[#5b50d6] hover:text-[#5b50d6] transition-colors">
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button onClick={handleSave} className="w-full text-sm font-semibold text-white py-3 rounded-xl transition-colors" style={{ background: saved ? '#22c55e' : '#5b50d6' }}>
                                {saved ? '✓ Saved!' : 'Save OTP Settings'}
                            </button>
                        </div>
                    )}

                    {activeSection === 'notifications' && (
                        <div className="flex flex-col gap-6">
                            <div>
                                <h2 className="text-base font-bold text-gray-900 mb-1">Notification Settings</h2>
                                <p className="text-sm text-gray-400">Control when and how the system sends alerts.</p>
                            </div>
                            {/* Channels */}
                            <div>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Channels</p>
                                <div className="flex flex-col gap-3">
                                    {[
                                        { label: 'Email Notifications',  value: notifEmail,   setter: setNotifEmail },
                                        { label: 'In-App Notifications', value: notifInApp,   setter: setNotifInApp },
                                    ].map(c => (
                                        <div key={c.label} className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100" style={{ background: 'var(--bg-subtle)' }}>
                                            <p className="text-sm font-semibold text-gray-800">{c.label}</p>
                                            <button onClick={() => c.setter(!c.value)}
                                                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${c.value ? 'bg-[#5b50d6]' : 'bg-gray-300'}`}>
                                                <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-transform ${c.value ? 'translate-x-6' : 'translate-x-0.5'}`}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Events */}
                            <div>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Notify on Events</p>
                                <div className="flex flex-col gap-3">
                                    {[
                                        { label: 'Worker ID Requests',  desc: 'When a worker submits a Worker ID request',   value: notifWorkerID,   setter: setNotifWorkerID },
                                        { label: 'Mentee Assignments',  desc: 'When a mentee is assigned to a mentor',       value: notifAssignment, setter: setNotifAssignment },
                                        { label: 'Capacity Alerts',     desc: 'When a group reaches 90% or 100% capacity',  value: notifCapacity,   setter: setNotifCapacity },
                                    ].map(e => (
                                        <div key={e.label} className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100" style={{ background: 'var(--bg-subtle)' }}>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">{e.label}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{e.desc}</p>
                                            </div>
                                            <button onClick={() => e.setter(!e.value)}
                                                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ml-4 ${e.value ? 'bg-[#5b50d6]' : 'bg-gray-300'}`}>
                                                <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-transform ${e.value ? 'translate-x-6' : 'translate-x-0.5'}`}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button onClick={handleSave} className="w-full text-sm font-semibold text-white py-3 rounded-xl transition-colors" style={{ background: saved ? '#22c55e' : '#5b50d6' }}>
                                {saved ? '✓ Saved!' : 'Save Notification Settings'}
                            </button>
                        </div>
                    )}

                    {activeSection === 'capacity' && (
                        <div className="flex flex-col gap-6">
                            <div>
                                <h2 className="text-base font-bold text-gray-900 mb-1">Group Capacity Settings</h2>
                                <p className="text-sm text-gray-400">Define default and hard-maximum capacities per group type.</p>
                            </div>
                            <div className="flex flex-col gap-4">
                                {capacityConfigs.map((cfg, i) => (
                                    <div key={cfg.id} className="p-4 rounded-xl border border-gray-100" style={{ background: 'var(--bg-subtle)' }}>
                                        <p className="text-sm font-bold text-gray-900 mb-3">{cfg.label}</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {[
                                                { label: 'Min',      field: 'defaultMin' as const },
                                                { label: 'Default',  field: 'defaultMax' as const },
                                                { label: 'Hard Max', field: 'hardMax' as const },
                                            ].map(f => (
                                                <div key={f.label} className="flex flex-col gap-1">
                                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{f.label}</label>
                                                    <input type="number" value={cfg[f.field]} min={1}
                                                        onChange={e => {
                                                            const updated = [...capacityConfigs];
                                                            updated[i] = { ...cfg, [f.field]: Number(e.target.value) };
                                                            setCapacityConfigs(updated);
                                                        }}
                                                        className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b50d6]" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleSave} className="w-full text-sm font-semibold text-white py-3 rounded-xl transition-colors" style={{ background: saved ? '#22c55e' : '#5b50d6' }}>
                                {saved ? '✓ Saved!' : 'Save Capacity Settings'}
                            </button>
                        </div>
                    )}

                    {activeSection === 'labels' && (
                        <div className="flex flex-col gap-6">
                            <div>
                                <h2 className="text-base font-bold text-gray-900 mb-1">Status / Label Settings</h2>
                                <p className="text-sm text-gray-400">Customize status labels used across the C2S system.</p>
                            </div>
                            {[
                                {
                                    category: 'Potential Mentee Statuses',
                                    items: ['New', 'Waiting for Assignment', 'Assigned to Mentor', 'Interview Scheduled', 'Accepted'],
                                },
                                {
                                    category: 'Group Statuses',
                                    items: ['Open', 'Full', 'Closed'],
                                },
                                {
                                    category: 'Worker Statuses',
                                    items: ['Active', 'Inactive'],
                                },
                                {
                                    category: 'Home Group Application Statuses',
                                    items: ['Pending', 'Approved', 'Recommended', 'Rejected'],
                                },
                            ].map(cat => (
                                <div key={cat.category}>
                                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">{cat.category}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {cat.items.map(item => (
                                            <div key={item} className="flex items-center gap-2 border border-gray-100 rounded-xl px-3 py-2" style={{ background: 'var(--bg-subtle)' }}>
                                                <span className="text-sm font-semibold text-gray-800">{item}</span>
                                                <button className="text-gray-300 hover:text-gray-500 transition-colors">
                                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                                                </button>
                                            </div>
                                        ))}
                                        <button className="flex items-center gap-1 bg-white border border-dashed border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-400 hover:border-[#5b50d6] hover:text-[#5b50d6] transition-colors">
                                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                                            Add
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={handleSave} className="w-full text-sm font-semibold text-white py-3 rounded-xl transition-colors" style={{ background: saved ? '#22c55e' : '#5b50d6' }}>
                                {saved ? '✓ Saved!' : 'Save Label Settings'}
                            </button>
                        </div>
                    )}

                    {activeSection === 'rbac' && (
                        <div className="flex flex-col gap-6">
                            <div>
                                <h2 className="text-base font-bold text-gray-900 mb-1">Permissions</h2>
                                <p className="text-sm text-gray-400">Role templates and the full permission matrix for all C2S roles.</p>
                            </div>

                            {/* Role Templates */}
                            <div>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Role Templates</p>
                                <div className="flex flex-col gap-3">
                                    {ROLE_TEMPLATES.map(rt => (
                                        <RoleTemplateRow key={rt.id} rt={rt} />
                                    ))}
                                </div>
                            </div>

                            {/* Full permission matrix */}
                            <div>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">All Permissions</p>
                                {[...new Set(C2S_PERMISSIONS.map(p => p.group))].map(group => (
                                    <div key={group} className="mb-4">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">{group}</p>
                                        <div className="rounded-xl border border-gray-100 overflow-hidden">
                                            {C2S_PERMISSIONS.filter(p => p.group === group).map((p, i, arr) => (
                                                <div key={p.key} className={`flex items-center justify-between px-4 py-2.5 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                                    <div>
                                                        <p className="text-xs font-mono font-semibold text-gray-800">{p.label}</p>
                                                        <p className="text-xs text-gray-400">{p.description}</p>
                                                    </div>
                                                    <div className="flex gap-1 ml-3 flex-wrap justify-end">
                                                        {ROLE_TEMPLATES.filter(rt => rt.permissions.includes(p.key)).map(rt => (
                                                            <span key={rt.id} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: rt.color + '18', color: rt.color }}>
                                                                {rt.name.split(' ')[0]}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection === 'subdivisions' && (
                        <SubdivisionsSection onSave={handleSave} saved={saved} />
                    )}

                    {activeSection === 'barangays' && (
                        <BarangaysSection onSave={handleSave} saved={saved} />
                    )}

                    {activeSection === 'ministries' && (
                        <MinistriesSection onSave={handleSave} saved={saved} />
                    )}

                    {activeSection === 'roles' && (
                        <RolesSection onSave={handleSave} saved={saved} />
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main AdminDashboard Component ───────────────────────────────────────────
export default function AdminDashboard() {
    const [activeNav, setActiveNav] = useState<AdminNav>('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const unreadNotifs  = ADMIN_NOTIFICATIONS.filter(n => !n.read).length;
    const pendingWorkerID = ADMIN_WORKERS.filter(w => w.workerIdStatus === 'Pending').length;
    const criticalAudit = AUDIT_LOGS.filter(l => l.severity === 'critical').length;

    // Group nav items by section
    const sections = [...new Set(ADMIN_NAV.map(n => n.section).filter(Boolean))] as string[];

    function getBadge(key: AdminNav): number | undefined {
        if (key === 'notifications') return unreadNotifs || undefined;
        if (key === 'workers')       return pendingWorkerID || undefined;
        if (key === 'audit')         return criticalAudit || undefined;
        return undefined;
    }

    return (
        <div className="min-h-screen dashboard-shell" style={{ background: 'var(--bg-page)' }}>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-[1001] bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* ── Left Sidebar ── */}
            <aside className={`sidebar-nav w-60 border-r flex flex-col pt-4 pb-4 fixed top-16 bottom-0 left-0 z-[1002] transition-transform duration-200
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

                {/* Admin badge */}
                <div className="mx-4 mb-4 px-3 py-2 rounded-xl flex items-center gap-2.5" style={{ background: 'var(--bg-subtle)' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: '#6366c1' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                    </div>
                    <div className="leading-tight">
                        <p className="text-[10px] font-black text-[#6366c1] uppercase tracking-widest">C2S Admin</p>
                        <p className="text-[9px] text-[#4f52a3]">Full system access</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3">
                    {sections.map((section, si) => {
                        const items = ADMIN_NAV.filter(n => n.section === section);
                        return (
                            <div key={section} className={si > 0 ? 'mt-4' : ''}>
                                <p className="px-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{section}</p>
                                <div className="flex flex-col gap-0.5">
                                    {items.map(item => {
                                        const badge = getBadge(item.key);
                                        const isActive = activeNav === item.key;
                                        return (
                                            <button key={item.key}
                                                onClick={() => { setActiveNav(item.key); setSidebarOpen(false); }}
                                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full text-left ${isActive ? 'nav-item-active text-gray-800 shadow-sm' : 'text-gray-500 hover:bg-white/60 dark:hover:bg-white/10'}`}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill={isActive ? '#5b50d6' : '#aaa'}>
                                                    <path d={item.icon}/>
                                                </svg>
                                                <span className="flex-1 truncate text-[13px]">{item.label}</span>
                                                {badge !== undefined && badge > 0 && (
                                                    <span className="text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full shrink-0 px-1"
                                                        style={{ background: '#dde0f5', color: '#6366c1' }}>
                                                        {badge}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
                {/* My Settings at bottom */}
                <div className="px-3 pt-3 border-t border-gray-100 mx-1 mt-2">
                    <button
                        onClick={() => { setShowSettings(true); setSidebarOpen(false); }}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors w-full text-left text-gray-500 hover:bg-white/60 dark:hover:bg-white/10"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#aaa">
                            <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87a.47.47 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.47.47 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.37 1.04.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 0 0-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                        </svg>
                        My Settings
                    </button>
                </div>
            </aside>
            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

            {/* ── Main Content ── */}
            <div className="md:ml-60 pb-16 min-w-0">

                {/* Mobile sticky top bar */}
                <div className="md:hidden fixed top-16 left-0 right-0 z-20 mobile-menu-bar px-4 py-2.5 flex items-center gap-2">
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
                        {ADMIN_NAV.find(n => n.key === activeNav)?.label ?? 'Dashboard'}
                    </span>
                </div>

                <div className="pt-[72px] md:pt-5 px-4 sm:px-6">
                    {activeNav === 'dashboard'         && <DashboardTab />}
                    {activeNav === 'org'               && <OrgStructureTab />}
                    {activeNav === 'workers'           && <WorkersTab />}
                    {activeNav === 'groups'            && <GroupsTab />}
                    {activeNav === 'potential_mentees' && <PotentialMenteesTab />}
                    {activeNav === 'active_mentees'    && <ActiveMenteesTab />}
                    {activeNav === 'c2s_home'          && <C2SHomeTab />}
                    {activeNav === 'reports'           && <ReportsTab />}
                    {activeNav === 'notifications'     && <NotificationsTab />}
                    {activeNav === 'audit'             && <AuditLogsTab />}
                    {(activeNav === 'settings' || activeNav === 'rbac') && <SettingsTab initialSection={activeNav === 'rbac' ? 'rbac' : undefined} />}
                </div>
            </div>
        </div>
    );
}
