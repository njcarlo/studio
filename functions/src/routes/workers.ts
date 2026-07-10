import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler, jsonError, type AuthedRequest } from '../lib/http';

// Ported from supabase/functions/workers. Data lives in Postgres (Prisma).
export const workers = Router();

const withRoles = { role: true, roles: { include: { role: true } } };

workers.get('/', asyncHandler(async (req, res) => {
  const { status, ministryId } = req.query as Record<string, string | undefined>;
  const rows = await prisma.worker.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(ministryId ? { OR: [{ majorMinistryId: ministryId }, { minorMinistryId: ministryId }] } : {}),
    },
    include: withRoles,
    orderBy: { createdAt: 'desc' },
  });
  res.json(rows);
}));

workers.get('/lookup', asyncHandler(async (req, res) => {
  const { email, qrToken } = req.query as Record<string, string | undefined>;
  if (!email && !qrToken) return jsonError(res, 'email or qrToken query param required', 400);
  const worker = await prisma.worker.findFirst({
    where: email ? { email } : { qrToken },
    include: withRoles,
  });
  if (!worker) return jsonError(res, 'Worker not found', 404);
  res.json(worker);
}));

workers.get('/stats', asyncHandler(async (_req, res) => {
  const [total, active, inactive] = await Promise.all([
    prisma.worker.count(),
    prisma.worker.count({ where: { status: 'Active' } }),
    prisma.worker.count({ where: { status: 'Inactive' } }),
  ]);
  res.json({ total, active, inactive });
}));

workers.get('/:id', asyncHandler(async (req, res) => {
  const worker = await prisma.worker.findUnique({
    where: { id: req.params.id },
    include: {
      role: true,
      roles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } },
    },
  });
  if (!worker) return jsonError(res, 'Worker not found', 404);
  res.json(worker);
}));

workers.post('/', asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  if (!body.firstName || !body.lastName || !body.email) {
    return jsonError(res, 'firstName, lastName, email are required', 400);
  }
  const { role, roles, approvals, attendanceRecords, bookings, venueBookings, InventoryBorrowing, InventoryLog, mealStubs, ...safe } = body;
  try {
    const created = await prisma.worker.create({ data: { ...safe, passwordChangeRequired: true } });
    res.status(201).json(created);
  } catch (err: any) {
    if (err?.code === 'P2002') return jsonError(res, 'A worker with this email already exists', 409);
    throw err;
  }
}));

workers.put('/:id', asyncHandler(async (req, res) => {
  const { role, roles, approvals, attendanceRecords, bookings, venueBookings, InventoryBorrowing, InventoryLog, mealStubs, createdAt, ...safe } = req.body ?? {};
  try {
    const updated = await prisma.worker.update({ where: { id: req.params.id }, data: safe });
    res.json(updated);
  } catch {
    return jsonError(res, 'Worker not found', 404);
  }
}));

workers.delete('/:id', asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const active = await prisma.scheduleAssignment.findFirst({
    where: { workerId: req.params.id, schedule: { date: { gte: today } } },
    select: { id: true },
  });
  if (active) return jsonError(res, 'Worker has active future schedule assignments', 409);
  try {
    const updated = await prisma.worker.update({ where: { id: req.params.id }, data: { status: 'Inactive' } });
    res.json(updated);
  } catch {
    return jsonError(res, 'Worker not found', 404);
  }
}));

workers.get('/:id/roles', asyncHandler(async (req, res) => {
  const rows = await prisma.workerRole.findMany({
    where: { workerId: req.params.id },
    include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
  });
  res.json(rows);
}));

workers.post('/:id/roles', asyncHandler(async (req: AuthedRequest, res) => {
  const { roleIds, assignedBy } = req.body ?? {};
  if (!Array.isArray(roleIds)) return jsonError(res, 'roleIds array required', 400);
  const id = req.params.id;
  await prisma.$transaction(async (tx: any) => {
    await tx.workerRole.deleteMany({ where: { workerId: id } });
    if (roleIds.length) {
      await tx.workerRole.createMany({ data: roleIds.map((roleId: string) => ({ workerId: id, roleId, assignedBy })) });
      await tx.worker.update({ where: { id }, data: { roleId: roleIds[0] } });
    }
  });
  res.json({ success: true });
}));

workers.get('/:id/permissions', asyncHandler(async (req, res) => {
  const rows = await prisma.workerRole.findMany({
    where: { workerId: req.params.id },
    include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
  });
  const perms = new Set<string>();
  for (const wr of rows) {
    for (const rp of wr.role.rolePermissions) {
      if (rp.permission?.module && rp.permission?.action) perms.add(`${rp.permission.module}:${rp.permission.action}`);
    }
  }
  res.json(Array.from(perms));
}));

workers.get('/:id/logs', asyncHandler(async (req, res) => {
  const id = req.params.id;
  const rows = await prisma.transactionLog.findMany({
    where: { OR: [{ targetId: id }, { userId: id }] },
    orderBy: { timestamp: 'desc' },
    take: 50,
  });
  res.json(rows);
}));
