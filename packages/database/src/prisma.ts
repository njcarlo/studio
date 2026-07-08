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
//
// Each resolver returns the full Firestore doc path as alternating
// [collection, docId, collection, docId, ...] segments — plain arrays for
// flat collections, longer ones for the C2S domain's nested subcollections
// (§8). A resolver may be async where the row itself doesn't carry enough
// to build the path (C2SAttendanceRecord only has sessionId, not the
// group's id, so it looks the parent session up).
type PathResolver = (row: any) => Promise<string[] | null> | string[] | null;

const MIRRORED_MODELS: Record<string, PathResolver> = {
    // Misc domain (§13)
    Sermon: (row) => ['sermons', row.id],
    PrayerRequest: (row) => ['prayerRequests', row.id],
    Setting: (row) => ['settings', row.id],
    TransactionLog: (row) => ['transactionLogs', row.id],
    ScanLog: (row) => ['scanLogs', row.id],
    InAppNotification: (row) => ['inAppNotifications', row.id],
    NotificationPreference: (row) => ['notificationPreferences', row.workerId],
    // Meals domain (§7)
    MealStub: (row) => ['mealStubs', row.id],
    MealStubLedger: (row) => ['mealStubLedger', row.id],
    // C2S / mentorship domain (§8)
    C2SGroup: (row) => ['c2sGroups', row.id],
    C2SMentee: (row) => ['c2sGroups', row.groupId, 'mentees', row.id],
    C2SJoinRequest: (row) => ['c2sGroups', row.groupId, 'joinRequests', row.id],
    C2SSession: (row) => ['c2sGroups', row.groupId, 'sessions', row.id],
    C2SAttendanceRecord: async (row) => {
        const session = await basePrisma.c2SSession.findUnique({
            where: { id: row.sessionId },
            select: { groupId: true },
        });
        if (!session) return null; // session gone/unavailable — skip rather than write an orphaned doc
        return ['c2sGroups', session.groupId, 'sessions', row.sessionId, 'attendance', row.menteeId];
    },
    // Events domain (§9)
    ChurchEvent: (row) => ['churchEvents', row.id],
    EventSignup: (row) => ['churchEvents', row.eventId, 'signups', row.id],
    EventRoomBooking: (row) => ['churchEvents', row.eventId, 'roomBookings', row.id],
    EventAssignment: (row) => ['churchEvents', row.eventId, 'assignments', row.id],
    EventEquipment: (row) => ['churchEvents', row.eventId, 'equipment', row.id],
    // Approvals domain (§10) — the ad-hoc ApprovalRequest model maps 1:1;
    // ApprovalWorkflow/ApprovalStage use CUSTOM_MIRRORS below instead since
    // stages embed into the workflow doc as an array of maps.
    ApprovalRequest: (row) => ['approvalRequests', row.id],
    // Major Events domain (§11)
    MajorEventServiceCatalogItem: (row) => ['majorEventServiceCatalog', row.id],
    MajorEventRequest: (row) => ['majorEventRequests', row.id],
    MajorEventRequestItem: (row) => ['majorEventRequests', row.requestId, 'items', row.id],
    MajorEventSetting: (row) => ['majorEventSettings', row.id], // singleton — id is always "global"
    // Leave / Training domain (§5)
    LeaveRequest: (row) => ['leaveRequests', row.id],
    // Composite doc ID per the plan — preserves @@unique([workerId, type, year])
    // as a natural doc-ID uniqueness guarantee.
    LeaveBalance: (row) => ['leaveBalances', `${row.workerId}_${row.type}_${row.year}`],
    TrainingRecord: (row) => ['trainingRecords', row.id],
    // Org structure domain (§2) — Department/DepartmentSetting use
    // CUSTOM_MIRRORS below since the setting merges into the department doc.
    Ministry: (row) => ['ministries', row.id],
    Area: (row) => ['areas', row.id],
    Branch: (row) => ['branches', row.id],
};

