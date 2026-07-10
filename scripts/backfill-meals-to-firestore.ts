import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

// One-time backfill for Phase 3's "Meals" domain (migration plan §11, §7):
// copies existing rows for MealStub and MealStubLedger into their Firestore
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
    console.log('Backfilling Meals domain Prisma models -> Firestore...');

    await backfill('mealStubs', 'id', await prisma.mealStub.findMany());
    await backfill('mealStubLedger', 'id', await prisma.mealStubLedger.findMany());

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
