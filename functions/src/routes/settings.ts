import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler, jsonError } from '../lib/http';

// Ported from supabase/functions/settings.
export const settings = Router();

// ── Roles ─────────────────────────────────────────────────────────────
settings.get('/roles', asyncHandler(async (_req, res) => {
  const rows = await prisma.role.findMany({
    include: { rolePermissions: { include: { permission: true } } },
    orderBy: { name: 'asc' },
  });
  res.json(rows);
}));

settings.get('/roles/:id', asyncHandler(async (req, res) => {
  const row = await prisma.role.findUnique({
    where: { id: req.params.id },
    include: { rolePermissions: { include: { permission: true } } },
  });
  if (!row) return jsonError(res, 'Role not found', 404);
  res.json(row);
}));

settings.post('/roles', asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const created = await prisma.role.create({
    data: { name: body.name, permissions: body.permissions ?? [], isSuperAdmin: body.isSuperAdmin ?? false },
  });
  res.status(201).json(created);
}));

settings.put('/roles/:id', asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  try {
    const updated = await prisma.role.update({
      where: { id: req.params.id },
      data: { name: body.name, permissions: body.permissions, isSuperAdmin: body.isSuperAdmin },
    });
    res.json(updated);
  } catch {
    return jsonError(res, 'Role not found', 404);
  }
}));

settings.delete('/roles/:id', asyncHandler(async (req, res) => {
  const assigned = await prisma.workerRole.findFirst({ where: { roleId: req.params.id }, select: { workerId: true } });
  if (assigned) return jsonError(res, 'Role has active worker assignments', 409);
  await prisma.role.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

settings.get('/roles/:id/permissions', asyncHandler(async (req, res) => {
  const rows = await prisma.rolePermission.findMany({ where: { roleId: req.params.id }, include: { permission: true } });
  res.json(rows.map((r: any) => r.permission));
}));

settings.put('/roles/:id/permissions', asyncHandler(async (req, res) => {
  const { permissionIds } = req.body ?? {};
  const roleId = req.params.id;
  await prisma.$transaction(async (tx: any) => {
    await tx.rolePermission.deleteMany({ where: { roleId } });
    if (Array.isArray(permissionIds) && permissionIds.length) {
      await tx.rolePermission.createMany({ data: permissionIds.map((permissionId: string) => ({ roleId, permissionId })) });
    }
  });
  res.json({ success: true });
}));

settings.get('/permissions', asyncHandler(async (_req, res) => {
  const rows = await prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] });
  res.json(rows);
}));

// ── Rooms ─────────────────────────────────────────────────────────────
const roomInclude = { area: { include: { branch: true } } };

settings.get('/rooms', asyncHandler(async (_req, res) => {
  const rows = await prisma.room.findMany({ include: roomInclude, orderBy: { weight: 'asc' } });
  res.json(rows);
}));

settings.get('/rooms/:id', asyncHandler(async (req, res) => {
  const row = await prisma.room.findUnique({ where: { id: req.params.id }, include: roomInclude });
  if (!row) return jsonError(res, 'Room not found', 404);
  res.json(row);
}));

settings.post('/rooms', asyncHandler(async (req, res) => {
  const created = await prisma.room.create({ data: req.body ?? {} });
  res.status(201).json(created);
}));

settings.put('/rooms/:id', asyncHandler(async (req, res) => {
  try {
    const updated = await prisma.room.update({ where: { id: req.params.id }, data: req.body ?? {} });
    res.json(updated);
  } catch {
    return jsonError(res, 'Room not found', 404);
  }
}));

settings.delete('/rooms/:id', asyncHandler(async (req, res) => {
  const now = new Date().toISOString();
  const future = await prisma.booking.findFirst({ where: { roomId: req.params.id, start: { gte: now } }, select: { id: true } });
  if (future) return jsonError(res, 'Room has future reservations', 409);
  await prisma.room.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

// ── Areas ─────────────────────────────────────────────────────────────
settings.get('/areas', asyncHandler(async (_req, res) => {
  const rows = await prisma.area.findMany({ include: { branch: true }, orderBy: { name: 'asc' } });
  res.json(rows);
}));

settings.post('/areas', asyncHandler(async (req, res) => {
  const created = await prisma.area.create({ data: req.body ?? {} });
  res.status(201).json(created);
}));

settings.put('/areas/:id', asyncHandler(async (req, res) => {
  try {
    const updated = await prisma.area.update({ where: { id: req.params.id }, data: req.body ?? {} });
    res.json(updated);
  } catch {
    return jsonError(res, 'Area not found', 404);
  }
}));

settings.delete('/areas/:id', asyncHandler(async (req, res) => {
  await prisma.area.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

// ── Branches ──────────────────────────────────────────────────────────
settings.get('/branches', asyncHandler(async (_req, res) => {
  const rows = await prisma.branch.findMany({ orderBy: { name: 'asc' } });
  res.json(rows);
}));

settings.post('/branches', asyncHandler(async (req, res) => {
  const created = await prisma.branch.create({ data: req.body ?? {} });
  res.status(201).json(created);
}));

settings.put('/branches/:id', asyncHandler(async (req, res) => {
  try {
    const updated = await prisma.branch.update({ where: { id: req.params.id }, data: req.body ?? {} });
    res.json(updated);
  } catch {
    return jsonError(res, 'Branch not found', 404);
  }
}));

settings.delete('/branches/:id', asyncHandler(async (req, res) => {
  await prisma.branch.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

// ── Departments / Venue elements ──────────────────────────────────────
settings.get('/departments', asyncHandler(async (_req, res) => {
  const rows = await prisma.department.findMany({ orderBy: { weight: 'asc' } });
  res.json(rows);
}));

settings.get('/venue-elements', asyncHandler(async (_req, res) => {
  const rows = await prisma.venueElement.findMany({ orderBy: { name: 'asc' } });
  res.json(rows);
}));

settings.post('/venue-elements', asyncHandler(async (req, res) => {
  const created = await prisma.venueElement.create({ data: req.body ?? {} });
  res.status(201).json(created);
}));

settings.put('/venue-elements/:id', asyncHandler(async (req, res) => {
  try {
    const updated = await prisma.venueElement.update({ where: { id: req.params.id }, data: req.body ?? {} });
    res.json(updated);
  } catch {
    return jsonError(res, 'Venue element not found', 404);
  }
}));

settings.delete('/venue-elements/:id', asyncHandler(async (req, res) => {
  await prisma.venueElement.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));
