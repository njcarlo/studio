'use client';

import { useState, useRef } from 'react';
import type { EndorsedGroup } from '@/lib/data';
import { BARANGAYS } from '@/lib/data';

interface Props {
    group: EndorsedGroup;
    onClose: () => void;
    onSave: () => void;
}

const DAYS        = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const TIMES       = ['8:00 AM','8:30 AM','9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM','5:30 PM','6:00 PM','7:00 PM','8:00 PM'];
const FREQUENCIES = ['Weekly','Once a week','Once a month','Once a year'];
const DURATIONS   = ['1 hr','2 hrs','3 hrs','4 hrs','5 hrs','6 hrs','7 hrs','8 hrs','9 hrs','10 hrs','11 hrs','12 hrs'];
const STATUSES    = ['Open','Exclusive'];
const CONDUCT_OPTIONS = ['Church base','Community base'];
const SATELLITES  = ['COG Dasmarinas','COG Silang','COG Jabez','COG Trece'];
const GENDERS     = ['Female','Male','Both'];
const SUBDIVISIONS = ['Metrogate Dasmariñas Subdivision','Greenwoods Village','Town & Country Dasmariñas','Marilag Subdivision','Orchard','Grand Royale','Phase 1','Phase 2','Phase 3','BF Homes','Avida Settings','Amaia Steps','Lancaster New City'];

function Sel({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
    return (
        <div className="relative">
            <select value={value} onChange={e => onChange(e.target.value)}
                className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm bg-[#f8f9fc] focus:outline-none focus:ring-2 focus:ring-[#5b50d6] pr-8">
                {options.map(o => <option key={o}>{o}</option>)}
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-700">{label}</label>{children}</div>;
}

const INPUT = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b50d6] bg-[#f8f9fc] w-full placeholder:text-gray-300';

export default function EndorsedEditGroupModal({ group, onClose, onSave }: Props) {
    const [name, setName]           = useState(group.name);
    const [description, setDesc]    = useState('A vibrant mentor group growing in faith and fellowship.');
    const [status, setStatus]       = useState('Open');
    const [day, setDay]             = useState('Friday');
    const [time, setTime]           = useState('7:00 PM');
    const [freq, setFreq]           = useState('Weekly');
    const [dur, setDur]             = useState('1 hr');
    const [conduct, setConduct]     = useState('Church base');
    const [satellite, setSatellite] = useState('COG Dasmarinas');
    const [barangay, setBarangay]   = useState('Burol');
    const [subdivision, setSubdiv]  = useState('');
    const [subdivSugg, setSubdivSugg] = useState<string[]>([]);
    const [showSugg, setShowSugg]   = useState(false);
    const [ageGroup, setAgeGroup]   = useState('25-35');
    const [gender, setGender]       = useState('Both');
    const subdivRef = useRef<HTMLDivElement>(null);

    const isCommunity = conduct === 'Community base';

    function handleSubdivChange(val: string) {
        setSubdiv(val);
        setSubdivSugg(SUBDIVISIONS.filter(s => s.toLowerCase().includes(val.toLowerCase())));
        setShowSugg(val.length > 0);
    }

    return (
        <>
            <div className="fixed inset-0 z-[100] bg-black/50" onClick={onClose} />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="px-8 pt-7 pb-5 border-b border-gray-100 flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Edit Group</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Changes automatically sync with the {group.name} group.</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-7">
                        {/* Basic Info */}
                        <section>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Basic Information</p>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Group Name"><input type="text" value={name} onChange={e => setName(e.target.value)} className={INPUT} /></Field>
                                <Field label="Group Type"><input type="text" value="Mentor" readOnly className={INPUT + ' text-gray-400 cursor-default'} /></Field>
                                <Field label="Short Description"><input type="text" value={description} onChange={e => setDesc(e.target.value)} className={INPUT} /></Field>
                                <Field label="Status"><Sel value={status} onChange={setStatus} options={STATUSES} /></Field>
                            </div>
                        </section>

                        {/* Meeting Info */}
                        <section>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Meeting Information</p>
                            <div className="grid grid-cols-4 gap-4">
                                <Field label="Meeting Day"><Sel value={day} onChange={setDay} options={DAYS} /></Field>
                                <Field label="Meeting Time"><Sel value={time} onChange={setTime} options={TIMES} /></Field>
                                <Field label="Frequency"><Sel value={freq} onChange={setFreq} options={FREQUENCIES} /></Field>
                                <Field label="Est. Duration"><Sel value={dur} onChange={setDur} options={DURATIONS} /></Field>
                            </div>
                        </section>

                        {/* Location */}
                        <section>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Location</p>
                            <div className="flex flex-col gap-4">
                                <div style={{ maxWidth: '50%' }}>
                                    <Field label="I will conduct my C2S:"><Sel value={conduct} onChange={setConduct} options={CONDUCT_OPTIONS} /></Field>
                                </div>
                                {!isCommunity && (
                                    <div style={{ maxWidth: '50%' }}>
                                        <Field label="Satellite Churches"><Sel value={satellite} onChange={setSatellite} options={SATELLITES} /></Field>
                                    </div>
                                )}
                                {isCommunity && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="Barangay"><Sel value={barangay} onChange={setBarangay} options={BARANGAYS} /></Field>
                                        </div>
                                        <Field label="Subdivision/Village">
                                            <div ref={subdivRef} className="relative">
                                                <input type="text" placeholder="e.g. Orchard" value={subdivision}
                                                    onChange={e => handleSubdivChange(e.target.value)}
                                                    onBlur={() => setTimeout(() => setShowSugg(false), 150)}
                                                    className={INPUT} />
                                                {showSugg && subdivSugg.length > 0 && (
                                                    <ul className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-44 overflow-y-auto">
                                                        {subdivSugg.map(s => (
                                                            <li key={s} onMouseDown={() => { setSubdiv(s); setShowSugg(false); }}
                                                                className="px-3 py-2 text-sm text-gray-700 hover:bg-[#f0effe] cursor-pointer">{s}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </Field>
                                    </>
                                )}
                            </div>
                        </section>

                        {/* Group Preferences — always shown for Endorsed */}
                        <section>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Group Preferences</p>
                            <div className="grid grid-cols-2 gap-4" style={{ maxWidth: '50%' }}>
                                <Field label="Age group"><input type="text" value={ageGroup} onChange={e => setAgeGroup(e.target.value)} className={INPUT} /></Field>
                                <Field label="Gender"><Sel value={gender} onChange={setGender} options={GENDERS} /></Field>
                            </div>
                        </section>
                    </div>

                    <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-end gap-3">
                        <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                        <button onClick={() => { onSave(); onClose(); }} className="px-6 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: '#5b50d6' }}>Save Changes</button>
                    </div>
                </div>
            </div>
        </>
    );
}
