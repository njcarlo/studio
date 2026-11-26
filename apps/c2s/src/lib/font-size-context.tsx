'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export const FONT_SIZE_KEY = 'c2s_font_size_v2';
export const FONT_SIZE_MIN = 14;
export const FONT_SIZE_MAX = 20;
export const FONT_SIZE_DEFAULT = 16;

export const FONT_SIZE_PRESETS = [
    { key: 'small', label: 'Small', size: 14 },
    { key: 'default', label: 'Default', size: 16 },
    { key: 'large', label: 'Large', size: 18 },
    { key: 'xlarge', label: 'Extra Large', size: 20 },
] as const;

interface FontSizeContextType {
    fontSize: number;
    setFontSize: (size: number) => void;
}

const FontSizeContext = createContext<FontSizeContextType>({
    fontSize: FONT_SIZE_DEFAULT,
    setFontSize: () => {},
});

function applyRootFontSize(px: number) {
    if (typeof document === 'undefined') return;
    document.documentElement.style.fontSize = `${(px / 16) * 100}%`;
}

export function FontSizeProvider({ children }: { children: ReactNode }) {
    const [fontSize, setFontSizeState] = useState(FONT_SIZE_DEFAULT);

    // Load from localStorage on mount without overwriting stored value with initial default
    useEffect(() => {
        try {
            const stored = localStorage.getItem(FONT_SIZE_KEY);
            if (stored) {
                const parsed = Number(stored);
                if (!Number.isNaN(parsed)) {
                    const clamped = Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, parsed));
                    setFontSizeState(clamped);
                    applyRootFontSize(clamped);
                    return;
                }
            }
        } catch { /* ignore */ }
        applyRootFontSize(FONT_SIZE_DEFAULT);
    }, []);

    const setFontSize = useCallback((size: number) => {
        const clamped = Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, Math.round(size)));
        setFontSizeState(clamped);
        applyRootFontSize(clamped);
        try {
            localStorage.setItem(FONT_SIZE_KEY, String(clamped));
        } catch { /* ignore */ }
    }, []);

    return (
        <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
            {children}
        </FontSizeContext.Provider>
    );
}

export function useFontSize() {
    return useContext(FontSizeContext);
}
