"use client";

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@studio/ui';
import { supabase } from '@studio/database';
import { useAuthStore } from '@studio/store';
import { useUserRole } from '@/hooks/use-user-role';
import { useToast } from '@/hooks/use-toast';
import { updateWorker } from '@/actions/db';

export function PasswordChangeDialog() {
  const { user } = useAuthStore();
  const { workerProfile, isSuperAdmin } = useUserRole();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(
    workerProfile?.passwordChangeRequired === true && !isSuperAdmin,
  );

  const handleSendEmail = async () => {
    if (!user?.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;

      toast({
        title: 'Password Reset Email Sent',
        description: 'Please check your inbox to reset your password.',
      });

      // Clear the flag in the SQL worker profile
      if (workerProfile?.id) {
        await updateWorker(workerProfile.id, { passwordChangeRequired: false });
      }
      setIsOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send password reset email.',
      });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change Your Password</AlertDialogTitle>
          <AlertDialogDescription>
            For your security, we require you to change your password. We will send a password reset link to your email address.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsOpen(false)}>Later</AlertDialogCancel>
          <AlertDialogAction onClick={handleSendEmail}>Send Reset Email</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
