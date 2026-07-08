import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

// One-time backfill for Phase 3's "Events" domain (migration plan §11, §9):
// copies existing rows for ChurchEvent and its subcollections (signups,
// roomBookings, assignments, equipment) into Firestore. Idempotent
// (re-running just overwrites the same docs) and additive only — does not
// touch or delete anything in Postgres. Ongoing writes are kept in sync
// separately by the Prisma Client Extension in packages/database/src/prisma.ts.

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
    console.log('Backfilling Events domain Prisma models -> Firestore...');

    const events = await prisma.churchEvent.findMany();
    for (const e of events) await writeDoc(['churchEvents', e.id], e);
    console.log(`  churchEvents: ${events.length}/${events.length} rows written`);

    const signups = await prisma.eventSignup.findMany();
    for (const s of signups) await writeDoc(['churchEvents', s.eventId, 'signups', s.id], s);
    console.log(`  churchEvents/*/signups: ${signups.length}/${signups.length} rows written`);

    const roomBookings = await prisma.eventRoomBooking.findMany();
    for (const rb of roomBookings) await writeDoc(['churchEvents', rb.eventId, 'roomBookings', rb.id], rb);
    console.log(`  churchEvents/*/roomBookings: ${roomBookings.length}/${roomBookings.length} rows written`);

    const assignments = await prisma.eventAssignment.findMany();
    for (const a of assignments) await writeDoc(['churchEvents', a.eventId, 'assignments', a.id], a);
    console.log(`  churchEvents/*/assignments: ${assignments.length}/${assignments.length} rows written`);

    const equipment = await prisma.eventEquipment.findMany();
    for (const eq of equipment) await writeDoc(['churchEvents', eq.eventId, 'equipment', eq.id], eq);
    console.log(`  churchEvents/*/equipment: ${equipment.length}/${equipment.length} rows written`);

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
