import { prisma } from '@studio/database/prisma';
import { notifyMany } from './notification-center';

export type PrayerRequestInput = {
    name: string;
    email: string;
    phone?: string;
    type: 'Prayer' | 'Counselling';
    message: string;
};

async function getPastoralManagerIds(): Promise<string[]> {
    const workers = await prisma.worker.findMany({
        where: {
            roles: {
                some: {
                    role: {
                        OR: [
                            { isSuperAdmin: true },
                            { rolePermissions: { some: { permission: { module: 'pastoral', action: 'manage' } } } },
                        ],
                    },
                },
            },
        },
        select: { id: true },
    });
    return workers.map(w => w.id);
}

export async function createPrayerRequest(input: PrayerRequestInput) {
    const request = await prisma.prayerRequest.create({
        data: {
            name: input.name,
            email: input.email,
            phone: input.phone ?? null,
            type: input.type,
            message: input.message,
        },
    });

    const pastoralManagerIds = await getPastoralManagerIds();
    await notifyMany(pastoralManagerIds, {
        title: `New ${input.type} Request`,
        body: `${input.name} submitted a ${input.type.toLowerCase()} request: "${input.message}"`,
        link: '/pastoral',
    });

    return request;
}

export async function getPrayerRequests() {
    return prisma.prayerRequest.findMany({ orderBy: { createdAt: 'desc' } });
}

export type UpdatePrayerRequestInput = {
    status?: 'New' | 'In Progress' | 'Resolved';
    response?: string | null;
    assignedTo?: string | null;
};

export async function updatePrayerRequestStatus(id: string, data: UpdatePrayerRequestInput) {
    return prisma.prayerRequest.update({ where: { id }, data });
}
