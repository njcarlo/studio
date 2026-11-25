'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/lib/theme-context';
import { useFontSize, FONT_SIZE_MIN, FONT_SIZE_MAX, FONT_SIZE_DEFAULT } from '@/lib/font-size-context';

export type MySettingsSection = 'display' | 'change-password' | 'login-security' | 'help' | 'report';

const MOCK_DEVICES = [
    { id: '1', name: 'Chrome on Windows', location: 'Dasmariñas, Cavite', time: 'Active now', current: true },
    { id: '2', name: 'Safari on iPhone', location: 'Dasmariñas, Cavite', time: '2 hours ago', current: false },
    { id: '3', name: 'Firefox on MacOS', location: 'Manila', time: '3 days ago', current: false },
];

export const MY_SETTINGS_ITEMS: { key: MySettingsSection; label: string; sub: string }[] = [
    { key: 'display', label: 'Display & Font Size', sub: 'Customize theme appearance and interface text size.' },
    { key: 'change-password', label: 'Change Password', sub: 'Update your account password to keep your account secure.' },
    { key: 'login-security', label: 'Login Security', sub: 'Review active sessions and manage logged-in devices.' },
    { key: 'help', label: 'Help & Support', sub: 'Frequently asked questions and support contact.' },
    { key: 'report', label: 'Report a Problem', sub: 'Let our team know about bugs, errors, or feedback.' },
];

export function scrollDashboardToTop() {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
}

export function useScrollToTop(trigger: unknown) {
    useEffect(() => {
        scrollDashboardToTop();
    }, [trigger]);
}

export interface SidebarNavItem {
    key: string;
    label: string;
    icon: string;
    badge?: number;
    badgeColor?: string;
}

export interface SidebarNavGroup {
    id: string;
    label: string;
    icon: string;
    items: SidebarNavItem[];
}

export type SidebarNavEntry =
    | { kind: 'item'; item: SidebarNavItem }
    | { kind: 'group'; group: SidebarNavGroup };

/**
 * Shared sidebar navigation supporting collapsible category dropdowns when expanded
 * and a flat icon rail with section dividers when collapsed.
 */
