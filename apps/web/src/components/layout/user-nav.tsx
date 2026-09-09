"use client";

import React from "react";
import { Avatar, AvatarFallback } from "@studio/ui";
import { Button } from "@studio/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@studio/ui";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { supabase } from "@studio/database";
import { useAuthStore } from "@studio/store";
import { useUserRole } from "@/hooks/use-user-role";
import { useImpersonation } from "@/hooks/use-impersonation";
import { LogOut, UserCircle, ChevronDown, QrCode, KeyRound, User } from "lucide-react";

export function UserNav() {
  const { user } = useAuthStore();
  const { workerProfile, allRoles, isSuperAdmin, isMinistryHead } = useUserRole();
  const { toast } = useToast();
  const { impersonatedWorkerId, stopImpersonation } = useImpersonation();

  const handleLogout = async () => {
    if (impersonatedWorkerId) {
      stopImpersonation();
      return;
    }
    await supabase.auth.signOut();
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your inbox to reset your password.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send password reset email.",
      });
    }
  };

  const initial =
    workerProfile?.firstName?.[0]?.toUpperCase() ||
    user?.displayName?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "S";

  const displayName =
    workerProfile?.firstName && workerProfile?.lastName
      ? `${workerProfile.firstName} ${workerProfile.lastName}`
      : workerProfile?.firstName || user?.displayName || user?.email?.split("@")[0] || "System Admin";

  // Resolve role title
  const roleName = isSuperAdmin
    ? "Administrator"
    : allRoles?.find((r: any) => r.id === workerProfile?.roleId)?.name ||
      (workerProfile as any)?.role ||
      "Administrator";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 p-1 sm:px-2 rounded-lg hover:bg-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer select-none"
        >
          {/* Avatar circle */}
          <div className="h-7.5 w-7.5 sm:h-8 sm:w-8 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white font-bold flex items-center justify-center text-xs shadow-sm shrink-0">
            {initial}
          </div>

          {/* User info */}
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs sm:text-[13px] font-bold text-foreground leading-tight">
              {displayName}
            </span>
            <span className="text-[11px] text-muted-foreground leading-tight font-normal">
              {roleName}
            </span>
          </div>

          {/* Down Chevron */}
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0 ml-0.5" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56 mt-1.5 shadow-lg rounded-xl" align="end" forceMount>
        <DropdownMenuLabel className="font-normal sm:hidden">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {roleName}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="sm:hidden" />

        <DropdownMenuGroup>
          {impersonatedWorkerId ? (
            <DropdownMenuItem onSelect={stopImpersonation} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Exit Impersonation</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/profile" className="flex items-center">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/workers/my-qr" className="flex items-center">
              <QrCode className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>My QR Code</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={handleChangePassword} className="cursor-pointer">
            <KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Change Password</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
