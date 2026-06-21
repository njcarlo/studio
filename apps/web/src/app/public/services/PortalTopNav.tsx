"use client";

import Link from "next/link";
import { CalendarDays, LogIn } from "lucide-react";
import { Button } from "@studio/ui";
import { useAuthStore } from "@studio/store";

export function PortalTopNav() {
    const { user, isUserLoading } = useAuthStore();

    return (
        <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur-sm">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
                <Link href="/public/services" className="flex items-center gap-2 font-semibold text-gray-800">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    COG Dasma Schedule Portal
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
