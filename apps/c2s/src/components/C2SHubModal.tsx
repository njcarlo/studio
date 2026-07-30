'use client';

import { useState } from 'react';

interface Props {
    onClose: () => void;
}

const BARANGAYS = [
    'Burol',
    'Burol I',
    'Burol II',
    'Burol III',
    'Datu Esmael',
    'Emmanuel Bergado I',
    'Emmanuel Bergado II',
    'Fatima I',
    'Fatima II',
    'Fatima III',
    'H-2',
    'Langkaan I',
    'Langkaan II',
    'Luzviminda I',
    'Luzviminda II',
    'Paliparan I',
    'Paliparan II',
    'Paliparan III',
    'Sabang',
    'Saint Peter I',
    'Saint Peter II',
    'Salawag',
    'Salitran I',
    'Salitran II',
    'Salitran III',
    'Salitran IV',
    'Sampaloc I',
    'Sampaloc II',
    'Sampaloc III',
    'Sampaloc IV',
    'Sampaloc V',
    'San Agustin I',
    'San Agustin II',
    'San Agustin III',
    'San Andres I',
    'San Andres II',
    'San Antonio De Padua I',
    'San Antonio De Padua II',
    'San Dionisio',
    'San Esteban',
    'San Francisco I',
    'San Francisco II',
    'San Isidro Labrador I',
    'San Isidro Labrador II',
    'San Jose',
    'San Juan',
    'San Lorenzo Ruiz I',
    'San Lorenzo Ruiz II',
    'San Luis I',
    'San Luis II',
    'San Manuel I',
    'San Manuel II',
    'San Mateo',
    'San Miguel I',
    'San Miguel II',
    'San Nicolas I',
    'San Nicolas II',
    'San Roque',
    'San Simon',
    'Santa Cristina I',
    'Santa Cristina II',
    'Santa Cruz I',
    'Santa Cruz II',
    'Santa Fe',
    'Santa Lucia',
    'Santa Maria',
    'Santo Cristo',
    'Santo Niño I',
    'Santo Niño II',
    'Victoria Reyes',
    'Zone I',
    'Zone I-B',
    'Zone II',
    'Zone III',
    'Zone IV',
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIMES = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM',
    '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM',
];

export const HUB_APPLICATIONS_KEY = 'c2s_hub_applications';

