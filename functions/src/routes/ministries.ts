import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler, jsonError } from '../lib/http';

// Ported from supabase/functions/ministries.
export const ministries = Router();

const DEPT_NAME: Record<string, string> = { W: 'Worship', O: 'Outreach', R: 'Relationship', D: 'Discipleship', A: 'Administration' };
const DEPT_CODE: Record<string, string> = { Worship: 'W', Outreach: 'O', Relationship: 'R', Discipleship: 'D', Administration: 'A' };
const normCode = (v: string) => (v.length === 1 ? v.toUpperCase() : DEPT_CODE[v] || 'D');

ministries.get('/', asyncHandler(async (_req, res) => {
  const rows = await prisma.ministry.findMany({
    include: { department: true },
    orderBy: [{ weight: 'asc' }, { name: 'asc' }],
  });
  res.json(rows.map((m: any) => ({ ...m, department: DEPT_NAME[m.departmentCode] || m.departmentCode })));
}));

ministries.get('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id;
  const [m, wc, activeMemberCount] = await Promise.all([
    prisma.ministry.findUnique({ where: { id }, include: { department: true } }),
    prisma.workloadCategory.findMany({ where: { ministryId: id }, orderBy: { sortOrder: 'asc' } }),
    prisma.worker.count({ where: { status: 'Active', OR: [{ majorMinistryId: id }, { minorMinistryId: id }] } }),
  ]);
  if (!m) return jsonError(res, 'Ministry not found', 404);
  res.json({ ...m, department: DEPT_NAME[m.departmentCode] || m.departmentCode, workloadCategories: wc, activeMemberCount });
}));

ministries.post('/', asyncHandler(async (req, res) => {
  const { department, departmentCode, ...rest } = req.body ?? {};
  const created = await prisma.ministry.create({
    data: { ...rest, departmentCode: normCode(departmentCode || department || 'D') },
  });
  res.status(201).json(created);
}));

ministries.put('/:id', asyncHandler(async (req, res) => {
  const { department, ...rest } = req.body ?? {};
  if (rest.departmentCode) rest.departmentCode = normCode(rest.departmentCode);
  try {
    const updated = await prisma.ministry.update({ where: { id: req.params.id }, data: rest });
    res.json(updated);
  } catch {
    return jsonError(res, 'Ministry not found', 404);
  }
}));

ministries.delete('/:id', asyncHandler(async (req, res) => {
  const active = await prisma.worker.findFirst({
    where: { status: 'Active', OR: [{ majorMinistryId: req.params.id }, { minorMinistryId: req.params.id }] },
    select: { id: true },
  });
  if (active) return jsonError(res, 'Ministry has active workers', 409);
  await prisma.ministry.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

ministries.get('/:id/workload-categories', asyncHandler(async (req, res) => {
  const rows = await prisma.workloadCategory.findMany({ where: { ministryId: req.params.id }, orderBy: { sortOrder: 'asc' } });
  res.json(rows);
}));

ministries.post('/:id/workload-categories', asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  if (!body.name) return jsonError(res, 'name is required', 400);
  const created = await prisma.workloadCategory.create({ data: { ...body, ministryId: req.params.id } });
  res.status(201).json(created);
}));

ministries.put('/:id/workload-categories/:cid', asyncHandler(async (req, res) => {
  try {
    const updated = await prisma.workloadCategory.update({ where: { id: req.params.cid }, data: req.body ?? {} });
    res.json(updated);
  } catch {
    return jsonError(res, 'Category not found', 404);
  }
}));

ministries.delete('/:id/workload-categories/:cid', asyncHandler(async (req, res) => {
  await prisma.workloadCategory.delete({ where: { id: req.params.cid } });
  res.json({ success: true });
}));
