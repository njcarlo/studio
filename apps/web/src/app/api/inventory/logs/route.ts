import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@studio/database/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const take = parseInt(searchParams.get('take') || '30', 10);
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const itemId = searchParams.get('itemId');

    const where: any = {};
    if (itemId) where.itemId = itemId;

    const logs = await prisma.inventoryLog.findMany({
      where,
      skip,
      take,
      orderBy: { timestamp: 'desc' },
      include: {
        item: {
          select: { id: true, name: true, inventoryCode: true, imageUrl: true },
        },
        worker: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    const formatted = logs.map((log) => ({
      ...log,
      action: log.type, // backward compatibility
      workerName: log.worker ? `${log.worker.firstName} ${log.worker.lastName}` : (log.workerId || 'Admin'),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('[GET /api/inventory/logs] error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory logs', details: error?.message }, { status: 500 });
  }
}
