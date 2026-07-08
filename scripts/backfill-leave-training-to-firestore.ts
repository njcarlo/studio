import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

// One-time backfill for Phase 3's "Leave / Training" domain (migration plan
// §11, schema plan §5): copies LeaveRequest, LeaveBalance (composite doc ID
// `${workerId}_${type}_${year}` per the plan, preserving the Postgres
// @@unique constraint), and TrainingRecord into Firestore. Idempotent and
// additive only — does not touch or delete anything in Postgres. Ongoing
// writes are kept in sync separately by the Prisma Client Extension in
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

async function main() {
    console.log('Backfilling Leave / Training domain Prisma models -> Firestore...');

    const requests = await prisma.leaveRequest.findMany();
    for (const r of requests) {
        await db.collection('leaveRequests').doc(r.id).set(toFirestoreValue(r) as Record<string, unknown>);
    }
    console.log(`  leaveRequests: ${requests.length}/${requests.length} rows written`);

    const balances = await prisma.leaveBalance.findMany();
    for (const b of balances) {
        await db
            .collection('leaveBalances')
            .doc(`${b.workerId}_${b.type}_${b.year}`)
            .set(toFirestoreValue(b) as Record<string, unknown>);
    }
    console.log(`  leaveBalances: ${balances.length}/${balances.length} rows written`);

    const trainings = await prisma.trainingRecord.findMany();
    for (const t of trainings) {
        await db.collection('trainingRecords').doc(t.id).set(toFirestoreValue(t) as Record<string, unknown>);
    }
    console.log(`  trainingRecords: ${trainings.length}/${trainings.length} rows written`);

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
