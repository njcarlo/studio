import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

// One-time backfill for Phase 3's "C2S" (mentorship) domain (migration plan
// §11, §8): copies existing rows for C2SGroup and its nested subcollections
// (mentees, joinRequests, sessions, sessions/attendance) into Firestore.
// Idempotent (re-running just overwrites the same docs) and additive only —
// does not touch or delete anything in Postgres. Ongoing writes are kept in
// sync separately by the Prisma Client Extension in
// packages/database/src/prisma.ts.

const prisma = new PrismaClient();

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const app =
    getApps().length > 0
        ? getApps()[0]
        : initializeApp({
              credential: credentialsPath
                  ? cert(JSON.parse(readFileSync(resolve(credentialsPath), 'utf-8')))
                  : undefined,
          });
const db = getFirestore(app);

function toFirestoreValue(v: unknown): unknown {
    if (v instanceof Date) return v;
    if (Array.isArray(v)) return v.map(toFirestoreValue);
    if (v && typeof v === 'object') {
        return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, toFirestoreValue(val)]));
    }
    return v === undefined ? null : v;
}

async function writeDoc(path: string[], row: Record<string, unknown>) {
    let ref: FirebaseFirestore.CollectionReference | FirebaseFirestore.DocumentReference = db.collection(path[0]);
    for (let i = 1; i < path.length; i++) {
        ref =
            i % 2 === 1
                ? (ref as FirebaseFirestore.CollectionReference).doc(String(path[i]))
                : (ref as FirebaseFirestore.DocumentReference).collection(path[i]);
    }
    await (ref as FirebaseFirestore.DocumentReference).set(toFirestoreValue(row) as Record<string, unknown>);
}

async function main() {
    console.log('Backfilling C2S domain Prisma models -> Firestore...');

    const groups = await prisma.c2SGroup.findMany();
    for (const g of groups) await writeDoc(['c2sGroups', g.id], g);
    console.log(`  c2sGroups: ${groups.length}/${groups.length} rows written`);

    const mentees = await prisma.c2SMentee.findMany();
    for (const m of mentees) await writeDoc(['c2sGroups', m.groupId, 'mentees', m.id], m);
    console.log(`  c2sGroups/*/mentees: ${mentees.length}/${mentees.length} rows written`);

    const joinRequests = await prisma.c2SJoinRequest.findMany();
    for (const jr of joinRequests) await writeDoc(['c2sGroups', jr.groupId, 'joinRequests', jr.id], jr);
    console.log(`  c2sGroups/*/joinRequests: ${joinRequests.length}/${joinRequests.length} rows written`);

    const sessions = await prisma.c2SSession.findMany();
    for (const s of sessions) await writeDoc(['c2sGroups', s.groupId, 'sessions', s.id], s);
    console.log(`  c2sGroups/*/sessions: ${sessions.length}/${sessions.length} rows written`);

    const attendance = await prisma.c2SAttendanceRecord.findMany({
        include: { session: { select: { groupId: true } } },
    });
    let attendanceWritten = 0;
    for (const a of attendance) {
        if (!a.session) continue; // orphaned record (session deleted) — skip rather than write a dangling doc
        const { session, ...row } = a;
        await writeDoc(['c2sGroups', session.groupId, 'sessions', a.sessionId, 'attendance', a.menteeId], row);
        attendanceWritten++;
    }
    console.log(`  c2sGroups/*/sessions/*/attendance: ${attendanceWritten}/${attendance.length} rows written`);

    console.log('Backfill complete.');
}

main()
    .catch((error) => {
        console.error('Backfill failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
