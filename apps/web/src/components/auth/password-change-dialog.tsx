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
import { useAuth, useUser, useFirestore, updateDocumentNonBlocking } from '@studio/database';
import { useUserRole } from '@/hooks/use-user-role';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordResetEmail } from 'firebase/auth';
import { doc } from 'firebase/firestore';

export function PasswordChangeDialog() {
  const { user } = useUser();
  const { workerProfile, isSuperAdmin } = useUserRole();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // We use local state to control visibility so the dialog can be dismissed for the session
  const [isOpen, setIsOpen] = useState(workerProfile?.passwordChangeRequired === true && !isSuperAdmin);

  const handleSendEmail = async () => {
    if (!user || !user.email) return;

    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({
        title: 'Password Reset Email Sent',
        description: 'Please check your inbox to reset your password.',
      });
      // After sending, update the profile to not prompt again and close the dialog
      if (user) {
        const userDocRef = doc(firestore, 'workers', user.uid);
        await updateDocumentNonBlocking(userDocRef, { passwordChangeRequired: false });
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

  const handleClose = () => {
    setIsOpen(false);
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
          <AlertDialogCancel onClick={handleClose}>Later</AlertDialogCancel>
          <AlertDialogAction onClick={handleSendEmail}>Send Reset Email</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
