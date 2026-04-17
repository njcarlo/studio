"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@studio/ui";
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
import { LogOut } from "lucide-react";

export function UserNav() {
  const { user } = useAuthStore();
  const { workerProfile, allRoles } = useUserRole();
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

  const displayName =
    workerProfile?.firstName && workerProfile?.lastName
      ? `${workerProfile.firstName} ${workerProfile.lastName}`
      : user?.email?.split("@")[0] || "User";

  const fallbackChar = (workerProfile?.firstName || user?.email || "U")
    .charAt(0)
    .toUpperCase();

  const roleName = workerProfile?.roleId
    ? (allRoles?.find((r: any) => r.id === workerProfile.roleId)?.name ?? workerProfile.roleId)
    : "N/A";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={workerProfile?.avatarUrl} alt={displayName} />
            <AvatarFallback>{fallbackChar}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              Role: {roleName}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {impersonatedWorkerId ? (
            <DropdownMenuItem onSelect={stopImpersonation}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Exit Impersonation</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild>
              <Link href="/profile">Profile</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href="/workers/my-qr">My QR Code</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleChangePassword}>
            Change Password
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
