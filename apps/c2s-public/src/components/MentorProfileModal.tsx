'use client';

interface MentorProfile {
    id: string;
    initials: string;
    name: string;
    avatar: string;
    group: string;
    barangay: string;
    phone: string;
    email: string;
    activeMentees: number;
    attendance: number;
    completion: number;
    devotion: number;
    status: 'Active' | 'Inactive';
}

interface Props {
    mentor: MentorProfile;
    onClose: () => void;
}

const TRAININGS = [
    'CLDP 1', 'CLDP 2', 'CLDP 3', 'LIFE Movers',
    'LIFE Ambassadors', 'LAMP', 'LW3H', 'C2S 101', 'ASP', 'KnOT',
];

export default function MentorProfileModal({ mentor, onClose }: Props) {
    return (
        <>
            <div className="fixed inset-0 z-[100] bg-black/40" onClick={onClose} />
            <div className="fixed top-0 right-0 bottom-0 z-[101] w-[480px] max-w-full bg-white shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Mentor Profile</h2>
                            <p className="text-xs text-gray-400 mt-0.5">{mentor.group}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 transition-colors">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-6 pb-8 flex flex-col gap-5 mt-5">

                    {/* Identity */}
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-black shrink-0"
                            style={{ background: mentor.avatar }}>
                            {mentor.initials}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-gray-900 text-base">{mentor.name}</p>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    mentor.status === 'Active'
                                        ? 'bg-[#dcfce7] text-[#166534]'
                                        : 'bg-gray-100 text-gray-500'
                                }`}>{mentor.status}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{mentor.id}</p>
                        </div>
                    </div>

                    {/* Personal Information */}
                    <section className="rounded-xl border border-gray-100 bg-[#f8f9fc] overflow-hidden">
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-2">Personal Information</p>
                        <div className="divide-y divide-gray-100">
                            {[
                                { label: 'Group',      value: mentor.group },
                                { label: 'Barangay',   value: mentor.barangay },
                                { label: 'Phone',      value: mentor.phone },
                                { label: 'Email',      value: mentor.email },
                            ].map((row) => (
                                <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                                    <span className="text-xs text-gray-500">{row.label}</span>
                                    <span className="text-xs font-medium text-gray-800">{row.value}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Performance */}
                    <section className="rounded-xl border border-gray-100 bg-[#f8f9fc] px-4 py-4">
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Performance Overview</p>

                        {/* Stat boxes */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            {[
                                { label: 'Active Mentees', value: mentor.activeMentees },
                                { label: 'Attendance',     value: `${mentor.attendance}%` },
                                { label: 'Completion',     value: `${mentor.completion}%` },
                            ].map((s) => (
                                <div key={s.label} className="bg-white rounded-xl px-3 py-3 text-center border border-gray-100">
                                    <p className="text-base font-black text-gray-900">{s.value}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Progress bars */}
                        <div className="flex flex-col gap-3">
                            {[
                                { label: 'Attendance',          pct: mentor.attendance },
                                { label: 'Lesson Completion',   pct: mentor.completion },
                                { label: 'Devotion Completion', pct: mentor.devotion },
                            ].map((b) => (
                                <div key={b.label}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[11px] text-gray-500">{b.label}</span>
                                        <span className="text-[11px] font-semibold text-[#5b50d6]">{b.pct}%</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all"
                                            style={{ width: `${b.pct}%`, background: '#5b50d6' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Trainings */}
                    <section className="rounded-xl border border-gray-100 bg-[#f8f9fc] overflow-hidden">
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-2">Trainings Attended</p>
                        <div className="divide-y divide-gray-100">
                            {TRAININGS.map((t) => (
                                <div key={t} className="flex items-center justify-between px-4 py-2.5">
                                    <span className="text-xs text-gray-700">{t}</span>
                                    <span className="text-xs text-gray-400">—</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
