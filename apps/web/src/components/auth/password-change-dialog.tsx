"use client";

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@studio/ui';
import { Button, Input, Label } from '@studio/ui';
import { supabase } from '@studio/database';
import { useUserRole } from '@/hooks/use-user-role';
import { useToast } from '@/hooks/use-toast';
import { updateWorker } from '@/actions/db';

export function PasswordChangeDialog() {
  const { workerProfile, isSuperAdmin } = useUserRole();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(
    workerProfile?.passwordChangeRequired === true && !isSuperAdmin,
  );
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (newPassword.length < 8) {
      toast({ variant: 'destructive', title: 'Too short', description: 'Password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirm) {
      toast({ variant: 'destructive', title: 'Mismatch', description: 'Passwords do not match.' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      if (workerProfile?.id) {
        await updateWorker(workerProfile.id, { passwordChangeRequired: false });
      }
      toast({ title: 'Password Updated', description: 'Your password has been changed successfully.' });
      setIsOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update password.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={() => {}}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Set Your Password</AlertDialogTitle>
          <AlertDialogDescription>
            Your account was created with a temporary password. Please set a new password to continue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 8 characters" />
          </div>
          <div className="space-y-1">
            <Label>Confirm Password</Label>
            <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" />
          </div>
        </div>
        <AlertDialogFooter>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Set Password'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
