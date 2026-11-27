'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import C2SGroupCard from '@/components/C2SGroupCard';
import C2SHubModal from '@/components/C2SHubModal';
import JoinGroupModal from '@/components/JoinGroupModal';
import { C2S_GROUPS, ALL_TAGS, type C2SGroup } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';

export default function C2SFinderPage() {
    const [search, setSearch] = useState('');
    const [activeTag, setActiveTag] = useState<string>('All');
    const [showAll, setShowAll] = useState(false);
    const [showHubModal, setShowHubModal] = useState(false);
    const [joiningGroup, setJoiningGroup] = useState<C2SGroup | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const featuredGroups = C2S_GROUPS.filter((g) => g.isFeatured);

    const filteredGroups = C2S_GROUPS.filter((g) => {
        const matchesSearch =
            g.name.toLowerCase().includes(search.toLowerCase()) ||
            g.location.toLowerCase().includes(search.toLowerCase()) ||
            g.leader.toLowerCase().includes(search.toLowerCase());
        const matchesTag =
            activeTag === 'All' || g.tags.some((t) => t.label === activeTag);
        return matchesSearch && matchesTag;
    });

    return (
        <div className="force-light min-h-screen-dvh w-full overflow-x-hidden bg-white flex flex-col">
            <Navbar />
            {showHubModal && <C2SHubModal onClose={() => setShowHubModal(false)} />}
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
            {successMsg && (
                <div className="fixed top-nav-fixed left-0 right-0 z-[9998] flex justify-center px-4 pt-3">
                    <div className="flex items-center gap-3 bg-[#f0fdf4] border border-[#86efac] text-[#15803d] rounded-xl px-5 py-3 shadow-md text-sm font-semibold max-w-lg w-full">
                        <svg className="w-5 h-5 shrink-0 text-[#22c55e]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        Welcome! You&apos;ve signed up for <span className="font-black ml-1">{successMsg}</span>. We&apos;ll be in touch soon.
                    </div>
                </div>
            )}

            {/* ── Hero ──────────────────────────────────────── */}
            <section className="pt-nav-fixed w-full">
                <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 pt-8 pb-10 sm:py-10 lg:py-14">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 items-center">

                        {/* Left */}
                        <div className="min-w-0">
                            <h1 className="text-[clamp(1.625rem,3.8vw,2.75rem)] font-extrabold uppercase tracking-[0.02em] leading-tight text-[#181F26] mb-3">
                                Find a Christ-Centered Community Near You.
                            </h1>

                            <p className="text-[#64748B] text-sm sm:text-base leading-relaxed mb-6 sm:mb-7 max-w-xl">
                                Discover a Connect2Souls group near you in Dasmariñas City — built for
                                real friendships, growth in faith, and a place to belong.
                            </p>

                            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                                <Link
                                    href="/group-finder"
                                    className="w-full sm:w-auto text-center bg-[#f03e5f] hover:bg-[#d42f52] text-white font-bold px-6 py-2.5 rounded-full text-sm transition-colors shadow-sm inline-block"
                                >
                                    Find a Group
                                </Link>
                                <button
                                    onClick={() => setShowHubModal(true)}
                                    className="w-full sm:w-auto text-center border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-6 py-2.5 rounded-full text-sm transition-colors"
                                >
                                    Bring C2S in My Home
                                </button>
                            </div>
                        </div>

                        {/* Right — community photo (shifted left toward content, exact natural fit on mobile & desktop) */}
                        <div className="w-full flex justify-center md:justify-start pb-3 md:pb-0">
                            <div className="w-full max-w-[36rem] rounded-2xl overflow-hidden ring-1 ring-[#181F26]/10 shadow-[0_24px_55px_-12px_rgba(15,23,42,0.28),0_12px_28px_-8px_rgba(14,91,82,0.22)] hover:shadow-[0_28px_60px_-10px_rgba(15,23,42,0.34),0_14px_30px_-8px_rgba(14,91,82,0.26)] transition-shadow duration-300">
                                <Image
                                    src="/community-hero.png"
                                    alt="Person praying over open Bible"
                                    width={2685}
                                    height={1950}
                                    sizes="(max-width: 768px) calc(100vw - 2rem), 576px"
                                    className="w-full h-auto block object-cover"
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Featured Groups ────────────────────────────── */}
            <section className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 py-8 lg:py-10">
                <h2 className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-black text-gray-900 mb-1">Featured C2S Groups</h2>
                <p className="text-sm text-gray-400 mb-6 sm:mb-7">
                    Explore some of our active discipleship groups in Dasmariñas City
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                    {featuredGroups.map((group) => (
                        <C2SGroupCard key={group.id} group={group} onJoin={(g) => setJoiningGroup(g)} />
                    ))}
                </div>

                {/* View all Groups button — outlined pill */}
                <div className="flex justify-center mt-8">
                    <Link
                        href="/group-finder"
                        className="w-full sm:w-auto text-center border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-8 py-2.5 rounded-full text-sm transition-colors inline-block"
                    >
                        View all Groups
                    </Link>
                </div>
            </section>

            {/* ── All Groups (shown after "Find a Group" / "View all") ── */}
            {showAll && (
                <section className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 pb-10">
                    <h2 className="text-xl font-black text-gray-900 mb-5">All C2S Groups</h2>

                    {/* Search */}
                    <div className="relative mb-4">
                        <svg
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"
                            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by name, location, or leader..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                        />
                    </div>

                    {/* Tag filters */}
                    <div className="flex flex-wrap gap-2 mb-7">
                        {(['All', ...ALL_TAGS]).map((tag) => (
                            <button
                                key={tag}
                                onClick={() => setActiveTag(tag)}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                    activeTag === tag
                                        ? 'bg-[#D97706] text-white'
                                        : 'bg-white border border-gray-200 text-gray-600 hover:border-[#D97706] hover:text-[#D97706]'
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    {filteredGroups.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                            {filteredGroups.map((group) => (
                                <C2SGroupCard key={group.id} group={group} onJoin={(g) => setJoiningGroup(g)} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-gray-400">
                            <p className="text-4xl mb-3">🔍</p>
                            <p className="font-medium text-sm">No groups found</p>
                            <p className="text-xs mt-1">Try a different search or filter.</p>
                        </div>
                    )}
                </section>
            )}

            {/* ── About Connect2Souls ────────────────────────── */}
            <section className="w-full bg-[#f8f9fc] py-12 sm:py-16">
                <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 text-center">
                    <h2 className="text-2xl font-black text-gray-900 mb-1.5">About Connect2Souls</h2>
                    <p className="text-sm text-gray-400 mb-10 sm:mb-12">
                        Your journey to meaningful discipleship starts here
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
                        {[
                            {
                                emoji: '📗',
                                iconBg: 'bg-[#FEF3C7]',
                                title: 'Grow in Faith',
                                desc: 'Dive deeper into Scripture and strengthen your relationship with God through intentional Bible study and prayer.',
                            },
                            {
                                emoji: '👥',
                                iconBg: 'bg-[#fde8ef]',
                                title: 'Build Meaningful Relationships',
                                desc: 'Connect with like-minded believers who will walk alongside you, support you, and celebrate life\'s moments together.',
                            },
                            {
                                emoji: '⚡',
                                iconBg: 'bg-[#fff9c4]',
                                title: 'Become a Future Mentor',
                                desc: "As you grow, you'll have the opportunity to mentor others and multiply the impact of Christ's love in your community.",
                            },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-7 flex flex-col items-center text-center gap-4"
                            >
                                <div className={`w-12 h-12 rounded-full ${item.iconBg} flex items-center justify-center text-xl`}>
                                    {item.emoji}
                                </div>
                                <h3 className="font-bold text-gray-900 text-base">{item.title}</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Bottom CTA ─────────────────────────────────── */}
            <section className="w-full px-4 sm:px-6 py-12 sm:py-14 text-center">
                <p className="text-xl font-black text-gray-900">Start your discipleship journey today.</p>
                <p className="text-sm text-gray-400 mt-2 mb-6">
                    Join a C2S group and experience community like never before.
                </p>
                <Link
                    href="/contact"
                    className="w-full sm:w-auto inline-block bg-[#f03e5f] hover:bg-[#d42f52] text-white font-bold px-8 py-3 rounded-full text-sm transition-colors shadow"
                >
                    Get Connected
                </Link>
            </section>

            {/* Footer */}
            <footer className="mt-auto border-t border-gray-100 text-gray-400 text-center py-5 px-4 text-xs">
                <p>© {new Date().getFullYear()} Church of God Dasmariñas. All rights reserved.</p>
            </footer>
        </div>
    );
}
