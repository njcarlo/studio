/**
 * Creates/refreshes placeholder QA login accounts for Firebase Auth + Postgres.
 *
 * Idempotent — safe to re-run. Credentials: docs/PLACEHOLDER_ACCOUNTS.md
 *
 * Required env:
 *   DATABASE_URL / DIRECT_URL
 *   Firebase Admin via GOOGLE_APPLICATION_CREDENTIALS (service-account JSON)
 *     OR Application Default Credentials with project access
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID (or GCLOUD_PROJECT) recommended locally
 *
 * Run from repo root:
 *   set -a && source apps/web/.env.local && set +a
 *   npx tsx prisma/seed-qa-accounts.ts
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Load apps/web/.env.local when present (local / agent runs).
function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile(resolve(process.cwd(), 'apps/web/.env.local'));
loadEnvFile(resolve(process.cwd(), '.env'));

const prisma = new PrismaClient();

function initFirebaseAdmin() {
  if (getApps().length > 0) return getAuth();

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const projectId =
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    'cog-app-studio';

  if (credentialsPath && existsSync(credentialsPath)) {
    const serviceAccount = JSON.parse(readFileSync(resolve(credentialsPath), 'utf-8'));
    initializeApp({ credential: cert(serviceAccount), projectId });
  } else {
    initializeApp({ projectId });
  }
  return getAuth();
}

const auth = initFirebaseAdmin();

const INVENTORY_MANAGER_ROLE_ID = 'c871e750-518b-4f5b-8bc2-08974a8ca5a6';

type Perm = { module: string; action: string; description: string };

type Account = {
  email: string;
  password: string;
  workerId: string;
  firstName: string;
  lastName: string;
  /** Worker.flags values, e.g. ['mentor'] */
  flags?: string[];
  role?: {
    id: string;
    name: string;
    /** Role.isSuperAdmin — full Studio access */
    isSuperAdmin?: boolean;
    /** When set, upsert these permissions onto the role */
    permissions?: Perm[];
    /** When true, attach every Permission row in the DB (admin-like) */
    allPermissions?: boolean;
  };
  /** Create / ensure a C2S group mentored by this worker */
  ensureC2SGroup?: { name: string; location: string };
};

const ACCOUNTS: Account[] = [
  // ── C2S (primary for current student / QA testing) ──
  {
    email: 'qa.c2s.mentor@cogdasma.local',
    password: 'QaC2sMentor#2026',
    workerId: 'QA-C2S-MENTOR',
    firstName: 'C2S',
    lastName: 'Mentor (QA)',
    flags: ['mentor'],
    ensureC2SGroup: {
      name: 'QA Demo C2S Group',
      location: 'Dasmariñas (QA)',
    },
  },
  {
    email: 'qa.c2s.admin@cogdasma.local',
    password: 'QaC2sAdmin#2026',
    workerId: 'QA-C2S-ADMIN',
    firstName: 'C2S',
    lastName: 'Admin (QA)',
    role: {
      id: 'qa-c2s-admin',
      name: 'C2S Admin (QA)',
      permissions: [
        { module: 'mentorship', action: 'manage', description: 'Manage C2S groups & mentees' },
        { module: 'mentorship', action: 'view_reports', description: 'View C2S analytics & reports' },
        { module: 'workers', action: 'view', description: 'View workers' },
      ],
    },
  },
  {
    email: 'qa.superadmin@cogdasma.local',
    password: 'QaSuperAdmin#2026',
    workerId: 'QA-SUPERADMIN',
    firstName: 'QA',
    lastName: 'Super Admin',
    flags: ['mentor'],
    role: {
      id: 'qa-superadmin-role',
      name: 'QA Super Admin',
      isSuperAdmin: true,
      allPermissions: true,
    },
    ensureC2SGroup: {
      name: 'QA Super Admin Group',
      location: 'Dasmariñas (QA)',
    },
  },

  // ── Existing role-gated placeholders ──
  {
    email: 'inventory.manager@cogdasma.local',
    password: 'QaInventory#2026',
    workerId: 'QA-INV-MGR',
    firstName: 'Inventory',
    lastName: 'Manager (QA)',
    role: { id: INVENTORY_MANAGER_ROLE_ID, name: 'Inventory Manager' },
  },
  {
    email: 'ministry.head@cogdasma.local',
    password: 'QaMinistryHead#2026',
    workerId: 'QA-MIN-HEAD',
    firstName: 'Ministry',
    lastName: 'Head (QA)',
    role: {
      id: 'qa-ministry-head',
      name: 'Ministry Head (QA)',
      permissions: [
        { module: 'venues', action: 'approve', description: 'Room reservation approval (legacy)' },
        { module: 'venues', action: 'approve_l1', description: 'Room reservation approval — stage 1 (Ministry Head)' },
      ],
    },
  },
  {
    email: 'department.head@cogdasma.local',
    password: 'QaDepartmentHead#2026',
    workerId: 'QA-DEPT-HEAD',
    firstName: 'Department',
    lastName: 'Head (QA)',
    role: {
      id: 'qa-department-head',
      name: 'Department Head (QA)',
      permissions: [
        { module: 'venues', action: 'approve', description: 'Room reservation approval (legacy)' },
        { module: 'venues', action: 'approve_l2', description: 'Room reservation approval — stage 2 (Department Head)' },
      ],
    },
  },
];

type DepartmentHeadLogin = {
  workerId: string;
  email: string;
  password: string;
  department: string;
};

