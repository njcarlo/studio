'use client';

import CustomSelect from '@/components/CustomSelect';
import ConfirmModal from '@/components/ConfirmModal';
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
        <CustomSelect value={value} onChange={e => onChange(e.target.value)} className="w-full">
            <option value="" disabled>{placeholder}</option>
            {options.map(o => <option key={o}>{o}</option>)}
        </CustomSelect>
    );
}

export default function TransferToGroupModal({ menteeName, menteeGender, onClose, onConfirm }: Props) {
    const [step, setStep]         = useState<1 | 2>(1);
    const [selectedGroup, setSelectedGroup] = useState('');

    const groupNames = C2S_GROUPS.map(g => g.name);
    const pronoun    = menteeGender === 'Male' ? 'He' : 'She';

    if (step === 1) {
        return (
            <ConfirmModal
                open
                variant="default"
                icon="check"
                title="Transfer to a Group?"
                description={
                    <>
                        Add <strong className="font-semibold text-[#181F26] dark:text-[#E6EDF3]">{menteeName}</strong> to an existing group?{' '}
                        {pronoun} will be added to the group and mentoring will continue under the group mentor.
                    </>
                }
                cancelLabel="Cancel"
                confirmLabel="Next"
                onCancel={onClose}
                onConfirm={() => setStep(2)}
            />
        );
    }

    return (
        <>
            <div className="fixed inset-0 z-[9999] bg-black/50" onClick={onClose} />
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col" onClick={e => e.stopPropagation()}>

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
                                <button type="button" onClick={() => setStep(1)}
                                    className="px-[1.375rem] py-[0.625rem] text-sm font-bold text-[#181F26] dark:text-[#E6EDF3] bg-white dark:bg-[#1A2026] border border-[#E2E8E5] dark:border-[#2A323D] rounded-xl hover:bg-gray-50 dark:hover:bg-[#222933] focus:outline-none focus:ring-4 focus:ring-[#0E5B52]/25 transition-colors cursor-pointer">
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { if (selectedGroup) { onConfirm(); onClose(); } }}
                                    disabled={!selectedGroup}
                                    className="px-[1.375rem] py-[0.625rem] text-sm font-bold text-white rounded-xl bg-[#0E5B52] hover:bg-[#09423B] focus:outline-none focus:ring-4 focus:ring-[#0E5B52]/25 transition-all cursor-pointer disabled:bg-[#0E5B52] disabled:opacity-45 disabled:cursor-not-allowed">
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
