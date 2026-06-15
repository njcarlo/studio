/**
 * Creates/refreshes a small set of placeholder QA login accounts so the
 * client can test role-gated screens (Inventory Manager, Ministry Head,
 * Department Head) without using a real staff member's account.
 *
 * Also enables login for the 5 pre-existing department-head placeholder
 * Worker rows (one per department: Admin, Discipleship, Operations,
 * Relationship, Worship) — each is already wired as the `headId` of every
 * Ministry and DepartmentSetting in its department, so logging in as one
 * gives a real Ministry Head + Department Head experience for that
 * department's ministries with zero rewiring.
 *
 * Idempotent — safe to re-run. Credentials are documented in
 * docs/PLACEHOLDER_ACCOUNTS.md (update that file whenever this list changes).
 *
 * Run: npx tsx prisma/seed-qa-accounts.ts
 */
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const INVENTORY_MANAGER_ROLE_ID = 'c871e750-518b-4f5b-8bc2-08974a8ca5a6';

type Account = {
  email: string;
  password: string;
  workerId: string;
  firstName: string;
  lastName: string;
  role: { id: string; name: string; permissions?: { module: string; action: string; description: string }[] };
};

const ACCOUNTS: Account[] = [
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

// The 5 real department-head placeholder Worker rows already exist in the DB
// (ids 999995-999999) and are already wired as the `headId` of every Ministry
// and the matching DepartmentSetting for their department. Giving each of
// these a login lets the client test the *real* Ministry Head / Department
// Head approval flow for every ministry under that department — no rewiring
// needed, since the headId links already exist.
type DepartmentHeadLogin = {
  workerId: string; // Worker.id (PK), not the human-readable workerId field
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

async function ensureAuthUser(email: string, password: string) {
  const { data: list } = await supabaseAdmin.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email === email);
  if (existing) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
    if (error) throw error;
    return existing.id;
  }
  const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  return data.user.id;
}

async function main() {
  for (const account of ACCOUNTS) {
    console.log(`\n— ${account.email} —`);

    await ensureAuthUser(account.email, account.password);
    console.log('  ✅ Supabase auth user ready');

    // Ensure role + permissions exist
    if (account.role.permissions) {
      await prisma.role.upsert({
        where: { id: account.role.id },
        update: { name: account.role.name },
        create: { id: account.role.id, name: account.role.name, permissions: [], isSystemRole: true },
      });
      for (const p of account.role.permissions) {
        const perm = await prisma.permission.upsert({
          where: { module_action: { module: p.module, action: p.action } },
          update: { description: p.description },
          create: { module: p.module, action: p.action, description: p.description },
        });
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: account.role.id, permissionId: perm.id } },
          update: {},
          create: { roleId: account.role.id, permissionId: perm.id },
        });
      }
      console.log(`  ✅ Role "${account.role.name}" + permissions ready`);
    }

    // Upsert worker profile
    const worker = await prisma.worker.upsert({
      where: { email: account.email },
      update: { status: 'Active' },
      create: {
        workerId: account.workerId,
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        phone: '',
        status: 'Active',
        avatarUrl: `https://picsum.photos/seed/${account.workerId}/100/100`,
        majorMinistryId: '',
        minorMinistryId: '',
        remarks: 'QA placeholder account — see docs/PLACEHOLDER_ACCOUNTS.md',
      },
    });
    console.log(`  ✅ Worker profile ready (${worker.id})`);

    // Assign role
    await prisma.workerRole.upsert({
      where: { workerId_roleId: { workerId: worker.id, roleId: account.role.id } },
      update: {},
      create: { workerId: worker.id, roleId: account.role.id },
    });
    console.log(`  ✅ Assigned role "${account.role.name}"`);
  }

  for (const head of DEPARTMENT_HEAD_LOGINS) {
    console.log(`\n— ${head.email} (Dept ${head.department}) —`);

    await ensureAuthUser(head.email, head.password);
    console.log('  ✅ Supabase auth user ready');

    await prisma.worker.update({
      where: { id: head.workerId },
      data: { status: 'Active' },
    });
    console.log(`  ✅ Worker profile (${head.workerId}) active — already wired as Ministry/Department Head`);
  }

  console.log('\n✅ QA placeholder accounts ready. See docs/PLACEHOLDER_ACCOUNTS.md for credentials.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
