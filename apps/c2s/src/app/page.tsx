import Navbar from '@/components/Navbar';
import { LIVE_SCHEDULE, YOUTUBE_LIVE_ID } from '@/lib/data';
import Link from 'next/link';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Hero */}
            <section className="pt-16 bg-gray-950 text-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-8 uppercase">
                        Church Online
                    </h1>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* YouTube Embed */}
                        <div className="lg:col-span-2">
                            <div className="relative w-full rounded-xl overflow-hidden shadow-2xl bg-black"
                                style={{ paddingBottom: '56.25%' }}>
                                <iframe
                                    className="absolute inset-0 w-full h-full"
                                    src={`https://www.youtube.com/embed/${YOUTUBE_LIVE_ID}?autoplay=0&rel=0`}
                                    title="Church Online Live"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>

                            {/* Give CTA */}
                            <div className="mt-4 text-center">
                                <p className="text-gray-400 text-sm mb-3">
                                    To give your tithes and offering, click here.
                                </p>
                                <Link
                                    href="/give"
                                    className="inline-block bg-[#f03e5f] hover:bg-[#d42f52] text-white font-bold px-8 py-2.5 rounded-full transition-colors text-sm shadow"
                                >
                                    GIVE
                                </Link>
                            </div>
                        </div>

                        {/* Live Schedule */}
                        <div className="lg:col-span-1">
                            <h2 className="text-lg font-bold mb-4 text-white">Live Schedule</h2>
                            <div className="space-y-2">
                                {LIVE_SCHEDULE.map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                        <span className="text-sm text-gray-300">{item.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Links */}
            <section className="bg-gray-900 text-white py-6">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap gap-4 justify-center">
                    {[
                        { label: '🔴 Watch Live', href: '/' },
                        { label: '🙏 C2S Finder', href: '/c2s-finder' },
                        { label: '📖 About', href: '/about' },
                        { label: '💌 Contact Us', href: '/contact' },
                        { label: '💰 Give', href: '/give' },
                    ].map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="px-5 py-2 rounded-full bg-gray-800 hover:bg-gray-700 text-sm font-medium transition-colors"
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-950 text-gray-500 text-center py-6 text-xs">
                <p>© {new Date().getFullYear()} Church of God Dasmarinas. All rights reserved.</p>
            </footer>
        </div>
    );
}
