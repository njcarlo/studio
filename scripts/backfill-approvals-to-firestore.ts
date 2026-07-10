import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

// One-time backfill for Phase 3's "Approvals" domain (migration plan §11,
// §10): copies existing ApprovalRequest rows 1:1, and ApprovalWorkflow rows
// with their ApprovalStage rows embedded as an ordered `stages` array of
// maps (the plan's deliberate deviation from the subcollection pattern).
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

async function main() {
    console.log('Backfilling Approvals domain Prisma models -> Firestore...');

    const requests = await prisma.approvalRequest.findMany();
    for (const r of requests) {
        await db.collection('approvalRequests').doc(r.id).set(toFirestoreValue(r) as Record<string, unknown>);
    }
    console.log(`  approvalRequests: ${requests.length}/${requests.length} rows written`);

    const workflows = await prisma.approvalWorkflow.findMany({
        include: { stages: { orderBy: { stageOrder: 'asc' } } },
    });
    let stagesEmbedded = 0;
    for (const wf of workflows) {
        stagesEmbedded += wf.stages.length;
        await db.collection('approvalWorkflows').doc(wf.id).set(toFirestoreValue(wf) as Record<string, unknown>);
    }
    console.log(
        `  approvalWorkflows: ${workflows.length}/${workflows.length} rows written (${stagesEmbedded} stages embedded)`,
    );

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
