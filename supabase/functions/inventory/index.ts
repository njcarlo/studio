import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCors } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { matchRoute, RouteMap } from '../_shared/router.ts'
import { jsonOk, jsonError } from '../_shared/response.ts'
import { logError } from '../_shared/logger.ts'

const MODULE = 'inventory'
const routes: RouteMap = [
  { method:'GET',    pattern:'/items',              handler:listItems },
  { method:'POST',   pattern:'/items',              handler:createItem },
  { method:'GET',    pattern:'/items/:id',          handler:getItem },
  { method:'PUT',    pattern:'/items/:id',          handler:updateItem },
  { method:'DELETE', pattern:'/items/:id',          handler:deleteItem },
  { method:'GET',    pattern:'/categories',         handler:listCategories },
  { method:'POST',   pattern:'/categories',         handler:createCategory },
  { method:'PUT',    pattern:'/categories/:id',     handler:updateCategory },
  { method:'DELETE', pattern:'/categories/:id',     handler:deleteCategory },
  { method:'GET',    pattern:'/logs',               handler:listLogs },
  { method:'POST',   pattern:'/adjustments',        handler:recordAdjustment },
  { method:'GET',    pattern:'/borrowings',         handler:listBorrowings },
  { method:'POST',   pattern:'/borrowings',         handler:createBorrowing },
  { method:'PUT',    pattern:'/borrowings/:id/return', handler:processReturn },
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

async function listItems(_:Request,{supabase}:any,_p:any,url:URL){
  let q=supabase.from('InventoryItem').select('*,category:InventoryCategory(*)').order('name')
  const c=url.searchParams.get('categoryId'),s=url.searchParams.get('status')
  if(c)q=q.eq('categoryId',c); if(s)q=q.eq('status',s)
  const {data,error}=await q; if(error)throw error; return jsonOk(data)
}
async function getItem(_:Request,{supabase}:any,{id}:any){
  const {data,error}=await supabase.from('InventoryItem').select('*,category:InventoryCategory(*),borrowings:InventoryBorrowing(*),logs:InventoryLog(*)').eq('id',id).single()
  if(error)return jsonError('Item not found',404); return jsonOk(data)
}
async function createItem(req:Request,{supabase}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('InventoryItem').insert(body).select().single()
  if(error)throw error; return jsonOk(data,201)
}
async function updateItem(req:Request,{supabase}:any,{id}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('InventoryItem').update(body).eq('id',id).select().single()
  if(error)return jsonError('Item not found',404); return jsonOk(data)
}
async function deleteItem(_:Request,{supabase}:any,{id}:any){
  const {data:active}=await supabase.from('InventoryBorrowing').select('id').eq('itemId',id).eq('status','BORROWED').limit(1)
  if(active?.length)return jsonError('Item has active borrowings',409)
  const {error}=await supabase.from('InventoryItem').delete().eq('id',id)
  if(error)throw error; return jsonOk({success:true})
}
async function listCategories(_:Request,{supabase}:any){
  const {data,error}=await supabase.from('InventoryCategory').select('*').order('name')
  if(error)throw error; return jsonOk(data)
}
async function createCategory(req:Request,{supabase}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('InventoryCategory').insert(body).select().single()
  if(error)throw error; return jsonOk(data,201)
}
async function updateCategory(req:Request,{supabase}:any,{id}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('InventoryCategory').update(body).eq('id',id).select().single()
  if(error)return jsonError('Category not found',404); return jsonOk(data)
}
async function deleteCategory(_:Request,{supabase}:any,{id}:any){
  const {error}=await supabase.from('InventoryCategory').delete().eq('id',id)
  if(error)throw error; return jsonOk({success:true})
}
async function listLogs(_:Request,{supabase}:any,_p:any,url:URL){
  let q=supabase.from('InventoryLog').select('*').order('timestamp',{ascending:false})
  const i=url.searchParams.get('itemId'),w=url.searchParams.get('workerId')
  if(i)q=q.eq('itemId',i); if(w)q=q.eq('workerId',w)
  const {data,error}=await q; if(error)throw error; return jsonOk(data)
}
async function recordAdjustment(req:Request,{supabase}:any,_p:any,_u:any,auth:any){
  const {itemId,delta,type,notes}=await req.json()
  if(!itemId||delta===undefined||!type)return jsonError('itemId, delta, type required',400)
  // Read current qty, clamp, update atomically via RPC if available, else manual
  const {data:item}=await supabase.from('InventoryItem').select('quantity').eq('id',itemId).single()
  if(!item)return jsonError('Item not found',404)
  const oldQty=item.quantity??0
  const newQty=Math.max(0,oldQty+delta)
  const actualDelta=newQty-oldQty
  const {error:ue}=await supabase.from('InventoryItem').update({quantity:newQty,updatedAt:new Date().toISOString()}).eq('id',itemId)
  if(ue)throw ue
  await supabase.from('InventoryLog').insert({itemId,workerId:auth?.userId,type,quantity:Math.abs(delta),balance:newQty,notes,timestamp:new Date().toISOString()})
  return jsonOk({newQuantity:newQty,actualDelta})
}
async function listBorrowings(_:Request,{supabase}:any,_p:any,url:URL){
  let q=supabase.from('InventoryBorrowing').select('*,item:InventoryItem(*),borrower:Worker(id,firstName,lastName)').order('borrowedAt',{ascending:false})
  const s=url.searchParams.get('status'),i=url.searchParams.get('itemId')
  if(s)q=q.eq('status',s); if(i)q=q.eq('itemId',i)
  const {data,error}=await q; if(error)throw error; return jsonOk(data)
}
async function createBorrowing(req:Request,{supabase}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('InventoryBorrowing').insert({...body,status:'BORROWED',borrowedAt:new Date().toISOString()}).select().single()
  if(error)throw error; return jsonOk(data,201)
}
async function processReturn(req:Request,{supabase}:any,{id}:any){
  const body=await req.json()
  const {data,error}=await supabase.from('InventoryBorrowing').update({...body,status:'RETURNED',returnedAt:new Date().toISOString()}).eq('id',id).select().single()
  if(error)return jsonError('Borrowing not found',404); return jsonOk(data)
}
