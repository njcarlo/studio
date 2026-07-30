import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={inter.variable}>
            <body className={inter.className}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
