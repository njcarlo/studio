'use client';

import CustomSelect from '@/components/CustomSelect';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useConfirm } from '@/lib/confirm-context';
import { C2S_GROUPS, type C2SGroup, GROUP_MEMBERS, POTENTIAL_MENTEES, type PotentialMentee, ACTIVE_MENTEES, INACTIVE_MENTEES, ENDORSED_GROUPS, ENDORSED_WORKERS } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import ViewMembersModal from '@/components/ViewMembersModal';
import EditGroupModal from '@/components/EditGroupModal';
import CreateGroupModal from '@/components/CreateGroupModal';
import MenteeDetailsModal from '@/components/MenteeDetailsModal';
import AcceptMenteeModal from '@/components/AcceptMenteeModal';
import RecommendGroupModal from '@/components/RecommendGroupModal';
import MenteeProfileModal from '@/components/MenteeProfileModal';
import DevotionalProgressModal from '@/components/DevotionalProgressModal';
import EndorsedViewMembersModal from '@/components/EndorsedViewMembersModal';
import EndorsedEditGroupModal from '@/components/EndorsedEditGroupModal';
import EndorsedCreateGroupModal from '@/components/EndorsedCreateGroupModal';
import { HUB_APPLICATIONS_KEY } from '@/components/C2SHubModal';
import { SidebarCollapseButton, SidebarNavList, SidebarSettingsDropdown, SettingsPageView, useScrollToTop, type MySettingsSection, type SidebarNavEntry } from '@/components/SettingsModal';
import { SidebarBrandHeader, DashboardTopHeader } from '@/components/DashboardHeader';
import AddMenteeModal from '@/components/AddMenteeModal';
import ClusterHeadDashboard from '@/components/ClusterHeadDashboard';
import { CH_MENTOR_REPORT_DATA, CH_COORD_REPORT_DATA, CH_BARANGAY_DATA, CH_GROWTH_DATA } from '@/components/ClusterHeadDashboard';
import CoordinatorDashboard from '@/components/CoordinatorDashboard';
import DepartmentHeadDashboard from '@/components/MinistryHeadDashboard';
import AdminDashboard from '@/components/AdminDashboard';

/* â”€â”€ Shared data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const DEPT_WORKERS = [
    { name: 'Worship', value: 512, color: '#4DA6F5' },
    { name: 'Outreach', value: 640, color: '#F5C842' },
    { name: 'Relationship', value: 428, color: '#5CB85C' },
    { name: 'Discipleship', value: 892, color: '#E05C5C' },
    { name: 'Administration', value: 384, color: '#475569' },
];
const DEPT_MENTORS = [
    { name: 'Worship', value: 84, color: '#4DA6F5' },
    { name: 'Outreach', value: 122, color: '#F5C842' },
    { name: 'Relationship', value: 96, color: '#5CB85C' },
    { name: 'Discipleship', value: 205, color: '#E05C5C' },
    { name: 'Administration', value: 42, color: '#475569' },
];
const TOTAL_WORKERS = DEPT_WORKERS.reduce((s, d) => s + d.value, 0);
const TOTAL_MENTORS = DEPT_MENTORS.reduce((s, d) => s + d.value, 0);


import { type Mentee, CH_COORDINATORS, CH_MENTORS, CH_POTENTIAL_MENTEES, CH_ACTIVE_MENTEES, CH_CLUSTER_GROUPS, CH_NOTIFICATIONS, type C2SCoordinator, type ClusterMentor, type ClusterPotentialMentee } from '@/lib/data';

const ACTIVE_MENTEES_STORAGE_KEY = 'c2s_active_mentees';

function potentialMenteeToMentee(pm: PotentialMentee): Mentee {
    const now = new Date();
    const connectedSince = now.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    return {
        id: `mentee_${pm.id}`,
        initials: pm.initials,
        name: pm.name,
        assignedGroup: pm.requestedGroup,
        connectedSince,
        module: 'Module 1',
        lesson: 'Lesson 1',
        progress: 0,
        email: pm.email,
        phone: pm.phone,
        age: pm.age,
        birthday: pm.birthday,
        gender: pm.gender,
        facebook: pm.facebook,
        firstAttended: pm.firstAttended,
        currentModule: 'Module 1 â€” Foundations',
        currentLesson: 'Lesson 1: Who Am I in Christ',
        mentorNotes: '',
        trainings: pm.trainings,
    };
}

/* -- Mentor Dashboard helper constants ---------------------------------------- */
const MENTEES_F2F = 1842;
const MENTEES_ONLINE = 923;
const MENTEES_TOTAL = MENTEES_F2F + MENTEES_ONLINE;
const C2S_COMMUNITY = 98;
const C2S_CHURCH = 81;
const C2S_TOTAL_ALL = C2S_COMMUNITY + C2S_CHURCH;

const MENTEES_BY_DEPT = [
    { dept: 'Worship', f2f: 312, online: 180, total: 492 },
    { dept: 'Outreach', f2f: 420, online: 220, total: 640 },
    { dept: 'Relationship', f2f: 280, online: 148, total: 428 },
    { dept: 'Discipleship', f2f: 610, online: 282, total: 892 },
    { dept: 'Administration', f2f: 220, online: 93, total: 313 },
];

const C2S_GROUPS_BY_DEPT = [
    { dept: 'Worship', community: 18, church: 14, total: 32 },
    { dept: 'Outreach', community: 26, church: 22, total: 48 },
    { dept: 'Relationship', community: 19, church: 15, total: 34 },
    { dept: 'Discipleship', community: 28, church: 24, total: 52 },
    { dept: 'Administration', community: 7, church: 6, total: 13 },
];

/* --- WorkersMentorsChart -------------------------------------------------- */
const DEPT_COMBINED = [
    { dept: 'Worship', workers: DEPT_WORKERS[0].value, mentors: DEPT_MENTORS[0].value, color: '#4DA6F5' },
    { dept: 'Outreach', workers: DEPT_WORKERS[1].value, mentors: DEPT_MENTORS[1].value, color: '#F5C842' },
    { dept: 'Relationship', workers: DEPT_WORKERS[2].value, mentors: DEPT_MENTORS[2].value, color: '#5CB85C' },
    { dept: 'Discipleship', workers: DEPT_WORKERS[3].value, mentors: DEPT_MENTORS[3].value, color: '#E05C5C' },
    { dept: 'Administration', workers: DEPT_WORKERS[4].value, mentors: DEPT_MENTORS[4].value, color: '#475569' },
];
const COMBINED_TOTAL_WORKERS = DEPT_COMBINED.reduce((s, d) => s + d.workers, 0);
const COMBINED_TOTAL_MENTORS = DEPT_COMBINED.reduce((s, d) => s + d.mentors, 0);
const COMBINED_GRAND_TOTAL = COMBINED_TOTAL_WORKERS + COMBINED_TOTAL_MENTORS;

const DONUT_DATA = DEPT_COMBINED.map((d) => ({ name: d.dept, value: d.workers + d.mentors, color: d.color }));

