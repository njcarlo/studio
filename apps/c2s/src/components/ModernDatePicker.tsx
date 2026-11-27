'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ModernDatePickerProps {
    value: string; // YYYY-MM-DD or ''
    onChange: (value: string) => void;
    onBlur?: () => void;
    placeholder?: string;
    id?: string;
    name?: string;
    min?: string; // YYYY-MM-DD
    max?: string; // YYYY-MM-DD
    required?: boolean;
    disabled?: boolean;
    hasError?: boolean;
    className?: string;
    'aria-label'?: string;
    'aria-describedby'?: string;
}

interface CalendarDate {
    year: number;
    month: number; // 1-12
    day: number; // 1-31
}

interface TemporalPlainDateLike {
    year: number;
    month: number;
    day: number;
    add: (duration: { months?: number; days?: number }) => TemporalPlainDateLike;
    toString: () => string;
}

interface TemporalGlobalLike {
    PlainDate?: {
        from: (input: string | { year: number; month: number; day: number }) => TemporalPlainDateLike;
    };
    Now?: {
        plainDateISO: () => TemporalPlainDateLike;
    };
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getTemporal(): TemporalGlobalLike | undefined {
    return (globalThis as { Temporal?: TemporalGlobalLike }).Temporal;
}

function pad2(n: number): string {
    return String(n).padStart(2, '0');
}

export function formatIsoDate(d: CalendarDate): string {
    return `${String(d.year).padStart(4, '0')}-${pad2(d.month)}-${pad2(d.day)}`;
}

/**
 * Parses a YYYY-MM-DD string into location-agnostic calendar components,
 * using Temporal.PlainDate when available without invoking UTC Date shifts.
 */
export function parseIsoDate(iso: string): CalendarDate | null {
    const trimmed = iso.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;

    const temporal = getTemporal();
    if (temporal?.PlainDate) {
        try {
            const pd = temporal.PlainDate.from(trimmed);
            return { year: pd.year, month: pd.month, day: pd.day };
        } catch {
            return null;
        }
    }

    const [y, m, d] = trimmed.split('-').map(Number);
    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    const probe = new Date(Date.UTC(y, m - 1, d));
    if (
        probe.getUTCFullYear() !== y ||
        probe.getUTCMonth() + 1 !== m ||
        probe.getUTCDate() !== d
    ) {
        return null;
    }
    return { year: y, month: m, day: d };
}

function getTodayCalendarDate(): CalendarDate {
    const temporal = getTemporal();
    if (temporal?.Now?.plainDateISO) {
        try {
            const pd = temporal.Now.plainDateISO();
            return { year: pd.year, month: pd.month, day: pd.day };
        } catch {
            // Fallback below
        }
    }
    const now = new Date();
    return {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
    };
}

function daysInMonth(year: number, month: number): number {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// Returns 0 (Sun) through 6 (Sat) using UTC to stay immune to DST/timezone shifts.
function weekdayOfFirstDay(year: number, month: number): number {
    return new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
}

function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
    const zeroBased = year * 12 + (month - 1) + delta;
    const nextYear = Math.floor(zeroBased / 12);
    const nextMonth = ((zeroBased % 12) + 12) % 12 + 1;
    return { year: nextYear, month: nextMonth };
}

function compareIso(a: string, b: string): number {
    if (a === b) return 0;
    return a < b ? -1 : 1;
}

function formatDisplayDate(d: CalendarDate): string {
    return `${MONTH_SHORT[d.month - 1]} ${d.day}, ${d.year}`;
}

/**
 * Shared modern calendar picker styled in Connect2Souls Deep Pine Teal (#0E5B52),
 * with quick Month/Year grid switching, keyboard dismissal, and viewport-aware popovers.
 */
export default function ModernDatePicker({
    value,
    onChange,
    onBlur,
    placeholder = 'Select date',
    id,
    name,
    min,
    max,
    required = false,
    disabled = false,
    hasError = false,
    className = '',
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
}: ModernDatePickerProps) {
    const generatedId = useId();
    const dialogId = `${id ?? generatedId}-calendar`;

    const parsedSelected = useMemo(() => parseIsoDate(value), [value]);
    const today = useMemo(() => getTodayCalendarDate(), []);
    const todayIso = useMemo(() => formatIsoDate(today), [today]);

    const minYear = useMemo(() => {
        const parsed = min ? parseIsoDate(min) : null;
        return parsed ? parsed.year : 1920;
    }, [min]);

    const maxYear = useMemo(() => {
        const parsed = max ? parseIsoDate(max) : null;
        return parsed ? parsed.year : today.year + 25;
    }, [max, today.year]);

    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [pickerView, setPickerView] = useState<'day' | 'month' | 'year'>('day');

    const initialCursor = parsedSelected ?? today;
    const [viewYear, setViewYear] = useState(initialCursor.year);
    const [viewMonth, setViewMonth] = useState(initialCursor.month);
    const [yearBlockStart, setYearBlockStart] = useState(
        Math.floor(initialCursor.year / 12) * 12,
    );

    const [popoverPos, setPopoverPos] = useState<{
        top?: number;
        bottom?: number;
        left: number;
    }>({ top: 0, left: 0 });

    const wrapperRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (parsedSelected) {
            setViewYear(parsedSelected.year);
            setViewMonth(parsedSelected.month);
            setYearBlockStart(Math.floor(parsedSelected.year / 12) * 12);
        }
    }, [parsedSelected]);

    function updatePosition() {
        const el = triggerRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        const gap = 8;
        const popWidth = Math.min(312, vw - 24);
        const estimatedHeight = 360;

        const spaceBelow = vh - rect.bottom - gap - 12;
        const spaceAbove = rect.top - gap - 12;
        const openUpward = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

        const clampedLeft = Math.max(12, Math.min(rect.left, vw - popWidth - 12));

        const darkActive =
            document.documentElement.classList.contains('dark') &&
            !wrapperRef.current?.closest('.force-light');
        setIsDark(Boolean(darkActive));

        if (openUpward) {
            setPopoverPos({
                bottom: Math.max(12, vh - rect.top + gap),
                left: clampedLeft,
            });
        } else {
            setPopoverPos({
                top: Math.min(vh - estimatedHeight - 12, rect.bottom + gap),
                left: clampedLeft,
            });
        }
    }

    function openCalendar() {
        if (disabled) return;
        const anchor = parsedSelected ?? (max && compareIso(todayIso, max) > 0 ? parseIsoDate(max)! : today);
        setViewYear(anchor.year);
        setViewMonth(anchor.month);
        setYearBlockStart(Math.floor(anchor.year / 12) * 12);
        setPickerView('day');
        updatePosition();
        setIsOpen(true);
    }

    function closeCalendar(restoreFocus = false) {
        setIsOpen(false);
        setPickerView('day');
        onBlur?.();
        if (restoreFocus) {
            triggerRef.current?.focus();
        }
    }

    useEffect(() => {
        if (!isOpen) return;

        function handleDocMouseDown(e: MouseEvent) {
            const target = e.target as Node;
            if (wrapperRef.current?.contains(target) || popoverRef.current?.contains(target)) {
                return;
            }
            closeCalendar(false);
        }

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                closeCalendar(true);
            }
        }

        function handleScrollOrResize() {
            updatePosition();
        }

        document.addEventListener('mousedown', handleDocMouseDown);
        document.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('resize', handleScrollOrResize);
        window.addEventListener('scroll', handleScrollOrResize, true);
        return () => {
            document.removeEventListener('mousedown', handleDocMouseDown);
            document.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('resize', handleScrollOrResize);
            window.removeEventListener('scroll', handleScrollOrResize, true);
        };
    }, [isOpen]);

    function isIsoDisabled(iso: string): boolean {
        if (min && compareIso(iso, min) < 0) return true;
        if (max && compareIso(iso, max) > 0) return true;
        return false;
    }

    function selectDate(d: CalendarDate) {
        const iso = formatIsoDate(d);
        if (isIsoDisabled(iso)) return;
        onChange(iso);
        closeCalendar(true);
    }

    // Build fixed 6-row (42-cell) calendar grid so popover height never jumps between months
    const calendarCells = useMemo(() => {
        const firstWeekday = weekdayOfFirstDay(viewYear, viewMonth);
        const totalCurrDays = daysInMonth(viewYear, viewMonth);
        const prevYM = addMonths(viewYear, viewMonth, -1);
        const nextYM = addMonths(viewYear, viewMonth, 1);
        const prevTotalDays = daysInMonth(prevYM.year, prevYM.month);

        const cells: Array<{
            date: CalendarDate;
            iso: string;
            inCurrentMonth: boolean;
            disabled: boolean;
        }> = [];

        for (let i = firstWeekday - 1; i >= 0; i--) {
            const d: CalendarDate = {
                year: prevYM.year,
                month: prevYM.month,
                day: prevTotalDays - i,
            };
            const iso = formatIsoDate(d);
            cells.push({ date: d, iso, inCurrentMonth: false, disabled: isIsoDisabled(iso) });
        }

        for (let day = 1; day <= totalCurrDays; day++) {
            const d: CalendarDate = { year: viewYear, month: viewMonth, day };
            const iso = formatIsoDate(d);
            cells.push({ date: d, iso, inCurrentMonth: true, disabled: isIsoDisabled(iso) });
        }

        const remaining = 42 - cells.length;
        for (let day = 1; day <= remaining; day++) {
            const d: CalendarDate = { year: nextYM.year, month: nextYM.month, day };
            const iso = formatIsoDate(d);
            cells.push({ date: d, iso, inCurrentMonth: false, disabled: isIsoDisabled(iso) });
        }

        return cells;
    }, [viewYear, viewMonth, min, max]);

    const yearCells = useMemo(() => {
        return Array.from({ length: 12 }, (_, idx) => yearBlockStart + idx);
    }, [yearBlockStart]);

    const isTodayDisabled = isIsoDisabled(todayIso);

    return (
        <div ref={wrapperRef} className={`relative w-full ${className}`}>
            {required && (
                <input
                    type="text"
                    name={name}
                    tabIndex={-1}
                    aria-hidden="true"
                    required
                    value={value}
                    onChange={() => {}}
                    className="sr-only pointer-events-none"
                />
            )}
            <button
                ref={triggerRef}
                id={id}
                type="button"
                data-date-picker-trigger="true"
                data-custom-select="true"
                aria-label={ariaLabel}
                aria-describedby={ariaDescribedBy}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                aria-controls={dialogId}
                aria-invalid={hasError ? 'true' : undefined}
                disabled={disabled}
                onClick={() => (isOpen ? closeCalendar(false) : openCalendar())}
                className={`w-full flex items-center justify-between gap-2.5 rounded-lg border px-3 py-2.5 text-sm text-left transition-all select-none ${
                    disabled
                        ? 'opacity-55 cursor-not-allowed bg-gray-50 dark:bg-[#1A2026] border-gray-200 dark:border-[#2A323D]'
                        : hasError
                            ? 'border-red-400 bg-red-50/20 focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer'
                            : isOpen
                                ? 'bg-white dark:bg-[#1A2026] border-[#0E5B52] dark:border-[#2A9D8F] ring-2 ring-[#0E5B52]/25 dark:ring-[#2A9D8F]/25 cursor-pointer'
                                : 'bg-white dark:bg-[#1A2026] border-gray-200 dark:border-[#2A323D] hover:border-gray-300 dark:hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0E5B52]/25 focus:border-[#0E5B52] cursor-pointer'
                }`}
            >
                <span
                    className={`truncate ${
                        parsedSelected
                            ? 'text-[#181F26] dark:text-[#E6EDF3] font-medium'
                            : 'text-gray-400 dark:text-slate-400'
                    }`}
                >
                    {parsedSelected ? formatDisplayDate(parsedSelected) : placeholder}
                </span>
                <svg
                    aria-hidden="true"
                    className={`w-4 h-4 shrink-0 transition-colors ${
                        isOpen
                            ? 'text-[#0E5B52] dark:text-[#5EEAD4]'
                            : 'text-gray-400 dark:text-slate-400'
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.9}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <rect x="3" y="4" width="18" height="18" rx="2.5" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            </button>

            {mounted &&
                isOpen &&
                createPortal(
                    <div
                        ref={popoverRef}
                        id={dialogId}
                        role="dialog"
                        aria-label="Choose date"
                        className={`fixed z-[12000] w-[312px] rounded-2xl border p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none ${
                            isDark
                                ? 'bg-[#1A2026] border-[#2A323D] text-[#E6EDF3] shadow-black/60'
                                : 'bg-white border-[#E2E8E5] text-[#181F26] shadow-slate-900/15'
                        }`}
                        style={{
                            top: popoverPos.top,
                            bottom: popoverPos.bottom,
                            left: popoverPos.left,
                        }}
                    >
                        {/* Header Bar: Month/Year Pills + Navigation */}
                        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[#E2E8E5] dark:border-[#2A323D]">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <button
                                    type="button"
                                    data-date-picker-btn="true"
                                    onClick={() => setPickerView(pickerView === 'month' ? 'day' : 'month')}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                        pickerView === 'month'
                                            ? 'bg-[#0E5B52] text-white'
                                            : isDark
                                                ? 'bg-[#222933] text-[#E6EDF3] hover:bg-[#2A323D]'
                                                : 'bg-[#F8FAFC] text-[#181F26] hover:bg-slate-100'
                                    }`}
                                >
                                    <span>{MONTH_NAMES[viewMonth - 1]}</span>
                                    <svg className={`w-3 h-3 transition-transform ${pickerView === 'month' ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    data-date-picker-btn="true"
                                    onClick={() => {
                                        setYearBlockStart(Math.floor(viewYear / 12) * 12);
                                        setPickerView(pickerView === 'year' ? 'day' : 'year');
                                    }}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold tabular-nums transition-colors cursor-pointer ${
                                        pickerView === 'year'
                                            ? 'bg-[#0E5B52] text-white'
                                            : isDark
                                                ? 'bg-[#222933] text-[#E6EDF3] hover:bg-[#2A323D]'
                                                : 'bg-[#F8FAFC] text-[#181F26] hover:bg-slate-100'
                                    }`}
                                >
                                    <span>{viewYear}</span>
                                    <svg className={`w-3 h-3 transition-transform ${pickerView === 'year' ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    type="button"
                                    data-date-picker-btn="true"
                                    aria-label={pickerView === 'year' ? 'Previous 12 years' : 'Previous month'}
                                    onClick={() => {
                                        if (pickerView === 'year') {
                                            setYearBlockStart((y) => Math.max(minYear - 11, y - 12));
                                        } else {
                                            const prev = addMonths(viewYear, viewMonth, -1);
                                            setViewYear(prev.year);
                                            setViewMonth(prev.month);
                                        }
                                    }}
                                    className={`w-8 h-8 rounded-lg inline-flex items-center justify-center transition-colors cursor-pointer ${
                                        isDark
                                            ? 'text-[#9BA7B4] hover:bg-[#222933] hover:text-[#E6EDF3]'
                                            : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#181F26]'
                                    }`}
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="15 18 9 12 15 6" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    data-date-picker-btn="true"
                                    aria-label={pickerView === 'year' ? 'Next 12 years' : 'Next month'}
                                    onClick={() => {
                                        if (pickerView === 'year') {
                                            setYearBlockStart((y) => Math.min(maxYear, y + 12));
                                        } else {
                                            const next = addMonths(viewYear, viewMonth, 1);
                                            setViewYear(next.year);
                                            setViewMonth(next.month);
                                        }
                                    }}
                                    className={`w-8 h-8 rounded-lg inline-flex items-center justify-center transition-colors cursor-pointer ${
                                        isDark
                                            ? 'text-[#9BA7B4] hover:bg-[#222933] hover:text-[#E6EDF3]'
                                            : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#181F26]'
                                    }`}
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* View 1: Day Grid */}
                        {pickerView === 'day' && (
                            <>
                                <div className="grid grid-cols-7 gap-1 mb-1.5">
                                    {WEEKDAYS.map((wd) => (
                                        <div
                                            key={wd}
                                            className={`h-7 flex items-center justify-center text-[11px] font-bold uppercase tracking-wider ${
                                                isDark ? 'text-[#9BA7B4]' : 'text-[#64748B]'
                                            }`}
                                        >
                                            {wd}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {calendarCells.map(({ date, iso, inCurrentMonth, disabled: dayDisabled }) => {
                                        const isSelected = value === iso;
                                        const isToday = todayIso === iso;
                                        return (
                                            <button
                                                key={iso}
                                                type="button"
                                                data-date-picker-btn="true"
                                                disabled={dayDisabled}
                                                onClick={() => selectDate(date)}
                                                aria-label={`${MONTH_NAMES[date.month - 1]} ${date.day}, ${date.year}`}
                                                aria-pressed={isSelected}
                                                className={`h-9 min-w-[36px] rounded-xl text-xs font-semibold tabular-nums flex items-center justify-center transition-all ${
                                                    dayDisabled
                                                        ? 'opacity-30 cursor-not-allowed'
                                                        : isSelected
                                                            ? 'bg-[#0E5B52] text-white font-bold shadow-sm cursor-pointer'
                                                            : isToday
                                                                ? isDark
                                                                    ? 'border border-[#2A9D8F]/60 bg-[#2A9D8F]/15 text-[#5EEAD4] font-bold hover:bg-[#2A9D8F]/25 cursor-pointer'
                                                                    : 'border border-[#0E5B52]/40 bg-[#0E5B52]/10 text-[#0E5B52] font-bold hover:bg-[#0E5B52]/15 cursor-pointer'
                                                                : inCurrentMonth
                                                                    ? isDark
                                                                        ? 'text-[#E6EDF3] hover:bg-[#222933] cursor-pointer'
                                                                        : 'text-[#181F26] hover:bg-[#F8FAFC] cursor-pointer'
                                                                    : isDark
                                                                        ? 'text-[#64748B]/60 hover:bg-[#222933]/60 cursor-pointer'
                                                                        : 'text-[#94A3B8] hover:bg-[#F8FAFC] cursor-pointer'
                                                }`}
                                            >
                                                {date.day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* View 2: Quick Month Grid */}
                        {pickerView === 'month' && (
                            <div className="grid grid-cols-3 gap-2 py-2">
                                {MONTH_SHORT.map((label, idx) => {
                                    const monthNum = idx + 1;
                                    const isCurrent = viewMonth === monthNum;
                                    return (
                                        <button
                                            key={label}
                                            type="button"
                                            data-date-picker-btn="true"
                                            onClick={() => {
                                                setViewMonth(monthNum);
                                                setPickerView('day');
                                            }}
                                            className={`h-11 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                                                isCurrent
                                                    ? 'bg-[#0E5B52] text-white shadow-sm'
                                                    : isDark
                                                        ? 'bg-[#222933]/70 text-[#E6EDF3] hover:bg-[#2A323D]'
                                                        : 'bg-[#F8FAFC] text-[#181F26] hover:bg-[#0E5B52]/10 hover:text-[#0E5B52]'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* View 3: Quick Year Grid */}
                        {pickerView === 'year' && (
                            <div className="py-1">
                                <p className={`text-[11px] font-semibold text-center mb-2.5 tabular-nums ${isDark ? 'text-[#9BA7B4]' : 'text-[#64748B]'}`}>
                                    {yearBlockStart} – {yearBlockStart + 11}
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    {yearCells.map((yr) => {
                                        const outOfRange = yr < minYear || yr > maxYear;
                                        const isCurrent = viewYear === yr;
                                        return (
                                            <button
                                                key={yr}
                                                type="button"
                                                data-date-picker-btn="true"
                                                disabled={outOfRange}
                                                onClick={() => {
                                                    setViewYear(yr);
                                                    setPickerView('month');
                                                }}
                                                className={`h-11 rounded-xl text-xs font-bold tabular-nums transition-colors ${
                                                    outOfRange
                                                        ? 'opacity-30 cursor-not-allowed'
                                                        : isCurrent
                                                            ? 'bg-[#0E5B52] text-white shadow-sm cursor-pointer'
                                                            : isDark
                                                                ? 'bg-[#222933]/70 text-[#E6EDF3] hover:bg-[#2A323D] cursor-pointer'
                                                                : 'bg-[#F8FAFC] text-[#181F26] hover:bg-[#0E5B52]/10 hover:text-[#0E5B52] cursor-pointer'
                                                }`}
                                            >
                                                {yr}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Footer Actions */}
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E2E8E5] dark:border-[#2A323D]">
                            <button
                                type="button"
                                data-date-picker-btn="true"
                                onClick={() => {
                                    onChange('');
                                    closeCalendar(true);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                    isDark
                                        ? 'text-[#9BA7B4] hover:bg-[#222933] hover:text-[#E6EDF3]'
                                        : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#181F26]'
                                }`}
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                data-date-picker-btn="true"
                                disabled={isTodayDisabled}
                                onClick={() => selectDate(today)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    isTodayDisabled
                                        ? 'opacity-40 cursor-not-allowed'
                                        : isDark
                                            ? 'text-[#5EEAD4] bg-[#2A9D8F]/15 hover:bg-[#2A9D8F]/25 cursor-pointer'
                                            : 'text-[#0E5B52] bg-[#0E5B52]/10 hover:bg-[#0E5B52]/15 cursor-pointer'
                                }`}
                            >
                                Today
                            </button>
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
