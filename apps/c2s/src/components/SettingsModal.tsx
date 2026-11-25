'use client';

import { useState } from 'react';
import { useTheme } from '@/lib/theme-context';
import { useFontSize, FONT_SIZE_MIN, FONT_SIZE_MAX, FONT_SIZE_DEFAULT } from '@/lib/font-size-context';

export type MySettingsSection = 'display' | 'change-password' | 'login-security' | 'help' | 'report';

const MOCK_DEVICES = [
    { id: '1', name: 'Chrome on Windows', location: 'Dasmariñas, Cavite', time: 'Active now', current: true },
    { id: '2', name: 'Safari on iPhone', location: 'Dasmariñas, Cavite', time: '2 hours ago', current: false },
    { id: '3', name: 'Firefox on MacOS', location: 'Manila', time: '3 days ago', current: false },
];

export const MY_SETTINGS_ITEMS: { key: MySettingsSection; label: string; sub: string }[] = [
    { key: 'display',         label: 'Display & Font Size', sub: 'Customize theme appearance and interface text size.' },
    { key: 'change-password', label: 'Change Password',     sub: 'Update your account password to keep your account secure.' },
    { key: 'login-security',  label: 'Login Security',      sub: 'Review active sessions and manage logged-in devices.' },
    { key: 'help',            label: 'Help & Support',      sub: 'Frequently asked questions and support contact.' },
    { key: 'report',          label: 'Report a Problem',    sub: 'Let our team know about bugs, errors, or feedback.' },
];

/**
 * Collapsible sidebar dropdown menu for Settings (matches Image 2 reference).
 */
