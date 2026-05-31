import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { matchRoute, RouteMap } from '../_shared/router.ts'
import { jsonOk, jsonError } from '../_shared/response.ts'
import { logError } from '../_shared/logger.ts'

const MODULE = 'venue'
const routes: RouteMap = [
  { method:'GET',    pattern:'/bookings',                        handler:listBookings },
  { method:'POST',   pattern:'/bookings',                        handler:createBooking },
  { method:'GET',    pattern:'/bookings/:id',                    handler:getBooking },
  { method:'PUT',    pattern:'/bookings/:id',                    handler:updateBooking },
  { method:'DELETE', pattern:'/bookings/:id',                    handler:deleteBooking },
  { method:'GET',    pattern:'/venue-bookings',                  handler:listVenueBookings },
  { method:'POST',   pattern:'/venue-bookings',                  handler:createVenueBooking },
  { method:'GET',    pattern:'/venue-bookings/:id',              handler:getVenueBooking },
  { method:'PUT',    pattern:'/venue-bookings/:id',              handler:updateVenueBooking },
  { method:'DELETE', pattern:'/venue-bookings/:id',              handler:deleteVenueBooking },
  { method:'GET',    pattern:'/assistance-requests',             handler:listAssistanceRequests },
  { method:'POST',   pattern:'/assistance-requests',             handler:createAssistanceRequest },
  { method:'GET',    pattern:'/assistance-requests/:id',         handler:getAssistanceRequest },
  { method:'PUT',    pattern:'/assistance-requests/:id',         handler:updateAssistanceRequest },
  { method:'GET',    pattern:'/recurring-bookings',              handler:listRecurringBookings },
  { method:'POST',   pattern:'/recurring-bookings',              handler:createRecurringBooking },
  { method:'GET',    pattern:'/recurring-bookings/:id',          handler:getRecurringBooking },
  { method:'PUT',    pattern:'/recurring-bookings/:id',          handler:updateRecurringBooking },
  { method:'DELETE', pattern:'/recurring-bookings/:id',          handler:deleteRecurringBooking },
]

serve(async (req:Request) => {
  const cors = handleCors(req); if (cors) return cors
  const auth = await verifyAuth(req); if (auth instanceof Response) return auth
  const url = new URL(req.url)
  const pathname = url.pathname.replace(`/${MODULE}`,'') || '/'
  const match = matchRoute(routes, req.method, pathname)
  if (!match) return jsonError('Route not found', 404)
  try { return await match.handler(req, auth, match.params, url) }
  catch (err) { logError(MODULE, req.method, pathname, err); return jsonError('Internal server error', 500) }
})

