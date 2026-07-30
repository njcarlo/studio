'use client';

import { useState } from 'react';
import { C2S_GROUPS } from '@/lib/data';

interface Props {
    menteeName: string;
    menteeGender: string;
    onClose: () => void;
    onConfirm: () => void;
}

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

export default function TransferToGroupModal({ menteeName, menteeGender, onClose, onConfirm }: Props) {
    const [step, setStep]         = useState<1 | 2>(1);
    const [selectedGroup, setSelectedGroup] = useState('');

    const groupNames = C2S_GROUPS.map(g => g.name);
    const pronoun    = menteeGender === 'Male' ? 'He' : 'She';

    return (
        <>
            <div className="fixed inset-0 z-[200] bg-black/40" onClick={onClose} />
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col" onClick={e => e.stopPropagation()}>

                    {/* ── Step 1: Confirm ── */}
                    {step === 1 && (
                        <div className="p-8 flex flex-col gap-6">
                            <h2 className="text-2xl font-semibold text-gray-900">Transfer to a Group</h2>
                            <hr className="border-gray-100" />
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Add <span className="font-bold text-gray-900">{menteeName}</span> to an existing group?{' '}
                                {pronoun} will be added to the group and mentoring will continue under the group mentor.
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

                    {/* ── Step 2: Select Group ── */}
                    {step === 2 && (
                        <div className="p-8 flex flex-col gap-6">
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900">Select Group</h2>
                                <p className="text-xs text-gray-400 mt-1">Choose the group where the mentee will be added.</p>
                            </div>
                            <hr className="border-gray-100" />
                            <Sel placeholder="Select Group" options={groupNames} value={selectedGroup} onChange={setSelectedGroup} />
                            <hr className="border-gray-100" />
                            <div className="flex items-center justify-between">
                                <button onClick={() => setStep(1)}
                                    className="px-5 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={() => { if (selectedGroup) { onConfirm(); onClose(); } }}
                                    disabled={!selectedGroup}
                                    className="px-6 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{ background: '#5b50d6' }}>
                                    Add
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
