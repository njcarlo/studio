'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export const FONT_SIZE_KEY = 'c2s_font_size_v2';
export const FONT_SIZE_MIN = 12;
export const FONT_SIZE_MAX = 24;
export const FONT_SIZE_DEFAULT = 18;

interface FontSizeContextType {
    fontSize: number;
    setFontSize: (size: number) => void;
}

const FontSizeContext = createContext<FontSizeContextType>({
    fontSize: FONT_SIZE_DEFAULT,
    setFontSize: () => {},
});

export function FontSizeProvider({ children }: { children: ReactNode }) {
    const [fontSize, setFontSizeState] = useState(FONT_SIZE_DEFAULT);

    // Load from localStorage on mount without overwriting stored value with initial default
    useEffect(() => {
        try {
            const stored = localStorage.getItem(FONT_SIZE_KEY);
            if (stored) {
                const parsed = Number(stored);
                if (!isNaN(parsed) && parsed >= FONT_SIZE_MIN && parsed <= FONT_SIZE_MAX) {
                    setFontSizeState(parsed);
                    document.documentElement.style.fontSize = `${(parsed / 16) * 100}%`;
                    return;
                }
            }
        } catch { /* ignore */ }
        document.documentElement.style.fontSize = `${(FONT_SIZE_DEFAULT / 16) * 100}%`;
    }, []);

    const setFontSize = useCallback((size: number) => {
        const clamped = Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, size));
        setFontSizeState(clamped);
        document.documentElement.style.fontSize = `${(clamped / 16) * 100}%`;
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
