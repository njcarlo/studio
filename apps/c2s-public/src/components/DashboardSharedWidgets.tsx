/**
 * DashboardSharedWidgets.tsx
 *
 * Reusable dashboard sections shared by all four role dashboards:
 *   - Mentor Dashboard (church-wide data)
 *   - Cluster Head Dashboard (filtered by cluster_id)
 *   - C2S Coordinator Dashboard (filtered by coordinator scope)
 *   - Department Head Dashboard (filtered by ministry_id)
 *
 * Each dashboard passes its pre-filtered data as props.
 * NO UI differences — only data changes per role.
 */
'use client';

import React from 'react';

// ─── Shared data types ────────────────────────────────────────────────────────

export interface DeptWorkerRow {
    dept: string;
    workers: number;
    mentors: number;
    color: string;
}

export interface DeptMenteeRow {
    dept: string;
    f2f: number;
    online: number;
    total: number;
}

export interface DeptGroupRow {
    dept: string;
    church: number;
    community: number;
    total: number;
}

export interface DashboardData {
    /** Summary card totals */
    totalWorkers: number;
    totalMentors: number;
    totalMentees: number;
    totalGroups: number;

    /** Workers by Department (donut chart + table) */
    deptWorkers: DeptWorkerRow[];

    /** Mentees by Department summary */
    totalF2F: number;
    totalOnline: number;
    deptMentees: DeptMenteeRow[];

    /** C2S Groups summary */
    totalChurch: number;
    totalCommunity: number;
    deptGroups: DeptGroupRow[];
}


// ─── 1. Summary Cards ─────────────────────────────────────────────────────────

export function DashboardSummaryCards({ data }: { data: DashboardData }) {
    const cards = [
        {
            label: 'Workers',
            value: data.totalWorkers,
            sub: 'Across all departments',
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#6aabf7">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
            ),
        },
        {
            label: 'Mentors',
            value: data.totalMentors,
            sub: 'Active discipleship mentors',
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#f07070">
                    <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
                </svg>
            ),
        },
        {
            label: 'Mentees',
            value: data.totalMentees,
            sub: 'Church-wide C2S mentees',
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#5cb85c">
                    <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
                </svg>
            ),
        },
        {
            label: 'C2S Groups',
            value: data.totalGroups,
            sub: 'Church & community based',
            icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#f5a623">
                    <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zm-2-4H10v-2h8v2zm-4 4H10v-2h4v2zm4-8H10V6h8v2z"/>
                </svg>
            ),
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            {cards.map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <div className="flex items-start justify-between mb-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{s.label}</span>
                        <span className="opacity-80">{s.icon}</span>
                    </div>
                    <p className="text-[2.4rem] font-normal text-gray-900 leading-none mb-2">{s.value.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{s.sub}</p>
                </div>
            ))}
        </div>
    );
}


// ─── 2. Workers by Department (Donut Chart + Table) ───────────────────────────

