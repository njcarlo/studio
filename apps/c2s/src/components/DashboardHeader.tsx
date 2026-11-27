'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';

const HEADER_ROLE_LABELS: Record<string, string> = {
    admin: 'C2S Admin',
    ministry_head: 'Ministry Head',
    cluster_head: 'Cluster Head',
    c2s_coordinator: 'C2S Coordinator',
    mentor: 'Mentor',
};

export function SidebarBrandHeader({ collapsed }: { collapsed: boolean }) {
    return (
        <div
            style={{
                height: '64px',
                minHeight: '64px',
                paddingLeft: collapsed ? undefined : '12px',
                paddingRight: collapsed ? undefined : '12px',
            }}
            className={`sidebar-brand-header border-b flex items-center shrink-0 transition-all duration-200 cursor-default pointer-events-none select-none ${
                collapsed ? 'px-3 md:px-0 md:justify-center' : ''
            }`}
        >
            <div
                style={{ gap: collapsed ? undefined : '10px' }}
                className={`flex items-center min-w-0 cursor-default pointer-events-none ${collapsed ? 'gap-[10px] md:gap-0 md:justify-center' : ''}`}
            >
                <div
                    data-logo-badge="true"
                    style={{
                        backgroundColor: '#FFFFFF',
                        width: collapsed ? '44px' : '48px',
                        height: collapsed ? '44px' : '48px',
                        minWidth: collapsed ? '44px' : '48px',
                        minHeight: collapsed ? '44px' : '48px',
                        padding: '4px',
                    }}
                    className="sidebar-logo-badge !bg-white rounded-full shadow-sm flex items-center justify-center shrink-0 relative transition-all duration-200"
                >
                    <Image src="/c2s.png" alt="Connect2Souls Logo" width={48} height={48} className="w-full h-full object-contain" priority />
                </div>
                <div
                    style={{ gap: '2px' }}
                    className={`flex flex-col leading-tight min-w-0 ${collapsed ? 'md:hidden' : ''}`}
                >
                    <p
                        className="sidebar-brand-title font-extrabold whitespace-nowrap"
                        style={{
                            fontSize: '18px',
                            lineHeight: '22px',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        Connect2Souls
                    </p>
                    <p
                        className="sidebar-brand-sub font-medium whitespace-nowrap"
                        style={{
                            fontSize: '14px',
                            lineHeight: '18px',
                            letterSpacing: '-0.015em',
                        }}
                    >
                        Church of God Dasmariñas
                    </p>
                </div>
            </div>
        </div>
    );
}

export function DashboardTopHeader({
    pageTitle,
    onOpenMenu,
    onOpenProfile,
    onLogout,
}: {
    pageTitle?: string;
    onOpenMenu?: () => void;
    onOpenProfile?: () => void;
    onLogout?: () => void;
}) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    if (!user) return null;

    const roleColor = '#181F26';

    function handleLogoutClick() {
        setDropdownOpen(false);
        if (onLogout) {
            onLogout();
        } else {
            logout();
            router.push('/login');
        }
    }

    return (
        <header className="dashboard-top-header sticky top-0 z-30 nav-fixed-h flex items-center justify-between gap-3 px-4 sm:px-6 transition-colors">
            {/* Left: Mobile hamburger + active page label */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                {onOpenMenu && (
                    <button
                        type="button"
                        onClick={onOpenMenu}
                        aria-label="Open menu"
                        className="md:hidden w-9 h-9 inline-flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                        </svg>
                    </button>
                )}
                {pageTitle && (
                    <span className="md:hidden text-xs font-semibold text-gray-500 dark:text-slate-400 truncate">
                        {pageTitle}
                    </span>
                )}
            </div>

            {/* Right: Account dropdown pill (proportional rem sizing) */}
            <div className="relative shrink-0" style={{ fontSize: '1rem' }}>
                <button
                    type="button"
                    data-account-pill="true"
                    aria-haspopup="menu"
                    aria-expanded={dropdownOpen}
                    onClick={() => setDropdownOpen((o) => !o)}
                    style={{ padding: '0.25rem 0.625rem 0.25rem 0.3125rem', gap: '0.5rem' }}
                    className={`flex items-center rounded-full border transition-all duration-150 cursor-pointer ${dropdownOpen
                        ? 'bg-[rgba(14,91,82,0.06)] dark:bg-[rgba(45,212,191,0.12)] border-[#0E5B52]/40 dark:border-[#2DD4BF]/40 shadow-[0_0_0_3px_rgba(14,91,82,0.12)] dark:shadow-[0_0_0_3px_rgba(45,212,191,0.16)]'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border-[#E2E8E5] dark:border-[#2A323D]'
                        }`}
                >
                    <div
                        className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
                        style={{
                            width: '1.75rem',
                            height: '1.75rem',
                            fontSize: '0.6875rem',
                            background: roleColor,
                            boxShadow: `0 0 0 2px ${roleColor}26`,
                        }}
                    >
                        {user.avatar}
                    </div>
                    <span
                        className="hidden sm:inline font-semibold text-[#181F26] dark:text-[#E6EDF3] truncate max-w-[11.25rem] lg:max-w-[16.25rem]"
                        style={{ fontSize: '0.875rem', lineHeight: '1.25' }}
                    >
                        {user.name}
                    </span>
                    <svg
                        className={`text-[#64748B] dark:text-[#9BA7B4] shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-[#0E5B52] dark:text-[#2DD4BF]' : ''}`}
                        style={{ width: '0.875rem', height: '0.875rem' }}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </button>

                {dropdownOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                        <div
                            role="menu"
                            aria-label="Account menu"
                            className="c2s-action-popover absolute right-0 top-full mt-2 bg-white dark:bg-[#1A2026] rounded-xl border border-[#E2E8E5] dark:border-[#2A323D] overflow-hidden z-50"
                            style={{
                                width: '17.25rem',
                                maxWidth: 'calc(100vw - 2rem)',
                                borderRadius: '0.875rem',
                                boxShadow: '0 14px 32px -6px rgba(15, 23, 42, 0.14), 0 4px 12px -2px rgba(15, 23, 42, 0.06)',
                                transformOrigin: 'top right',
                            }}
                        >
                            {/* Top Identity Block with Subtle Ambient Pine Teal Surface */}
                            <div
                                className="p-3.5 border-b border-[#E2E8E5] dark:border-[#2A323D] bg-gradient-to-br from-[#0E5B52]/[0.06] via-[#F8FAFC] to-white dark:from-[#0E5B52]/[0.20] dark:via-[#222933] dark:to-[#1A2026]"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-xs shrink-0 ring-2 ring-white dark:ring-[#2A323D] shadow-sm"
                                        style={{ background: roleColor }}
                                    >
                                        {user.avatar}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[0.875rem] font-bold text-[#181F26] dark:text-[#E6EDF3] truncate leading-tight">
                                            {user.name}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                            <span
                                                data-pill="true"
                                                className="inline-flex items-center text-[0.6875rem] font-semibold px-2 py-0.5 rounded-full bg-[rgba(14,91,82,0.10)] text-[#0E5B52] dark:bg-[rgba(45,212,191,0.14)] dark:text-[#2DD4BF] leading-tight whitespace-nowrap"
                                            >
                                                {HEADER_ROLE_LABELS[user.role] ?? user.role}
                                            </span>
                                            <span
                                                data-pill="true"
                                                className="inline-flex items-center text-[0.6875rem] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-[#1A2026] text-[#181F26] dark:text-[#E6EDF3] border border-[#E2E8E5] dark:border-[#2A323D] leading-tight tabular-nums whitespace-nowrap"
                                            >
                                                {user.workerId ?? '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Inset Menu Actions */}
                            <div className="p-1.5 flex flex-col gap-0.5">
                                {onOpenProfile && (
                                    <button
                                        type="button"
                                        role="menuitem"
                                        onClick={() => {
                                            setDropdownOpen(false);
                                            onOpenProfile();
                                        }}
                                        style={{
                                            padding: '0.5625rem 0.75rem',
                                            gap: '0.625rem',
                                            fontSize: '0.8125rem',
                                            fontWeight: 600,
                                            lineHeight: 1.35,
                                            borderRadius: '0.5rem',
                                        }}
                                        className="group w-full flex items-center text-[#181F26] dark:text-[#E6EDF3] hover:bg-[rgba(14,91,82,0.08)] dark:hover:bg-[rgba(14,91,82,0.22)] hover:text-[#0E5B52] dark:hover:text-[#2DD4BF] transition-colors duration-150 text-left cursor-pointer border-0 bg-transparent"
                                    >
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden="true"
                                            className="shrink-0 text-[#64748B] dark:text-[#94A3B8] group-hover:text-[#0E5B52] dark:group-hover:text-[#2DD4BF] transition-colors duration-150"
                                        >
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        <span className="truncate">My Profile</span>
                                    </button>
                                )}

                                {onOpenProfile && (
                                    <div
                                        role="separator"
                                        className="h-px my-1 mx-1.5 bg-[#E2E8E5] dark:bg-[#2A323D]"
                                    />
                                )}

                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={handleLogoutClick}
                                    style={{
                                        padding: '0.5625rem 0.75rem',
                                        gap: '0.625rem',
                                        fontSize: '0.8125rem',
                                        fontWeight: 600,
                                        lineHeight: 1.35,
                                        borderRadius: '0.5rem',
                                    }}
                                    className="w-full flex items-center text-[#DC2626] dark:text-[#F87171] hover:bg-[rgba(220,38,38,0.08)] dark:hover:bg-[rgba(220,38,38,0.14)] transition-colors duration-150 text-left cursor-pointer border-0 bg-transparent"
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                        className="shrink-0"
                                    >
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    <span className="truncate">Log out</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}
