import Navbar from '@/components/Navbar';

export default function GivePage() {
    return (
        <div className="force-light min-h-screen bg-white">
            <Navbar />
            <div className="pt-28 max-w-2xl mx-auto px-6 text-center">
                <h1 className="text-[1.75rem] font-extrabold uppercase tracking-[0.02em] text-[#181F26] mb-3">Give</h1>
                <p className="text-[#64748B] text-sm leading-relaxed">
                    Thank you for your generous heart. Online giving options coming soon.
                </p>
            </div>
        </div>
    );
}
