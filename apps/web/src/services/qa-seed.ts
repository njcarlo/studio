/**
 * Idempotent QA account seeder (Firebase Auth + Postgres).
 * Used by POST /api/qa/seed and prisma/seed-qa-accounts.ts.
 *
 * Credentials: docs/PLACEHOLDER_ACCOUNTS.md
 */
import { prisma } from '@studio/database/prisma';
import { firebaseAdminAuth } from '@/lib/firebase-admin';

const INVENTORY_MANAGER_ROLE_ID = 'c871e750-518b-4f5b-8bc2-08974a8ca5a6';

type Perm = { module: string; action: string; description: string };

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
    permissions?: Perm[];
    allPermissions?: boolean;
  };
  ensureC2SGroup?: { name: string; location: string };
};

const C2S_ACCOUNTS: Account[] = [
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
];

const OTHER_ACCOUNTS: Account[] = [
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
    const existing = await firebaseAdminAuth.getUserByEmail(email);
    await firebaseAdminAuth.updateUser(existing.uid, {
      password,
      emailVerified: true,
      disabled: false,
    });
    return existing.uid;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code !== 'auth/user-not-found') throw err;
  }
  const created = await firebaseAdminAuth.createUser({
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

  let c2sGroup: 'created' | 'exists' | 'skipped' = 'skipped';
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
      c2sGroup = 'created';
    } else {
      c2sGroup = 'exists';
    }
  }

  return { workerId: worker.id, email: worker.email, c2sGroup };
}

export type SeedQaScope = 'c2s' | 'all';

export async function seedQaAccounts(scope: SeedQaScope = 'c2s') {
  const accounts = scope === 'all' ? [...C2S_ACCOUNTS, ...OTHER_ACCOUNTS] : C2S_ACCOUNTS;
  const results: {
    email: string;
    auth: 'ok';
    workerId: string;
    c2sGroup: string;
    role?: string;
  }[] = [];

  for (const account of accounts) {
    await ensureAuthUser(account.email, account.password);
    if (account.role) await ensureRole(account.role);
    const worker = await ensureWorker(account);
    results.push({
      email: account.email,
      auth: 'ok',
      workerId: worker.workerId,
      c2sGroup: worker.c2sGroup,
      role: account.role?.name,
    });
  }

  const departmentHeads: { email: string; status: string }[] = [];
  if (scope === 'all') {
    for (const head of DEPARTMENT_HEAD_LOGINS) {
      try {
        await ensureAuthUser(head.email, head.password);
        await prisma.worker.update({
          where: { id: head.workerId },
          data: {
            status: 'Active',
            email: head.email,
            passwordChangeRequired: false,
          },
        });
        departmentHeads.push({ email: head.email, status: 'ok' });
      } catch (err) {
        departmentHeads.push({
          email: head.email,
          status: `skipped: ${(err as Error).message}`,
        });
      }
    }
  }

  return {
    ok: true as const,
    scope,
    accounts: results,
    departmentHeads,
    loginUrl: 'https://studio--cog-app-studio.asia-southeast1.hosted.app/login',
  };
}
