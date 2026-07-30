'use client';

import { useState } from 'react';
import type { C2SGroup, GroupMember } from '@/lib/data';
import { GROUP_MEMBERS } from '@/lib/data';
import ViewProfileModal from './ViewProfileModal';

interface Props {
    group: C2SGroup;
    onClose: () => void;
}

// Initials avatar colors
const AVATAR_COLORS = ['#5b50d6', '#e91e8c', '#0b9b8a', '#e67700', '#6741d9'];
function avatarColor(i: number) { return AVATAR_COLORS[i % AVATAR_COLORS.length]; }

export default function ViewMembersModal({ group, onClose }: Props) {
    const [search, setSearch] = useState('');
    const [viewingProfile, setViewingProfile] = useState<GroupMember | null>(null);

    const allMembers = GROUP_MEMBERS[group.name] ?? [];
    const members = allMembers.filter((m) =>
        m.name.toLowerCase().includes(search.toLowerCase())
    );

    const tagLabels = group.tags.map((t) => t.label).join(' · ');

    if (viewingProfile) {
        return (
            <ViewProfileModal
                member={viewingProfile}
                groupName={group.name}
                onClose={() => setViewingProfile(null)}
                onBack={() => setViewingProfile(null)}
            />
        );
    }

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
                            <h2 className="text-xl font-black text-gray-900">{group.name}</h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {tagLabels} · {allMembers.length} member{allMembers.length !== 1 ? 's' : ''}
                            </p>
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
                        { label: 'GROUP NAME',      value: group.name },
                        { label: 'GROUP TYPE',       value: group.tags.map(t => t.label).join(', ') },
                        { label: 'MEETING SCHEDULE', value: group.schedule },
                        { label: 'TOTAL MEMBERS',    value: String(allMembers.length) },
                        { label: 'BARANGAY',         value: group.barangay },
                        { label: 'SUBDIVISION',      value: group.location },
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
                        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
                        </svg>
                        <input
                            type="text"
                            placeholder="Search members..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#5b50d6] w-44"
                        />
                    </div>
                </div>

                {/* Members list */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-3">
                    {members.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-10">No members found.</p>
                    )}
                    {members.map((member, i) => (
                        <div key={member.id} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
                            {/* Member header */}
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
                                    style={{ background: avatarColor(i) }}
                                >
                                    {member.initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 text-sm">{member.name}</p>
                                    <p className="text-xs text-gray-400 truncate">
                                        {member.currentModule.split('—')[0].trim()} · {member.currentLesson.split(':')[0].trim()}
                                    </p>
                                </div>
                                <span className="text-xs font-bold text-[#5b50d6]">{member.progress}%</span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full"
                                    style={{ width: `${member.progress}%`, background: '#5b50d6' }}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setViewingProfile(member)}
                                    className="flex-1 py-2 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
                                >
                                    View Profile
                                </button>
                                <button
                                    className="flex-1 py-2 text-xs font-bold text-white rounded-lg transition-colors"
                                    style={{ background: '#5b50d6' }}
                                >
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
