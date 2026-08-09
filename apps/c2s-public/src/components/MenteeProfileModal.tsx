'use client';

import type { Mentee } from '@/lib/data';

interface Props {
    mentee: Mentee;
    onClose: () => void;
}

const AVATAR_COLORS = ['#5b50d6','#e91e8c','#0b9b8a','#e67700','#6741d9'];
function avatarColor(id: string) {
    let h = 0; for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default function MenteeProfileModal({ mentee, onClose }: Props) {
    return (
        <>
            <div className="fixed inset-0 z-[100] bg-black/40" onClick={onClose} />
            <div className="fixed top-0 right-0 bottom-0 z-[101] w-[480px] max-w-full bg-white shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Mentee Profile</h2>
                            <p className="text-xs text-gray-400 mt-0.5">{mentee.assignedGroup}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 transition-colors">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-6 pb-8 flex flex-col gap-4 mt-5">

                    {/* Identity */}
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                            style={{ background: avatarColor(mentee.id) }}>
                            {mentee.initials}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-base">{mentee.name}</p>
                            <p className="text-xs text-gray-400">Connected from {mentee.connectedSince}</p>
                        </div>
                    </div>

                    {/* Personal Information */}
                    <section className="rounded-xl border border-gray-100 bg-[#f8f9fc] overflow-hidden">
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-2">Personal Information</p>
                        <div className="divide-y divide-gray-100">
                            {[
                                { label: 'Email Address',              value: mentee.email },
                                { label: 'Phone Number',               value: mentee.phone },
                                { label: 'Age',                        value: String(mentee.age) },
                                { label: 'Birthday',                   value: mentee.birthday },
                                { label: 'Gender',                     value: mentee.gender },
                                { label: 'Facebook Link',              value: mentee.facebook },
                                { label: 'First Time Attended Church', value: mentee.firstAttended },
                            ].map((row) => (
                                <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                                    <span className="text-xs text-gray-500">{row.label}</span>
                                    <span className="text-xs font-medium text-gray-800">{row.value}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Devotional Timeline */}
                    <section className="rounded-xl border border-gray-100 bg-[#f8f9fc] px-4 py-3">
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Devotional Timeline</p>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-gray-500">Overall progress</span>
                            <span className="text-xs font-semibold text-[#5b50d6]">{mentee.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                            <div className="h-full rounded-full" style={{ width: `${mentee.progress}%`, background: '#5b50d6' }} />
                        </div>
                        <p className="text-[10px] text-gray-400 mb-0.5">Current</p>
                        <p className="text-sm font-semibold text-gray-800">{mentee.currentModule}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{mentee.currentLesson}</p>
                    </section>

                    {/* Trainings Attended */}
                    <section className="rounded-xl border border-gray-100 bg-[#f8f9fc] overflow-hidden">
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-2">Trainings Attended</p>
                        <div className="divide-y divide-gray-100">
                            {mentee.trainings.map((t) => (
                                <div key={t.label} className="flex items-center justify-between px-4 py-2.5">
                                    <span className="text-xs text-gray-700">{t.label}</span>
                                    <span className="text-xs text-gray-500">{t.year}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Mentor Notes */}
                    <section className="rounded-xl border border-gray-100 bg-[#f8f9fc] px-4 py-3">
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Mentor Notes</p>
                        <p className="text-xs text-gray-700 leading-relaxed">{mentee.mentorNotes}</p>
                    </section>
                </div>
            </div>
        </>
    );
}
