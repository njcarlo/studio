import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { matchRoute, RouteMap } from '../_shared/router.ts'
import { jsonOk, jsonError } from '../_shared/response.ts'
import { logError } from '../_shared/logger.ts'

const MODULE = 'settings'

const routes: RouteMap = [
  { method: 'GET',    pattern: '/roles',                     handler: listRoles },
  { method: 'POST',   pattern: '/roles',                     handler: createRole },
  { method: 'GET',    pattern: '/roles/:id',                 handler: getRole },
  { method: 'PUT',    pattern: '/roles/:id',                 handler: updateRole },
  { method: 'DELETE', pattern: '/roles/:id',                 handler: deleteRole },
  { method: 'GET',    pattern: '/roles/:id/permissions',     handler: getRolePermissions },
  { method: 'PUT',    pattern: '/roles/:id/permissions',     handler: setRolePermissions },
  { method: 'GET',    pattern: '/permissions',               handler: listPermissions },
  { method: 'GET',    pattern: '/rooms',                     handler: listRooms },
  { method: 'POST',   pattern: '/rooms',                     handler: createRoom },
  { method: 'GET',    pattern: '/rooms/:id',                 handler: getRoom },
  { method: 'PUT',    pattern: '/rooms/:id',                 handler: updateRoom },
  { method: 'DELETE', pattern: '/rooms/:id',                 handler: deleteRoom },
  { method: 'GET',    pattern: '/areas',                     handler: listAreas },
  { method: 'POST',   pattern: '/areas',                     handler: createArea },
  { method: 'PUT',    pattern: '/areas/:id',                 handler: updateArea },
  { method: 'DELETE', pattern: '/areas/:id',                 handler: deleteArea },
  { method: 'GET',    pattern: '/branches',                  handler: listBranches },
  { method: 'POST',   pattern: '/branches',                  handler: createBranch },
  { method: 'PUT',    pattern: '/branches/:id',              handler: updateBranch },
  { method: 'DELETE', pattern: '/branches/:id',              handler: deleteBranch },
  { method: 'GET',    pattern: '/departments',               handler: listDepartments },
  { method: 'GET',    pattern: '/venue-elements',            handler: listVenueElements },
  { method: 'POST',   pattern: '/venue-elements',            handler: createVenueElement },
  { method: 'PUT',    pattern: '/venue-elements/:id',        handler: updateVenueElement },
  { method: 'DELETE', pattern: '/venue-elements/:id',        handler: deleteVenueElement },
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

async function listRoles(_req: Request, { supabase }: any) {
  const { data, error } = await supabase.from('Role').select('*, rolePermissions:RolePermission(permission:Permission(*))').order('name')
  if (error) throw error
  return jsonOk(data)
}
async function getRole(_req: Request, { supabase }: any, { id }: any) {
  const { data, error } = await supabase.from('Role').select('*, rolePermissions:RolePermission(permission:Permission(*))').eq('id', id).single()
  if (error) return jsonError('Role not found', 404)
  return jsonOk(data)
}
async function createRole(req: Request, { supabase }: any) {
  const body = await req.json()
  const { data, error } = await supabase.from('Role').insert({ name: body.name, permissions: body.permissions ?? [], isSuperAdmin: body.isSuperAdmin ?? false }).select().single()
  if (error) throw error
  return jsonOk(data, 201)
}
async function updateRole(req: Request, { supabase }: any, { id }: any) {
  const body = await req.json()
  const { data, error } = await supabase.from('Role').update({ name: body.name, permissions: body.permissions, isSuperAdmin: body.isSuperAdmin }).eq('id', id).select().single()
  if (error) return jsonError('Role not found', 404)
  return jsonOk(data)
}
async function deleteRole(_req: Request, { supabase }: any, { id }: any) {
  const { data: assignments } = await supabase.from('WorkerRole').select('workerId').eq('roleId', id).limit(1)
  if (assignments?.length) return jsonError('Role has active worker assignments', 409)
  const { error } = await supabase.from('Role').delete().eq('id', id)
  if (error) throw error
  return jsonOk({ success: true })
}
async function getRolePermissions(_req: Request, { supabase }: any, { id }: any) {
  const { data, error } = await supabase.from('RolePermission').select('permission:Permission(*)').eq('roleId', id)
  if (error) throw error
  return jsonOk(data?.map((r: any) => r.permission) ?? [])
}
async function setRolePermissions(req: Request, { supabase }: any, { id }: any) {
  const { permissionIds } = await req.json()
  await supabase.from('RolePermission').delete().eq('roleId', id)
  if (permissionIds?.length) {
    const { error } = await supabase.from('RolePermission').insert(permissionIds.map((permissionId: string) => ({ roleId: id, permissionId })))
    if (error) throw error
  }
  return jsonOk({ success: true })
}
async function listPermissions(_req: Request, { supabase }: any) {
  const { data, error } = await supabase.from('Permission').select('*').order('module').order('action')
  if (error) throw error
  return jsonOk(data)
}
async function listRooms(_req: Request, { supabase }: any) {
  const { data, error } = await supabase.from('Room').select('*, area:Area(*, branch:Branch(*))').order('weight', { nullsFirst: false })
  if (error) throw error
  return jsonOk(data)
}
async function getRoom(_req: Request, { supabase }: any, { id }: any) {
  const { data, error } = await supabase.from('Room').select('*, area:Area(*, branch:Branch(*))').eq('id', id).single()
  if (error) return jsonError('Room not found', 404)
  return jsonOk(data)
}
async function createRoom(req: Request, { supabase }: any) {
  const body = await req.json()
  const { data, error } = await supabase.from('Room').insert(body).select().single()
  if (error) throw error
  return jsonOk(data, 201)
}
async function updateRoom(req: Request, { supabase }: any, { id }: any) {
  const body = await req.json()
  const { data, error } = await supabase.from('Room').update(body).eq('id', id).select().single()
  if (error) return jsonError('Room not found', 404)
  return jsonOk(data)
}
async function deleteRoom(_req: Request, { supabase }: any, { id }: any) {
  const now = new Date().toISOString()
  const { data: reservations } = await supabase.from('Booking').select('id').eq('roomId', id).gte('start', now).limit(1)
  if (reservations?.length) return jsonError('Room has future reservations', 409)
  const { error } = await supabase.from('Room').delete().eq('id', id)
  if (error) throw error
  return jsonOk({ success: true })
}
async function listAreas(_req: Request, { supabase }: any) {
  const { data, error } = await supabase.from('Area').select('*, branch:Branch(*)').order('name')
  if (error) throw error
  return jsonOk(data)
}
async function createArea(req: Request, { supabase }: any) {
  const body = await req.json()
  const { data, error } = await supabase.from('Area').insert(body).select().single()
  if (error) throw error
  return jsonOk(data, 201)
}
async function updateArea(req: Request, { supabase }: any, { id }: any) {
  const body = await req.json()
  const { data, error } = await supabase.from('Area').update(body).eq('id', id).select().single()
  if (error) return jsonError('Area not found', 404)
  return jsonOk(data)
}
async function deleteArea(_req: Request, { supabase }: any, { id }: any) {
  const { error } = await supabase.from('Area').delete().eq('id', id)
  if (error) throw error
  return jsonOk({ success: true })
}
async function listBranches(_req: Request, { supabase }: any) {
  const { data, error } = await supabase.from('Branch').select('*').order('name')
  if (error) throw error
  return jsonOk(data)
}
async function createBranch(req: Request, { supabase }: any) {
  const body = await req.json()
  const { data, error } = await supabase.from('Branch').insert(body).select().single()
  if (error) throw error
  return jsonOk(data, 201)
}
async function updateBranch(req: Request, { supabase }: any, { id }: any) {
  const body = await req.json()
  const { data, error } = await supabase.from('Branch').update(body).eq('id', id).select().single()
  if (error) return jsonError('Branch not found', 404)
  return jsonOk(data)
}
async function deleteBranch(_req: Request, { supabase }: any, { id }: any) {
  const { error } = await supabase.from('Branch').delete().eq('id', id)
  if (error) throw error
  return jsonOk({ success: true })
}
async function listDepartments(_req: Request, { supabase }: any) {
  const { data, error } = await supabase.from('Department').select('*').order('weight')
  if (error) throw error
  return jsonOk(data)
}
async function listVenueElements(_req: Request, { supabase }: any) {
  const { data, error } = await supabase.from('VenueElement').select('*').order('name')
  if (error) throw error
  return jsonOk(data)
}
async function createVenueElement(req: Request, { supabase }: any) {
  const body = await req.json()
  const { data, error } = await supabase.from('VenueElement').insert(body).select().single()
  if (error) throw error
  return jsonOk(data, 201)
}
async function updateVenueElement(req: Request, { supabase }: any, { id }: any) {
  const body = await req.json()
  const { data, error } = await supabase.from('VenueElement').update(body).eq('id', id).select().single()
  if (error) return jsonError('Venue element not found', 404)
  return jsonOk(data)
}
async function deleteVenueElement(_req: Request, { supabase }: any, { id }: any) {
  const { error } = await supabase.from('VenueElement').delete().eq('id', id)
  if (error) throw error
  return jsonOk({ success: true })
}
