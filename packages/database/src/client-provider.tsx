'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './index';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './query-client';
import { User, AuthError } from 'firebase/auth';

interface FirebaseClientProviderProps {
  children: ReactNode;
  onAuthChange?: (user: User | null, isLoading: boolean, error: AuthError | Error | null) => void;
}

export function FirebaseClientProvider({ children, onAuthChange }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseProvider
        firebaseApp={firebaseServices.firebaseApp}
        auth={firebaseServices.auth}
        firestore={firebaseServices.firestore}
        onAuthChange={onAuthChange}
      >
        {children}
      </FirebaseProvider>
    </QueryClientProvider>
  );
}
