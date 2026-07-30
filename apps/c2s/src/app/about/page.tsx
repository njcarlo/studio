import Navbar from '@/components/Navbar';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="pt-28 max-w-2xl mx-auto px-6 text-center">
                <h1 className="text-3xl font-black text-gray-900 mb-4">About Us</h1>
                <p className="text-gray-500 text-sm leading-relaxed">
                    Church of God Dasmarinas is a Christ-centered community committed to making
                    disciples in Dasmarinas City and beyond. This page is coming soon.
                </p>
            </div>
        </div>
    );
}
