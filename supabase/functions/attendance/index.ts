import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { matchRoute, RouteMap } from '../_shared/router.ts'
import { jsonOk, jsonError } from '../_shared/response.ts'
import { logError } from '../_shared/logger.ts'

const MODULE = 'attendance'
const routes: RouteMap = [
  { method:'GET',  pattern:'/attendance',        handler:listAttendance },
  { method:'POST', pattern:'/attendance',        handler:createAttendance },
  { method:'GET',  pattern:'/attendance/stats',  handler:getStats },
  { method:'GET',  pattern:'/attendance/:id',    handler:getAttendance },
  { method:'GET',  pattern:'/scan-logs',         handler:listScanLogs },
  { method:'POST', pattern:'/scan-logs',         handler:createScanLog },
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

async function listAttendance(_:Request,{supabase}:any,_p:any,url:URL){
  let q=supabase.from('AttendanceRecord').select('*,worker:Worker(id,firstName,lastName,email,avatarUrl)').order('time',{ascending:false})
  const w=url.searchParams.get('workerProfileId'),s=url.searchParams.get('startDate'),e=url.searchParams.get('endDate')
  if(w)q=q.eq('workerProfileId',w)
  if(s)q=q.gte('time',s); if(e)q=q.lte('time',e)
  const {data,error}=await q; if(error)throw error; return jsonOk(data)
}
async function getAttendance(_:Request,{supabase}:any,{id}:any){
  const {data,error}=await supabase.from('AttendanceRecord').select('*,worker:Worker(*)').eq('id',id).single()
  if(error)return jsonError('Record not found',404); return jsonOk(data)
}
async function createAttendance(req:Request,{supabase}:any){
  const body=await req.json()
  if(!body.workerProfileId)return jsonError('workerProfileId required',400)
  const {data,error}=await supabase.from('AttendanceRecord').insert({...body,time:body.time||new Date().toISOString()}).select().single()
  if(error)throw error; return jsonOk(data,201)
}
async function getStats(_:Request,{supabase}:any,_p:any,url:URL){
  const s=url.searchParams.get('startDate'),e=url.searchParams.get('endDate')
  let q=supabase.from('AttendanceRecord').select('*,worker:Worker(majorMinistryId,minorMinistryId)')
  if(s)q=q.gte('time',s); if(e)q=q.lte('time',e)
  const {data,error}=await q; if(error)throw error
  const totalCount=data?.length??0
  const byDate:Record<string,number>={}
  for(const r of(data??[])){const d=r.time?.split('T')[0]??'';byDate[d]=(byDate[d]||0)+1}
  return jsonOk({totalCount,byDate:Object.entries(byDate).map(([date,count])=>({date,count}))})
}
async function listScanLogs(_:Request,{supabase}:any,_p:any,url:URL){
  let q=supabase.from('ScanLog').select('*').order('timestamp',{ascending:false})
  const lim=parseInt(url.searchParams.get('limit')||'100')
  q=q.limit(lim); const {data,error}=await q; if(error)throw error; return jsonOk(data)
}
async function createScanLog(req:Request,{supabase}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('ScanLog').insert({...body,timestamp:new Date().toISOString()}).select().single()
  if(error)throw error; return jsonOk(data,201)
}
