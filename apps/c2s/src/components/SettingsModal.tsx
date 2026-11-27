'use client';

import CustomSelect from '@/components/CustomSelect';
import ConfirmModal from '@/components/ConfirmModal';
import { WorkerSinceValue } from '@/components/WorkerIdentityBits';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useFontSize, FONT_SIZE_MIN, FONT_SIZE_MAX, FONT_SIZE_DEFAULT, FONT_SIZE_PRESETS } from '@/lib/font-size-context';

export type MySettingsSection = 'profile' | 'display' | 'change-password' | 'login-security' | 'help' | 'report';

const ROLE_DISPLAY_LABEL: Record<string, string> = {
    admin: 'C2S Admin',
    ministry_head: 'Ministry Head',
    cluster_head: 'Cluster Head',
    c2s_coordinator: 'C2S Coordinator',
    mentor: 'Mentor',
};

const MOCK_DEVICES = [
    { id: '1', name: 'Chrome on Windows', location: 'Dasmariñas, Cavite', time: 'Active now', current: true },
    { id: '2', name: 'Safari on iPhone', location: 'Dasmariñas, Cavite', time: '2 hours ago', current: false },
    { id: '3', name: 'Firefox on MacOS', location: 'Manila', time: '3 days ago', current: false },
];

export const MY_SETTINGS_ITEMS: { key: MySettingsSection; label: string; sub: string }[] = [
    { key: 'profile', label: 'My Profile', sub: 'View your Worker ID, issue date, role, and account details.' },
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
    iconKind?: 'fill' | 'stroke';
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
    accentColor = '#FFFFFF',
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

    function renderIcon(icon: string, iconKind: 'fill' | 'stroke' | undefined, size: number, active: boolean) {
        if (iconKind === 'stroke') {
            return (
                <svg
                    className="shrink-0"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d={icon} />
                </svg>
            );
        }
        return (
            <svg className="shrink-0" width={size} height={size} viewBox="0 0 24 24" fill={active ? accentColor : '#9BA7B4'} aria-hidden="true">
                <path d={icon} />
            </svg>
        );
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
                                {renderIcon(item.icon, item.iconKind, 18, isActive)}
                                <span className="flex-1 truncate">{item.label}</span>
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span
                                        className="ml-auto text-[11px] font-bold min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-white shrink-0"
                                        style={{ background: item.badgeColor ?? '#334155' }}
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
                    const badgeBg = group.items.find(i => (i.badge ?? 0) > 0)?.badgeColor ?? '#334155';

                    return (
                        <div key={group.id} className="flex flex-col">
                            <button
                                type="button"
                                onClick={() => toggleGroup(group.id)}
                                className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors w-full text-left ${
                                    groupActive || isOpen
                                        ? 'bg-[#242D37] text-white'
                                        : 'text-[#9BA7B4] hover:bg-white/60 dark:hover:bg-white/10'
                                }`}
                            >
                                <span className="flex items-center gap-3 min-w-0">
                                    <svg className="shrink-0" width="18" height="18" viewBox="0 0 24 24" fill={groupActive || isOpen ? accentColor : '#9BA7B4'}>
                                        <path d={group.icon} />
                                    </svg>
                                    <span className="truncate">{group.label}</span>
                                </span>
                                <span className="flex items-center gap-1.5 shrink-0">
                                    {!isOpen && totalBadge > 0 && (
                                        <span
                                            className="text-[10px] font-bold min-w-[1.125rem] min-h-[1.125rem] px-1 flex items-center justify-center rounded-full text-white"
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
                                                        ? 'nav-item-active text-white shadow-sm'
                                                        : 'text-[#9BA7B4] hover:bg-white/70 hover:text-white dark:hover:bg-white/10'
                                                }`}
                                            >
                                                {renderIcon(sub.icon, sub.iconKind, 16, isSubActive)}
                                                <span className="flex-1 truncate">{sub.label}</span>
                                                {sub.badge !== undefined && sub.badge > 0 && (
                                                    <span
                                                        className="ml-auto text-[10px] font-bold min-w-[1.125rem] min-h-[1.125rem] px-1 flex items-center justify-center rounded-full text-white shrink-0"
                                                        style={{ background: sub.badgeColor ?? '#334155' }}
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
                                            {renderIcon(item.icon, item.iconKind, 20, isActive)}
                                            {item.badge !== undefined && item.badge > 0 && (
                                                <span
                                                    className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-white font-bold sidebar-badge-collapsed ring-2 ring-[#181F26]"
                                                    style={{ background: item.badgeColor ?? '#334155' }}
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
                        ? 'nav-item-active text-white shadow-sm'
                        : 'text-gray-500 hover:bg-white/60 dark:hover:bg-white/10'
                    }`}
            >
                <span className="flex items-center gap-2.5">
                    <svg className={`shrink-0 ${collapsed ? 'md:w-5 md:h-5' : ''}`} width="18" height="18" viewBox="0 0 24 24" fill={isAnyActive || (open && !collapsed) ? '#FFFFFF' : '#94A3B8'}>
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
                                ? 'bg-[#242D37] text-white shadow-sm'
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
                                    ? 'bg-[#242D37] text-white shadow-sm'
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
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { fontSize, setFontSize } = useFontSize();

    // Change Password state
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [visiblePw, setVisiblePw] = useState<{ current: boolean; next: boolean; confirm: boolean }>({
        current: false,
        next: false,
        confirm: false,
    });
    const [pwSuccess, setPwSuccess] = useState(false);
    const [pwError, setPwError] = useState('');

    // Report state
    const [reportCategory, setReportCategory] = useState<'Bug / Error' | 'Feature Request' | 'Incorrect Data' | 'Other'>('Bug / Error');
    const [reportText, setReportText] = useState('');
    const [reportError, setReportError] = useState('');
    const [reportSent, setReportSent] = useState(false);
    const [showReportConfirm, setShowReportConfirm] = useState(false);

    // Login security state
    const [devices, setDevices] = useState(MOCK_DEVICES);
    const [confirmDeviceLogout, setConfirmDeviceLogout] = useState<
        | { mode: 'single'; id: string; name: string; location: string }
        | { mode: 'all'; count: number }
        | null
    >(null);
    const [sessionNotice, setSessionNotice] = useState<string | null>(null);
    const [showEmailConfirm, setShowEmailConfirm] = useState(false);

    const isDark = theme === 'dark';
    const fontPct = ((fontSize - FONT_SIZE_MIN) / (FONT_SIZE_MAX - FONT_SIZE_MIN)) * 100;
    const activeFontPreset = FONT_SIZE_PRESETS.find((p) => p.size === fontSize);
    const meta = MY_SETTINGS_ITEMS.find(i => i.key === section) ?? MY_SETTINGS_ITEMS[0];

    function handleChangePassword(e: React.FormEvent) {
        e.preventDefault();
        setPwError('');
        if (!currentPw) { setPwError('Enter your current password.'); return; }
        if (newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
        if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
        setPwSuccess(true);
        setCurrentPw(''); setNewPw(''); setConfirmPw('');
        setVisiblePw({ current: false, next: false, confirm: false });
    }

    function handleReport(e: React.FormEvent) {
        e.preventDefault();
        if (reportText.trim().length < 10) {
            setReportError('Please describe the problem in detail (at least 10 characters).');
            return;
        }
        setReportError('');
        setShowReportConfirm(true);
    }

    function confirmReportSubmit() {
        setShowReportConfirm(false);
        setReportSent(true);
        setReportText('');
        setReportError('');
    }

    function logOutDevice(id: string, name?: string) {
        setDevices(prev => prev.filter(d => d.id !== id));
        setSessionNotice(name ? `Signed out ${name}.` : 'Device session signed out.');
    }

    function logOutAll() {
        setDevices(prev => prev.filter(d => d.current));
        setSessionNotice('Signed out all other recognized device sessions.');
    }

    function renderSectionHeader(_badge: string, title: string, description: string) {
        return (
            <div className="mb-6">
                <h2 className="text-[1.25rem] sm:text-[1.375rem] font-bold tracking-[-0.015em] text-[#0F4C45] dark:text-slate-100 leading-snug mb-[0.375rem]">{title}</h2>
                <p className="text-[0.9375rem] text-[#6B665F] dark:text-slate-400 leading-[1.5] max-w-[65ch]">{description}</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-[1.75rem] font-extrabold tracking-[0.02em] uppercase text-gray-900 leading-tight mb-[0.375rem]">{meta.label}</h1>
                <p className="text-[0.9375rem] text-gray-400 leading-[1.5]">{meta.sub}</p>
            </div>

            {/* Full-Width Elevated Main Card */}
            <div
                className="w-full bg-white dark:bg-[#1E293B] rounded-[20px] border border-[#E2E8F0] dark:border-[#334155] p-8"
                style={{ boxShadow: '0 10px 28px -6px rgba(15, 76, 69, 0.07), 0 4px 12px -2px rgba(15, 23, 42, 0.04)' }}
            >

                {/* ── 0. My Profile / Account View ── */}
                {section === 'profile' && user && (
                    <div className="w-full">
                        {renderSectionHeader(
                            'ACCOUNT PROFILE',
                            'Worker Account & Identity',
                            'Your official Connect2Souls worker credentials, ministry assignment, and ID issuance record.'
                        )}

                        <div
                            data-settings-card="true"
                            className="mt-6 rounded-2xl border border-[#E2E8E5] dark:border-[#2A323D] bg-[#F8FAFC] dark:bg-[#222933] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-14 h-14 rounded-full bg-[#181F26] dark:bg-[#0E5B52] text-white flex items-center justify-center text-[1.0625rem] font-black shrink-0">
                                    {user.avatar}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-[1.125rem] font-extrabold text-[#181F26] dark:text-[#E6EDF3] leading-tight truncate">
                                            {user.name}
                                        </h3>
                                        <span
                                            data-pill="true"
                                            className="inline-flex items-center text-[0.75rem] font-semibold px-2.5 py-0.5 rounded-full bg-[rgba(14,91,82,0.10)] text-[#0E5B52] dark:bg-[rgba(42,157,143,0.18)] dark:text-[#2DD4BF] whitespace-nowrap"
                                        >
                                            {ROLE_DISPLAY_LABEL[user.role] ?? user.role}
                                        </span>
                                    </div>
                                    <p className="text-[0.8125rem] text-[#64748B] dark:text-[#9BA7B4] mt-1 truncate">
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                            <span
                                data-pill="true"
                                className="inline-flex items-center gap-1.5 text-[0.75rem] font-bold px-3 py-1 rounded-full bg-[#16a34a] text-white shrink-0"
                            >
                                Active
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                            <div
                                data-settings-card="true"
                                className="rounded-xl border border-[#E2E8E5] dark:border-[#2A323D] bg-white dark:bg-[#1A2026] px-4 py-3.5"
                            >
                                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#9BA7B4] mb-1">
                                    Worker ID
                                </p>
                                <p className="text-[1.0625rem] font-extrabold text-[#181F26] dark:text-[#E6EDF3] tabular-nums">
                                    {user.workerId ?? '—'}
                                </p>
                            </div>
                            <div
                                data-settings-card="true"
                                className="rounded-xl border border-[#E2E8E5] dark:border-[#2A323D] bg-white dark:bg-[#1A2026] px-4 py-3.5"
                            >
                                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#9BA7B4] mb-1">
                                    Worker Since (ID Issued)
                                </p>
                                <WorkerSinceValue createdAt={user.workerIdCreatedAt} className="text-[1rem]" />
                            </div>
                            {[
                                { label: 'Department', value: user.department ?? 'Outreach' },
                                { label: user.group ? 'Assigned Group' : 'Cluster / Scope', value: user.group ?? user.cluster ?? 'Church-wide' },
                                { label: 'Account Role', value: ROLE_DISPLAY_LABEL[user.role] ?? user.role },
                                { label: 'Email Address', value: user.email },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    data-settings-card="true"
                                    className="rounded-xl border border-[#E2E8E5] dark:border-[#2A323D] bg-[#F8FAFC] dark:bg-[#222933] px-4 py-3.5"
                                >
                                    <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#9BA7B4] mb-1">
                                        {item.label}
                                    </p>
                                    <p className="text-[0.875rem] font-semibold text-[#181F26] dark:text-[#E6EDF3] truncate">
                                        {item.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── 1. Display & Font Size ── */}
                {section === 'display' && (
                    <div className="w-full">
                        {renderSectionHeader(
                            'APPEARANCE',
                            'Workspace Theme Mode',
                            'Choose the surface palette that keeps ministry work comfortable day and night.'
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                            {[
                                {
                                    key: 'light',
                                    selected: !isDark,
                                    title: 'Light Surface',
                                    sub: 'Crisp bright cards paired with deep pine contrast.',
                                    onClick: () => { if (isDark) toggleTheme(); },
                                    previewBg: 'bg-[#FAF8F5] border-[#E2E8F0]',
                                    previewTop: 'bg-white border-b border-[#E2E8F0]',
                                    previewDot: 'bg-[#0D9488]',
                                    previewBarA: 'bg-[#0F4C45]/20',
                                    previewBarB: 'bg-[#0D9488]/25',
                                    icon: (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="4" />
                                            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                                        </svg>
                                    ),
                                },
                                {
                                    key: 'dark',
                                    selected: isDark,
                                    title: 'Dark Surface',
                                    sub: 'Deep slate panels with calm emerald highlights.',
                                    onClick: () => { if (!isDark) toggleTheme(); },
                                    previewBg: 'bg-[#0F172A] border-[#334155]',
                                    previewTop: 'bg-[#1E293B] border-b border-[#334155]',
                                    previewDot: 'bg-[#2DD4BF]',
                                    previewBarA: 'bg-slate-600',
                                    previewBarB: 'bg-[#0D9488]/60',
                                    icon: (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                        </svg>
                                    ),
                                },
                            ].map((opt) => (
                                <button
                                    key={opt.key}
                                    type="button"
                                    onClick={opt.onClick}
                                    className={`relative text-left rounded-2xl p-5 transition-all flex flex-col gap-4 cursor-pointer ${
                                        opt.selected
                                            ? 'border-2 border-[#0D9488] ring-4 ring-[#0D9488]/15 bg-[#F0FDFA]/50 dark:bg-[#14B8A6]/10'
                                            : 'border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A]/40 hover:border-[#0D9488]/50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center shrink-0">
                                                {opt.icon}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-[#0F4C45] dark:text-slate-100">{opt.title}</p>
                                                <p className="text-xs text-[#6B665F] dark:text-slate-400 mt-0.5">{opt.sub}</p>
                                            </div>
                                        </div>
                                        <span
                                            data-pill="true"
                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                                                opt.selected
                                                    ? 'bg-[#0D9488] text-white'
                                                    : 'border border-[#CBD5E1] dark:border-[#475569] text-transparent'
                                            }`}
                                        >
                                            ✓
                                        </span>
                                    </div>

                                    {/* Mini UI Wireframe Preview */}
                                    <div className={`rounded-xl border overflow-hidden ${opt.previewBg}`}>
                                        <div className={`px-3 py-2 flex items-center gap-1.5 ${opt.previewTop}`}>
                                            <span className={`w-2 h-2 rounded-full ${opt.previewDot}`} />
                                            <span className={`h-2 w-16 rounded-full ${opt.previewBarA}`} />
                                        </div>
                                        <div className="p-3 space-y-2">
                                            <div className={`h-2.5 w-3/4 rounded-full ${opt.previewBarB}`} />
                                            <div className={`h-2 w-1/2 rounded-full ${opt.previewBarA}`} />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <hr className="my-8 border-[#E2E8F0] dark:border-[#334155]" />

                        {renderSectionHeader(
                            'TYPOGRAPHY',
                            'Text & Font Size Scaling',
                            'Scale all typography, cards, buttons, icons, and spacing proportionally across the entire system.'
                        )}

                        <div
                            data-settings-card="true"
                            className="mt-6 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] p-5 sm:p-6 space-y-6"
                        >
                            {/* Top Control Row: T mint-teal badge + Active Status Pill */}
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#2DD4BF] border border-[#99F6E4]/80 dark:border-[#14B8A6]/30 flex items-center justify-center font-black text-lg shrink-0">
                                        T
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-[#0F4C45] dark:text-slate-100">Interface Scale</p>
                                        <p className="text-xs text-[#6B665F] dark:text-slate-400">
                                            Root scale: {fontSize}px ({Math.round((fontSize / 16) * 100)}%)
                                        </p>
                                    </div>
                                </div>
                                <span
                                    data-pill="true"
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F0FDFA] text-[#0F766E] border border-[#99F6E4] dark:bg-[#14B8A6]/15 dark:text-[#2DD4BF] dark:border-[#14B8A6]/30 shrink-0 whitespace-nowrap"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] dark:bg-[#2DD4BF]" />
                                    {activeFontPreset ? activeFontPreset.label : `Custom (${fontSize}px)`}
                                </span>
                            </div>

                            {/* Range Slider: SMALLER to LARGER */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B665F] dark:text-slate-400">
                                        Smaller · 14px
                                    </span>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B665F] dark:text-slate-400">
                                        Larger · 20px
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={FONT_SIZE_MIN}
                                    max={FONT_SIZE_MAX}
                                    step={1}
                                    value={fontSize}
                                    onChange={e => setFontSize(Number(e.target.value))}
                                    aria-label="Adjust interface font size"
                                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#0E5B52]"
                                    style={{
                                        background: `linear-gradient(to right, ${isDark ? '#2DD4BF' : '#0D9488'} ${fontPct}%, ${isDark ? '#334155' : '#CBD5E1'} ${fontPct}%)`,
                                    }}
                                />
                            </div>

                            {/* 4 Full-Width Quick Preset Buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {FONT_SIZE_PRESETS.map((preset) => {
                                    const active = fontSize === preset.size;
                                    return (
                                        <button
                                            key={preset.key}
                                            type="button"
                                            onClick={() => setFontSize(preset.size)}
                                            className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-left transition-all cursor-pointer ${
                                                active
                                                    ? 'bg-[#0F4C45] dark:bg-[#0D9488] text-white border-2 border-[#0D9488] shadow-sm'
                                                    : 'bg-white dark:bg-[#1E293B] text-[#0F4C45] dark:text-slate-200 border border-[#E2E8F0] dark:border-[#334155] hover:border-[#0D9488]'
                                            }`}
                                        >
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold leading-tight">{preset.label}</p>
                                                <p className={`text-[11px] mt-0.5 ${active ? 'text-white/80' : 'text-[#6B665F] dark:text-slate-400'}`}>
                                                    {preset.size}px
                                                </p>
                                            </div>
                                            <span
                                                data-pill="true"
                                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                                                    active
                                                        ? 'bg-[#0D9488] dark:bg-[#0F4C45] text-white'
                                                        : 'border border-[#CBD5E1] dark:border-[#475569] text-transparent'
                                                }`}
                                            >
                                                ✓
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── 2. Change Password ── */}
                {section === 'change-password' && (
                    <div className="w-full">
                        {renderSectionHeader(
                            'CREDENTIALS',
                            'Update Account Password',
                            'Protect your Connect2Souls account with a strong password containing at least 8 characters.'
                        )}

                        {pwSuccess ? (
                            <div
                                data-settings-card="true"
                                className="mt-6 flex flex-col items-center gap-3 py-10 px-6 rounded-2xl border border-[#99F6E4] dark:border-[#14B8A6]/30 bg-[#F0FDFA] dark:bg-[#14B8A6]/10"
                            >
                                <div className="w-12 h-12 rounded-full bg-[#0D9488] text-white flex items-center justify-center">
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                </div>
                                <p className="font-bold text-[#0F4C45] dark:text-slate-100">Password updated!</p>
                                <p className="text-xs text-[#6B665F] dark:text-slate-400 text-center">Your password has been changed successfully.</p>
                                <button type="button" onClick={() => setPwSuccess(false)} className="mt-1 text-xs font-bold text-[#0D9488] hover:underline">
                                    Change again
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleChangePassword} className="w-full mt-6">
                                <div className="space-y-5">
                                    {([
                                        { key: 'current' as const, label: 'Current Password', value: currentPw, set: setCurrentPw },
                                    ]).map(({ key, label, value, set }) => {
                                        const shown = visiblePw[key];
                                        return (
                                            <div key={key} className="w-full">
                                                <label className="block text-xs font-semibold text-[#0F4C45] dark:text-slate-200 mb-1.5">{label}</label>
                                                <div className="relative">
                                                    <input
                                                        type={shown ? 'text' : 'password'}
                                                        value={value}
                                                        onChange={e => set(e.target.value)}
                                                        placeholder="••••••••"
                                                        className="w-full bg-transparent border border-[#E2E8F0] dark:border-[#334155] rounded-xl pl-4 pr-11 py-2.5 text-sm text-[#0F4C45] dark:text-slate-100 focus:outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20 transition-colors"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setVisiblePw(prev => ({ ...prev, [key]: !prev[key] }))}
                                                        aria-label={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#0F4C45] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 absolute right-1.5 top-1/2 -translate-y-1/2 transition-colors"
                                                    >
                                                        {shown ? (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {([
                                            { key: 'next' as const, label: 'New Password', value: newPw, set: setNewPw },
                                            { key: 'confirm' as const, label: 'Confirm Password', value: confirmPw, set: setConfirmPw },
                                        ]).map(({ key, label, value, set }) => {
                                            const shown = visiblePw[key];
                                            return (
                                                <div key={key} className="w-full">
                                                    <label className="block text-xs font-semibold text-[#0F4C45] dark:text-slate-200 mb-1.5">{label}</label>
                                                    <div className="relative">
                                                        <input
                                                            type={shown ? 'text' : 'password'}
                                                            value={value}
                                                            onChange={e => set(e.target.value)}
                                                            placeholder="••••••••"
                                                            className="w-full bg-transparent border border-[#E2E8F0] dark:border-[#334155] rounded-xl pl-4 pr-11 py-2.5 text-sm text-[#0F4C45] dark:text-slate-100 focus:outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20 transition-colors"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setVisiblePw(prev => ({ ...prev, [key]: !prev[key] }))}
                                                            aria-label={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#0F4C45] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 absolute right-1.5 top-1/2 -translate-y-1/2 transition-colors"
                                                        >
                                                            {shown ? (
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {pwError && <p className="text-xs font-semibold text-red-500">{pwError}</p>}
                                </div>

                                <hr className="my-8 border-[#E2E8F0] dark:border-[#334155]" />

                                <div className="flex justify-end">
                                    <button type="submit" className="bg-[#0E5B52] hover:bg-[#0A463F] dark:bg-[#0E5B52] dark:hover:bg-[#147468] text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors shadow-sm cursor-pointer">
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* ── 3. Login Security ── */}
                {section === 'login-security' && (
                    <div className="w-full">
                        {renderSectionHeader(
                            'ACTIVE SESSION',
                            'Current Browser Session',
                            'This device is currently authenticated for your Connect2Souls ministry session.'
                        )}

                        <div className="mt-6 space-y-3">
                            {devices.filter(d => d.current).map(d => (
                                <div
                                    key={d.id}
                                    data-settings-card="true"
                                    className="rounded-2xl border-2 border-[#0D9488] ring-4 ring-[#0D9488]/15 bg-[#F0FDFA]/50 dark:bg-[#14B8A6]/10 p-5 flex flex-wrap items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] dark:bg-[#14B8A6]/20 text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center shrink-0">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-[#0F4C45] dark:text-slate-100 truncate">{d.name}</p>
                                            <p className="text-xs text-[#6B665F] dark:text-slate-400 mt-0.5">{d.location} · {d.time}</p>
                                        </div>
                                    </div>
                                    <span
                                        data-pill="true"
                                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#0D9488] text-white shrink-0"
                                    >
                                        ✓ This Device
                                    </span>
                                </div>
                            ))}
                        </div>

                        <hr className="my-8 border-[#E2E8F0] dark:border-[#334155]" />

                        <div className="flex flex-wrap items-end justify-between gap-4">
                            {renderSectionHeader(
                                'SIGNED-IN DEVICES',
                                'Other Recognized Sessions',
                                'Review or sign out sessions you no longer recognize.'
                            )}
                            {devices.some(d => !d.current) && (
                                <button
                                    type="button"
                                    onClick={() => setConfirmDeviceLogout({ mode: 'all', count: devices.filter(d => !d.current).length })}
                                    className="px-4 py-2 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors shrink-0"
                                >
                                    Log Out All Devices
                                </button>
                            )}
                        </div>

                        {sessionNotice && (
                            <div
                                role="status"
                                className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#0E5B52]/20 bg-[#0E5B52]/10 dark:bg-[#2A9D8F]/15 dark:border-[#2A9D8F]/30 px-4 py-2.5 text-xs font-semibold text-[#0E5B52] dark:text-[#5EEAD4]"
                            >
                                <span>{sessionNotice}</span>
                                <button
                                    type="button"
                                    onClick={() => setSessionNotice(null)}
                                    className="opacity-70 hover:opacity-100 px-1"
                                    aria-label="Dismiss notification"
                                >
                                    ×
                                </button>
                            </div>
                        )}

                        {devices.some(d => !d.current) ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                                {devices.filter(d => !d.current).map(d => (
                                    <div
                                        key={d.id}
                                        data-settings-card="true"
                                        className="rounded-2xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] p-5 flex items-center justify-between gap-3"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center shrink-0">
                                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z" />
                                                </svg>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-[#0F4C45] dark:text-slate-100 truncate">{d.name}</p>
                                                <p className="text-xs text-[#6B665F] dark:text-slate-400 mt-0.5">{d.location} · {d.time}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setConfirmDeviceLogout({ mode: 'single', id: d.id, name: d.name, location: d.location })}
                                            className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors shrink-0"
                                        >
                                            Log out
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-6 text-sm text-[#6B665F] text-center py-8 border border-[#E2E8F0] dark:border-[#334155] rounded-2xl">
                                No other active sessions.
                            </p>
                        )}

                        <ConfirmModal
                            open={Boolean(confirmDeviceLogout)}
                            variant="danger"
                            icon="warning"
                            title={confirmDeviceLogout?.mode === 'all' ? 'Log Out All Other Devices?' : 'Log Out Device?'}
                            description={
                                confirmDeviceLogout?.mode === 'all' ? (
                                    <>
                                        Sign out all <strong className="font-semibold text-[#181F26] dark:text-[#E6EDF3]">{confirmDeviceLogout.count}</strong> other recognized sessions? Only your current browser session will remain active.
                                    </>
                                ) : confirmDeviceLogout ? (
                                    <>
                                        Sign out <strong className="font-semibold text-[#181F26] dark:text-[#E6EDF3]">{confirmDeviceLogout.name}</strong> ({confirmDeviceLogout.location})? You will need to log in again on that device.
                                    </>
                                ) : ''
                            }
                            cancelLabel="Cancel"
                            confirmLabel={confirmDeviceLogout?.mode === 'all' ? 'Yes, Log Out All' : 'Yes, Log Out'}
                            onCancel={() => setConfirmDeviceLogout(null)}
                            onConfirm={() => {
                                if (!confirmDeviceLogout) return;
                                if (confirmDeviceLogout.mode === 'all') {
                                    logOutAll();
                                } else {
                                    logOutDevice(confirmDeviceLogout.id, confirmDeviceLogout.name);
                                }
                                setConfirmDeviceLogout(null);
                            }}
                        />
                    </div>
                )}

                {/* ── 4. Help & Support ── */}
                {section === 'help' && (
                    <div className="w-full">
                        {renderSectionHeader(
                            'DOCUMENTATION',
                            'Ministry Guides & Quick Help',
                            'Browse Connect2Souls guides for mentoring workflows, groups, and pastoral oversight.'
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                            {[
                                { title: 'Getting Started', desc: 'Learn how to navigate and use Connect2Souls.' },
                                { title: 'Managing Your Mentees', desc: 'How to accept, track, and disciple mentees.' },
                                { title: 'C2S Groups', desc: 'Creating and managing Community & Church-based groups.' },
                                { title: 'Contact Support', desc: 'Reach our ministry support desk for assistance.' },
                            ].map(item => (
                                <div
                                    key={item.title}
                                    data-settings-card="true"
                                    className="rounded-2xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] p-5 flex flex-col gap-3"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#2DD4BF] flex items-center justify-center shrink-0">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-[#0F4C45] dark:text-slate-100">{item.title}</p>
                                            <p className="text-xs text-[#6B665F] dark:text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-24 rounded-full bg-[#0D9488]/25" />
                                </div>
                            ))}
                        </div>

                        <hr className="my-8 border-[#E2E8F0] dark:border-[#334155]" />

                        {renderSectionHeader(
                            'SUPPORT CHANNEL',
                            'Need Direct Assistance?',
                            'Reach the Church of God Dasmariñas C2S technical team directly via email.'
                        )}

                        <div
                            data-settings-card="true"
                            className="mt-6 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] p-5 flex flex-wrap items-center justify-between gap-4"
                        >
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setShowEmailConfirm(true)}
                                    className="p-0 bg-transparent border-0 text-sm font-bold text-[#0F4C45] dark:text-slate-100 hover:text-[#0E5B52] hover:underline transition-colors cursor-pointer text-left"
                                >
                                    support@c2s.church
                                </button>
                                <p className="text-xs text-[#6B665F] dark:text-slate-400 mt-0.5">Available Monday – Saturday · 8:00 AM – 6:00 PM</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowEmailConfirm(true)}
                                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#0E5B52] hover:bg-[#0B4A42] text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                            >
                                Email Support Desk
                            </button>
                        </div>

                        <ConfirmModal
                            open={showEmailConfirm}
                            variant="default"
                            icon="mail"
                            title="Open Email Client?"
                            description={
                                <>
                                    This will launch your default email application addressed to{' '}
                                    <strong className="font-semibold text-[#181F26] dark:text-[#E6EDF3]">support@c2s.church</strong>.
                                </>
                            }
                            cancelLabel="Cancel"
                            confirmLabel="Open Email"
                            confirmHref="mailto:support@c2s.church?subject=Connect2Souls%20Support%20Request"
                            onCancel={() => setShowEmailConfirm(false)}
                            onConfirm={() => setShowEmailConfirm(false)}
                        />
                    </div>
                )}

                {/* ── 5. Report a Problem ── */}
                {section === 'report' && (
                    <div className="w-full">
                        {reportSent ? (
                            <div
                                data-settings-card="true"
                                className="flex flex-col items-center gap-3 py-10 px-6 rounded-2xl border border-[#99F6E4] dark:border-[#14B8A6]/30 bg-[#F0FDFA] dark:bg-[#14B8A6]/10"
                            >
                                <div className="w-12 h-12 rounded-full bg-[#0D9488] text-white flex items-center justify-center">
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                </div>
                                <p className="font-bold text-[#0F4C45] dark:text-slate-100">Report submitted!</p>
                                <p className="text-xs text-[#6B665F] dark:text-slate-400 text-center">Thank you. We&apos;ll look into this as soon as possible.</p>
                                <button type="button" onClick={() => setReportSent(false)} className="mt-1 text-xs font-bold text-[#0D9488] hover:underline">
                                    Submit another
                                </button>
                            </div>
                        ) : (
                            <form data-no-confirm onSubmit={handleReport} className="w-full">
                                <ConfirmModal
                                    open={showReportConfirm}
                                    variant="default"
                                    icon="check"
                                    title="Submit Report?"
                                    description={
                                        <>
                                            Send your <strong className="font-semibold text-[#181F26] dark:text-[#E6EDF3]">{reportCategory}</strong> report to the Connect2Souls support team?
                                        </>
                                    }
                                    cancelLabel="Cancel"
                                    confirmLabel="Yes, Submit"
                                    onCancel={() => setShowReportConfirm(false)}
                                    onConfirm={confirmReportSubmit}
                                />
                                {renderSectionHeader(
                                    'CATEGORY',
                                    'Select Report Category',
                                    'Choose the option that best matches the issue or feedback you are sending.'
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                                    {([
                                        { value: 'Bug / Error' as const, desc: 'Something failed to load, save, or respond properly.' },
                                        { value: 'Feature Request' as const, desc: 'Suggest an improvement for ministry workflows.' },
                                        { value: 'Incorrect Data' as const, desc: 'Group, barangay, or member record needs correction.' },
                                        { value: 'Other' as const, desc: 'General feedback or account inquiry for support.' },
                                    ]).map((cat) => {
                                        const selected = reportCategory === cat.value;
                                        return (
                                            <button
                                                key={cat.value}
                                                type="button"
                                                onClick={() => setReportCategory(cat.value)}
                                                className={`relative text-left rounded-2xl p-5 transition-all flex items-start justify-between gap-3 cursor-pointer ${
                                                    selected
                                                        ? 'border-2 border-[#0E5B52] ring-4 ring-[#0E5B52]/15 bg-[#F0FDFA]/50 dark:bg-[#14B8A6]/10'
                                                        : 'border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A]/40 hover:border-[#0E5B52]/50'
                                                }`}
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-[#181F26] dark:text-slate-100">{cat.value}</p>
                                                    <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">{cat.desc}</p>
                                                </div>
                                                <span
                                                    data-pill="true"
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                                        selected
                                                            ? 'bg-[#0E5B52] text-white'
                                                            : 'border border-[#CBD5E1] dark:border-[#475569] text-transparent'
                                                    }`}
                                                >
                                                    ✓
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <hr className="my-8 border-[#E2E8F0] dark:border-[#334155]" />

                                {renderSectionHeader(
                                    'DETAILS',
                                    'Describe the Problem',
                                    'Share clear steps or details so our team can resolve the issue quickly.'
                                )}

                                <div className="mt-6">
                                    <label className="block text-xs font-semibold text-[#181F26] dark:text-slate-200 mb-1.5">Description</label>
                                    <textarea
                                        rows={4}
                                        value={reportText}
                                        onChange={e => {
                                            setReportText(e.target.value);
                                            if (reportError && e.target.value.trim().length >= 10) setReportError('');
                                        }}
                                        placeholder="Describe the problem in detail…"
                                        className={`w-full bg-transparent border rounded-xl px-4 py-3 text-sm text-[#181F26] dark:text-slate-100 focus:outline-none focus:ring-2 resize-none transition-colors ${reportError ? 'border-red-400 focus:border-red-500 focus:ring-red-300/30' : 'border-[#E2E8F0] dark:border-[#334155] focus:border-[#0E5B52] focus:ring-[#0E5B52]/20'}`}
                                    />
                                    {reportError && <p className="text-xs font-semibold text-red-500 mt-1.5">{reportError}</p>}
                                </div>

                                <hr className="my-8 border-[#E2E8F0] dark:border-[#334155]" />

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        className="bg-[#0E5B52] hover:bg-[#0A463F] dark:bg-[#0E5B52] dark:hover:bg-[#147468] text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors shadow-sm cursor-pointer"
                                    >
                                        Submit Report
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
