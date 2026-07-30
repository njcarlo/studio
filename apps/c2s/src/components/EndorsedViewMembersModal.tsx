'use client';

import { useState } from 'react';
import type { EndorsedGroup } from '@/lib/data';
import { ACTIVE_MENTEES } from '@/lib/data';
import MenteeProfileModal from './MenteeProfileModal';
import DevotionalProgressModal from './DevotionalProgressModal';

interface Props {
    group: EndorsedGroup;
    onClose: () => void;
}

const AVATAR_COLORS = ['#5b50d6','#e91e8c','#0b9b8a','#e67700','#6741d9'];
function ac(i: number) { return AVATAR_COLORS[i % AVATAR_COLORS.length]; }

// Static info for the group info grid
const GROUP_INFO = {
    groupName: 'Orchard Residences',
    groupType: 'Mentor',
    schedule: 'Friday · 7:00 PM',
    frequency: 'Weekly',
    satellite: 'Church of God Dasmariñas',
};

export default function EndorsedViewMembersModal({ group, onClose }: Props) {
    const [search, setSearch]       = useState('');
    const [viewProfile, setViewProfile] = useState<typeof ACTIVE_MENTEES[0] | null>(null);
    const [updating, setUpdating]   = useState<typeof ACTIVE_MENTEES[0] | null>(null);

    // Use first N active mentees as group members
    const allMembers = ACTIVE_MENTEES.slice(0, group.members);
    const members    = allMembers.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

    if (viewProfile) {
        return <MenteeProfileModal mentee={viewProfile} onClose={() => setViewProfile(null)} />;
    }
    if (updating) {
        return <DevotionalProgressModal mentee={updating} onClose={() => setUpdating(null)} />;
    }

    return (
        <>
            <div className="fixed inset-0 z-[100] bg-black/40" onClick={onClose} />
            <div className="fixed top-0 right-0 bottom-0 z-[101] w-[480px] max-w-full bg-white shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">{group.name}</h2>
                            <p className="text-xs text-gray-400 mt-0.5">{group.members} member{group.members !== 1 ? 's' : ''}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 transition-colors">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Group info grid */}
                <div className="mx-6 mt-5 rounded-xl border border-gray-100 bg-[#f8f9fc] grid grid-cols-2 divide-x divide-y divide-gray-100">
                    {[
                        { label: 'GROUP NAME',      value: GROUP_INFO.groupName },
                        { label: 'GROUP TYPE',       value: GROUP_INFO.groupType },
                        { label: 'MEETING SCHEDULE', value: GROUP_INFO.schedule },
                        { label: 'FREQUENCY',        value: GROUP_INFO.frequency },
                        { label: 'CHURCH SATELLITE', value: GROUP_INFO.satellite },
                        { label: 'TOTAL MEMBERS',    value: String(group.members) },
                    ].map((item) => (
                        <div key={item.label} className="px-4 py-3">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                            <p className="text-sm font-semibold text-gray-800">{item.value}</p>
                        </div>
                    ))}
                </div>

                {/* Active Members header + search */}
                <div className="flex items-center justify-between px-6 mt-5 mb-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Members</p>
                    <div className="relative">
                        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
                        </svg>
                        <input type="text" placeholder="Search members..." value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#5b50d6] w-44" />
                    </div>
                </div>

                {/* Members list */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-3">
                    {members.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-10">No members found.</p>
                    )}
                    {members.map((m, i) => (
                        <div key={m.id} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                                    style={{ background: ac(i) }}>
                                    {m.initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm">{m.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{m.module} · {m.lesson}</p>
                                </div>
                                <span className="text-xs font-bold text-[#5b50d6]">{m.progress}%</span>
                            </div>

                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${m.progress}%`, background: '#5b50d6' }} />
                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={() => setViewProfile(m)}
                                    className="flex-1 py-2 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    View Profile
                                </button>
                                <button onClick={() => setUpdating(m)}
                                    className="flex-1 py-2 text-xs font-bold text-white rounded-lg transition-colors"
                                    style={{ background: '#5b50d6' }}>
                                    Update Progress
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