export default function C2SHubModal({ onClose }: Props) {
    const [agreed, setAgreed] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // form fields
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [barangay, setBarangay] = useState('');
    const [address, setAddress] = useState('');
    const [potential, setPotential] = useState(0);
    const [day, setDay] = useState('');
    const [time, setTime] = useState('');

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!agreed) return;

        const now = new Date();
        const submitted_date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        const newApp = {
            id: `hub_${Date.now()}`,
            name: fullName,
            barangay,
            phone,
            schedule: `${day} ${time}`,
            family: 0,
            potential,
            submitted: submitted_date,
            status: 'Pending' as const,
        };

        try {
            const existing = JSON.parse(localStorage.getItem(HUB_APPLICATIONS_KEY) ?? '[]');
            localStorage.setItem(HUB_APPLICATIONS_KEY, JSON.stringify([...existing, newApp]));
            window.dispatchEvent(new Event('storage'));
        } catch { /* ignore */ }

        setSubmitted(true);
    }

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-light leading-none"
                    aria-label="Close"
                >
                    ×
                </button>

                {submitted ? (
                    <div className="py-10 px-8 text-center max-w-lg mx-auto">
                        <h2 className="text-xl font-black text-gray-900 mb-6">Application Submitted!</h2>
                        <p className="text-sm text-gray-700 leading-relaxed mb-5 text-center">
                            Thank you for applying to make your home a Connect2Souls (C2S) Hub. We
                            are grateful for your willingness to open your home as a place where lives can
                            be transformed through discipleship, fellowship, and God&apos;s Word.
                            Your application has been successfully received and is currently under review.
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed mb-5 text-center">
                            Our ministry team will carefully evaluate your submission and will contact you
                            once the review process is complete. If additional information is needed, we
                            will reach out to you directly.
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed mb-8 text-center">
                            Thank you for partnering with us in expanding God&apos;s Kingdom. God bless you!
                        </p>
                        <div className="flex justify-center">
                            <button
                                onClick={onClose}
                                className="text-white font-bold px-16 py-3 rounded-xl text-sm transition-colors"
                                style={{ background: '#e91e8c' }}
                            >
                                Back to Home
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-7">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-[#e0f7f5] flex items-center justify-center">
                                <svg className="w-4 h-4 text-[#0b9b8a]" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-gray-900">Make My Home a C2S Hub</h2>
                                <p className="text-xs text-gray-400">Volunteer your home as a Connect2Souls discipleship hub</p>
                            </div>
                        </div>

                        <hr className="my-5 border-gray-100" />

                        {/* ── MEMBER INFORMATION ── */}
                        <div className="mb-5">
                            <p className="text-xs font-bold text-[#0b9b8a] tracking-widest uppercase mb-3">
                                Member Information
                            </p>
                            <hr className="border-gray-100 mb-4" />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Full Name <span className="text-[#f03e5f]">*</span>
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Email Address <span className="text-[#f03e5f]">*</span>
                                    </label>
                                    <input
                                        required
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be]"
                                    />
                                </div>
                            </div>

                            <div className="max-w-xs">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Phone Number <span className="text-[#f03e5f]">*</span>
                                </label>
                                <input
                                    required
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be]"
                                />
                            </div>
                        </div>

                        {/* ── ADDRESS ── */}
                        <div className="mb-5">
                            <p className="text-xs font-bold text-[#0b9b8a] tracking-widest uppercase mb-3">
                                Address
                            </p>
                            <hr className="border-gray-100 mb-4" />

                            <div className="mb-4 max-w-xs">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Barangay <span className="text-[#f03e5f]">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        required
                                        value={barangay}
                                        onChange={(e) => setBarangay(e.target.value)}
                                        className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be] bg-white pr-8"
                                    >
                                        <option value="">Select barangay</option>
                                        {BARANGAYS.map((b) => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </select>
                                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Complete Home Address <span className="text-[#f03e5f]">*</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="House no, Street, Subdivision, Village"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be] placeholder:text-gray-300"
                                />
                            </div>
                        </div>

                        {/* ── HOSTING INFORMATION ── */}
                        <div className="mb-5">
                            <p className="text-xs font-bold text-[#0b9b8a] tracking-widest uppercase mb-3">
                                Hosting Information
                            </p>
                            <hr className="border-gray-100 mb-4" />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Can your house host a weekly C2S devotion? <span className="text-[#f03e5f]">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            required
                                            className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be] bg-white pr-8"
                                        >
                                            <option value="">yes or no</option>
                                            <option value="yes">Yes</option>
                                            <option value="no">No</option>
                                        </select>
                                        <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Number of Potential C2S <span className="text-[#f03e5f]">*</span>
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        min={0}
                                        value={potential}
                                        onChange={(e) => setPotential(Number(e.target.value))}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Preffered Meeting Day <span className="text-[#f03e5f]">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={day}
                                            onChange={(e) => setDay(e.target.value)}
                                            className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be] bg-white pr-8"
                                        >
                                            <option value="">e.g monday, tuesday</option>
                                            {DAYS.map((d) => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                        <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Preffered Time <span className="text-[#f03e5f]">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be] bg-white pr-8"
                                        >
                                            <option value=""></option>
                                            {TIMES.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                        <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Additional note about your house:
                                </label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be]"
                                />
                            </div>
                        </div>

                        {/* Privacy checkbox */}
                        <div className="flex items-start gap-2.5 mb-6">
                            <input
                                id="privacy"
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="mt-0.5 w-4 h-4 accent-[#f03e5f] cursor-pointer shrink-0"
                            />
                            <label htmlFor="privacy" className="text-xs text-gray-600 cursor-pointer">
                                I agree to the{' '}
                                <span className="text-[#f03e5f] underline cursor-pointer">Data privacy Policy</span>
                                {' '}of Church of God Dasmariñas.
                            </label>
                        </div>

                        {/* Footer buttons */}
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!agreed}
                                className="px-6 py-2.5 rounded-full text-sm font-bold text-white transition-colors"
                                style={{ background: agreed ? '#e91e8c' : '#f0a0cc', cursor: agreed ? 'pointer' : 'not-allowed' }}
                            >
                                Submit Application
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
