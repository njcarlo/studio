import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler, jsonError } from '../lib/http';

// Ported from supabase/functions/attendance.
export const attendance = Router();

attendance.get('/attendance', asyncHandler(async (req, res) => {
  const { workerProfileId, startDate, endDate } = req.query as Record<string, string | undefined>;
  const rows = await prisma.attendanceRecord.findMany({
    where: {
      ...(workerProfileId ? { workerProfileId } : {}),
      ...(startDate || endDate ? { time: { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lte: endDate } : {}) } } : {}),
    },
    include: { worker: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } } },
    orderBy: { time: 'desc' },
  });
  res.json(rows);
}));

attendance.get('/attendance/stats', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query as Record<string, string | undefined>;
  const timeFilter = startDate || endDate
    ? { time: { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lte: endDate } : {}) } }
    : {};
  const [totalCount, rows] = await Promise.all([
    prisma.attendanceRecord.count({ where: timeFilter }),
    prisma.attendanceRecord.findMany({ where: timeFilter, select: { time: true } }),
  ]);
  const agg: Record<string, number> = {};
  for (const r of rows) {
    const d = (r.time as unknown as string)?.toString().split('T')[0] ?? '';
    agg[d] = (agg[d] || 0) + 1;
  }
  res.json({ totalCount, byDate: Object.entries(agg).map(([date, count]) => ({ date, count })) });
}));

attendance.get('/attendance/:id', asyncHandler(async (req, res) => {
  const row = await prisma.attendanceRecord.findUnique({
    where: { id: req.params.id },
    include: { worker: true },
  });
  if (!row) return jsonError(res, 'Record not found', 404);
  res.json(row);
}));

attendance.post('/attendance', asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  if (!body.workerProfileId) return jsonError(res, 'workerProfileId required', 400);
  const created = await prisma.attendanceRecord.create({
    data: { ...body, time: body.time ?? new Date().toISOString() },
  });
  res.status(201).json(created);
}));

attendance.get('/scan-logs', asyncHandler(async (req, res) => {
  const limit = parseInt((req.query.limit as string) || '100', 10);
  const rows = await prisma.scanLog.findMany({ orderBy: { timestamp: 'desc' }, take: limit });
  res.json(rows);
}));

attendance.post('/scan-logs', asyncHandler(async (req, res) => {
  const created = await prisma.scanLog.create({
    data: { ...(req.body ?? {}), timestamp: new Date().toISOString() },
  });
  res.status(201).json(created);
}));
