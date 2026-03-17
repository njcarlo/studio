import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 1. Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalItems = await prisma.item.count();
    const lowStockAlerts = await prisma.item.count({
      where: { status: 'Low Stock' }
    });
    const outOfStock = await prisma.item.count({
      where: { status: 'Out of Stock' }
    });
    const activeEquipment = await prisma.item.count({
      where: { type: 'Equipment', status: 'In Stock' }
    });
    const totalConsumables = await prisma.item.count({
      where: { type: 'Consumable' }
    });

    res.json({
      totalItems,
      lowStockAlerts,
      outOfStock,
      activeEquipment,
      totalConsumables,
      totalInventoryValue: `${totalItems} SKUs`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// 2. Activity Feed Logs
app.get('/api/inventory/logs', async (req, res) => {
  try {
    const logs = await prisma.inventoryLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        item: {
          select: { name: true }
        }
      }
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// 3. Master Inventory Table
app.get('/api/inventory/items', async (req, res) => {
  try {
    const { search, category, type, status, skip = "0", take = "10" } = req.query;
    
    const where: any = {};
    if (search) where.name = { contains: String(search) }; // SQLite doesn't support mode: 'insensitive' with native driver sometimes but contains works
    if (category) where.category = { name: String(category) };
    if (type) where.type = String(type);
    if (status) where.status = String(status);

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip: Number(skip),
        take: Number(take),
        include: {
          category: true,
          location: true
        },
        orderBy: { lastUpdated: 'desc' }
      }),
      prisma.item.count({ where })
    ]);

    res.json({ items, total });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// 4. Quick Stock In / Out
app.post('/api/inventory/items/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, quantity } = req.body; // action = "Stock In" or "Stock Out"

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const numQuantity = Number(quantity);
    let newStock = item.stock;

    if (action === 'Stock In') {
      newStock += numQuantity;
    } else if (action === 'Stock Out') {
      newStock -= numQuantity;
      if (newStock < 0) newStock = 0;
    }

    let newStatus = item.status;
    if (newStock === 0) newStatus = 'Out of Stock';
    else if (newStock < 10) newStatus = 'Low Stock';
    else newStatus = 'In Stock';

    // Run transaction
    const [updatedItem, log] = await prisma.$transaction([
      prisma.item.update({
        where: { id },
        data: { stock: newStock, status: newStatus }
      }),
      prisma.inventoryLog.create({
        data: {
          itemId: id,
          action,
          quantity: numQuantity
        }
      })
    ]);

    res.json({ updatedItem, log });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// 5. Bulk Actions (Update Status, Assign Location, etc)
app.patch('/api/inventory/items/bulk', async (req, res) => {
  try {
    const { itemIds, data } = req.body;
    
    // Only allow updating certain fields dynamically
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.locationId) updateData.locationId = data.locationId;

    const result = await prisma.item.updateMany({
      where: {
        id: { in: itemIds }
      },
      data: updateData
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update items' });
  }
});

// 6. Categories and Locations
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/locations', async (req, res) => {
  try {
    const locations = await prisma.location.findMany();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// 7. Create, Update, Delete Item
app.post('/api/inventory/items', async (req, res) => {
  try {
    const item = await prisma.item.create({ data: req.body });
    res.json(item);
  } catch (error) {
    console.error('Failed to create item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

app.put('/api/inventory/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.item.update({
      where: { id },
      data: req.body
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

app.delete('/api/inventory/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.item.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
