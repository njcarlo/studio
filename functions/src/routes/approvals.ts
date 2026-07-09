import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler, jsonError } from '../lib/http';

// Ported from supabase/functions/approvals (the ApprovalRequest model).
export const approvals = Router();

approvals.get('/', asyncHandler(async (req, res) => {
  const { status, workerId } = req.query as Record<string, string | undefined>;
  const rows = await prisma.approvalRequest.findMany({
    where: { ...(status ? { status } : {}), ...(workerId ? { workerId } : {}) },
    orderBy: { date: 'desc' },
  });
  res.json(rows);
}));

approvals.get('/:id', asyncHandler(async (req, res) => {
  const row = await prisma.approvalRequest.findUnique({ where: { id: req.params.id } });
  if (!row) return jsonError(res, 'Approval not found', 404);
  res.json(row);
}));

approvals.post('/', asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const created = await prisma.approvalRequest.create({
    data: { ...body, date: new Date().toISOString(), status: body.status ?? 'Pending' },
  });
  res.status(201).json(created);
}));

approvals.put('/:id', asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  let data;
  try {
    data = await prisma.approvalRequest.update({ where: { id: req.params.id }, data: body });
  } catch {
    return jsonError(res, 'Approval not found', 404);
  }
  // Side effects mirror the original edge function.
  const status = body.status as string | undefined;
  try {
    if (data.type === 'Room Booking' && data.reservationId && status) {
      await prisma.booking.update({ where: { id: data.reservationId }, data: { status } });
    }
    if (status === 'Approved') {
      if (data.type === 'New Worker' && data.workerId) {
        await prisma.worker.update({ where: { id: data.workerId }, data: { status: 'Active' } });
      }
      if (data.type === 'Ministry Change' && data.workerId) {
        await prisma.worker.update({
          where: { id: data.workerId },
          data: { majorMinistryId: data.newMajorId || '', minorMinistryId: data.newMinorId || '' },
        });
      }
    }
  } catch {
    // best-effort side effects, matching the original `.catch(() => {})`
  }
  res.json(data);
}));
