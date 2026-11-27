'use client';

import CustomSelect from '@/components/CustomSelect';
import { useState, useRef } from 'react';
import type { C2SGroup } from '@/lib/data';
import { BARANGAYS_BY_SATELLITE } from '@/lib/data';
import { useSatellites } from '@/lib/satellite-context';

interface Props {
    group: C2SGroup;
    onClose: () => void;
    onSave: (updated: C2SGroup) => void;
    onDelete?: () => void;
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
const MEETING_FORMATS  = ['Face to Face', 'Online'];
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

export default function EditGroupModal({ group, onClose, onSave, onDelete }: Props) {
    const { activeSatellites } = useSatellites();
    const satOptionNames = activeSatellites.map(s => s.name);
    const initialSat = group.satelliteName || group.satellite || (activeSatellites[0]?.name ?? 'COG Dasmarinas');

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
    const [satellite, setSatellite]     = useState(initialSat);
    const [meetingFormat, setMeetingFormat] = useState('Face to Face');
    // Open location
    const [communitySatellite, setCommunitySatellite] = useState(initialSat);
    const [barangay, setBarangay]       = useState(group.barangay ?? '');
    const communityBarangays            = BARANGAYS_BY_SATELLITE[communitySatellite] ?? (BARANGAYS_BY_SATELLITE['COG Dasmarinas'] || []);

    function handleCommunitySatelliteChange(val: string) {
        setCommunitySatellite(val);
        setBarangay('');
        setSubdivision('');
    }
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
        const chosenSatObj = activeSatellites.find(s => s.name === (!isOpen ? satellite : communitySatellite));
        onSave({
            ...group,
            name,
            description,
            status: isOpen ? 'Open' : 'Open', // keep type compat; Exclusive maps to Closed visually
            schedule: `${meetingDay} · ${meetingTime}`,
            meetupDay: meetingDay,
            location: isOpen ? subdivision || group.location : group.location,
            barangay: isOpen ? barangay : group.barangay,
            satellite: !isOpen ? satellite : communitySatellite,
            satelliteName: chosenSatObj?.name || (!isOpen ? satellite : communitySatellite),
            satelliteId: chosenSatObj?.id,
        });
        onClose();
    }

    return (
        <>
            <div className="fixed inset-0 z-[9999] bg-black/50" onClick={onClose} />
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" onClick={onClose}>
                <div
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-gray-100">
                        <h2 className="text-xl font-black text-gray-900">Edit Group</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Changes sync automatically to the C2S Group Finder.</p>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 flex flex-col gap-5">

                        {/* ── Basic Information ── */}
                        <section>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Basic Information</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

                            {/* Exclusive: Church base + Meeting Format + Satellite Churches */}
                            {!isOpen && (
                                <div className="flex flex-col gap-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Field label="I will conduct my C2S:">
                                            <div className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500" style={{ background: "var(--bg-subtle)" }}>
                                                Church base
                                            </div>
                                        </Field>
                                        <Field label="Meeting Format">
                                            <Sel value={meetingFormat} onChange={setMeetingFormat} options={MEETING_FORMATS} />
                                        </Field>
                                    </div>
                                    <div className="w-full sm:max-w-[50%]">
                                        <Field label="Satellite Churches">
                                            <Sel value={satellite} onChange={setSatellite} options={satOptionNames} />
                                        </Field>
                                    </div>
                                </div>
                            )}

                            {/* Open: Community base → Meeting Format → Satellite → Barangay + Subdivision */}
                            {isOpen && (
                                <div className="flex flex-col gap-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Field label="I will conduct my C2S:">
                                            <div className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500" style={{ background: "var(--bg-subtle)" }}>
                                                Community base
                                            </div>
                                        </Field>
                                        <Field label="Meeting Format">
                                            <Sel value={meetingFormat} onChange={setMeetingFormat} options={MEETING_FORMATS} />
                                        </Field>
                                    </div>
                                    <div className="w-full sm:max-w-[50%]">
                                        <Field label="Satellite Church">
                                            <Sel value={communitySatellite} onChange={handleCommunitySatelliteChange} options={satOptionNames} />
                                        </Field>
                                    </div>
                                    <div className="w-full sm:max-w-[50%]">
                                        <Field label="Barangay">
                                            <CustomSelect
                                                value={barangay}
                                                onChange={(e) => setBarangay(e.target.value)}
                                                className="w-full"
                                            >
                                                <option value="">— Select barangay —</option>
                                                {communityBarangays.map((b) => (
                                                    <option key={b} value={b}>{b}</option>
                                                ))}
                                            </CustomSelect>
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
                                                            className="px-3 py-2 text-sm text-gray-700 hover:bg-[#FEF3C7] cursor-pointer"
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:max-w-[50%]">
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
                    <div className="px-5 sm:px-8 py-5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            {onDelete && (
                                <button
                                    type="button"
                                    onClick={onDelete}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                        <path d="M10 11v6" />
                                        <path d="M14 11v6" />
                                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                    </svg>
                                    Delete Group
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-3 ml-auto">
                            <button type="button" onClick={onClose}
                                className="px-[1.375rem] py-[0.625rem] text-sm font-bold text-[#181F26] dark:text-[#E6EDF3] bg-white dark:bg-[#1A2026] border border-[#E2E8E5] dark:border-[#2A323D] rounded-xl hover:bg-gray-50 dark:hover:bg-[#222933] focus:outline-none focus:ring-4 focus:ring-[#0E5B52]/25 transition-colors cursor-pointer">
                                Cancel
                            </button>
                            <button type="button" onClick={handleSave}
                                className="px-[1.375rem] py-[0.625rem] text-sm font-bold text-white rounded-xl bg-[#0E5B52] hover:bg-[#09423B] focus:outline-none focus:ring-4 focus:ring-[#0E5B52]/25 transition-all cursor-pointer">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ── Shared sub-components ── */
const INPUT = 'border border-gray-200 rounded-lg px-3 py-2 text-sm placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D97706] bg-[#f8f9fc] w-full';

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
        <CustomSelect value={value} onChange={(e) => onChange(e.target.value)} className="w-full">
            {options.map((o) => <option key={o}>{o}</option>)}
        </CustomSelect>
    );
}
