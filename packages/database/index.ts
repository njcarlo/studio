// This file is a shared entry point for both server and client components.
// Individual files (like src/index.ts) should handle their own 'use client' directives.

export * from './src/index';
export * from './src/provider';
export * from './src/client-provider';
export * from './src/firestore/use-collection';
export * from './src/firestore/use-doc';
export * from './src/non-blocking-updates';
export * from './src/non-blocking-login';
export * from './src/errors';
export * from './src/error-emitter';
export * from './src/query-client';

// Supabase & SQL
export * from './src/supabase-client';
export * from './src/supabase-provider';
