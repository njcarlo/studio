import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { FontSizeProvider } from '@/lib/font-size-context';
import { getC2SUser } from '@/lib/auth';

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    // Resolved per request from the session cookie — the client never stores it.
    const user = await getC2SUser();

    return (
        <html lang="en" className={inter.variable}>
            <body className={inter.className}>
                <AuthProvider user={user}>
                    <FontSizeProvider>
                        {children}
                    </FontSizeProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
