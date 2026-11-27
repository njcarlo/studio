'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type ActionMenuTone = 'default' | 'positive' | 'destructive';

export interface ActionMenuItem {
    key?: string;
    label: string;
    icon?: React.ReactNode;
    tone?: ActionMenuTone;
    dividerBefore?: boolean;
    disabled?: boolean;
    onClick: () => void;
}

export interface ActionMenuProps {
    items: ActionMenuItem[];
    ariaLabel?: string;
    align?: 'left' | 'right';
}

const iconProps = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
};

export const ActionIcons = {
    view: (
        <svg {...iconProps}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    edit: (
        <svg {...iconProps}>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    ),
    transfer: (
        <svg {...iconProps}>
            <path d="M7 16V4m0 0L3 8m4-4l4 4" />
            <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
        </svg>
    ),
    approve: (
        <svg {...iconProps}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    reject: (
        <svg {...iconProps}>
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
    ),
    trash: (
        <svg {...iconProps}>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
    ),
    calendar: (
        <svg {...iconProps}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    userPlus: (
        <svg {...iconProps}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
    ),
    users: (
        <svg {...iconProps}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    shield: (
        <svg {...iconProps}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
    download: (
        <svg {...iconProps}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    ),
    plus: (
        <svg {...iconProps}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    clipboard: (
        <svg {...iconProps}>
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>
    ),
    recommend: (
        <svg {...iconProps}>
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
    ),
};

export default function ActionMenu({ items, ariaLabel = 'Actions', align = 'right' }: ActionMenuProps) {
    const menuId = useId();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number }>({
        top: 0,
        left: 0,
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    function computePosition() {
        const trigger = triggerRef.current;
        if (!trigger) return;
        const rect = trigger.getBoundingClientRect();
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        const estWidth = 220;
        const estHeight = Math.max(80, items.length * 40 + 16);
        const gap = 6;

        const darkActive =
            document.documentElement.classList.contains('dark') &&
            !trigger.closest('.force-light');
        setIsDark(Boolean(darkActive));

        const preferredLeft = align === 'right' ? rect.right - estWidth : rect.left;
        const clampedLeft = Math.max(12, Math.min(preferredLeft, vw - estWidth - 12));

        const spaceBelow = vh - rect.bottom - gap - 12;
        const spaceAbove = rect.top - gap - 12;
        if (spaceBelow < estHeight && spaceAbove > spaceBelow) {
            setPos({ bottom: vh - rect.top + gap, left: clampedLeft });
        } else {
            setPos({ top: rect.bottom + gap, left: clampedLeft });
        }
    }

    function toggleMenu(e: React.MouseEvent) {
        e.stopPropagation();
        if (open) {
            setOpen(false);
            return;
        }
        computePosition();
        setHoveredIdx(null);
        setOpen(true);
    }

    useEffect(() => {
        if (!open) return;

        function onDocMouseDown(e: MouseEvent) {
            const target = e.target as Node;
            if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
            setOpen(false);
        }

        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setOpen(false);
                triggerRef.current?.focus();
            }
        }

        function onScrollOrResize() {
            computePosition();
        }

        document.addEventListener('mousedown', onDocMouseDown);
        document.addEventListener('keydown', onKeyDown);
        window.addEventListener('resize', onScrollOrResize);
        window.addEventListener('scroll', onScrollOrResize, true);
        return () => {
            document.removeEventListener('mousedown', onDocMouseDown);
            document.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('resize', onScrollOrResize);
            window.removeEventListener('scroll', onScrollOrResize, true);
        };
    }, [open, items.length, align]);

    if (items.length === 0) return null;

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                data-action-menu-trigger="true"
                aria-label={ariaLabel}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={open ? menuId : undefined}
                onClick={toggleMenu}
                className="c2s-action-menu-trigger inline-flex items-center justify-center w-8 h-8 rounded-full border-0 shrink-0 cursor-pointer"
                style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '9999px',
                    padding: 0,
                    backgroundColor: open
                        ? isDark
                            ? 'rgba(14, 91, 82, 0.22)'
                            : 'rgba(14, 91, 82, 0.08)'
                        : undefined,
                    color: open
                        ? isDark
                            ? '#2DD4BF'
                            : '#0E5B52'
                        : undefined,
                    transition: 'all 150ms ease',
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <circle cx="5" cy="12" r="1.75" />
                    <circle cx="12" cy="12" r="1.75" />
                    <circle cx="19" cy="12" r="1.75" />
                </svg>
            </button>

            {mounted &&
                open &&
                createPortal(
                    <div
                        ref={popoverRef}
                        id={menuId}
                        role="menu"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            top: pos.top,
                            bottom: pos.bottom,
                            left: pos.left,
                            minWidth: '13.5rem',
                            padding: '0.375rem',
                            borderRadius: '0.75rem',
                            backgroundColor: isDark ? '#1A2026' : '#FFFFFF',
                            border: isDark ? '1px solid #2A323D' : '1px solid #E2E8E5',
                            boxShadow: isDark
                                ? '0 10px 25px -5px rgba(0, 0, 0, 0.45), 0 4px 10px -2px rgba(0, 0, 0, 0.28)'
                                : '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
                            transformOrigin: pos.bottom !== undefined ? 'bottom right' : 'top right',
                        }}
                        className="c2s-action-popover fixed z-[12000] flex flex-col gap-0.5"
                    >
                        {items.map((item, idx) => {
                            const prev = idx > 0 ? items[idx - 1] : null;
                            const showDivider =
                                Boolean(item.dividerBefore) ||
                                (item.tone === 'destructive' && prev !== null && prev.tone !== 'destructive');

                            const isHovered = hoveredIdx === idx;
                            const isDestructive = item.tone === 'destructive';
                            const isPositive = item.tone === 'positive';

                            const color = isDestructive
                                ? isDark
                                    ? '#F87171'
                                    : '#DC2626'
                                : isPositive
                                    ? isHovered
                                        ? isDark
                                            ? '#2DD4BF'
                                            : '#0E5B52'
                                        : isDark
                                            ? '#5EEAD4'
                                            : '#0E5B52'
                                    : isHovered
                                        ? isDark
                                            ? '#2DD4BF'
                                            : '#0E5B52'
                                        : isDark
                                            ? '#E6EDF3'
                                            : '#181F26';

                            const iconColor = isDestructive
                                ? isDark
                                    ? '#F87171'
                                    : '#DC2626'
                                : isPositive || isHovered
                                    ? isDark
                                        ? '#2DD4BF'
                                        : '#0E5B52'
                                    : isDark
                                        ? '#94A3B8'
                                        : '#64748B';

                            const hoverBg = isDestructive
                                ? isDark
                                    ? 'rgba(220, 38, 38, 0.14)'
                                    : 'rgba(220, 38, 38, 0.08)'
                                : isDark
                                    ? 'rgba(14, 91, 82, 0.22)'
                                    : 'rgba(14, 91, 82, 0.08)';

                            return (
                                <React.Fragment key={item.key ?? `${item.label}-${idx}`}>
                                    {showDivider && (
                                        <div
                                            role="separator"
                                            style={{
                                                height: '1px',
                                                margin: '0.25rem 0.375rem',
                                                backgroundColor: isDark ? '#2A323D' : '#E2E8E5',
                                            }}
                                        />
                                    )}
                                    <button
                                        type="button"
                                        role="menuitem"
                                        disabled={item.disabled}
                                        onMouseEnter={() => !item.disabled && setHoveredIdx(idx)}
                                        onMouseLeave={() => setHoveredIdx(null)}
                                        onClick={() => {
                                            if (item.disabled) return;
                                            setOpen(false);
                                            item.onClick();
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.625rem',
                                            width: '100%',
                                            textAlign: 'left',
                                            fontSize: '0.8125rem',
                                            fontWeight: 600,
                                            lineHeight: 1.35,
                                            padding: '0.5625rem 0.75rem',
                                            borderRadius: '0.5rem',
                                            color,
                                            backgroundColor: isHovered ? hoverBg : 'transparent',
                                            opacity: item.disabled ? 0.45 : 1,
                                            cursor: item.disabled ? 'not-allowed' : 'pointer',
                                            border: 'none',
                                            transition: 'background-color 150ms ease, color 150ms ease',
                                        }}
                                    >
                                        {item.icon && (
                                            <span
                                                className="shrink-0 flex items-center justify-center"
                                                style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    color: iconColor,
                                                    transition: 'color 150ms ease',
                                                }}
                                            >
                                                {item.icon}
                                            </span>
                                        )}
                                        <span className="truncate">{item.label}</span>
                                    </button>
                                </React.Fragment>
                            );
                        })}
                    </div>,
                    document.body,
                )}
        </>
    );
}
