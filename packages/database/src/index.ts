'use client';

// NOTE: Do NOT re-export './prisma' here. This barrel is a client boundary
// ('use client'), and src/prisma.ts pulls in server-only deps (firebase-admin,
// node:fs) for the Phase 3 Firestore dual-write. Re-exporting it dragged
// firebase-admin/google-auth-library + Node built-ins into the browser bundle
// via any client importer (e.g. lib/supabase-browser.ts), breaking the Webpack
// build. Server code imports Prisma directly from the server subpath
// '@studio/database/prisma' instead.
export * from './supabase-client';
export * from './supabase-provider';
export * from './query-client';
