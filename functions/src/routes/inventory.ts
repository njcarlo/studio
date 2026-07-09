import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler, jsonError, type AuthedRequest } from '../lib/http';

// Ported from supabase/functions/inventory.
export const inventory = Router();

inventory.get('/items', asyncHandler(async (req, res) => {
  const { categoryId, status } = req.query as Record<string, string | undefined>;
  const rows = await prisma.inventoryItem.findMany({
    where: { ...(categoryId ? { categoryId } : {}), ...(status ? { status } : {}) },
    include: { category: true },
    orderBy: { name: 'asc' },
  });
  res.json(rows);
}));

inventory.get('/items/:id', asyncHandler(async (req, res) => {
  const row = await prisma.inventoryItem.findUnique({
    where: { id: req.params.id },
    include: { category: true, borrowings: true, logs: true },
  });
  if (!row) return jsonError(res, 'Item not found', 404);
  res.json(row);
}));

inventory.post('/items', asyncHandler(async (req, res) => {
  const created = await prisma.inventoryItem.create({ data: req.body ?? {} });
  res.status(201).json(created);
}));

inventory.put('/items/:id', asyncHandler(async (req, res) => {
  try {
    const updated = await prisma.inventoryItem.update({ where: { id: req.params.id }, data: req.body ?? {} });
    res.json(updated);
  } catch {
    return jsonError(res, 'Item not found', 404);
  }
}));

inventory.delete('/items/:id', asyncHandler(async (req, res) => {
  const active = await prisma.inventoryBorrowing.findFirst({ where: { itemId: req.params.id, status: 'BORROWED' }, select: { id: true } });
  if (active) return jsonError(res, 'Item has active borrowings', 409);
  await prisma.inventoryItem.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

inventory.get('/categories', asyncHandler(async (_req, res) => {
  const rows = await prisma.inventoryCategory.findMany({ orderBy: { name: 'asc' } });
  res.json(rows);
}));

inventory.post('/categories', asyncHandler(async (req, res) => {
  const created = await prisma.inventoryCategory.create({ data: req.body ?? {} });
  res.status(201).json(created);
}));

inventory.put('/categories/:id', asyncHandler(async (req, res) => {
  try {
    const updated = await prisma.inventoryCategory.update({ where: { id: req.params.id }, data: req.body ?? {} });
    res.json(updated);
  } catch {
    return jsonError(res, 'Category not found', 404);
  }
}));

inventory.delete('/categories/:id', asyncHandler(async (req, res) => {
  await prisma.inventoryCategory.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

inventory.get('/logs', asyncHandler(async (req, res) => {
  const { itemId, workerId } = req.query as Record<string, string | undefined>;
  const rows = await prisma.inventoryLog.findMany({
    where: { ...(itemId ? { itemId } : {}), ...(workerId ? { workerId } : {}) },
    orderBy: { timestamp: 'desc' },
  });
  res.json(rows);
}));

inventory.post('/adjustments', asyncHandler(async (req: AuthedRequest, res) => {
  const { itemId, delta, type, notes } = req.body ?? {};
  if (!itemId || delta === undefined || !type) return jsonError(res, 'itemId, delta, type required', 400);
  // Atomic read-modify-write of quantity + log, matching adjust_item_stock's intent.
  const result = await prisma.$transaction(async (tx: any) => {
    const item = await tx.inventoryItem.findUnique({ where: { id: itemId }, select: { quantity: true } });
    if (!item) return null;
    const oldQty = item.quantity ?? 0;
    const newQty = Math.max(0, oldQty + delta);
    await tx.inventoryItem.update({ where: { id: itemId }, data: { quantity: newQty } });
    await tx.inventoryLog.create({
      data: { itemId, workerId: req.auth?.userId, type, quantity: Math.abs(delta), balance: newQty, notes, timestamp: new Date().toISOString() },
    });
    return { newQuantity: newQty, actualDelta: newQty - oldQty };
  });
  if (!result) return jsonError(res, 'Item not found', 404);
  res.json(result);
}));

inventory.get('/borrowings', asyncHandler(async (req, res) => {
  const { status, itemId } = req.query as Record<string, string | undefined>;
  const rows = await prisma.inventoryBorrowing.findMany({
    where: { ...(status ? { status } : {}), ...(itemId ? { itemId } : {}) },
    include: { item: true, borrower: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { borrowedAt: 'desc' },
  });
  res.json(rows);
}));

inventory.post('/borrowings', asyncHandler(async (req, res) => {
  const created = await prisma.inventoryBorrowing.create({
    data: { ...(req.body ?? {}), status: 'BORROWED', borrowedAt: new Date().toISOString() },
  });
  res.status(201).json(created);
}));

inventory.put('/borrowings/:id/return', asyncHandler(async (req, res) => {
  try {
    const updated = await prisma.inventoryBorrowing.update({
      where: { id: req.params.id },
      data: { ...(req.body ?? {}), status: 'RETURNED', returnedAt: new Date().toISOString() },
    });
    res.json(updated);
  } catch {
    return jsonError(res, 'Borrowing not found', 404);
  }
}));
