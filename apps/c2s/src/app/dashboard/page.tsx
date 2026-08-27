'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { C2S_GROUPS, type C2SGroup, POTENTIAL_MENTEES, type PotentialMentee, ACTIVE_MENTEES, INACTIVE_MENTEES, ENDORSED_GROUPS, ENDORSED_WORKERS } from '@/lib/data';
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
import SettingsModal from '@/components/SettingsModal';
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
    { name: 'Administration', value: 384, color: '#C5A3E0' },
];
const DEPT_MENTORS = [
    { name: 'Worship', value: 84, color: '#4DA6F5' },
    { name: 'Outreach', value: 122, color: '#F5C842' },
    { name: 'Relationship', value: 96, color: '#5CB85C' },
    { name: 'Discipleship', value: 205, color: '#E05C5C' },
    { name: 'Administration', value: 42, color: '#C5A3E0' },
];
const TOTAL_WORKERS = DEPT_WORKERS.reduce((s, d) => s + d.value, 0);
const TOTAL_MENTORS = DEPT_MENTORS.reduce((s, d) => s + d.value, 0);

/* â”€â”€ Shared Navbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function DashNav({ onLogout }: { onLogout: () => void }) {
    const { user } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    if (!user) return null;
    const isHead = user.role === 'ministry_head';
    const isCluster = user.role === 'cluster_head';
    const isCoord = user.role === 'c2s_coordinator';
    const isAdmin = user.role === 'admin';
    const roleColor = isAdmin ? '#111827' : isHead ? '#0b9b8a' : isCluster ? '#6741d9' : isCoord ? '#0b9b8a' : '#5b50d6';
    const roleLabel = isAdmin ? 'Admin' : isHead ? 'Department Head' : isCluster ? 'Cluster Head' : isCoord ? 'C2S Coordinator' : 'Mentor';
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
            <div className="w-full px-4 sm:px-6 flex items-center justify-between nav-fixed-h">
                <Link href="/" className="flex items-center gap-2.5">
                    <div className="w-9 h-9 relative shrink-0">
                        <Image src="/logo.png" alt="COG" fill className="object-contain" priority />
                    </div>
                    <div className="leading-tight">
                        <p className="text-[13px] font-bold text-gray-800">Church of God Dasmariñas</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">CONNECT2SOULS</p>
                    </div>
                </Link>

                {/* Avatar dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(o => !o)}
                        className="flex items-center gap-2.5 rounded-full pr-1 hover:opacity-90 transition-opacity"
                    >
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
                            style={{ background: roleColor }}>
                            {user.avatar}
                        </div>
                        <div className="hidden sm:block leading-tight text-left">
                            <p className="text-sm font-bold text-gray-800">{user.name}</p>
                            <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: roleColor }}>
                                {roleLabel}
                            </p>
                        </div>
                        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0 hidden" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7 10l5 5 5-5z" />
                        </svg>
                    </button>

                    {/* Dropdown menu */}
                    {dropdownOpen && (
                        <>
                            {/* Backdrop */}
                            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                            <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20"
                                style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                                {/* User info */}
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                                    <p className="text-[10px] uppercase tracking-widest font-semibold mt-0.5" style={{ color: roleColor }}>{roleLabel}</p>
                                </div>
                                {/* Sign out */}
                                <button
                                    onClick={() => { setDropdownOpen(false); onLogout(); }}
                                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors text-left"
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                                    </svg>
                                    Sign Out
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}


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
    { dept: 'Administration', workers: DEPT_WORKERS[4].value, mentors: DEPT_MENTORS[4].value, color: '#C5A3E0' },
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
function PotentialMenteeCard({ mentee, onAccepted }: {
    mentee: PotentialMentee;
    onAccepted: (pm: PotentialMentee) => void;
}) {
    const [showAccept, setShowAccept] = useState(false);
    const [showRecommend, setShowRecommend] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

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

            <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">

                {/* Row 1: Avatar + name/info + Pending badge */}
                <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                        style={{ background: '#5b50d6' }}>
                        {mentee.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 leading-tight">{mentee.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{mentee.age} · {mentee.gender} · {mentee.phone}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#b45309] text-white shrink-0 border border-[#fde68a]">
                        Pending
                    </span>
                </div>

                {/* Row 2: Source badge */}
                <div>
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${mentee.sourceColor}`}>
                        {mentee.source === 'Recommended' ? (
                            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" /></svg>
                        ) : (
                            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
                        )}
                        {mentee.source}
                    </span>
                </div>

                {/* Row 3: Requested Group */}
                <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Requested Group</p>
                    <p className="font-bold text-gray-900 text-base">{mentee.requestedGroup}</p>
                </div>

                {/* Row 4: Notes box */}
                {mentee.notes && (
                    <div className="rounded-xl px-4 py-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Notes</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{mentee.notes}</p>
                    </div>
                )}

                {/* Row 5: Action buttons */}
                <div className="flex items-center gap-2 pt-1">
                    {/* Accept — purple filled, takes most space */}
                    <button
                        onClick={() => setShowAccept(true)}
                        className="flex items-center justify-center gap-1.5 flex-1 text-xs font-bold text-white py-2 rounded-lg transition-colors"
                        style={{ background: '#5b50d6' }}
                    >
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                        Accept
                    </button>

                    {/* Recommend — outlined */}
                    <button
                        onClick={() => setShowRecommend(true)}
                        className="flex items-center justify-center gap-1.5 flex-1 text-xs font-semibold text-gray-700 py-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
                        Recommend
                    </button>

                    {/* Details — outlined with eye icon */}
                    <button
                        onClick={() => setShowDetails(true)}
                        className="flex items-center justify-center gap-1.5 flex-1 text-xs font-semibold text-gray-700 py-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg>
                        Details
                    </button>
                </div>
            </div>
        </>
    );
}

/* -- Avatar color helper (shared with MenteesTab) ------------------------------ */
const MENTOR_AVATAR_COLORS = ['#5b50d6', '#5b50d6', '#0b9b8a', '#e67700', '#6741d9'];
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
        if (r === 'Transferred') return 'bg-[#6741d9] text-white';
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
                        className="flex items-center gap-2 bg-[#5b50d6] hover:bg-[#4a41c0] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shrink-0 self-start sm:self-auto active:scale-95"
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
                            { label: 'Total Mentees', value: totalMentees, color: '#6741d9' },
                            { label: 'Active', value: activeCnt, color: '#ef4444' },
                            { label: 'Inactive', value: inactiveCnt, color: '#3b82f6' },
                            { label: 'Transferred', value: transferredCnt, color: '#0b9b8a' },
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
                                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5b50d6] bg-white w-full sm:w-52" />
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
                                                        <div className="h-full rounded-full" style={{ width: `${m.progress}%`, background: '#5b50d6' }} />
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
                                                    style={{ background: '#5b50d6' }}>
                                                    Update
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Desktop table */}
                                <table className="hidden sm:table w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-[#f8f9fc]">
                                            {['Name', 'Assigned Group', 'Connected Since', 'Devotional Manual Status', 'Progress', 'Actions'].map(h => (
                                                <th key={h} className="px-3 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredActive.map((m) => (
                                            <tr key={m.id} className="hover:bg-[#f8f9fc] transition-colors">
                                                <td className="px-3 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs shrink-0"
                                                            style={{ background: mentorAvatarColor(m.id) }}>{m.initials}</div>
                                                        <span className="font-bold text-gray-900 text-sm">{m.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4 text-sm text-gray-500">{m.assignedGroup}</td>
                                                <td className="px-3 py-4 text-sm text-gray-500">{m.connectedSince}</td>
                                                <td className="px-3 py-4 text-sm text-gray-600">{m.module}, {m.lesson}</td>
                                                <td className="px-3 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
                                                            <div className="h-full rounded-full" style={{ width: `${m.progress}%`, background: '#5b50d6' }} />
                                                        </div>
                                                        <span className="text-xs font-semibold text-gray-600 shrink-0">{m.progress}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <button onClick={() => setViewing(m)} className="text-xs font-semibold text-gray-600 hover:underline transition-colors">View Profile</button>
                                                        <button onClick={() => setShowDevotional(m)}
                                                            className="text-xs font-bold text-white px-3 py-1.5 rounded-lg transition-colors"
                                                            style={{ background: '#5b50d6' }}>
                                                            Update
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${reasonBadge(m.reason)}`}>{m.reason}</span>
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
                                        className="self-start text-xs font-semibold text-[#5b50d6] hover:underline"
                                    >View Profile</button>
                                </div>
                            ))}
                            {inactiveList.length === 0 && (
                                <div className="p-10 text-center text-sm text-gray-400">No inactive mentees found.</div>
                            )}
                        </div>
                        {/* Desktop table */}
                        <table className="hidden sm:table w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 text-[10px] text-gray-400 uppercase tracking-widest">
                                    {['Name', 'Assigned Group', 'Date Became Inactive', 'Last Devotional Manual', 'Reason', 'Actions'].map(h => (
                                        <th key={h} className="px-3 py-3.5 text-left font-semibold">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {inactiveList.map((m) => (
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
                    <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-[#5b50d6] hover:bg-[#4a41c0] text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {ENDORSED_GROUPS.map((g) => (
                        <div key={g.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
                            <p className="font-bold text-gray-900 text-lg">{g.name}</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="rounded-xl px-3 py-2 text-center" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                                    <p className="text-lg font-black text-[#5b50d6]">{g.members}</p>
                                    <p className="text-gray-400 text-[10px]">Members</p>
                                </div>
                                <div className="rounded-xl px-3 py-2 text-center" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                                    <p className="text-lg font-black text-[#0b9b8a]">{g.progress}%</p>
                                    <p className="text-gray-400 text-[10px]">Progress</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setViewingMembers(g)} className="flex-1 text-xs font-semibold text-white px-3 py-2 rounded-lg" style={{ background: '#5b50d6' }}>View Members</button>
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
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0" style={{ background: '#5b50d6' }}>{w.initials}</div>
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
                                    <div className="h-full rounded-full" style={{ width: `${w.progress}%`, background: '#5b50d6' }} />
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
    'Pending': 'bg-[#b45309] text-white',
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
                                <div className="w-12 h-12 rounded-full bg-[#ede9fe] flex items-center justify-center text-[#5b50d6] font-black text-lg shrink-0">
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
                        className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5b50d6] w-full bg-white" />
                </div>
                <select
                    value={filter}
                    onChange={e => setFilter(e.target.value as any)}
                    className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5b50d6] min-w-[140px]"
                >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>
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
                                        <div className="w-8 h-8 rounded-full bg-[#ede9fe] flex items-center justify-center text-[#5b50d6] text-[10px] font-black shrink-0">
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
                                <button onClick={() => setViewing(a)} className="self-start text-xs font-semibold text-[#5b50d6] hover:underline">View Details</button>
                            </div>
                        ))}
                    </div>
                    {/* Desktop table */}
                    <div className="hidden sm:block bg-white rounded-2xl border border-gray-200">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#f8f9fc] text-[10px] text-gray-400 uppercase tracking-widest">
                                    {['Applicant', 'Barangay', 'Schedule', 'Potential', 'Date', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="px-3 py-3 text-left font-semibold">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map(a => (
                                    <tr key={a.id} className="hover:bg-[#f8f9fc] transition-colors">
                                        <td className="px-3 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-[#ede9fe] flex items-center justify-center text-[#5b50d6] text-[10px] font-black shrink-0">
                                                    {a.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-xs">{a.name}</p>
                                                    <p className="text-[10px] text-gray-400">{a.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3.5 text-xs text-gray-600">{a.barangay}</td>
                                        <td className="px-3 py-3.5 text-xs text-gray-600">{a.schedule}</td>
                                        <td className="px-3 py-3.5 text-xs text-gray-600 text-center">{a.potential}</td>
                                        <td className="px-3 py-3.5 text-xs text-gray-500">{a.submitted}</td>
                                        <td className="px-3 py-3.5">
                                            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${HUB_STATUS_STYLE_MENTOR[a.status]}`}>{a.status}</span>
                                        </td>
                                        <td className="px-3 py-3.5">
                                            <button onClick={() => setViewing(a)} className="text-[11px] font-semibold text-[#5b50d6] hover:underline">View</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

function MentorDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'my-groups' | 'potential-mentees' | 'mentees' | 'endorsed' | 'potential-c2s-groups'>('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
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
    const [groupToast, setGroupToast] = useState<string | null>(null);

    function handleCreateGroup(newGrp: any) {
        const newGroupObj: C2SGroup = {
            id: `grp-${Date.now()}`,
            name: newGrp.name,
            description: newGrp.description || 'Discipleship & Fellowship Group',
            tags: [
                { label: newGrp.groupType || 'Young Adults', color: 'bg-[#ede9fe] text-[#6741d9]' },
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

    // Groups this mentor leads (matched by group name + created groups)
    const baseMyGroups = C2S_GROUPS.filter((g) => g.name === user?.group);
    const myGroups = [
        ...sessionCreatedGroups,
        ...baseMyGroups.filter((bg) => !sessionCreatedGroups.some((cg) => cg.id === bg.id || cg.name === bg.name)),
    ];

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
                />
            )}

            {/* Create Group modal */}
            {showCreateGroup && (
                <CreateGroupModal
                    onClose={() => setShowCreateGroup(false)}
                    onCreate={handleCreateGroup}
                />
            )}


            {/* Settings modal */}
            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            {/* ── Left Sidebar ── */}
            <aside className={`sidebar-nav w-56 border-r border-gray-200 flex flex-col pt-6 pb-4 fixed top-nav-fixed bottom-0 left-0 ${sidebarOpen ? 'z-40 translate-x-0' : 'z-30 -translate-x-full md:translate-x-0'} transition-transform duration-200`}>
                {/* MENU label */}
                <p className="px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Menu</p>

                {/* Nav items */}
                <nav className="px-3 flex flex-col gap-1">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full text-left ${activeTab === 'dashboard'
                            ? 'text-gray-800 bg-white shadow-sm'
                            : 'text-gray-500 hover:bg-white/60'
                            }`}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={activeTab === 'dashboard' ? '#555' : '#aaa'}>
                            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zm-2-4H10v-2h8v2zm-4 4H10v-2h4v2zm4-8H10V6h8v2z" />
                        </svg>
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('my-groups')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full text-left ${activeTab === 'my-groups'
                            ? 'text-gray-800 bg-white shadow-sm'
                            : 'text-gray-500 hover:bg-white/60'
                            }`}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={activeTab === 'my-groups' ? '#5b50d6' : '#aaa'}>
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                        </svg>
                        My Groups
                        {myGroups.length > 0 && (
                            <span className="ml-auto text-[11px] font-bold min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-[#5b50d6] text-white shrink-0">
                                {myGroups.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('potential-mentees')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full text-left ${activeTab === 'potential-mentees'
                            ? 'text-gray-800 bg-white shadow-sm'
                            : 'text-gray-500 hover:bg-white/60'
                            }`}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={activeTab === 'potential-mentees' ? '#5b50d6' : '#aaa'}>
                            <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                        Potential Mentees
                        <span className="ml-auto text-[11px] font-bold min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-[#5b50d6] text-white shrink-0">
                            {allPotentialMentees.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('mentees')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full text-left ${activeTab === 'mentees'
                            ? 'text-gray-800 bg-white shadow-sm'
                            : 'text-gray-500 hover:bg-white/60'
                            }`}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={activeTab === 'mentees' ? '#5b50d6' : '#aaa'}>
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                        </svg>
                        Mentees
                        <span className="ml-auto text-[11px] font-bold min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-[#5b50d6] text-white shrink-0">
                            {allActiveMentees.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('endorsed')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full text-left ${activeTab === 'endorsed'
                            ? 'text-gray-800 bg-white shadow-sm'
                            : 'text-gray-500 hover:bg-white/60'
                            }`}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={activeTab === 'endorsed' ? '#5b50d6' : '#aaa'}>
                            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                        </svg>
                        Endorsed
                        <span className="ml-auto text-[11px] font-bold min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-[#5b50d6] text-white shrink-0">
                            {ENDORSED_WORKERS.length + ENDORSED_GROUPS.reduce((s, g) => s + g.members, 0)}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('potential-c2s-groups')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full text-left ${activeTab === 'potential-c2s-groups'
                            ? 'text-gray-800 bg-white shadow-sm'
                            : 'text-gray-500 hover:bg-white/60'
                            }`}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={activeTab === 'potential-c2s-groups' ? '#5b50d6' : '#aaa'}>
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                        </svg>
                        Potential C2S Groups
                    </button>
                </nav>

                {/* Settings at bottom of sidebar */}
                <div className="mt-auto px-3 pt-3 border-t border-gray-100 mx-2">
                    <button
                        onClick={() => { setShowSettings(true); setSidebarOpen(false); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full text-left text-gray-500 hover:bg-white/60"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#aaa">
                            <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87a.47.47 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.47.47 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.37 1.04.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 0 0-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                        </svg>
                        Settings
                    </button>
                </div>
            </aside>

            {/* â”€â”€ Main content â”€â”€ */}
            <div className="md:ml-56 flex-1 pb-16 min-w-0">

                {/* Mobile sticky menu bar */}
                <div className="md:hidden sticky top-0 left-0 right-0 z-20 mobile-menu-bar px-4 py-2.5 flex items-center gap-2">
                    <button
                        className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                        </svg>
                    </button>
                    <span className="text-xs text-gray-400 ml-1">
                        {activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'my-groups' ? 'My Groups' : activeTab === 'potential-mentees' ? 'Potential Mentees' : activeTab === 'mentees' ? 'Mentees' : activeTab === 'endorsed' ? 'Endorsed' : 'Potential C2S Groups'}
                    </span>
                </div>

                {/* Content with padding */}
                <div className="pt-4 md:pt-6 px-4 sm:px-6">

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
                        <div>
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
                            <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
                                <div>
                                    <h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">Connect 2 Souls</h1>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Connect, disciple and guide souls on their spiritual journey through meaningful relationships and faithful follow-up.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowCreateGroup(true)}
                                    className="flex items-center gap-1.5 bg-[#e53e3e] hover:bg-[#c53030] text-white font-bold px-4 py-2 rounded-md text-sm transition-colors shadow-sm shrink-0"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                                    Create Group
                                </button>
                            </div>

                            {myGroups.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                                    <div className="text-4xl mb-3">👥</div>
                                    <p className="font-semibold text-gray-700 text-sm">No groups assigned yet</p>
                                    <p className="text-xs text-gray-400 mt-1">Contact the department head to get assigned to a group.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {myGroups.map((group) => (
                                        <div key={group.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
                                            {/* Tags row + Open status */}
                                            <div className="flex flex-wrap items-center gap-2">
                                                {group.tags.map((t) => (
                                                    <span key={t.label} className={`text-xs font-semibold px-3 py-1 rounded-full ${t.color}`}>
                                                        {t.label}
                                                    </span>
                                                ))}
                                                <span className={`text-xs font-semibold px-3 py-1 rounded-full ml-auto ${group.status === 'Open'
                                                    ? 'bg-[#16a34a] text-white'
                                                    : 'bg-gray-400 text-white'
                                                    }`}>
                                                    {group.status}
                                                </span>
                                            </div>

                                            {/* Name */}
                                            <h3 className="font-semibold text-gray-900 leading-tight text-3xl">{group.name}</h3>

                                            {/* Description */}
                                            <p className="text-sm text-gray-400 leading-relaxed">{group.description}</p>

                                            {/* Satellite Church Info */}
                                            {(group.satelliteName || group.satellite) && (
                                                <div className="flex items-center gap-2 text-xs font-semibold text-[#5b50d6] bg-[#f5f3ff] px-3 py-2 rounded-xl border border-[#ede9fe]">
                                                    <svg className="w-4 h-4 shrink-0 text-[#5b50d6]" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                                    </svg>
                                                    <span className="truncate">
                                                        Satellite: <span className="text-gray-900 font-bold">{group.satelliteName || group.satellite}</span>
                                                    </span>
                                                </div>
                                            )}

                                            {/* Location */}
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <svg className="w-4 h-4 shrink-0 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                                </svg>
                                                {group.location}
                                            </div>

                                            {/* Schedule */}
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <svg className="w-4 h-4 shrink-0 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
                                                </svg>
                                                {group.schedule}
                                            </div>

                                            {/* Divider */}
                                            <hr className="border-gray-200 mt-1" />

                                            {/* Actions footer */}
                                            <div className="flex items-center gap-2">
                                                {/* View Members — wide rounded-lg rectangle */}
                                                <button
                                                    onClick={() => setViewingGroup(group)}
                                                    className="flex items-center justify-center gap-2 font-bold text-white text-sm px-5 py-2.5 rounded-lg transition-colors" style={{ background: '#5b50d6', minWidth: 0, flex: '0 0 auto', width: '62%' }}>
                                                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                                                    </svg>
                                                    View Members
                                                </button>
                                                {/* Edit — bordered rectangle */}
                                                <button
                                                    onClick={() => setEditingGroup(group)}
                                                    className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-semibold text-sm px-4 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                                    </svg>
                                                    Edit
                                                </button>
                                                {/* Delete — icon only, no border */}
                                                <button className="p-2.5 text-gray-400 hover:text-red-500 transition-colors ml-auto">
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* â”€â”€ Potential Mentees Tab â”€â”€ */}
                    {activeTab === 'potential-mentees' && (
                        <div>
                            {/* Header */}
                            <div className="mb-6">
                                <h1 className="text-[1.6rem] font-black text-gray-900 leading-tight">Connect 2 Souls</h1>
                                <p className="text-sm text-gray-400 mt-1">
                                    Connect, disciple and guide souls on their spiritual journey through meaningful relationships and faithful follow-up.
                                </p>
                            </div>

                            {/* Reminder banner */}
                            <div className="flex items-start gap-3 bg-[#b45309] border border-[#92400e] rounded-xl px-5 py-4 mb-7">
                                <svg className="w-5 h-5 text-white shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                                </svg>
                                <div>
                                    <p className="text-xs font-bold text-white mb-0.5">Reminder</p>
                                    <p className="text-xs text-white/90 leading-relaxed">
                                        Mentors should personally meet the potential mentee before accepting the mentoring request. This helps ensure both mentor and mentee are ready for discipleship.
                                    </p>
                                </div>
                            </div>

                            {/* Cards grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {allPotentialMentees.map((mentee) => (
                                    <PotentialMenteeCard key={mentee.id} mentee={mentee} onAccepted={handleMenteeAccepted} />
                                ))}
                            </div>
                        </div>
                    )}

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
                </div>
            </div>
        </div>
    );
}

// ── CLUSTER HEAD REPORTS CHARTS ── rendered here so recharts resolves correctly



const CH_TS = { borderRadius: '10px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,.10)', fontSize: '12px', padding: '8px 14px' };

type CHReportTab = 'mentor' | 'coordinator' | 'barangay' | 'growth';

function CHReportsCharts() {
    const [tab, setTab] = useState<CHReportTab>('mentor');
    const tabs: { key: CHReportTab; label: string }[] = [
        { key: 'mentor', label: 'Per Mentor' },
        { key: 'coordinator', label: 'Per Coordinator' },
        { key: 'barangay', label: 'Per Barangay' },
        { key: 'growth', label: 'Monthly Growth' },
    ];
    return (
        <div>
            <div className="flex items-center gap-2 mb-5">
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors ${tab === t.key ? 'bg-[#6741d9] text-white border-[#6741d9]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
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
                                <Bar dataKey="attendance" name="Attendance %" fill="#6741d9" radius={[3, 3, 0, 0]} barSize={22} />
                                <Bar dataKey="completion" name="Completion %" fill="#6741d9" fillOpacity={0.4} radius={[3, 3, 0, 0]} barSize={22} />
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
                                <Bar dataKey="assigned" name="Assigned Potential" fill="#0b9b8a" radius={[3, 3, 0, 0]} barSize={22} />
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
                                <Bar dataKey="members" name="Members" fill="#6741d9" radius={[3, 3, 0, 0]} barSize={28} />
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
                                <Line type="monotone" dataKey="mentees" name="Active Mentees" stroke="#6741d9" strokeWidth={2} dot={{ r: 4, fill: '#6741d9', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="mentors" name="Mentors" stroke="#0b9b8a" strokeWidth={2} dot={{ r: 4, fill: '#0b9b8a', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </>
                )}
            </div>
        </div>
    );
}

// ── COORDINATOR REPORTS CHARTS ── rendered here so recharts resolves correctly



const COORD_TS = { borderRadius: '10px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,.10)', fontSize: '12px', padding: '8px 14px' };

const COORD_ASSIGNMENT_DATA = [
    { month: 'Feb', assigned: 4, pending: 2 },
    { month: 'Mar', assigned: 6, pending: 3 },
    { month: 'Apr', assigned: 5, pending: 1 },
    { month: 'May', assigned: 8, pending: 4 },
    { month: 'Jun', assigned: 7, pending: 2 },
    { month: 'Jul', assigned: 9, pending: 3 },
];
const COORD_MONTHLY_DATA = [
    { month: 'Feb', new: 3 }, { month: 'Mar', new: 5 }, { month: 'Apr', new: 4 },
    { month: 'May', new: 7 }, { month: 'Jun', new: 6 }, { month: 'Jul', new: 8 },
];
const COORD_BARANGAY_DATA = [
    { name: 'Burol', count: 2 }, { name: 'Paliparan III', count: 2 },
    { name: 'Sampaloc I', count: 1 }, { name: 'Salitran III', count: 1 },
    { name: 'Emmanuel Bergado I', count: 1 }, { name: 'Fatima I', count: 1 },
];
const COORD_MENTOR_DATA = [
    { name: 'Juan', assigned: 2, capacity: 7 }, { name: 'Pedro', assigned: 2, capacity: 7 },
    { name: 'Maria', assigned: 1, capacity: 4 }, { name: 'Lena', assigned: 0, capacity: 0 },
];

type CoordReportChartTab = 'assignment' | 'monthly' | 'barangay' | 'mentor';

function CoordReportsCharts() {
    const [tab, setTab] = useState<CoordReportChartTab>('assignment');
    const tabs: { key: CoordReportChartTab; label: string }[] = [
        { key: 'assignment', label: 'Assignment Reports' },
        { key: 'monthly', label: 'Monthly Potential' },
        { key: 'barangay', label: 'Per Barangay' },
        { key: 'mentor', label: 'Per Mentor' },
    ];
    return (
        <div>
            <div className="flex items-center gap-2 mb-5 flex-wrap">
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors ${tab === t.key ? 'bg-[#0b9b8a] text-white border-[#0b9b8a]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
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
                                <Bar dataKey="assigned" name="Assigned" fill="#0b9b8a" radius={[3, 3, 0, 0]} barSize={22} />
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
                                        <stop offset="5%" stopColor="#0b9b8a" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#0b9b8a" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={COORD_TS} formatter={(v: any) => [v, 'New Potential Mentees']} />
                                <Area type="monotone" dataKey="new" stroke="#0b9b8a" strokeWidth={2} fill="url(#coordFill)" dot={false} activeDot={{ r: 5 }} />
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
                                <Bar dataKey="count" name="Mentees" fill="#0b9b8a" radius={[0, 3, 3, 0]} barSize={16} />
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
                                <Bar dataKey="assigned" name="Assigned Mentees" fill="#0b9b8a" radius={[3, 3, 0, 0]} barSize={22} />
                                <Bar dataKey="capacity" name="Available Slots" fill="#0b9b8a" fillOpacity={0.3} radius={[3, 3, 0, 0]} barSize={22} />
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
    const { user, logout } = useAuth();
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
        return (
            <>
                <DashNav onLogout={handleLogout} />
                <div className="pt-nav-fixed">
                    <AdminDashboard />
                </div>
            </>
        );
    }

    if (user.role === 'ministry_head') {
        return (
            <>
                <DashNav onLogout={handleLogout} />
                <div className="pt-nav-fixed">
                    <DepartmentHeadDashboard />
                </div>
            </>
        );
    }

    if (user.role === 'cluster_head') {
        return (
            <>
                <DashNav onLogout={handleLogout} />
                <div className="pt-nav-fixed">
                    <ClusterHeadDashboard onLogout={handleLogout} reportsContent={<CHReportsCharts />} />
                </div>
            </>
        );
    }

    if (user.role === 'c2s_coordinator') {
        return (
            <>
                <DashNav onLogout={handleLogout} />
                <div className="pt-nav-fixed">
                    <CoordinatorDashboard onLogout={handleLogout} reportsContent={<CoordReportsCharts />} />
                </div>
            </>
        );
    }

    return (
        <>
            <DashNav onLogout={handleLogout} />
            <div className="pt-nav-fixed overflow-x-hidden">
                <MentorDashboard />
            </div>
        </>
    );
}

