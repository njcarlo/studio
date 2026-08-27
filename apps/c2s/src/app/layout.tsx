import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { FontSizeProvider } from '@/lib/font-size-context';
import { ThemeProvider } from '@/lib/theme-context';
import { SatelliteProvider } from '@/lib/satellite-context';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={inter.variable}>
            <body className={inter.className}>
                <AuthProvider>
                    <ThemeProvider>
                        <FontSizeProvider>
                            <SatelliteProvider>
                                {children}
                            </SatelliteProvider>
                        </FontSizeProvider>
                    </ThemeProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
