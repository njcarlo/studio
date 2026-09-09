import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@studio/database/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const take = parseInt(searchParams.get('take') || '50', 10);
    const skip = parseInt(searchParams.get('skip') || '0', 10);

    const logs = await prisma.inventoryLog.findMany({
      skip,
      take,
      orderBy: { timestamp: 'desc' },
      include: {
        item: {
          select: { id: true, name: true, inventoryCode: true },
        },
        worker: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    const timeline = logs.map((l) => ({
      type: 'LOG',
      timestamp: l.timestamp,
      data: {
        ...l,
        action: l.type,
        workerId: l.worker ? `${l.worker.firstName} ${l.worker.lastName}` : (l.workerId || 'Admin'),
      },
    }));

    return NextResponse.json(timeline);
  } catch (error: any) {
    console.error('[GET /api/inventory/audit] error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs', details: error?.message }, { status: 500 });
  }
}
