import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@studio/database/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { payload } = body;

    if (!payload?.trim()) {
      return NextResponse.json({ error: 'Payload is required' }, { status: 400 });
    }

    let searchCode = payload.trim();
    if (searchCode.startsWith('/item/')) {
      searchCode = searchCode.replace('/item/', '');
    }

    // Try finding by ID first, then by inventoryCode
    let item = await prisma.inventoryItem.findFirst({
      where: {
        OR: [
          { id: searchCode },
          { inventoryCode: { equals: searchCode, mode: 'insensitive' } },
        ],
      },
      include: { category: true, children: true },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found for the scanned code' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      item: {
        ...item,
        stock: item.quantity,
        minStock: item.minQuantity,
      },
    });
  } catch (error: any) {
    console.error('[POST /api/scan] error:', error);
    return NextResponse.json({ error: 'Scan lookup failed', details: error?.message }, { status: 500 });
  }
}
