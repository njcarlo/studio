import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@studio/ui";
import { IBM_Plex_Sans } from "next/font/google";
import { getTenantConfig, tenantBrandStyle, tenantDisplayName } from "@studio/core-engine/tenant";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-ibm-plex-sans",
});

const tenant = getTenantConfig();

export const metadata: Metadata = {
  title: tenantDisplayName(tenant),
  description: `${tenant.brandName} operations studio`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

import { AuthSync } from "./auth-sync";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { ChunkLoadRecovery } from "@/components/chunk-load-recovery";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={ibmPlexSans.variable} suppressHydrationWarning>
      <body className="font-body antialiased" style={tenantBrandStyle(tenant) as React.CSSProperties}>
        <ReactQueryProvider>
          <AuthSync>
            <ChunkLoadRecovery />
            {children}
            <Toaster />
          </AuthSync>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