async function listBookings(_:Request,{supabase}:any,_p:any,url:URL){
  let q=supabase.from('Booking').select('*,room:Room(*)').order('start',{ascending:true})
  const r=url.searchParams.get('roomId'),s=url.searchParams.get('status')
  if(r)q=q.eq('roomId',r); if(s)q=q.eq('status',s)
  const {data,error}=await q; if(error)throw error; return jsonOk(data)
}
async function getBooking(_:Request,{supabase}:any,{id}:any){
  const {data,error}=await supabase.from('Booking').select('*,room:Room(*)').eq('id',id).single()
  if(error)return jsonError('Booking not found',404); return jsonOk(data)
}
async function createBooking(req:Request,{supabase}:any){
  const body=await req.json()
  if(!body.roomId||!body.workerProfileId)return jsonError('roomId and workerProfileId required',400)
  // Conflict check
  const {data:conflicts}=await supabase.from('Booking').select('id').eq('roomId',body.roomId).lt('start',body.end).gt('end',body.start).neq('status','Cancelled')
  if(conflicts?.length)return jsonError('Room is already booked for this time period',409)
  const {data,error}=await supabase.from('Booking').insert(body).select().single()
  if(error)throw error; return jsonOk(data,201)
}
async function updateBooking(req:Request,{supabase}:any,{id}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('Booking').update(body).eq('id',id).select().single()
  if(error)return jsonError('Booking not found',404); return jsonOk(data)
}
async function deleteBooking(_:Request,{supabase}:any,{id}:any){
  const {error}=await supabase.from('Booking').delete().eq('id',id)
  if(error)throw error; return jsonOk({success:true})
}
async function listVenueBookings(_:Request,{supabase}:any,_p:any,url:URL){
  let q=supabase.from('VenueBooking').select('*,room:Room(*),worker:Worker(id,firstName,lastName,email)').order('start',{ascending:true})
  const r=url.searchParams.get('roomId'),s=url.searchParams.get('status')
  if(r)q=q.eq('roomId',r); if(s)q=q.eq('status',s)
  const {data,error}=await q; if(error)throw error; return jsonOk(data)
}
async function getVenueBooking(_:Request,{supabase}:any,{id}:any){
  const {data,error}=await supabase.from('VenueBooking').select('*,room:Room(*),assistanceRequests:AssistanceRequest(*)').eq('id',id).single()
  if(error)return jsonError('Venue booking not found',404); return jsonOk(data)
}
async function createVenueBooking(req:Request,{supabase}:any){
  const body=await req.json()
  // Conflict check on VenueBooking
  const {data:conflicts}=await supabase.from('VenueBooking').select('id').eq('roomId',body.roomId).lt('start',body.end).gt('end',body.start).not('status','in','("Cancelled","Rejected")')
  if(conflicts?.length)return jsonError('Room is already booked for this time period',409)
  const {data,error}=await supabase.from('VenueBooking').insert(body).select().single()
  if(error)throw error; return jsonOk(data,201)
}
async function updateVenueBooking(req:Request,{supabase}:any,{id}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('VenueBooking').update(body).eq('id',id).select().single()
  if(error)return jsonError('Venue booking not found',404); return jsonOk(data)
}
async function deleteVenueBooking(_:Request,{supabase}:any,{id}:any){
  const {error}=await supabase.from('VenueBooking').delete().eq('id',id)
  if(error)throw error; return jsonOk({success:true})
}
async function listAssistanceRequests(_:Request,{supabase}:any,_p:any,url:URL){
  let q=supabase.from('AssistanceRequest').select('*,items:AssistanceRequestItem(*)').order('createdAt',{ascending:false})
  const s=url.searchParams.get('status'); if(s)q=q.eq('status',s)
  const {data,error}=await q; if(error)throw error; return jsonOk(data)
}
async function getAssistanceRequest(_:Request,{supabase}:any,{id}:any){
  const {data,error}=await supabase.from('AssistanceRequest').select('*,items:AssistanceRequestItem(*)').eq('id',id).single()
  if(error)return jsonError('Request not found',404); return jsonOk(data)
}
async function createAssistanceRequest(req:Request,{supabase}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('AssistanceRequest').insert(body).select().single()
  if(error)throw error; return jsonOk(data,201)
}
async function updateAssistanceRequest(req:Request,{supabase}:any,{id}:any){
  const body=await req.json()
  if(body.status)body.respondedAt=new Date().toISOString()
  const {data,error}=await supabase.from('AssistanceRequest').update(body).eq('id',id).select().single()
  if(error)return jsonError('Request not found',404); return jsonOk(data)
}
async function listRecurringBookings(_:Request,{supabase}:any){
  const {data,error}=await supabase.from('RecurringBooking').select('*').order('createdAt',{ascending:false})
  if(error)throw error; return jsonOk(data)
}
async function getRecurringBooking(_:Request,{supabase}:any,{id}:any){
  const {data,error}=await supabase.from('RecurringBooking').select('*,occurrences:VenueBooking(*)').eq('id',id).single()
  if(error)return jsonError('Recurring booking not found',404); return jsonOk(data)
}
async function createRecurringBooking(req:Request,{supabase}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('RecurringBooking').insert(body).select().single()
  if(error)throw error; return jsonOk(data,201)
}
async function updateRecurringBooking(req:Request,{supabase}:any,{id}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('RecurringBooking').update(body).eq('id',id).select().single()
  if(error)return jsonError('Recurring booking not found',404); return jsonOk(data)
}
async function deleteRecurringBooking(_:Request,{supabase}:any,{id}:any){
  const {error}=await supabase.from('RecurringBooking').delete().eq('id',id)
  if(error)throw error; return jsonOk({success:true})
}