// Re-reads a workflow with its stages and writes it as one Firestore doc
// with stages embedded (§10's array-of-maps deviation). Called for writes to
// either model — a stage decision re-syncs the whole parent doc, which also
// makes it self-healing under out-of-order async mirrors.
async function syncApprovalWorkflow(db: FirebaseFirestore.Firestore, workflowId: string) {
    const wf = await basePrisma.approvalWorkflow.findUnique({
        where: { id: workflowId },
        include: { stages: { orderBy: { stageOrder: 'asc' } } },
    });
    const ref = db.collection('approvalWorkflows').doc(String(workflowId));
    if (!wf) {
        await ref.delete(); // workflow gone by the time the mirror ran
        return;
    }
    await ref.set(toFirestoreValue(wf) as Record<string, unknown>, { merge: false });
}

// Models whose mirror isn't a 1:1 row→doc copy. `write` runs after
// create/update/upsert, `remove` after delete, each getting the Prisma
// result row.
const CUSTOM_MIRRORS: Record<
    string,
    {
        write: (db: FirebaseFirestore.Firestore, row: any) => Promise<void>;
        remove: (db: FirebaseFirestore.Firestore, row: any) => Promise<void>;
    }
> = {
    ApprovalWorkflow: {
        write: (db, row) => syncApprovalWorkflow(db, row.id),
        remove: async (db, row) => {
            // Postgres cascades stage deletes; here stages live inside the doc
            await db.collection('approvalWorkflows').doc(String(row.id)).delete();
        },
    },
    ApprovalStage: {
        write: (db, row) => syncApprovalWorkflow(db, row.workflowId),
        remove: (db, row) => syncApprovalWorkflow(db, row.workflowId),
    },
    Department: {
        write: (db, row) => syncDepartment(db, row.code),
        remove: async (db, row) => {
            await db.collection('departments').doc(String(row.code)).delete();
        },
    },
    // DepartmentSetting is keyed 1:1 by Department.code (its id IS the code);
    // any write re-syncs the merged department doc.
    DepartmentSetting: {
        write: (db, row) => syncDepartment(db, row.id),
        remove: (db, row) => syncDepartment(db, row.id),
    },
};

// §2: DepartmentSetting merges into departments/{code} as nested fields
// (renamed settingDescription to avoid clashing with any future Department
// description) — one fewer collection for a 1:1 config extension.
async function syncDepartment(db: FirebaseFirestore.Firestore, code: string) {
    const [dept, setting] = await Promise.all([
        basePrisma.department.findUnique({ where: { code } }),
        basePrisma.departmentSetting.findUnique({ where: { id: code } }),
    ]);
    const ref = db.collection('departments').doc(String(code));
    if (!dept) {
        await ref.delete(); // department gone by the time the mirror ran
        return;
    }
    const merged = {
        ...dept,
        headId: setting?.headId ?? null,
        settingDescription: setting?.description ?? null,
        mealStubWeekdayAllocation: setting?.mealStubWeekdayAllocation ?? 0,
        mealStubSundayAllocation: setting?.mealStubSundayAllocation ?? 0,
    };
    await ref.set(toFirestoreValue(merged) as Record<string, unknown>, { merge: false });
}

function docRef(db: FirebaseFirestore.Firestore, path: string[]) {
    let ref: FirebaseFirestore.CollectionReference | FirebaseFirestore.DocumentReference = db.collection(path[0]);
    for (let i = 1; i < path.length; i++) {
        ref =
            i % 2 === 1
                ? (ref as FirebaseFirestore.CollectionReference).doc(String(path[i]))
                : (ref as FirebaseFirestore.DocumentReference).collection(path[i]);
    }
    return ref as FirebaseFirestore.DocumentReference;
}

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

// Mirror tasks are fire-and-forget and several of them re-read Postgres
// (syncApprovalWorkflow, syncDepartment, C2SAttendanceRecord's session
// lookup, the updateMany re-fetch). Writes made inside prisma.$transaction
// (e.g. approval-engine's decide()) aren't visible to those re-reads until
// the transaction commits, so every mirror task waits a beat first. Not a
// hard guarantee — a >1s transaction can still race — but the mirror is a
// soak-window aid, and periodic backfill re-runs heal any misses.
const MIRROR_SETTLE_MS = 1000;
const settle = () => new Promise((resolve) => setTimeout(resolve, MIRROR_SETTLE_MS));

