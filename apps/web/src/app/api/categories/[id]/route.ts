import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@studio/database/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, color, icon, group, isActive } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (group !== undefined) updateData.group = group || null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const category = await prisma.inventoryCategory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(category);
  } catch (error: any) {
    console.error('[PUT /api/categories/[id]] error:', error);
    return NextResponse.json({ error: 'Failed to update category', details: error?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check if there are items in this category
    const count = await prisma.inventoryItem.count({ where: { categoryId: id } });
    if (count > 0) {
      return NextResponse.json(
        { error: `Cannot delete category: ${count} item(s) are assigned to it. Please reassign items first.` },
        { status: 400 }
      );
    }

    await prisma.inventoryCategory.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Category deleted' });
  } catch (error: any) {
    console.error('[DELETE /api/categories/[id]] error:', error);
    return NextResponse.json({ error: 'Failed to delete category', details: error?.message }, { status: 500 });
  }
}
