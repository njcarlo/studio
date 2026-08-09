'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase-client';
import { startWorkerIdLogin, completeWorkerIdClaim } from '@/actions/worker-login';
import Image from 'next/image';

/**
 * Three modes:
 *   'email'   — the normal path once a worker has claimed their address
 *   'worker'  — first-time sign-in with the ORS Worker ID + legacy password
 *   'claim'   — the one-time step where they choose their email and password
 */
type Mode = 'email' | 'worker' | 'claim';

export default function LoginPage() {
    const [mode, setMode] = useState<Mode>('email');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [keepSigned, setKeepSigned] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [loading, setLoading] = useState(false);

    // Worker ID path
    const [workerId, setWorkerId] = useState('');
    const [legacyPassword, setLegacyPassword] = useState('');
    const [claimFirstName, setClaimFirstName] = useState('');
    const [claimEmail, setClaimEmail] = useState('');
    const [claimPassword, setClaimPassword] = useState('');
    const [claimConfirm, setClaimConfirm] = useState('');

    /** Signs in against Firebase and exchanges the token for the session cookie. */
    async function establishSession(withEmail: string, withPassword: string) {
        const auth = firebaseAuth();
        await setPersistence(auth, keepSigned ? browserLocalPersistence : browserSessionPersistence);
        const credential = await signInWithEmailAndPassword(auth, withEmail.trim(), withPassword);

        const idToken = await credential.user.getIdToken();
        const res = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });
        if (!res.ok) throw new Error('Could not start a session.');

        // Full navigation rather than router.push + refresh: the session
        // cookie was only just set, and the two racing against each other
        // aborts the dashboard's RSC fetch and leaves the login page up.
        window.location.assign('/dashboard');
    }

    /** Step 1 of the Worker ID path. */
    async function handleWorkerIdSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setNotice('');
        setLoading(true);

        const result = await startWorkerIdLogin(workerId, legacyPassword);
        setLoading(false);

        if (!result.success) {
            setError(result.error);
            return;
        }

        if (result.data.step === 'use_email') {
            setMode('email');
            setEmail(result.data.email);
            setNotice('This Worker ID is already set up. Please sign in with your email.');
            return;
        }

        setClaimFirstName(result.data.firstName);
        setClaimEmail(result.data.suggestedEmail ?? '');
        setMode('claim');
    }

    /** Step 2 — claim the email, then sign straight in with it. */
    async function handleClaimSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (claimPassword !== claimConfirm) {
            setError('The two passwords do not match.');
            return;
        }

        setLoading(true);
        const result = await completeWorkerIdClaim({
            workerId,
            legacyPassword,
            email: claimEmail,
            newPassword: claimPassword,
        });

        if (!result.success) {
            setLoading(false);
            setError(result.error);
            return;
        }

        try {
            await establishSession(result.data.email, claimPassword);
        } catch {
            setLoading(false);
            setMode('email');
            setEmail(result.data.email);
            setNotice('Your account is set up. Please sign in with your new email and password.');
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await establishSession(email, password);
        } catch {
            setError('Invalid email or password.');
            setLoading(false);
        }
    }

    return (
        <div className="relative min-h-screen flex flex-col overflow-hidden">
            {/* Background image */}
            <Image
                src="/cog-bg.png"
                alt="COG Dasmarinas background"
                fill
                className="object-cover object-center"
                priority
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/55" />

            {/* Top accent bar */}
            <div className="relative z-10 flex h-2 w-full">
                <div className="flex-1 bg-[#e91e8c]" />
                <div className="w-2" />
                <div className="flex-1 bg-[#2dc7be]" />
            </div>

            {/* Page content */}
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-18 py-30">

                {/* Logo above card */}
                <div className="mb-10 flex flex-col items-center">
                    <div className="w-40 h-40 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden">
                        <Image
                            src="/c2s.png"
                            alt="Connect2Souls Logo"
                            width={136}
                            height={136}
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

                {/* Login card */}
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl px-8 py-8">
                    <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
                        {mode === 'claim' ? 'Set up your account' : 'Login to your account'}
                    </h2>
                    <p className="text-sm text-gray-500 text-center mb-5">
                        {mode === 'email' && 'Enter your email and password to continue'}
                        {mode === 'worker' && 'First time here? Sign in with your Worker ID once.'}
                        {mode === 'claim' && `Welcome, ${claimFirstName}. Choose the email you will log in with from now on.`}
                    </p>

                    {/* Mode switcher — hidden mid-claim so the flow isn't abandoned halfway. */}
                    {mode !== 'claim' && (
                        <div className="flex mb-5 rounded-xl bg-[#f4f5f7] p-1">
                            {([['email', 'Email'], ['worker', 'Worker ID']] as const).map(([key, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => { setMode(key); setError(''); setNotice(''); }}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                                        mode === key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}

                    {notice && (
                        <div className="mb-4 bg-[#e0f7f5] border border-[#9fe3dd] text-[#0b7d72] text-xs px-4 py-2.5 rounded-xl">
                            {notice}
                        </div>
                    )}

                    {mode === 'worker' && (
                        <form onSubmit={handleWorkerIdSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Worker ID</label>
                                <input
                                    required
                                    type="text"
                                    inputMode="numeric"
                                    value={workerId}
                                    onChange={(e) => setWorkerId(e.target.value)}
                                    placeholder="e.g 145021"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be] bg-[#f8fffe]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
                                <input
                                    required
                                    type="password"
                                    value={legacyPassword}
                                    onChange={(e) => setLegacyPassword(e.target.value)}
                                    placeholder="Your ORS password"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be] bg-[#f8fffe]"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-2.5 rounded-xl">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-xl text-white font-bold text-sm transition-opacity disabled:opacity-70"
                                style={{ background: '#2dc7be' }}
                            >
                                {loading ? 'Checking...' : 'Continue'}
                            </button>
                        </form>
                    )}

                    {mode === 'claim' && (
                        <form onSubmit={handleClaimSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Your email</label>
                                <input
                                    required
                                    type="email"
                                    autoComplete="email"
                                    value={claimEmail}
                                    onChange={(e) => setClaimEmail(e.target.value)}
                                    placeholder="you@cogdasmarinas.org"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be] bg-[#f8fffe]"
                                />
                                <p className="text-[11px] text-gray-400 mt-1">
                                    You will use this to sign in from now on. Your Worker ID login closes after this step.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                                <input
                                    required
                                    type="password"
                                    minLength={8}
                                    autoComplete="new-password"
                                    value={claimPassword}
                                    onChange={(e) => setClaimPassword(e.target.value)}
                                    placeholder="At least 8 characters"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be] bg-[#f8fffe]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                                <input
                                    required
                                    type="password"
                                    minLength={8}
                                    autoComplete="new-password"
                                    value={claimConfirm}
                                    onChange={(e) => setClaimConfirm(e.target.value)}
                                    placeholder="Re-enter your new password"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be] bg-[#f8fffe]"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-2.5 rounded-xl">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-xl text-white font-bold text-sm transition-opacity disabled:opacity-70"
                                style={{ background: '#2dc7be' }}
                            >
                                {loading ? 'Setting up...' : 'Finish setup'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setMode('worker'); setError(''); }}
                                className="w-full text-xs text-gray-500 hover:text-gray-700"
                            >
                                Back
                            </button>
                        </form>
                    )}

                    {mode === 'email' && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                </span>
                                <input
                                    required
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@cogdasmarinas.org"
                                    className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be] bg-[#f8fffe]"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                    </svg>
                                </span>
                                <input
                                    required
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full border border-gray-200 rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be] bg-[#f8fffe]"
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

                        {/* Keep me signed in */}
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={keepSigned}
                                onChange={(e) => setKeepSigned(e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-gray-300 accent-[#2dc7be]"
                            />
                            <span className="text-xs text-gray-500">Keep me signed in on this device</span>
                        </label>

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
                            className="w-full py-3 rounded-xl text-white font-bold text-sm transition-opacity disabled:opacity-70"
                            style={{ background: '#2dc7be' }}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                    )}

                    {/* First-time entry point — hidden mid-claim. */}
                    {mode === 'email' && (
                        <div className="mt-4 text-center">
                            <button
                                type="button"
                                className="text-sm text-[#2dc7be] font-medium hover:underline"
                                onClick={() => { setMode('worker'); setError(''); setNotice(''); }}
                            >
                                First time here? Use your Worker ID
                            </button>
                        </div>
                    )}

                </div>

                {/* App download card */}
                <div className="w-full max-w-md mt-4 bg-white rounded-2xl shadow-xl px-6 py-5 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900">Get the connect2souls app</p>
                        <p className="text-xs text-gray-500 mb-3">Scan the QR code or download from your store.</p>
                        <div className="flex items-center gap-2">
                            {/* App Store badge */}
                            <a
                                href="#"
                                className="inline-flex items-center gap-1 bg-black text-white text-[10px] font-semibold rounded-lg px-3 py-1.5 leading-tight"
                            >
                                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                </svg>
                                <span className="flex flex-col items-start">
                                    <span className="text-[8px] font-normal opacity-80">Download on the</span>
                                    <span>App Store</span>
                                </span>
                            </a>
                            {/* Google Play badge */}
                            <a
                                href="#"
                                className="inline-flex items-center gap-1 bg-black text-white text-[10px] font-semibold rounded-lg px-3 py-1.5 leading-tight"
                            >
                                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3.18 23.76c.3.16.64.2.97.12l11.43-11.43-2.59-2.59L3.18 23.76zm16.49-11.25L17.1 11.1l-2.12 2.12 2.59 2.59 2.1-1.21c.6-.35.6-1.24-.01-1.59zM3.01.37C2.7.56 2.5.9 2.5 1.29v21.42c0 .39.2.73.51.92l11.62-11.63L3.01.37zm10.07 10.07L2.5 1.29l.51-.92 10.55 5.69-2.48 4.38z" />
                                </svg>
                                <span className="flex flex-col items-start">
                                    <span className="text-[8px] font-normal opacity-80">GET IT ON</span>
                                    <span>Google Play</span>
                                </span>
                            </a>
                        </div>
                    </div>
                    {/* QR Code placeholder */}
                    <div className="w-20 h-20 shrink-0 border-2 border-[#2dc7be] rounded-xl flex items-center justify-center bg-white overflow-hidden p-1">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            {/* Simple QR-like pattern */}
                            <rect x="5" y="5" width="38" height="38" fill="none" stroke="#000" strokeWidth="5" />
                            <rect x="15" y="15" width="18" height="18" fill="#000" />
                            <rect x="57" y="5" width="38" height="38" fill="none" stroke="#000" strokeWidth="5" />
                            <rect x="67" y="15" width="18" height="18" fill="#000" />
                            <rect x="5" y="57" width="38" height="38" fill="none" stroke="#000" strokeWidth="5" />
                            <rect x="15" y="67" width="18" height="18" fill="#000" />
                            <rect x="57" y="57" width="8" height="8" fill="#000" />
                            <rect x="70" y="57" width="8" height="8" fill="#000" />
                            <rect x="83" y="57" width="8" height="8" fill="#000" />
                            <rect x="57" y="70" width="8" height="8" fill="#000" />
                            <rect x="83" y="70" width="8" height="8" fill="#000" />
                            <rect x="57" y="83" width="8" height="8" fill="#000" />
                            <rect x="70" y="83" width="8" height="8" fill="#000" />
                            <rect x="83" y="83" width="8" height="8" fill="#000" />
                        </svg>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-5 flex flex-col items-center gap-1">
                    <p className="text-xs text-white/60 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                        Secure sign-in for authorized C2S workers
                    </p>
                    <a href="/c2s-finder" className="text-xs text-[#2dc7be] hover:underline">
                        Back to C2S Finder
                    </a>
                </div>
            </div>
        </div>
    );
}
