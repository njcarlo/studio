import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

// One-time backfill for Phase 3's "Org structure" domain (schema plan §2):
// copies Ministry, Department (merged with its 1:1 DepartmentSetting into a
// single departments/{code} doc, per the plan), Area, and Branch into
// Firestore. Idempotent and additive only — does not touch or delete
// anything in Postgres. Ongoing writes are kept in sync separately by the
// Prisma Client Extension in packages/database/src/prisma.ts.

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
    console.log('Backfilling Org structure domain Prisma models -> Firestore...');

    const ministries = await prisma.ministry.findMany();
    for (const m of ministries) {
        await db.collection('ministries').doc(m.id).set(toFirestoreValue(m) as Record<string, unknown>);
    }
    console.log(`  ministries: ${ministries.length}/${ministries.length} rows written`);

    const departments = await prisma.department.findMany();
    const settings = new Map(
        (await prisma.departmentSetting.findMany()).map((s) => [s.id, s]),
    );
    for (const d of departments) {
        const s = settings.get(d.code);
        const merged = {
            ...d,
            headId: s?.headId ?? null,
            settingDescription: s?.description ?? null,
            mealStubWeekdayAllocation: s?.mealStubWeekdayAllocation ?? 0,
            mealStubSundayAllocation: s?.mealStubSundayAllocation ?? 0,
        };
        await db.collection('departments').doc(d.code).set(toFirestoreValue(merged) as Record<string, unknown>);
    }
    console.log(`  departments: ${departments.length}/${departments.length} rows written (${settings.size} settings merged)`);

    const areas = await prisma.area.findMany();
    for (const a of areas) {
        await db.collection('areas').doc(a.id).set(toFirestoreValue(a) as Record<string, unknown>);
    }
    console.log(`  areas: ${areas.length}/${areas.length} rows written`);

    const branches = await prisma.branch.findMany();
    for (const b of branches) {
        await db.collection('branches').doc(b.id).set(toFirestoreValue(b) as Record<string, unknown>);
    }
    console.log(`  branches: ${branches.length}/${branches.length} rows written`);

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
