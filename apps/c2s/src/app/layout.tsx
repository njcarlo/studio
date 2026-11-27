import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { FontSizeProvider } from '@/lib/font-size-context';
import { ThemeProvider } from '@/lib/theme-context';
import { ConfirmProvider } from '@/lib/confirm-context';
import { SatelliteProvider } from '@/lib/satellite-context';

const plusJakarta = Plus_Jakarta_Sans({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    variable: '--font-plus-jakarta',
    display: 'swap',
});

const inter = Inter({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '900'],
    variable: '--font-inter',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Church of God Dasmarinas',
    description: 'Church Online — Live, Worship, and Connect',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    viewportFit: 'cover',
};

const THEME_INIT_SCRIPT = `(function(){try{var isAcc=window.location.pathname.indexOf('/dashboard')===0;var t=isAcc&&localStorage.getItem('c2s_theme')==='dark'?'dark':'light';var r=document.documentElement;r.dataset.theme=t;r.style.colorScheme=t;if(t==='dark'){r.classList.add('dark');}else{r.classList.remove('dark');}}catch(e){}})();`;
const FONT_SIZE_INIT_SCRIPT = `(function(){try{var s=Number(localStorage.getItem('c2s_font_size_v2'));if(!isNaN(s)&&s>=14&&s<=20){document.documentElement.style.fontSize=(s/16*100)+'%';}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${plusJakarta.variable} ${inter.variable}`} suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT + FONT_SIZE_INIT_SCRIPT }} />
            </head>
            <body className={plusJakarta.className}>
                <AuthProvider>
                    <ThemeProvider>
                        <FontSizeProvider>
                            <SatelliteProvider>
                                <ConfirmProvider>
                                    {children}
                                </ConfirmProvider>
                            </SatelliteProvider>
                        </FontSizeProvider>
                    </ThemeProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
