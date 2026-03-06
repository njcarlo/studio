import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@studio/ui";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "COG App",
  description: "Church Operations and Governance App",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

import { AuthSync } from "./auth-sync";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-body antialiased">
        <AuthSync>
          {children}
          <Toaster />
        </AuthSync>
      </body>
    </html>
  );
}