// Primary-key field per mirrored model, for the updateMany/deleteMany
// pre-capture. Everything uses `id` except these two.
function pkField(model: string) {
    if (model === 'NotificationPreference') return 'workerId';
    if (model === 'Department') return 'code';
    return 'id';
}

// Prisma client property for a model name: first letter lowercased
// (MealStub -> mealStub, C2SGroup -> c2SGroup).
function delegateFor(model: string) {
    return (basePrisma as any)[model.charAt(0).toLowerCase() + model.slice(1)];
}

async function mirrorWrite(model: string, result: any) {
    const custom = CUSTOM_MIRRORS[model];
    const resolvePath = MIRRORED_MODELS[model];
    const db = firestore();
    if ((!custom && !resolvePath) || !db || !result) return;
    await settle();
    const rows = Array.isArray(result) ? result : [result];
    for (const row of rows) {
        try {
            if (custom) {
                await custom.write(db, row);
                continue;
            }
            const path = await resolvePath!(row);
            if (!path) continue;
            await docRef(db, path).set(toFirestoreValue(row) as Record<string, unknown>, { merge: false });
        } catch (e) {
            console.error(`[prisma-firestore-mirror] mirror write failed for ${model}:`, e);
        }
    }
}

async function mirrorDelete(model: string, row: any) {
    const custom = CUSTOM_MIRRORS[model];
    const resolvePath = MIRRORED_MODELS[model];
    const db = firestore();
    if ((!custom && !resolvePath) || !db || !row) return;
    await settle();
    try {
        if (custom) {
            await custom.remove(db, row);
            return;
        }
        const path = await resolvePath!(row);
        if (!path) return;
        await docRef(db, path).delete();
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
                void mirrorDelete(model, result);
                return result;
            },
            // Bulk ops return counts, not rows, so the affected rows are
            // captured around the query instead. Live call sites exist
            // (mealStub.updateMany in cron-jobs, mealStub.deleteMany in
            // meal-stub-engine, majorEventRequestItem.updateMany in
            // major-event-workflow) — without these hooks those writes would
            // silently skip the mirror. createMany stays unmirrored (no way
            // to learn the generated IDs); heal via backfill re-run.
            async updateMany({ model, args, query }) {
                const mirrored = model in MIRRORED_MODELS || model in CUSTOM_MIRRORS;
                const pk = pkField(model);
                let ids: any[] = [];
                if (mirrored) {
                    try {
                        const rows = await delegateFor(model).findMany({
                            where: (args as any)?.where,
                            select: { [pk]: true },
                        });
                        ids = rows.map((r: any) => r[pk]);
                    } catch (e) {
                        console.error(`[prisma-firestore-mirror] updateMany pre-capture failed for ${model}:`, e);
                    }
                }
                const result = await query(args);
                if (mirrored && ids.length > 0) {
                    void (async () => {
                        try {
                            await settle();
                            const rows = await delegateFor(model).findMany({ where: { [pk]: { in: ids } } });
                            await mirrorWrite(model, rows);
                        } catch (e) {
                            console.error(`[prisma-firestore-mirror] updateMany mirror failed for ${model}:`, e);
                        }
                    })();
                }
                return result;
            },
            async deleteMany({ model, args, query }) {
                const mirrored = model in MIRRORED_MODELS || model in CUSTOM_MIRRORS;
                let rows: any[] = [];
                if (mirrored) {
                    try {
                        // Full rows, captured before they're gone — path
                        // resolvers need more than the PK (groupId, eventId…).
                        rows = await delegateFor(model).findMany({ where: (args as any)?.where });
                    } catch (e) {
                        console.error(`[prisma-firestore-mirror] deleteMany pre-capture failed for ${model}:`, e);
                    }
                }
                const result = await query(args);
                if (rows.length > 0) {
                    void (async () => {
                        for (const row of rows) await mirrorDelete(model, row);
                    })();
                }
                return result;
            },
        },
    },
});

export const prisma = extendedPrisma as unknown as PrismaClient;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma;
