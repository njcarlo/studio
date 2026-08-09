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
        },
    },
    plugins: [require('tailwindcss-animate')],
} satisfies Config;
