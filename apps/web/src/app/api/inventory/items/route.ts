import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@studio/database/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const location = searchParams.get('location') || '';
    const isKit = searchParams.get('isKit');
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const take = parseInt(searchParams.get('take') || '10', 10);

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { inventoryCode: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { assignedTo: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      const upperType = type.toUpperCase();
      if (upperType === 'EQUIPMENT' || upperType === 'CONSUMABLE') {
        where.type = upperType;
      }
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (isKit === 'true') {
      where.group = 'Kit';
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        skip,
        take,
        include: {
          category: {
            select: { id: true, name: true, color: true, icon: true },
          },
          children: {
            select: { id: true, name: true, inventoryCode: true, quantity: true, status: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    // Format items to map `quantity` to `stock` and `minQuantity` to `minStock` for backward compatibility
    const formatted = items.map((item) => ({
      ...item,
      stock: item.quantity,
      minStock: item.minQuantity,
      isKit: item.group === 'Kit' || (item.children && item.children.length > 0),
    }));

    return NextResponse.json({ items: formatted, total });
  } catch (error: any) {
    console.error('[GET /api/inventory/items] error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory items', details: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      categoryId,
      type = 'EQUIPMENT',
      stock = 0,
      quantity,
      minStock = 0,
      minQuantity,
      unit = 'pcs',
      status = 'Good Condition',
      statusDetails,
      location,
      locationId,
      aisle,
      shelf,
      bin,
      assignedTo,
      imageUrl,
      isApprovalRequired = false,
      isKit = false,
      nextMaintenanceDate,
      parentId,
      inventoryCode,
    } = body;

    if (!name || !categoryId) {
      return NextResponse.json({ error: 'Name and Category are required' }, { status: 400 });
    }

    const finalQuantity = quantity !== undefined ? Number(quantity) : Number(stock) || 0;
    const finalMinQuantity = minQuantity !== undefined ? Number(minQuantity) : Number(minStock) || 0;
    const finalType = (type || 'EQUIPMENT').toUpperCase() === 'CONSUMABLE' ? 'CONSUMABLE' : 'EQUIPMENT';
    const finalLocation = location || locationId || null;

    // Generate inventoryCode if not provided
    let finalCode = inventoryCode?.trim();
    if (!finalCode) {
      const prefix = finalType === 'CONSUMABLE' ? 'CON' : 'EQP';
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      finalCode = `${prefix}-${Date.now().toString().slice(-4)}-${rand}`;
    }

    const newItem = await prisma.inventoryItem.create({
      data: {
        name,
        categoryId,
        type: finalType,
        quantity: finalQuantity,
        minQuantity: finalMinQuantity,
        unit,
        status: status || (finalQuantity === 0 ? 'Out of Stock' : 'Good Condition'),
        statusDetails: statusDetails || null,
        location: finalLocation,
        aisle: aisle || null,
        shelf: shelf || null,
        bin: bin || null,
        assignedTo: assignedTo || null,
        imageUrl: imageUrl || null,
        isApprovalRequired: Boolean(isApprovalRequired),
        group: isKit ? 'Kit' : null,
        nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate) : null,
        parentId: parentId || null,
        inventoryCode: finalCode,
      },
      include: {
        category: true,
      },
    });

    // Create initial stock log
    if (finalQuantity > 0) {
      await prisma.inventoryLog.create({
        data: {
          itemId: newItem.id,
          type: 'Stock In',
          quantity: finalQuantity,
          balance: finalQuantity,
          notes: 'Initial inventory stock creation',
        },
      });
    }

    return NextResponse.json({
      ...newItem,
      stock: newItem.quantity,
      minStock: newItem.minQuantity,
      isKit: newItem.group === 'Kit',
    });
  } catch (error: any) {
    console.error('[POST /api/inventory/items] error:', error);
    return NextResponse.json({ error: 'Failed to create inventory item', details: error?.message }, { status: 500 });
  }
}
