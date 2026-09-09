import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@studio/database/prisma';

export async function GET() {
  try {
    const categories = await prisma.inventoryCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { items: true } },
      },
    });

    const formatted = categories.map((c) => ({
      ...c,
      itemCount: c._count.items,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('[GET /api/categories] error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories', details: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, color = '#3b82f6', icon = 'box', group } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const category = await prisma.inventoryCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color,
        icon,
        group: group || null,
      },
    });

    return NextResponse.json(category);
  } catch (error: any) {
    console.error('[POST /api/categories] error:', error);
    return NextResponse.json({ error: 'Failed to create category', details: error?.message }, { status: 500 });
  }
}
