'use client';

import type { PotentialMentee } from '@/lib/data';

interface Props {
    mentee: PotentialMentee;
    onClose: () => void;
    onAccept: () => void;
    onRecommend: () => void;
}

const STATUS_STYLE: Record<string, string> = {
    'Pending':      'bg-[#fef9c3] text-[#92400e]',
    'Accepted':     'bg-[#dcfce7] text-[#166534]',
    'Recommended':  'bg-[#ede9fe] text-[#6741d9]',
};

const AVATAR_COLORS = ['#5b50d6', '#e91e8c', '#0b9b8a', '#e67700', '#6741d9'];
function avatarColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// Format today as submitted date
const SUBMITTED = new Date().toISOString().split('T')[0];

export default function MenteeDetailsModal({ mentee, onClose, onAccept, onRecommend }: Props) {
    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[100] bg-black/40" onClick={onClose} />

            {/* Slide-in panel */}
            <div className="fixed top-0 right-0 bottom-0 z-[101] w-[480px] max-w-full bg-white shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Mentee Request Details</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Submitted {SUBMITTED}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 transition-colors">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-4 mt-4">

                    {/* Mentee identity */}
                    <div className="flex items-center gap-3 mb-1">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                            style={{ background: avatarColor(mentee.name) }}
                        >
                            {mentee.initials}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-base">{mentee.name}</p>
                            <p className="text-xs text-gray-400">
                                {mentee.source} · {mentee.phone}
                            </p>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${STATUS_STYLE[mentee.status] ?? 'bg-gray-100 text-gray-500'}`}>
                                {mentee.status}
                            </span>
                        </div>
                    </div>

                    {/* Personal Information */}
                    <section className="rounded-xl border border-gray-100 bg-[#f8f9fc] overflow-hidden">
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-2">Personal Information</p>
                        <div className="divide-y divide-gray-100">
                            {[
                                { label: 'Email Address',              value: mentee.email },
                                { label: 'Phone Number',               value: mentee.phone },
                                { label: 'Birthday',                   value: mentee.birthday },
                                { label: 'Gender',                     value: mentee.gender },
                                { label: 'Facebook Link',              value: `Facebook.com/${mentee.facebook}` },
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
                </div>

                {/* Footer actions */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
                    <button
                        onClick={() => { onAccept(); }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors"
                        style={{ background: '#5b50d6' }}
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Accept Mentee
                    </button>
                    <button
                        onClick={() => { onRecommend(); onClose(); }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                        </svg>
                        Recommend
                    </button>
                </div>
            </div>
        </>
    );
}
