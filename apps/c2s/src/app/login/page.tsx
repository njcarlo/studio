'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authenticate } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [keepSigned, setKeepSigned] = useState(false);
    const [error, setError] = useState('');
    const [showPwHelp, setShowPwHelp] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Ensure login screen is always clean light mode
        document.documentElement.classList.remove('dark');
    }, []);

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
                setError('Invalid Worker ID or password.');
            }
            setLoading(false);
        }, 500);
    }

    return (
        <div className="force-light relative min-h-screen-dvh flex flex-col overflow-x-hidden">
            {/* 2-Color Top Accent Bar (Coral Pink & Cyan Teal) */}
            <div
                aria-hidden="true"
                className="fixed top-0 left-0 right-0 z-50 h-[7px] grid grid-cols-2"
            >
                <div className="bg-[#E11D48]" />
                <div className="bg-[#14B8A6]" />
            </div>

            {/* Full-screen background photo */}
            <Image
                src="/cog-bg.png"
                alt="COG Dasmarinas background"
                fill
                className="object-cover object-center"
                priority
            />
            {/* Dark atmospheric overlay */}
            <div
                className="absolute inset-0 backdrop-blur-[2px]"
                style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}
            />

            {/* Centered page content */}
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-8 sm:py-12 w-full">

                {/* Dark frosted glassmorphism login card */}
                <div
                    className="w-[calc(100%-2rem)] min-[480px]:w-full max-w-[29rem] mx-auto overflow-hidden transition-shadow duration-300"
                    style={{
                        backgroundColor: 'rgba(18, 24, 33, 0.72)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.16)',
                        borderRadius: '20px',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
                    }}
                >
                    <div className="px-6 min-[480px]:px-9 sm:px-10 pt-9 pb-8">
                        {/* Header area */}
                        <div className="text-center mb-7">
                            {/* Circular logo */}
                            <div
                                className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center overflow-hidden p-2"
                                style={{
                                    backgroundColor: '#FFFFFF',
                                    border: '2px solid rgba(255, 255, 255, 0.9)',
                                    boxShadow: '0 8px 22px rgba(0, 0, 0, 0.28)',
                                }}
                            >
                                <Image
                                    src="/c2s.png"
                                    alt="Connect2Souls Logo"
                                    width={88}
                                    height={88}
                                    className="object-contain w-full h-full"
                                    priority
                                />
                            </div>

                            <p
                                className="font-bold uppercase mb-2"
                                style={{
                                    color: '#5EEAD4',
                                    fontSize: '11px',
                                    letterSpacing: '0.08em',
                                    lineHeight: 1.4,
                                }}
                            >
                                Church of God Dasmariñas
                            </p>
                            <h1
                                className="font-extrabold tracking-tight mb-2"
                                style={{
                                    color: '#FFFFFF',
                                    fontSize: '20px',
                                    lineHeight: 1.25,
                                }}
                            >
                                Login to your account
                            </h1>
                            <p
                                className="font-medium"
                                style={{
                                    color: '#E6EDF3',
                                    fontSize: '13px',
                                    lineHeight: 1.45,
                                }}
                            >
                                Enter your Worker ID and password
                            </p>
                        </div>

                        <form data-no-confirm onSubmit={handleSubmit} className="space-y-5">
                            {/* Worker ID */}
                            <div>
                                <label
                                    htmlFor="worker-id"
                                    className="block font-bold mb-2"
                                    style={{ color: '#E6EDF3', fontSize: '0.8125rem' }}
                                >
                                    Worker ID
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-slate-700 group-focus-within:text-[#0F766E] transition-colors duration-200 pointer-events-none">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                        </svg>
                                    </span>
                                    <input
                                        id="worker-id"
                                        required
                                        type="text"
                                        autoComplete="username"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="e.g. 145021"
                                        style={{
                                            color: '#0F172A',
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            borderColor: 'rgba(255, 255, 255, 0.25)',
                                            borderRadius: '10px',
                                            height: '44px',
                                            fontSize: '1rem',
                                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.14)',
                                        }}
                                        className="w-full border pl-9 pr-3.5 placeholder:text-slate-400 transition-all duration-200 hover:bg-white hover:border-[#14B8A6]/70 focus:outline-none focus:bg-white focus:border-[#14B8A6] focus:ring-4 focus:ring-[#14B8A6]/25"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <label
                                        htmlFor="worker-password"
                                        className="font-bold"
                                        style={{ color: '#E6EDF3', fontSize: '0.8125rem' }}
                                    >
                                        Password
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowPwHelp((prev) => !prev)}
                                        className="font-semibold hover:underline transition-colors"
                                        style={{ color: '#5EEAD4', fontSize: '0.75rem' }}
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                                <div className="relative group">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-slate-700 group-focus-within:text-[#0F766E] transition-colors duration-200 pointer-events-none">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                        </svg>
                                    </span>
                                    <input
                                        id="worker-password"
                                        required
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        style={{
                                            color: '#0F172A',
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            borderColor: 'rgba(255, 255, 255, 0.25)',
                                            borderRadius: '10px',
                                            height: '44px',
                                            fontSize: '1rem',
                                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.14)',
                                        }}
                                        className="w-full border pl-9 pr-10 placeholder:text-slate-400 transition-all duration-200 hover:bg-white hover:border-[#14B8A6]/70 focus:outline-none focus:bg-white focus:border-[#14B8A6] focus:ring-4 focus:ring-[#14B8A6]/25"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-all duration-150"
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
                                {showPwHelp && (
                                    <p className="mt-2 text-xs text-[#E6EDF3] bg-slate-900/75 border border-white/15 rounded-lg px-3 py-2 leading-relaxed shadow-sm">
                                        Please contact your C2S Coordinator or Admin to reset your password.
                                    </p>
                                )}
                            </div>

                            {/* Left-aligned checkbox row */}
                            <div className="flex items-center pt-1 pb-1">
                                <label className="group flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={keepSigned}
                                        onChange={(e) => setKeepSigned(e.target.checked)}
                                        className="w-4 h-4 rounded border-white/30 bg-white/95 accent-[#0E5B52] cursor-pointer"
                                    />
                                    <span
                                        className="font-medium transition-colors duration-150 group-hover:text-white"
                                        style={{ color: '#E6EDF3', fontSize: '0.8125rem' }}
                                    >
                                        Keep me signed in
                                    </span>
                                </label>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3.5 py-2.5 rounded-lg">
                                    <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                    </svg>
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Full-width vibrant teal gradient submit button */}
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    background: 'linear-gradient(90deg, #14B8A6, #0D9488)',
                                    borderRadius: '8px',
                                }}
                                className="group relative w-full h-[44px] text-white font-bold text-base overflow-hidden shadow-md shadow-[#0D9488]/25 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#0D9488]/35 active:translate-y-0 active:scale-[0.99] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                <span
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    style={{ background: 'linear-gradient(90deg, #0D9488, #0F6E4C)' }}
                                />
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {loading && (
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                        </svg>
                                    )}
                                    <span>{loading ? 'Signing in...' : 'Login'}</span>
                                    {!loading && (
                                        <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    )}
                                </span>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Two centered micro-captions outside and below the glass card */}
                <div className="mt-5 flex flex-col items-center gap-2 text-center">
                    <p
                        className="text-white/90 font-medium flex items-center gap-1.5 drop-shadow-sm"
                        style={{ fontSize: '0.75rem' }}
                    >
                        <svg className="w-3.5 h-3.5 text-[#5EEAD4]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                        Secure sign-in for authorized C2S workers
                    </p>
                    <Link
                        href="/c2s-finder"
                        className="group inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-white bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/25 transition-all duration-200"
                        style={{ fontSize: '0.75rem', color: '#FFFFFF' }}
                    >
                        <span className="text-white transition-transform duration-200 group-hover:-translate-x-0.5">←</span>
                        <span className="text-white">Back to C2S Finder</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
