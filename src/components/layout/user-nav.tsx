
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
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Link from "next/link";
import { useAuth, useUser } from "@/firebase";
import { getAuth, signOut, sendPasswordResetEmail } from "firebase/auth";
import { useUserRole } from "@/hooks/use-user-role";

const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar');

export function UserNav() {
  const { user } = useUser();
  const { userProfile, isSuperAdmin } = useUserRole();
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogout = () => {
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


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
             <AvatarImage src={userProfile?.avatarUrl || userAvatar?.imageUrl} alt={userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : "User"} />
            <AvatarFallback>{userProfile?.firstName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || 'No email'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            Profile
          </DropdownMenuItem>
          {!isSuperAdmin && (
             <DropdownMenuItem onSelect={handleChangePassword}>
              Change Password
            </DropdownMenuItem>
          )}
          {isSuperAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
