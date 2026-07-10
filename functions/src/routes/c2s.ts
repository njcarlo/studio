import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler, jsonError } from '../lib/http';

// Ported from supabase/functions/c2s.
export const c2s = Router();

c2s.get('/groups', asyncHandler(async (_req, res) => {
  const rows = await prisma.c2SGroup.findMany({ include: { mentees: true }, orderBy: { createdAt: 'desc' } });
  res.json(rows.map((g: any) => ({ ...g, memberCount: g.mentees?.length ?? 0 })));
}));

c2s.get('/groups/:id', asyncHandler(async (req, res) => {
  const group = await prisma.c2SGroup.findUnique({ where: { id: req.params.id }, include: { mentees: true } });
  if (!group) return jsonError(res, 'Group not found', 404);
  const mentor = group.mentorId
    ? await prisma.worker.findUnique({
        where: { id: group.mentorId },
        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
      })
    : null;
  res.json({ ...group, mentor, memberCount: group.mentees?.length ?? 0 });
}));

c2s.post('/groups', asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  if (!body.name || !body.mentorId) return jsonError(res, 'name and mentorId required', 400);
  const created = await prisma.c2SGroup.create({ data: { ...body, menteeIds: body.menteeIds ?? [] } });
  res.status(201).json(created);
}));

c2s.put('/groups/:id', asyncHandler(async (req, res) => {
  try {
    const updated = await prisma.c2SGroup.update({ where: { id: req.params.id }, data: req.body ?? {} });
    res.json(updated);
  } catch {
    return jsonError(res, 'Group not found', 404);
  }
}));

c2s.delete('/groups/:id', asyncHandler(async (req, res) => {
  await prisma.c2SGroup.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

c2s.get('/mentees', asyncHandler(async (req, res) => {
  const { groupId } = req.query as Record<string, string | undefined>;
  const rows = await prisma.c2SMentee.findMany({
    where: groupId ? { groupId } : {},
    include: { group: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(rows);
}));

c2s.get('/mentees/:id', asyncHandler(async (req, res) => {
  const row = await prisma.c2SMentee.findUnique({ where: { id: req.params.id }, include: { group: true } });
  if (!row) return jsonError(res, 'Mentee not found', 404);
  res.json(row);
}));

c2s.post('/mentees', asyncHandler(async (req, res) => {
  const created = await prisma.c2SMentee.create({ data: req.body ?? {} });
  res.status(201).json(created);
}));

c2s.put('/mentees/:id', asyncHandler(async (req, res) => {
  try {
    const updated = await prisma.c2SMentee.update({ where: { id: req.params.id }, data: req.body ?? {} });
    res.json(updated);
  } catch {
    return jsonError(res, 'Mentee not found', 404);
  }
}));

c2s.delete('/mentees/:id', asyncHandler(async (req, res) => {
  await prisma.c2SMentee.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));
