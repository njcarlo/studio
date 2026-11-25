'use client';

import { useEffect, type ReactNode } from 'react';
import { useTheme } from '@/lib/theme-context';

export type ConfirmVariant = 'default' | 'danger';

export interface ConfirmModalProps {
    open: boolean;
    variant?: ConfirmVariant;
    title: string;
    description: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
}

export default function ConfirmModal({
    open,
    variant = 'default',
    title,
    description,
    confirmLabel = 'Confirm',
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

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                if (!loading) onCancel();
            }
        }

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [open, loading, onCancel]);

    if (!open) return null;

    const isDanger = variant === 'danger';
    const accentColor = isDanger ? '#EF4444' : '#14B8A6';
    const badgeBg = isDanger
        ? isDark
            ? 'rgba(239, 68, 68, 0.16)'
            : 'rgba(239, 68, 68, 0.12)'
        : isDark
            ? 'rgba(20, 184, 166, 0.16)'
            : 'rgba(20, 184, 166, 0.12)';

    return (
        <div
            data-confirm-modal="true"
            role="dialog"
            aria-modal="true"
            aria-labelledby="c2s-confirm-modal-title"
            aria-describedby="c2s-confirm-modal-desc"
            className="fixed inset-0 z-[12000] flex items-center justify-center p-4 animate-in fade-in duration-150"
            style={{
                backgroundColor: 'rgba(15, 23, 42, 0.5)',
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
                className="w-full max-w-[420px] p-6 transition-all"
                style={{
                    borderRadius: '20px',
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    border: isDark ? '1px solid #334155' : '1px solid #F1F5F9',
                    boxShadow: isDark
                        ? '0 24px 48px -12px rgba(0, 0, 0, 0.55), 0 8px 20px -6px rgba(0, 0, 0, 0.35)'
                        : '0 20px 45px -10px rgba(15, 23, 42, 0.16), 0 8px 20px -6px rgba(15, 23, 42, 0.08)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Circular Tinted Icon Badge */}
                <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: badgeBg }}
                >
                    {isDanger ? (
                        <svg
                            className="w-6 h-6"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={accentColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M12 9v4" />
                            <path d="M12 17h.01" />
                            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                        </svg>
                    ) : (
                        <svg
                            className="w-6 h-6"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={accentColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M9 12l2 2 4-4" />
                            <circle cx="12" cy="12" r="9" />
                        </svg>
                    )}
                </div>

                {/* Heading */}
                <h2
                    id="c2s-confirm-modal-title"
                    className="text-lg font-bold tracking-tight"
                    style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}
                >
                    {title}
                </h2>

                {/* Description */}
                <p
                    id="c2s-confirm-modal-desc"
                    className="mt-1.5 text-sm leading-relaxed"
                    style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                >
                    {description}
                </p>

                {/* Action Buttons */}
                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        disabled={loading}
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                            borderRadius: '10px',
                            backgroundColor: 'transparent',
                            border: isDark ? '1px solid #334155' : '1px solid #CBD5E1',
                            color: isDark ? '#E2E8F0' : '#334155',
                        }}
                    >
                        {cancelLabel}
                    </button>

                    <button
                        type="button"
                        disabled={loading}
                        onClick={onConfirm}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed"
                        style={{
                            borderRadius: '10px',
                            backgroundColor: accentColor,
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
                </div>
            </div>
        </div>
    );
}
