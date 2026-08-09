'use client';

import { useState, useRef } from 'react';
import type { C2SGroup } from '@/lib/data';
import { BARANGAYS } from '@/lib/data';

interface Props {
    group: C2SGroup;
    onClose: () => void;
    onSave: (updated: C2SGroup) => void;
}

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const TIMES = [
    '8:00 AM','8:30 AM','9:00 AM','9:30 AM','10:00 AM','10:30 AM',
    '11:00 AM','11:30 AM','12:00 PM','12:30 PM','1:00 PM','1:30 PM',
    '2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM',
    '5:00 PM','5:30 PM','6:00 PM',
];

const FREQUENCIES = ['Weekly','Once a week','Once a month','Once a year'];

const DURATIONS = [
    '1 hr','2 hrs','3 hrs','4 hrs','5 hrs','6 hrs',
    '7 hrs','8 hrs','9 hrs','10 hrs','11 hrs','12 hrs',
];

const GROUP_TYPES  = ['Youth','Young Adults',"Men's","Ladies'",'Couples','Open to All'];
const STATUSES     = ['Exclusive','Open'];
const SATELLITE_CHURCHES = ['COG Dasmarinas','COG Silang','COG Jabez','COG Trece'];
const GENDERS      = ['Female','Male','Both'];

const SUBDIVISIONS = [
    'Metrogate Dasmariñas Subdivision','Greenwoods Village','Town & Country Dasmariñas',
    'Marilag Subdivision','Orchard','Grand Royale','Phase 1','Phase 2','Phase 3',
    'BF Homes','Avida Settings','Amaia Steps','Lancaster New City',
];

function parseSchedule(schedule: string) {
    const parts = schedule.split('·').map((s) => s.trim());
    return { day: parts[0] ?? 'Friday', time: parts[1] ?? '8:00 AM' };
}

export default function EditGroupModal({ group, onClose, onSave }: Props) {
    const { day: initDay, time: initTime } = parseSchedule(group.schedule);

    const [name, setName]               = useState(group.name);
    const [groupType, setGroupType]     = useState(GROUP_TYPES[0]);
    const [description, setDescription] = useState(group.description);
    const [status, setStatus]           = useState<string>(group.status === 'Open' ? 'Open' : 'Exclusive');
    const [meetingDay, setMeetingDay]   = useState(initDay);
    const [meetingTime, setMeetingTime] = useState(initTime);
    const [frequency, setFrequency]     = useState('Weekly');
    const [duration, setDuration]       = useState('1 hr');
    // Exclusive location
    const [satellite, setSatellite]     = useState('Church of God Dasmariñas');
    // Open location
    const [barangay, setBarangay]       = useState(group.barangay ?? 'Burol');
    const [subdivision, setSubdivision] = useState(group.location ?? '');
    const [subdivSuggestions, setSubdivSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions]     = useState(false);
    // Group preferences
    const [ageGroup, setAgeGroup]       = useState('18-25');
    const [gender, setGender]           = useState('Male');

    const subdivRef = useRef<HTMLDivElement>(null);
    const isOpen = status === 'Open';

    function handleSubdivChange(val: string) {
        setSubdivision(val);
        if (val.length > 0) {
            setSubdivSuggestions(SUBDIVISIONS.filter((s) => s.toLowerCase().includes(val.toLowerCase())));
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    }

    function handleSave() {
        onSave({
            ...group,
            name,
            description,
            status: isOpen ? 'Open' : 'Open', // keep type compat; Exclusive maps to Closed visually
            schedule: `${meetingDay} · ${meetingTime}`,
            meetupDay: meetingDay,
            location: isOpen ? subdivision || group.location : group.location,
            barangay: isOpen ? barangay : group.barangay,
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
                    <div className="px-8 pt-7 pb-5 border-b border-gray-100">
                        <h2 className="text-xl font-black text-gray-900">Edit Group</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Changes sync automatically to the C2S Group Finder.</p>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-7">

                        {/* ── Basic Information ── */}
                        <section>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Basic Information</p>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Group Name">
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={INPUT} />
                                </Field>
                                <Field label="Group Type">
                                    <Sel value={groupType} onChange={setGroupType} options={GROUP_TYPES} />
                                </Field>
                                <Field label="Short Description">
                                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={INPUT} />
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

                            {/* Exclusive: Church base + Satellite Churches */}
                            {!isOpen && (
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="I will conduct my C2S:">
                                        <div className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-[#f8f9fc] text-gray-500">
                                            Church base
                                        </div>
                                    </Field>
                                    <Field label="Satellite Churches">
                                        <Sel value={satellite} onChange={setSatellite} options={SATELLITE_CHURCHES} />
                                    </Field>
                                </div>
                            )}

                            {/* Open: Community base + Barangay + Subdivision */}
                            {isOpen && (
                                <div className="flex flex-col gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Field label="I will conduct my C2S:">
                                            <div className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-[#f8f9fc] text-gray-500">
                                                Community base
                                            </div>
                                        </Field>
                                        <Field label="Barangay">
                                            <Sel value={barangay} onChange={setBarangay} options={BARANGAYS} />
                                        </Field>
                                    </div>
                                    <Field label="Subdivision/Village">
                                        <div ref={subdivRef} className="relative">
                                            <input
                                                type="text"
                                                placeholder="e.g. Orchard"
                                                value={subdivision}
                                                onChange={(e) => handleSubdivChange(e.target.value)}
                                                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                                className={INPUT}
                                            />
                                            {showSuggestions && subdivSuggestions.length > 0 && (
                                                <ul className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-44 overflow-y-auto">
                                                    {subdivSuggestions.map((s) => (
                                                        <li key={s}
                                                            onMouseDown={() => { setSubdivision(s); setShowSuggestions(false); }}
                                                            className="px-3 py-2 text-sm text-gray-700 hover:bg-[#f0effe] cursor-pointer"
                                                        >{s}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </Field>
                                </div>
                            )}
                        </section>

                        {/* ── Group Preferences — only when Status is Open ── */}
                        {status === 'Open' && (
                        <section>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Group Preferences</p>
                            <div className="grid grid-cols-2 gap-4" style={{ maxWidth: '50%' }}>
                                <Field label="Age group">
                                    <input type="text" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} className={INPUT} />
                                </Field>
                                <Field label="Gender">
                                    <Sel value={gender} onChange={setGender} options={GENDERS} />
                                </Field>
                            </div>
                        </section>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-end gap-3">
                        <button onClick={onClose}
                            className="px-5 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleSave}
                            className="px-6 py-2 text-sm font-bold text-white rounded-lg transition-colors"
                            style={{ background: '#5b50d6' }}>
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ── Shared sub-components ── */
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
                className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b50d6] bg-[#f8f9fc] pr-8">
                {options.map((o) => <option key={o}>{o}</option>)}
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5z"/>
            </svg>
        </div>
    );
}
