import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Sample C2S Devotion Records ---');

  // Find workers to attribute
  const workers = await prisma.worker.findMany();
  const adminWorker = workers.find((w) => w.email === 'admin@admin.com') || workers[0];
  const headWorker = workers.find((w) => w.email === 'head@admin.com') || workers[0];
  const mentorWorker = workers.find((w) => w.email === 'worker@admin.com') || workers[0];

  // Find or create C2S groups
  let groupOutreach = await prisma.c2SGroup.findFirst({
    where: { name: 'Outreach Cluster 4' },
  });
  if (!groupOutreach) {
    groupOutreach = await prisma.c2SGroup.create({
      data: {
        name: 'Outreach Cluster 4',
        mentorId: mentorWorker?.id || 'mentor-1',
        menteeIds: [],
      },
    });
  }

  let groupWorship = await prisma.c2SGroup.findFirst({
    where: { name: 'Worship Cluster 1' },
  });
  if (!groupWorship) {
    groupWorship = await prisma.c2SGroup.create({
      data: {
        name: 'Worship Cluster 1',
        mentorId: headWorker?.id || 'head-1',
        menteeIds: [],
      },
    });
  }

  // Ensure sample mentees exist for these groups
  const existingMentees = await prisma.c2SMentee.findMany();
  if (existingMentees.length === 0) {
    await prisma.c2SMentee.createMany({
      data: [
        {
          firstName: 'Joshua',
          lastName: 'Santos',
          email: 'joshua.s@example.com',
          phone: '09171112222',
          status: 'In Progress',
          groupId: groupOutreach.id,
          mentorId: mentorWorker?.id || 'mentor-1',
        },
        {
          firstName: 'Hannah',
          lastName: 'Reyes',
          email: 'hannah.r@example.com',
          phone: '09173334444',
          status: 'In Progress',
          groupId: groupOutreach.id,
          mentorId: mentorWorker?.id || 'mentor-1',
        },
        {
          firstName: 'Elijah',
          lastName: 'Cruz',
          email: 'elijah.c@example.com',
          phone: '09175556666',
          status: 'In Progress',
          groupId: groupWorship.id,
          mentorId: headWorker?.id || 'head-1',
        },
        {
          firstName: 'Grace',
          lastName: 'Mendoza',
          email: 'grace.m@example.com',
          phone: '09177778888',
          status: 'Completed',
          groupId: groupWorship.id,
          mentorId: headWorker?.id || 'head-1',
        },
      ],
    });
  }

  // Clear or seed Devotion Records
  const existingRecords = await (prisma as any).c2SDevotionRecord.count();
  if (existingRecords === 0) {
    await (prisma as any).c2SDevotionRecord.createMany({
      data: [
        {
          manualType: 'C2S Devotional Manual',
          moduleName: 'Module 3: Walking in Great Faith',
          lessonName: 'Lesson 1: Through the Eyes of Faith',
          topic: 'Lesson 1: Through the Eyes of Faith',
          scripture: '2 Corinthians 5:7, Hebrews 11:1',
          devotionDate: new Date(Date.now() - 24 * 60 * 60 * 1000 * 1), // Yesterday
          groupId: groupOutreach.id,
          clusterName: 'Outreach Cluster 4',
          mentorId: mentorWorker?.id || 'worker-1',
          mentorName: mentorWorker ? `Bro. ${mentorWorker.firstName} ${mentorWorker.lastName}` : 'Bro. Carlo Santos',
          mentorRole: 'Mentor',
          attendeeNames: ['Joshua Santos', 'Hannah Reyes', 'David Lim'],
          attendeeCount: 3,
          reflectionNotes: 'Shared powerful testimonies on God\'s faithfulness during financial challenges and campus outreach. Mentees engaged actively on trusting God through uncertainty.',
          prayerRequests: '1. Joshua\'s upcoming board exam.\n2. Hannah\'s family health.\n3. Upcoming community outreach on Saturday.',
          photoUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
          photoUrls: [
            'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80'
          ],
          status: 'Submitted',
        },
        {
          manualType: 'Mentor\'s Manual',
          moduleName: 'Module 1: 10 Core Values in the Ministry',
          lessonName: 'Lesson 2: The Nature of Ministry is Service',
          topic: 'Lesson 2: The Nature of Ministry is Service',
          scripture: 'John 13:12-17, Romans 12:1-2',
          devotionDate: new Date(Date.now() - 24 * 60 * 60 * 1000 * 3), // 3 days ago
          groupId: groupWorship.id,
          clusterName: 'Worship Cluster 1',
          mentorId: headWorker?.id || 'head-1',
          mentorName: headWorker ? `Bro. ${headWorker.firstName} ${headWorker.lastName}` : 'Bro. Patrick Lim',
          mentorRole: 'Ministry Head',
          attendeeNames: ['Elijah Cruz', 'Grace Mendoza', 'Sarah Bautista'],
          attendeeCount: 3,
          reflectionNotes: 'Discussed what it means to lead worship with humility and genuine reverence. Great participation from new choir members.',
          prayerRequests: '1. Smooth preparations for Sunday worship service.\n2. Unity and spiritual protection for the worship team.',
          photoUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80',
          photoUrls: [
            'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80'
          ],
          status: 'Submitted',
        },
        {
          manualType: 'C2S Devotional Manual',
          moduleName: 'Module 1: A Born Again Experience',
          lessonName: 'Lesson 1: Fresh Start',
          topic: 'Lesson 1: Fresh Start',
          scripture: '2 Corinthians 5:17, John 3:3',
          devotionDate: new Date(Date.now() - 24 * 60 * 60 * 1000 * 6), // 6 days ago
          groupId: groupOutreach.id,
          clusterName: 'Outreach Cluster 4',
          mentorId: mentorWorker?.id || 'worker-1',
          mentorName: mentorWorker ? `Sis. ${mentorWorker.firstName} ${mentorWorker.lastName}` : 'Sis. Maria Relao',
          mentorRole: 'Mentor',
          attendeeNames: ['Joshua Santos', 'Hannah Reyes'],
          attendeeCount: 2,
          reflectionNotes: 'Focused on daily quiet time habits, prayer routines, and Scripture memorization.',
          prayerRequests: '1. Consistency in daily Bible reading.\n2. Peace and healing for Joshua\'s mother.',
          photoUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1200&q=80',
          photoUrls: [
            'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1200&q=80'
          ],
          status: 'Submitted',
        }
      ],
    });
    console.log('Sample devotion records created successfully!');
  } else {
    console.log(`Devotion records already exist (${existingRecords} found).`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
