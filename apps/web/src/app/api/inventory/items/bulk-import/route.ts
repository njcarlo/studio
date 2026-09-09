import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@studio/database/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = body.items || body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Array of items is required' }, { status: 400 });
    }

    // Fetch existing categories to match or create
    const existingCats = await prisma.inventoryCategory.findMany();
    const catMap = new Map<string, string>();
    existingCats.forEach((c) => {
      catMap.set(c.name.toLowerCase().trim(), c.id);
    });

    let defaultCatId = existingCats[0]?.id;
    if (!defaultCatId) {
      const created = await prisma.inventoryCategory.create({
        data: { name: 'General', color: '#3b82f6', icon: 'box' },
      });
      defaultCatId = created.id;
      catMap.set('general', created.id);
    }

    let createdCount = 0;

    for (const raw of items) {
      const name = (raw.name || raw['Item Name'] || raw.Name || '').trim();
      if (!name) continue;

      const categoryName = (raw.category || raw.Category || raw['Category Name'] || 'General').trim();
      let categoryId = catMap.get(categoryName.toLowerCase());

      if (!categoryId) {
        const newCat = await prisma.inventoryCategory.create({
          data: { name: categoryName, color: '#6366f1', icon: 'box' },
        });
        categoryId = newCat.id;
        catMap.set(categoryName.toLowerCase(), newCat.id);
      }

      const qty = Number(raw.stock || raw.quantity || raw['Quantity'] || raw['Stock']) || 0;
      const minQty = Number(raw.minStock || raw.minQuantity || raw['Min Stock'] || raw['Min Quantity']) || 0;
      const typeStr = (raw.type || raw.Type || 'Equipment').toString().toUpperCase();
      const type = typeStr === 'CONSUMABLE' ? 'CONSUMABLE' : 'EQUIPMENT';
      const unit = (raw.unit || raw.Unit || 'pcs').trim();
      const status = raw.status || raw.Status || (qty === 0 ? 'Out of Stock' : 'Good Condition');
      const location = (raw.location || raw.Location || '').trim() || null;
      const aisle = (raw.aisle || raw.Aisle || '').trim() || null;
      const shelf = (raw.shelf || raw.Shelf || '').trim() || null;
      const bin = (raw.bin || raw.Bin || '').trim() || null;
      const assignedTo = (raw.assignedTo || raw['Assigned To'] || '').trim() || null;

      let code = (raw.inventoryCode || raw['Inventory Code'] || raw.code || '').trim();
      if (!code) {
        const prefix = type === 'CONSUMABLE' ? 'CON' : 'EQP';
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        code = `${prefix}-${Date.now().toString().slice(-4)}-${rand}`;
      }

      const item = await prisma.inventoryItem.create({
        data: {
          name,
          categoryId: categoryId || defaultCatId,
          type,
          quantity: qty,
          minQuantity: minQty,
          unit,
          status,
          location,
          aisle,
          shelf,
          bin,
          assignedTo,
          inventoryCode: code,
        },
      });

      if (qty > 0) {
        await prisma.inventoryLog.create({
          data: {
            itemId: item.id,
            type: 'Stock In',
            quantity: qty,
            balance: qty,
            notes: 'Bulk imported into inventory',
          },
        });
      }

      createdCount++;
    }

    return NextResponse.json({ success: true, count: createdCount });
  } catch (error: any) {
    console.error('[POST /api/inventory/items/bulk-import] error:', error);
    return NextResponse.json({ error: 'Bulk import failed', details: error?.message }, { status: 500 });
  }
}
