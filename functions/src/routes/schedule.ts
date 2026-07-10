import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler, jsonError, type AuthedRequest } from '../lib/http';

// Ported from supabase/functions/schedule.
export const schedule = Router();

// ── Service schedules ─────────────────────────────────────────────────
schedule.get('/schedules', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query as Record<string, string | undefined>;
  const rows = await prisma.serviceSchedule.findMany({
    where: startDate || endDate ? { date: { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lte: endDate } : {}) } } : {},
    orderBy: { date: 'desc' },
  });
  res.json(rows);
}));

schedule.post('/schedules/from-template', asyncHandler(async (req: AuthedRequest, res) => {
  const { templateId, date, title, notes } = req.body ?? {};
  if (!templateId || !date) return jsonError(res, 'templateId and date are required', 400);
  const tpl = await prisma.serviceTemplate.findUnique({ where: { id: templateId }, include: { roles: true } });
  if (!tpl) return jsonError(res, 'Template not found', 404);
  const sched = await prisma.serviceSchedule.create({
    data: { date, title: title || tpl.name, notes, createdBy: req.auth?.userId ?? 'system' },
  });
  if (tpl.roles?.length) {
    await prisma.scheduleAssignment.createMany({
      data: tpl.roles.map((r: any) => ({ scheduleId: sched.id, ministryId: tpl.ministryId, roleName: r.roleName, order: r.order })),
    });
  }
  res.status(201).json(sched);
}));

schedule.post('/schedules', asyncHandler(async (req: AuthedRequest, res) => {
  const body = req.body ?? {};
  if (!body.date) return jsonError(res, 'date is required', 400);
  const created = await prisma.serviceSchedule.create({ data: { ...body, createdBy: req.auth?.userId ?? 'system' } });
  res.status(201).json(created);
}));

schedule.get('/schedules/:id', asyncHandler(async (req, res) => {
  const row = await prisma.serviceSchedule.findUnique({
    where: { id: req.params.id },
    include: { assignments: true, worshipSlots: { include: { workers: true } } },
  });
  if (!row) return jsonError(res, 'Schedule not found', 404);
  res.json(row);
}));

schedule.put('/schedules/:id', asyncHandler(async (req, res) => {
  try {
    const updated = await prisma.serviceSchedule.update({ where: { id: req.params.id }, data: req.body ?? {} });
    res.json(updated);
  } catch {
    return jsonError(res, 'Schedule not found', 404);
  }
}));

schedule.delete('/schedules/:id', asyncHandler(async (req, res) => {
  await prisma.serviceSchedule.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

// ── Assignments ───────────────────────────────────────────────────────
schedule.get('/schedules/:id/assignments', asyncHandler(async (req, res) => {
  const rows = await prisma.scheduleAssignment.findMany({ where: { scheduleId: req.params.id }, orderBy: { order: 'asc' } });
  res.json(rows);
}));

schedule.post('/schedules/:id/assignments', asyncHandler(async (req, res) => {
  const created = await prisma.scheduleAssignment.create({ data: { ...(req.body ?? {}), scheduleId: req.params.id } });
  res.status(201).json(created);
}));

schedule.delete('/schedules/:id/assignments/:aid', asyncHandler(async (req, res) => {
  await prisma.scheduleAssignment.delete({ where: { id: req.params.aid } });
  res.json({ success: true });
}));

// ── Worship slots ─────────────────────────────────────────────────────
schedule.get('/schedules/:id/worship-slots', asyncHandler(async (req, res) => {
  const rows = await prisma.worshipSlot.findMany({
    where: { scheduleId: req.params.id },
    include: { workers: true },
    orderBy: { order: 'asc' },
  });
  res.json(rows);
}));

schedule.post('/schedules/:id/worship-slots', asyncHandler(async (req, res) => {
  const created = await prisma.worshipSlot.create({ data: { ...(req.body ?? {}), scheduleId: req.params.id } });
  res.status(201).json(created);
}));

schedule.put('/schedules/:id/worship-slots/:sid', asyncHandler(async (req, res) => {
  try {
    const updated = await prisma.worshipSlot.update({ where: { id: req.params.sid }, data: req.body ?? {} });
    res.json(updated);
  } catch {
    return jsonError(res, 'Slot not found', 404);
  }
}));

schedule.delete('/schedules/:id/worship-slots/:sid', asyncHandler(async (req, res) => {
  await prisma.worshipSlot.delete({ where: { id: req.params.sid } });
  res.json({ success: true });
}));

// ── Templates ─────────────────────────────────────────────────────────
schedule.get('/templates', asyncHandler(async (req, res) => {
  const { ministryId } = req.query as Record<string, string | undefined>;
  const rows = await prisma.serviceTemplate.findMany({
    where: ministryId ? { ministryId } : {},
    include: { roles: true },
    orderBy: { name: 'asc' },
  });
  res.json(rows);
}));

schedule.post('/templates', asyncHandler(async (req: AuthedRequest, res) => {
  const created = await prisma.serviceTemplate.create({ data: { ...(req.body ?? {}), createdBy: req.auth?.userId ?? 'system' } });
  res.status(201).json(created);
}));

schedule.get('/templates/:id', asyncHandler(async (req, res) => {
  const row = await prisma.serviceTemplate.findUnique({ where: { id: req.params.id }, include: { roles: true } });
  if (!row) return jsonError(res, 'Template not found', 404);
  res.json(row);
}));

schedule.put('/templates/:id', asyncHandler(async (req, res) => {
  try {
    const updated = await prisma.serviceTemplate.update({ where: { id: req.params.id }, data: req.body ?? {} });
    res.json(updated);
  } catch {
    return jsonError(res, 'Template not found', 404);
  }
}));

schedule.delete('/templates/:id', asyncHandler(async (req, res) => {
  await prisma.serviceTemplate.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

schedule.get('/templates/:id/roles', asyncHandler(async (req, res) => {
  const rows = await prisma.templateRole.findMany({ where: { templateId: req.params.id }, orderBy: { order: 'asc' } });
  res.json(rows);
}));

schedule.post('/templates/:id/roles', asyncHandler(async (req, res) => {
  const created = await prisma.templateRole.create({ data: { ...(req.body ?? {}), templateId: req.params.id } });
  res.status(201).json(created);
}));

schedule.put('/templates/:id/roles/:rid', asyncHandler(async (req, res) => {
  try {
    const updated = await prisma.templateRole.update({ where: { id: req.params.rid }, data: req.body ?? {} });
    res.json(updated);
  } catch {
    return jsonError(res, 'Role not found', 404);
  }
}));

schedule.delete('/templates/:id/roles/:rid', asyncHandler(async (req, res) => {
  await prisma.templateRole.delete({ where: { id: req.params.rid } });
  res.json({ success: true });
}));
