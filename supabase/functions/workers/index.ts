import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { matchRoute, RouteMap } from '../_shared/router.ts'
import { jsonOk, jsonError } from '../_shared/response.ts'
import { logError } from '../_shared/logger.ts'

const MODULE = 'workers'

const routes: RouteMap = [
  { method: 'GET',    pattern: '/workers',                        handler: listWorkers },
  { method: 'POST',   pattern: '/workers',                        handler: createWorker },
  { method: 'GET',    pattern: '/workers/lookup',                 handler: lookupWorker },
  { method: 'GET',    pattern: '/workers/stats',                  handler: getWorkerStats },
  { method: 'GET',    pattern: '/workers/:id',                    handler: getWorker },
  { method: 'PUT',    pattern: '/workers/:id',                    handler: updateWorker },
  { method: 'DELETE', pattern: '/workers/:id',                    handler: deleteWorker },
  { method: 'GET',    pattern: '/workers/:id/roles',              handler: getWorkerRoles },
  { method: 'POST',   pattern: '/workers/:id/roles',              handler: assignRoles },
  { method: 'GET',    pattern: '/workers/:id/permissions',        handler: getWorkerPermissions },
  { method: 'GET',    pattern: '/workers/:id/logs',               handler: getWorkerLogs },
]

serve(async (req: Request) => {
  const cors = handleCors(req)
  if (cors) return cors
  const auth = await verifyAuth(req)
  if (auth instanceof Response) return auth
  const url = new URL(req.url)
  const pathname = url.pathname.replace(`/${MODULE}`, '') || '/'
  const match = matchRoute(routes, req.method, pathname)
  if (!match) return jsonError('Route not found', 404)
  try { return await match.handler(req, auth, match.params, url) }
  catch (err) { logError(MODULE, req.method, pathname, err); return jsonError('Internal server error', 500) }
})

async function listWorkers(_req: Request, { supabase }: any, _p: any, url: URL) {
  let query = supabase.from('Worker').select('*, role:Role(*), roles:WorkerRole(role:Role(*))').order('createdAt', { ascending: false })
  const status = url.searchParams.get('status')
  const ministryId = url.searchParams.get('ministryId')
  if (status) query = query.eq('status', status)
  if (ministryId) query = query.or(`majorMinistryId.eq.${ministryId},minorMinistryId.eq.${ministryId}`)
  const { data, error } = await query
  if (error) throw error
  return jsonOk(data)
}
async function lookupWorker(_req: Request, { supabase }: any, _p: any, url: URL) {
  const email = url.searchParams.get('email')
  const qrToken = url.searchParams.get('qrToken')
  if (!email && !qrToken) return jsonError('email or qrToken query param required', 400)
  let query = supabase.from('Worker').select('*, role:Role(*), roles:WorkerRole(role:Role(*))')
  if (email) query = query.eq('email', email)
  else query = query.eq('qrToken', qrToken)
  const { data, error } = await query.single()
  if (error) return jsonError('Worker not found', 404)
  return jsonOk(data)
}
async function getWorkerStats(_req: Request, { supabase }: any) {
  const [total, active, inactive] = await Promise.all([
    supabase.from('Worker').select('*', { count: 'exact', head: true }),
    supabase.from('Worker').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
    supabase.from('Worker').select('*', { count: 'exact', head: true }).eq('status', 'Inactive'),
  ])
  return jsonOk({ total: total.count, active: active.count, inactive: inactive.count })
}
async function getWorker(_req: Request, { supabase }: any, { id }: any) {
  const { data, error } = await supabase.from('Worker').select('*, role:Role(*), roles:WorkerRole(role:Role(*, rolePermissions:RolePermission(permission:Permission(*))))').eq('id', id).single()
  if (error) return jsonError('Worker not found', 404)
  return jsonOk(data)
}
async function createWorker(req: Request, { supabase }: any) {
  const body = await req.json()
  if (!body.firstName || !body.lastName || !body.email) return jsonError('firstName, lastName, email are required', 400)
  const { role, roles, approvals, attendanceRecords, bookings, venueBookings, InventoryBorrowing, InventoryLog, mealStubs, ...safeData } = body
  const { data, error } = await supabase.from('Worker').insert({ ...safeData, passwordChangeRequired: true, createdAt: new Date().toISOString() }).select().single()
  if (error?.code === '23505') return jsonError('A worker with this email already exists', 409)
  if (error) throw error
  return jsonOk(data, 201)
}
async function updateWorker(req: Request, { supabase }: any, { id }: any) {
  const body = await req.json()
  const { role, roles, approvals, attendanceRecords, bookings, venueBookings, InventoryBorrowing, InventoryLog, mealStubs, createdAt, ...safeData } = body
  const { data, error } = await supabase.from('Worker').update(safeData).eq('id', id).select().single()
  if (error) return jsonError('Worker not found', 404)
  return jsonOk(data)
}
async function deleteWorker(_req: Request, { supabase }: any, { id }: any) {
  const today = new Date().toISOString().split('T')[0]
  const { data: activeAssignments } = await supabase.from('ScheduleAssignment').select('id').eq('workerId', id).gte('schedule:ServiceSchedule!inner(date)', today).limit(1)
  if (activeAssignments?.length) return jsonError('Worker has active future schedule assignments', 409)
  const { data, error } = await supabase.from('Worker').update({ status: 'Inactive' }).eq('id', id).select().single()
  if (error) return jsonError('Worker not found', 404)
  return jsonOk(data)
}
async function getWorkerRoles(_req: Request, { supabase }: any, { id }: any) {
  const { data, error } = await supabase.from('WorkerRole').select('*, role:Role(*, rolePermissions:RolePermission(permission:Permission(*)))').eq('workerId', id)
  if (error) throw error
  return jsonOk(data)
}
async function assignRoles(req: Request, { supabase }: any, { id }: any) {
  const { roleIds, assignedBy } = await req.json()
  if (!Array.isArray(roleIds)) return jsonError('roleIds array required', 400)
  await supabase.from('WorkerRole').delete().eq('workerId', id)
  if (roleIds.length) {
    const { error } = await supabase.from('WorkerRole').insert(roleIds.map((roleId: string) => ({ workerId: id, roleId, assignedBy })))
    if (error) throw error
    await supabase.from('Worker').update({ roleId: roleIds[0] }).eq('id', id)
  }
  return jsonOk({ success: true })
}
async function getWorkerPermissions(_req: Request, { supabase }: any, { id }: any) {
  const { data, error } = await supabase.from('WorkerRole').select('role:Role(rolePermissions:RolePermission(permission:Permission(*)))').eq('workerId', id)
  if (error) throw error
  const perms = new Set<string>()
  for (const wr of (data ?? [])) {
    for (const rp of (wr.role?.rolePermissions ?? [])) {
      if (rp.permission?.module && rp.permission?.action) perms.add(`${rp.permission.module}:${rp.permission.action}`)
    }
  }
  return jsonOk(Array.from(perms))
}
async function getWorkerLogs(_req: Request, { supabase }: any, { id }: any) {
  const { data, error } = await supabase.from('TransactionLog').select('*').or(`targetId.eq.${id},userId.eq.${id}`).order('timestamp', { ascending: false }).limit(50)
  if (error) throw error
  return jsonOk(data)
}
