import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

// One-time backfill for Phase 3's "Major Events" domain (migration plan §11
// of the schema plan): copies MajorEventServiceCatalogItem, MajorEventRequest
// (items as a subcollection), and the MajorEventSetting singleton into
// Firestore. Idempotent (re-running just overwrites the same docs) and
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
    console.log('Backfilling Major Events domain Prisma models -> Firestore...');

    const catalog = await prisma.majorEventServiceCatalogItem.findMany();
    for (const c of catalog) {
        await db.collection('majorEventServiceCatalog').doc(c.id).set(toFirestoreValue(c) as Record<string, unknown>);
    }
    console.log(`  majorEventServiceCatalog: ${catalog.length}/${catalog.length} rows written`);

    const requests = await prisma.majorEventRequest.findMany();
    for (const r of requests) {
        await db.collection('majorEventRequests').doc(r.id).set(toFirestoreValue(r) as Record<string, unknown>);
    }
    console.log(`  majorEventRequests: ${requests.length}/${requests.length} rows written`);

    const items = await prisma.majorEventRequestItem.findMany();
    for (const i of items) {
        await db
            .collection('majorEventRequests')
            .doc(i.requestId)
            .collection('items')
            .doc(i.id)
            .set(toFirestoreValue(i) as Record<string, unknown>);
    }
    console.log(`  majorEventRequests/*/items: ${items.length}/${items.length} rows written`);

    const settings = await prisma.majorEventSetting.findMany();
    for (const s of settings) {
        await db.collection('majorEventSettings').doc(s.id).set(toFirestoreValue(s) as Record<string, unknown>);
    }
    console.log(`  majorEventSettings: ${settings.length}/${settings.length} rows written`);

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
