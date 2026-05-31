import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { matchRoute, RouteMap } from '../_shared/router.ts'
import { jsonOk, jsonError } from '../_shared/response.ts'
import { logError } from '../_shared/logger.ts'

const MODULE = 'meals'
const routes: RouteMap = [
  { method:'GET',    pattern:'/meal-stubs',              handler:listMealStubs },
  { method:'POST',   pattern:'/meal-stubs',              handler:createMealStub },
  { method:'POST',   pattern:'/meal-stubs/bulk',         handler:bulkCreateMealStubs },
  { method:'GET',    pattern:'/meal-stubs/:id',          handler:getMealStub },
  { method:'PUT',    pattern:'/meal-stubs/:id',          handler:updateMealStub },
  { method:'DELETE', pattern:'/meal-stubs/:id',          handler:deleteMealStub },
  { method:'POST',   pattern:'/meal-stubs/:id/claim',    handler:claimMealStub },
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

async function listMealStubs(_:Request,{supabase}:any,_p:any,url:URL){
  let q=supabase.from('MealStub').select('*').order('date',{ascending:false})
  const w=url.searchParams.get('workerId'),s=url.searchParams.get('scheduleId'),st=url.searchParams.get('status')
  if(w)q=q.eq('workerId',w); if(s)q=q.eq('scheduleId',s); if(st)q=q.eq('status',st)
  const {data,error}=await q; if(error)throw error; return jsonOk(data)
}
async function getMealStub(_:Request,{supabase}:any,{id}:any){
  const {data,error}=await supabase.from('MealStub').select('*').eq('id',id).single()
  if(error)return jsonError('Meal stub not found',404); return jsonOk(data)
}
async function createMealStub(req:Request,{supabase}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('MealStub').insert({...body,date:body.date||new Date().toISOString(),status:body.status||'Available'}).select().single()
  if(error)throw error; return jsonOk(data,201)
}
async function bulkCreateMealStubs(req:Request,{supabase}:any){
  const {stubs}=await req.json()
  if(!Array.isArray(stubs)||!stubs.length)return jsonError('stubs array required',400)
  const records=stubs.map((s:any)=>({...s,date:s.date||new Date().toISOString(),status:s.status||'Available'}))
  const {data,error}=await supabase.from('MealStub').insert(records).select()
  if(error)throw error; return jsonOk(data,201)
}
async function updateMealStub(req:Request,{supabase}:any,{id}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('MealStub').update(body).eq('id',id).select().single()
  if(error)return jsonError('Meal stub not found',404); return jsonOk(data)
}
async function deleteMealStub(_:Request,{supabase}:any,{id}:any){
  const {error}=await supabase.from('MealStub').delete().eq('id',id)
  if(error)throw error; return jsonOk({success:true})
}
async function claimMealStub(_:Request,{supabase}:any,{id}:any){
  const {data:stub}=await supabase.from('MealStub').select('status').eq('id',id).single()
  if(!stub)return jsonError('Meal stub not found',404)
  if(stub.status==='Used'||stub.status==='Claimed')return jsonError('Meal stub already claimed',409)
  const {data,error}=await supabase.from('MealStub').update({status:'Used',claimedAt:new Date().toISOString()}).eq('id',id).select().single()
  if(error)throw error; return jsonOk(data)
}
