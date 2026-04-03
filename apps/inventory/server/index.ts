import express from 'express';
import cors from 'cors';
import { PrismaClient } from '../src/generated/client';
import dotenv from 'dotenv';
import QRCode from 'qrcode';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── Helper ───────────────────────────────────────────────────────────────────
function qrPayload(id: string) {
  return `/item/${id}`;
}

function jsonParse(val: string | null | undefined, fallback: any = null) {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

// ─── 1. Dashboard Stats ───────────────────────────────────────────────────────
app.get('/api/dashboard/stats', async (_req, res) => {
  try {
    const [totalItems, borrowedCount, overdueCount, lowStockAlerts, outOfStock] = await Promise.all([
      prisma.item.count(),
      prisma.inventoryBorrowing.count({ where: { status: 'BORROWED' } }),
      prisma.inventoryBorrowing.count({
        where: { status: 'BORROWED', dueDate: { lt: new Date() } }
      }),
      prisma.item.count({ where: { stock: { gt: 0 }, minStock: { gt: 0 }, AND: [{ stock: { lte: prisma.item.fields.minStock } }] } }).catch(() => 0),
      prisma.item.count({ where: { stock: 0 } })
    ]);

    res.json({
      totalItems,
      borrowedCount,
      overdueCount,
      lowStockAlerts,
      outOfStock,
      totalInventoryValue: `${totalItems} SKUs`
    });
  } catch (error) {
    console.error(error);
    // Fallback stats
    const totalItems = await prisma.item.count().catch(() => 0);
    res.json({ totalItems, borrowedCount: 0, overdueCount: 0, lowStockAlerts: 0, outOfStock: 0, totalInventoryValue: `${totalItems} SKUs` });
  }
});

// ─── 2. Activity / Inventory Logs ─────────────────────────────────────────────
app.get('/api/inventory/logs', async (req, res) => {
  try {
    const take = Number(req.query.take) || 20;
    const logs = await prisma.inventoryLog.findMany({
      take,
      orderBy: { timestamp: 'desc' },
      include: { item: { select: { name: true, inventoryCode: true } } }
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// ─── 2.5 Detailed Audit Trail ──────────────────────────────────────────────────
app.get('/api/inventory/audit', async (req, res) => {
  try {
    const take = Number(req.query.take) || 50;
    const skip = Number(req.query.skip) || 0;
    
    // We fetch a bit more from both and merge/sort safely
    const [rawLogs, rawAudits] = await Promise.all([
      prisma.inventoryLog.findMany({
        take: take + skip,
        orderBy: { timestamp: 'desc' },
        include: { item: { select: { name: true, inventoryCode: true } } }
      }),
      prisma.itemAudit.findMany({
        take: take + skip,
        orderBy: { timestamp: 'desc' }
      })
    ]);

    const logs = rawLogs.map(l => ({ type: 'LOG', timestamp: l.timestamp, data: l }));
    const audits = rawAudits.map(a => ({ type: 'AUDIT', timestamp: a.timestamp, data: a }));

    const combined = [...logs, ...audits]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(skip, skip + take);
      
    res.json(combined);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch audit trail' });
  }
});

// ─── 2.8 Consumable Analytics & Reports ───────────────────────────────────────
app.get('/api/inventory/analytics', async (req, res) => {
  try {
    const totalItems = await prisma.item.count();
    
    // Category Distribution
    const categories = await prisma.category.findMany({
      include: { _count: { select: { items: true } } }
    });
    const stockByCategory = categories.map(c => ({
      name: c.name,
      count: c._count.items
    }));

    // Find Low Stock / Out of Stock Items (Default Safety Threshold is 5)
    let allItems = await prisma.item.findMany({
      select: { id: true, name: true, inventoryCode: true, stock: true, minStock: true, status: true }
    });
    
    // Automatically apply 5 as safety baseline if they didn't manually set a minStock
    allItems = allItems.map(i => ({
      ...i,
      minStock: i.minStock > 0 ? i.minStock : 5
    }));

    const lowStockItems = allItems.filter(i => 
      i.stock <= i.minStock || 
      i.stock === 0 || 
      i.status === 'Low Stock' || 
      i.status === 'Out of Stock'
    );

    // Find Heavily Used Equipment (Top 5 Checkouts)
    const checkouts = await prisma.inventoryLog.groupBy({
      by: ['itemId'],
      where: { action: 'Checkout' },
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
      take: 5
    });

    const mostUsed = await Promise.all(
      checkouts.map(async (c) => {
         const item = await prisma.item.findUnique({ where: { id: c.itemId }, select: { name: true, inventoryCode: true } });
         return { item, count: c._count.action };
      })
    );

    res.json({
      totalItems,
      stockByCategory,
      lowStockItems,
      mostUsed
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ─── 3. List Inventory Items ──────────────────────────────────────────────────
app.get('/api/inventory/items', async (req, res) => {
  try {
    const {
      search, category, type, status,
      skip = '0', take = '10'
    } = req.query as Record<string, string>;

    const where: any = {};
    if (search) where.name = { contains: search };
    if (category) where.category = { name: category };
    if (type) where.type = type;

    // Map intuitive status to stock amounts instead of DB strings
    if (status) {
      if (status === 'In Stock') {
        where.stock = { gte: 10 };
      } else if (status === 'Low Stock') {
        where.stock = { gt: 0, lt: 10 };
      } else if (status === 'Out of Stock') {
        where.stock = 0;
      } else {
        where.status = status;
      }
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip: Number(skip),
        take: Number(take),
        include: { category: true, location: true },
        orderBy: { lastUpdated: 'desc' }
      }),
      prisma.item.count({ where })
    ]);

    res.json({ items, total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// ─── 4. Get Single Item ───────────────────────────────────────────────────────
app.get('/api/inventory/items/:id', async (req, res) => {
  try {
    const item = await prisma.item.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        location: true,
        borrowings: {
          orderBy: { borrowedAt: 'desc' },
          take: 5
        },
        logs: { orderBy: { timestamp: 'desc' }, take: 10 }
      }
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// ─── 5. Create Item ───────────────────────────────────────────────────────────
app.post('/api/inventory/items', async (req, res) => {
  try {
    const { categoryId, locationId, name, type, stock, minStock, unit, status, statusDetails, imageUrl, inventoryCode, aisle, shelf, bin, isApprovalRequired } = req.body;

    let finalCode = inventoryCode;
    if (!finalCode && categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      const prefixes: Record<string, string> = {
        'Battery': 'BAT',
        'Camera': 'CAM',
        'Card reader': 'CDR',
        'Communicator': 'COM',
        'External HardDrive': 'EXHD',
        'Lens': 'LENS',
        'Mini Converters': 'MIC',
        'Monitors': 'MON',
        'NDI': 'NDI',
        'Power Supply': 'POS',
        'Stabilizer Gimbal': 'STG',
        'Tripod': 'TRI',
        'Video Switcher': 'VDS',
        'Vmount Battery': 'VBAT',
        'Wireless Video Transmitter': 'WVT'
      };

      const prefix = category ? (prefixes[category.name] || 'ITM') : 'ITM';
      const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      finalCode = `${prefix}-${suffix}`;
    }

    const item = await prisma.item.create({
      data: {
        categoryId,
        locationId: locationId || null,
        name,
        type: type || 'Equipment',
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 0,
        unit: unit || 'pcs',
        status: status || 'Good Condition',
        statusDetails: statusDetails || null,
        imageUrl: imageUrl || null,
        inventoryCode: finalCode || null,
        aisle: aisle || null,
        shelf: shelf || null,
        bin: bin || null,
        isApprovalRequired: Boolean(isApprovalRequired)
      },
      include: { category: true, location: true }
    });

    await prisma.itemAudit.create({
      data: {
        itemId: item.id,
        itemName: item.name,
        action: 'CREATED',
        userName: 'System User', // Placeholder until auth is fully hooked
        changes: JSON.stringify(item)
      }
    });

    res.json(item);
  } catch (error) {
    console.error('Failed to create item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// ─── 6. Update Item ───────────────────────────────────────────────────────────
app.put('/api/inventory/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    
    const oldItem = await prisma.item.findUnique({ where: { id } });
    if (!oldItem) return res.status(404).json({ error: 'Item not found' });

    const data: any = {};
    const fields = ['categoryId', 'locationId', 'name', 'type', 'stock', 'minStock', 'unit', 'status', 'statusDetails', 'imageUrl', 'inventoryCode', 'aisle', 'shelf', 'bin', 'isApprovalRequired', 'assignedTo'];
    for (const f of fields) {
      if (body[f] !== undefined) {
        if (f === 'stock' || f === 'minStock') data[f] = Number(body[f]);
        else if (f === 'isApprovalRequired') data[f] = Boolean(body[f]);
        else data[f] = body[f];
      }
    }

    const item = await prisma.item.update({
      where: { id },
      data,
      include: { category: true, location: true }
    });

    // Create a precise diff payload showing before -> after
    const diff: any = {};
    for (const key of Object.keys(data)) {
      const oldVal = oldItem[key as keyof typeof oldItem];
      const newVal = data[key];
      if (oldVal !== newVal) {
        diff[key] = { from: oldVal, to: newVal };
      }
    }

    await prisma.itemAudit.create({
      data: {
        itemId: item.id,
        itemName: item.name,
        action: 'UPDATED',
        userName: 'System User',
        changes: JSON.stringify(Object.keys(diff).length > 0 ? diff : data)
      }
    });

    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// ─── 7. Delete Item ───────────────────────────────────────────────────────────
app.delete('/api/inventory/items/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const item = await prisma.item.findUnique({ where: { id } });

    if (item) {
      await prisma.itemAudit.create({
        data: {
          itemId: null, // set to null since we are deleting the item
          itemName: item.name,
          action: 'DELETED',
          userName: 'System User',
          changes: JSON.stringify(item)
        }
      });
    }

    await prisma.$transaction([
      prisma.inventoryBorrowing.deleteMany({ where: { itemId: id } }),
      prisma.inventoryLog.deleteMany({ where: { itemId: id } }),
      prisma.item.delete({ where: { id } })
    ]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// ─── 8. Quick Stock In/Out ────────────────────────────────────────────────────
app.post('/api/inventory/items/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, quantity, notes, workerId } = req.body;

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const numQty = Number(quantity) || 1;
    let newQty = item.stock;

    if (action === 'Stock In') newQty += numQty;
    else if (action === 'Stock Out') newQty = Math.max(0, newQty - numQty);

    const [updatedItem, log] = await prisma.$transaction([
      prisma.item.update({
        where: { id },
        data: { stock: newQty },
        include: { category: true, location: true }
      }),
      prisma.inventoryLog.create({
        data: {
          itemId: id,
          workerId: workerId || null,
          action,
          quantity: numQty,
          balance: newQty,
          notes: notes || null
        }
      })
    ]);

    res.json({ updatedItem, log });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// ─── 9. Bulk Update ───────────────────────────────────────────────────────────
app.patch('/api/inventory/items/bulk', async (req, res) => {
  try {
    const { itemIds, data } = req.body;
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.locationId) updateData.locationId = data.locationId;

    const result = await prisma.item.updateMany({
      where: { id: { in: itemIds } },
      data: updateData
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update items' });
  }
});

// ─── 9.5 Bulk Delete ──────────────────────────────────────────────────────────
app.post('/api/inventory/items/bulk-delete', async (req, res) => {
  try {
    const { itemIds } = req.body;
    if (!itemIds || !Array.isArray(itemIds)) return res.status(400).json({ error: 'No itemIds provided' });

    await prisma.$transaction([
      prisma.inventoryBorrowing.deleteMany({ where: { itemId: { in: itemIds } } }),
      prisma.inventoryLog.deleteMany({ where: { itemId: { in: itemIds } } }),
      prisma.item.deleteMany({ where: { id: { in: itemIds } } })
    ]);
    res.json({ success: true });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to bulk delete items' });
  }
});

// ─── 9.6 Bulk Import ──────────────────────────────────────────────────────────
app.post('/api/inventory/items/bulk-import', async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'No items provided' });

    let importedCount = 0;

    for (const row of items) {
      if (!row.name) continue;

      // Ensure Category exists
      const catName = row.category || 'Uncategorized';
      let category = await prisma.category.findUnique({ where: { name: catName } });
      if (!category) {
        category = await prisma.category.create({ data: { name: catName } });
      }

      // Ensure Location exists
      let locationId = null;
      const locStr = row.location ? String(row.location).trim() : null;
      
      if (locStr) {
        let location = await prisma.location.findUnique({ where: { name: locStr } });
        if (!location) {
          location = await prisma.location.create({ data: { name: locStr } });
        }
        locationId = location.id;
      }

      const prefixes: Record<string, string> = {
        'Battery': 'BAT', 'Camera': 'CAM', 'Lens': 'LENS', 'Monitors': 'MON', 'Tripod': 'TRI'
      };
      const prefix = prefixes[category.name] || 'ITM';
      const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const inventoryCode = row.inventoryCode || `${prefix}-${suffix}`;

      // Search if item exists to prevent Unique Constraint crashes
      const existingItem = await prisma.item.findUnique({ where: { inventoryCode } });

      if (existingItem) {
        await prisma.item.update({
          where: { id: existingItem.id },
          data: {
            name: row.name,
            categoryId: category.id,
            locationId: locStr ? locationId : existingItem.locationId,
            type: row.type || existingItem.type,
            stock: row.stock !== undefined ? Number(row.stock) : existingItem.stock,
            minStock: row.minStock !== undefined ? Number(row.minStock) : existingItem.minStock,
            unit: row.unit || existingItem.unit,
            status: row.status || existingItem.status
          }
        });
      } else {
        await prisma.item.create({
          data: {
            name: row.name,
            categoryId: category.id,
            locationId,
            type: row.type || 'Equipment',
            stock: Number(row.stock) || 0,
            minStock: Number(row.minStock) || 0,
            unit: row.unit || 'pcs',
            status: row.status || 'Good Condition',
            inventoryCode
          }
        });
      }
      importedCount++;
    }

    res.json({ success: true, count: importedCount });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: 'Failed to bulk import items' });
  }
});


// ─── 10. Categories ───────────────────────────────────────────────────────────
app.get('/api/categories', async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { items: true } } }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    const cat = await prisma.category.create({ data: { name, description, color, icon } });
    res.json(cat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { name, description, color, icon, isActive } = req.body;
    const cat = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, description, color, icon, isActive }
    });
    res.json(cat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ─── 11. Locations ────────────────────────────────────────────────────────────
app.get('/api/locations', async (_req, res) => {
  try {
    const locations = await prisma.location.findMany({ orderBy: { name: 'asc' } });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// ─── 12. QR Code Generation ───────────────────────────────────────────────────

// Single item QR
app.get('/api/items/:id/qr', async (req, res) => {
  try {
    const item = await prisma.item.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, inventoryCode: true }
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const payload = qrPayload(item.id);
    const [pngDataUrl, svgString] = await Promise.all([
      QRCode.toDataURL(payload, { width: 300, margin: 2, errorCorrectionLevel: 'H' }),
      QRCode.toString(payload, { type: 'svg', width: 300, margin: 2, errorCorrectionLevel: 'H' })
    ]);

    res.json({ itemId: item.id, itemName: item.name, inventoryCode: item.inventoryCode, payload, pngDataUrl, svgString });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Batch QR
app.get('/api/items/qr/batch', async (req, res) => {
  try {
    let ids: string[] = [];
    if (typeof req.query.ids === 'string') ids = req.query.ids.split(',');
    else if (Array.isArray(req.query.ids)) ids = req.query.ids as string[];

    if (!ids.length) return res.status(400).json({ error: 'No IDs provided' });

    const items = await prisma.item.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, inventoryCode: true }
    });

    const results = await Promise.all(
      items.map(async (item) => {
        const payload = qrPayload(item.id);
        const pngDataUrl = await QRCode.toDataURL(payload, { width: 200, margin: 2, errorCorrectionLevel: 'H' });
        return { itemId: item.id, itemName: item.name, inventoryCode: item.inventoryCode, payload, pngDataUrl };
      })
    );

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate batch QR codes' });
  }
});

// ─── 13. Scan to Lookup ──────────────────────────────────────────────────────
app.post('/api/scan', async (req, res) => {
  try {
    const { payload } = req.body;
    if (!payload) return res.status(400).json({ error: 'No payload provided' });

    let searchId = String(payload).trim();
    const match = searchId.match(/\/item\/([a-zA-Z0-9_-]+)/i);
    if (match) searchId = match[1];

    const lowerSearchId = searchId.toLowerCase();

    const item = await prisma.item.findFirst({
      where: {
        OR: [
          { id: searchId },
          { inventoryCode: searchId },
          { id: { startsWith: lowerSearchId } }
        ]
      },
      include: {
        category: true,
        location: true,
        borrowings: {
          where: { status: 'BORROWED' },
          take: 1,
          orderBy: { borrowedAt: 'desc' }
        }
      }
    });

    if (!item) return res.status(404).json({ error: 'Item not found' });

    const activeBorrowing = item.borrowings[0] || null;
    res.json({ item, activeBorrowing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Scan lookup failed' });
  }
});

// ─── 14. Borrowings ───────────────────────────────────────────────────────────

// List borrowings
app.get('/api/borrowings', async (req, res) => {
  try {
    const { status, itemId, borrowerId, skip = '0', take = '20' } = req.query as Record<string, string>;
    const where: any = {};
    if (status) where.status = status;
    if (itemId) where.itemId = itemId;
    if (borrowerId) where.borrowerId = borrowerId;

    const [rawBorrowings, total] = await Promise.all([
      prisma.inventoryBorrowing.findMany({
        where,
        skip: Number(skip),
        take: Number(take),
        orderBy: { borrowedAt: 'desc' },
        include: { item: { select: { id: true, name: true, inventoryCode: true, status: true, imageUrl: true } } }
      }),
      prisma.inventoryBorrowing.count({ where })
    ]);

    // Parse JSON checklist fields
    const borrowings = rawBorrowings.map(b => ({
      ...b,
      checkoutChecklist: jsonParse(b.checkoutChecklist),
      returnChecklist: jsonParse(b.returnChecklist),
      returnPhotos: jsonParse(b.returnPhotos, [])
    }));

    res.json({ borrowings, total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch borrowings' });
  }
});

// Overdue borrowings
app.get('/api/borrowings/overdue', async (_req, res) => {
  try {
    const overdue = await prisma.inventoryBorrowing.findMany({
      where: { status: 'BORROWED', dueDate: { lt: new Date() } },
      include: { item: { select: { id: true, name: true, inventoryCode: true } } },
      orderBy: { dueDate: 'asc' }
    });
    res.json(overdue.map(b => ({
      ...b,
      checkoutChecklist: jsonParse(b.checkoutChecklist),
      returnChecklist: jsonParse(b.returnChecklist),
      returnPhotos: jsonParse(b.returnPhotos, [])
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch overdue borrowings' });
  }
});

// Get single borrowing  
app.get('/api/borrowings/:id', async (req, res) => {
  try {
    const b = await prisma.inventoryBorrowing.findUnique({
      where: { id: req.params.id },
      include: { item: { select: { id: true, name: true, inventoryCode: true, status: true } } }
    });
    if (!b) return res.status(404).json({ error: 'Not found' });
    res.json({
      ...b,
      checkoutChecklist: jsonParse(b.checkoutChecklist),
      returnChecklist: jsonParse(b.returnChecklist),
      returnPhotos: jsonParse(b.returnPhotos, [])
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch borrowing' });
  }
});

// Create borrowing (Checkout)
app.post('/api/borrowings', async (req, res) => {
  try {
    const { itemId, borrowerId, borrowerName, borrowerEmail, dueDate, checkoutNotes, checkoutCondition, checkoutChecklist, quantity } = req.body;

    if (!itemId || !borrowerId || !borrowerName) {
      return res.status(400).json({ error: 'itemId, borrowerId and borrowerName are required' });
    }

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.status === 'Damaged') return res.status(400).json({ error: 'Item is damaged and cannot be borrowed' });

    const numQty = Number(quantity) || 1;
    if (item.stock < numQty) {
      return res.status(400).json({ error: `Not enough stock (Only ${item.stock} left)` });
    }

    const borrowing = await prisma.$transaction(async (tx) => {
      const b = await tx.inventoryBorrowing.create({
        data: {
          itemId,
          borrowerId,
          borrowerName,
          borrowerEmail: borrowerEmail || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          status: 'BORROWED',
          quantity: numQty,
          checkoutNotes: checkoutNotes || null,
          checkoutCondition: checkoutCondition || null,
          checkoutChecklist: checkoutChecklist ? JSON.stringify(checkoutChecklist) : null
        },
        include: { item: { select: { id: true, name: true, inventoryCode: true, imageUrl: true } } }
      });
      const newStock = item.stock - numQty;
      await tx.item.update({
        where: { id: itemId },
        data: {
          stock: newStock,
          status: newStock === 0 && item.status !== 'Borrowed' && item.type === 'Equipment' ? 'Borrowed' : item.status
        }
      });
      await tx.inventoryLog.create({
        data: {
          itemId,
          workerId: borrowerId,
          action: 'Stock Out',
          quantity: numQty,
          balance: newStock,
          notes: `Checked out to ${borrowerName}${checkoutNotes ? '. ' + checkoutNotes : ''}`
        }
      });
      return b;
    });

    res.json({
      ...borrowing,
      checkoutChecklist: jsonParse((borrowing as any).checkoutChecklist)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create borrowing' });
  }
});

// Return item
app.patch('/api/borrowings/:id/return', async (req, res) => {
  try {
    const { id } = req.params;
    const { returnNotes, returnCondition, returnChecklist, returnPhotos, damaged } = req.body;

    const borrowing = await prisma.inventoryBorrowing.findUnique({ where: { id } });
    if (!borrowing) return res.status(404).json({ error: 'Borrowing not found' });
    if (borrowing.status === 'RETURNED') return res.status(400).json({ error: 'Already returned' });

    const newItemStatus = damaged ? 'Damaged' : 'Good Condition';

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.inventoryBorrowing.update({
        where: { id },
        data: {
          returnedAt: new Date(),
          status: 'RETURNED',
          returnNotes: returnNotes || null,
          returnCondition: returnCondition || null,
          returnChecklist: returnChecklist ? JSON.stringify(returnChecklist) : null,
          returnPhotos: returnPhotos ? JSON.stringify(returnPhotos) : null
        },
        include: { item: { select: { id: true, name: true, inventoryCode: true, imageUrl: true } } }
      });

      const item2 = await tx.item.findUnique({ where: { id: borrowing.itemId } });
      const currentStock = item2?.stock || 0;
      const returnedQty = (borrowing as any).quantity || 1;
      const newStock = currentStock + returnedQty;

      await tx.item.update({
        where: { id: borrowing.itemId },
        data: {
          stock: newStock,
          status: damaged ? 'Damaged' : (newStock > 0 && item2?.status === 'Borrowed' ? 'Good Condition' : undefined)
        }
      });

      await tx.inventoryLog.create({
        data: {
          itemId: borrowing.itemId,
          workerId: borrowing.borrowerId,
          action: 'Stock In',
          quantity: returnedQty,
          balance: newStock,
          notes: `Returned by ${borrowing.borrowerName}. Condition: ${returnCondition || 'N/A'}${damaged ? ' — DAMAGED' : ''}`
        }
      });
      return b;
    });

    res.json({
      ...updated,
      checkoutChecklist: jsonParse((updated as any).checkoutChecklist),
      returnChecklist: jsonParse((updated as any).returnChecklist),
      returnPhotos: jsonParse((updated as any).returnPhotos, [])
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process return' });
  }
});

// ─── 15. Checklist Templates ──────────────────────────────────────────────────
const DEFAULT_TEMPLATES = [
  {
    id: 'checkout_default',
    name: 'Standard Checkout',
    type: 'checkout',
    items: [
      { id: '1', label: 'Battery / Power charged', required: false },
      { id: '2', label: 'No visible physical damage', required: false },
      { id: '3', label: 'All accessories included', required: false },
      { id: '4', label: 'Item cleaned and sanitized', required: false },
      { id: '5', label: 'Serial number verified', required: false }
    ]
  },
  {
    id: 'return_default',
    name: 'Standard Return',
    type: 'return',
    items: [
      { id: '1', label: 'Item returned complete (no missing parts)', required: true },
      { id: '2', label: 'No new physical damage', required: false },
      { id: '3', label: 'Cleaned before return', required: false },
      { id: '4', label: 'Battery / Power level acceptable', required: false }
    ]
  }
];

app.get('/api/checklist-templates', async (_req, res) => {
  // Always use DEFAULT_TEMPLATES so changes apply immediately
  res.json(DEFAULT_TEMPLATES);
});

app.put('/api/checklist-templates', async (req, res) => {
  try {
    const { templates } = req.body;
    await prisma.setting.upsert({
      where: { id: 'checklist_templates' },
      update: { data: JSON.stringify({ templates }) },
      create: { id: 'checklist_templates', data: JSON.stringify({ templates }) }
    });
    res.json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save templates' });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`✅ Inventory API running at http://localhost:${port}`);
});