function WorkersMentorsChart() {
    // Smaller canvas — labels go inside the slices, no overflow needed
    const W = 240;
    const H = 240;
    const CX = 120;
    const CY = 120;
    const OR = 100;
    const IR = 60;
    const LR = (OR + IR) / 2; // mid-radius for inside labels
    const RADIAN = Math.PI / 180;

    const total = DONUT_DATA.reduce((s, d) => s + d.value, 0);

    type SliceInfo = { name: string; color: string; percent: number; startDeg: number; endDeg: number };
    const slices: SliceInfo[] = [];
    let cum = -90;
    for (const d of DONUT_DATA) {
        const sweep = (d.value / total) * 360;
        slices.push({ name: d.name, color: d.color, percent: d.value / total, startDeg: cum, endDeg: cum + sweep });
        cum += sweep;
    }

    function arc(cx: number, cy: number, r: number, startDeg: number, endDeg: number, inner: number): string {
        const s = startDeg * RADIAN;
        const e = endDeg * RADIAN;
        const large = (endDeg - startDeg) > 180 ? 1 : 0;
        const x1 = cx + r * Math.cos(s); const y1 = cy + r * Math.sin(s);
        const x2 = cx + r * Math.cos(e); const y2 = cy + r * Math.sin(e);
        const ix1 = cx + inner * Math.cos(s); const iy1 = cy + inner * Math.sin(s);
        const ix2 = cx + inner * Math.cos(e); const iy2 = cy + inner * Math.sin(e);
        return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1} Z`;
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 className="font-bold text-gray-900 text-base mb-0.5">Workers by Department</h2>
            <p className="text-xs text-gray-400 mb-4">Worker and mentor distribution by department.</p>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4 sm:gap-8 mb-6 sm:mb-8">
                {/* Self-contained SVG donut — no overflow outside its box */}
                <div className="flex justify-center">
                    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
                        {/* Slices */}
                        {slices.map((s) => (
                            <path
                                key={s.name}
                                d={arc(CX, CY, OR, s.startDeg, s.endDeg, IR)}
                                fill={s.color}
                                stroke="rgba(0,0,0,0.15)"
                                strokeWidth={2}
                            />
                        ))}
                        {/* % labels inside slices */}
                        {slices.map((s) => {
                            if (s.percent < 0.06) return null;
                            const midRad = (s.startDeg + s.endDeg) / 2 * RADIAN;
                            const tx = CX + LR * Math.cos(midRad);
                            const ty = CY + LR * Math.sin(midRad);
                            return (
                                <text
                                    key={`lbl-${s.name}`}
                                    x={tx} y={ty}
                                    fill="white"
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fontSize={12}
                                    fontWeight="bold"
                                    fontFamily="Inter, system-ui, sans-serif"
                                >
                                    {`${(s.percent * 100).toFixed(0)}%`}
                                </text>
                            );
                        })}
                    </svg>
                </div>

                {/* Legend */}
                <div className="flex sm:flex-col flex-wrap gap-3 sm:gap-3.5 justify-center sm:justify-start">
                    {DONUT_DATA.map((d) => (
                        <div key={d.name} className="flex items-center gap-2.5">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
                            <span className="text-sm text-gray-600">{d.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-gray-100">
                <table className="w-full table-fixed">
                    <colgroup>
                        <col className="w-[40%]" />
                        <col className="w-[20%]" />
                        <col className="w-[20%]" />
                        <col className="w-[20%]" />
                    </colgroup>
                    <thead>
                        <tr className="table-header-row">
                            <th className="pl-3 pr-2 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Department</th>
                            <th className="px-2 py-3 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Workers</th>
                            <th className="px-2 py-3 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mentors</th>
                            <th className="pl-2 pr-4 py-3 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {DEPT_COMBINED.map((row, i) => (
                            <tr key={row.dept} className="table-body-row">
                                <td className="pl-3 pr-2 py-3.5 text-sm font-semibold text-gray-700">{row.dept}</td>
                                <td className="px-2 py-3.5 text-sm text-gray-500 text-right">{row.workers.toLocaleString()}</td>
                                <td className="px-2 py-3.5 text-sm text-gray-500 text-right">{row.mentors.toLocaleString()}</td>
                                <td className="pl-2 pr-4 py-3.5 text-sm text-gray-500 text-right">{(row.workers + row.mentors).toLocaleString()}</td>
                            </tr>
                        ))}
                        <tr className="table-total-row">
                            <td className="pl-3 pr-2 py-3.5 text-sm font-black text-gray-800">Total</td>
                            <td className="px-2 py-3.5 text-sm font-bold text-gray-700 text-right">{COMBINED_TOTAL_WORKERS.toLocaleString()}</td>
                            <td className="px-2 py-3.5 text-sm font-bold text-gray-700 text-right">{COMBINED_TOTAL_MENTORS.toLocaleString()}</td>
                            <td className="pl-2 pr-4 py-3.5 text-sm font-bold text-gray-700 text-right">{COMBINED_GRAND_TOTAL.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* -- PotentialMenteeCard ------------------------------------------------------- */
const PM_REQUEST_TIMESTAMPS: Record<string, string> = {
    pm1: 'Requested 2 hrs ago',
    pm2: 'Requested yesterday',
    pm3: 'Requested 2 days ago',
};

function PotentialMenteeCard({ mentee, onAccepted }: {
    mentee: PotentialMentee;
    onAccepted: (pm: PotentialMentee) => void;
}) {
    const [showAccept, setShowAccept] = useState(false);
    const [showRecommend, setShowRecommend] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [copiedPhone, setCopiedPhone] = useState(false);

    const requestedGroupInfo = C2S_GROUPS.find(
        (g) => g.name.trim().toLowerCase() === mentee.requestedGroup.trim().toLowerCase()
    );
    const requestTimestamp = PM_REQUEST_TIMESTAMPS[mentee.id] ?? 'Requested recently';

    function handleCopyPhone() {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(mentee.phone).catch(() => { /* ignore */ });
        }
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 1800);
    }

    return (
        <>
            {showDetails && (
                <MenteeDetailsModal
                    mentee={mentee}
                    onClose={() => setShowDetails(false)}
                    onAccept={() => { setShowDetails(false); setShowAccept(true); }}
                    onRecommend={() => { setShowDetails(false); setShowRecommend(true); }}
                />
            )}
            {showAccept && (
                <AcceptMenteeModal
                    menteeName={mentee.name}
                    groupName={mentee.requestedGroup}
                    onCancel={() => setShowAccept(false)}
                    onConfirm={() => { onAccepted(mentee); setShowAccept(false); }}
                />
            )}
            {showRecommend && (
                <RecommendGroupModal
                    menteeName={mentee.name}
                    onClose={() => setShowRecommend(false)}
                    onConfirm={() => setShowRecommend(false)}
                />
            )}

            <div className="h-full bg-white rounded-2xl border border-[#E7E5E4] p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-sm">
                <div className="flex flex-col gap-4">
                    {/* Row 1: Avatar + name/info + clickable copy-phone + Pending badge */}
                    <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                            style={{ background: '#D97706' }}>
                            {mentee.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#292524] leading-tight truncate">{mentee.name}</p>
                            <p className="text-xs text-[#6B665F] mt-0.5 leading-snug">{mentee.age} · {mentee.gender}</p>
                            <button
                                type="button"
                                onClick={handleCopyPhone}
                                title="Copy phone number"
                                className="inline-flex items-center gap-1.5 text-xs text-[#6B665F] hover:text-[#D97706] transition-colors whitespace-nowrap leading-snug mt-0.5 cursor-pointer"
                            >
                                <span>{mentee.phone}</span>
                                {copiedPhone ? (
                                    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#15803D]">
                                        <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Copied
                                    </span>
                                ) : (
                                    <svg className="w-3 h-3 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <span
                            data-pill="true"
                            className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309] shrink-0 border border-[#FDE68A] whitespace-nowrap"
                        >
                            Pending
                        </span>
                    </div>

                    {/* Row 2: Source badge + request timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                            data-pill="true"
                            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full whitespace-nowrap ${
                                mentee.source === 'Recommended'
                                    ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                                    : 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]'
                            }`}
                        >
                            {mentee.source === 'Recommended' ? (
                                <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" /></svg>
                            ) : (
                                <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
                            )}
                            {mentee.source}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6B665F] whitespace-nowrap">
                            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {requestTimestamp}
                        </span>
                    </div>

                    {/* Row 3: Unified Warm Sand Details Box (Requested Group + Notes) */}
                    <div className="bg-[#F5F2EC] rounded-xl p-4 border border-[#E7E5E4] space-y-3">
                        <div>
                            <p className="text-[10px] font-bold text-[#6B665F] uppercase tracking-widest mb-1">Requested Group</p>
                            <p className="font-bold text-[#292524] text-base leading-snug">{mentee.requestedGroup}</p>
                            {requestedGroupInfo && (
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B665F] mt-1.5">
                                    <span className="inline-flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5 text-[#D97706] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        {requestedGroupInfo.location}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5 text-[#D97706] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        {requestedGroupInfo.schedule}
                                    </span>
                                </div>
                            )}
                        </div>

                        {mentee.notes && (
                            <div className="border-t border-[#E7E5E4] pt-3">
                                <p className="text-[10px] font-bold text-[#6B665F] uppercase tracking-widest mb-1">Notes</p>
                                <p className="text-xs text-[#292524] leading-relaxed">{mentee.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Row 4: Action buttons */}
                <div className="pt-1">
                    {/* Accept — full-width primary CTA on top row */}
                    <button
                        onClick={() => setShowAccept(true)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-bold text-white whitespace-nowrap rounded-xl bg-[#D97706] hover:bg-[#B45309] transition-colors shadow-sm"
                    >
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                        Accept
                    </button>

                    {/* Secondary actions — 2-column row underneath */}
                    <div className="grid grid-cols-2 gap-2.5 w-full mt-2.5">
                        <button
                            onClick={() => setShowRecommend(true)}
                            className="flex items-center justify-center gap-1.5 min-w-0 px-3 py-2 text-xs font-semibold text-[#292524] whitespace-nowrap rounded-xl border border-[#E7E5E4] bg-white hover:bg-[#F5F2EC] transition-colors"
                        >
                            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
                            Recommend
                        </button>

                        <button
                            onClick={() => setShowDetails(true)}
                            className="flex items-center justify-center gap-1.5 min-w-0 px-3 py-2 text-xs font-semibold text-[#292524] whitespace-nowrap rounded-xl border border-[#E7E5E4] bg-white hover:bg-[#F5F2EC] transition-colors"
                        >
                            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg>
                            Details
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

/* -- Avatar color helper (shared with MenteesTab) ------------------------------ */
const MENTOR_AVATAR_COLORS = ['#D97706', '#D97706', '#0284C7', '#e67700', '#D97706'];
function mentorAvatarColor(id: string) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
    return MENTOR_AVATAR_COLORS[Math.abs(h) % MENTOR_AVATAR_COLORS.length];
}

/* -- MenteesTab ---------------------------------------------------------------- */
function MenteesTab({
    activeMentees,
    onAddMentee,
    userGroup,
}: {
    activeMentees: import('@/lib/data').Mentee[];
    onAddMentee?: (mentee: import('@/lib/data').Mentee) => void;
    userGroup?: string;
}) {
    const [viewing, setViewing] = useState<import('@/lib/data').Mentee | null>(null);
    const [showDevotional, setShowDevotional] = useState<import('@/lib/data').Mentee | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [activeSearch, setActiveSearch] = useState('');
    const [inactiveList] = useState(() => INACTIVE_MENTEES.map(m => ({ ...m })));

    const totalMentees = activeMentees.length + inactiveList.filter(m => m.reason !== 'Transferred').length;
    const activeCnt = activeMentees.length;
    const inactiveCnt = inactiveList.filter(m => m.reason === 'Inactive').length;
    const transferredCnt = inactiveList.filter(m => m.reason === 'Transferred').length;
    const activePct = totalMentees > 0 ? Math.round((activeCnt / totalMentees) * 100) : 0;

    const filteredActive = activeMentees.filter(m =>
        m.name.toLowerCase().includes(activeSearch.toLowerCase())
    );

    const reasonBadge = (r: string) => {
        if (r === 'Completed') return 'bg-[#16a34a] text-white';
        if (r === 'Transferred') return 'bg-[#D97706] text-white';
        return 'bg-gray-400 text-white';
    };

    function handleAddSuccess(newMentee: import('@/lib/data').Mentee) {
        onAddMentee?.(newMentee);
        setToastMsg('Mentee successfully added.');
        setTimeout(() => setToastMsg(null), 4000);
    }

    return (
        <>
            {viewing && <MenteeProfileModal mentee={viewing} onClose={() => setViewing(null)} />}
            {showDevotional && <DevotionalProgressModal mentee={showDevotional} onClose={() => setShowDevotional(null)} />}
            {showAddModal && (
                <AddMenteeModal
                    defaultGroup={userGroup || 'Orchard Residences'}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={handleAddSuccess}
                />
            )}

            {/* Success Toast */}
            {toastMsg && (
                <div
                    role="status"
                    aria-live="polite"
                    className="fixed bottom-6 right-6 z-[10000] flex items-center gap-3 bg-white border border-gray-200 shadow-2xl rounded-2xl px-5 py-3.5 animate-in fade-in slide-in-from-bottom-4 duration-300"
                    style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
                >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">Success</p>
                        <p className="text-xs text-gray-500 mt-0.5">{toastMsg}</p>
                    </div>
                    <button
                        onClick={() => setToastMsg(null)}
                        className="ml-2 text-gray-400 hover:text-gray-700 p-1 text-base leading-none transition-colors"
                        aria-label="Dismiss toast"
                    >
                        ×
                    </button>
                </div>
            )}

            <div>
                {/* Header row with + Add Mentee button */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Mentees</h1>
                        <p className="text-sm text-gray-400 mt-1">Connect, disciple and guide souls on their spiritual journey through meaningful relationships and faithful follow-up.</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shrink-0 self-start sm:self-auto active:scale-95"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                        </svg>
                        Add Mentee
                    </button>
                </div>

                {/* -- Stats row -- */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    {/* Donut card */}
                    <div className="bg-white rounded-2xl border border-gray-200 px-6 py-6 flex items-center gap-6 sm:shrink-0">
                        <div className="min-w-0 flex-1 sm:flex-none">
                            <p className="text-sm font-bold text-gray-800 leading-tight">Mentee Status</p>
                            <p className="text-[11px] text-gray-400 mb-4">Active vs Inactive</p>
                            <div className="flex items-center gap-2 text-xs text-gray-700 mb-2">
                                <span className="w-3 h-3 rounded-full bg-[#3b82f6] shrink-0" />
                                Active&nbsp;<span className="font-bold">{activeCnt}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span className="w-3 h-3 rounded-full bg-gray-200 shrink-0" />
                                Inactive&nbsp;<span className="font-bold">{inactiveList.length}</span>
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

                    {/* Stat cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-1 sm:flex sm:flex-1 gap-4 sm:gap-4">
                        {[
                            { label: 'Total Mentees', value: totalMentees, color: '#D97706' },
                            { label: 'Active', value: activeCnt, color: '#ef4444' },
                            { label: 'Inactive', value: inactiveCnt, color: '#3b82f6' },
                            { label: 'Transferred', value: transferredCnt, color: '#0284C7' },
                        ].map(s => (
                            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 px-4 sm:px-7 py-5 flex flex-col justify-center sm:flex-1 dark:bg-gray-800 dark:border-gray-700">
                                <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-2 dark:text-gray-300">{s.label}</p>
                                <p className="font-black leading-none" style={{ color: s.color, fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}>{s.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* -- Active Mentees table -- */}
                <div className="mb-8">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <h2 className="text-base font-bold text-gray-900">Active Mentees</h2>
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" /></svg>
                            <input type="text" placeholder="Search mentees..." value={activeSearch} onChange={e => setActiveSearch(e.target.value)}
                                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97706] bg-white w-full sm:w-52" />
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200">
                        {filteredActive.length === 0 ? (
                            <div className="p-10 text-center text-sm text-gray-400">No active mentees found.</div>
                        ) : (
                            <>
                                {/* Mobile card list */}
                                <div className="sm:hidden divide-y divide-gray-100">
                                    {filteredActive.map((m) => (
                                        <div key={m.id} className="p-4 flex flex-col gap-3">
                                            {/* Top row: avatar + name + group */}
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-xs shrink-0"
                                                    style={{ background: mentorAvatarColor(m.id) }}>{m.initials}</div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-900 text-sm leading-tight truncate">{m.name}</p>
                                                    <p className="text-xs text-gray-400 truncate">{m.assignedGroup}</p>
                                                </div>
                                                <span className="text-[10px] text-gray-400 shrink-0">{m.connectedSince}</span>
                                            </div>
                                            {/* Devotional status + progress */}
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Devotional Manual</p>
                                                    <p className="text-xs text-gray-600 truncate">{m.module}, {m.lesson}</p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full" style={{ width: `${m.progress}%`, background: '#D97706' }} />
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-600">{m.progress}%</span>
                                                </div>
                                            </div>
                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                <button onClick={() => setViewing(m)}
                                                    className="flex-1 text-xs font-semibold text-gray-700 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                                                    View Profile
                                                </button>
                                                <button onClick={() => setShowDevotional(m)}
                                                    className="flex-1 text-xs font-bold text-white py-2 rounded-lg transition-colors"
                                                    style={{ background: '#D97706' }}>
                                                    Update
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Desktop table */}
                                <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-[#f8f9fc]">
                                            {['Name', 'Assigned Group', 'Connected Since', 'Devotional Manual Status', 'Progress', 'Actions'].map(h => (
                                                <th key={h} className="px-2.5 first:pl-5 last:pr-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredActive.map((m) => (
                                            <tr key={m.id} className="hover:bg-[#f8f9fc] transition-colors">
                                                <td className="pl-6 pr-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs shrink-0"
                                                            style={{ background: mentorAvatarColor(m.id) }}>{m.initials}</div>
                                                        <span className="font-bold text-gray-900 text-sm">{m.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-500">{m.assignedGroup}</td>
                                                <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{m.connectedSince}</td>
                                                <td className="px-4 py-4 text-sm text-gray-600">{m.module}, {m.lesson}</td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
                                                            <div className="h-full rounded-full" style={{ width: `${m.progress}%`, background: '#D97706' }} />
                                                        </div>
                                                        <span className="text-xs font-semibold text-gray-600 shrink-0">{m.progress}%</span>
                                                    </div>
                                                </td>
                                                <td className="pl-4 pr-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col gap-1.5">
                                                        <button onClick={() => setViewing(m)} className="text-xs font-semibold text-gray-600 hover:underline transition-colors">View Profile</button>
                                                        <button onClick={() => setShowDevotional(m)}
                                                            className="text-xs font-bold text-white px-3 py-1.5 rounded-lg transition-colors"
                                                            style={{ background: '#D97706' }}>
                                                            Update
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* -- Inactive Mentees table -- */}
                <div>
                    <h2 className="text-sm font-bold text-gray-700 mb-3">Inactive Mentees <span className="text-gray-400 font-normal">({inactiveList.length})</span></h2>
                    <div className="bg-white rounded-2xl border border-gray-200">
                        {/* Mobile card list */}
                        <div className="sm:hidden divide-y divide-gray-100">
                            {inactiveList.map((m) => (
                                <div key={m.id} className="p-4 flex flex-col gap-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{m.name}</p>
                                            <p className="text-xs text-gray-400">{m.assignedGroup}</p>
                                        </div>
                                        <span className={`inline-flex items-center whitespace-nowrap leading-none text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${reasonBadge(m.reason)}`}>{m.reason}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                        <span><span className="font-semibold text-gray-400">Inactive: </span>{m.dateInactive}</span>
                                        <span><span className="font-semibold text-gray-400">Last: </span>{m.lastModule}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const fake: import('@/lib/data').Mentee = {
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
                                            };
                                            setViewing(fake);
                                        }}
                                        className="self-start text-xs font-semibold text-[#D97706] hover:underline"
                                    >View Profile</button>
                                </div>
                            ))}
                            {inactiveList.length === 0 && (
                                <div className="p-10 text-center text-sm text-gray-400">No inactive mentees found.</div>
                            )}
                        </div>
                        {/* Desktop table */}
                        <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#f8f9fc] border-b border-gray-100 text-[10px] text-gray-400 uppercase tracking-widest">
                                    {['Name', 'Assigned Group', 'Date Became Inactive', 'Last Devotional Manual', 'Reason', 'Actions'].map(h => (
                                        <th key={h} className="px-2.5 first:pl-5 last:pr-5 py-3.5 text-left font-semibold">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {inactiveList.map((m) => (
                                    <tr key={m.id} className="hover:bg-[#f8f9fc] transition-colors">
                                        <td className="pl-6 pr-4 py-4 font-semibold text-gray-900">{m.name}</td>
                                        <td className="px-4 py-4 text-gray-500">{m.assignedGroup}</td>
                                        <td className="px-4 py-4 text-gray-500 whitespace-nowrap">{m.dateInactive}</td>
                                        <td className="px-4 py-4 text-gray-500">{m.lastModule}</td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center whitespace-nowrap leading-none text-xs font-semibold px-2.5 py-1 rounded-full ${reasonBadge(m.reason)}`}>{m.reason}</span>
                                        </td>
                                        <td className="pl-4 pr-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => {
                                                    const fake: import('@/lib/data').Mentee = {
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
                                                    };
                                                    setViewing(fake);
                                                }}
                                                className="text-xs text-gray-500 hover:underline font-medium"
                                            >View Profile</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                        {inactiveList.length === 0 && (
                            <div className="hidden sm:block p-10 text-center text-sm text-gray-400">No inactive mentees found.</div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

/* -- EndorsedTab --------------------------------------------------------------- */
function EndorsedTab() {
    const [viewingMembers, setViewingMembers] = useState<typeof ENDORSED_GROUPS[0] | null>(null);
    const [editingGroup, setEditingGroup] = useState<typeof ENDORSED_GROUPS[0] | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [viewingWorker, setViewingWorker] = useState<typeof ENDORSED_WORKERS[0] | null>(null);
    const [endorseMentee, setEndorseMentee] = useState<typeof ENDORSED_WORKERS[0] | null>(null);

    return (
        <>
            {viewingMembers && <EndorsedViewMembersModal group={viewingMembers} onClose={() => setViewingMembers(null)} />}
            {editingGroup && <EndorsedEditGroupModal group={editingGroup} onClose={() => setEditingGroup(null)} onSave={() => setEditingGroup(null)} />}
            {showCreate && <EndorsedCreateGroupModal onClose={() => setShowCreate(false)} onCreate={() => setShowCreate(false)} />}
            {viewingWorker && <MenteeProfileModal mentee={viewingWorker as unknown as import('@/lib/data').Mentee} onClose={() => setViewingWorker(null)} />}

            <div>
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Endorsed</h1>
                        <p className="text-sm text-gray-400 mt-1">Workers and groups you have endorsed for ministry.</p>
                    </div>
                    <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-[#D97706] hover:bg-[#B45309] text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                        New Group
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Total Endorsed</p>
                        <p className="text-4xl font-black text-[#e05c5c]">{ENDORSED_GROUPS.reduce((s, g) => s + g.members, 0) + ENDORSED_WORKERS.length}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Mentor Groups</p>
                        <p className="text-4xl font-black text-[#4DA6F5]">{ENDORSED_GROUPS.length}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Individual Mentors</p>
                        <p className="text-4xl font-black text-[#5CB85C]">{ENDORSED_WORKERS.length}</p>
                    </div>
                </div>

                {/* Groups */}
                <h2 className="text-sm font-bold text-gray-700 mb-3">Endorsed Groups <span className="text-gray-400 font-normal">({ENDORSED_GROUPS.length})</span></h2>
                <div className="grid gap-4 mb-8 items-stretch" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))' }}>
                    {ENDORSED_GROUPS.map((g) => (
                        <div key={g.id} className="h-full bg-white rounded-2xl border border-gray-200 p-5 flex flex-col justify-between gap-3">
                            <p className="font-bold text-gray-900 text-lg">{g.name}</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="rounded-xl px-3 py-2 text-center" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                                    <p className="text-lg font-black text-[#D97706]">{g.members}</p>
                                    <p className="text-gray-400 text-[10px]">Members</p>
                                </div>
                                <div className="rounded-xl px-3 py-2 text-center" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                                    <p className="text-lg font-black text-[#0284C7]">{g.progress}%</p>
                                    <p className="text-gray-400 text-[10px]">Progress</p>
                                </div>
                            </div>
                            <div className="mt-auto flex flex-wrap items-center gap-2">
                                <button onClick={() => setViewingMembers(g)} className="flex-1 px-3 text-xs font-semibold text-white py-2 rounded-lg bg-[#D97706] hover:bg-[#B45309] transition-colors">View Members</button>
                                <button onClick={() => setEditingGroup(g)} className="text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-2 rounded-lg hover:border-gray-300">Edit</button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Workers */}
                <h2 className="text-sm font-bold text-gray-700 mb-3">Endorsed Workers <span className="text-gray-400 font-normal">({ENDORSED_WORKERS.length})</span></h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {ENDORSED_WORKERS.map((w) => (
                        <div key={w.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0" style={{ background: '#D97706' }}>{w.initials}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 truncate">{w.name}</p>
                                    <p className="text-xs text-gray-400">{w.assignedGroup} · Since {w.endorsedSince}</p>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] text-gray-500">{w.currentModule}</span>
                                    <span className="text-[11px] font-semibold text-gray-700">{w.progress}%</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${w.progress}%`, background: '#D97706' }} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setViewingWorker(w)} className="text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-300">View Profile</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

/* ------------------------------------------------------------ */

/* -- Potential C2S Groups Tab (Mentor view) ------------------------------------ */
interface MentorHubApplication {
    id: string;
    name: string;
    barangay: string;
    phone: string;
    schedule: string;
    potential: number;
    submitted: string;
    status: 'Pending' | 'Approved' | 'Rejected';
}

const HUB_STATUS_STYLE_MENTOR: Record<string, string> = {
    'Pending': 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]',
    'Approved': 'bg-[#16a34a] text-white',
    'Rejected': 'bg-[#dc2626] text-white',
};

function MentorPotentialC2STab() {
    const [apps, setApps] = useState<MentorHubApplication[]>([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
    const [viewing, setViewing] = useState<MentorHubApplication | null>(null);

    function load() {
        try {
            const stored = JSON.parse(localStorage.getItem(HUB_APPLICATIONS_KEY) ?? '[]') as MentorHubApplication[];
            setApps(stored);
        } catch { setApps([]); }
    }

    useEffect(() => {
        load();
        const handler = () => load();
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    const filtered = apps.filter(a => {
        const s = search.toLowerCase();
        return (filter === 'All' || a.status === filter) &&
            (a.name.toLowerCase().includes(s) || a.barangay.toLowerCase().includes(s));
    });

    return (
        <div>
            {/* Detail slide-over */}
            {viewing && (
                <>
                    <div className="fixed inset-0 z-[9999] bg-black/50" onClick={() => setViewing(null)} />
                    <div className="fixed top-0 right-0 bottom-0 z-[10000] w-[420px] max-w-full bg-white shadow-2xl flex flex-col overflow-hidden">
                        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">C2S Home Applicants</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Submitted {viewing.submitted}</p>
                            </div>
                            <button onClick={() => setViewing(null)} className="text-gray-400 hover:text-gray-700 p-1">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#D97706] font-black text-lg shrink-0">
                                    {viewing.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-gray-900 text-base">{viewing.name}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${HUB_STATUS_STYLE_MENTOR[viewing.status]}`}>{viewing.status}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">{viewing.barangay} · {viewing.phone}</p>
                                </div>
                            </div>
                            <section className="rounded-xl border border-gray-100 overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
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
                    </div>
                </>
            )}

            <div className="mb-6">
                <h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Potential C2S Groups</h1>
                <p className="text-sm text-gray-400 mt-1">Applications to host a Connect2Souls devotion hub.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="relative w-full sm:w-64">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" /></svg>
                    <input type="text" placeholder="Search name or barangay..." value={search} onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97706] w-full bg-white" />
                </div>
                <CustomSelect
                    value={filter}
                    onChange={e => setFilter(e.target.value as any)}
                    className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#D97706] min-w-[140px]"
                >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </CustomSelect>
                <span className="text-xs text-gray-400 sm:ml-auto">{filtered.length} application{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
                    <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
                    <p className="text-sm text-gray-400 font-medium">No applications yet</p>
                    <p className="text-xs text-gray-300 mt-1">C2S Home Applicants from C2S Finder will appear here.</p>
                </div>
            ) : (
                <>
                    {/* Mobile card list */}
                    <div className="sm:hidden bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
                        {filtered.map(a => (
                            <div key={a.id} className="p-4 flex flex-col gap-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#D97706] text-[10px] font-black shrink-0">
                                            {a.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">{a.name}</p>
                                            <p className="text-[10px] text-gray-400">{a.phone}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${HUB_STATUS_STYLE_MENTOR[a.status]}`}>{a.status}</span>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                    <span><span className="font-semibold text-gray-400">Brgy: </span>{a.barangay}</span>
                                    <span><span className="font-semibold text-gray-400">Sched: </span>{a.schedule}</span>
                                    <span><span className="font-semibold text-gray-400">Potential: </span>{a.potential}</span>
                                    <span><span className="font-semibold text-gray-400">Date: </span>{a.submitted}</span>
                                </div>
                                <button onClick={() => setViewing(a)} className="self-start text-xs font-semibold text-[#D97706] hover:underline">View Details</button>
                            </div>
                        ))}
                    </div>
                    {/* Desktop table */}
                    <div className="hidden sm:block bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#f8f9fc] border-b border-gray-100 text-[10px] text-gray-400 uppercase tracking-widest">
                                    {['Applicant', 'Barangay', 'Schedule', 'Potential', 'Date', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="px-2.5 first:pl-5 last:pr-5 py-3 text-left font-semibold">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map(a => (
                                    <tr key={a.id} className="hover:bg-[#f8f9fc] transition-colors">
                                        <td className="pl-6 pr-4 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#D97706] text-[10px] font-black shrink-0">
                                                    {a.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-xs">{a.name}</p>
                                                    <p className="text-[10px] text-gray-400">{a.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-gray-600">{a.barangay}</td>
                                        <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">{a.schedule}</td>
                                        <td className="px-4 py-3.5 text-xs text-gray-600 text-center whitespace-nowrap">{a.potential}</td>
                                        <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{a.submitted}</td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <span className={`inline-flex items-center whitespace-nowrap leading-none text-[10px] font-semibold px-2.5 py-1 rounded-full ${HUB_STATUS_STYLE_MENTOR[a.status]}`}>{a.status}</span>
                                        </td>
                                        <td className="pl-4 pr-6 py-3.5 whitespace-nowrap">
                                            <button onClick={() => setViewing(a)} className="text-[11px] font-semibold text-[#D97706] hover:underline">View</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function MentorDashboard() {
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'my-groups' | 'potential-mentees' | 'mentees' | 'endorsed' | 'potential-c2s-groups'>('dashboard');
    const [pmSearch, setPmSearch] = useState('');
    const [pmSourceFilter, setPmSourceFilter] = useState<'All' | 'Group Finder' | 'Recommended'>('All');
    const [pmReminderDismissed, setPmReminderDismissed] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [settingsSection, setSettingsSection] = useState<MySettingsSection | null>(null);
    useScrollToTop(`${activeTab}:${settingsSection ?? ''}`);
    const [viewingGroup, setViewingGroup] = useState<C2SGroup | null>(null);
    const [editingGroup, setEditingGroup] = useState<C2SGroup | null>(null);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [localMentees, setLocalMentees] = useState<PotentialMentee[]>([]);
    const [acceptedMentees, setAcceptedMentees] = useState<import('@/lib/data').Mentee[]>([]);
    const [sessionAddedMentees, setSessionAddedMentees] = useState<import('@/lib/data').Mentee[]>([]);
    const [acceptedPotentialIds, setAcceptedPotentialIds] = useState<Set<string>>(new Set());

    // Load saved sign-ups and accepted mentees from localStorage on mount
    useEffect(() => {
        try {
            const saved: PotentialMentee[] = JSON.parse(localStorage.getItem('c2s_potential_mentees') ?? '[]');
            setLocalMentees(saved);
        } catch { /* ignore */ }

        try {
            const saved: import('@/lib/data').Mentee[] = JSON.parse(localStorage.getItem(ACTIVE_MENTEES_STORAGE_KEY) ?? '[]');
            setAcceptedMentees(saved);
        } catch { /* ignore */ }

        try {
            const saved: string[] = JSON.parse(localStorage.getItem('c2s_accepted_ids') ?? '[]');
            setAcceptedPotentialIds(new Set(saved));
        } catch { /* ignore */ }

        // Listen for changes from other tabs
        const handler = () => {
            try {
                const saved: PotentialMentee[] = JSON.parse(localStorage.getItem('c2s_potential_mentees') ?? '[]');
                setLocalMentees(saved);
            } catch { /* ignore */ }
            try {
                const saved: import('@/lib/data').Mentee[] = JSON.parse(localStorage.getItem(ACTIVE_MENTEES_STORAGE_KEY) ?? '[]');
                setAcceptedMentees(saved);
            } catch { /* ignore */ }
            try {
                const saved: string[] = JSON.parse(localStorage.getItem('c2s_accepted_ids') ?? '[]');
                setAcceptedPotentialIds(new Set(saved));
            } catch { /* ignore */ }
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    // When a potential mentee is accepted, convert and persist them
    function handleMenteeAccepted(pm: PotentialMentee) {
        const newMentee = potentialMenteeToMentee(pm);

        // Mark this potential mentee as accepted (so it's removed from the list)
        setAcceptedPotentialIds((prev) => {
            const updated = new Set(prev);
            updated.add(pm.id);
            try { localStorage.setItem('c2s_accepted_ids', JSON.stringify([...updated])); } catch { /* ignore */ }
            return updated;
        });

        setAcceptedMentees((prev) => {
            if (prev.some((m) => m.id === newMentee.id)) return prev;
            const updated = [...prev, newMentee];
            try { localStorage.setItem(ACTIVE_MENTEES_STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
            return updated;
        });
    }

    // Merge static seed data with locally-saved sign-ups, then filter out accepted ones
    const allPotentialMentees = [...POTENTIAL_MENTEES, ...localMentees].filter(
        (m) => !acceptedPotentialIds.has(m.id)
    );
    const allActiveMentees = [...sessionAddedMentees, ...ACTIVE_MENTEES, ...acceptedMentees];

    const [sessionCreatedGroups, setSessionCreatedGroups] = useState<C2SGroup[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem('c2s_mentor_created_groups');
            if (stored) return JSON.parse(stored);
        } catch { /* ignore */ }
        return [];
    });
    const [deletedGroupIds, setDeletedGroupIds] = useState<string[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem('c2s_mentor_deleted_groups');
            if (stored) return JSON.parse(stored);
        } catch { /* ignore */ }
        return [];
    });
    const [groupToast, setGroupToast] = useState<string | null>(null);

    function handleCreateGroup(newGrp: any) {
        const newGroupObj: C2SGroup = {
            id: `grp-${Date.now()}`,
            name: newGrp.name,
            description: newGrp.description || 'Discipleship & Fellowship Group',
            tags: [
                { label: newGrp.groupType || 'Young Adults', color: 'bg-[#FEF3C7] text-[#D97706]' },
                { label: newGrp.conduct || 'Church base', color: 'bg-green-100 text-green-700' },
            ],
            ageGroup: 'Young Adults',
            leader: user?.name || 'Juan Dela Cruz',
            location: newGrp.barangay || newGrp.subdivision || newGrp.satellite || 'Main Campus',
            barangay: newGrp.barangay || 'Zone IV',
            schedule: `${newGrp.meetingDay} · ${newGrp.meetingTime}`,
            meetupDay: newGrp.meetingDay,
            ageRange: newGrp.ageGroup || '18-25',
            status: (newGrp.status === 'Open' ? 'Open' : 'Closed') as any,
            lat: 14.3294,
            lng: 120.9367,
            satellite: newGrp.satellite,
            satelliteId: newGrp.satelliteId,
            satelliteName: newGrp.satelliteName || newGrp.satellite,
        };

        setSessionCreatedGroups((prev) => {
            const updated = [newGroupObj, ...prev];
            try { localStorage.setItem('c2s_mentor_created_groups', JSON.stringify(updated)); } catch { /* ignore */ }
            return updated;
        });
        setGroupToast('Group successfully created.');
        setShowCreateGroup(false);
        setTimeout(() => setGroupToast(null), 4000);
    }

    function handleSaveEditedGroup(updated: C2SGroup) {
        setSessionCreatedGroups((prev) => {
            const index = prev.findIndex((g) => g.id === updated.id);
            if (index >= 0) {
                const list = [...prev];
                list[index] = updated;
                try { localStorage.setItem('c2s_mentor_created_groups', JSON.stringify(list)); } catch { /* ignore */ }
                return list;
            }
            const merged = [updated, ...prev];
            try { localStorage.setItem('c2s_mentor_created_groups', JSON.stringify(merged)); } catch { /* ignore */ }
            return merged;
        });
        setEditingGroup(null);
        setGroupToast('Group updated successfully.');
        setTimeout(() => setGroupToast(null), 3000);
    }

    async function handleDeleteGroup(group: C2SGroup) {
        const ok = await confirm({
            title: 'Delete Group?',
            description: `Are you sure you want to delete "${group.name}"? This will remove the group from your active list.`,
            confirmLabel: 'Delete Group',
            cancelLabel: 'Cancel',
            variant: 'danger',
        });
        if (!ok) return;

        setSessionCreatedGroups((prev) => {
            const filtered = prev.filter((g) => g.id !== group.id);
            try { localStorage.setItem('c2s_mentor_created_groups', JSON.stringify(filtered)); } catch { /* ignore */ }
            return filtered;
        });
        setDeletedGroupIds((prev) => {
            if (prev.includes(group.id)) return prev;
            const updated = [...prev, group.id];
            try { localStorage.setItem('c2s_mentor_deleted_groups', JSON.stringify(updated)); } catch { /* ignore */ }
            return updated;
        });
        setGroupToast('Group deleted successfully.');
        setTimeout(() => setGroupToast(null), 3000);
    }

    // Groups this mentor leads (matched by group name + created groups, excluding deleted ones)
    const baseMyGroups = C2S_GROUPS.filter((g) => g.name === user?.group);
    const myGroups = [
        ...sessionCreatedGroups,
        ...baseMyGroups.filter((bg) => !sessionCreatedGroups.some((cg) => cg.id === bg.id || cg.name === bg.name)),
    ].filter((g) => !deletedGroupIds.includes(g.id));

    return (
        <div className="min-h-screen dashboard-shell overflow-x-hidden" style={{ background: 'var(--bg-page)' }}>

            {/* View Members modal */}
            {viewingGroup && (
                <ViewMembersModal group={viewingGroup} onClose={() => setViewingGroup(null)} />
            )}

            {/* Edit Group modal */}
            {editingGroup && (
                <EditGroupModal
                    group={editingGroup}
                    onClose={() => setEditingGroup(null)}
                    onSave={handleSaveEditedGroup}
                    onDelete={() => {
                        const targetGroup = editingGroup;
                        setEditingGroup(null);
                        void handleDeleteGroup(targetGroup);
                    }}
                />
            )}

            {/* Create Group modal */}
            {showCreateGroup && (
                <CreateGroupModal
                    onClose={() => setShowCreateGroup(false)}
                    onCreate={handleCreateGroup}
                />
            )}


            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            {/* ── Left Sidebar (full viewport height with brand header) ── */}
            <aside className={`sidebar-nav ${sidebarCollapsed ? 'w-72 md:w-[68px]' : 'w-72'} border-r border-gray-200 flex flex-col pt-0 pb-4 fixed top-0 bottom-0 left-0 ${sidebarOpen ? 'z-50 translate-x-0' : 'z-40 -translate-x-full md:translate-x-0'} transition-all duration-200`}>
                <SidebarBrandHeader collapsed={sidebarCollapsed} />

                {/* MENU label + collapse toggle */}
                <div className={`flex items-center pt-4 mb-3 ${sidebarCollapsed ? 'justify-between px-5 md:justify-center md:px-0 md:mb-2' : 'justify-between px-4'}`}>
                    <p className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest ${sidebarCollapsed ? 'md:hidden' : ''}`}>Menu</p>
                    <SidebarCollapseButton collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} />
                </div>

                {/* Nav items */}
                <SidebarNavList
                    entries={[
                        {
                            kind: 'item',
                            item: {
                                key: 'dashboard',
                                label: 'Dashboard',
                                icon: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zm-2-4H10v-2h8v2zm-4 4H10v-2h4v2zm4-8H10V6h8v2z',
                            },
                        },
                        {
                            kind: 'item',
                            item: {
                                key: 'my-groups',
                                label: 'My Groups',
                                icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
                                badge: myGroups.length,
                            },
                        },
                        {
                            kind: 'item',
                            item: {
                                key: 'potential-c2s-groups',
                                label: 'Potential C2S Groups',
                                icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
                            },
                        },
                        {
                            kind: 'group',
                            group: {
                                id: 'mentees',
                                label: 'Mentees',
                                icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
                                items: [
                                    {
                                        key: 'potential-mentees',
                                        label: 'Potential Mentees',
                                        icon: 'M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
                                        badge: allPotentialMentees.length,
                                    },
                                    {
                                        key: 'mentees',
                                        label: 'Mentees',
                                        icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
                                        badge: allActiveMentees.length,
                                    },
                                    {
                                        key: 'endorsed',
                                        label: 'Endorsed',
                                        icon: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z',
                                        badge: ENDORSED_WORKERS.length + ENDORSED_GROUPS.reduce((s, g) => s + g.members, 0),
                                    },
                                ],
                            },
                        },
                    ] as SidebarNavEntry[]}
                    activeKey={!settingsSection ? activeTab : null}
                    collapsed={sidebarCollapsed}
                    onSelect={(key) => {
                        setActiveTab(key as typeof activeTab);
                        setSettingsSection(null);
                        setSidebarOpen(false);
                    }}
                />

                {/* Settings dropdown at bottom of sidebar */}
                <SidebarSettingsDropdown
                    activeSection={settingsSection}
                    collapsed={sidebarCollapsed}
                    onExpandSidebar={() => setSidebarCollapsed(false)}
                    onSelect={(sec) => { setSettingsSection(sec); setSidebarOpen(false); }}
                />
            </aside>

            {/* â”€â”€ Main content â”€â”€ */}
            <div className={`${sidebarCollapsed ? 'md:ml-[68px]' : 'md:ml-72'} flex-1 pb-16 min-w-0 transition-[margin] duration-200`}>

                <DashboardTopHeader
                    pageTitle={settingsSection ? 'Settings' : activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'my-groups' ? 'My Groups' : activeTab === 'potential-mentees' ? 'Potential Mentees' : activeTab === 'mentees' ? 'Mentees' : activeTab === 'endorsed' ? 'Endorsed' : 'Potential C2S Groups'}
                    onOpenMenu={() => setSidebarOpen(true)}
                />

                {/* Content with padding */}
                <div className="pt-4 md:pt-6 px-4 sm:px-6">
                    {settingsSection ? (
                        <SettingsPageView section={settingsSection} />
                    ) : (
                        <>
                            {/* Title â€” only shown on dashboard tab */}
                            {activeTab === 'dashboard' && (
                                <div className="mb-5">
                                    <h1 className="text-2xl font-black text-gray-900">Connect 2 Souls</h1>
                                    <p className="text-sm text-gray-400 mt-0.5">
                                        Connect, disciple and guide souls on their spiritual journey through meaningful relationships and faithful follow-up.
                                    </p>
                                </div>
                            )}

                            {/* ── My Groups Tab ── */}
                            {activeTab === 'my-groups' && (
                                <div className="w-full max-w-full overflow-x-hidden">
                                    {/* Toast Notification */}
                                    {groupToast && (
                                        <div
                                            role="status"
                                            aria-live="polite"
                                            className="fixed bottom-6 right-6 z-[10000] flex items-center gap-3 bg-white border border-gray-200 shadow-2xl rounded-2xl px-5 py-3.5 animate-in fade-in slide-in-from-bottom-4 duration-300"
                                            style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 leading-tight">Success</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{groupToast}</p>
                                            </div>
                                            <button
                                                onClick={() => setGroupToast(null)}
                                                className="ml-2 text-gray-400 hover:text-gray-700 p-1 text-base leading-none transition-colors"
                                                aria-label="Dismiss toast"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    )}

                                    {/* Header row */}
                                    <div className="flex flex-wrap items-start justify-between gap-4 mb-8 w-full max-w-full">
                                        <div className="min-w-0 flex-1">
                                            <h1 className="text-[1.6rem] font-semibold text-[#292524] leading-tight">Connect 2 Souls</h1>
                                            <p className="text-sm text-[#6B665F] mt-1 whitespace-normal break-words">
                                                Connect, disciple and guide souls on their spiritual journey through meaningful relationships and faithful follow-up.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setShowCreateGroup(true)}
                                            className="inline-flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm shrink-0 whitespace-nowrap"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                                            Create Group
                                        </button>
                                    </div>

                                    {myGroups.length === 0 ? (
                                        <div className="bg-white rounded-2xl border border-[#E7E5E4] p-12 text-center shadow-sm">
                                            <p className="font-semibold text-[#292524] text-sm">No groups assigned yet</p>
                                            <p className="text-xs text-[#6B665F] mt-1">Contact the department head to get assigned to a group.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                                            {myGroups.map((group) => {
                                                // Merge group members from active mentees & seeded GROUP_MEMBERS (deduplicated by name)
                                                const activeForGroup = allActiveMentees.filter((m) => m.assignedGroup === group.name);
                                                const staticMembers = GROUP_MEMBERS[group.name] ?? [];
                                                const seenNames = new Set<string>();
                                                const memberRoster: { id: string; initials: string; name: string }[] = [];
                                                for (const m of activeForGroup) {
                                                    const key = m.name.trim().toLowerCase();
                                                    if (!seenNames.has(key)) {
                                                        seenNames.add(key);
                                                        memberRoster.push({ id: m.id, initials: m.initials, name: m.name });
                                                    }
                                                }
                                                for (const m of staticMembers) {
                                                    const key = m.name.trim().toLowerCase();
                                                    if (!seenNames.has(key)) {
                                                        seenNames.add(key);
                                                        memberRoster.push({ id: m.id, initials: m.initials, name: m.name });
                                                    }
                                                }
                                                const memberCount = memberRoster.length;
                                                const capacity = 10;
                                                const progressPct = Math.min(100, Math.round((memberCount / capacity) * 100));
                                                const visibleAvatars = memberRoster.slice(0, 4);
                                                const overflowCount = Math.max(0, memberCount - 4);

                                                return (
                                                    <div key={group.id} className="h-full bg-white rounded-2xl border border-[#E7E5E4] p-6 flex flex-col justify-between gap-5 shadow-sm transition-colors">
                                                        <div className="space-y-4">
                                                            {/* Top row: Category pills + Open badge */}
                                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                                                    {group.tags.map((t, idx) => {
                                                                        const pillClass = idx === 0
                                                                            ? 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]'
                                                                            : t.color.includes('FEF3C7') || t.color.includes('D97706')
                                                                                ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                                                                                : 'bg-[#FCE7F3] text-[#9D174D] border border-[#FBCFE8]';
                                                                        return (
                                                                            <span
                                                                                key={t.label}
                                                                                data-pill="true"
                                                                                className={`inline-flex items-center whitespace-nowrap text-xs font-semibold px-3 py-1 rounded-full ${pillClass}`}
                                                                            >
                                                                                {t.label}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                                <span
                                                                    data-pill="true"
                                                                    className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${
                                                                        group.status === 'Open'
                                                                            ? 'bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]'
                                                                            : 'bg-[#F5F2EC] text-[#6B665F] border border-[#E7E5E4]'
                                                                    }`}
                                                                >
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${group.status === 'Open' ? 'bg-[#16A34A]' : 'bg-[#6B665F]'}`} />
                                                                    {group.status}
                                                                </span>
                                                            </div>

                                                            {/* Title & 2-line Description */}
                                                            <div>
                                                                <h3 className="text-xl font-bold text-[#292524] leading-snug">{group.name}</h3>
                                                                <p className="text-sm text-[#6B665F] leading-relaxed line-clamp-2 mt-1.5">{group.description}</p>
                                                            </div>

                                                            {/* Satellite Church Info */}
                                                            {(group.satelliteName || group.satellite) && (
                                                                <div className="flex items-center gap-2 text-xs font-semibold text-[#92400E] bg-[#FEF3C7] px-3 py-2 rounded-xl border border-[#FDE68A]">
                                                                    <svg className="w-4 h-4 shrink-0 text-[#D97706]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                                                    </svg>
                                                                    <span>
                                                                        Satellite: <span className="font-bold">{group.satelliteName || group.satellite}</span>
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* Warm Sand Details & Capacity Strip */}
                                                            <div className="bg-[#F5F2EC] rounded-xl p-4 space-y-3 border border-[#E7E5E4]">
                                                                <div className="flex flex-col gap-3">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className="w-8 h-8 rounded-lg bg-white border border-[#E7E5E4] flex items-center justify-center text-[#D97706] shrink-0">
                                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                                                <circle cx="12" cy="10" r="3" />
                                                                            </svg>
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B665F]">Location</p>
                                                                            <p className="text-sm font-semibold text-[#292524] break-words">{group.location}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className="w-8 h-8 rounded-lg bg-white border border-[#E7E5E4] flex items-center justify-center text-[#D97706] shrink-0">
                                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                                                <line x1="3" y1="10" x2="21" y2="10" />
                                                                            </svg>
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B665F]">Schedule</p>
                                                                            <p className="text-sm font-semibold text-[#292524] break-words">{group.schedule}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="border-t border-[#E7E5E4] pt-3 space-y-2.5">
                                                                    <div className="flex items-center justify-between gap-3">
                                                                        {memberCount > 0 ? (
                                                                            <div className="flex items-center -space-x-2 shrink-0">
                                                                                {visibleAvatars.map((m) => (
                                                                                    <div
                                                                                        key={m.id}
                                                                                        title={m.name}
                                                                                        className="w-6 h-6 rounded-full bg-[#D97706] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[#F5F2EC]"
                                                                                    >
                                                                                        {m.initials}
                                                                                    </div>
                                                                                ))}
                                                                                {overflowCount > 0 && (
                                                                                    <div className="w-6 h-6 rounded-full bg-[#1B2432] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[#F5F2EC]">
                                                                                        +{overflowCount}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-xs font-medium text-[#6B665F]">No active mentees yet</span>
                                                                        )}
                                                                        <span className="text-xs font-bold text-[#292524] whitespace-nowrap shrink-0">
                                                                            {memberCount} / {capacity} Members
                                                                        </span>
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <p className="text-xs font-medium text-[#6B665F]">Active Mentees</p>
                                                                        <div className="w-full h-2 rounded-full bg-[#E7E5E4] overflow-hidden">
                                                                            <div
                                                                                className="h-full rounded-full bg-[#D97706] transition-all duration-300"
                                                                                style={{ width: `${progressPct}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Card Footer Actions */}
                                                        <div className="mt-auto flex items-center gap-2.5 pt-1">
                                                            <button
                                                                onClick={() => setViewingGroup(group)}
                                                                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded-xl py-2.5 px-4 font-medium text-sm transition-colors shadow-sm whitespace-nowrap"
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                    <circle cx="12" cy="12" r="3" />
                                                                </svg>
                                                                View Members
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingGroup(group)}
                                                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E7E5E4] text-[#292524] hover:bg-[#F5F2EC] font-medium text-sm transition-colors shrink-0 whitespace-nowrap"
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                                </svg>
                                                                Edit
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* â”€â”€ Potential Mentees Tab â”€â”€ */}
                            {activeTab === 'potential-mentees' && (() => {
                                const q = pmSearch.trim().toLowerCase();
                                const filteredPotentialMentees = allPotentialMentees.filter((m) => {
                                    const matchesSource =
                                        pmSourceFilter === 'All' ||
                                        (pmSourceFilter === 'Group Finder' && m.source === 'From C2S Group Finder') ||
                                        (pmSourceFilter === 'Recommended' && m.source === 'Recommended');
                                    const matchesSearch =
                                        !q ||
                                        m.name.toLowerCase().includes(q) ||
                                        m.requestedGroup.toLowerCase().includes(q) ||
                                        m.phone.toLowerCase().includes(q) ||
                                        m.notes.toLowerCase().includes(q);
                                    return matchesSource && matchesSearch;
                                });

                                return (
                                    <div className="w-full max-w-full overflow-x-hidden">
                                        {/* Header */}
                                        <div className="mb-5">
                                            <h1 className="text-[1.6rem] font-black text-[#292524] leading-tight">Connect 2 Souls</h1>
                                            <p className="text-sm text-[#6B665F] mt-1">
                                                Connect, disciple and guide souls on their spiritual journey through meaningful relationships and faithful follow-up.
                                            </p>
                                        </div>

                                        {/* Slim Reminder banner with Got it dismiss */}
                                        {!pmReminderDismissed && (
                                            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 bg-[#FEF3C7] border border-[#F59E0B] rounded-xl px-4 py-2.5 mb-5">
                                                <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                                                    <svg className="w-4 h-4 text-[#92400E] shrink-0 mt-0.5 sm:mt-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                                                    </svg>
                                                    <p className="text-xs text-[#92400E] leading-snug">
                                                        <span className="font-bold">Reminder:</span> Mentors should personally meet the potential mentee before accepting the mentoring request to ensure readiness for discipleship.
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setPmReminderDismissed(true)}
                                                    className="px-3 py-1 rounded-lg bg-white/85 hover:bg-white border border-[#F59E0B]/50 text-[#92400E] text-xs font-semibold shrink-0 transition-colors cursor-pointer whitespace-nowrap"
                                                >
                                                    Got it
                                                </button>
                                            </div>
                                        )}

                                        {/* Compact Search & Source Filter Pills */}
                                        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                                            <div className="relative w-full sm:w-72">
                                                <svg className="w-4 h-4 text-[#6B665F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                    <circle cx="11" cy="11" r="8" />
                                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                                </svg>
                                                <input
                                                    type="text"
                                                    value={pmSearch}
                                                    onChange={(e) => setPmSearch(e.target.value)}
                                                    placeholder="Search potential mentees..."
                                                    className="w-full bg-white border border-[#E7E5E4] rounded-xl pl-9 pr-3 py-2 text-sm text-[#292524] placeholder:text-[#6B665F] focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#FEF3C7] transition-colors"
                                                />
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {(['All', 'Group Finder', 'Recommended'] as const).map((pill) => {
                                                    const active = pmSourceFilter === pill;
                                                    return (
                                                        <button
                                                            key={pill}
                                                            type="button"
                                                            onClick={() => setPmSourceFilter(pill)}
                                                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap cursor-pointer ${
                                                                active
                                                                    ? 'bg-[#D97706] text-white border-[#D97706] shadow-sm'
                                                                    : 'bg-white text-[#292524] border-[#E7E5E4] hover:bg-[#F5F2EC]'
                                                            }`}
                                                        >
                                                            {pill}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Cards grid */}
                                        {filteredPotentialMentees.length === 0 ? (
                                            <div className="bg-white rounded-2xl border border-[#E7E5E4] p-10 text-center shadow-sm">
                                                <p className="text-sm font-semibold text-[#292524]">No potential mentees found</p>
                                                <p className="text-xs text-[#6B665F] mt-1">Try adjusting your search or filter selection.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                                                {filteredPotentialMentees.map((mentee) => (
                                                    <PotentialMenteeCard key={mentee.id} mentee={mentee} onAccepted={handleMenteeAccepted} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* ── Mentees Tab ── */}
                            {activeTab === 'mentees' && (
                                <MenteesTab
                                    activeMentees={allActiveMentees}
                                    onAddMentee={(newMentee) => setSessionAddedMentees(prev => [newMentee, ...prev])}
                                    userGroup={user?.group}
                                />
                            )}

                            {/* â”€â”€ Endorsed Tab â”€â”€ */}
                            {activeTab === 'endorsed' && (
                                <EndorsedTab />
                            )}

                            {/* Potential C2S Groups Tab */}
                            {activeTab === 'potential-c2s-groups' && (
                                <MentorPotentialC2STab />
                            )}

                            {/* â”€â”€ Dashboard Tab â”€â”€ */}
                            {activeTab === 'dashboard' && <>
                                {/* Stat cards */}
                                <div className="grid grid-cols-2 gap-4 mb-5">
                                    {[
                                        { label: 'Workers', value: 3455, sub: 'Across all departments', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="#6aabf7"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg> },
                                        { label: 'Mentors', value: 717, sub: 'Active discipleship mentors', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="#f07070"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" /></svg> },
                                        { label: 'Mentees', value: 2765, sub: 'Church-wide C2S mentees', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="#5cb85c"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg> },
                                        { label: 'C2S Groups', value: 179, sub: 'Church & community based', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="#f5a623"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg> },
                                    ].map((s) => (
                                        <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col justify-between min-h-[160px]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                            <div className="flex items-start justify-between">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.label}</span>
                                                <span className="opacity-80">{s.icon}</span>
                                            </div>
                                            <div><p className="text-[2.6rem] font-normal text-gray-900 leading-none mb-1.5">{s.value.toLocaleString()}</p><p className="text-sm text-gray-400 leading-snug">{s.sub}</p></div>
                                        </div>
                                    ))}
                                </div>

                                {/* Combined Workers + Mentors chart */}
                                <WorkersMentorsChart />

                                {/* Mentees by Department */}
                                <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                    <h2 className="font-bold text-gray-900 text-base mb-0.5">Mentees by Department</h2>
                                    <p className="text-xs text-gray-400 mb-6">Mentee delivery mode across departments.</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'var(--bg-highlight)' }}>
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="#6aabf7"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 mb-0.5">Face-to-Face</p>
                                                <p className="text-[2rem] font-normal text-gray-900 leading-none">{MENTEES_F2F.toLocaleString()}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{Math.round(MENTEES_F2F / MENTEES_TOTAL * 100)}% of all mentees</p>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'var(--bg-highlight)' }}>
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="#f07070"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 mb-0.5">Online</p>
                                                <p className="text-[2rem] font-normal text-gray-900 leading-none">{MENTEES_ONLINE.toLocaleString()}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{Math.round(MENTEES_ONLINE / MENTEES_TOTAL * 100)}% of all mentees</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-gray-100">
                                        <table className="w-full table-fixed">
                                            <colgroup>
                                                <col className="w-[40%]" />
                                                <col className="w-[20%]" />
                                                <col className="w-[20%]" />
                                                <col className="w-[20%]" />
                                            </colgroup>
                                            <thead><tr style={{ background: 'var(--bg-highlight)' }}>
                                                <th className="pl-3 pr-2 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Department</th>
                                                <th className="px-2 py-3 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">F2F</th>
                                                <th className="px-2 py-3 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">Online</th>
                                                <th className="pl-2 pr-4 py-3 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total</th>
                                            </tr></thead>
                                            <tbody>
                                                {MENTEES_BY_DEPT.map((row) => (
                                                    <tr key={row.dept} className="table-body-row">
                                                        <td className="pl-3 pr-2 py-3.5 text-sm font-semibold text-gray-700">{row.dept}</td>
                                                        <td className="px-2 py-3.5 text-sm text-gray-500 text-center">{row.f2f}</td>
                                                        <td className="px-2 py-3.5 text-sm text-gray-500 text-center">{row.online}</td>
                                                        <td className="pl-2 pr-4 py-3.5 text-sm text-gray-500 text-right">{row.total}</td>
                                                    </tr>
                                                ))}
                                                <tr className="table-total-row">
                                                    <td className="pl-3 pr-2 py-3.5 text-sm font-black text-gray-800">Total</td>
                                                    <td className="px-2 py-3.5 text-sm font-bold text-gray-700 text-center">{MENTEES_F2F.toLocaleString()}</td>
                                                    <td className="px-2 py-3.5 text-sm font-bold text-gray-700 text-center">{MENTEES_ONLINE.toLocaleString()}</td>
                                                    <td className="pl-2 pr-4 py-3.5 text-sm font-bold text-gray-700 text-right">{MENTEES_TOTAL.toLocaleString()}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* C2S Groups */}
                                <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                    <h2 className="font-bold text-gray-900 text-base mb-0.5">C2S Groups</h2>
                                    <p className="text-xs text-gray-400 mb-6">Where discipleship groups meet.</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'var(--bg-highlight)' }}>
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="#6aabf7"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12V11c0 4.52-3.05 8.74-7 9.93-3.95-1.19-7-5.41-7-9.93V6.3l7-3.12z" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 mb-0.5">Church-based</p>
                                                <p className="text-[2rem] font-normal text-gray-900 leading-none">{C2S_CHURCH}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">Meeting in COG Satellite Churches</p>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'var(--bg-highlight)' }}>
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="#5cb85c"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 mb-0.5">Community-based</p>
                                                <p className="text-[2rem] font-normal text-gray-900 leading-none">{C2S_COMMUNITY}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">Meeting in barangays &amp; homes</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-gray-100">
                                        <table className="w-full table-fixed">
                                            <colgroup>
                                                <col className="w-[40%]" />
                                                <col className="w-[20%]" />
                                                <col className="w-[20%]" />
                                                <col className="w-[20%]" />
                                            </colgroup>
                                            <thead><tr className="table-header-row">
                                                <th className="pl-3 pr-2 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Department</th>
                                                <th className="px-2 py-3 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">Church</th>
                                                <th className="px-2 py-3 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">Community</th>
                                                <th className="pl-2 pr-4 py-3 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total</th>
                                            </tr></thead>
                                            <tbody>
                                                {C2S_GROUPS_BY_DEPT.map((row) => (
                                                    <tr key={row.dept} className="table-body-row">
                                                        <td className="pl-3 pr-2 py-3.5 text-sm font-semibold text-gray-700">{row.dept}</td>
                                                        <td className="px-2 py-3.5 text-sm text-gray-500 text-center">{row.church}</td>
                                                        <td className="px-2 py-3.5 text-sm text-gray-500 text-center">{row.community}</td>
                                                        <td className="pl-2 pr-4 py-3.5 text-sm text-gray-500 text-right">{row.total}</td>
                                                    </tr>
                                                ))}
                                                <tr className="table-total-row">
                                                    <td className="pl-3 pr-2 py-3.5 text-sm font-black text-gray-800">Total</td>
                                                    <td className="px-2 py-3.5 text-sm font-bold text-gray-700 text-center">{C2S_CHURCH}</td>
                                                    <td className="px-2 py-3.5 text-sm font-bold text-gray-700 text-center">{C2S_COMMUNITY}</td>
                                                    <td className="pl-2 pr-4 py-3.5 text-sm font-bold text-gray-700 text-right">{C2S_TOTAL_ALL}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>}
                        </>
                        )}
                        </div>
                </div>
            </div>
            );
}

            // ── CLUSTER HEAD REPORTS CHARTS ── rendered here so recharts resolves correctly



            const CH_TS = {borderRadius: '10px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,.10)', fontSize: '12px', padding: '8px 14px' };

            type CHReportTab = 'mentor' | 'coordinator' | 'barangay' | 'growth';

            function CHReportsCharts() {
    const [tab, setTab] = useState<CHReportTab>('mentor');
                const tabs: {key: CHReportTab; label: string }[] = [
                {key: 'mentor', label: 'Per Mentor' },
                {key: 'coordinator', label: 'Per Coordinator' },
                {key: 'barangay', label: 'Per Barangay' },
                {key: 'growth', label: 'Monthly Growth' },
                ];
                return (
                <div>
                    <div className="flex items-center gap-2 mb-5">
                        {tabs.map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)}
                                className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors ${tab === t.key ? 'bg-[#D97706] text-white border-[#D97706]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        {tab === 'mentor' && (
                            <>
                                <p className="text-sm font-semibold text-gray-800 mb-4">Mentor Performance</p>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={CH_MENTOR_REPORT_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={CH_TS} formatter={(v: any, n: string) => [v, n === 'attendance' ? 'Attendance %' : 'Completion %']} />
                                        <Legend iconSize={12} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                                        <Bar dataKey="attendance" name="Attendance %" fill="#D97706" radius={[3, 3, 0, 0]} barSize={22} />
                                        <Bar dataKey="completion" name="Completion %" fill="#D97706" fillOpacity={0.4} radius={[3, 3, 0, 0]} barSize={22} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </>
                        )}
                        {tab === 'coordinator' && (
                            <>
                                <p className="text-sm font-semibold text-gray-800 mb-4">Coordinator Activity</p>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={CH_COORD_REPORT_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={CH_TS} />
                                        <Legend iconSize={12} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                                        <Bar dataKey="assigned" name="Assigned Potential" fill="#0284C7" radius={[3, 3, 0, 0]} barSize={22} />
                                        <Bar dataKey="pending" name="Pending" fill="#e67700" fillOpacity={0.8} radius={[3, 3, 0, 0]} barSize={22} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </>
                        )}
                        {tab === 'barangay' && (
                            <>
                                <p className="text-sm font-semibold text-gray-800 mb-4">Groups per Barangay</p>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={CH_BARANGAY_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={CH_TS} />
                                        <Bar dataKey="members" name="Members" fill="#D97706" radius={[3, 3, 0, 0]} barSize={28} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </>
                        )}
                        {tab === 'growth' && (
                            <>
                                <p className="text-sm font-semibold text-gray-800 mb-4">Monthly Growth</p>
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={CH_GROWTH_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={CH_TS} />
                                        <Legend iconSize={14} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                                        <Line type="monotone" dataKey="mentees" name="Active Mentees" stroke="#D97706" strokeWidth={2} dot={{ r: 4, fill: '#D97706', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="mentors" name="Mentors" stroke="#D97706" strokeWidth={2} dot={{ r: 4, fill: '#D97706', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </>
                        )}
                    </div>
                </div>
                );
}

                // ── COORDINATOR REPORTS CHARTS ── rendered here so recharts resolves correctly



                const COORD_TS = {borderRadius: '10px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,.10)', fontSize: '12px', padding: '8px 14px' };

                const COORD_ASSIGNMENT_DATA = [
                {month: 'Feb', assigned: 4, pending: 2 },
                {month: 'Mar', assigned: 6, pending: 3 },
                {month: 'Apr', assigned: 5, pending: 1 },
                {month: 'May', assigned: 8, pending: 4 },
                {month: 'Jun', assigned: 7, pending: 2 },
                {month: 'Jul', assigned: 9, pending: 3 },
                ];
                const COORD_MONTHLY_DATA = [
                {month: 'Feb', new: 3 }, {month: 'Mar', new: 5 }, {month: 'Apr', new: 4 },
                {month: 'May', new: 7 }, {month: 'Jun', new: 6 }, {month: 'Jul', new: 8 },
                ];
                const COORD_BARANGAY_DATA = [
                {name: 'Burol', count: 2 }, {name: 'Paliparan III', count: 2 },
                {name: 'Sampaloc I', count: 1 }, {name: 'Salitran III', count: 1 },
                {name: 'Emmanuel Bergado I', count: 1 }, {name: 'Fatima I', count: 1 },
                ];
                const COORD_MENTOR_DATA = [
                {name: 'Juan', assigned: 2, capacity: 7 }, {name: 'Pedro', assigned: 2, capacity: 7 },
                {name: 'Maria', assigned: 1, capacity: 4 }, {name: 'Lena', assigned: 0, capacity: 0 },
                ];

                type CoordReportChartTab = 'assignment' | 'monthly' | 'barangay' | 'mentor';

                function CoordReportsCharts() {
    const [tab, setTab] = useState<CoordReportChartTab>('assignment');
                    const tabs: {key: CoordReportChartTab; label: string }[] = [
                    {key: 'assignment', label: 'Assignment Reports' },
                    {key: 'monthly', label: 'Monthly Potential' },
                    {key: 'barangay', label: 'Per Barangay' },
                    {key: 'mentor', label: 'Per Mentor' },
                    ];
                    return (
                    <div>
                        <div className="flex items-center gap-2 mb-5 flex-wrap">
                            {tabs.map(t => (
                                <button key={t.key} onClick={() => setTab(t.key)}
                                    className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors ${tab === t.key ? 'bg-[#D97706] text-white border-[#D97706]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            {tab === 'assignment' && (
                                <>
                                    <p className="text-sm font-semibold text-gray-800 mb-4">Assignment Reports â€” Assigned vs Pending</p>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={COORD_ASSIGNMENT_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={COORD_TS} />
                                            <Legend iconSize={12} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                                            <Bar dataKey="assigned" name="Assigned" fill="#0284C7" radius={[3, 3, 0, 0]} barSize={22} />
                                            <Bar dataKey="pending" name="Pending" fill="#e67700" fillOpacity={0.8} radius={[3, 3, 0, 0]} barSize={22} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </>
                            )}
                            {tab === 'monthly' && (
                                <>
                                    <p className="text-sm font-semibold text-gray-800 mb-4">Monthly Potential Mentees Submitted</p>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <AreaChart data={COORD_MONTHLY_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="coordFill" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={COORD_TS} formatter={(v: any) => [v, 'New Potential Mentees']} />
                                            <Area type="monotone" dataKey="new" stroke="#0284C7" strokeWidth={2} fill="url(#coordFill)" dot={false} activeDot={{ r: 5 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </>
                            )}
                            {tab === 'barangay' && (
                                <>
                                    <p className="text-sm font-semibold text-gray-800 mb-4">Potential Mentees per Barangay</p>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={COORD_BARANGAY_DATA} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                            <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={55} />
                                            <Tooltip contentStyle={COORD_TS} formatter={(v: any) => [v, 'Mentees']} />
                                            <Bar dataKey="count" name="Mentees" fill="#0284C7" radius={[0, 3, 3, 0]} barSize={16} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </>
                            )}
                            {tab === 'mentor' && (
                                <>
                                    <p className="text-sm font-semibold text-gray-800 mb-4">Mentee Assignments per Mentor</p>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={COORD_MENTOR_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={COORD_TS} />
                                            <Legend iconSize={12} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                                            <Bar dataKey="assigned" name="Assigned Mentees" fill="#0284C7" radius={[3, 3, 0, 0]} barSize={22} />
                                            <Bar dataKey="capacity" name="Available Slots" fill="#0284C7" fillOpacity={0.3} radius={[3, 3, 0, 0]} barSize={22} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </>
                )}
                    </div>
                </div>
                );
}

                // ── ROOT ──


                export default function DashboardPage() {
    const {user, logout} = useAuth();
                const router = useRouter();

    useEffect(() => {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('c2s_user') : null;
                if (!stored) router.replace('/login');
    }, []); // eslint-disable-line

                if (!user) return null;

                function handleLogout() {
                    logout();
                router.push('/login');
    }

                if (user.role === 'admin') {
        return <AdminDashboard />;
    }

                if (user.role === 'ministry_head') {
        return <DepartmentHeadDashboard />;
    }

                if (user.role === 'cluster_head') {
        return <ClusterHeadDashboard onLogout={handleLogout} reportsContent={<CHReportsCharts />} />;
    }

                if (user.role === 'c2s_coordinator') {
        return <CoordinatorDashboard onLogout={handleLogout} reportsContent={<CoordReportsCharts />} />;
    }

                return (
                <div className="overflow-x-hidden">
                    <MentorDashboard />
                </div>
                );
}

