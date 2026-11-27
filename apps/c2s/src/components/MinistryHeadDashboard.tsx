'use client';

import CustomSelect from '@/components/CustomSelect';
import ActionMenu, { ActionIcons } from '@/components/ActionMenu';
import { WorkerSinceValue } from '@/components/WorkerIdentityBits';
import { useEffect, useState } from 'react';
import {
    MH_CLUSTERS, MH_COORDINATORS, MH_ALL_MENTORS, MH_POTENTIAL_MENTEES,
    MH_ACTIVE_MENTEES_LIST, MH_NOTIFICATIONS,
    type OutreachCluster,
} from '@/lib/data';
import { SharedDashboardTab, CHURCH_WIDE_DATA } from '@/components/DashboardSharedWidgets';
import DashboardWelcomeBanner from '@/components/DashboardWelcomeBanner';
import ClusterMap, { DASMARIÑAS_GROUPS, type ClusterMapGroup } from './ClusterMap';
import { SidebarCollapseButton, SidebarNavList, SidebarSettingsDropdown, SettingsPageView, useScrollToTop, type MySettingsSection, type SidebarNavEntry } from '@/components/SettingsModal';
import { SidebarBrandHeader, DashboardTopHeader } from '@/components/DashboardHeader';
import { exportToCsv } from '@/lib/export-csv';
import {
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
    PieChart, Pie, Cell, Tooltip, Legend, CartesianGrid, XAxis, YAxis,
} from 'recharts';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#D97706', '#D97706', '#0284C7', '#e67700', '#D97706', '#1971c2'];
function avatarColor(id: string) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
const STATUS_STYLE: Record<string, string> = {
    'New': 'bg-[#1d4ed8] text-white',
    'Waiting for Assignment': 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]',
    'Assigned to Mentor': 'bg-[#D97706] text-white',
    'Interview Scheduled': 'bg-[#D97706] text-white',
    'Interview Completed': 'bg-[#0284C7] text-white',
    'Accepted': 'bg-[#166534] text-white',
};
const TOOLTIP_STYLE = {
    borderRadius: '10px', border: 'none',
    boxShadow: '0 4px 16px rgba(0,0,0,0.10)', fontSize: '12px', padding: '8px 14px',
};

// ─── Nav definition ────────────────────────────────────────────────────────────
type NavKey =
    | 'dashboard'
    | 'clusters'
    | 'coordinators'
    | 'mentors'
    | 'potential'
    | 'mentees'
    | 'reports_monthly'
    | 'reports_quarterly'
    | 'reports_annual'
    | 'reports_coordinator'
    | 'reports_cluster'
    | 'reports_mentor'
    | 'reports_community'
    | 'reports_maps'
    | 'notifications';

