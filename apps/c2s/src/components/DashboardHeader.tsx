'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';

export function SidebarBrandHeader({ collapsed }: { collapsed: boolean }) {
    return (
        <div
            className={`sidebar-brand-header nav-fixed-h border-b flex items-center shrink-0 transition-all duration-200 cursor-default pointer-events-none select-none ${
                collapsed ? 'px-3 md:px-0 md:justify-center' : 'px-3'
            }`}
        >
            <div
                className={`flex items-center min-w-0 cursor-default pointer-events-none ${collapsed ? 'gap-2.5 md:gap-0 md:justify-center' : 'gap-2.5'}`}
            >
                <div
                    data-logo-badge="true"
                    style={{ backgroundColor: '#FFFFFF' }}
                    className={`sidebar-logo-badge !bg-white rounded-full p-1 shadow-sm flex items-center justify-center shrink-0 relative transition-all duration-200 ${collapsed ? 'w-11 h-11' : 'w-12 h-12'}`}
                >
                    <Image src="/c2s.png" alt="Connect2Souls Logo" width={48} height={48} className="w-full h-full object-contain" priority />
                </div>
                <div className={`flex flex-col gap-0.5 leading-tight min-w-0 ${collapsed ? 'md:hidden' : ''}`}>
                    <p className="sidebar-brand-title text-[1.125rem] font-extrabold tracking-tight leading-tight">
                        Connect2Souls
                    </p>
                    <p className="sidebar-brand-sub text-[0.875rem] font-medium tracking-[-0.015em] leading-tight">
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
    onLogout,
}: {
    pageTitle?: string;
    onOpenMenu?: () => void;
    onLogout?: () => void;
}) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    if (!user) return null;

    const isHead = user.role === 'ministry_head';
    const isCluster = user.role === 'cluster_head';
    const isCoord = user.role === 'c2s_coordinator';
    const isAdmin = user.role === 'admin';
    const roleColor = isAdmin ? '#1E293B' : isHead ? '#D97706' : isCluster ? '#0284C7' : isCoord ? '#EA580C' : '#D97706';

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
            <div className="flex items-center gap-2.5 min-w-0">
                {onOpenMenu && (
                    <button
                        type="button"
                        onClick={onOpenMenu}
                        aria-label="Open menu"
                        className="md:hidden inline-flex items-center justify-center p-1.5 rounded-lg text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
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
                    onClick={() => setDropdownOpen((o) => !o)}
                    style={{ padding: '0.25rem 0.625rem 0.25rem 0.3125rem', gap: '0.5rem' }}
                    className="flex items-center rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-200/70 dark:border-white/10 transition-colors"
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
                        className="hidden sm:inline font-semibold text-gray-800 dark:text-gray-100 truncate max-w-[11.25rem] lg:max-w-[16.25rem]"
                        style={{ fontSize: '0.875rem', lineHeight: '1.25' }}
                    >
                        {user.name}
                    </span>
                    <svg
                        className={`text-gray-500 shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
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
                            className="absolute right-0 top-full mt-2 bg-white rounded-xl border border-gray-200/80 overflow-hidden z-50"
                            style={{
                                width: '152px',
                                maxWidth: 'calc(100vw - 32px)',
                                boxShadow: '0 10px 28px rgba(15, 23, 42, 0.12)',
                                backgroundColor: 'var(--surface)',
                                borderColor: 'var(--border)',
                            }}
                        >
                            <button
                                type="button"
                                onClick={handleLogoutClick}
                                style={{ padding: '10px 14px', gap: '10px', fontSize: '14px', lineHeight: '1.25' }}
                                className="w-full flex items-center font-medium text-red-500 hover:bg-red-50/80 dark:hover:bg-red-950/30 transition-colors text-left"
                            >
                                <svg
                                    style={{ width: '15px', height: '15px' }}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="shrink-0"
                                >
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                <span>Log out</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}
