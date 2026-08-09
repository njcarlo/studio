'use client';

import { useState } from 'react';
import { BARANGAYS, SUBDIVISIONS_BY_BARANGAY } from '@/lib/data';

interface Props {
    onClose: () => void;
    onCreate: (group: {
        name: string; description: string; groupType: string; status: string;
        meetingDay: string; meetingTime: string; frequency: string; duration: string;
        conduct: string; barangay?: string; subdivision?: string;
        satellite?: string; ageGroup?: string; gender?: string;
    }) => void;
}

const DAYS        = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const TIMES       = ['8:00 AM','8:30 AM','9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM','5:30 PM','6:00 PM','7:00 PM','8:00 PM'];
const FREQUENCIES = ['Weekly','Once a week','Once a month','Once a year'];
const DURATIONS   = ['1 hr','2 hrs','3 hrs','4 hrs','5 hrs','6 hrs','7 hrs','8 hrs','9 hrs','10 hrs','11 hrs','12 hrs'];
const GROUP_TYPES = ['Youth','Young Adults',"Men's","Ladies'",'Couples','Open to All'];
const STATUSES    = ['Exclusive','Open'];
const SATELLITES  = ['COG Dasmarinas','COG Silang','COG Jabez','COG Trece'];
const CONDUCT_OPTIONS = ['Church base','Community base'];
const GENDERS     = ['Female','Male','Both'];

const INPUT = 'border border-gray-200 rounded-lg px-3 py-2 text-sm placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5b50d6] bg-[#f8f9fc] w-full';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700">{label}</label>
            {children}
        </div>
    );
}

