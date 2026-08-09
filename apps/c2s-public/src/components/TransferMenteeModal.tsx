'use client';

import { useState } from 'react';

interface Props {
    menteeName: string;
    menteeInitials: string;
    onClose: () => void;
    onConfirm: () => void;
}

const DEPARTMENTS = ['Discipleship','Worship','Outreach','Relationship','Administration'];
const MINISTRIES  = ['Young Adults','Teens','Couples','Worship','Singers','Outreach'];
const CLUSTERS    = ['Cluster 1','Cluster 2','Cluster 3','Cluster 4'];
const MENTORS     = ['Monique Balena','Elijah Bautista','Grace Santos','Rico Reyes','Ana Lim'];

// Current assignment (static)
const CURRENT = { dept: 'Discipleship', ministry: 'Young Adults', cluster: 'Cluster 1', mentor: 'Monique Balena' };

function Sel({ placeholder, options, value, onChange }: {
    placeholder: string; options: string[];
    value: string; onChange: (v: string) => void;
}) {
    return (
        <div className="relative">
            <select value={value} onChange={e => onChange(e.target.value)}
                className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-[#f8f9fc] focus:outline-none focus:ring-2 focus:ring-[#5b50d6] pr-8 text-gray-700">
                <option value="" disabled>{placeholder}</option>
                {options.map(o => <option key={o}>{o}</option>)}
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5z"/>
            </svg>
        </div>
    );
}

export default function TransferMenteeModal({ menteeName, menteeInitials, onClose, onConfirm }: Props) {
    const [step, setStep]     = useState<1 | 2>(1);
    const [dept, setDept]     = useState('');
    const [ministry, setMin]  = useState('');
    const [cluster, setClust] = useState('');
    const [mentor, setMentor] = useState('');

    const canNext = dept !== '' && ministry !== '' && cluster !== '' && mentor !== '';

    return (
        <>
            <div className="fixed inset-0 z-[200] bg-black/40" onClick={onClose} />
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col" onClick={e => e.stopPropagation()}>

                    {/* ── Step 1: Confirm ── */}
                    {step === 1 && (
                        <div className="p-8 flex flex-col gap-6">
                            <h2 className="text-2xl font-semibold text-gray-900">Transfer Mentee</h2>
                            <hr className="border-gray-100" />
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Transfer <span className="font-bold text-gray-900">{menteeName}</span> to another ministry?
                                Their current mentoring record will be closed.
                            </p>
                            <hr className="border-gray-100" />
                            <div className="flex items-center justify-between">
                                <button onClick={onClose}
                                    className="px-5 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={() => setStep(2)}
                                    className="px-6 py-2 text-sm font-semibold text-white rounded-lg"
                                    style={{ background: '#5b50d6' }}>
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Transfer Details ── */}
                    {step === 2 && (
                        <div className="p-8 flex flex-col gap-5">
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900">Transfer Details</h2>
                                <p className="text-xs text-gray-400 mt-1">Select the new department, ministry, cluster, and assigned mentor for the mentee.</p>
                            </div>
                            <hr className="border-gray-100" />

                            {/* Currently Assigned */}
                            <div className="bg-[#f8f9fc] border border-gray-200 rounded-xl px-5 py-4">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Currently Assigned</p>
                                <div className="grid grid-cols-4 gap-4">
                                    {[
                                        { label: 'Department', value: CURRENT.dept },
                                        { label: 'Ministry',   value: CURRENT.ministry },
                                        { label: 'Cluster',    value: CURRENT.cluster },
                                        { label: 'Mentor',     value: CURRENT.mentor },
                                    ].map(c => (
                                        <div key={c.label}>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">{c.label}</p>
                                            <p className="text-sm font-semibold text-gray-800">{c.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* New assignment selects */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-gray-700">New Department</label>
                                    <Sel placeholder="Select Department" options={DEPARTMENTS} value={dept} onChange={setDept} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-gray-700">New Ministry</label>
                                    <Sel placeholder="Select Ministry" options={MINISTRIES} value={ministry} onChange={setMin} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-gray-700">New Cluster</label>
                                    <Sel placeholder="Select Cluster" options={CLUSTERS} value={cluster} onChange={setClust} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-gray-700">New Mentor</label>
                                    <Sel placeholder="Select Mentor" options={MENTORS} value={mentor} onChange={setMentor} />
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Show confirmation summary if all selected */}
                            {canNext && (
                                <div className="bg-[#f8f9fc] border border-gray-200 rounded-xl px-5 py-4 flex flex-col gap-3">
                                    {/* Mentee row */}
                                    <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                                            style={{ background: '#5b50d6' }}>{menteeInitials}</div>
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Current Mentee</p>
                                            <p className="text-sm font-semibold text-gray-900">{menteeName}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { icon: '🏢', label: 'New Department', value: dept },
                                            { icon: '⛪', label: 'New Ministry',   value: ministry },
                                            { icon: '👥', label: 'New Cluster',    value: cluster },
                                            { icon: '👤', label: 'New Mentor',     value: mentor },
                                        ].map(r => (
                                            <div key={r.label} className="flex items-center gap-2.5">
                                                <span className="text-base">{r.icon}</span>
                                                <div>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{r.label}</p>
                                                    <p className="text-sm font-semibold text-gray-900">{r.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Warning */}
                            {canNext && (
                                <div className="flex items-start gap-2.5 bg-[#fffbeb] border border-[#fde68a] rounded-xl px-4 py-3">
                                    <svg className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                                    </svg>
                                    <p className="text-xs text-[#92400e] leading-relaxed">
                                        Once submitted, <strong>{menteeName}</strong> will be reassigned to the selected ministry and mentor.
                                        The current mentoring relationship will be closed and archived in the mentee's history.
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-1">
                                <button onClick={() => setStep(1)}
                                    className="px-5 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    Back
                                </button>
                                <button
                                    onClick={() => { if (canNext) { onConfirm(); onClose(); } }}
                                    disabled={!canNext}
                                    className="px-6 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{ background: '#5b50d6' }}>
                                    {canNext ? 'Submit' : 'Next'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
