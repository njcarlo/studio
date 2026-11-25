'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

export const THEME_KEY = 'c2s_theme';
export type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    setTheme: () => {},
    toggleTheme: () => {},
});

function applyThemeToDom(t: Theme) {
    const root = document.documentElement;
    if (t === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('light');
    const themeRef = useRef<Theme>('light');

    // Sync from localStorage on mount without overwriting saved preference with initial default
    useEffect(() => {
        try {
            const stored = localStorage.getItem(THEME_KEY);
            if (stored === 'light' || stored === 'dark') {
                themeRef.current = stored;
                setThemeState(stored);
                applyThemeToDom(stored);
            }
        } catch { /* ignore */ }

        const onStorage = (e: StorageEvent) => {
            if (e.key === THEME_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
                themeRef.current = e.newValue;
                setThemeState(e.newValue);
                applyThemeToDom(e.newValue);
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const setTheme = useCallback((t: Theme) => {
        themeRef.current = t;
        setThemeState(t);
        applyThemeToDom(t);
        try {
            localStorage.setItem(THEME_KEY, t);
        } catch { /* ignore */ }
    }, []);

    const toggleTheme = useCallback(() => {
        const next: Theme = themeRef.current === 'light' ? 'dark' : 'light';
        setTheme(next);
    }, [setTheme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
