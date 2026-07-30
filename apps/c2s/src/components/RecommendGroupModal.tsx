'use client';

import { useState } from 'react';
import { BARANGAYS, C2S_GROUPS } from '@/lib/data';

interface Props {
    menteeName: string;
    onClose: () => void;
    onConfirm: () => void;
}

const REASONS = [
    'The group is already exclusive',
    'Meeting schedule conflict',
    'Location is too far',
    'Age group mismatch',
    'Gender preference mismatch',
    'Better suited for another group',
    'Other',
];

// Static suggested groups for step 3
const SUGGESTED_GROUPS = [
    { name: 'Faithful Families',  mentor: 'Bro. Mark', barangay: 'Burol Main', schedule: 'Friday · 7:00 PM' },
    { name: 'Daughters of Grace', mentor: 'Bro. Mark', barangay: 'Burol Main', schedule: 'Friday · 7:00 PM' },
];

export default function RecommendGroupModal({ menteeName, onClose, onConfirm }: Props) {
    const [step, setStep]               = useState(1);
    const [reason, setReason]           = useState('');
    const [otherText, setOtherText]     = useState('');
    const [barangay, setBarangay]       = useState('');
    const [showBrgyList, setShowBrgyList] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<typeof SUGGESTED_GROUPS[0] | null>(null);

    const canNext1 = reason !== '';
    const canNext2 = barangay !== '';

    const displayReason = reason === 'Other' ? otherText || 'Other' : reason;

    function handleSelectGroup(g: typeof SUGGESTED_GROUPS[0]) {
        setSelectedGroup(g);
        setStep(3); // jump to confirm sub-step within step 3
    }

    return (
        <>
            <div className="fixed inset-0 z-[200] bg-black/40" onClick={onClose} />
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4" onClick={onClose}>
                <div
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col"
                    style={{ minHeight: 360 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-8 pt-8 pb-5 border-b border-gray-100">
                        <h2 className="text-2xl font-semibold text-gray-900">Recommend Another Group</h2>
                        <p className="text-sm text-gray-400 mt-1">
                            For {menteeName} · Step {step === 3 && selectedGroup ? '3' : step} of 3
                        </p>
                    </div>

                    {/* Body */}
                    <div className="flex-1 px-8 py-6">

                        {/* ── Step 1: Select reason ── */}
                        {step === 1 && (
                            <div className="flex flex-col gap-4">
                                <label className="text-xs font-semibold text-gray-600">Select a reason (required)</label>
                                <div className="relative">
                                    <select
                                        value={reason}
                                        onChange={(e) => { setReason(e.target.value); setShowBrgyList(false); }}
                                        onFocus={() => setShowBrgyList(true)}
                                        onBlur={() => setShowBrgyList(false)}
                                        className="w-full appearance-none border border-gray-200 rounded-lg px-4 py-3 text-sm bg-[#f8f9fc] focus:outline-none focus:ring-2 focus:ring-[#5b50d6] pr-8"
                                    >
                                        <option value="" disabled>Choose a reason....</option>
                                        {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M7 10l5 5 5-5z"/>
                                    </svg>
                                </div>

                                {/* "Other" textarea */}
                                {reason === 'Other' && (
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold text-gray-600">Please specify</label>
                                        <textarea
                                            value={otherText}
                                            onChange={(e) => setOtherText(e.target.value)}
                                            placeholder="Describe the reason...."
                                            rows={4}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-[#f8f9fc] focus:outline-none focus:ring-2 focus:ring-[#5b50d6] resize-none placeholder:text-gray-300"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Step 2: Select barangay ── */}
                        {step === 2 && !selectedGroup && (
                            <div className="flex flex-col gap-4">
                                <label className="text-xs font-semibold text-gray-600">Select a barangay (required)</label>
                                <div className="relative">
                                    <select
                                        value={barangay}
                                        onChange={(e) => setBarangay(e.target.value)}
                                        className="w-full appearance-none border border-gray-200 rounded-lg px-4 py-3 text-sm bg-[#f8f9fc] focus:outline-none focus:ring-2 focus:ring-[#5b50d6] pr-8"
                                    >
                                        <option value="" disabled>Choose a barangay....</option>
                                        {BARANGAYS.map((b) => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M7 10l5 5 5-5z"/>
                                    </svg>
                                </div>
                            </div>
                        )}

                        {/* ── Step 3a: Group suggestions ── */}
                        {step === 2 && selectedGroup === null && barangay === '' && null}
                        {step === 3 && !selectedGroup && (
                            <div className="flex flex-col gap-4">
                                <p className="text-sm text-gray-500">Recommended groups based on barangay, schedule, and preferences.</p>
                                <div className="flex flex-col gap-3">
                                    {SUGGESTED_GROUPS.map((g) => (
                                        <div key={g.name} className="flex items-center justify-between border border-gray-200 rounded-xl px-5 py-4 bg-[#f8f9fc]">
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{g.name}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">Mentor: {g.mentor}</p>
                                                <p className="text-xs text-gray-400">Brgy. {g.barangay} · {g.schedule}</p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedGroup(g)}
                                                className="text-xs font-semibold text-white px-4 py-2 rounded-lg transition-colors"
                                                style={{ background: '#5b50d6' }}
                                            >
                                                Select
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Step 3b: Confirm transfer ── */}
                        {step === 3 && selectedGroup && (
                            <div className="flex flex-col gap-5">
                                <div className="border border-gray-200 rounded-xl px-5 py-4 bg-[#f8f9fc] flex flex-col gap-2">
                                    <p className="font-semibold text-gray-900 text-sm">Confirm Transfer</p>
                                    <p className="text-sm text-gray-700">
                                        Forward <span className="font-bold">{menteeName}</span>'s request to{' '}
                                        <span className="font-bold">{selectedGroup.name}</span> ({selectedGroup.schedule})?
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        <span className="font-bold">Reason:</span> {displayReason}.
                                    </p>
                                </div>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    The receiving mentor will be notified, the member will be informed that another mentor is reviewing their request, and the transfer history will be preserved.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between">
                        {/* Back / Cancel */}
                        {step === 1 && (
                            <button onClick={onClose}
                                className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                        )}
                        {step === 2 && (
                            <button onClick={() => { setStep(1); setSelectedGroup(null); }}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                                Back
                            </button>
                        )}
                        {step === 3 && (
                            <button onClick={() => { setSelectedGroup(null); if (!selectedGroup) setStep(2); }}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                                Back
                            </button>
                        )}

                        {/* Next / Confirm */}
                        {step === 1 && (
                            <button
                                onClick={() => setStep(2)}
                                disabled={!canNext1}
                                className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ background: '#5b50d6' }}
                            >
                                Next
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
                            </button>
                        )}
                        {step === 2 && !selectedGroup && (
                            <button
                                onClick={() => setStep(3)}
                                disabled={!canNext2}
                                className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ background: '#5b50d6' }}
                            >
                                Next
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
                            </button>
                        )}
                        {step === 3 && selectedGroup && (
                            <button
                                onClick={() => { onConfirm(); onClose(); }}
                                className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white rounded-lg transition-colors"
                                style={{ background: '#5b50d6' }}
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                Confirm transfer
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