const DEPARTMENT_HEAD_LOGINS: DepartmentHeadLogin[] = [
  { workerId: '999999', email: 'placeholder.head.a@cogdasma.local', password: 'QaHeadAdmin#2026', department: 'Admin (A)' },
  { workerId: '999998', email: 'placeholder.head.d@cogdasma.local', password: 'QaHeadDiscipleship#2026', department: 'Discipleship (D)' },
  { workerId: '999997', email: 'placeholder.head.o@cogdasma.local', password: 'QaHeadOperations#2026', department: 'Operations (O)' },
  { workerId: '999996', email: 'placeholder.head.r@cogdasma.local', password: 'QaHeadRelationship#2026', department: 'Relationship (R)' },
  { workerId: '999995', email: 'placeholder.head.w@cogdasma.local', password: 'QaHeadWorship#2026', department: 'Worship (W)' },
];

async function ensureAuthUser(email: string, password: string): Promise<string> {
  try {
    const existing = await auth.getUserByEmail(email);
    await auth.updateUser(existing.uid, {
      password,
      emailVerified: true,
      disabled: false,
    });
    return existing.uid;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code !== 'auth/user-not-found') throw err;
  }
  const created = await auth.createUser({
    email,
    password,
    emailVerified: true,
    disabled: false,
  });
  return created.uid;
}

async function ensureRole(role: NonNullable<Account['role']>) {
  await prisma.role.upsert({
    where: { id: role.id },
    update: {
      name: role.name,
      isSuperAdmin: role.isSuperAdmin ?? false,
    },
    create: {
      id: role.id,
      name: role.name,
      permissions: [],
      isSystemRole: true,
      isSuperAdmin: role.isSuperAdmin ?? false,
    },
  });

  if (role.allPermissions) {
    const all = await prisma.permission.findMany();
    for (const perm of all) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
    return;
  }

  for (const p of role.permissions ?? []) {
    const perm = await prisma.permission.upsert({
      where: { module_action: { module: p.module, action: p.action } },
      update: { description: p.description },
      create: { module: p.module, action: p.action, description: p.description },
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
      update: {},
      create: { roleId: role.id, permissionId: perm.id },
    });
  }
}

async function ensureWorker(account: Account) {
  const worker = await prisma.worker.upsert({
    where: { email: account.email },
    update: {
      status: 'Active',
      firstName: account.firstName,
      lastName: account.lastName,
      flags: account.flags ?? [],
      passwordChangeRequired: false,
      remarks: 'QA placeholder account — see docs/PLACEHOLDER_ACCOUNTS.md',
    },
    create: {
      workerId: account.workerId,
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      phone: '09000000000',
      status: 'Active',
      avatarUrl: `https://picsum.photos/seed/${account.workerId}/100/100`,
      majorMinistryId: '',
      minorMinistryId: '',
      flags: account.flags ?? [],
      passwordChangeRequired: false,
      remarks: 'QA placeholder account — see docs/PLACEHOLDER_ACCOUNTS.md',
    },
  });

  if (account.role) {
    await prisma.workerRole.upsert({
      where: { workerId_roleId: { workerId: worker.id, roleId: account.role.id } },
      update: {},
      create: { workerId: worker.id, roleId: account.role.id },
    });
  }

  if (account.ensureC2SGroup) {
    const existing = await prisma.c2SGroup.findFirst({
      where: { mentorId: worker.id, name: account.ensureC2SGroup.name },
    });
    if (!existing) {
      await prisma.c2SGroup.create({
        data: {
          name: account.ensureC2SGroup.name,
          mentorId: worker.id,
          location: account.ensureC2SGroup.location,
          meetingSchedule: 'Saturday 3:00 PM',
          currentModule: 'QA Module 1',
          ageGroupLabel: 'Young Adults',
          ageRangeMin: 18,
          ageRangeMax: 35,
          meetupDay: 'Saturday',
          demographics: ['QA', 'Young Adults'],
          mapLat: 14.3294,
          mapLng: 120.9367,
        },
      });
      console.log(`  ✅ C2S group "${account.ensureC2SGroup.name}" created`);
    } else {
      console.log(`  ✅ C2S group "${account.ensureC2SGroup.name}" already exists`);
    }
  }

  return worker;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Source apps/web/.env.local (or export DATABASE_URL) before running.',
    );
  }

  console.log('Seeding QA accounts (Firebase Auth + Postgres)…');
  console.log(`Project: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'cog-app-studio'}`);

  for (const account of ACCOUNTS) {
    console.log(`\n— ${account.email} —`);
    await ensureAuthUser(account.email, account.password);
    console.log('  ✅ Firebase Auth user ready');

    if (account.role) {
      await ensureRole(account.role);
      console.log(`  ✅ Role "${account.role.name}" ready`);
    }

    const worker = await ensureWorker(account);
    console.log(`  ✅ Worker ready (${worker.id})`);
  }

  for (const head of DEPARTMENT_HEAD_LOGINS) {
    console.log(`\n— ${head.email} (Dept ${head.department}) —`);
    try {
      await ensureAuthUser(head.email, head.password);
      console.log('  ✅ Firebase Auth user ready');
      await prisma.worker.update({
        where: { id: head.workerId },
        data: {
          status: 'Active',
          email: head.email,
          passwordChangeRequired: false,
        },
      });
      console.log(`  ✅ Worker (${head.workerId}) active`);
    } catch (err) {
      console.warn(`  ⚠ Skipped department head ${head.email}:`, (err as Error).message);
    }
  }

  console.log('\n✅ QA accounts ready. Credentials: docs/PLACEHOLDER_ACCOUNTS.md');
  console.log('Login: https://studio--cog-app-studio.asia-southeast1.hosted.app/login');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
