import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { matchRoute, RouteMap } from '../_shared/router.ts'
import { jsonOk, jsonError } from '../_shared/response.ts'
import { logError } from '../_shared/logger.ts'

const MODULE = 'c2s'
const routes: RouteMap = [
  { method:'GET',    pattern:'/groups',              handler:listGroups },
  { method:'POST',   pattern:'/groups',              handler:createGroup },
  { method:'GET',    pattern:'/groups/:id',          handler:getGroup },
  { method:'PUT',    pattern:'/groups/:id',          handler:updateGroup },
  { method:'DELETE', pattern:'/groups/:id',          handler:deleteGroup },
  { method:'GET',    pattern:'/mentees',             handler:listMentees },
  { method:'POST',   pattern:'/mentees',             handler:createMentee },
  { method:'GET',    pattern:'/mentees/:id',         handler:getMentee },
  { method:'PUT',    pattern:'/mentees/:id',         handler:updateMentee },
  { method:'DELETE', pattern:'/mentees/:id',         handler:deleteMentee },
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

async function listGroups(_:Request,{supabase}:any){
  const {data,error}=await supabase.from('C2SGroup').select('*,mentees:C2SMentee(*)').order('createdAt',{ascending:false})
  if(error)throw error
  return jsonOk(data?.map((g:any)=>({...g,memberCount:g.mentees?.length??0})))
}
async function getGroup(_:Request,{supabase}:any,{id}:any){
  const {data,error}=await supabase.from('C2SGroup').select('*,mentees:C2SMentee(*)').eq('id',id).single()
  if(error)return jsonError('Group not found',404)
  // Fetch mentor worker profile
  const {data:mentor}=await supabase.from('Worker').select('id,firstName,lastName,email,avatarUrl').eq('id',data.mentorId).single()
  return jsonOk({...data,mentor,memberCount:data.mentees?.length??0})
}
async function createGroup(req:Request,{supabase}:any){
  const body=await req.json()
  if(!body.name||!body.mentorId)return jsonError('name and mentorId required',400)
  const {data,error}=await supabase.from('C2SGroup').insert({...body,menteeIds:body.menteeIds??[]}).select().single()
  if(error)throw error; return jsonOk(data,201)
}
async function updateGroup(req:Request,{supabase}:any,{id}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('C2SGroup').update(body).eq('id',id).select().single()
  if(error)return jsonError('Group not found',404); return jsonOk(data)
}
async function deleteGroup(_:Request,{supabase}:any,{id}:any){
  const {error}=await supabase.from('C2SGroup').delete().eq('id',id)
  if(error)throw error; return jsonOk({success:true})
}
async function listMentees(_:Request,{supabase}:any,_p:any,url:URL){
  let q=supabase.from('C2SMentee').select('*,group:C2SGroup(*)').order('createdAt',{ascending:false})
  const g=url.searchParams.get('groupId'); if(g)q=q.eq('groupId',g)
  const {data,error}=await q; if(error)throw error; return jsonOk(data)
}
async function getMentee(_:Request,{supabase}:any,{id}:any){
  const {data,error}=await supabase.from('C2SMentee').select('*,group:C2SGroup(*)').eq('id',id).single()
  if(error)return jsonError('Mentee not found',404); return jsonOk(data)
}
async function createMentee(req:Request,{supabase}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('C2SMentee').insert(body).select().single()
  if(error)throw error; return jsonOk(data,201)
}
async function updateMentee(req:Request,{supabase}:any,{id}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('C2SMentee').update(body).eq('id',id).select().single()
  if(error)return jsonError('Mentee not found',404); return jsonOk(data)
}
async function deleteMentee(_:Request,{supabase}:any,{id}:any){
  const {error}=await supabase.from('C2SMentee').delete().eq('id',id)
  if(error)throw error; return jsonOk({success:true})
}
