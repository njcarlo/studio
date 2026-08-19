'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

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

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('light');

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(THEME_KEY) as Theme | null;
            if (stored === 'light' || stored === 'dark') {
                setThemeState(stored);
            }
        } catch { /* ignore */ }
    }, []);

    // Apply theme class to <html> and persist
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch { /* ignore */ }
    }, [theme]);

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
