/**
 * Standalone QA seeder for App Hosting build / local CLI.
 * No Next.js path aliases — safe to run from scripts/apphosting-build.sh.
 */
import { PrismaClient } from '@prisma/client';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const prisma = new PrismaClient();

function initAuth() {
  if (getApps().length === 0) {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const projectId =
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      'cog-app-studio';
    if (credentialsPath && existsSync(credentialsPath)) {
      const sa = JSON.parse(readFileSync(resolve(credentialsPath), 'utf-8'));
      initializeApp({ credential: cert(sa), projectId });
    } else {
      initializeApp({ projectId });
    }
  }
  return getAuth();
}

const auth = initAuth();

type Account = {
  email: string;
  password: string;
  workerId: string;
  firstName: string;
  lastName: string;
  flags?: string[];
  role?: {
    id: string;
    name: string;
    isSuperAdmin?: boolean;
    permissions?: { module: string; action: string; description: string }[];
    allPermissions?: boolean;
  };
  ensureC2SGroup?: { name: string; location: string };
};

const ACCOUNTS: Account[] = [
  {
    email: 'qa.c2s.mentor@cogdasma.local',
    password: 'QaC2sMentor#2026',
    workerId: 'QA-C2S-MENTOR',
    firstName: 'C2S',
    lastName: 'Mentor (QA)',
    flags: ['mentor'],
    ensureC2SGroup: { name: 'QA Demo C2S Group', location: 'Dasmariñas (QA)' },
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
    ensureC2SGroup: { name: 'QA Super Admin Group', location: 'Dasmariñas (QA)' },
  },
];

async function ensureAuthUser(email: string, password: string) {
  try {
    const existing = await auth.getUserByEmail(email);
    await auth.updateUser(existing.uid, { password, emailVerified: true, disabled: false });
    return existing.uid;
  } catch (err: unknown) {
    if ((err as { code?: string }).code !== 'auth/user-not-found') throw err;
  }
  const created = await auth.createUser({ email, password, emailVerified: true, disabled: false });
  return created.uid;
}

async function ensureRole(role: NonNullable<Account['role']>) {
  await prisma.role.upsert({
    where: { id: role.id },
    update: { name: role.name, isSuperAdmin: role.isSuperAdmin ?? false },
    create: {
      id: role.id,
      name: role.name,
      permissions: [],
      isSystemRole: true,
      isSuperAdmin: role.isSuperAdmin ?? false,
    },
  });
  if (role.allPermissions) {
    for (const perm of await prisma.permission.findMany()) {
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
    }
  }
  return worker;
}

export async function seedC2sQaAccounts() {
  console.log('[qa-seed] seeding C2S QA accounts…');
  for (const account of ACCOUNTS) {
    console.log(`— ${account.email}`);
    await ensureAuthUser(account.email, account.password);
    if (account.role) await ensureRole(account.role);
    const w = await ensureWorker(account);
    console.log(`  ✅ worker ${w.id}`);
  }
  console.log('[qa-seed] done');
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }
  await seedC2sQaAccounts();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
