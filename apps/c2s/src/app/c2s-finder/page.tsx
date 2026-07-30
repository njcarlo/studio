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
        <div className="min-h-screen bg-white">
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
                <div className="fixed top-16 left-0 right-0 z-[9998] flex justify-center px-4 pt-3">
                    <div className="flex items-center gap-3 bg-[#f0fdf4] border border-[#86efac] text-[#15803d] rounded-xl px-5 py-3 shadow-md text-sm font-semibold max-w-lg w-full">
                        <svg className="w-5 h-5 shrink-0 text-[#22c55e]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        Welcome! You&apos;ve signed up for <span className="font-black ml-1">{successMsg}</span>. We&apos;ll be in touch soon.
                    </div>
                </div>
            )}

            {/* ── Hero ──────────────────────────────────────── */}
            <section className="pt-16">
                <div className="max-w-5xl mx-auto px-6 py-10 lg:py-14">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

                        {/* Left */}
                        <div>
                            {/* "Find your community" teal pill */}
                            <div className="inline-flex items-center bg-[#e0f7f5] text-[#0b9b8a] text-xs font-semibold px-3 py-1 rounded-full mb-5">
                                Find your community
                            </div>

                            {/* c2s logo + heading — logo kasing taas ng 2-line heading */}
                            <div className="flex flex-row items-center gap-3 mb-4">
                                <img
                                    src="/c2s.png"
                                    alt="Connect2Souls logo"
                                    style={{ width: '72px', height: '72px', objectFit: 'contain', flexShrink: 0 }}
                                />
                                <h1 style={{
                                    fontSize: '2rem',
                                    fontWeight: 900,
                                    lineHeight: 1.2,
                                    color: '#111827',
                                    margin: 0,
                                }}>
                                    Find a Christ-Centered<br />Community Near You.
                                </h1>
                            </div>

                            <p className="text-gray-400 text-sm leading-relaxed mb-7 max-w-md">
                                Discover a Connect2Souls group near you in Dasmariñas City — built for
                                real friendships, growth in faith, and a place to belong.
                            </p>

                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href="/group-finder"
                                    className="bg-[#f03e5f] hover:bg-[#d42f52] text-white font-bold px-6 py-2.5 rounded-full text-sm transition-colors shadow-sm inline-block"
                                >
                                    Find a Group
                                </Link>
                                <button
                                    onClick={() => setShowHubModal(true)}
                                    className="border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-6 py-2.5 rounded-full text-sm transition-colors"
                                >
                                    Bring C2S in My Home
                                </button>
                            </div>
                        </div>

                        {/* Right — community photo */}
                        <div className="hidden lg:block">
                            <div className="relative w-full h-72 rounded-2xl overflow-hidden shadow-md">
                                <Image
                                    src="/community.png"
                                    alt="Person praying over open Bible"
                                    fill
                                    className="object-cover object-center"
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Featured Groups ────────────────────────────── */}
            <section className="max-w-5xl mx-auto px-6 py-8">
                <h2 className="text-2xl font-black text-gray-900 mb-1">Featured C2S Groups</h2>
                <p className="text-sm text-gray-400 mb-7">
                    Explore some of our active discipleship groups in Dasmariñas City
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {featuredGroups.map((group) => (
                        <C2SGroupCard key={group.id} group={group} onJoin={(g) => setJoiningGroup(g)} />
                    ))}
                </div>

                {/* View all Groups button — outlined pill */}
                <div className="flex justify-center mt-8">
                    <Link
                        href="/group-finder"
                        className="border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-8 py-2.5 rounded-full text-sm transition-colors inline-block"
                    >
                        View all Groups
                    </Link>
                </div>
            </section>

            {/* ── All Groups (shown after "Find a Group" / "View all") ── */}
            {showAll && (
                <section className="max-w-5xl mx-auto px-6 pb-10">
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
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2dc7be]"
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
                                        ? 'bg-[#2dc7be] text-white'
                                        : 'bg-white border border-gray-200 text-gray-600 hover:border-[#2dc7be] hover:text-[#2dc7be]'
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    {filteredGroups.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
            <section className="bg-[#f8f9fc] py-16">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <h2 className="text-2xl font-black text-gray-900 mb-1.5">About Connect2Souls</h2>
                    <p className="text-sm text-gray-400 mb-12">
                        Your journey to meaningful discipleship starts here
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                            {
                                emoji: '📗',
                                iconBg: 'bg-[#e0f7f5]',
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
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 flex flex-col items-center text-center gap-4"
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
            <section className="py-14 text-center">
                <p className="text-xl font-black text-gray-900">Start your discipleship journey today.</p>
                <p className="text-sm text-gray-400 mt-2 mb-6">
                    Join a C2S group and experience community like never before.
                </p>
                <Link
                    href="/contact"
                    className="inline-block bg-[#f03e5f] hover:bg-[#d42f52] text-white font-bold px-8 py-3 rounded-full text-sm transition-colors shadow"
                >
                    Get Connected
                </Link>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-100 text-gray-400 text-center py-5 text-xs">
                <p>© {new Date().getFullYear()} Church of God Dasmariñas. All rights reserved.</p>
            </footer>
        </div>
    );
}
