import Navbar from '@/components/Navbar';

export default function GivePage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="pt-28 max-w-2xl mx-auto px-6 text-center">
                <h1 className="text-3xl font-black text-gray-900 mb-4">Give</h1>
                <p className="text-gray-500 text-sm leading-relaxed">
                    Thank you for your generous heart. Online giving options coming soon.
                </p>
            </div>
        </div>
    );
}
