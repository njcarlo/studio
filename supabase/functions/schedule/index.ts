import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { matchRoute, RouteMap } from '../_shared/router.ts'
import { jsonOk, jsonError } from '../_shared/response.ts'
import { logError } from '../_shared/logger.ts'

const MODULE = 'schedule'
const routes: RouteMap = [
  { method:'GET',    pattern:'/schedules',                              handler:listSchedules },
  { method:'POST',   pattern:'/schedules',                              handler:createSchedule },
  { method:'POST',   pattern:'/schedules/from-template',                handler:createFromTemplate },
  { method:'GET',    pattern:'/schedules/:id',                          handler:getSchedule },
  { method:'PUT',    pattern:'/schedules/:id',                          handler:updateSchedule },
  { method:'DELETE', pattern:'/schedules/:id',                          handler:deleteSchedule },
  { method:'GET',    pattern:'/schedules/:id/assignments',              handler:listAssignments },
  { method:'POST',   pattern:'/schedules/:id/assignments',              handler:upsertAssignment },
  { method:'DELETE', pattern:'/schedules/:id/assignments/:aid',         handler:deleteAssignment },
  { method:'GET',    pattern:'/schedules/:id/worship-slots',            handler:listWorshipSlots },
  { method:'POST',   pattern:'/schedules/:id/worship-slots',            handler:createWorshipSlot },
  { method:'PUT',    pattern:'/schedules/:id/worship-slots/:sid',       handler:updateWorshipSlot },
  { method:'DELETE', pattern:'/schedules/:id/worship-slots/:sid',       handler:deleteWorshipSlot },
  { method:'GET',    pattern:'/templates',                              handler:listTemplates },
  { method:'POST',   pattern:'/templates',                              handler:createTemplate },
  { method:'GET',    pattern:'/templates/:id',                          handler:getTemplate },
  { method:'PUT',    pattern:'/templates/:id',                          handler:updateTemplate },
  { method:'DELETE', pattern:'/templates/:id',                          handler:deleteTemplate },
  { method:'GET',    pattern:'/templates/:id/roles',                    handler:listTemplateRoles },
  { method:'POST',   pattern:'/templates/:id/roles',                    handler:createTemplateRole },
  { method:'PUT',    pattern:'/templates/:id/roles/:rid',               handler:updateTemplateRole },
  { method:'DELETE', pattern:'/templates/:id/roles/:rid',               handler:deleteTemplateRole },
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

async function listSchedules(_:Request,{supabase}:any,_p:any,url:URL){
  let q=supabase.from('ServiceSchedule').select('*').order('date',{ascending:false})
  const s=url.searchParams.get('startDate'),e=url.searchParams.get('endDate')
  if(s)q=q.gte('date',s); if(e)q=q.lte('date',e)
  const {data,error}=await q; if(error)throw error; return jsonOk(data)
}
async function getSchedule(_:Request,{supabase}:any,{id}:any){
  const {data,error}=await supabase.from('ServiceSchedule').select('*, assignments:ScheduleAssignment(*), worshipSlots:WorshipSlot(*,workers:WorshipSlotWorker(*))').eq('id',id).single()
  if(error)return jsonError('Schedule not found',404); return jsonOk(data)
}
async function createSchedule(req:Request,{supabase}:any,_p:any,_u:any,auth:any){
  const body=await req.json()
  if(!body.date)return jsonError('date is required',400)
  const {data,error}=await supabase.from('ServiceSchedule').insert({...body,createdBy:auth?.userId??'system'}).select().single()
  if(error)throw error; return jsonOk(data,201)
}
async function createFromTemplate(req:Request,{supabase}:any,_p:any,_u:any,auth:any){
  const {templateId,date,title,notes}=await req.json()
  if(!templateId||!date)return jsonError('templateId and date are required',400)
  const {data:tpl,error:te}=await supabase.from('ServiceTemplate').select('*,roles:TemplateRole(*)').eq('id',templateId).single()
  if(te)return jsonError('Template not found',404)
  const {data:sched,error:se}=await supabase.from('ServiceSchedule').insert({date,title:title||tpl.name,notes,createdBy:auth?.userId??'system'}).select().single()
  if(se)throw se
  if(tpl.roles?.length){
    const assignments=tpl.roles.map((r:any)=>({scheduleId:sched.id,ministryId:tpl.ministryId,roleName:r.roleName,order:r.order}))
    await supabase.from('ScheduleAssignment').insert(assignments)
  }
  return jsonOk(sched,201)
}
async function updateSchedule(req:Request,{supabase}:any,{id}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('ServiceSchedule').update(body).eq('id',id).select().single()
  if(error)return jsonError('Schedule not found',404); return jsonOk(data)
}
async function deleteSchedule(_:Request,{supabase}:any,{id}:any){
  const {error}=await supabase.from('ServiceSchedule').delete().eq('id',id)
  if(error)throw error; return jsonOk({success:true})
}
async function listAssignments(_:Request,{supabase}:any,{id}:any){
  const {data,error}=await supabase.from('ScheduleAssignment').select('*').eq('scheduleId',id).order('order')
  if(error)throw error; return jsonOk(data)
}
async function upsertAssignment(req:Request,{supabase}:any,{id}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('ScheduleAssignment').insert({...body,scheduleId:id}).select().single()
  if(error)throw error; return jsonOk(data,201)
}
async function deleteAssignment(_:Request,{supabase}:any,{aid}:any){
  const {error}=await supabase.from('ScheduleAssignment').delete().eq('id',aid)
  if(error)throw error; return jsonOk({success:true})
}
async function listWorshipSlots(_:Request,{supabase}:any,{id}:any){
  const {data,error}=await supabase.from('WorshipSlot').select('*,workers:WorshipSlotWorker(*)').eq('scheduleId',id).order('order')
  if(error)throw error; return jsonOk(data)
}
async function createWorshipSlot(req:Request,{supabase}:any,{id}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('WorshipSlot').insert({...body,scheduleId:id}).select().single()
  if(error)throw error; return jsonOk(data,201)
}
async function updateWorshipSlot(req:Request,{supabase}:any,{sid}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('WorshipSlot').update(body).eq('id',sid).select().single()
  if(error)return jsonError('Slot not found',404); return jsonOk(data)
}
async function deleteWorshipSlot(_:Request,{supabase}:any,{sid}:any){
  const {error}=await supabase.from('WorshipSlot').delete().eq('id',sid)
  if(error)throw error; return jsonOk({success:true})
}
async function listTemplates(_:Request,{supabase}:any,_p:any,url:URL){
  let q=supabase.from('ServiceTemplate').select('*,roles:TemplateRole(*)').order('name')
  const m=url.searchParams.get('ministryId'); if(m)q=q.eq('ministryId',m)
  const {data,error}=await q; if(error)throw error; return jsonOk(data)
}
async function getTemplate(_:Request,{supabase}:any,{id}:any){
  const {data,error}=await supabase.from('ServiceTemplate').select('*,roles:TemplateRole(*)').eq('id',id).single()
  if(error)return jsonError('Template not found',404); return jsonOk(data)
}
async function createTemplate(req:Request,{supabase}:any,_p:any,_u:any,auth:any){
  const body=await req.json()
  const {data,error}=await supabase.from('ServiceTemplate').insert({...body,createdBy:auth?.userId??'system'}).select().single()
  if(error)throw error; return jsonOk(data,201)
}
async function updateTemplate(req:Request,{supabase}:any,{id}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('ServiceTemplate').update(body).eq('id',id).select().single()
  if(error)return jsonError('Template not found',404); return jsonOk(data)
}
async function deleteTemplate(_:Request,{supabase}:any,{id}:any){
  const {error}=await supabase.from('ServiceTemplate').delete().eq('id',id)
  if(error)throw error; return jsonOk({success:true})
}
async function listTemplateRoles(_:Request,{supabase}:any,{id}:any){
  const {data,error}=await supabase.from('TemplateRole').select('*').eq('templateId',id).order('order')
  if(error)throw error; return jsonOk(data)
}
async function createTemplateRole(req:Request,{supabase}:any,{id}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('TemplateRole').insert({...body,templateId:id}).select().single()
  if(error)throw error; return jsonOk(data,201)
}
async function updateTemplateRole(req:Request,{supabase}:any,{rid}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('TemplateRole').update(body).eq('id',rid).select().single()
  if(error)return jsonError('Role not found',404); return jsonOk(data)
}
async function deleteTemplateRole(_:Request,{supabase}:any,{rid}:any){
  const {error}=await supabase.from('TemplateRole').delete().eq('id',rid)
  if(error)throw error; return jsonOk({success:true})
}