const MH_NAV: { key: NavKey; label: string; icon: string; iconKind?: 'fill' | 'stroke' }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zm-2-4H10v-2h8v2zm-4 4H10v-2h4v2zm4-8H10V6h8v2z' },
    { key: 'notifications', label: 'Notifications', icon: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z' },
    { key: 'clusters', label: 'Clusters', icon: 'M20 6h-2.18c.07-.44.18-.86.18-1a3 3 0 1 0-6 0c0 .14.11.56.18 1H6c-1.11 0-2 .9-2 2v11c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-8-3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm2 16H6v-2h8v2zm6-4H6v-6h14v6z' },
    { key: 'coordinators', label: 'C2S Coordinators', icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
    { key: 'mentors', label: 'Mentors', icon: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z' },
    { key: 'potential', label: 'Potential Mentees', icon: 'M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
    { key: 'mentees', label: 'Active Mentees', icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
    { key: 'reports_monthly', label: 'Monthly', iconKind: 'stroke', icon: 'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' },
    { key: 'reports_quarterly', label: 'Quarterly', iconKind: 'stroke', icon: 'M3 3v18h18 M7 16v-4 M12 16V8 M17 16v-6' },
    { key: 'reports_annual', label: 'Annual', iconKind: 'stroke', icon: 'M3 17l6-6 4 4 8-8 M17 7h4v4' },
    { key: 'reports_coordinator', label: 'Per Coordinator', iconKind: 'stroke', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75' },
    { key: 'reports_cluster', label: 'Per Cluster', iconKind: 'stroke', icon: 'M3 7l9-4 9 4-9 4-9-4z M3 12l9 4 9-4 M3 17l9 4 9-4' },
    { key: 'reports_mentor', label: 'Per Mentor', iconKind: 'stroke', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
    { key: 'reports_community', label: 'Community Outreach', iconKind: 'stroke', icon: 'M3 21h18 M5 21V7l7-4 7 4v14 M9 21v-6h6v6' },
    { key: 'reports_maps', label: 'Interactive Maps', iconKind: 'stroke', icon: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z M9 3v15 M15 6v15' },
];

// ─── Dashboard Notifications panel ───────────────────────────────────────────
function MHDashboardNotifications() {
    const [notifs, setNotifs] = useState(MH_NOTIFICATIONS);
    const unread = notifs.filter(n => !n.read).length;
    const NOTIF_ICON: Record<string, { bg: string; dot: string }> = {
        worker: { bg: '#FEF3C7', dot: '#D97706' },
        worker_id: { bg: '#FEF3C7', dot: '#D97706' },
        coordinator: { bg: '#FEF3C7', dot: '#0284C7' },
        mentor: { bg: '#fef3c7', dot: '#e67700' },
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
                    const ic = NOTIF_ICON[n.type] ?? { bg: '#f3f4f6', dot: '#9ca3af' };
                    return (
                        <div key={n.id} onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                            className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition-colors hover:bg-gray-50 ${!n.read ? 'bg-[#FEF3C7]' : ''}`}>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: ic.bg }}>
                                <div className="w-3 h-3 rounded-full" style={{ background: ic.dot }} />
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

function DashboardTab() {
    return (
        <div>
            <DashboardWelcomeBanner fallbackRole="ministry_head" />
            <SharedDashboardTab data={CHURCH_WIDE_DATA} hideWorkers showChurchInKmi />
        </div>
    );
}


// ─── Clusters Tab ─────────────────────────────────────────────────────────────
function MentorProfileView({
    mentor,
    cluster,
    onBack,
    onClose,
}: {
    mentor: typeof MH_ALL_MENTORS[0];
    cluster: OutreachCluster;
    onBack: () => void;
    onClose: () => void;
}) {
    const mentees = MH_ACTIVE_MENTEES_LIST.filter(m => m.mentor === mentor.name);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') onBack();
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onBack]);

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm" onClick={onClose} />
            {/* Modal */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="c2s-mentor-modal-title"
                className="fixed inset-0 z-[9999] flex flex-col p-4 sm:p-6 overflow-y-auto scrollbar-none"
                onClick={onClose}
            >
                <div
                    className="relative w-full mx-auto my-auto bg-white dark:bg-[#1A2026] border border-[#E2E8E5] dark:border-[#2A323D] shadow-2xl flex flex-col"
                    style={{ maxWidth: '720px', borderRadius: '1.5rem', padding: '1.5rem' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Top Navigation Bar: Back to Cluster (left) + Close × (right) */}
                    <div className="flex items-center justify-between gap-4 pb-3">
                        <button
                            type="button"
                            onClick={onBack}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#181F26] dark:text-[#9BA7B4] dark:hover:text-[#E6EDF3] transition-colors cursor-pointer"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <line x1="19" y1="12" x2="5" y2="12" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                            <span>Back to {cluster.name}</span>
                        </button>
                        <button
                            type="button"
                            data-confirm-modal-btn="true"
                            aria-label="Close"
                            onClick={onClose}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-slate-100 dark:hover:bg-[#222933] transition-colors shrink-0 cursor-pointer"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* Profile Header with 44x44 Initials Avatar & Role Badge */}
                    <div className="flex items-center gap-3.5 pb-4">
                        <div className="w-11 h-11 rounded-full bg-[#181F26] dark:bg-[#2A323D] text-white flex items-center justify-center text-sm font-black shrink-0">
                            {mentor.initials}
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 id="c2s-mentor-modal-title" className="text-xl font-bold text-[#181F26] dark:text-[#E6EDF3] leading-tight">
                                    {mentor.name}
                                </h2>
                                <span
                                    data-pill="true"
                                    className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[rgba(14,91,82,0.10)] text-[#0E5B52] dark:bg-[rgba(42,157,143,0.16)] dark:text-[#5EEAD4]"
                                >
                                    Mentor
                                </span>
                            </div>
                            <p className="text-xs text-[#64748B] dark:text-[#9BA7B4] mt-0.5">
                                Outreach · {cluster.name} · <span className="font-bold text-[#181F26] dark:text-[#E6EDF3] tabular-nums">{mentor.workerId}</span>
                            </p>
                        </div>
                    </div>

                    {/* 3×2 Summary Info Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pb-4">
                        <div
                            className="border border-[#E2E8E5] dark:border-[#2A323D] bg-[#F8FAFC] dark:bg-[#222933] px-3.5 py-2.5"
                            style={{ borderRadius: '0.75rem' }}
                        >
                            <p className="text-[11px] text-[#64748B] dark:text-[#9BA7B4] mb-1">Worker ID</p>
                            <p className="text-sm font-bold text-[#181F26] dark:text-[#E6EDF3] tabular-nums truncate">{mentor.workerId}</p>
                        </div>
                        <div
                            className="border border-[#E2E8E5] dark:border-[#2A323D] bg-[#F8FAFC] dark:bg-[#222933] px-3.5 py-2.5"
                            style={{ borderRadius: '0.75rem' }}
                        >
                            <p className="text-[11px] text-[#64748B] dark:text-[#9BA7B4] mb-1">Worker Since (ID Issued)</p>
                            <WorkerSinceValue createdAt={mentor.workerIdCreatedAt} className="text-sm" />
                        </div>
                        {[
                            { label: 'Contact', value: mentor.phone, isStatus: false },
                            { label: 'Cluster', value: cluster.name, isStatus: false },
                            { label: 'Active Mentees', value: String(mentees.length), isStatus: false },
                            { label: 'Status', value: mentor.status, isStatus: true },
                        ].map((f) => (
                            <div
                                key={f.label}
                                className="border border-[#E2E8E5] dark:border-[#2A323D] bg-[#F8FAFC] dark:bg-[#222933] px-3.5 py-2.5"
                                style={{ borderRadius: '0.75rem' }}
                            >
                                <p className="text-[11px] text-[#64748B] dark:text-[#9BA7B4] mb-1">{f.label}</p>
                                {f.isStatus ? (
                                    <span
                                        data-pill="true"
                                        className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${f.value === 'Active'
                                            ? 'bg-[rgba(14,91,82,0.10)] text-[#0E5B52] dark:bg-[rgba(42,157,143,0.16)] dark:text-[#5EEAD4]'
                                            : 'bg-[#F1F5F9] text-[#64748B] dark:bg-[#1A2026] dark:text-[#9BA7B4]'
                                            }`}
                                    >
                                        {f.value}
                                    </span>
                                ) : (
                                    <p className="text-sm font-bold text-[#181F26] dark:text-[#E6EDF3] truncate">{f.value}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* My Mentees */}
                    <div>
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#9BA7B4] mb-2">
                            My Mentees ({mentees.length})
                        </h3>
                        {mentees.length === 0 ? (
                            <p className="text-xs text-[#64748B] dark:text-[#9BA7B4] bg-[#F8FAFC] dark:bg-[#222933] border border-[#E2E8E5] dark:border-[#2A323D] rounded-lg px-3 py-2.5">
                                No active mentees assigned.
                            </p>
                        ) : (
                            <div className="rounded-xl border border-[#E2E8E5] dark:border-[#2A323D] overflow-x-auto">
                                <table className="w-full table-fixed">
                                    <colgroup>
                                        <col className="w-[36%]" />
                                        <col className="w-[32%]" />
                                        <col className="w-[32%]" />
                                    </colgroup>
                                    <thead>
                                        <tr className="table-header-row">
                                            <th className="text-left">Name</th>
                                            <th className="text-left">Module</th>
                                            <th className="text-left">Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mentees.map((mt) => (
                                            <tr key={mt.id}>
                                                <td className="font-bold text-[#181F26] dark:text-[#E6EDF3] text-left">{mt.name}</td>
                                                <td className="text-[#64748B] dark:text-[#9BA7B4] text-left">{mt.module}</td>
                                                <td className="text-left">
                                                    <div className="flex items-center justify-start gap-2">
                                                        <div className="flex-1 bg-slate-100 dark:bg-[#2A323D] rounded-full h-1.5 min-w-0">
                                                            <div className="h-1.5 rounded-full bg-[#0E5B52] dark:bg-[#2A9D8F]" style={{ width: `${mt.progress}%` }} />
                                                        </div>
                                                        <span className="text-xs font-semibold text-[#181F26] dark:text-[#E6EDF3] tabular-nums shrink-0">{mt.progress}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

function ClusterDetailModal({ cluster, onClose }: { cluster: OutreachCluster; onClose: () => void }) {
    const [viewingMentor, setViewingMentor] = useState<typeof MH_ALL_MENTORS[0] | null>(null);
    const mentors = MH_ALL_MENTORS.filter(m => m.cluster === cluster.name);
    const clusterGroups = DASMARIÑAS_GROUPS.filter(g => cluster.barangays.includes(g.barangay));

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape' && !viewingMentor) {
                onClose();
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, viewingMentor]);

    if (viewingMentor) {
        return (
            <MentorProfileView
                mentor={viewingMentor}
                cluster={cluster}
                onBack={() => setViewingMentor(null)}
                onClose={onClose}
            />
        );
    }

    return (
        <>

            <div
                className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="c2s-cluster-modal-title"
                className="fixed inset-0 z-[9999] flex flex-col p-4 sm:p-6 overflow-y-auto scrollbar-none"
                onClick={onClose}
            >
                <div
                    className="relative w-full mx-auto my-auto bg-white dark:bg-[#1A2026] border border-[#E2E8E5] dark:border-[#2A323D] shadow-2xl flex flex-col"
                    style={{ maxWidth: '900px', borderRadius: '1.5rem', padding: '1.5rem' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Top-right Close (×) Button */}
                    <button
                        type="button"
                        data-confirm-modal-btn="true"
                        aria-label="Close"
                        onClick={onClose}
                        className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-slate-100 dark:hover:bg-[#222933] transition-colors cursor-pointer"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>

                    {/* Body */}
                    <div className="space-y-3.5">
                        {/* Header */}
                        <div className="pr-8">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2
                                    id="c2s-cluster-modal-title"
                                    className="text-xl font-bold text-[#181F26] dark:text-[#E6EDF3] leading-tight"
                                >
                                    {cluster.name}
                                </h2>
                                <span
                                    data-pill="true"
                                    className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F8FAFC] dark:bg-[#222933] text-[#475569] dark:text-[#9BA7B4] border border-[#E2E8E5] dark:border-[#2A323D]"
                                >
                                    {cluster.barangays.length} Barangay{cluster.barangays.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <p className="text-xs text-[#64748B] dark:text-[#9BA7B4] mt-0.5">
                                Outreach Ministry Cluster Overview &amp; Directory
                            </p>
                        </div>

                        {/* Top Row: Leadership + 3-Column Stat Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                            {/* Cluster Head & C2S Coordinator */}
                            <div className="md:col-span-7 rounded-2xl bg-[#F8FAFC] dark:bg-[#222933] border border-[#E2E8E5] dark:border-[#2A323D] p-3 space-y-2 flex flex-col justify-center">
                                <div className="flex items-center justify-between gap-2.5">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-7 h-7 rounded-full bg-[#181F26] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                                            {cluster.clusterHeadInitials}
                                        </div>
                                        <p className="text-xs font-semibold text-[#181F26] dark:text-[#E6EDF3] truncate">{cluster.clusterHead}</p>
                                    </div>
                                    <span
                                        data-pill="true"
                                        className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-[#1A2026] text-[#181F26] dark:text-[#E6EDF3] border border-[#E2E8E5] dark:border-[#2A323D] whitespace-nowrap shrink-0"
                                    >
                                        Cluster Head
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-2.5">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-7 h-7 rounded-full bg-[#0E5B52] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                                            {cluster.coordinatorInitials}
                                        </div>
                                        <p className="text-xs font-semibold text-[#181F26] dark:text-[#E6EDF3] truncate">{cluster.coordinator}</p>
                                    </div>
                                    <span
                                        data-pill="true"
                                        className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-[#1A2026] text-[#0E5B52] dark:text-[#5EEAD4] border border-[#E2E8E5] dark:border-[#2A323D] whitespace-nowrap shrink-0"
                                    >
                                        C2S Coordinator
                                    </span>
                                </div>
                            </div>

                            {/* 3-Column Stat Summary Row */}
                            <div className="md:col-span-5 grid grid-cols-3 gap-2.5">
                                {[
                                    { label: 'Members', value: cluster.totalGroups },
                                    { label: 'Mentors', value: cluster.totalMentors },
                                    { label: 'Active', value: cluster.totalActiveMentees },
                                ].map((s) => (
                                    <div
                                        key={s.label}
                                        className="rounded-xl px-2 py-2.5 flex flex-col items-center justify-center text-center bg-[#F8FAFC] dark:bg-[#222933] border border-[#E2E8E5] dark:border-[#2A323D]"
                                    >
                                        <p className="text-xl font-extrabold text-[#181F26] dark:text-[#E6EDF3] leading-none">
                                            {s.value}
                                        </p>
                                        <p className="text-[11px] font-medium text-[#64748B] dark:text-[#9BA7B4] mt-1">
                                            {s.label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Assigned Barangays */}
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#9BA7B4] mb-1.5">
                                Assigned Barangays ({cluster.barangays.length})
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {cluster.barangays.map((b) => (
                                    <span
                                        key={b}
                                        data-pill="true"
                                        className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F8FAFC] dark:bg-[#222933] text-[#181F26] dark:text-[#E6EDF3] border border-[#E2E8E5] dark:border-[#2A323D]"
                                    >
                                        {b}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Two-Column Directory: Assigned Mentors & C2S Groups */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                            {/* Assigned Mentors */}
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#9BA7B4] mb-1.5">
                                    Assigned Mentors ({mentors.length})
                                </p>
                                {mentors.length === 0 ? (
                                    <p className="text-xs text-[#64748B] dark:text-[#9BA7B4] italic">No mentors currently assigned.</p>
                                ) : (
                                    <div className="rounded-xl border border-[#E2E8E5] dark:border-[#2A323D] divide-y divide-[#E2E8E5] dark:divide-[#2A323D] overflow-hidden">
                                        {mentors.map((m, idx) => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => setViewingMentor(m)}
                                                className="w-full text-left px-3.5 py-2 flex items-center justify-between gap-2 bg-white dark:bg-[#1A2026] hover:bg-[#F8FAFC] dark:hover:bg-[#222933] transition-colors cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div
                                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0 ${idx % 2 === 0 ? 'bg-[#181F26] dark:bg-[#2A323D]' : 'bg-[#0E5B52]'
                                                            }`}
                                                    >
                                                        {m.initials}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-[#181F26] dark:text-[#E6EDF3] truncate">{m.name}</p>
                                                        <p className="text-[11px] text-[#64748B] dark:text-[#9BA7B4] truncate">
                                                            {m.totalGroups} group{m.totalGroups !== 1 ? 's' : ''} · {m.activeMentees} active mentee{m.activeMentees !== 1 ? 's' : ''}
                                                        </p>
                                                        <p className="text-[0.75rem] text-[#64748B] dark:text-[#9BA7B4] whitespace-nowrap tabular-nums">
                                                            <span className="font-semibold text-[#181F26] dark:text-[#E6EDF3]">{m.workerId}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <svg
                                                    width="15"
                                                    height="15"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2.1"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    aria-hidden="true"
                                                    className="text-[#94A3B8] group-hover:text-[#181F26] dark:group-hover:text-[#E6EDF3] transition-colors shrink-0"
                                                >
                                                    <polyline points="9 18 15 12 9 6" />
                                                </svg>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* C2S Groups */}
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#9BA7B4] mb-1.5">
                                    C2S Groups ({clusterGroups.length > 0 ? clusterGroups.length : cluster.totalGroups})
                                </p>
                                {clusterGroups.length === 0 ? (
                                    <div className="rounded-xl bg-[#F8FAFC] dark:bg-[#222933] border border-[#E2E8E5] dark:border-[#2A323D] px-3.5 py-2.5 text-xs text-[#475569] dark:text-[#9BA7B4]">
                                        {cluster.communityBased} Community-based · {cluster.churchBased} Church-based group{cluster.churchBased !== 1 ? 's' : ''}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-[#E2E8E5] dark:border-[#2A323D] divide-y divide-[#E2E8E5] dark:divide-[#2A323D] overflow-hidden">
                                        {clusterGroups.map((g) => (
                                            <div key={g.id} className="px-3.5 py-2 flex items-center justify-between gap-3 bg-white dark:bg-[#1A2026]">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-[#181F26] dark:text-[#E6EDF3] truncate">{g.name}</p>
                                                    <p className="text-[11px] text-[#64748B] dark:text-[#9BA7B4] truncate">
                                                        {g.barangay} · Mentor: {g.mentor}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-[11px] font-semibold text-[#475569] dark:text-[#9BA7B4]">
                                                        {g.members}/{g.capacity}
                                                    </span>
                                                    <span
                                                        data-pill="true"
                                                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${g.status === 'Open'
                                                            ? 'bg-[rgba(14,91,82,0.10)] text-[#0E5B52] dark:bg-[rgba(42,157,143,0.16)] dark:text-[#5EEAD4]'
                                                            : 'bg-[#F1F5F9] text-[#64748B] dark:bg-[#222933] dark:text-[#9BA7B4]'
                                                            }`}
                                                    >
                                                        {g.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function ClustersTab() {
    const [viewing, setViewing] = useState<OutreachCluster | null>(null);
    const [search, setSearch] = useState('');
    const [openBarangayId, setOpenBarangayId] = useState<string | null>(null);

    useEffect(() => {
        if (!openBarangayId) return;
        const handleOutside = () => setOpenBarangayId(null);
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpenBarangayId(null);
        };
        document.addEventListener('click', handleOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('click', handleOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [openBarangayId]);

    const q = search.trim().toLowerCase();
    const filteredClusters = MH_CLUSTERS.filter((c) => {
        if (!q) return true;
        return (
            c.name.toLowerCase().includes(q) ||
            c.clusterHead.toLowerCase().includes(q) ||
            c.coordinator.toLowerCase().includes(q) ||
            c.barangays.some((b) => b.toLowerCase().includes(q))
        );
    });

    return (
        <div>
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-[1.75rem] font-extrabold tracking-[0.02em] uppercase text-gray-900 leading-tight">Clusters</h1>
                    <p className="text-sm text-gray-400 mt-1">All Outreach Clusters under the ministry.</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search cluster, leader, or barangay..."
                        className="w-full bg-white border border-[#E7E5E4] rounded-xl pl-9 pr-3.5 py-2 text-sm text-[#292524] placeholder:text-gray-400 focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#FEF3C7] transition-colors"
                    />
                </div>
            </div>

            {filteredClusters.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#E7E5E4] p-10 text-center">
                    <p className="text-sm font-semibold text-gray-700">No clusters matched your search</p>
                    <p className="text-xs text-gray-400 mt-1">Try a different cluster name, leader, or barangay.</p>
                </div>
            ) : (
                <div className="grid gap-5 items-stretch" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))' }}>
                    {filteredClusters.map((c) => {
                        const isBrgyOpen = openBarangayId === c.id;
                        return (
                            <div key={c.id} className="h-full bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between gap-4">
                                <div className="flex flex-col gap-4">
                                    {/* Top row: Cluster name + Interactive Barangay Pill + Actions */}
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">{c.name}</h3>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    aria-expanded={isBrgyOpen}
                                                    onClick={() => setOpenBarangayId((prev) => (prev === c.id ? null : c.id))}
                                                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] hover:bg-[#FDE68A]/70 whitespace-nowrap transition-colors cursor-pointer"
                                                >
                                                    <span>{c.barangays.length} Barangays</span>
                                                    <svg className={`w-3 h-3 transition-transform duration-150 ${isBrgyOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                        <polyline points="6 9 12 15 18 9" />
                                                    </svg>
                                                </button>
                                                {isBrgyOpen && (
                                                    <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl bg-white dark:bg-[#1E293B] border border-[#E7E5E4] dark:border-[#334155] p-3 shadow-lg shadow-stone-900/5 z-20">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B665F] dark:text-slate-400 mb-2">
                                                            Covered Barangays ({c.barangays.length})
                                                        </p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {c.barangays.map((b) => (
                                                                <span
                                                                    key={b}
                                                                    data-pill="true"
                                                                    className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F5F2EC] dark:bg-[#0F172A] text-[#292524] dark:text-slate-200 border border-[#E7E5E4] dark:border-[#334155]"
                                                                >
                                                                    {b}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <ActionMenu
                                                ariaLabel={`${c.name} actions`}
                                                items={[
                                                    { label: 'View Cluster', icon: ActionIcons.view, onClick: () => setViewing(c) },
                                                ]}
                                            />
                                        </div>
                                    </div>

                                    {/* Cohesive Leadership Container */}
                                    <div className="bg-[#F5F2EC] rounded-xl p-3.5 space-y-2.5 border border-[#E7E5E4]">
                                        <div className="flex items-center justify-between gap-2.5 min-w-0">
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                <div className="w-7 h-7 rounded-full bg-[#1B2432] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                                                    {c.clusterHeadInitials}
                                                </div>
                                                <p className="text-xs font-semibold text-[#292524] truncate">{c.clusterHead}</p>
                                            </div>
                                            <span
                                                data-pill="true"
                                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-[#1A2026] text-[#1B2432] dark:text-[#E6EDF3] border border-[#E7E5E4] dark:border-[#2A323D] whitespace-nowrap shrink-0"
                                            >
                                                Cluster Head
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2.5 min-w-0">
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                <div className="w-7 h-7 rounded-full bg-[#D97706] dark:!bg-[rgba(212,163,89,0.16)] text-white dark:!text-[#D4A359] dark:border dark:border-[rgba(212,163,89,0.3)] flex items-center justify-center text-[10px] font-black shrink-0">
                                                    {c.coordinatorInitials}
                                                </div>
                                                <p className="text-xs font-semibold text-[#292524] truncate">{c.coordinator}</p>
                                            </div>
                                            <span
                                                data-pill="true"
                                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] whitespace-nowrap shrink-0"
                                            >
                                                Coordinator
                                            </span>
                                        </div>
                                    </div>

                                    {/* 3-Column Metrics */}
                                    <div className="grid grid-cols-1 min-[360px]:grid-cols-3 gap-2">
                                        <div className="bg-[#F5F2EC] rounded-xl px-1.5 py-2.5 sm:p-3 text-center border border-[#E7E5E4]">
                                            <p className="text-lg font-black text-[#292524]">{c.totalGroups}</p>
                                            <p className="text-[0.75rem] font-medium text-gray-500 mt-0.5 whitespace-nowrap">Members</p>
                                        </div>
                                        <div className="bg-[#F5F2EC] rounded-xl px-1.5 py-2.5 sm:p-3 text-center border border-[#E7E5E4]">
                                            <p className="text-lg font-black text-[#292524]">{c.totalMentors}</p>
                                            <p className="text-[0.75rem] font-medium text-gray-500 mt-0.5 whitespace-nowrap">Mentors</p>
                                        </div>
                                        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl px-1.5 py-2.5 sm:p-3 text-center text-[#D97706]">
                                            <p className="text-lg font-black text-[#D97706] dark:text-[#D4A359]">{c.totalActiveMentees}</p>
                                            <p className="text-[0.75rem] font-semibold text-[#B45309] dark:text-[#D4A359] mt-0.5 whitespace-nowrap">Active</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {viewing && (
                <ClusterDetailModal cluster={viewing} onClose={() => setViewing(null)} />
            )}
        </div>
    );
}

// ─── Coordinators Tab ─────────────────────────────────────────────────────────
function CoordinatorsTab() {
    const [search, setSearch] = useState('');
    const q = search.toLowerCase();
    const filtered = MH_COORDINATORS.filter((c) => c.name.toLowerCase().includes(q) || c.cluster.toLowerCase().includes(q) || c.workerId.toLowerCase().includes(q));
    return (
        <div>
            <div className="mb-6"><h1 className="text-[1.75rem] font-extrabold tracking-[0.02em] uppercase text-gray-900 leading-tight">C2S Coordinators</h1><p className="text-sm text-gray-400 mt-1">All coordinators across the Outreach Ministry.</p></div>
            <div className="flex items-center gap-3 mb-5">
                <div className="relative flex-1 max-w-xs">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" /></svg>
                    <input type="text" placeholder="Search coordinators..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97706] w-full bg-white" />
                </div>
            </div>
            {/* Mobile cards */}
            <div className="sm:hidden bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {filtered.length === 0 && <div className="p-12 text-center"><p className="text-sm font-semibold text-gray-600">No coordinators found</p></div>}
                {filtered.map((c) => (
                    <div key={c.id} className="p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0" style={{ background: c.color }}>{c.initials}</div>
                                <span className="font-semibold text-gray-900 text-sm">{c.name}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${c.status === 'Active' ? 'bg-[#16a34a] text-white' : 'bg-gray-400 text-white'}`}>{c.status}</span>
                        </div>
                        <p className="text-xs text-gray-500">{c.cluster}</p>
                        <p className="text-xs font-bold text-[#181F26] dark:text-[#E6EDF3] tabular-nums">{c.workerId}</p>
                        <div className="flex gap-4 mt-1">
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Assigned</p>
                                <p className="font-semibold text-gray-900 text-sm">{c.assignedPotentialMentees}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Active Mentors</p>
                                <p className="font-semibold text-gray-900 text-sm">{c.activeMentors}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full table-auto text-xs">
                        <colgroup>
                            <col className="w-[22%]" />
                            <col className="w-[21%]" />
                            <col className="w-[14%]" />
                            <col className="w-[17%]" />
                            <col className="w-[13%]" />
                            <col className="w-[13%]" />
                        </colgroup>
                        <thead>
                            <tr className="table-header-row">{['Coordinator Name', 'Worker ID', 'Cluster', 'Assigned Potential Mentees', 'Active Mentors', 'Status'].map((h, idx, arr) => (<th key={h} className={`text-[12px] font-bold uppercase tracking-widest px-6 py-4 ${idx === arr.length - 1 ? 'table-col-center text-center' : 'text-left'}`}>{h}</th>))}</tr>
                        </thead>
                        <tbody>
                            {filtered.map((c) => (
                                <tr key={c.id} className="transition-colors">
                                    <td className="px-6 py-4 text-left"><div className="flex items-center justify-start gap-2.5"><div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0" style={{ background: c.color }}>{c.initials}</div><span className="font-bold text-[#181F26] dark:text-[#E6EDF3]">{c.name}</span></div></td>
                                    <td className="px-6 py-4 text-left"><span className="font-bold text-[#181F26] dark:text-[#E6EDF3] tabular-nums">{c.workerId}</span></td>
                                    <td className="px-6 py-4 text-[#64748B] dark:text-[#9BA7B4] text-left">{c.cluster}</td>
                                    <td className="px-6 py-4 text-[#64748B] dark:text-[#9BA7B4] font-semibold text-left tabular-nums">{c.assignedPotentialMentees}</td>
                                    <td className="px-6 py-4 text-[#64748B] dark:text-[#9BA7B4] font-semibold text-left tabular-nums">{c.activeMentors}</td>
                                    <td className="px-6 py-4 table-col-center text-center"><span className={`inline-flex items-center justify-center leading-none text-[10px] font-bold px-2.5 py-1 rounded-full ${c.status === 'Active' ? 'bg-[#16a34a] text-white' : 'bg-gray-400 text-white'}`}>{c.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && <div className="p-12 text-center"><p className="text-sm font-semibold text-gray-600">No coordinators found</p></div>}
            </div>
        </div>
    );
}

// ─── Mentors Tab ──────────────────────────────────────────────────────────────
function MentorsTab() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
    const q = search.toLowerCase();
    const filtered = MH_ALL_MENTORS.filter((m) => (m.name.toLowerCase().includes(q) || m.cluster.toLowerCase().includes(q) || m.workerId.toLowerCase().includes(q)) && (filter === 'All' || m.status === filter));
    return (
        <div>
            <div className="mb-6"><h1 className="text-[1.75rem] font-extrabold tracking-[0.02em] uppercase text-gray-900 leading-tight">Mentors</h1><p className="text-sm text-gray-400 mt-1">All mentors across the Outreach Ministry.</p></div>
            <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="relative w-full sm:w-64">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" /></svg>
                    <input type="text" placeholder="Search mentors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97706] w-full bg-white" />
                </div>
                <CustomSelect
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as 'All' | 'Active' | 'Inactive')}
                    className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#D97706] min-w-[130px]"
                >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </CustomSelect>
            </div>
            {/* Mobile cards */}
            <div className="sm:hidden bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {filtered.length === 0 && <div className="p-12 text-center"><p className="text-sm font-semibold text-gray-600">No mentors found</p></div>}
                {filtered.map((m) => (
                    <div key={m.id} className="p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0" style={{ background: m.color }}>{m.initials}</div>
                                <span className="font-semibold text-gray-900 text-sm">{m.name}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${m.status === 'Active' ? 'bg-[#16a34a] text-white' : 'bg-gray-400 text-white'}`}>{m.status}</span>
                        </div>
                        <p className="text-xs text-gray-500">{m.cluster}</p>
                        <p className="text-xs font-bold text-[#181F26] dark:text-[#E6EDF3] tabular-nums">{m.workerId}</p>
                        <div className="flex gap-4 mt-1">
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Groups</p>
                                <p className="font-semibold text-gray-900 text-sm">{m.totalGroups}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Active Mentees</p>
                                <p className="font-semibold text-gray-900 text-sm">{m.activeMentees}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full table-auto text-xs">
                        <colgroup>
                            <col className="w-[22%]" />
                            <col className="w-[21%]" />
                            <col className="w-[14%]" />
                            <col className="w-[14%]" />
                            <col className="w-[16%]" />
                            <col className="w-[13%]" />
                        </colgroup>
                        <thead>
                            <tr className="table-header-row">{['Name', 'Worker ID', 'Cluster', 'Total Groups', 'Active Mentees', 'Status'].map((h, idx, arr) => (<th key={h} className={`text-[12px] font-bold uppercase tracking-widest px-6 py-4 ${idx === arr.length - 1 ? 'table-col-center text-center' : 'text-left'}`}>{h}</th>))}</tr>
                        </thead>
                        <tbody>
                            {filtered.map((m) => (
                                <tr key={m.id} className="transition-colors">
                                    <td className="px-6 py-4 text-left"><div className="flex items-center justify-start gap-2.5"><div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0" style={{ background: m.color }}>{m.initials}</div><span className="font-bold text-[#181F26] dark:text-[#E6EDF3]">{m.name}</span></div></td>
                                    <td className="px-6 py-4 text-left"><span className="font-bold text-[#181F26] dark:text-[#E6EDF3] tabular-nums">{m.workerId}</span></td>
                                    <td className="px-6 py-4 text-[#64748B] dark:text-[#9BA7B4] text-left">{m.cluster}</td>
                                    <td className="px-6 py-4 text-[#64748B] dark:text-[#9BA7B4] font-semibold text-left tabular-nums">{m.totalGroups}</td>
                                    <td className="px-6 py-4 text-[#64748B] dark:text-[#9BA7B4] font-semibold text-left tabular-nums">{m.activeMentees}</td>
                                    <td className="px-6 py-4 table-col-center text-center"><span className={`inline-flex items-center justify-center leading-none text-[10px] font-bold px-2.5 py-1 rounded-full ${m.status === 'Active' ? 'bg-[#16a34a] text-white' : 'bg-gray-400 text-white'}`}>{m.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && <div className="p-12 text-center"><p className="text-sm font-semibold text-gray-600">No mentors found</p></div>}
            </div>
        </div>
    );
}

// ─── Potential Mentees Tab ────────────────────────────────────────────────────
function PotentialMenteesTab() {
    const [clusterFilter, setClusterFilter] = useState('All');
    const [barangayFilter, setBarangayFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    const clusters = ['All', ...Array.from(new Set(MH_POTENTIAL_MENTEES.map((m) => m.cluster)))];
    const barangays = ['All', ...Array.from(new Set(MH_POTENTIAL_MENTEES.map((m) => m.barangay)))];
    const statuses = ['All', 'New', 'Waiting for Assignment', 'Assigned to Mentor', 'Interview Scheduled', 'Accepted'];

    const filtered = MH_POTENTIAL_MENTEES.filter((m) =>
        (clusterFilter === 'All' || m.cluster === clusterFilter) &&
        (barangayFilter === 'All' || m.barangay === barangayFilter) &&
        (statusFilter === 'All' || m.status === statusFilter)
    );

    function Sel({ allLabel, val, opts, onChange }: { allLabel: string; val: string; opts: string[]; onChange: (v: string) => void }) {
        return (
            <CustomSelect
                value={val}
                onChange={(e) => onChange(e.target.value)}
                className="text-xs font-semibold border border-[#E2E8E5] rounded-xl px-3.5 py-2 bg-white text-[#181F26] focus:outline-none w-full sm:w-auto min-w-[140px]"
            >
                {opts.map((o) => <option key={o} value={o}>{o === 'All' ? allLabel : o}</option>)}
            </CustomSelect>
        );
    }

    return (
        <div>
            <div className="mb-6"><h1 className="text-[1.75rem] font-extrabold tracking-[0.02em] uppercase text-gray-900 leading-tight">Potential Mentees</h1><p className="text-sm text-gray-400 mt-1">Master list of all potential mentees across the Outreach Ministry.</p></div>
            <div className="flex flex-wrap items-center gap-2.5 mb-5">
                <Sel allLabel="All Clusters" val={clusterFilter} opts={clusters} onChange={setClusterFilter} />
                <Sel allLabel="All Barangays" val={barangayFilter} opts={barangays} onChange={setBarangayFilter} />
                <Sel allLabel="All Statuses" val={statusFilter} opts={statuses} onChange={setStatusFilter} />
            </div>
            {/* Mobile cards */}
            <div className="flex flex-col gap-3 sm:hidden">
                {filtered.map((m) => (
                    <div key={m.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0" style={{ background: avatarColor(m.id) }}>{m.initials}</div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-sm truncate">{m.name}</p>
                                <p className="text-[11px] text-gray-400">{m.age} · {m.gender} · {m.barangay}</p>
                            </div>
                            <span className={`inline-flex items-center whitespace-nowrap leading-none text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLE[m.status] ?? 'bg-gray-100 text-gray-600'}`}>{m.status}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <div><span className="text-gray-400">Cluster: </span><span className="font-medium text-gray-700">{m.cluster}</span></div>
                            <div><span className="text-gray-400">Mentor: </span><span className="font-medium text-gray-700">{m.mentor || '—'}</span></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center whitespace-nowrap leading-none text-[10px] font-bold px-2.5 py-1 rounded-full ${m.source === 'From C2S Group Finder' ? 'bg-[#E0F2FE] text-[#0369A1]' : 'bg-[#D97706] text-white'}`}>{m.source === 'From C2S Group Finder' ? 'Finder' : 'Recommended'}</span>
                            <span className="text-[11px] text-gray-400">{m.dateSubmitted}</span>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center"><p className="text-sm font-semibold text-gray-600">No potential mentees match the selected filters</p></div>}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full table-auto text-xs">
                        <colgroup>
                            <col className="w-[15%]" />
                            <col className="w-[5%]" />
                            <col className="w-[7%]" />
                            <col className="w-[8%]" />
                            <col className="w-[11%]" />
                            <col className="w-[11%]" />
                            <col className="w-[10%]" />
                            <col className="w-[10%]" />
                            <col className="w-[14%]" />
                            <col className="w-[9%]" />
                        </colgroup>
                        <thead>
                            <tr className="table-header-row">{['Name', 'Age', 'Gender', 'Cluster', 'Coordinator', 'Mentor', 'Barangay', 'Source', 'Status', 'Submitted'].map((h) => (<th key={h} className="text-left text-[12px] font-bold uppercase tracking-widest px-6 py-4">{h}</th>))}</tr>
                        </thead>
                        <tbody>
                            {filtered.map((m) => (
                                <tr key={m.id} className="transition-colors">
                                    <td className="px-6 py-4 text-left"><div className="flex items-center justify-start gap-2"><div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0" style={{ background: avatarColor(m.id) }}>{m.initials}</div><span className="font-bold text-[#181F26] dark:text-[#E6EDF3]">{m.name}</span></div></td>
                                    <td className="px-6 py-4 text-[#64748B] dark:text-[#9BA7B4] text-left tabular-nums">{m.age}</td>
                                    <td className="px-6 py-4 text-[#64748B] dark:text-[#9BA7B4] text-left">{m.gender}</td>
                                    <td className="px-6 py-4 text-[#181F26] dark:text-[#E6EDF3] font-semibold text-left">{m.cluster}</td>
                                    <td className="px-6 py-4 text-[#64748B] dark:text-[#9BA7B4] text-left">{m.coordinator}</td>
                                    <td className="px-6 py-4 text-[#64748B] dark:text-[#9BA7B4] text-left">{m.mentor}</td>
                                    <td className="px-6 py-4 text-[#64748B] dark:text-[#9BA7B4] text-left">{m.barangay}</td>
                                    <td className="px-6 py-4 text-left"><span className={`inline-flex items-center justify-center leading-none text-[10px] font-bold px-2.5 py-1 rounded-full ${m.source === 'From C2S Group Finder' ? 'bg-[#E0F2FE] text-[#0369A1]' : 'bg-[#D97706] text-white'}`}>{m.source === 'From C2S Group Finder' ? 'Finder' : 'Recommended'}</span></td>
                                    <td className="px-6 py-4 text-left"><span className={`inline-flex items-center justify-center leading-none text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[m.status] ?? 'bg-gray-100 text-gray-600'}`}>{m.status}</span></td>
                                    <td className="px-6 py-4 text-[#64748B] dark:text-[#9BA7B4] text-left tabular-nums">{m.dateSubmitted}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && <div className="p-12 text-center"><p className="text-sm font-semibold text-gray-600">No potential mentees match the selected filters</p></div>}
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
            <div className="mb-6"><h1 className="text-[1.75rem] font-extrabold tracking-[0.02em] uppercase text-gray-900 leading-tight">Active Mentees</h1><p className="text-sm text-gray-400 mt-1">Master list of all active mentees across the Outreach Ministry.</p></div>
            <div className="flex flex-wrap items-center gap-3 mb-5">
                <CustomSelect
                    value={clusterFilter}
                    onChange={(e) => setClusterFilter(e.target.value)}
                    className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#D97706] min-w-[160px]"
                >
                    {clusters.map((c) => (
                        <option key={c} value={c}>
                            {c === 'All' ? 'All Clusters' : c}
                        </option>
                    ))}
                </CustomSelect>
            </div>
            {/* Mobile cards */}
            <div className="flex flex-col gap-3 sm:hidden">
                {filtered.map((m) => (
                    <div key={m.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0" style={{ background: avatarColor(m.id) }}>{m.initials}</div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-sm truncate">{m.name}</p>
                                <p className="text-[11px] text-gray-400 truncate">{m.cluster} · {m.barangay}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <div><span className="text-gray-400">Mentor: </span><span className="font-medium text-gray-700">{m.mentor}</span></div>
                            <div><span className="text-gray-400">Module: </span><span className="font-medium text-gray-700">{m.module}</span></div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-gray-400">Progress</span>
                                <span className="text-[11px] font-semibold text-gray-600">{m.progress}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${m.progress}%`, background: '#D97706' }} />
                            </div>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center"><p className="text-sm font-semibold text-gray-600">No active mentees found</p></div>}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full table-auto text-xs">
                        <colgroup>
                            <col className="w-[19%]" />
                            <col className="w-[12%]" />
                            <col className="w-[16%]" />
                            <col className="w-[15%]" />
                            <col className="w-[13%]" />
                            <col className="w-[11%]" />
                            <col className="w-[14%]" />
                        </colgroup>
                        <thead>
                            <tr className="table-header-row">{['Name', 'Cluster', 'Coordinator', 'Mentor', 'Barangay', 'Module', 'Progress'].map((h) => (<th key={h} className="text-left text-[12px] font-bold uppercase tracking-widest px-6 py-4">{h}</th>))}</tr>
                        </thead>
                        <tbody>
                            {filtered.map((m) => (
                                <tr key={m.id} className="transition-colors">
                                    <td className="px-6 py-4 text-left"><div className="flex items-center justify-start gap-2"><div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0" style={{ background: avatarColor(m.id) }}>{m.initials}</div><span className="font-bold text-[#181F26] dark:text-[#E6EDF3]">{m.name}</span></div></td>
                                    <td className="px-6 py-4 text-[#181F26] dark:text-[#E6EDF3] font-semibold text-left">{m.cluster}</td>
                                    <td className="px-6 py-4 text-[#64748B] dark:text-[#9BA7B4] text-left">{m.coordinator}</td>
                                    <td className="px-6 py-4 text-[#64748B] dark:text-[#9BA7B4] text-left">{m.mentor}</td>
                                    <td className="px-6 py-4 text-[#64748B] dark:text-[#9BA7B4] text-left">{m.barangay}</td>
                                    <td className="px-6 py-4 text-[#64748B] dark:text-[#9BA7B4] text-left">{m.module}</td>
                                    <td className="px-6 py-4 text-left"><div className="flex items-center justify-start gap-2"><div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden min-w-[56px]"><div className="h-full rounded-full" style={{ width: `${m.progress}%`, background: '#D97706' }} /></div><span className="text-[11px] font-semibold text-[#64748B] dark:text-[#9BA7B4] shrink-0 tabular-nums">{m.progress}%</span></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && <div className="p-12 text-center"><p className="text-sm font-semibold text-gray-600">No active mentees found</p></div>}
            </div>
        </div>
    );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────
type ReportType = 'monthly' | 'quarterly' | 'annual' | 'coordinator' | 'cluster' | 'mentor' | 'community' | 'maps';
const REPORT_GROWTH_DATA = [
    { period: 'Feb', mentees: 22, mentors: 9 },
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
    { month: 'July 2026', period: 'Jul 2026', clusters: 6, mentors: 20, activeMentees: 42, potentialMentees: 12, newGroups: 3, completedModules: 8, status: 'Submitted', submittedBy: 'Pastor Ramon Dela Cruz', submittedDate: 'Jul 31, 2026' },
    { month: 'June 2026', period: 'Jun 2026', clusters: 6, mentors: 19, activeMentees: 38, potentialMentees: 14, newGroups: 2, completedModules: 6, status: 'Submitted', submittedBy: 'Pastor Ramon Dela Cruz', submittedDate: 'Jun 30, 2026' },
    { month: 'May 2026', period: 'May 2026', clusters: 6, mentors: 18, activeMentees: 33, potentialMentees: 11, newGroups: 1, completedModules: 5, status: 'Submitted', submittedBy: 'Pastor Ramon Dela Cruz', submittedDate: 'May 31, 2026' },
    { month: 'April 2026', period: 'Apr 2026', clusters: 6, mentors: 17, activeMentees: 30, potentialMentees: 10, newGroups: 2, completedModules: 4, status: 'Submitted', submittedBy: 'Pastor Ramon Dela Cruz', submittedDate: 'Apr 30, 2026' },
    { month: 'March 2026', period: 'Mar 2026', clusters: 6, mentors: 16, activeMentees: 27, potentialMentees: 9, newGroups: 1, completedModules: 3, status: 'Submitted', submittedBy: 'Pastor Ramon Dela Cruz', submittedDate: 'Mar 31, 2026' },
    { month: 'February 2026', period: 'Feb 2026', clusters: 6, mentors: 15, activeMentees: 22, potentialMentees: 8, newGroups: 0, completedModules: 2, status: 'Submitted', submittedBy: 'Pastor Ramon Dela Cruz', submittedDate: 'Feb 28, 2026' },
    { month: 'January 2026', period: 'Jan 2026', clusters: 5, mentors: 14, activeMentees: 18, potentialMentees: 7, newGroups: 2, completedModules: 1, status: 'Submitted', submittedBy: 'Pastor Ramon Dela Cruz', submittedDate: 'Jan 31, 2026' },
    { month: 'December 2025', period: 'Dec 2025', clusters: 5, mentors: 13, activeMentees: 15, potentialMentees: 6, newGroups: 1, completedModules: 0, status: 'Submitted', submittedBy: 'Pastor Ramon Dela Cruz', submittedDate: 'Dec 31, 2025' },
    { month: 'November 2025', period: 'Nov 2025', clusters: 5, mentors: 12, activeMentees: 12, potentialMentees: 5, newGroups: 0, completedModules: 0, status: 'Submitted', submittedBy: 'Pastor Ramon Dela Cruz', submittedDate: 'Nov 30, 2025' },
    { month: 'October 2025', period: 'Oct 2025', clusters: 4, mentors: 11, activeMentees: 10, potentialMentees: 4, newGroups: 1, completedModules: 0, status: 'Submitted', submittedBy: 'Pastor Ramon Dela Cruz', submittedDate: 'Oct 31, 2025' },
    { month: 'September 2025', period: 'Sep 2025', clusters: 4, mentors: 10, activeMentees: 8, potentialMentees: 3, newGroups: 0, completedModules: 0, status: 'Draft', submittedBy: '—', submittedDate: '—' },
];
const CLUSTER_PERF = MH_CLUSTERS.map((c) => ({ name: c.name.replace('Cluster ', ''), mentors: c.totalMentors, active: c.totalActiveMentees, potential: c.totalPotentialMentees }));

function ReportsTab({ reportType }: { reportType: ReportType }) {
    const [mapFilter, setMapFilter] = useState<'All' | 'Open' | 'Full'>('All');

    const barangayCounts: Record<string, number> = {};
    MH_CLUSTERS.forEach((c) => {
        c.barangays.forEach((b) => { barangayCounts[b] = (barangayCounts[b] ?? 0) + c.communityBased; });
    });

    const filteredGroups: ClusterMapGroup[] = DASMARIÑAS_GROUPS
        .filter((g) => g.type === 'Community-based')
        .filter((g) => mapFilter === 'All' || g.status === mapFilter);

    function handleExportCsv() {
        if (reportType === 'monthly') {
            exportToCsv(
                'outreach-monthly-reports.csv',
                ['Month', 'Clusters', 'Mentors', 'Active Mentees', 'Potential Mentees', 'New Groups', 'Modules Done', 'Status', 'Submitted By', 'Date'],
                MONTHLY_REPORT_HISTORY.map((r) => [
                    r.month, r.clusters, r.mentors, r.activeMentees, r.potentialMentees,
                    r.newGroups, r.completedModules, r.status, r.submittedBy, r.submittedDate,
                ]),
            );
            return;
        }
        if (reportType === 'quarterly' || reportType === 'annual') {
            exportToCsv(
                `outreach-growth-${reportType}.csv`,
                ['Period', 'Active Mentees', 'Mentors'],
                REPORT_GROWTH_DATA.map((d) => [d.period, d.mentees, d.mentors]),
            );
            return;
        }
        if (reportType === 'cluster' || reportType === 'coordinator' || reportType === 'mentor') {
            exportToCsv(
                `outreach-performance-${reportType}.csv`,
                ['Name', 'Active Mentees', 'Potential Mentees', 'Mentors'],
                CLUSTER_PERF.map((c) => [c.name, c.active, c.potential, c.mentors]),
            );
            return;
        }
        if (reportType === 'community') {
            exportToCsv(
                'outreach-community-clusters.csv',
                ['Cluster', 'Community-Based', 'Church-Based', 'Active Mentees', 'Potential Mentees'],
                MH_CLUSTERS.map((c) => [c.name, c.communityBased, c.churchBased, c.totalActiveMentees, c.totalPotentialMentees]),
            );
            return;
        }
        exportToCsv(
            'outreach-map-groups.csv',
            ['Group Name', 'Barangay', 'Type', 'Members', 'Capacity', 'Mentor', 'Status'],
            filteredGroups.map((g) => [g.name, g.barangay, g.type, g.members, g.capacity, g.mentor, g.status]),
        );
    }

    return (
        <div>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                <div><h1 className="text-[1.75rem] font-extrabold tracking-[0.02em] uppercase text-gray-900 leading-tight">Reports</h1><p className="text-sm text-gray-400 mt-1">Generate and view Outreach Ministry reports.</p></div>
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
            {reportType !== 'maps' && (
                <div className="c2s-kpi-shell mb-6">
                    <div className="c2s-kpi-grid">
                        {[
                            { value: MH_CLUSTERS.length, label: 'Total Clusters', sub: 'Active', icon: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z' },
                            { value: MH_ALL_MENTORS.filter((m) => m.status === 'Active').length, label: 'Active Mentors', sub: 'Outreach Ministry', icon: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z' },
                            { value: MH_ACTIVE_MENTEES_LIST.length, label: 'Active Mentees', sub: '+3 this month', icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z' },
                            { value: MH_POTENTIAL_MENTEES.length, label: 'Potential Mentees', sub: 'Awaiting process', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
                        ].map((s) => (
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
            )}
            {(reportType === 'monthly' || reportType === 'quarterly' || reportType === 'annual') && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <p className="text-sm font-semibold text-gray-800 mb-4">Outreach Ministry Growth — {reportType.charAt(0).toUpperCase() + reportType.slice(1)}</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={REPORT_GROWTH_DATA} margin={{ top: 10, right: 20, left: -16, bottom: 0 }}>
                            <defs><linearGradient id="mgFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0E5B52" stopOpacity={0.16} /><stop offset="95%" stopColor="#0E5B52" stopOpacity={0} /></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} />
                            <Legend iconType="plainline" iconSize={14} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                            <Area type="monotone" dataKey="mentees" name="Active Mentees" stroke="#0E5B52" strokeWidth={2.2} fill="url(#mgFill)" dot={false} />
                            <Line type="monotone" dataKey="mentors" name="Mentors" stroke="#181F26" strokeWidth={2} dot={false} />
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
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#181F26] dark:bg-[#242D37] text-white">{MONTHLY_REPORT_HISTORY.filter(r => r.status === 'Submitted').length} submitted</span>
                    </div>
                    <div className="overflow-x-auto sm:hidden">
                        {/* Mobile cards */}
                        <div className="divide-y divide-gray-100">
                            {MONTHLY_REPORT_HISTORY.map((r, i) => (
                                <div key={i} className="p-4 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-gray-900 text-sm">{r.month}</span>
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${r.status === 'Submitted' ? 'bg-[#16a34a] text-white' :
                                            r.status === 'Pending' ? 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]' :
                                                'bg-gray-400 text-white'
                                            }`}>{r.status}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                                        <div><span className="text-[10px] text-gray-400 uppercase tracking-widest">Clusters </span><span className="font-semibold text-[#181F26] dark:text-[#E6EDF3] text-xs">{r.clusters}</span></div>
                                        <div><span className="text-[10px] text-gray-400 uppercase tracking-widest">Mentors </span><span className="font-semibold text-[#181F26] dark:text-[#E6EDF3] text-xs">{r.mentors}</span></div>
                                        <div><span className="text-[10px] text-gray-400 uppercase tracking-widest">Active </span><span className="font-semibold text-[#0E5B52] dark:text-[#5EEAD4] text-xs">{r.activeMentees}</span></div>
                                        <div><span className="text-[10px] text-gray-400 uppercase tracking-widest">Potential </span><span className="font-semibold text-[#181F26] dark:text-[#E6EDF3] text-xs">{r.potentialMentees}</span></div>
                                        <div><span className="text-[10px] text-gray-400 uppercase tracking-widest">New Groups </span><span className="font-semibold text-gray-600 text-xs">{r.newGroups}</span></div>
                                        <div><span className="text-[10px] text-gray-400 uppercase tracking-widest">Modules </span><span className="font-semibold text-gray-600 text-xs">{r.completedModules}</span></div>
                                    </div>
                                    <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
                                        <span>{r.submittedBy}</span>
                                        <span>{r.submittedDate}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full table-auto text-sm">
                            <colgroup>
                                <col className="w-[12%]" />
                                <col className="w-[8%]" />
                                <col className="w-[8%]" />
                                <col className="w-[10%]" />
                                <col className="w-[8%]" />
                                <col className="w-[9%]" />
                                <col className="w-[9%]" />
                                <col className="w-[10%]" />
                                <col className="w-[16%]" />
                                <col className="w-[10%]" />
                            </colgroup>
                            <thead>
                                <tr className="table-header-row">
                                    {['Month', 'Clusters', 'Mentors', 'Active Mentees', 'Potential', 'New Groups', 'Modules Done', 'Status', 'Submitted By', 'Date'].map(h => (
                                        <th key={h} className="px-6 py-4 text-left font-bold uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {MONTHLY_REPORT_HISTORY.map((r, i) => (
                                    <tr key={i} className="transition-colors">
                                        <td className="px-6 py-4 font-bold text-[#181F26] dark:text-[#E6EDF3] text-left">{r.month}</td>
                                        <td className="px-6 py-4 text-left text-[#64748B] dark:text-[#9BA7B4] tabular-nums">{r.clusters}</td>
                                        <td className="px-6 py-4 text-left text-[#64748B] dark:text-[#9BA7B4] tabular-nums">{r.mentors}</td>
                                        <td className="px-6 py-4 text-left font-semibold text-[#0E5B52] dark:text-[#5EEAD4] tabular-nums">{r.activeMentees}</td>
                                        <td className="px-6 py-4 text-left text-[#64748B] dark:text-[#9BA7B4] tabular-nums">{r.potentialMentees}</td>
                                        <td className="px-6 py-4 text-left text-[#64748B] dark:text-[#9BA7B4] tabular-nums">{r.newGroups}</td>
                                        <td className="px-6 py-4 text-left text-[#64748B] dark:text-[#9BA7B4] tabular-nums">{r.completedModules}</td>
                                        <td className="px-6 py-4 text-left">
                                            <span className={`inline-flex items-center justify-center leading-none text-[10px] font-bold px-2.5 py-1 rounded-full ${r.status === 'Submitted' ? 'bg-[#16a34a] text-white' :
                                                r.status === 'Pending' ? 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]' :
                                                    'bg-gray-400 text-white'
                                                }`}>{r.status}</span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-[#64748B] dark:text-[#9BA7B4] text-left">{r.submittedBy}</td>
                                        <td className="px-6 py-4 text-xs text-[#64748B] dark:text-[#9BA7B4] text-left tabular-nums">{r.submittedDate}</td>
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
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} />
                            <Legend iconSize={12} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                            <Bar dataKey="active" name="Active Mentees" fill="#0E5B52" radius={[3, 3, 0, 0]} barSize={22} />
                            <Bar dataKey="potential" name="Potential Mentees" fill="#181F26" radius={[3, 3, 0, 0]} barSize={22} />
                            <Bar dataKey="mentors" name="Mentors" fill="#64748B" fillOpacity={0.7} radius={[3, 3, 0, 0]} barSize={22} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
            {reportType === 'community' && (
                <div className="grid gap-5 items-stretch" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))' }}>
                    {MH_CLUSTERS.map((c) => {
                        const totalGroups = c.communityBased + c.churchBased;
                        return (
                            <div
                                key={c.id}
                                className="bg-white dark:bg-[#1A2026] border border-[#E2E8E5] dark:border-[#2A323D] flex flex-col justify-between"
                                style={{
                                    borderRadius: '1rem',
                                    padding: '1.5rem',
                                    borderTop: '3px solid #0E5B52',
                                    boxShadow: '0 4px 14px -4px rgba(15, 23, 42, 0.05)',
                                }}
                            >
                                <div className="flex items-center justify-between gap-3 mb-4">
                                    <h3 className="text-base font-bold text-[#181F26] dark:text-[#E6EDF3] leading-tight">
                                        {c.name}
                                    </h3>
                                    <span
                                        data-pill="true"
                                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#0E5B52]/10 text-[#0E5B52] dark:bg-[#2A9D8F]/15 dark:text-[#5EEAD4] whitespace-nowrap shrink-0 tabular-nums"
                                    >
                                        {totalGroups} {totalGroups === 1 ? 'Group' : 'Groups'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Community', value: c.communityBased },
                                        { label: 'Church', value: c.churchBased },
                                        { label: 'Active', value: c.totalActiveMentees },
                                        { label: 'Potential', value: c.totalPotentialMentees },
                                    ].map((m) => (
                                        <div
                                            key={m.label}
                                            data-settings-card="true"
                                            className="bg-[#F8FAFC] dark:bg-[#222933] border border-[#E2E8E5] dark:border-[#2A323D]"
                                            style={{ borderRadius: '0.75rem', padding: '0.75rem 1rem' }}
                                        >
                                            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.05em] text-[#64748B] dark:text-[#9BA7B4] mb-1">
                                                {m.label}
                                            </p>
                                            <p className="text-xl font-extrabold text-[#181F26] dark:text-[#E6EDF3] leading-tight tabular-nums">
                                                {m.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {reportType === 'maps' && (
                <div className="mb-6">
                    {/* Filter controls */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <CustomSelect
                            value={mapFilter}
                            onChange={(e) => setMapFilter(e.target.value as any)}
                            className="min-w-[180px]"
                        >
                            <option value="All">All Community-based</option>
                            <option value="Open">Available</option>
                            <option value="Full">Full</option>
                        </CustomSelect>
                    </div>
                    {/* Map + sidebar */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-4">
                        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden map-container" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            <ClusterMap groups={filteredGroups} accentColor="#047857" />
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col" style={{ maxHeight: 'clamp(260px, 40vh, 460px)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            <div className="px-5 pt-5 pb-3 border-b border-gray-50">
                                <p className="text-sm font-semibold text-gray-800">Groups by Barangay</p>
                            </div>
                            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                                {Object.entries(barangayCounts).sort((a, b) => b[1] - a[1]).map(([brgy, cnt]) => (
                                    <div key={brgy} className="flex items-center justify-between px-5 py-2.5">
                                        <span className="text-xs text-gray-700 font-medium truncate">{brgy}</span>
                                        <span className="text-xs font-bold text-[#D97706] shrink-0 ml-2">{cnt} groups</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center flex-wrap gap-x-6 gap-y-2 mb-5">
                        <div className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 rounded-full inline-block" style={{ background: '#047857' }} />
                            <span className="text-xs text-gray-600 font-medium">Community-based</span>
                        </div>
                        <p className="text-xs text-gray-400 sm:ml-auto hidden sm:block">Click a marker for group details</p>
                    </div>
                    {/* Cluster coverage pills */}
                    <div className="grid gap-4 items-stretch" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' }}>
                        {MH_CLUSTERS.map((c) => (
                            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                <p className="font-semibold text-gray-900 text-sm mb-2">{c.name} Coverage</p>
                                <p className="text-xs text-gray-500 mb-2">Barangays: <span className="font-semibold text-gray-800">{c.barangays.length}</span></p>
                                <div className="flex flex-wrap gap-1.5">
                                    {c.barangays.map((b) => <span key={b} className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#D97706] text-white">{b}</span>)}
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
    const [notifs, setNotifs] = useState(MH_NOTIFICATIONS);
    const unreadCount = notifs.filter((n) => !n.read).length;
    const NOTIF_ICON: Record<string, { color: string; icon: string }> = {
        worker: { color: '#D97706', icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
        worker_id: { color: '#D97706', icon: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z' },
        coordinator: { color: '#0284C7', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
        mentor: { color: '#e67700', icon: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z' },
    };
    const TYPE_LABEL: Record<string, string> = { worker: 'New Worker', worker_id: 'Worker ID', coordinator: 'Coordinator', mentor: 'Mentor' };

    return (
        <div>
            <div className="flex flex-wrap items-start justify-between gap-2 mb-6">
                <div><h1 className="text-[1.75rem] font-extrabold tracking-[0.02em] uppercase text-gray-900 leading-tight">Notifications</h1><p className="text-sm text-gray-400 mt-1">{unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}</p></div>
                {unreadCount > 0 && <button onClick={() => setNotifs((p) => p.map((n) => ({ ...n, read: true })))} className="text-xs font-semibold text-[#D97706] hover:underline">Mark all as read</button>}
            </div>
            <div className="flex flex-col gap-3">
                {notifs.map((n) => {
                    const s = NOTIF_ICON[n.type];
                    return (
                        <div key={n.id} className={`bg-white rounded-2xl border px-5 py-4 flex items-start gap-4 transition-all ${!n.read ? 'border-[#D97706]/30 shadow-sm' : 'border-gray-100'}`}>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: s.color + '20' }}>
                                <svg style={{ color: s.color, width: 18, height: 18 }} viewBox="0 0 24 24" fill="currentColor"><path d={s.icon} /></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: s.color + '20', color: s.color }}>{TYPE_LABEL[n.type]}</span>
                                        {!n.read && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#D97706] text-white">New</span>}
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
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [settingsSection, setSettingsSection] = useState<MySettingsSection | null>(null);
    useScrollToTop(`${activeNav}:${settingsSection ?? ''}`);
    const unreadCount = MH_NOTIFICATIONS.filter((n) => !n.read).length;

    function navigate(key: NavKey) {
        setActiveNav(key);
        setSettingsSection(null);
        setSidebarOpen(false);
    }

    const mhItem = (key: NavKey, badge?: number) => {
        const found = MH_NAV.find(n => n.key === key)!;
        return { key: found.key, label: found.label, icon: found.icon, iconKind: found.iconKind, badge };
    };

    const mhNavEntries: SidebarNavEntry[] = [
        { kind: 'item', item: mhItem('dashboard') },
        { kind: 'item', item: mhItem('clusters', MH_CLUSTERS.length) },
        { kind: 'item', item: mhItem('coordinators') },
        { kind: 'item', item: mhItem('mentors') },
        {
            kind: 'group',
            group: {
                id: 'mentees',
                label: 'Mentees',
                icon: mhItem('mentees').icon,
                items: [mhItem('potential', MH_POTENTIAL_MENTEES.length), mhItem('mentees', MH_ACTIVE_MENTEES_LIST.length)],
            },
        },
        {
            kind: 'group',
            group: {
                id: 'reports',
                label: 'Reports',
                icon: 'M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z',
                items: [
                    mhItem('reports_monthly'),
                    mhItem('reports_quarterly'),
                    mhItem('reports_annual'),
                    mhItem('reports_coordinator'),
                    mhItem('reports_cluster'),
                    mhItem('reports_mentor'),
                    mhItem('reports_community'),
                    mhItem('reports_maps'),
                ],
            },
        },
        { kind: 'item', item: mhItem('notifications', unreadCount) },
    ];

    return (
        <div className="flex min-h-screen dashboard-shell" style={{ background: 'var(--bg-page)' }}>

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

                {/* MENU label + collapse toggle */}
                <div className={`flex items-center pt-4 mb-3 ${sidebarCollapsed ? 'justify-between px-5 md:justify-center md:px-0 md:mb-2' : 'justify-between px-4'}`}>
                    <p className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest ${sidebarCollapsed ? 'md:hidden' : ''}`}>Menu</p>
                    <SidebarCollapseButton collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} />
                </div>

                {/* Nav items */}
                <SidebarNavList
                    entries={mhNavEntries}
                    activeKey={!settingsSection ? activeNav : null}
                    collapsed={sidebarCollapsed}
                    onSelect={(key) => navigate(key as NavKey)}
                />
                {/* Settings dropdown at bottom */}
                <SidebarSettingsDropdown
                    activeSection={settingsSection}
                    collapsed={sidebarCollapsed}
                    onExpandSidebar={() => setSidebarCollapsed(false)}
                    onSelect={(sec) => { setSettingsSection(sec); setSidebarOpen(false); }}
                />
            </aside>

            {/* ── Main content ── */}
            <div className={`w-full flex-1 ${sidebarCollapsed ? 'md:ml-[68px]' : 'md:ml-72'} pb-16 min-w-0 overflow-x-hidden transition-[margin] duration-200`}>

                <DashboardTopHeader
                    pageTitle={settingsSection === 'profile' ? 'My Profile' : settingsSection ? 'Settings' : MH_NAV.find(n => n.key === activeNav)?.label ?? 'Dashboard'}
                    onOpenMenu={() => setSidebarOpen(true)}
                    onOpenProfile={() => { setSettingsSection('profile'); setSidebarOpen(false); }}
                />

                <div className="pt-4 md:pt-5 px-4 sm:px-6">
                    {settingsSection ? (
                        <SettingsPageView section={settingsSection} />
                    ) : (
                        <>
                            {activeNav === 'dashboard' && <DashboardTab />}
                            {activeNav === 'clusters' && <ClustersTab />}
                            {activeNav === 'coordinators' && <CoordinatorsTab />}
                            {activeNav === 'mentors' && <MentorsTab />}
                            {activeNav === 'potential' && <PotentialMenteesTab />}
                            {activeNav === 'mentees' && <ActiveMenteesTab />}
                            {activeNav.startsWith('reports_') && (
                                <ReportsTab reportType={activeNav.replace('reports_', '') as ReportType} />
                            )}
                            {activeNav === 'notifications' && <NotificationsTab />}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
