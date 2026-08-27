import type { Config } from 'tailwindcss';

export default {
    darkMode: ['class'],
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Church of God brand colors (matched from screenshot)
                'cog-red': '#e03131',       // logo red
                'cog-dark': '#1a1a2e',
                'cog-navy': '#0f172a',      // dark footer/hero bg
                'c2s-teal': '#2dc7be',      // primary brand teal (C2S logo, buttons)
                'c2s-teal-dark': '#1fa89f', // hover state
                'c2s-coral': '#f03e5f',     // "Find a Group" CTA button
                'c2s-coral-dark': '#d42f52',
                'c2s-orange': '#f59e0b',    // "2" in c2s logo accent
                'c2s-card-bg': '#f8f9fc',   // subtle off-white card bg
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            fontSize: {
                // Elderly & Senior Accessibility Scale (+20-25% increased legibility)
                'xs': ['0.9375rem', { lineHeight: '1.35rem' }],  // ~15px (was 12px)
                'sm': ['1.0625rem', { lineHeight: '1.45rem' }],  // ~17px (was 14px)
                'base': ['1.2rem', { lineHeight: '1.65rem' }],   // ~19.2px (was 16px)
                'lg': ['1.35rem', { lineHeight: '1.8rem' }],     // ~21.6px (was 18px)
                'xl': ['1.5rem', { lineHeight: '1.95rem' }],     // ~24px (was 20px)
                '2xl': ['1.8rem', { lineHeight: '2.2rem' }],     // ~28.8px (was 24px)
                '3xl': ['2.25rem', { lineHeight: '2.5rem' }],   // ~36px (was 30px)
                '4xl': ['2.7rem', { lineHeight: '2.9rem' }],     // ~43.2px (was 36px)
                '5xl': ['3.5rem', { lineHeight: '1.15' }],       // ~56px (was 48px)
                '6xl': ['4.25rem', { lineHeight: '1.15' }],      // ~68px (was 60px)
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
} satisfies Config;
