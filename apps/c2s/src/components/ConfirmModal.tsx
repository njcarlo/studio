'use client';

import { useEffect, type ReactNode } from 'react';
import { useTheme } from '@/lib/theme-context';

export type ConfirmVariant = 'default' | 'danger';
export type ConfirmIconType = 'check' | 'trash' | 'warning' | 'mail';

export interface ConfirmModalProps {
    open: boolean;
    variant?: ConfirmVariant;
    icon?: ConfirmIconType;
    title: string;
    description: ReactNode;
    extra?: ReactNode;
    confirmLabel?: string;
    confirmHref?: string;
    cancelLabel?: string;
    loading?: boolean;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
}

export default function ConfirmModal({
    open,
    variant = 'default',
    icon,
    title,
    description,
    extra,
    confirmLabel = 'Confirm',
    confirmHref,
    cancelLabel = 'Cancel',
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    const { theme } = useTheme();
    const isDark =
        theme === 'dark' &&
        (typeof document === 'undefined' || document.documentElement.classList.contains('dark'));

    useEffect(() => {
        if (!open) return;

        document.documentElement.dataset.confirmOpen = 'true';

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                if (!loading) onCancel();
            }
        }

        window.addEventListener('keydown', handleKeyDown, true);
        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            delete document.documentElement.dataset.confirmOpen;
        };
    }, [open, loading, onCancel]);

    if (!open) return null;

    const isDanger = variant === 'danger';
    const resolvedIcon: ConfirmIconType =
        icon ??
        (isDanger
            ? /\b(delete|remove|trash|erase|discard)\b/i.test(`${title} ${confirmLabel}`)
                ? 'trash'
                : 'warning'
            : 'check');

    const iconColor = isDanger ? '#E11D48' : isDark ? '#2A9D8F' : '#0E5B52';
    const badgeBg = isDanger
        ? isDark
            ? 'rgba(225, 29, 72, 0.16)'
            : 'rgba(225, 29, 72, 0.10)'
        : isDark
            ? 'rgba(42, 157, 143, 0.14)'
            : 'rgba(14, 91, 82, 0.10)';
    const primaryBg = isDanger ? '#E11D48' : '#0E5B52';

    return (
        <div
            data-confirm-modal="true"
            role="dialog"
            aria-modal="true"
            aria-labelledby="c2s-confirm-modal-title"
            aria-describedby="c2s-confirm-modal-desc"
            className="c2s-modal-backdrop fixed inset-0 z-[12000] flex items-center justify-center p-4"
            style={{
                backgroundColor: 'rgba(15, 23, 42, 0.45)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget && !loading) {
                    onCancel();
                }
            }}
        >
            <div
                className="c2s-modal-card relative w-full transition-all"
                style={{
                    maxWidth: '440px',
                    borderRadius: '1.5rem',
                    padding: '2rem',
                    textAlign: 'center',
                    backgroundColor: isDark ? '#1A2026' : '#FFFFFF',
                    border: isDark ? '1px solid #2A323D' : '1px solid #E2E8E5',
                    boxShadow: isDark
                        ? '0 24px 48px -12px rgba(0, 0, 0, 0.60), 0 8px 20px -6px rgba(0, 0, 0, 0.40)'
                        : '0 20px 45px -10px rgba(15, 23, 42, 0.16), 0 8px 20px -6px rgba(15, 23, 42, 0.08)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top-right Close (×) Button */}
                <button
                    type="button"
                    data-confirm-modal-btn="true"
                    aria-label="Close"
                    disabled={loading}
                    onClick={onCancel}
                    style={{
                        position: 'absolute',
                        top: '1.25rem',
                        right: '1.25rem',
                        width: '32px',
                        height: '32px',
                        borderRadius: '9999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748B',
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: 0,
                        cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                    className="transition-colors hover:bg-slate-100 dark:hover:bg-[#222933] disabled:opacity-50"
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                {/* Centered 56px × 56px Rounded-Square Icon Badge */}
                <div
                    style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '1rem',
                        backgroundColor: badgeBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.25rem auto',
                        color: iconColor,
                    }}
                >
                    {resolvedIcon === 'trash' && (
                        <svg
                            width="26"
                            height="26"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                    )}
                    {resolvedIcon === 'warning' && (
                        <svg
                            width="26"
                            height="26"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    )}
                    {resolvedIcon === 'check' && (
                        <svg
                            width="26"
                            height="26"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    )}
                    {resolvedIcon === 'mail' && (
                        <svg
                            width="26"
                            height="26"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                    )}
                </div>

                {/* Centered Title */}
                <h2
                    id="c2s-confirm-modal-title"
                    style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        lineHeight: 1.3,
                        color: isDark ? '#E6EDF3' : '#181F26',
                        textAlign: 'center',
                        margin: 0,
                    }}
                >
                    {title}
                </h2>

                {/* Centered Description */}
                <div
                    id="c2s-confirm-modal-desc"
                    style={{
                        marginTop: '0.625rem',
                        fontSize: '0.9375rem',
                        lineHeight: 1.55,
                        color: isDark ? '#9BA7B4' : '#475569',
                        textAlign: 'center',
                    }}
                >
                    {description}
                </div>

                {/* Optional Extra Context / Reminder */}
                {extra && <div style={{ marginTop: '1rem', textAlign: 'left' }}>{extra}</div>}

                {/* 2-Column Full-Width Button Row */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        gap: '0.75rem',
                        marginTop: '1.75rem',
                    }}
                >
                    <button
                        type="button"
                        data-confirm-modal-btn="true"
                        disabled={loading}
                        onClick={onCancel}
                        className="transition-opacity hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        style={{
                            height: '2.375rem',
                            borderRadius: '0.625rem',
                            backgroundColor: isDark ? '#1A2026' : '#FFFFFF',
                            border: isDark ? '1px solid #2A323D' : '1px solid #E2E8E5',
                            color: isDark ? '#E6EDF3' : '#181F26',
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                            lineHeight: 1,
                            padding: '0 1.25rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            whiteSpace: 'nowrap',
                            width: '100%',
                        }}
                    >
                        {cancelLabel}
                    </button>

                    {confirmHref ? (
                        <a
                            href={confirmHref}
                            data-confirm-modal-btn="true"
                            onClick={() => {
                                window.setTimeout(() => {
                                    void onConfirm();
                                }, 50);
                            }}
                            className="transition-opacity hover:opacity-90 cursor-pointer no-underline"
                            style={{
                                height: '2.375rem',
                                borderRadius: '0.625rem',
                                backgroundColor: primaryBg,
                                border: 'none',
                                color: '#FFFFFF',
                                fontWeight: 600,
                                fontSize: '0.8125rem',
                                lineHeight: 1,
                                padding: '0 1.25rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                whiteSpace: 'nowrap',
                                width: '100%',
                            }}
                        >
                            <span>{confirmLabel}</span>
                        </a>
                    ) : (
                        <button
                            type="button"
                            data-confirm-modal-btn="true"
                            disabled={loading}
                            onClick={onConfirm}
                            className="transition-opacity hover:opacity-90 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                            style={{
                                height: '2.375rem',
                                borderRadius: '0.625rem',
                                backgroundColor: primaryBg,
                                border: 'none',
                                color: '#FFFFFF',
                                fontWeight: 600,
                                fontSize: '0.8125rem',
                                lineHeight: 1,
                                padding: '0 1.25rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                whiteSpace: 'nowrap',
                                width: '100%',
                            }}
                        >
                            {loading && (
                                <svg
                                    className="w-4 h-4 animate-spin text-white"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="3.5"
                                    />
                                    <path
                                        className="opacity-90"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
                                    />
                                </svg>
                            )}
                            <span>{loading ? 'Processing...' : confirmLabel}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