export function SidebarSettingsDropdown({
    activeSection,
    onSelect,
    label = 'Settings',
}: {
    activeSection: MySettingsSection | null;
    onSelect: (section: MySettingsSection) => void;
    label?: string;
}) {
    const [open, setOpen] = useState(activeSection !== null);
    const isAnyActive = activeSection !== null;

    return (
        <div className="mt-auto px-3 pt-3 border-t border-gray-100 mx-1">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors w-full text-left ${
                    isAnyActive || open
                        ? 'bg-[#5b50d6]/10 text-[#5b50d6]'
                        : 'text-gray-500 hover:bg-white/60 dark:hover:bg-white/10'
                }`}
            >
                <span className="flex items-center gap-2.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={isAnyActive || open ? '#5b50d6' : '#aaa'}>
                        <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87a.47.47 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.47.47 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.37 1.04.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 0 0-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                    </svg>
                    {label}
                </span>
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                >
                    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
                </svg>
            </button>

            {open && (
                <div className="mt-1.5 ml-3 pl-3 border-l border-gray-200 flex flex-col gap-0.5">
                    {MY_SETTINGS_ITEMS.map(item => {
                        const active = activeSection === item.key;
                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => onSelect(item.key)}
                                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left w-full ${
                                    active
                                        ? 'bg-[#5b50d6] text-white shadow-sm'
                                        : 'text-gray-500 hover:bg-white/70 hover:text-gray-800'
                                }`}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/**
 * Full-width inline Settings page view rendered inside the dashboard main content
 * (matches Image 3 layout, keeping original C2S settings content).
 */
export function SettingsPageView({ section }: { section: MySettingsSection }) {
    const { theme, toggleTheme } = useTheme();
    const { fontSize, setFontSize } = useFontSize();

    // Change Password state
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [pwSuccess, setPwSuccess] = useState(false);
    const [pwError, setPwError] = useState('');

    // Report state
    const [reportText, setReportText] = useState('');
    const [reportSent, setReportSent] = useState(false);

    // Login security state
    const [devices, setDevices] = useState(MOCK_DEVICES);

    const isDark = theme === 'dark';
    const fontPct = ((fontSize - FONT_SIZE_MIN) / (FONT_SIZE_MAX - FONT_SIZE_MIN)) * 100;
    const meta = MY_SETTINGS_ITEMS.find(i => i.key === section) ?? MY_SETTINGS_ITEMS[0];

    function handleChangePassword(e: React.FormEvent) {
        e.preventDefault();
        setPwError('');
        if (!currentPw) { setPwError('Enter your current password.'); return; }
        if (newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
        if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
        setPwSuccess(true);
        setCurrentPw(''); setNewPw(''); setConfirmPw('');
    }

    function handleReport(e: React.FormEvent) {
        e.preventDefault();
        if (reportText.trim().length < 10) return;
        setReportSent(true);
        setReportText('');
    }

    function logOutDevice(id: string) {
        setDevices(prev => prev.filter(d => d.id !== id));
    }

    function logOutAll() {
        setDevices(prev => prev.filter(d => d.current));
    }

    return (
        <div>
            {/* Page Header (matches Image 3 layout) */}
            <div className="mb-6">
                <h1 className="text-[1.6rem] font-semibold text-gray-900 leading-tight">{meta.label}</h1>
                <p className="text-sm text-gray-400 mt-1">{meta.sub}</p>
            </div>

            {/* Main White Card Container */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

                {/* ── 1. Display & Font Size ── */}
                {section === 'display' && (
                    <div className="max-w-2xl space-y-5">
                        <div className="rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                            {/* Dark Mode */}
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="flex items-center gap-4 w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: isDark ? '#1e293b' : '#f1f5f9' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#e2e8f0' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900">Dark Mode</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{isDark ? 'Currently enabled' : 'Currently disabled'}</p>
                                </div>
                                <div
                                    className="relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200"
                                    style={{ background: isDark ? '#5b50d6' : '#cbd5e1' }}
                                >
                                    <div
                                        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                                        style={{ transform: isDark ? 'translateX(22px)' : 'translateX(2px)' }}
                                    />
                                </div>
                            </button>

                            {/* Text Size */}
                            <div className="px-5 py-4 space-y-3">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#ede9fe]">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#5b50d6">
                                            <path d="M9 4v3h5v12h3V7h5V4H9zm-6 8h3v7h3v-7h3V9H3v3z"/>
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900">Text Size</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{fontSize}px</p>
                                    </div>
                                    {fontSize !== FONT_SIZE_DEFAULT && (
                                        <button
                                            type="button"
                                            onClick={() => setFontSize(FONT_SIZE_DEFAULT)}
                                            className="text-xs font-semibold text-[#5b50d6] hover:underline shrink-0"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 pl-14">
                                    <span className="text-xs font-bold text-gray-400">A</span>
                                    <input
                                        type="range"
                                        min={FONT_SIZE_MIN}
                                        max={FONT_SIZE_MAX}
                                        step={1}
                                        value={fontSize}
                                        onChange={e => setFontSize(Number(e.target.value))}
                                        aria-label="Adjust text size"
                                        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-[#5b50d6]"
                                        style={{
                                            background: `linear-gradient(to right, #5b50d6 ${fontPct}%, #e2e8f0 ${fontPct}%)`
                                        }}
                                    />
                                    <span className="text-base font-bold text-gray-400">A</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── 2. Change Password ── */}
                {section === 'change-password' && (
                    <div className="max-w-lg">
                        {pwSuccess ? (
                            <div className="flex flex-col items-center gap-3 py-8 rounded-xl border border-gray-100 bg-gray-50">
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                    </svg>
                                </div>
                                <p className="font-bold text-gray-900">Password updated!</p>
                                <p className="text-xs text-gray-400 text-center">Your password has been changed successfully.</p>
                                <button type="button" onClick={() => setPwSuccess(false)} className="mt-1 text-xs font-semibold text-[#5b50d6] hover:underline">
                                    Change again
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                {[
                                    { label: 'Current Password', value: currentPw, set: setCurrentPw },
                                    { label: 'New Password',     value: newPw,     set: setNewPw     },
                                    { label: 'Confirm Password', value: confirmPw, set: setConfirmPw },
                                ].map(({ label, value, set }) => (
                                    <div key={label}>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
                                        <input
                                            type="password"
                                            value={value}
                                            onChange={e => set(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b50d6] bg-gray-50"
                                        />
                                    </div>
                                ))}
                                {pwError && <p className="text-xs font-semibold text-red-500">{pwError}</p>}
                                <button type="submit" className="bg-[#5b50d6] hover:bg-[#4a41c0] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
                                    Update Password
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {/* ── 3. Login Security ── */}
                {section === 'login-security' && (
                    <div className="max-w-2xl space-y-6">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Current Device</p>
                            {devices.filter(d => d.current).map(d => (
                                <div key={d.id} className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3.5">
                                    <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4 text-emerald-700" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/>
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{d.name}</p>
                                        <p className="text-xs text-gray-400">{d.location} · {d.time}</p>
                                    </div>
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 shrink-0">This device</span>
                                </div>
                            ))}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2.5">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Other Devices</p>
                                {devices.some(d => !d.current) && (
                                    <button type="button" onClick={logOutAll} className="text-xs font-semibold text-red-500 hover:underline">
                                        Log out all
                                    </button>
                                )}
                            </div>
                            {devices.some(d => !d.current) ? (
                                <div className="space-y-2.5">
                                    {devices.filter(d => !d.current).map(d => (
                                        <div key={d.id} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5">
                                            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                                <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 truncate">{d.name}</p>
                                                <p className="text-xs text-gray-400">{d.location} · {d.time}</p>
                                            </div>
                                            <button type="button" onClick={() => logOutDevice(d.id)} className="text-xs font-semibold text-red-500 hover:underline shrink-0">
                                                Log out
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 text-center py-6 border border-gray-100 rounded-xl">No other active sessions.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* ── 4. Help & Support ── */}
                {section === 'help' && (
                    <div className="max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {[
                            { title: 'Getting Started',       desc: 'Learn how to navigate and use Connect2Souls.' },
                            { title: 'Managing Your Mentees', desc: 'How to accept, track, and disciple mentees.' },
                            { title: 'C2S Groups',            desc: 'Creating and managing Community & Church-based groups.' },
                            { title: 'Contact Support',       desc: 'Reach our support team at support@c2s.church' },
                        ].map(item => (
                            <div key={item.title} className="flex items-start gap-3.5 px-4 py-4 rounded-xl border border-gray-100 bg-[#fafbff]">
                                <div className="w-8 h-8 rounded-lg bg-[#ede9fe] flex items-center justify-center shrink-0 mt-0.5">
                                    <svg className="w-4 h-4 text-[#5b50d6]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── 5. Report a Problem ── */}
                {section === 'report' && (
                    <div className="max-w-lg">
                        {reportSent ? (
                            <div className="flex flex-col items-center gap-3 py-8 rounded-xl border border-gray-100 bg-gray-50">
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                    </svg>
                                </div>
                                <p className="font-bold text-gray-900">Report submitted!</p>
                                <p className="text-xs text-gray-400 text-center">Thank you. We&apos;ll look into this as soon as possible.</p>
                                <button type="button" onClick={() => setReportSent(false)} className="mt-1 text-xs font-semibold text-[#5b50d6] hover:underline">
                                    Submit another
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleReport} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
                                    <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#5b50d6]">
                                        <option>Bug / Error</option>
                                        <option>Feature Request</option>
                                        <option>Incorrect Data</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                                    <textarea
                                        rows={4}
                                        value={reportText}
                                        onChange={e => setReportText(e.target.value)}
                                        placeholder="Describe the problem in detail…"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#5b50d6] resize-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={reportText.trim().length < 10}
                                    className="bg-[#5b50d6] hover:bg-[#4a41c0] disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
                                >
                                    Submit Report
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
