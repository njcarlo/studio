import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler, jsonError } from '../lib/http';

// Ported from supabase/functions/meals.
export const meals = Router();

meals.get('/meal-stubs', asyncHandler(async (req, res) => {
  const { workerId, scheduleId, status } = req.query as Record<string, string | undefined>;
  const rows = await prisma.mealStub.findMany({
    where: { ...(workerId ? { workerId } : {}), ...(scheduleId ? { scheduleId } : {}), ...(status ? { status } : {}) },
    orderBy: { date: 'desc' },
  });
  res.json(rows);
}));

meals.get('/meal-stubs/:id', asyncHandler(async (req, res) => {
  const stub = await prisma.mealStub.findUnique({ where: { id: req.params.id } });
  if (!stub) return jsonError(res, 'Meal stub not found', 404);
  res.json(stub);
}));

meals.post('/meal-stubs', asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const created = await prisma.mealStub.create({
    data: { ...body, date: body.date ?? new Date().toISOString(), status: body.status ?? 'Available' },
  });
  res.status(201).json(created);
}));

meals.post('/meal-stubs/bulk', asyncHandler(async (req, res) => {
  const { stubs } = req.body ?? {};
  if (!Array.isArray(stubs) || !stubs.length) return jsonError(res, 'stubs array required', 400);
  const data = stubs.map((s: any) => ({ ...s, date: s.date ?? new Date().toISOString(), status: s.status ?? 'Available' }));
  const created = await prisma.$transaction(data.map((d: any) => prisma.mealStub.create({ data: d })));
  res.status(201).json(created);
}));

meals.put('/meal-stubs/:id', asyncHandler(async (req, res) => {
  try {
    const updated = await prisma.mealStub.update({ where: { id: req.params.id }, data: req.body ?? {} });
    res.json(updated);
  } catch {
    return jsonError(res, 'Meal stub not found', 404);
  }
}));

meals.delete('/meal-stubs/:id', asyncHandler(async (req, res) => {
  await prisma.mealStub.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

meals.post('/meal-stubs/:id/claim', asyncHandler(async (req, res) => {
  const stub = await prisma.mealStub.findUnique({ where: { id: req.params.id }, select: { status: true } });
  if (!stub) return jsonError(res, 'Meal stub not found', 404);
  if (stub.status === 'Used' || stub.status === 'Claimed') return jsonError(res, 'Meal stub already claimed', 409);
  const updated = await prisma.mealStub.update({
    where: { id: req.params.id },
    data: { status: 'Used', claimedAt: new Date().toISOString() },
  });
  res.json(updated);
}));
