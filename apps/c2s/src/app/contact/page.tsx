import Navbar from '@/components/Navbar';

export default function ContactPage() {
    return (
        <div className="force-light min-h-screen bg-white">
            <Navbar />
            <div className="pt-28 max-w-2xl mx-auto px-6 text-center">
                <h1 className="text-[1.75rem] font-extrabold uppercase tracking-[0.02em] text-[#181F26] mb-3">Contact Us</h1>
                <p className="text-[#64748B] text-sm leading-relaxed">
                    Want to get in touch? Reach out to us and we&apos;ll get back to you as soon as possible.
                    This page is coming soon.
                </p>
            </div>
        </div>
    );
}
