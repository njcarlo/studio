'use client';

import { useFontSize, FONT_SIZE_MIN, FONT_SIZE_MAX, FONT_SIZE_DEFAULT } from '@/lib/font-size-context';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';

interface SettingsModalProps {
    onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
    const { fontSize, setFontSize } = useFontSize();
    const { theme, setTheme } = useTheme();
    const { user } = useAuth();

    const isDark = theme === 'dark';

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={onClose}
        >
            <div
                className="rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5"
                style={{ background: 'var(--surface)', color: 'var(--text)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Settings</h2>
                    <button
                        onClick={onClose}
                        aria-label="Close settings"
                        className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>

                {/* Profile info */}
                {user && (
                    <div
                        className="flex items-center gap-3 rounded-xl px-4 py-3"
                        style={{ background: 'var(--bg-subtle)' }}
                    >
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                            style={{ background: '#5b50d6' }}
                        >
                            {user.avatar}
                        </div>
                        <div>
                            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{user.name}</p>
                            <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{user.role?.replace(/_/g, ' ')}</p>
                        </div>
                    </div>
                )}

                <hr style={{ borderColor: 'var(--border)' }} />

                {/* Dark mode toggle row */}
                <button
                    onClick={() => setTheme(isDark ? 'light' : 'dark')}
                    className="flex items-center gap-3 w-full text-left"
                    aria-pressed={isDark}
                >
                    {/* Moon icon in circle */}
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: isDark ? '#334155' : 'var(--bg-subtle)' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            style={{ color: isDark ? '#e2e8f0' : '#64748b' }}>
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                        </svg>
                    </div>

                    {/* Label */}
                    <span className="flex-1 text-sm font-semibold" style={{ color: 'var(--text)' }}>
                        Dark mode
                    </span>

                    {/* Toggle switch */}
                    <div
                        className="relative shrink-0 w-12 h-6 rounded-full transition-colors duration-200"
                        style={{ background: isDark ? '#5b50d6' : '#cbd5e1' }}
                    >
                        <div
                            className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                            style={{ transform: isDark ? 'translateX(24px)' : 'translateX(2px)' }}
                        />
                    </div>
                </button>

                <hr style={{ borderColor: 'var(--border)' }} />

                {/* Font Size Slider */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Text Size</p>
                    </div>

                    {/* Preview text */}
                    <div className="rounded-xl px-4 py-3 text-center" style={{ background: 'var(--bg-subtle)' }}>
                        <p className="font-semibold" style={{ fontSize: `${fontSize}px`, color: 'var(--text)' }}>
                           
                        </p>
                        <p className="mt-1" style={{ fontSize: `${Math.max(10, fontSize - 3)}px`, color: 'var(--text-muted)' }}>
                            Preview
                        </p>
                    </div>

                    {/* Slider */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold w-3 shrink-0" style={{ color: 'var(--text-muted)' }}>A</span>
                        <input
                            type="range"
                            min={FONT_SIZE_MIN}
                            max={FONT_SIZE_MAX}
                            step={1}
                            value={fontSize}
                            onChange={(e) => setFontSize(Number(e.target.value))}
                            aria-label="Adjust text size"
                            className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-[#5b50d6]"
                            style={{
                                background: `linear-gradient(to right, #5b50d6 ${((fontSize - FONT_SIZE_MIN) / (FONT_SIZE_MAX - FONT_SIZE_MIN)) * 100}%, var(--border) ${((fontSize - FONT_SIZE_MIN) / (FONT_SIZE_MAX - FONT_SIZE_MIN)) * 100}%)`
                            }}
                        />
                        <span className="text-base font-bold w-4 shrink-0 text-right" style={{ color: 'var(--text-muted)' }}>A</span>
                    </div>
                </div>

                {/* Reset font size */}
                {fontSize !== FONT_SIZE_DEFAULT && (
                    <button
                        onClick={() => setFontSize(FONT_SIZE_DEFAULT)}
                        className="text-xs font-semibold transition-colors text-center"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        Default
                    </button>
                )}

                <button
                    onClick={onClose}
                    className="w-full bg-[#5b50d6] hover:bg-[#4a41c0] text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                >
                    Confirm
                </button>
            </div>
        </div>
    );
}
