'use client';

import { useEffect } from 'react';
import { errorEmitter, FirestorePermissionError } from '@studio/database';
import { useAuthStore } from '@studio/store';
import { useToast } from '@/hooks/use-toast';

/**
 * Listens for globally emitted Firestore permission errors and surfaces them as toasts.
 * Silently ignores errors when the user is not authenticated.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();
  const { user, isUserLoading } = useAuthStore();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      if (isUserLoading || !user) return;
      console.error('Permission error:', error.message);
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'You do not have permission to perform this action.',
      });
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [user, isUserLoading, toast]);

  return null;
}
