import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const basePrisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

// Phase 3 dual-write mirror (migration plan §11): for each low-risk domain,
// every write also mirrors to Firestore so the collections stay populated
// during the verification/soak window — reads stay on Postgres until that
// soak period is done. Scoped to exactly these models/collections (see
// docs/FIRESTORE_SCHEMA_PLAN.md) rather than a blanket mirror, since the
// rest of the schema hasn't been designed for Firestore yet.
const MIRRORED_MODELS: Record<string, { collection: string; idField: string }> = {
    // Misc domain (§13)
    Sermon: { collection: 'sermons', idField: 'id' },
    PrayerRequest: { collection: 'prayerRequests', idField: 'id' },
    Setting: { collection: 'settings', idField: 'id' },
    TransactionLog: { collection: 'transactionLogs', idField: 'id' },
    ScanLog: { collection: 'scanLogs', idField: 'id' },
    InAppNotification: { collection: 'inAppNotifications', idField: 'id' },
    NotificationPreference: { collection: 'notificationPreferences', idField: 'workerId' },
    // Meals domain (§7)
    MealStub: { collection: 'mealStubs', idField: 'id' },
    MealStubLedger: { collection: 'mealStubLedger', idField: 'id' },
};

function getMirrorFirestore() {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        return null; // no Firebase config in this environment (e.g. CI/tests) — mirror is a no-op
    }
    const existing = getApps();
    const app =
        existing.length > 0
            ? existing[0]
            : initializeApp({
                  credential: process.env.GOOGLE_APPLICATION_CREDENTIALS
                      ? cert(JSON.parse(readFileSync(resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS), 'utf-8')))
                      : undefined,
              });
    return getFirestore(app);
}

let mirrorFirestore: ReturnType<typeof getFirestore> | null | undefined;
function firestore() {
    if (mirrorFirestore === undefined) {
        try {
            mirrorFirestore = getMirrorFirestore();
        } catch (e) {
            console.error('[prisma-firestore-mirror] init failed, disabling mirror:', e);
            mirrorFirestore = null;
        }
    }
    return mirrorFirestore;
}

function toFirestoreValue(v: unknown): unknown {
    if (v instanceof Date) return v;
    if (Array.isArray(v)) return v.map(toFirestoreValue);
    if (v && typeof v === 'object') {
        return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, toFirestoreValue(val)]));
    }
    return v === undefined ? null : v;
}

async function mirrorWrite(model: string, result: any) {
    const spec = MIRRORED_MODELS[model];
    const db = firestore();
    if (!spec || !db || !result) return;
    try {
        const rows = Array.isArray(result) ? result : [result];
        for (const row of rows) {
            const id = row?.[spec.idField];
            if (!id) continue;
            await db
                .collection(spec.collection)
                .doc(String(id))
                .set(toFirestoreValue(row) as Record<string, unknown>, { merge: false });
        }
    } catch (e) {
        console.error(`[prisma-firestore-mirror] mirror write failed for ${model}:`, e);
    }
}

async function mirrorDelete(model: string, whereId: string | undefined) {
    const spec = MIRRORED_MODELS[model];
    const db = firestore();
    if (!spec || !db || !whereId) return;
    try {
        await db.collection(spec.collection).doc(String(whereId)).delete();
    } catch (e) {
        console.error(`[prisma-firestore-mirror] mirror delete failed for ${model}:`, e);
    }
}

const extendedPrisma = basePrisma.$extends({
    query: {
        $allModels: {
            async create({ model, args, query }) {
                const result = await query(args);
                void mirrorWrite(model, result);
                return result;
            },
            async update({ model, args, query }) {
                const result = await query(args);
                void mirrorWrite(model, result);
                return result;
            },
            async upsert({ model, args, query }) {
                const result = await query(args);
                void mirrorWrite(model, result);
                return result;
            },
            async delete({ model, args, query }) {
                const result = await query(args);
                const whereId = (args as any)?.where?.id ?? (args as any)?.where?.workerId;
                void mirrorDelete(model, whereId);
                return result;
            },
        },
    },
});

export const prisma = extendedPrisma as unknown as PrismaClient;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma;
