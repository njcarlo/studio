import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

// One-time backfill for Phase 3's "Identity/RBAC" domain (schema plan §1):
// workers (WorkerRole folded in as roleAssignment/roleIds, legacyPasswordHash
// deliberately excluded — credentials don't belong in Firestore), roles
// (RolePermission join embedded as a { module: action[] } permissions map),
// and the permissions reference catalog. Idempotent and additive only.
// Ongoing writes are kept in sync separately by the Prisma Client Extension
// in packages/database/src/prisma.ts.

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
    console.log('Backfilling Identity/RBAC domain Prisma models -> Firestore...');

    const workers = await prisma.worker.findMany({
        include: { roles: { orderBy: { assignedAt: 'desc' } } },
    });
    for (const w of workers) {
        const { legacyPasswordHash, roles, ...fields } = w as any;
        const doc = {
            ...fields,
            roleAssignment: roles[0]
                ? { roleId: roles[0].roleId, assignedBy: roles[0].assignedBy, assignedAt: roles[0].assignedAt }
                : null,
            roleIds: roles.map((r: any) => r.roleId),
        };
        await db.collection('workers').doc(w.id).set(toFirestoreValue(doc) as Record<string, unknown>);
    }
    console.log(`  workers: ${workers.length}/${workers.length} rows written`);

    const roles = await prisma.role.findMany({
        include: { rolePermissions: { include: { permission: true } } },
    });
    let joinRows = 0;
    for (const r of roles) {
        const permMap: Record<string, string[]> = {};
        for (const rp of r.rolePermissions) {
            (permMap[rp.permission.module] ??= []).push(rp.permission.action);
        }
        joinRows += r.rolePermissions.length;
        const doc = {
            id: r.id,
            name: r.name,
            isSuperAdmin: r.isSuperAdmin,
            isSystemRole: r.isSystemRole,
            legacyPermissions: r.permissions,
            permissions: permMap,
        };
        await db.collection('roles').doc(r.id).set(toFirestoreValue(doc) as Record<string, unknown>);
    }
    console.log(`  roles: ${roles.length}/${roles.length} rows written (${joinRows} permission grants embedded)`);

    const permissions = await prisma.permission.findMany();
    for (const p of permissions) {
        await db.collection('permissions').doc(p.id).set(toFirestoreValue(p) as Record<string, unknown>);
    }
    console.log(`  permissions: ${permissions.length}/${permissions.length} rows written`);

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
