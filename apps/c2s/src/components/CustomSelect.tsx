'use client';

import React, {
    Children,
    isValidElement,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';

export interface CustomSelectOption {
    value: string;
    label: string;
    disabled?: boolean;
    group?: string;
}

export interface CustomSelectChangeEvent {
    target: { value: string; name?: string };
    currentTarget: { value: string; name?: string };
}

export interface CustomSelectProps {
    value?: string | number;
    defaultValue?: string | number;
    onChange?: (e: CustomSelectChangeEvent) => void;
    onValueChange?: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    options?: CustomSelectOption[];
    children?: React.ReactNode;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    id?: string;
    name?: string;
    className?: string;
    style?: React.CSSProperties;
    'aria-label'?: string;
}

function nodeToText(node: React.ReactNode): string {
    if (node === null || node === undefined || typeof node === 'boolean') return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(nodeToText).join('');
    if (isValidElement<{ children?: React.ReactNode }>(node)) {
        return nodeToText(node.props.children);
    }
    return '';
}

function parseChildrenOptions(children: React.ReactNode, groupLabel?: string): CustomSelectOption[] {
    const result: CustomSelectOption[] = [];
    Children.forEach(children, (child) => {
        if (!isValidElement(child)) return;

        if (child.type === React.Fragment) {
            const fragProps = child.props as { children?: React.ReactNode };
            result.push(...parseChildrenOptions(fragProps.children, groupLabel));
            return;
        }

        if (child.type === 'optgroup') {
            const props = child.props as { label?: string; children?: React.ReactNode };
            result.push(...parseChildrenOptions(props.children, props.label));
            return;
        }

        if (child.type === 'option') {
            const props = child.props as {
                value?: string | number;
                disabled?: boolean;
                children?: React.ReactNode;
            };
            const label = nodeToText(props.children).trim();
            const val = props.value !== undefined ? String(props.value) : label;
            result.push({
                value: val,
                label: label || val,
                disabled: Boolean(props.disabled),
                group: groupLabel,
            });
        }
    });
    return result;
}

const LAYOUT_TOKEN_RE =
    /^(?:(?:sm|md|lg|xl|2xl):)?(?:w-|min-w-|max-w-|flex-1$|shrink-0$|grow$|self-|col-span-|basis-)/;

export default function CustomSelect({
    value,
    defaultValue,
    onChange,
    onValueChange,
    onFocus,
    onBlur,
    options: propOptions,
    children,
    placeholder = 'Select an option',
    disabled = false,
    required = false,
    id,
    name,
    className = '',
    style,
    'aria-label': ariaLabel,
}: CustomSelectProps) {
    const generatedId = useId();
    const listboxId = `${id ?? generatedId}-listbox`;

    const parsedOptions = useMemo(() => {
        if (propOptions && propOptions.length > 0) return propOptions;
        return parseChildrenOptions(children);
    }, [propOptions, children]);

    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState<string>(() => {
        if (defaultValue !== undefined) return String(defaultValue);
        const firstEnabled = parsedOptions.find((o) => !o.disabled);
        return firstEnabled?.value ?? '';
    });

    const currentValue = isControlled ? String(value) : internalValue;

    const selectedOption = useMemo(
        () => parsedOptions.find((o) => o.value === currentValue),
        [parsedOptions, currentValue],
    );

    const [isOpen, setIsOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [highlightedIdx, setHighlightedIdx] = useState<number>(-1);
    const [mounted, setMounted] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [menuRect, setMenuRect] = useState<{
        top?: number;
        bottom?: number;
        left: number;
        width: number;
        maxHeight: number;
    }>({ top: 0, left: 0, width: 200, maxHeight: 260 });

    const wrapperRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const typeBufferRef = useRef('');
    const typeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Split outer width/grid sizing tokens from className so trigger fits cleanly
    const wrapperLayoutClasses = useMemo(() => {
        return className
            .split(/\s+/)
            .filter((tok) => LAYOUT_TOKEN_RE.test(tok))
            .join(' ');
    }, [className]);

    function updatePosition() {
        const el = triggerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        const gap = 6; // mt-1.5
        const spaceBelow = vh - rect.bottom - gap - 12;
        const spaceAbove = rect.top - gap - 12;
        const openUpward = spaceBelow < 190 && spaceAbove > spaceBelow;
        const maxHeight = Math.max(120, Math.min(272, openUpward ? spaceAbove : spaceBelow));
        const safeWidth = Math.min(Math.max(rect.width, 160), vw - 24);
        const clampedLeft = Math.max(12, Math.min(rect.left, vw - safeWidth - 12));

        const darkActive =
            document.documentElement.classList.contains('dark') &&
            !wrapperRef.current?.closest('.force-light');
        setIsDark(Boolean(darkActive));

        if (openUpward) {
            setMenuRect({
                bottom: vh - rect.top + gap,
                left: clampedLeft,
                width: safeWidth,
                maxHeight,
            });
        } else {
            setMenuRect({
                top: rect.bottom + gap,
                left: clampedLeft,
                width: safeWidth,
                maxHeight,
            });
        }
    }

    function openMenu() {
        if (disabled || parsedOptions.length === 0) return;
        updatePosition();
        const currentIdx = parsedOptions.findIndex((o) => o.value === currentValue && !o.disabled);
        const fallbackIdx = parsedOptions.findIndex((o) => !o.disabled);
        setHighlightedIdx(currentIdx >= 0 ? currentIdx : fallbackIdx);
        setIsOpen(true);
    }

    function closeMenu(restoreFocus = false) {
        setIsOpen(false);
        if (restoreFocus) triggerRef.current?.focus();
    }

    function selectValue(nextVal: string) {
        if (!isControlled) setInternalValue(nextVal);
        if (onChange) {
            const synthetic = {
                target: { value: nextVal, name },
                currentTarget: { value: nextVal, name },
            };
            onChange(synthetic);
        }
        if (onValueChange) onValueChange(nextVal);
        closeMenu(true);
    }

    useEffect(() => {
        if (!isOpen) return;

        function handleDocMouseDown(e: MouseEvent) {
            const target = e.target as Node;
            if (
                wrapperRef.current?.contains(target) ||
                popoverRef.current?.contains(target)
            ) {
                return;
            }
            closeMenu(false);
        }

        function handleScrollOrResize() {
            updatePosition();
        }

        document.addEventListener('mousedown', handleDocMouseDown);
        window.addEventListener('resize', handleScrollOrResize);
        window.addEventListener('scroll', handleScrollOrResize, true);
        return () => {
            document.removeEventListener('mousedown', handleDocMouseDown);
            window.removeEventListener('resize', handleScrollOrResize);
            window.removeEventListener('scroll', handleScrollOrResize, true);
        };
    }, [isOpen]);

    function moveHighlight(step: 1 | -1) {
        if (parsedOptions.length === 0) return;
        let idx = highlightedIdx;
        for (let i = 0; i < parsedOptions.length; i++) {
            idx = (idx + step + parsedOptions.length) % parsedOptions.length;
            if (!parsedOptions[idx].disabled) {
                setHighlightedIdx(idx);
                const optEl = popoverRef.current?.querySelector<HTMLElement>(`[data-opt-idx="${idx}"]`);
                optEl?.scrollIntoView({ block: 'nearest' });
                return;
            }
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
        if (disabled) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isOpen) {
                openMenu();
            } else {
                moveHighlight(1);
            }
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (!isOpen) {
                openMenu();
            } else {
                moveHighlight(-1);
            }
            return;
        }
        if (e.key === 'Home' && isOpen) {
            e.preventDefault();
            const first = parsedOptions.findIndex((o) => !o.disabled);
            if (first >= 0) setHighlightedIdx(first);
            return;
        }
        if (e.key === 'End' && isOpen) {
            e.preventDefault();
            for (let i = parsedOptions.length - 1; i >= 0; i--) {
                if (!parsedOptions[i].disabled) {
                    setHighlightedIdx(i);
                    break;
                }
            }
            return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isOpen) {
                openMenu();
            } else if (highlightedIdx >= 0 && parsedOptions[highlightedIdx] && !parsedOptions[highlightedIdx].disabled) {
                selectValue(parsedOptions[highlightedIdx].value);
            } else {
                closeMenu(true);
            }
            return;
        }
        if (e.key === 'Escape' && isOpen) {
            e.preventDefault();
            closeMenu(true);
            return;
        }
        if (e.key === 'Tab' && isOpen) {
            closeMenu(false);
            return;
        }
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            typeBufferRef.current += e.key.toLowerCase();
            if (typeTimerRef.current) clearTimeout(typeTimerRef.current);
            typeTimerRef.current = setTimeout(() => {
                typeBufferRef.current = '';
            }, 500);

            const matchIdx = parsedOptions.findIndex(
                (o) => !o.disabled && o.label.toLowerCase().startsWith(typeBufferRef.current),
            );
            if (matchIdx >= 0) {
                if (!isOpen) {
                    selectValue(parsedOptions[matchIdx].value);
                } else {
                    setHighlightedIdx(matchIdx);
                    const optEl = popoverRef.current?.querySelector<HTMLElement>(`[data-opt-idx="${matchIdx}"]`);
                    optEl?.scrollIntoView({ block: 'nearest' });
                }
            }
        }
    }

    const displayLabel = selectedOption ? selectedOption.label : placeholder;
    const isPlaceholder = !selectedOption || (selectedOption.value === '' && selectedOption.disabled);

    return (
        <div
            ref={wrapperRef}
            className={`relative ${wrapperLayoutClasses || 'inline-block'}`}
            style={style}
        >
            {required && (
                <input
                    type="text"
                    tabIndex={-1}
                    aria-hidden="true"
                    required
                    value={currentValue}
                    onChange={() => {}}
                    className="sr-only pointer-events-none"
                />
            )}
            <button
                ref={triggerRef}
                id={id}
                type="button"
                data-custom-select="true"
                role="combobox"
                aria-label={ariaLabel}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-controls={listboxId}
                disabled={disabled}
                onClick={() => (isOpen ? closeMenu(false) : openMenu())}
                onFocus={() => {
                    setIsFocused(true);
                    onFocus?.();
                }}
                onBlur={() => {
                    setIsFocused(false);
                    onBlur?.();
                }}
                onKeyDown={handleKeyDown}
                className={`w-full flex items-center justify-between gap-2.5 bg-white dark:bg-[#1E293B] rounded-xl border px-3.5 py-2 text-sm text-left transition-all duration-150 select-none ${
                    disabled
                        ? 'opacity-55 cursor-not-allowed border-[#E7E5E4] dark:border-[#334155]'
                        : isOpen || isFocused
                            ? 'border-[#D97706] ring-2 ring-[#FEF3C7] dark:border-[#F59E0B] dark:ring-[#D97706]/25 cursor-pointer'
                            : 'border-[#E7E5E4] dark:border-[#334155] hover:border-[#D6D3D1] dark:hover:border-slate-500 cursor-pointer'
                }`}
            >
                <span
                    className={`truncate ${
                        isPlaceholder
                            ? 'text-[#6B665F] dark:text-slate-400'
                            : 'text-[#292524] dark:text-slate-100 font-medium'
                    }`}
                >
                    {displayLabel}
                </span>
                <svg
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        isOpen
                            ? 'rotate-180 text-[#D97706] dark:text-[#F59E0B]'
                            : 'text-[#6B665F] dark:text-slate-400'
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {mounted &&
                isOpen &&
                createPortal(
                    <div
                        ref={popoverRef}
                        id={listboxId}
                        role="listbox"
                        className={`fixed z-[12000] rounded-xl border p-1.5 shadow-lg shadow-stone-900/5 overflow-y-auto ${
                            isDark
                                ? 'bg-[#1E293B] border-[#334155] shadow-black/40'
                                : 'bg-white border-[#E7E5E4]'
                        }`}
                        style={{
                            top: menuRect.top,
                            bottom: menuRect.bottom,
                            left: menuRect.left,
                            width: menuRect.width,
                            maxHeight: menuRect.maxHeight,
                        }}
                    >
                        {parsedOptions.map((opt, idx) => {
                            const prevGroup = idx > 0 ? parsedOptions[idx - 1].group : undefined;
                            const showGroupHeader = Boolean(opt.group && opt.group !== prevGroup);
                            const isSelected = opt.value === currentValue && !opt.disabled;
                            const isHighlighted = idx === highlightedIdx;

                            return (
                                <React.Fragment key={`${opt.value}-${idx}`}>
                                    {showGroupHeader && (
                                        <div
                                            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                                                isDark ? 'text-slate-400' : 'text-[#6B665F]'
                                            } ${idx > 0 ? 'mt-1 pt-2 border-t border-[#EFECE6] dark:border-slate-700' : ''}`}
                                        >
                                            {opt.group}
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        role="option"
                                        data-opt-idx={idx}
                                        data-custom-select="true"
                                        aria-selected={isSelected}
                                        disabled={opt.disabled}
                                        onMouseEnter={() => !opt.disabled && setHighlightedIdx(idx)}
                                        onClick={() => !opt.disabled && selectValue(opt.value)}
                                        className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-left transition-colors ${
                                            opt.disabled
                                                ? 'opacity-45 cursor-not-allowed text-[#6B665F]'
                                                : isSelected
                                                    ? isDark
                                                        ? 'bg-[#D97706]/20 text-[#FBBF24] font-medium cursor-pointer'
                                                        : 'bg-[#FEF3C7] text-[#92400E] font-medium cursor-pointer'
                                                    : isHighlighted
                                                        ? isDark
                                                            ? 'bg-white/10 text-slate-100 cursor-pointer'
                                                            : 'bg-[#F5F2EC] text-[#292524] cursor-pointer'
                                                        : isDark
                                                            ? 'text-slate-100 hover:bg-white/10 cursor-pointer'
                                                            : 'text-[#292524] hover:bg-[#F5F2EC] cursor-pointer'
                                        }`}
                                    >
                                        <span className="truncate">{opt.label}</span>
                                        {isSelected && (
                                            <svg
                                                className={`w-4 h-4 shrink-0 ${
                                                    isDark ? 'text-[#FBBF24]' : 'text-[#92400E]'
                                                }`}
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth={2.4}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </button>
                                </React.Fragment>
                            );
                        })}
                    </div>,
                    document.body,
                )}
        </div>
    );
}
