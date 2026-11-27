'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export const THEME_KEY = 'c2s_theme';
export type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    setTheme: () => { },
    toggleTheme: () => { },
});

function isAccountPath(pathname: string | null | undefined): boolean {
    return Boolean(pathname && pathname.startsWith('/dashboard'));
}

function applyThemeToDom(t: Theme) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.dataset.theme = t;
    root.style.colorScheme = t;
    if (t === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isAccountRoute = isAccountPath(pathname);
    const [theme, setThemeState] = useState<Theme>('light');
    const themeRef = useRef<Theme>('light');

    // Only apply dark mode inside authenticated /dashboard account routes; keep C2S Finder & public routes strictly light
    useEffect(() => {
        try {
            const stored = localStorage.getItem(THEME_KEY);
            const resolved: Theme = stored === 'dark' || stored === 'light' ? stored : 'light';
            themeRef.current = resolved;
            setThemeState(resolved);
            applyThemeToDom(isAccountRoute ? resolved : 'light');
        } catch {
            applyThemeToDom('light');
        }

        const onStorage = (e: StorageEvent) => {
            if (e.key === THEME_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
                themeRef.current = e.newValue;
                setThemeState(e.newValue);
                applyThemeToDom(isAccountPath(window.location.pathname) ? e.newValue : 'light');
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [isAccountRoute]);

    const setTheme = useCallback((t: Theme) => {
        themeRef.current = t;
        setThemeState(t);
        applyThemeToDom(isAccountPath(pathname) ? t : 'light');
        try {
            localStorage.setItem(THEME_KEY, t);
        } catch { /* ignore */ }
    }, [pathname]);

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
