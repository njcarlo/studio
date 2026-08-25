'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useFontSize, FONT_SIZE_MIN, FONT_SIZE_MAX, FONT_SIZE_DEFAULT } from '@/lib/font-size-context';

interface SettingsModalProps {
    onClose: () => void;
}

// ─── Mock logged-in devices ────────────────────────────────────────────────
const MOCK_DEVICES = [
    { id: '1', name: 'Chrome on Windows', location: 'Dasmariñas, Cavite', time: 'Active now',  current: true  },
    { id: '2', name: 'Safari on iPhone',  location: 'Dasmariñas, Cavite', time: '2 hours ago', current: false },
    { id: '3', name: 'Firefox on MacOS',  location: 'Manila',             time: '3 days ago',  current: false },
];

type Section = 'main' | 'change-password' | 'help' | 'report' | 'login-security';

export default function SettingsModal({ onClose }: SettingsModalProps) {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { fontSize, setFontSize } = useFontSize();

    const [section, setSection] = useState<Section>('main');

    // Change Password state
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw]         = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [pwSuccess, setPwSuccess] = useState(false);
    const [pwError, setPwError]     = useState('');

    // Report state
    const [reportText, setReportText] = useState('');
    const [reportSent, setReportSent] = useState(false);

    // Login security state
    const [devices, setDevices] = useState(MOCK_DEVICES);

    const isDark = theme === 'dark';

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

    // ── Shared back header ──────────────────────────────────────────────────
    function BackHeader({ title }: { title: string }) {
        return (
            <div className="flex items-center gap-3 mb-5">
                <button
                    onClick={() => { setSection('main'); setPwSuccess(false); setPwError(''); setReportSent(false); }}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                </button>
                <h2 className="text-base font-bold text-gray-900">{title}</h2>
            </div>
        );
    }

    // ── Sub-sections ────────────────────────────────────────────────────────

    function ChangePasswordSection() {
        return (
            <div>
                <BackHeader title="Change Password" />
                {pwSuccess ? (
                    <div className="flex flex-col items-center gap-3 py-6">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                        </div>
                        <p className="font-bold text-gray-900">Password updated!</p>
                        <p className="text-sm text-gray-400 text-center">Your password has been changed successfully.</p>
                        <button onClick={() => setPwSuccess(false)} className="mt-2 text-sm font-semibold text-[#5b50d6] hover:underline">
                            Change again
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                        {[
                            { label: 'Current Password', value: currentPw, set: setCurrentPw },
                            { label: 'New Password',     value: newPw,     set: setNewPw     },
                            { label: 'Confirm Password', value: confirmPw, set: setConfirmPw },
                        ].map(({ label, value, set }) => (
                            <div key={label}>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                                <input
                                    type="password"
                                    value={value}
                                    onChange={e => set(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b50d6] bg-gray-50"
                                />
                            </div>
                        ))}
                        {pwError && (
                            <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{pwError}</p>
                        )}
                        <button type="submit" className="w-full bg-[#5b50d6] hover:bg-[#4a41c0] text-white font-bold py-2.5 rounded-xl text-sm transition-colors mt-1">
                            Update Password
                        </button>
                    </form>
                )}
            </div>
        );
    }

    function HelpSection() {
        const items = [
            { title: 'Getting Started',       desc: 'Learn how to use Connect2Souls.' },
            { title: 'Managing Your Mentees', desc: 'How to accept, track and disciple mentees.' },
            { title: 'C2S Groups',            desc: 'Creating and managing C2S groups.' },
            { title: 'Contact Support',       desc: 'Reach our team at support@c2s.church' },
        ];
        return (
            <div>
                <BackHeader title="Help & Support" />
                <div className="flex flex-col gap-3">
                    {items.map(item => (
                        <button key={item.title} className="flex items-start gap-3 text-left px-4 py-3.5 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors w-full">
                            <div className="w-8 h-8 rounded-full bg-[#ede9fe] flex items-center justify-center shrink-0 mt-0.5">
                                <svg className="w-4 h-4 text-[#5b50d6]" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    function ReportSection() {
        return (
            <div>
                <BackHeader title="Report a Problem" />
                {reportSent ? (
                    <div className="flex flex-col items-center gap-3 py-6">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                        </div>
                        <p className="font-bold text-gray-900">Report submitted!</p>
                        <p className="text-sm text-gray-400 text-center">Thank you. We'll look into this as soon as possible.</p>
                        <button onClick={() => setReportSent(false)} className="mt-2 text-sm font-semibold text-[#5b50d6] hover:underline">
                            Submit another
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleReport} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                            <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#5b50d6]">
                                <option>Bug / Error</option>
                                <option>Feature Request</option>
                                <option>Incorrect Data</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
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
                            className="w-full bg-[#5b50d6] hover:bg-[#4a41c0] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                        >
                            Submit Report
                        </button>
                    </form>
                )}
            </div>
        );
    }

    function LoginSecuritySection() {
        const otherDevices = devices.filter(d => !d.current);
        return (
            <div>
                <BackHeader title="Login Security" />
                <div className="mb-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Current Device</p>
                    {devices.filter(d => d.current).map(d => (
                        <div key={d.id} className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/>
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{d.name}</p>
                                <p className="text-xs text-gray-400">{d.location} · {d.time}</p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-700 shrink-0">This device</span>
                        </div>
                    ))}
                </div>
                {otherDevices.length > 0 && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Other Devices</p>
                            <button onClick={logOutAll} className="text-[11px] font-semibold text-red-500 hover:underline">
                                Log out all
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            {otherDevices.map(d => (
                                <div key={d.id} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/>
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{d.name}</p>
                                        <p className="text-xs text-gray-400">{d.location} · {d.time}</p>
                                    </div>
                                    <button onClick={() => logOutDevice(d.id)} className="text-[11px] font-semibold text-red-500 hover:underline shrink-0">
                                        Log out
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {otherDevices.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No other active sessions.</p>
                )}
            </div>
        );
    }

    // ── Nav menu items ──────────────────────────────────────────────────────
    const menuItems = [
        {
            key: 'change-password' as Section,
            label: 'Change Password',
            desc: 'Update your account password',
            color: '#5b50d6', bg: '#ede9fe',
            icon: <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>,
        },
        {
            key: 'help' as Section,
            label: 'Help & Support',
            desc: 'FAQs and contact our team',
            color: '#0b9b8a', bg: '#d3f9f0',
            icon: <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>,
        },
        {
            key: 'report' as Section,
            label: 'Report a Problem',
            desc: 'Let us know about bugs or issues',
            color: '#e67700', bg: '#fff3e0',
            icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>,
        },
        {
            key: 'login-security' as Section,
            label: 'Login Security',
            desc: 'Manage logged-in devices',
            color: '#1971c2', bg: '#dbeafe',
            icon: <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>,
        },
    ];

    const fontPct = ((fontSize - FONT_SIZE_MIN) / (FONT_SIZE_MAX - FONT_SIZE_MIN)) * 100;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden"
                style={{ maxHeight: '90vh' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="overflow-y-auto p-6">

                    {/* ── Main menu ── */}
                    {section === 'main' && (
                        <>
                            {/* Header */}
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-bold text-gray-900">Settings</h2>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                    </svg>
                                </button>
                            </div>

                            {/* Profile */}
                            {user && (
                                <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-gray-50 mb-5">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0" style={{ background: '#5b50d6' }}>
                                        {user.avatar}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">{user.name}</p>
                                        <p className="text-xs text-gray-400 capitalize">{user.role?.replace(/_/g, ' ')}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-2">

                                {/* ── Dark Mode toggle row ── */}
                                <button
                                    onClick={toggleTheme}
                                    className="flex items-center gap-4 w-full text-left px-4 py-3.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: isDark ? '#1e293b' : '#f1f5f9' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#e2e8f0' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900">Dark Mode</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{isDark ? 'Currently on' : 'Currently off'}</p>
                                    </div>
                                    {/* Toggle switch */}
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

                                {/* ── Text Size row ── */}
                                <div className="flex flex-col gap-3 px-4 py-3.5 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#ede9fe]">
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
                                                onClick={() => setFontSize(FONT_SIZE_DEFAULT)}
                                                className="text-[11px] font-semibold text-[#5b50d6] hover:underline shrink-0"
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </div>
                                    {/* Slider */}
                                    <div className="flex items-center gap-2 px-1">
                                        <span className="text-xs font-bold text-gray-400 w-4 shrink-0">A</span>
                                        <input
                                            type="range"
                                            min={FONT_SIZE_MIN}
                                            max={FONT_SIZE_MAX}
                                            step={1}
                                            value={fontSize}
                                            onChange={e => setFontSize(Number(e.target.value))}
                                            aria-label="Adjust text size"
                                            className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-[#5b50d6]"
                                            style={{
                                                background: `linear-gradient(to right, #5b50d6 ${fontPct}%, #e2e8f0 ${fontPct}%)`
                                            }}
                                        />
                                        <span className="text-base font-bold text-gray-400 w-4 shrink-0 text-right">A</span>
                                    </div>
                                </div>

                                {/* ── Nav items ── */}
                                {menuItems.map(item => (
                                    <button
                                        key={item.key}
                                        onClick={() => setSection(item.key)}
                                        className="flex items-center gap-4 w-full text-left px-4 py-3.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: item.bg }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill={item.color}>
                                                {item.icon}
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                                        </div>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#d1d5db">
                                            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {section === 'change-password' && <ChangePasswordSection />}
                    {section === 'help'             && <HelpSection />}
                    {section === 'report'           && <ReportSection />}
                    {section === 'login-security'   && <LoginSecuritySection />}
                </div>
            </div>
        </div>
    );
}
