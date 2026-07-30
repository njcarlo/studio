'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticate } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        setTimeout(() => {
            const user = authenticate(email, password);
            if (user) {
                login(user);
                router.push('/dashboard');
            } else {
                setError('Invalid email or password.');
            }
            setLoading(false);
        }, 500);
    }

    return (
        <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-72 h-44 relative overflow-hidden">
                        <Image src="/c2s.png" alt="Connect2Souls Logo" fill className="object-contain object-top" priority />
                    </div>
                    <p className="text-2xl font-black text-gray-900 tracking-tight -mt-8">connect<span className="text-[#2dc7be]">2</span>souls</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h2 className="text-lg font-black text-gray-900 mb-1">Sign In</h2>
                    <p className="text-sm text-gray-400 mb-6">Access your C2S dashboard</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@cogdasmarinas.org"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be]"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    required
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be] pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-2.5 rounded-xl">
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl text-white font-bold text-sm transition-colors"
                            style={{ background: loading ? '#f0a0cc' : '#e91e8c' }}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Demo accounts hint */}
                    <div className="mt-6 pt-5 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Demo Accounts</p>
                        <div className="space-y-2">
                            <div className="bg-[#f8f9fc] rounded-xl px-3 py-2.5 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-gray-700">Ministry Head</span>
                                    <span className="bg-[#e0f7f5] text-[#0b9b8a] px-2 py-0.5 rounded-full text-[10px] font-bold">ADMIN</span>
                                </div>
                                <p className="text-gray-400 mt-0.5">ministry@cogdasmarinas.org</p>
                                <p className="text-gray-400">Ministry@2024</p>
                            </div>
                            <div className="bg-[#f8f9fc] rounded-xl px-3 py-2.5 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-gray-700">Cluster Head</span>
                                    <span className="bg-[#ede9fe] text-[#6741d9] px-2 py-0.5 rounded-full text-[10px] font-bold">CLUSTER</span>
                                </div>
                                <p className="text-gray-400 mt-0.5">clusterhead@cogdasmarinas.org</p>
                                <p className="text-gray-400">Cluster@2024</p>
                            </div>
                            <div className="bg-[#f8f9fc] rounded-xl px-3 py-2.5 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-gray-700">C2S Coordinator</span>
                                    <span className="bg-[#e0f7f5] text-[#0b9b8a] px-2 py-0.5 rounded-full text-[10px] font-bold">COORD</span>
                                </div>
                                <p className="text-gray-400 mt-0.5">coordinator@cogdasmarinas.org</p>
                                <p className="text-gray-400">Coord@2024</p>
                            </div>
                            <div className="bg-[#f8f9fc] rounded-xl px-3 py-2.5 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-gray-700">Mentor</span>
                                    <span className="bg-[#fde8ef] text-[#e6184d] px-2 py-0.5 rounded-full text-[10px] font-bold">MENTOR</span>
                                </div>
                                <p className="text-gray-400 mt-0.5">mentor.orchard@cogdasmarinas.org</p>
                                <p className="text-gray-400">Mentor@2024</p>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-6">
                    © {new Date().getFullYear()} Connect2Souls
                </p>
            </div>
        </div>
    );
}
