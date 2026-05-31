import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { matchRoute, RouteMap } from '../_shared/router.ts'
import { jsonOk, jsonError } from '../_shared/response.ts'
import { logError } from '../_shared/logger.ts'

const MODULE = 'ministries'
const routes: RouteMap = [
  { method:'GET',    pattern:'/ministries',                              handler:listMinistries },
  { method:'POST',   pattern:'/ministries',                              handler:createMinistry },
  { method:'GET',    pattern:'/ministries/:id',                          handler:getMinistry },
  { method:'PUT',    pattern:'/ministries/:id',                          handler:updateMinistry },
  { method:'DELETE', pattern:'/ministries/:id',                          handler:deleteMinistry },
  { method:'GET',    pattern:'/ministries/:id/workload-categories',      handler:listWorkloadCategories },
  { method:'POST',   pattern:'/ministries/:id/workload-categories',      handler:createWorkloadCategory },
  { method:'PUT',    pattern:'/ministries/:id/workload-categories/:cid', handler:updateWorkloadCategory },
  { method:'DELETE', pattern:'/ministries/:id/workload-categories/:cid', handler:deleteWorkloadCategory },
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

const DEPT_NAME: Record<string,string> = {W:'Worship',O:'Outreach',R:'Relationship',D:'Discipleship',A:'Administration'}
const DEPT_CODE: Record<string,string> = {Worship:'W',Outreach:'O',Relationship:'R',Discipleship:'D',Administration:'A'}
function normCode(v:string){return v.length===1?v.toUpperCase():(DEPT_CODE[v]||'D')}

async function listMinistries(_:Request,{supabase}:any){
  const {data,error}=await supabase.from('Ministry').select('*,department:Department(*)').order('weight',{nullsFirst:false}).order('name')
  if(error)throw error
  return jsonOk(data?.map((m:any)=>({...m,department:DEPT_NAME[m.departmentCode]||m.departmentCode})))
}
async function getMinistry(_:Request,{supabase}:any,{id}:any){
  const [{data:m,error},{data:wc},{data:workers}]=await Promise.all([
    supabase.from('Ministry').select('*,department:Department(*)').eq('id',id).single(),
    supabase.from('WorkloadCategory').select('*').eq('ministryId',id).order('sortOrder'),
    supabase.from('Worker').select('*',{count:'exact',head:true}).or(`majorMinistryId.eq.${id},minorMinistryId.eq.${id}`).eq('status','Active'),
  ])
  if(error)return jsonError('Ministry not found',404)
  return jsonOk({...m,department:DEPT_NAME[m.departmentCode]||m.departmentCode,workloadCategories:wc,activeMemberCount:workers?.length??0})
}
async function createMinistry(req:Request,{supabase}:any){
  const body=await req.json()
  const departmentCode=normCode(body.departmentCode||body.department||'D')
  const {department,departmentCode:_,...rest}=body
  const {data,error}=await supabase.from('Ministry').insert({...rest,departmentCode}).select().single()
  if(error)throw error
  return jsonOk(data,201)
}
async function updateMinistry(req:Request,{supabase}:any,{id}:any){
  const body=await req.json()
  const {department,...rest}=body
  if(rest.departmentCode)rest.departmentCode=normCode(rest.departmentCode)
  const {data,error}=await supabase.from('Ministry').update(rest).eq('id',id).select().single()
  if(error)return jsonError('Ministry not found',404)
  return jsonOk(data)
}
async function deleteMinistry(_:Request,{supabase}:any,{id}:any){
  const {data:active}=await supabase.from('Worker').select('id').or(`majorMinistryId.eq.${id},minorMinistryId.eq.${id}`).eq('status','Active').limit(1)
  if(active?.length)return jsonError('Ministry has active workers',409)
  const {error}=await supabase.from('Ministry').delete().eq('id',id)
  if(error)throw error
  return jsonOk({success:true})
}
async function listWorkloadCategories(_:Request,{supabase}:any,{id}:any){
  const {data,error}=await supabase.from('WorkloadCategory').select('*').eq('ministryId',id).order('sortOrder')
  if(error)throw error
  return jsonOk(data)
}
async function createWorkloadCategory(req:Request,{supabase}:any,{id}:any){
  const body=await req.json()
  if(!body.name)return jsonError('name is required',400)
  const {data,error}=await supabase.from('WorkloadCategory').insert({...body,ministryId:id}).select().single()
  if(error)throw error
  return jsonOk(data,201)
}
async function updateWorkloadCategory(req:Request,{supabase}:any,{cid}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('WorkloadCategory').update(body).eq('id',cid).select().single()
  if(error)return jsonError('Category not found',404)
  return jsonOk(data)
}
async function deleteWorkloadCategory(_:Request,{supabase}:any,{cid}:any){
  const {error}=await supabase.from('WorkloadCategory').delete().eq('id',cid)
  if(error)throw error
  return jsonOk({success:true})
}
