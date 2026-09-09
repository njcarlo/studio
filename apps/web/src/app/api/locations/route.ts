import { NextResponse } from 'next/server';
import { prisma } from '@studio/database/prisma';

export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany({
      where: { location: { not: null } },
      select: { location: true },
      distinct: ['location'],
    });

    const locations = items
      .map((i) => i.location)
      .filter((loc): loc is string => Boolean(loc && loc.trim()))
      .map((name, idx) => ({ id: `loc-${idx}`, name }));

    return NextResponse.json(locations);
  } catch (error: any) {
    console.error('[GET /api/locations] error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
