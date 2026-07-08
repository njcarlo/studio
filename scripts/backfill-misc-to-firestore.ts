import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

// One-time backfill for Phase 3's "Misc" domain (migration plan §11, §13):
// copies existing rows for the 7 lowest-risk models into their Firestore
// collections. Idempotent (re-running just overwrites the same docs) and
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

async function backfill(collection: string, idField: string, rows: any[]) {
    let written = 0;
    for (const row of rows) {
        const id = row[idField];
        if (!id) continue;
        await db.collection(collection).doc(String(id)).set(toFirestoreValue(row) as Record<string, unknown>);
        written++;
    }
    console.log(`  ${collection}: ${written}/${rows.length} rows written`);
}

async function main() {
    console.log('Backfilling Misc domain Prisma models -> Firestore...');

    await backfill('sermons', 'id', await prisma.sermon.findMany());
    await backfill('prayerRequests', 'id', await prisma.prayerRequest.findMany());
    await backfill('settings', 'id', await prisma.setting.findMany());
    await backfill('transactionLogs', 'id', await prisma.transactionLog.findMany());
    await backfill('scanLogs', 'id', await prisma.scanLog.findMany());
    await backfill('inAppNotifications', 'id', await prisma.inAppNotification.findMany());
    await backfill('notificationPreferences', 'workerId', await prisma.notificationPreference.findMany());

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
