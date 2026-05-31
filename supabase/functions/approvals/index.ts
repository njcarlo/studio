import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { matchRoute, RouteMap } from '../_shared/router.ts'
import { jsonOk, jsonError } from '../_shared/response.ts'
import { logError } from '../_shared/logger.ts'

const MODULE = 'approvals'
const routes: RouteMap = [
  { method:'GET',  pattern:'/approvals',            handler:listApprovals },
  { method:'POST', pattern:'/approvals',            handler:createApproval },
  { method:'GET',  pattern:'/approvals/:id',        handler:getApproval },
  { method:'PUT',  pattern:'/approvals/:id',        handler:updateApproval },
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

async function listApprovals(_:Request,{supabase}:any,_p:any,url:URL){
  let q=supabase.from('ApprovalRequest').select('*').order('date',{ascending:false})
  const s=url.searchParams.get('status'),w=url.searchParams.get('workerId')
  if(s)q=q.eq('status',s); if(w)q=q.eq('workerId',w)
  const {data,error}=await q; if(error)throw error; return jsonOk(data)
}
async function getApproval(_:Request,{supabase}:any,{id}:any){
  const {data,error}=await supabase.from('ApprovalRequest').select('*').eq('id',id).single()
  if(error)return jsonError('Approval not found',404); return jsonOk(data)
}
async function createApproval(req:Request,{supabase}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('ApprovalRequest').insert({...body,date:new Date().toISOString(),status:body.status||'Pending'}).select().single()
  if(error)throw error; return jsonOk(data,201)
}
async function updateApproval(req:Request,{supabase}:any,{id}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('ApprovalRequest').update(body).eq('id',id).select().single()
  if(error)return jsonError('Approval not found',404)
  // Side-effects
  const status=body.status
  if(data.type==='Room Booking'&&data.reservationId&&status)
    await supabase.from('Booking').update({status}).eq('id',data.reservationId).catch(()=>{})
  if(status==='Approved'){
    if(data.type==='New Worker'&&data.workerId)
      await supabase.from('Worker').update({status:'Active'}).eq('id',data.workerId).catch(()=>{})
    if(data.type==='Ministry Change'&&data.workerId)
      await supabase.from('Worker').update({majorMinistryId:data.newMajorId||'',minorMinistryId:data.newMinorId||''}).eq('id',data.workerId).catch(()=>{})
  }
  return jsonOk(data)
}
