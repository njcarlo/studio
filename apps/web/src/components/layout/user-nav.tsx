"use client";

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
import { useQuery } from "@tanstack/react-query";
import { getMinistries, getC2SGroups } from "@/actions/db";
import { LogOut, UserCircle } from "lucide-react";

export function UserNav() {
  const { user } = useAuthStore();
  const { workerProfile, allRoles, isSuperAdmin, isMinistryHead } = useUserRole();
  const { toast } = useToast();
  const { impersonatedWorkerId, stopImpersonation } = useImpersonation();

  const { data: allMinistries } = useQuery({
    queryKey: ["ministries"],
    queryFn: getMinistries,
  });

  const { data: c2sGroups } = useQuery({
    queryKey: ["c2s-groups"],
    queryFn: getC2SGroups,
  });

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

  // Resolve role name from ID
  const roleName = isSuperAdmin
    ? "Super Admin"
    : allRoles?.find((r: any) => r.id === workerProfile?.roleId)?.name || "Worker";

  const userMinistry = allMinistries?.find(
    (m: any) =>
      m.id === workerProfile?.majorMinistryId ||
      m.headId === workerProfile?.id ||
      m.approverId === workerProfile?.id
  );
  const headDept = userMinistry?.department || "Outreach";

  const rawRole = (allRoles?.find((r: any) => r.id === workerProfile?.roleId)?.name || "").toLowerCase();
  const isHead = isMinistryHead || rawRole.includes("head") || Boolean(allMinistries && workerProfile?.id && allMinistries.some((m: any) => m.headId === workerProfile.id));

  let indicatorBadge = "";
  if (isSuperAdmin) {
    indicatorBadge = "Super Admin • All Departments";
  } else if (isHead) {
    indicatorBadge = `Ministry Head • ${headDept}`;
  } else {
    const assignedGroup = c2sGroups?.find((g: any) => g.mentorId === workerProfile?.id);
    const clusterLabel = assignedGroup?.name || userMinistry?.name || "Outreach Cluster 4";
    indicatorBadge = `Mentor • ${clusterLabel}`;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex flex-col items-end text-right">
        <span className="text-xs font-semibold text-foreground leading-tight">{displayName}</span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 border ${
          isSuperAdmin
            ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"
            : isHead
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
            : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
        }`}>
          {indicatorBadge}
        </span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarFallback>
                <UserCircle className="h-6 w-6 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold leading-none">{displayName}</p>
              <p className="text-xs font-medium text-primary">
                {indicatorBadge}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {user?.email}
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
  </div>
  );
}
