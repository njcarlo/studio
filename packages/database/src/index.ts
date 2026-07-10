'use client';

// Client-safe barrel for @studio/database.
// NOTE: Do NOT re-export './prisma' here. This barrel is a client boundary
// ('use client'), and src/prisma.ts pulls in server-only deps (firebase-admin,
// node:fs). Server code imports Prisma from '@studio/database/prisma' instead.
export * from './query-client';
