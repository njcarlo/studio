"use client";

import Link from "next/link";
import Image from "next/image";
import { LogIn } from "lucide-react";
import { Button } from "@studio/ui";
import { useAuthStore } from "@studio/store";
import { getTenantConfig, tenantDisplayName } from "@studio/core-engine/tenant";

export function PortalTopNav() {
    const { user, isUserLoading } = useAuthStore();
    const tenant = getTenantConfig();
    const brand = tenantDisplayName(tenant);
    const logoSrc = tenant.logoUrl || "/cog-logo.png";

    return (
        <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur-sm">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
                <Link href="/public/services" className="flex items-center gap-2 font-semibold text-gray-800">
                    <Image
                        src={logoSrc}
                        alt={brand}
                        width={20}
                        height={20}
                        className="h-5 w-5"
                    />
                    {brand} Schedule Portal
                </Link>

                {!isUserLoading && (
                    user ? (
                        <Link href="/dashboard">
                            <Button variant="outline" size="sm">My Dashboard</Button>
                        </Link>
                    ) : (
                        <Link href="/login?next=/public/services">
                            <Button size="sm"><LogIn className="mr-1.5 h-4 w-4" /> Log in</Button>
                        </Link>
                    )
                )}
            </div>
        </header>
    );
}
