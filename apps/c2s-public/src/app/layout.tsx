import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { getTenantConfig } from '@studio/core-engine';

const tenant = getTenantConfig();

export const metadata: Metadata = {
  title: `${tenant.shortName ?? tenant.brandName} · C2S Group Finder`,
  description: 'Find a Connect2Souls group near you',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const brandStyle = tenant.primaryColor
    ? ({ ['--brand' as string]: tenant.primaryColor } as React.CSSProperties)
    : undefined;

  return (
    <html lang="en">
      <body style={brandStyle}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