function Sel({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
    return (
        <div className="relative">
            <select value={value} onChange={(e) => onChange(e.target.value)}
                className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm bg-[#f8f9fc] focus:outline-none focus:ring-2 focus:ring-[#5b50d6] pr-8 text-gray-700">
                {options.map((o) => <option key={o}>{o}</option>)}
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5z"/>
            </svg>
        </div>
    );
}

export default function CreateGroupModal({ onClose, onCreate }: Props) {
    const [name, setName]               = useState('');
    const [groupType, setGroupType]     = useState('Youth');
    const [description, setDescription] = useState('');
    const [status, setStatus]           = useState('Exclusive');
    const [meetingDay, setMeetingDay]   = useState('Monday');
    const [meetingTime, setMeetingTime] = useState('8:00 AM');
    const [frequency, setFrequency]     = useState('Weekly');
    const [duration, setDuration]       = useState('1 hr');
    const [conduct, setConduct]         = useState('Church base');
    const [satellite, setSatellite]     = useState('COG Dasmarinas');
    const [barangay, setBarangay]       = useState('Burol');
    const [subdivision, setSubdivision] = useState('');
    const [customSubdivision, setCustomSubdivision] = useState('');
    const [ageGroup, setAgeGroup]       = useState('25-35');
    const [gender, setGender]           = useState('Female');

    const isCommunity = conduct === 'Community base';
    const isOther = subdivision === 'Other';

    // Get subdivisions for the currently selected barangay
    const subdivisionOptions = SUBDIVISIONS_BY_BARANGAY[barangay] ?? [];

    function handleBarangayChange(val: string) {
        setBarangay(val);
        setSubdivision('');
        setCustomSubdivision('');
    }

    function handleCreate() {
        if (!name.trim()) return;
        onCreate({
            name, description, groupType, status, meetingDay, meetingTime,
            frequency, duration, conduct,
            barangay: isCommunity ? barangay : undefined,
            subdivision: isCommunity ? (isOther ? customSubdivision : subdivision) : undefined,
            satellite: !isCommunity ? satellite : undefined,
            ageGroup, gender,
        });
        onClose();
    }

    return (
        <>
            <div className="fixed inset-0 z-[100] bg-black/50" onClick={onClose} />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4" onClick={onClose}>
                <div
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-8 pt-7 pb-5 border-b border-gray-100 flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Create New Group</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Changes automatically sync with the C2S Group Finder.</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 transition-colors mt-0.5">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-7">

                        {/* ── Basic Information ── */}
                        <section>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Basic Information</p>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Group Name">
                                    <input type="text" placeholder="e.g. Salt & Light Youth" value={name}
                                        onChange={(e) => setName(e.target.value)} className={INPUT} />
                                </Field>
                                <Field label="Group Type">
                                    <Sel value={groupType} onChange={setGroupType} options={GROUP_TYPES} />
                                </Field>
                                <Field label="Short Description">
                                    <input type="text" placeholder="One-line Description" value={description}
                                        onChange={(e) => setDescription(e.target.value)} className={INPUT} />
                                </Field>
                                <Field label="Status">
                                    <Sel value={status} onChange={setStatus} options={STATUSES} />
                                </Field>
                            </div>
                        </section>

                        {/* ── Meeting Information ── */}
                        <section>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Meeting Information</p>
                            <div className="grid grid-cols-4 gap-4">
                                <Field label="Meeting Day">
                                    <Sel value={meetingDay} onChange={setMeetingDay} options={DAYS} />
                                </Field>
                                <Field label="Meeting Time">
                                    <Sel value={meetingTime} onChange={setMeetingTime} options={TIMES} />
                                </Field>
                                <Field label="Frequency">
                                    <Sel value={frequency} onChange={setFrequency} options={FREQUENCIES} />
                                </Field>
                                <Field label="Est. Duration">
                                    <Sel value={duration} onChange={setDuration} options={DURATIONS} />
                                </Field>
                            </div>
                        </section>

                        {/* ── Location ── */}
                        <section>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Location</p>
                            <div className="flex flex-col gap-4">
                                {/* Conduct dropdown — always visible */}
                                <div style={{ maxWidth: '50%' }}>
                                    <Field label="I will conduct my C2S:">
                                        <Sel value={conduct} onChange={setConduct} options={CONDUCT_OPTIONS} />
                                    </Field>
                                </div>

                                {/* Church base → Satellite Churches */}
                                {!isCommunity && (
                                    <div style={{ maxWidth: '50%' }}>
                                        <Field label="Satellite Churches">
                                            <Sel value={satellite} onChange={setSatellite} options={SATELLITES} />
                                        </Field>
                                    </div>
                                )}

                                {/* Community base → Barangay + Subdivision */}
                                {isCommunity && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="Barangay">
                                                <Sel value={barangay} onChange={handleBarangayChange} options={BARANGAYS} />
                                            </Field>
                                        </div>
                                        <Field label="Subdivision/Village">
                                            <div className="relative">
                                                <select
                                                    value={subdivision}
                                                    onChange={(e) => {
                                                        setSubdivision(e.target.value);
                                                        if (e.target.value !== 'Other') setCustomSubdivision('');
                                                    }}
                                                    className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm bg-[#f8f9fc] focus:outline-none focus:ring-2 focus:ring-[#5b50d6] pr-8 text-gray-700"
                                                >
                                                    <option value="">— Select subdivision —</option>
                                                    {subdivisionOptions.map((s) => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                    <option value="Other">Other</option>
                                                </select>
                                                <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M7 10l5 5 5-5z"/>
                                                </svg>
                                            </div>
                                            {isOther && (
                                                <input
                                                    type="text"
                                                    placeholder="Enter subdivision or village name"
                                                    value={customSubdivision}
                                                    onChange={(e) => setCustomSubdivision(e.target.value)}
                                                    className={INPUT + ' mt-2'}
                                                />
                                            )}
                                        </Field>
                                    </>
                                )}
                            </div>
                        </section>

                        {/* ── Group Preferences — always shown ── */}
                        <section>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Group Preferences</p>
                            <div className="grid grid-cols-2 gap-4" style={{ maxWidth: '50%' }}>
                                <Field label="Age group">
                                    <input type="text" value={ageGroup}
                                        onChange={(e) => setAgeGroup(e.target.value)} className={INPUT} />
                                </Field>
                                <Field label="Gender">
                                    <Sel value={gender} onChange={setGender} options={GENDERS} />
                                </Field>
                            </div>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-end gap-3">
                        <button onClick={onClose}
                            className="px-5 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleCreate} disabled={!name.trim()}
                            className="px-6 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: '#5b50d6' }}>
                            Create Group
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
