import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler, jsonError } from '../lib/http';

// Ported from supabase/functions/venue.
export const venue = Router();

// ── Bookings ──────────────────────────────────────────────────────────
venue.get('/bookings', asyncHandler(async (req, res) => {
  const { roomId, status } = req.query as Record<string, string | undefined>;
  const rows = await prisma.booking.findMany({
    where: { ...(roomId ? { roomId } : {}), ...(status ? { status } : {}) },
    include: { room: true },
    orderBy: { start: 'asc' },
  });
  res.json(rows);
}));

venue.get('/bookings/:id', asyncHandler(async (req, res) => {
  const row = await prisma.booking.findUnique({ where: { id: req.params.id }, include: { room: true } });
  if (!row) return jsonError(res, 'Booking not found', 404);
  res.json(row);
}));

venue.post('/bookings', asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  if (!body.roomId || !body.workerProfileId) return jsonError(res, 'roomId and workerProfileId required', 400);
  const conflict = await prisma.booking.findFirst({
    where: { roomId: body.roomId, start: { lt: body.end }, end: { gt: body.start }, status: { not: 'Cancelled' } },
    select: { id: true },
  });
  if (conflict) return jsonError(res, 'Room is already booked for this time period', 409);
  const created = await prisma.booking.create({ data: body });
  res.status(201).json(created);
}));

venue.put('/bookings/:id', asyncHandler(async (req, res) => {
  try {
    const updated = await prisma.booking.update({ where: { id: req.params.id }, data: req.body ?? {} });
    res.json(updated);
  } catch {
    return jsonError(res, 'Booking not found', 404);
  }
}));

venue.delete('/bookings/:id', asyncHandler(async (req, res) => {
  await prisma.booking.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

// ── Venue bookings (ministry-approval-gated) ──────────────────────────
venue.get('/venue-bookings', asyncHandler(async (req, res) => {
  const { roomId, status } = req.query as Record<string, string | undefined>;
  const rows = await prisma.venueBooking.findMany({
    where: { ...(roomId ? { roomId } : {}), ...(status ? { status } : {}) },
    include: { room: true, worker: { select: { id: true, firstName: true, lastName: true, email: true } } },
    orderBy: { start: 'asc' },
  });
  res.json(rows);
}));

venue.get('/venue-bookings/:id', asyncHandler(async (req, res) => {
  const row = await prisma.venueBooking.findUnique({
    where: { id: req.params.id },
    include: { room: true, assistanceRequests: true },
  });
  if (!row) return jsonError(res, 'Venue booking not found', 404);
  res.json(row);
}));

venue.post('/venue-bookings', asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const conflict = await prisma.venueBooking.findFirst({
    where: { roomId: body.roomId, start: { lt: body.end }, end: { gt: body.start }, status: { notIn: ['Cancelled', 'Rejected'] } },
    select: { id: true },
  });
  if (conflict) return jsonError(res, 'Room is already booked for this time period', 409);
  const created = await prisma.venueBooking.create({ data: body });
  res.status(201).json(created);
}));

venue.put('/venue-bookings/:id', asyncHandler(async (req, res) => {
  try {
    const updated = await prisma.venueBooking.update({ where: { id: req.params.id }, data: req.body ?? {} });
    res.json(updated);
  } catch {
    return jsonError(res, 'Venue booking not found', 404);
  }
}));

venue.delete('/venue-bookings/:id', asyncHandler(async (req, res) => {
  await prisma.venueBooking.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

// ── Assistance requests ───────────────────────────────────────────────
venue.get('/assistance-requests', asyncHandler(async (req, res) => {
  const { status } = req.query as Record<string, string | undefined>;
  const rows = await prisma.assistanceRequest.findMany({
    where: status ? { status } : {},
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(rows);
}));

venue.get('/assistance-requests/:id', asyncHandler(async (req, res) => {
  const row = await prisma.assistanceRequest.findUnique({ where: { id: req.params.id }, include: { items: true } });
  if (!row) return jsonError(res, 'Request not found', 404);
  res.json(row);
}));

venue.post('/assistance-requests', asyncHandler(async (req, res) => {
  const created = await prisma.assistanceRequest.create({ data: req.body ?? {} });
  res.status(201).json(created);
}));

venue.put('/assistance-requests/:id', asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  if (body.status) body.respondedAt = new Date().toISOString();
  try {
    const updated = await prisma.assistanceRequest.update({ where: { id: req.params.id }, data: body });
    res.json(updated);
  } catch {
    return jsonError(res, 'Request not found', 404);
  }
}));

// ── Recurring bookings ────────────────────────────────────────────────
venue.get('/recurring-bookings', asyncHandler(async (_req, res) => {
  const rows = await prisma.recurringBooking.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(rows);
}));

venue.get('/recurring-bookings/:id', asyncHandler(async (req, res) => {
  const row = await prisma.recurringBooking.findUnique({ where: { id: req.params.id }, include: { occurrences: true } });
  if (!row) return jsonError(res, 'Recurring booking not found', 404);
  res.json(row);
}));

venue.post('/recurring-bookings', asyncHandler(async (req, res) => {
  const created = await prisma.recurringBooking.create({ data: req.body ?? {} });
  res.status(201).json(created);
}));

venue.put('/recurring-bookings/:id', asyncHandler(async (req, res) => {
  try {
    const updated = await prisma.recurringBooking.update({ where: { id: req.params.id }, data: req.body ?? {} });
    res.json(updated);
  } catch {
    return jsonError(res, 'Recurring booking not found', 404);
  }
}));

venue.delete('/recurring-bookings/:id', asyncHandler(async (req, res) => {
  await prisma.recurringBooking.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));