export function WorkersByDepartment({ data }: { data: DashboardData }) {
    const rows = data.deptWorkers;
    const totalWorkers = rows.reduce((s, d) => s + d.workers, 0);
    const totalMentors = rows.reduce((s, d) => s + d.mentors, 0);
    const grandTotal   = totalWorkers + totalMentors;

    // Build donut slices from workers+mentors per dept
    const donutData = rows.map((d) => ({ name: d.dept, value: d.workers + d.mentors, color: d.color }));
    const total = donutData.reduce((s, d) => s + d.value, 0);

    const W = 320; const H = 300;
    const CX = 160; const CY = 150;
    const OR = 110; const IR = 68;
    const RAD = Math.PI / 180;

    type Slice = { name: string; color: string; percent: number; startDeg: number; endDeg: number };
    const slices: Slice[] = [];
    let cum = -90;
    for (const d of donutData) {
        const sweep = (d.value / total) * 360;
        slices.push({ name: d.name, color: d.color, percent: d.value / total, startDeg: cum, endDeg: cum + sweep });
        cum += sweep;
    }

    function arc(cx: number, cy: number, r: number, s: number, e: number, ir: number) {
        const sr = s * RAD; const er = e * RAD;
        const large = (e - s) > 180 ? 1 : 0;
        const x1 = cx + r  * Math.cos(sr); const y1 = cy + r  * Math.sin(sr);
        const x2 = cx + r  * Math.cos(er); const y2 = cy + r  * Math.sin(er);
        const ix1= cx + ir * Math.cos(sr); const iy1= cy + ir * Math.sin(sr);
        const ix2= cx + ir * Math.cos(er); const iy2= cy + ir * Math.sin(er);
        return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ir} ${ir} 0 ${large} 0 ${ix1} ${iy1} Z`;
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 className="font-bold text-gray-900 text-base mb-0.5">Workers by Department</h2>
            <p className="text-xs text-gray-400 mb-4">Worker and mentor distribution by department.</p>

            <div className="flex items-center justify-center gap-8 mb-8">
                <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', flexShrink: 0 }}>
                    {slices.map((s) => (
                        <path key={s.name} d={arc(CX, CY, OR, s.startDeg, s.endDeg, IR)} fill={s.color} stroke="white" strokeWidth={2} />
                    ))}
                    {slices.map((s) => {
                        if (s.percent < 0.04) return null;
                        const mid = (s.startDeg + s.endDeg) / 2 * RAD;
                        const lx1 = CX + (OR + 5)  * Math.cos(mid); const ly1 = CY + (OR + 5)  * Math.sin(mid);
                        const lx2 = CX + (OR + 20) * Math.cos(mid); const ly2 = CY + (OR + 20) * Math.sin(mid);
                        const tx  = CX + (OR + 26) * Math.cos(mid); const ty  = CY + (OR + 26) * Math.sin(mid);
                        return (
                            <g key={`lbl-${s.name}`}>
                                <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke="#9ca3af" strokeWidth={1} />
                                <text x={tx} y={ty} fill="#6b7280" textAnchor={tx >= CX ? 'start' : 'end'}
                                    dominantBaseline="central" fontSize={11} fontFamily="Inter, system-ui, sans-serif">
                                    {`${(s.percent * 100).toFixed(0)}%`}
                                </text>
                            </g>
                        );
                    })}
                </svg>
                <div className="flex flex-col gap-3.5">
                    {donutData.map((d) => (
                        <div key={d.name} className="flex items-center gap-2.5">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
                            <span className="text-sm text-gray-600">{d.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-gray-100">
                <table className="w-full">
                    <thead>
                        <tr style={{ background: '#f8f9fc', borderBottom: '1px solid #e5e7eb' }}>
                            <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Department</th>
                            <th className="px-5 py-3 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Workers</th>
                            <th className="px-5 py-3 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mentors</th>
                            <th className="px-5 py-3 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={row.dept} style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : undefined }}>
                                <td className="px-5 py-4 text-sm font-semibold text-gray-700">{row.dept}</td>
                                <td className="px-5 py-4 text-sm text-gray-500 text-right">{row.workers.toLocaleString()}</td>
                                <td className="px-5 py-4 text-sm text-gray-500 text-right">{row.mentors.toLocaleString()}</td>
                                <td className="px-5 py-4 text-sm text-gray-500 text-right">{(row.workers + row.mentors).toLocaleString()}</td>
                            </tr>
                        ))}
                        <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8f9fc' }}>
                            <td className="px-5 py-4 text-sm font-black text-gray-800">Total</td>
                            <td className="px-5 py-4 text-sm font-bold text-gray-700 text-right">{totalWorkers.toLocaleString()}</td>
                            <td className="px-5 py-4 text-sm font-bold text-gray-700 text-right">{totalMentors.toLocaleString()}</td>
                            <td className="px-5 py-4 text-sm font-bold text-gray-700 text-right">{grandTotal.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}


// ─── 3. Mentees by Department ─────────────────────────────────────────────────

export function MenteesByDepartment({ data }: { data: DashboardData }) {
    const totalAll = data.totalF2F + data.totalOnline;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 className="font-bold text-gray-900 text-base mb-0.5">Mentees by Department</h2>
            <p className="text-xs text-gray-400 mb-6">Mentee delivery mode across departments.</p>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Face-to-Face */}
                <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: '#EEF2F7' }}>
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#6aabf7">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-0.5">Face-to-Face</p>
                        <p className="text-[2rem] font-normal text-gray-900 leading-none">{data.totalF2F.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{totalAll > 0 ? Math.round(data.totalF2F / totalAll * 100) : 0}% of all mentees</p>
                    </div>
                </div>
                {/* Online */}
                <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: '#EEF2F7' }}>
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#f07070">
                            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-0.5">Online</p>
                        <p className="text-[2rem] font-normal text-gray-900 leading-none">{data.totalOnline.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{totalAll > 0 ? Math.round(data.totalOnline / totalAll * 100) : 0}% of all mentees</p>
                    </div>
                </div>
            </div>

            {/* Department table */}
            <div className="rounded-xl overflow-hidden border border-gray-100">
                <table className="w-full">
                    <thead>
                        <tr style={{ background: '#EEF2F7' }}>
                            <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Department</th>
                            <th className="px-5 py-3 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">Face-to-Face</th>
                            <th className="px-5 py-3 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">Online</th>
                            <th className="px-5 py-3 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.deptMentees.map((row) => (
                            <tr key={row.dept} style={{ borderTop: '1px solid #f1f5f9' }}>
                                <td className="px-5 py-3.5 text-sm font-semibold text-gray-700">{row.dept}</td>
                                <td className="px-5 py-3.5 text-sm text-gray-500 text-center">{row.f2f.toLocaleString()}</td>
                                <td className="px-5 py-3.5 text-sm text-gray-500 text-center">{row.online.toLocaleString()}</td>
                                <td className="px-5 py-3.5 text-sm text-gray-500 text-right">{row.total.toLocaleString()}</td>
                            </tr>
                        ))}
                        <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8f9fc' }}>
                            <td className="px-5 py-3.5 text-sm font-black text-gray-800">Total</td>
                            <td className="px-5 py-3.5 text-sm font-bold text-gray-700 text-center">{data.totalF2F.toLocaleString()}</td>
                            <td className="px-5 py-3.5 text-sm font-bold text-gray-700 text-center">{data.totalOnline.toLocaleString()}</td>
                            <td className="px-5 py-3.5 text-sm font-bold text-gray-700 text-right">{totalAll.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}


// ─── 4. C2S Groups ────────────────────────────────────────────────────────────

export function C2SGroupsSection({ data }: { data: DashboardData }) {
    const totalAll = data.totalChurch + data.totalCommunity;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 className="font-bold text-gray-900 text-base mb-0.5">C2S Groups</h2>
            <p className="text-xs text-gray-400 mb-6">Where discipleship groups meet.</p>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Church-based */}
                <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: '#EEF2F7' }}>
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#6aabf7">
                            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12V11c0 4.52-3.05 8.74-7 9.93-3.95-1.19-7-5.41-7-9.93V6.3l7-3.12z"/>
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-0.5">Church-based</p>
                        <p className="text-[2rem] font-normal text-gray-900 leading-none">{data.totalChurch.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Meeting in COG Satellite Churches</p>
                    </div>
                </div>
                {/* Community-based */}
                <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: '#EEF2F7' }}>
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#5cb85c">
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-0.5">Community-based</p>
                        <p className="text-[2rem] font-normal text-gray-900 leading-none">{data.totalCommunity.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Meeting in barangays &amp; homes</p>
                    </div>
                </div>
            </div>

            {/* Department table */}
            <div className="rounded-xl overflow-hidden border border-gray-100">
                <table className="w-full">
                    <thead>
                        <tr style={{ background: '#EEF2F7' }}>
                            <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Department</th>
                            <th className="px-5 py-3 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">Church-based</th>
                            <th className="px-5 py-3 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">Community-based</th>
                            <th className="px-5 py-3 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.deptGroups.map((row) => (
                            <tr key={row.dept} style={{ borderTop: '1px solid #f1f5f9' }}>
                                <td className="px-5 py-3.5 text-sm font-semibold text-gray-700">{row.dept}</td>
                                <td className="px-5 py-3.5 text-sm text-gray-500 text-center">{row.church.toLocaleString()}</td>
                                <td className="px-5 py-3.5 text-sm text-gray-500 text-center">{row.community.toLocaleString()}</td>
                                <td className="px-5 py-3.5 text-sm text-gray-500 text-right">{row.total.toLocaleString()}</td>
                            </tr>
                        ))}
                        <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8f9fc' }}>
                            <td className="px-5 py-3.5 text-sm font-black text-gray-800">Total</td>
                            <td className="px-5 py-3.5 text-sm font-bold text-gray-700 text-center">{data.totalChurch.toLocaleString()}</td>
                            <td className="px-5 py-3.5 text-sm font-bold text-gray-700 text-center">{data.totalCommunity.toLocaleString()}</td>
                            <td className="px-5 py-3.5 text-sm font-bold text-gray-700 text-right">{totalAll.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}


// ─── 5. Full Dashboard Tab (all sections in order) ────────────────────────────

/**
 * Drop-in replacement for the "Dashboard" tab content in any role dashboard.
 * Just pass the role-filtered `data` object.
 */
export function SharedDashboardTab({ data }: { data: DashboardData }) {
    return (
        <>
            <DashboardSummaryCards data={data} />
            <WorkersByDepartment data={data} />
            <MenteesByDepartment data={data} />
            <C2SGroupsSection data={data} />
        </>
    );
}

// ─── Default church-wide dataset (used by Mentor Dashboard) ──────────────────

export const CHURCH_WIDE_DATA: DashboardData = {
    totalWorkers: 3455,
    totalMentors: 717,
    totalMentees: 2765,
    totalGroups: 179,

    deptWorkers: [
        { dept: 'Worship',        workers: 512,  mentors: 84,  color: '#4DA6F5' },
        { dept: 'Outreach',       workers: 640,  mentors: 122, color: '#F5C842' },
        { dept: 'Relationship',   workers: 428,  mentors: 96,  color: '#5CB85C' },
        { dept: 'Discipleship',   workers: 892,  mentors: 205, color: '#E05C5C' },
        { dept: 'Administration', workers: 384,  mentors: 42,  color: '#C5A3E0' },
    ],

    totalF2F: 1842,
    totalOnline: 923,
    deptMentees: [
        { dept: 'Worship',        f2f: 312, online: 180, total: 492  },
        { dept: 'Outreach',       f2f: 420, online: 220, total: 640  },
        { dept: 'Relationship',   f2f: 280, online: 148, total: 428  },
        { dept: 'Discipleship',   f2f: 610, online: 282, total: 892  },
        { dept: 'Administration', f2f: 220, online: 93,  total: 313  },
    ],

    totalChurch: 81,
    totalCommunity: 98,
    deptGroups: [
        { dept: 'Worship',        church: 14, community: 18, total: 32 },
        { dept: 'Outreach',       church: 22, community: 26, total: 48 },
        { dept: 'Relationship',   church: 15, community: 19, total: 34 },
        { dept: 'Discipleship',   church: 24, community: 28, total: 52 },
        { dept: 'Administration', church:  6, community:  7, total: 13 },
    ],
};
