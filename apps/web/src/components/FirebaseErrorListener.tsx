'use client';

import { useEffect } from 'react';
import { errorEmitter, FirestorePermissionError, useUser } from '@studio/database';
import { useToast } from '@/hooks/use-toast';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * When the user IS authenticated, it shows a toast notification.
 * When unauthenticated, permission errors are expected and silently ignored.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Ignore permission errors that occur before the user is authenticated.
      // These are expected (e.g., pre-auth Firestore reads hitting the rules wall)
      // and do NOT indicate a real problem.
      if (isUserLoading || !user) return;

      // Only surface the error as a toast when logged in — something actually went wrong.
      console.error('Firestore permission error:', error.message);
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

  // This component renders nothing.
  return null;
}
