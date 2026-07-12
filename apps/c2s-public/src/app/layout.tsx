import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import {
  getTenantConfig,
  c2sPublicUrl,
  tenantBrandStyle,
  tenantDisplayName,
} from '@studio/core-engine/tenant';

const tenant = getTenantConfig();
const canonical = c2sPublicUrl(tenant);

export const metadata: Metadata = {
  title: `${tenantDisplayName(tenant)} · C2S Group Finder`,
  description: 'Find a Connect2Souls group near you',
  metadataBase: new URL(canonical),
  alternates: { canonical },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={tenantBrandStyle(tenant) as React.CSSProperties}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
