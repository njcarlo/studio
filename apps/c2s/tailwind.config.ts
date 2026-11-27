import type { Config } from 'tailwindcss';

export default {
    darkMode: ['class'],
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './src/lib/**/*.{js,ts,jsx,tsx}',
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
                sans: ['var(--font-plus-jakarta)', 'var(--font-inter)', 'Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
            },
            fontSize: {
                // Standardized rem typography scale (100% root = 16px)
                'xs': ['0.75rem', { lineHeight: '1.125rem' }],   // 12px
                'sm': ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
                'base': ['1rem', { lineHeight: '1.5rem' }],      // 16px
                'lg': ['1.125rem', { lineHeight: '1.625rem' }],  // 18px
                'xl': ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
                '2xl': ['1.5rem', { lineHeight: '2rem' }],       // 24px
                '3xl': ['1.875rem', { lineHeight: '2.25rem' }],  // 30px
                '4xl': ['2.25rem', { lineHeight: '2.5rem' }],    // 36px
                '5xl': ['3rem', { lineHeight: '1.15' }],         // 48px
                '6xl': ['3.75rem', { lineHeight: '1.1' }],       // 60px
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
} satisfies Config;
