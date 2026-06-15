import { prisma } from '@studio/database/prisma';

export type SermonInput = {
    title: string;
    speaker?: string | null;
    date: Date;
    scripture?: string | null;
    description?: string | null;
    videoUrl?: string | null;
    audioUrl?: string | null;
    isPublic?: boolean;
};

export async function listSermons() {
    return prisma.sermon.findMany({ orderBy: { date: 'desc' } });
}

export async function listPublicSermons() {
    return prisma.sermon.findMany({
        where: { isPublic: true },
        orderBy: { date: 'desc' },
    });
}

export async function getPublicSermon(id: string) {
    return prisma.sermon.findFirst({ where: { id, isPublic: true } });
}

export async function createSermon(createdBy: string, data: SermonInput) {
    return prisma.sermon.create({ data: { ...data, createdBy } });
}

export async function updateSermon(id: string, data: Partial<SermonInput>) {
    return prisma.sermon.update({ where: { id }, data });
}

export async function deleteSermon(id: string) {
    await prisma.sermon.delete({ where: { id } });
}
