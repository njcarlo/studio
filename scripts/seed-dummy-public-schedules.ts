import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const SUNDAYS = ['2026-05-03', '2026-05-10', '2026-05-17', '2026-05-31', '2026-06-07'];

const MINISTRIES: Record<string, { roles: { name: string; slotType: string }[] }> = {
    '7': { roles: [{ name: 'Lighting Operator', slotType: 'Main' }, { name: 'Camera Operator', slotType: 'Mid' }] },
    '21': { roles: [{ name: 'Usher', slotType: 'Main' }, { name: 'Greeter', slotType: 'Mid' }] },
    '25': { roles: [{ name: 'Youth Leader', slotType: 'Main' }, { name: 'Youth Assistant', slotType: 'Mid' }] },
    '29': { roles: [{ name: 'Kids Teacher', slotType: 'Main' }, { name: 'Kids Helper', slotType: 'Mid' }] },
    '30': { roles: [{ name: 'Nursery Attendant', slotType: 'Main' }, { name: 'Check-in Coordinator', slotType: 'Mid' }] },
};

async function main() {
    const workersByMinistry: Record<string, { id: string; firstName: string; lastName: string }[]> = {};
    for (const ministryId of Object.keys(MINISTRIES)) {
        workersByMinistry[ministryId] = await prisma.worker.findMany({
            where: { majorMinistryId: ministryId, status: 'Active' },
            select: { id: true, firstName: true, lastName: true },
            take: 4,
        });
    }

    for (const dateStr of SUNDAYS) {
        const schedule = await prisma.serviceSchedule.create({
            data: {
                date: new Date(dateStr),
                title: 'Sunday Service',
                status: 'Published',
                isPublic: true,
                publicToken: randomUUID(),
                createdBy: 'seed-script',
            },
        });

        let order = 0;
        for (const [ministryId, config] of Object.entries(MINISTRIES)) {
            const workers = workersByMinistry[ministryId];
            for (let i = 0; i < config.roles.length; i++) {
                const role = config.roles[i];
                const worker = workers.length ? workers[(order + i) % workers.length] : null;
                await prisma.scheduleAssignment.create({
                    data: {
                        scheduleId: schedule.id,
                        ministryId,
                        roleName: role.name,
                        slotType: role.slotType,
                        workerId: worker?.id ?? null,
                        workerName: worker ? `${worker.firstName} ${worker.lastName}` : null,
                        order: order++,
                        attendanceStatus: 'Confirmed',
                    },
                });
            }
        }

        console.log(`Seeded ${dateStr} -> schedule ${schedule.id} (token ${schedule.publicToken})`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
