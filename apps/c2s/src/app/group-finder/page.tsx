'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import JoinGroupModal from '@/components/JoinGroupModal';
import { C2S_GROUPS, AGE_GROUPS, MEETUP_DAYS, BARANGAYS, type C2SGroup } from '@/lib/data';

const GroupFinderMap = dynamic(() => import('@/components/GroupFinderMap'), { ssr: false });

/* ── Icons ── */
function SearchIcon() {
    return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
        </svg>
    );
}
function LocationIcon() {
    return (
        <svg className="w-3 h-3 shrink-0 text-[#e91e8c]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
    );
}
function CalendarIcon() {
    return (
        <svg className="w-3 h-3 shrink-0 text-[#e91e8c]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
        </svg>
    );
}
function PeopleIcon() {
    return (
        <svg className="w-3 h-3 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
    );
}
function ChevronDown() {
    return (
        <svg className="w-4 h-4 text-gray-400 pointer-events-none shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
        </svg>
    );
}

/* ── Select ── */
function Select({ label, value, onChange, options }: {
    label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
    return (
        <div className="flex flex-col gap-1 min-w-0">
            <label className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">{label}</label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2dc7be] pr-8"
                >
                    {options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronDown /></div>
            </div>
        </div>
    );
}

/* ── Group Card ── */
function GroupCard({ group, selected, onSelect, onJoin }: {
    group: C2SGroup; selected: boolean;
    onSelect: () => void; onJoin: (g: C2SGroup) => void;
}) {
    return (
        <div
            onClick={onSelect}
            className={`bg-white rounded-2xl border-2 p-4 flex flex-col gap-2 cursor-pointer transition-all ${selected ? 'border-[#2dc7be] shadow-md' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
        >
            <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex flex-wrap gap-1">
                    {group.tags.map((t) => (
                        <span key={t.label} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.color}`}>{t.label}</span>
                    ))}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${group.status === 'Open' ? 'border-[#2dc7be] text-[#0b9b8a]' : 'border-gray-300 text-gray-400'}`}>
                    {group.status}
                </span>
            </div>

            <h3 className="font-black text-gray-900 text-base leading-snug">{group.name}</h3>
            <p className="text-xs text-gray-400 leading-snug line-clamp-2">{group.description}</p>

            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <LocationIcon /><span>{group.location}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <CalendarIcon /><span>{group.schedule}</span>
            </div>

            <div className="flex items-center justify-between pt-1 mt-auto">
                <button
                    onClick={(e) => { e.stopPropagation(); onJoin(group); }}
                    className="text-[11px] font-bold text-white px-3.5 py-1.5 rounded-full transition-colors"
                    style={{ background: '#e91e8c' }}
                >
                    Join C2S Group
                </button>
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <PeopleIcon />{group.ageRange}
                </span>
            </div>
        </div>
    );
}

/* ── Main Page ── */
export default function GroupFinderPage() {
    const [search, setSearch] = useState('');
    const [ageGroup, setAgeGroup] = useState('All');
    const [meetupDay, setMeetupDay] = useState('All');
    const [barangay, setBarangay] = useState('All');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [joiningGroup, setJoiningGroup] = useState<C2SGroup | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [showMobileMap, setShowMobileMap] = useState(false);

    const filtered = useMemo(() => C2S_GROUPS.filter((g) => {
        const q = search.toLowerCase();
        const matchSearch = !search ||
            g.name.toLowerCase().includes(q) ||
            g.barangay.toLowerCase().includes(q) ||
            g.location.toLowerCase().includes(q);
        const matchAge  = ageGroup  === 'All' || g.ageGroup   === ageGroup;
        const matchDay  = meetupDay === 'All' || g.meetupDay  === meetupDay;
        const matchBrgy = barangay  === 'All' || g.barangay   === barangay;
        return matchSearch && matchAge && matchDay && matchBrgy;
    }), [search, ageGroup, meetupDay, barangay]);

    return (
        /* full-screen layout: navbar (fixed 64px) + content fills rest */
        <div className="h-screen flex flex-col bg-[#f8f9fc] overflow-hidden">
            <Navbar />

            {/* Join modal */}
            {joiningGroup && (
                <JoinGroupModal
                    group={joiningGroup}
                    onClose={() => setJoiningGroup(null)}
                    onSuccess={(name) => {
                        setSuccessMsg(name);
                        setTimeout(() => setSuccessMsg(null), 5000);
                    }}
                />
            )}

            {/* Success banner */}
            {successMsg && (
                <div className="fixed top-16 left-0 right-0 z-[9998] flex justify-center px-4 pt-3">
                    <div className="flex items-center gap-3 bg-[#f0fdf4] border border-[#86efac] text-[#15803d] rounded-xl px-5 py-3 shadow-md text-sm font-semibold max-w-lg w-full">
                        <svg className="w-5 h-5 shrink-0 text-[#22c55e]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        Welcome! You&apos;ve signed up for <span className="font-black ml-1">{successMsg}</span>. We&apos;ll be in touch soon.
                    </div>
                </div>
            )}

            {/* ── Mobile Map Overlay ── */}
            {showMobileMap && (
                <div className="fixed inset-0 z-[9999] flex flex-col lg:hidden">
                    {/* Map header */}
                    <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0 pt-[calc(1rem+env(safe-area-inset-top))]" style={{ paddingTop: '4rem' }}>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">Dasmariñas City</p>
                            <p className="text-xs text-gray-400">{filtered.length} C2S groups nearby</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1.5 text-xs text-[#0b9b8a] font-semibold">
                                <span className="w-2 h-2 rounded-full bg-[#0b9b8a] inline-block" />
                                Live Map
                            </span>
                            <button
                                onClick={() => setShowMobileMap(false)}
                                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs px-3 py-1.5 rounded-full transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Close Map
                            </button>
                        </div>
                    </div>

                    {/* Map fills screen */}
                    <div className="flex-1 overflow-hidden">
                        <GroupFinderMap
                            groups={filtered}
                            selectedId={selectedId}
                            onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
                        />
                    </div>

                    {/* Legend */}
                    <div className="bg-white px-4 py-2 border-t border-gray-100 flex items-center gap-6 text-xs text-gray-500 shrink-0">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full inline-block" style={{ background: '#e91e8c' }} />
                            Available
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full inline-block" style={{ background: '#0b9b8a' }} />
                            Selected
                        </span>
                    </div>
                </div>
            )}

            {/* Content area below navbar */}
            <div className="flex flex-col flex-1 overflow-hidden pt-16">

                {/* ── Header strip ── */}
                <div className="bg-white px-6 py-4 border-b border-gray-100 shrink-0">
                    <div className="inline-flex items-center bg-[#e0f7f5] text-[#0b9b8a] text-xs font-semibold px-3 py-1 rounded-full mb-2">
                        Find your community
                    </div>
                    <div className="flex items-center gap-3 mb-0.5">
                        <img src="/c2s.png" alt="C2S" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                        <h1 className="text-2xl font-black text-gray-900">Group Finder</h1>
                    </div>
                    <p className="text-sm text-gray-400 ml-1">
                        Discover a Connect2Souls group near you in Dasmariñas City — built for real friendships, growth in faith, and a place to belong.
                    </p>
                </div>

                {/* ── Body: left + right panels ── */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Left panel */}
                    <div className="w-full lg:w-[55%] flex flex-col overflow-hidden border-r border-gray-100">

                        {/* Search + filters */}
                        <div className="bg-white px-4 py-3 border-b border-gray-100 shrink-0">
                            <div className="relative mb-3">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2"><SearchIcon /></div>
                                <input
                                    type="text"
                                    placeholder="Search C2S Group, Barangay, or Subdivision"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be] bg-white"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <Select label="Age Group"            value={ageGroup}  onChange={setAgeGroup}  options={AGE_GROUPS} />
                                <Select label="Meetup Day"           value={meetupDay} onChange={setMeetupDay} options={MEETUP_DAYS} />
                                <Select label="Barangay/Subdivision" value={barangay}  onChange={setBarangay}  options={['All', ...BARANGAYS]} />
                            </div>
                        </div>

                        {/* Cards */}
                        <div className="flex-1 overflow-y-auto p-4 content-start">
                            {/* Hint row */}
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-semibold text-gray-700">{filtered.length} groups found</p>
                                {/* Desktop hint / Mobile View Map button */}
                                <span className="hidden lg:block text-xs text-gray-400">Tap a card to see it on the map</span>
                                <button
                                    onClick={() => setShowMobileMap(true)}
                                    className="lg:hidden flex items-center gap-1.5 bg-[#2dc7be] hover:bg-[#25b0a8] text-white font-semibold text-xs px-3 py-1.5 rounded-full transition-colors shadow-sm"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                    View Map
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filtered.length > 0
                                ? filtered.map((g) => (
                                    <GroupCard
                                        key={g.id} group={g}
                                        selected={selectedId === g.id}
                                        onSelect={() => setSelectedId(g.id === selectedId ? null : g.id)}
                                        onJoin={(g) => setJoiningGroup(g)}
                                    />
                                ))
                                : (
                                    <div className="col-span-2 text-center py-16 text-gray-400">
                                        <p className="text-3xl mb-2">🔍</p>
                                        <p className="text-sm font-medium">No groups found</p>
                                        <p className="text-xs mt-1">Try adjusting your filters.</p>
                                    </div>
                                )
                            }
                            </div>
                        </div>
                    </div>

                    {/* Right panel — Map (desktop only) */}
                    <div className="hidden lg:flex lg:w-[45%] flex-col overflow-hidden">
                        {/* Map header */}
                        <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <div>
                                <p className="font-bold text-gray-900 text-sm">Dasmariñas City</p>
                                <p className="text-xs text-gray-400">{filtered.length} C2S groups nearby</p>
                            </div>
                            <span className="flex items-center gap-1.5 text-xs text-[#0b9b8a] font-semibold">
                                <span className="w-2 h-2 rounded-full bg-[#0b9b8a] inline-block" />
                                Live Map
                            </span>
                        </div>

                        {/* Map fills remaining height */}
                        <div className="flex-1 overflow-hidden p-3">
                            <GroupFinderMap
                                groups={filtered}
                                selectedId={selectedId}
                                onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
                            />
                        </div>

                        {/* Legend */}
                        <div className="bg-white px-4 py-2 border-t border-gray-100 flex items-center gap-6 text-xs text-gray-500 shrink-0">
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full inline-block" style={{ background: '#e91e8c' }} />
                                Available
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full inline-block" style={{ background: '#0b9b8a' }} />
                                Selected
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
