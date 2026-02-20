"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { signOut, sendPasswordResetEmail } from "firebase/auth";
import type { Worker as AppWorker } from "@/lib/types";
import { doc } from 'firebase/firestore';
import { useImpersonation } from "@/hooks/use-impersonation";
import { LogOut } from "lucide-react";


export function UserNav() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { impersonatedWorkerId, stopImpersonation } = useImpersonation();

  const workerProfileRef = useMemoFirebase(() => user ? doc(firestore, 'workers', impersonatedWorkerId || user.uid) : null, [firestore, user, impersonatedWorkerId]);
  const { data: workerProfile } = useDoc<AppWorker>(workerProfileRef);

  const handleLogout = () => {
    if (impersonatedWorkerId) {
      stopImpersonation();
    }
    signOut(auth);
  };

  const handleChangePassword = async () => {
    if (!user || !user.email) return;

    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({
        title: 'Password Reset Email Sent',
        description: 'Please check your inbox to reset your password.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send password reset email.',
      });
    }
  };

  const displayName = (workerProfile?.firstName && workerProfile?.lastName)
    ? `${workerProfile.firstName} ${workerProfile.lastName}`
    : user?.email;

  const altText = displayName || 'User';

  const fallbackChar = (workerProfile?.firstName || user?.email || 'U').charAt(0).toUpperCase();


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={workerProfile?.avatarUrl} alt={altText} />
            <AvatarFallback>{fallbackChar}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              Role: {workerProfile?.roleId || 'N/A'}
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
            <DropdownMenuItem>
              Profile
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={handleChangePassword}>
            Change Password
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
