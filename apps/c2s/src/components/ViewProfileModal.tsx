'use client';

import type { GroupMember } from '@/lib/data';

interface Props {
    member: GroupMember;
    groupName: string;
    onClose: () => void;
    onBack: () => void;
}

const STATUS_STYLE: Record<string, string> = {
    'Active':         'bg-[#dcfce7] text-[#166534]',
    'Pending Review': 'bg-[#fef9c3] text-[#854d0e]',
    'Inactive':       'bg-gray-100 text-gray-500',
};

const AVATAR_COLORS = ['#5b50d6', '#e91e8c', '#0b9b8a', '#e67700', '#6741d9'];
function avatarColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default function ViewProfileModal({ member, groupName, onClose }: Props) {
    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[100] bg-black/40" onClick={onClose} />

            {/* Slide-in panel */}
            <div className="fixed top-0 right-0 bottom-0 z-[101] w-[480px] max-w-full bg-white shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0"
                                style={{ background: avatarColor(member.name) }}
                            >
                                {member.initials}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-black text-gray-900">{member.name}</h2>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ede9fe] text-[#5b50d6]">
                                        {groupName}
                                    </span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${STATUS_STYLE[member.status] ?? 'bg-gray-100 text-gray-500'}`}>
                                    {member.status}
                                </span>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 transition-colors">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-6 pb-8 flex flex-col gap-4 mt-4">

                    {/* Personal Information */}
                    <section className="rounded-xl border border-gray-100 bg-[#f8f9fc] overflow-hidden">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-2">Personal Information</p>
                        <div className="divide-y divide-gray-100">
                            {[
                                { label: 'Email Address',            value: member.email },
                                { label: 'Phone Number',             value: member.phone },
                                { label: 'Birthday',                 value: member.birthday },
                                { label: 'Facebook Name',            value: member.facebook },
                                { label: 'First Time Attended Church', value: member.firstAttended },
                            ].map((row) => (
                                <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                                    <span className="text-xs text-gray-500">{row.label}</span>
                                    <span className="text-xs font-semibold text-gray-800">{row.value}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Devotional Timeline */}
                    <section className="rounded-xl border border-gray-100 bg-[#f8f9fc] px-4 py-3">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Devotional Timeline</p>

                        {/* Overall progress */}
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-gray-500">Overall progress</span>
                            <span className="text-xs font-bold text-[#5b50d6]">{member.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                            <div
                                className="h-full rounded-full"
                                style={{ width: `${member.progress}%`, background: '#5b50d6' }}
                            />
                        </div>

                        {/* Current module */}
                        <p className="text-[10px] text-gray-400 mb-0.5">Current</p>
                        <p className="text-sm font-bold text-gray-800">{member.currentModule}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{member.currentLesson}</p>
                    </section>

                    {/* Trainings Attended */}
                    <section className="rounded-xl border border-gray-100 bg-[#f8f9fc] overflow-hidden">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-2">Trainings Attended</p>
                        <div className="divide-y divide-gray-100">
                            {member.trainings.map((t) => (
                                <div key={t.label} className="flex items-center justify-between px-4 py-2.5">
                                    <span className="text-xs text-gray-700">{t.label}</span>
                                    <span className="text-xs text-gray-500">{t.year}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
