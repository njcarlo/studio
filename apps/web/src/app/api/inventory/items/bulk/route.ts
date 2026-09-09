import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@studio/database/prisma';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemIds, data } = body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'itemIds array is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.categoryId) updateData.categoryId = data.categoryId;
    if (data.location) updateData.location = data.location;
    if (data.type) updateData.type = data.type.toUpperCase() === 'CONSUMABLE' ? 'CONSUMABLE' : 'EQUIPMENT';

    await prisma.inventoryItem.updateMany({
      where: { id: { in: itemIds } },
      data: updateData,
    });

    return NextResponse.json({ success: true, count: itemIds.length });
  } catch (error: any) {
    console.error('[PATCH /api/inventory/items/bulk] error:', error);
    return NextResponse.json({ error: 'Bulk update failed', details: error?.message }, { status: 500 });
  }
}
