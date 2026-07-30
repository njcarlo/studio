import Navbar from '@/components/Navbar';
import { C2S_GROUPS } from '@/lib/data';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function GroupDetailPage({ params }: Props) {
    const { id } = await params;
    const group = C2S_GROUPS.find((g) => g.id === id);
    if (!group) notFound();

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="pt-24 max-w-2xl mx-auto px-6 pb-16">
                <Link
                    href="/c2s-finder"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to C2S Finder
                </Link>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {group.tags.map((t) => (
                            <span key={t.label} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.color}`}>
                                {t.label}
                            </span>
                        ))}
                    </div>

                    <h1 className="text-2xl font-black text-gray-900 mb-1">{group.name}</h1>
                    <p className="text-sm text-gray-400 mb-6">Led by {group.leader}</p>

                    <div className="space-y-3 text-sm text-gray-600 mb-8">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 shrink-0 text-[#2dc7be]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                            <span>{group.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 shrink-0 text-[#f03e5f]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
                            </svg>
                            <span>{group.schedule}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                            </svg>
                            <span>{group.ageRange}</span>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row gap-3">
                        <button className="flex-1 bg-[#f03e5f] hover:bg-[#d42f52] text-white font-bold py-3 rounded-full text-sm transition-colors">
                            Join this Group
                        </button>
                        <Link
                            href="/c2s-finder"
                            className="flex-1 text-center border-2 border-[#2dc7be] text-[#2dc7be] hover:bg-[#2dc7be] hover:text-white font-bold py-3 rounded-full text-sm transition-colors"
                        >
                            Browse Other Groups
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