export function SidebarNavList({
    entries,
    activeKey,
    onSelect,
    collapsed = false,
    accentColor = '#5b50d6',
}: {
    entries: SidebarNavEntry[];
    activeKey: string | null;
    onSelect: (key: string) => void;
    collapsed?: boolean;
    accentColor?: string;
}) {
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (collapsed) {
            setOpenGroups({});
        }
    }, [collapsed]);

    function toggleGroup(id: string) {
        setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
    }

    function handleSelect(key: string) {
        scrollDashboardToTop();
        onSelect(key);
    }

    return (
        <nav className={`flex-1 overflow-y-auto scrollbar-none ${collapsed ? 'px-3 md:px-2' : 'px-3'}`}>
            {/* Expanded & Mobile Drawer View (with category dropdowns) */}
            <div className={`flex flex-col gap-1 ${collapsed ? 'md:hidden' : ''}`}>
                {entries.map((entry) => {
                    if (entry.kind === 'item') {
                        const { item } = entry;
                        const isActive = activeKey === item.key;
                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => handleSelect(item.key)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors w-full text-left ${
                                    isActive
                                        ? 'nav-item-active text-gray-800 shadow-sm'
                                        : 'text-gray-500 hover:bg-white/60 dark:hover:bg-white/10'
                                }`}
                            >
                                <svg className="shrink-0" width="18" height="18" viewBox="0 0 24 24" fill={isActive ? accentColor : '#aaa'}>
                                    <path d={item.icon} />
                                </svg>
                                <span className="flex-1 truncate">{item.label}</span>
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span
                                        className="ml-auto text-[11px] font-bold min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-white shrink-0"
                                        style={{ background: item.badgeColor ?? '#5b50d6' }}
                                    >
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    }

                    const { group } = entry;
                    const groupActive = group.items.some(i => i.key === activeKey);
                    const isOpen = Boolean(openGroups[group.id]);
                    const totalBadge = group.items.reduce((sum, i) => sum + (i.badge ?? 0), 0);
                    const badgeBg = group.items.find(i => (i.badge ?? 0) > 0)?.badgeColor ?? '#5b50d6';

                    return (
                        <div key={group.id} className="flex flex-col">
                            <button
                                type="button"
                                onClick={() => toggleGroup(group.id)}
                                className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors w-full text-left ${
                                    groupActive || isOpen
                                        ? 'text-gray-800 dark:text-gray-100 bg-white/50 dark:bg-white/5'
                                        : 'text-gray-500 hover:bg-white/60 dark:hover:bg-white/10'
                                }`}
                            >
                                <span className="flex items-center gap-3 min-w-0">
                                    <svg className="shrink-0" width="18" height="18" viewBox="0 0 24 24" fill={groupActive || isOpen ? accentColor : '#aaa'}>
                                        <path d={group.icon} />
                                    </svg>
                                    <span className="truncate">{group.label}</span>
                                </span>
                                <span className="flex items-center gap-1.5 shrink-0">
                                    {!isOpen && totalBadge > 0 && (
                                        <span
                                            className="text-[10px] font-bold min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-white"
                                            style={{ background: badgeBg }}
                                        >
                                            {totalBadge}
                                        </span>
                                    )}
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                                    >
                                        <path d="M9 18l6-6-6-6" />
                                    </svg>
                                </span>
                            </button>

                            {isOpen && (
                                <div className="mt-1 ml-3 pl-2.5 border-l border-gray-200/80 dark:border-gray-700/60 flex flex-col gap-0.5">
                                    {group.items.map(sub => {
                                        const isSubActive = activeKey === sub.key;
                                        return (
                                            <button
                                                key={sub.key}
                                                type="button"
                                                onClick={() => handleSelect(sub.key)}
                                                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors w-full text-left ${
                                                    isSubActive
                                                        ? 'nav-item-active text-gray-800 shadow-sm'
                                                        : 'text-gray-500 hover:bg-white/70 hover:text-gray-800 dark:hover:bg-white/10'
                                                }`}
                                            >
                                                <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill={isSubActive ? accentColor : '#aaa'}>
                                                    <path d={sub.icon} />
                                                </svg>
                                                <span className="flex-1 truncate">{sub.label}</span>
                                                {sub.badge !== undefined && sub.badge > 0 && (
                                                    <span
                                                        className="ml-auto text-[10px] font-bold min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-white shrink-0"
                                                        style={{ background: sub.badgeColor ?? '#5b50d6' }}
                                                    >
                                                        {sub.badge}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Collapsed Icon-Rail View (desktop md+) */}
            {collapsed && (
                <div className="hidden md:flex md:flex-col md:gap-1">
                    {entries.map((entry, idx) => {
                        const items = entry.kind === 'item' ? [entry.item] : entry.group.items;
                        return (
                            <div key={entry.kind === 'item' ? entry.item.key : entry.group.id} className="flex flex-col gap-1">
                                {idx > 0 && entry.kind === 'group' && (
                                    <div className="mx-2 my-1 border-t border-gray-200/70 dark:border-gray-700/60" />
                                )}
                                {items.map(item => {
                                    const isActive = activeKey === item.key;
                                    return (
                                        <button
                                            key={item.key}
                                            type="button"
                                            title={item.label}
                                            onClick={() => handleSelect(item.key)}
                                            className={`relative flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-colors ${
                                                isActive
                                                    ? 'nav-item-active text-gray-800 shadow-sm'
                                                    : 'text-gray-500 hover:bg-white/60 dark:hover:bg-white/10'
                                            }`}
                                        >
                                            <svg className="shrink-0 w-5 h-5" width="20" height="20" viewBox="0 0 24 24" fill={isActive ? accentColor : '#aaa'}>
                                                <path d={item.icon} />
                                            </svg>
                                            {item.badge !== undefined && item.badge > 0 && (
                                                <span
                                                    className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-white font-bold sidebar-badge-collapsed ring-2 ring-[#f4f5f7] dark:ring-[#111827]"
                                                    style={{ background: item.badgeColor ?? '#5b50d6' }}
                                                >
                                                    {item.badge}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            )}
        </nav>
    );
}

/**
 * Sidebar collapse/expand toggle button (icon-rail toggle).
 */
export function SidebarCollapseButton({
    collapsed,
    onToggle,
}: {
    collapsed: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`hidden md:inline-flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-800 hover:bg-white/80 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors shrink-0 ${collapsed ? 'w-10 h-10' : 'w-8 h-8 rounded-lg'
                }`}
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M9 3v18" />
            </svg>
        </button>
    );
}

/**
 * Collapsible sidebar dropdown menu for Settings (matches Image 2 reference).
 */
export function SidebarSettingsDropdown({
    activeSection,
    onSelect,
    label = 'Settings',
    collapsed = false,
    onExpandSidebar,
    extraItem,
}: {
    activeSection: MySettingsSection | null;
    onSelect: (section: MySettingsSection) => void;
    label?: string;
    collapsed?: boolean;
    onExpandSidebar?: () => void;
    extraItem?: { label: string; active: boolean; onClick: () => void };
}) {
    const [open, setOpen] = useState(false);
    const isAnyActive = activeSection !== null || Boolean(extraItem?.active);

    useEffect(() => {
        if (collapsed) {
            setOpen(false);
        }
    }, [collapsed]);

    function handleToggle() {
        if (collapsed && onExpandSidebar) {
            onExpandSidebar();
            setOpen(false);
            return;
        }
        setOpen(o => !o);
    }

    return (
        <div className={`mt-auto pt-3 border-t border-gray-200/70 dark:border-gray-700/60 mx-1 ${collapsed ? 'px-3 md:px-2' : 'px-3'}`}>
            <button
                type="button"
                onClick={handleToggle}
                title={label}
                aria-label={label}
                className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors w-full text-left ${collapsed ? 'md:justify-center md:px-0 md:w-10 md:h-10 md:mx-auto' : ''
                    } ${isAnyActive || (open && !collapsed)
                        ? 'bg-[#5b50d6]/10 text-[#5b50d6]'
                        : 'text-gray-500 hover:bg-white/60 dark:hover:bg-white/10'
                    }`}
            >
                <span className="flex items-center gap-2.5">
                    <svg className={`shrink-0 ${collapsed ? 'md:w-5 md:h-5' : ''}`} width="18" height="18" viewBox="0 0 24 24" fill={isAnyActive || (open && !collapsed) ? '#5b50d6' : '#aaa'}>
                        <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87a.47.47 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.47.47 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.37 1.04.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 0 0-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                    </svg>
                    <span className={collapsed ? 'md:hidden' : ''}>{label}</span>
                </span>
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-200 ${open ? 'rotate-90' : ''} ${collapsed ? 'md:hidden' : ''}`}
                >
                    <path d="M9 18l6-6-6-6" />
                </svg>
            </button>

            {open && (
                <div className={`mt-1.5 ml-3 pl-3 border-l border-gray-200 flex flex-col gap-0.5 ${collapsed ? 'md:hidden' : ''}`}>
                    {extraItem && (
                        <button
                            type="button"
                            onClick={() => { scrollDashboardToTop(); extraItem.onClick(); }}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left w-full ${extraItem.active
                                ? 'bg-[#5b50d6] text-white shadow-sm'
                                : 'text-gray-500 hover:bg-white/70 hover:text-gray-800'
                                }`}
                        >
                            {extraItem.label}
                        </button>
                    )}
                    {MY_SETTINGS_ITEMS.map(item => {
                        const active = activeSection === item.key;
                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => { scrollDashboardToTop(); onSelect(item.key); }}
                                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left w-full ${active
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
                                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900">Dark Mode</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{isDark ? 'Currently enabled' : 'Currently disabled'}</p>
                                </div>
                                <div
                                    className="relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200"
                                    style={{ background: isDark ? '#14B8A6' : '#cbd5e1' }}
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
                                            <path d="M9 4v3h5v12h3V7h5V4H9zm-6 8h3v7h3v-7h3V9H3v3z" />
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
                                        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-[#5b50d6] dark:accent-[#14B8A6]"
                                        style={{
                                            background: `linear-gradient(to right, ${isDark ? '#14B8A6' : '#5b50d6'} ${fontPct}%, ${isDark ? '#334155' : '#e2e8f0'} ${fontPct}%)`
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
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
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
                                    { label: 'New Password', value: newPw, set: setNewPw },
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
                                            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z" />
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
                            { title: 'Getting Started', desc: 'Learn how to navigate and use Connect2Souls.' },
                            { title: 'Managing Your Mentees', desc: 'How to accept, track, and disciple mentees.' },
                            { title: 'C2S Groups', desc: 'Creating and managing Community & Church-based groups.' },
                            { title: 'Contact Support', desc: 'Reach our support team at support@c2s.church' },
                        ].map(item => (
                            <div key={item.title} className="flex items-start gap-3.5 px-4 py-4 rounded-xl border border-gray-100 bg-[#fafbff]">
                                <div className="w-8 h-8 rounded-lg bg-[#ede9fe] flex items-center justify-center shrink-0 mt-0.5">
                                    <svg className="w-4 h-4 text-[#5b50d6]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" />
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
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
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
