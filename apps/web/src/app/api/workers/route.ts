import { prisma } from '@studio/database/prisma';
import { NextResponse } from 'next/server';

/**
 * GET /api/workers
 * Returns all workers with their role.
 * Supports optional query params:
 *   ?search=john       — filter by name/email
 *   ?status=Active     — filter by status
 *   ?page=1&limit=50   — pagination
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    const where: any = {};

    if (status) {
        where.status = status;
    }

    if (search) {
        where.OR = [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { workerId: { contains: search, mode: 'insensitive' } },
        ];
    }

    try {
        const [total, workers] = await prisma.$transaction([
            prisma.worker.count({ where }),
            prisma.worker.findMany({
                where,
                select: {
                    id: true,
                    workerId: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    status: true,
                    employmentType: true,
                    avatarUrl: true,
                    majorMinistryId: true,
                    minorMinistryId: true,
                    roleId: true,
                    role: { select: { id: true, name: true } },
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);

        return NextResponse.json({
            data: workers,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error('GET /api/workers error:', error);
        return NextResponse.json({ error: 'Failed to fetch workers' }, { status: 500 });
    }
}
