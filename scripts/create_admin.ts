import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load variables from apps/web/.env.local
dotenv.config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const email = 'admin@admin.com'; // Supabase requires valid email format
  const password = 'admin';

  console.log('Creating user in Supabase Auth...');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    console.error('Supabase Auth Error:', authError.message);
    if (!authError.message.includes('already registered')) {
      process.exit(1);
    }
  }

  const userId = authData?.user?.id;
  console.log('User created in Supabase Auth:', userId || 'User already exists');

  console.log('Creating Super Admin role in Prisma...');
  let role = await prisma.role.findFirst({
    where: { name: 'Super Admin' }
  });

  if (!role) {
    role = await prisma.role.create({
      data: {
        name: 'Super Admin',
        isSuperAdmin: true,
        isSystemRole: true,
      }
    });
  }

  console.log('Creating Worker profile in Prisma...');
  const existingWorker = await prisma.worker.findUnique({
    where: { email }
  });

  let workerId = existingWorker?.id;

  if (!existingWorker) {
    // If auth data existed but worker didn't, reuse the auth ID if possible, otherwise UUID
    const worker = await prisma.worker.create({
      data: {
        id: userId || undefined, // use supabase UUID if fresh
        firstName: 'System',
        lastName: 'Admin',
        email: email,
        phone: '00000000000',
        status: 'Active',
        avatarUrl: '',
        majorMinistryId: 'admin_major',
        minorMinistryId: 'admin_minor',
        roleId: role.id
      }
    });
    workerId = worker.id;
    console.log('Worker profile created:', worker.id);
  } else {
    console.log('Worker profile already exists.');
  }

  // Also assign via WorkerRole table to be safe
  console.log('Linking WorkerRole...');
  await prisma.workerRole.upsert({
    where: {
      workerId_roleId: {
        workerId: workerId as string,
        roleId: role.id
      }
    },
    update: {},
    create: {
      workerId: workerId as string,
      roleId: role.id
    }
  });

  console.log('Admin account fully created! You can now login with:');
  console.log('Email: admin@admin.com');
  console.log('Password: admin');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
