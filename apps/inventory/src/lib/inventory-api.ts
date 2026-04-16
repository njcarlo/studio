/**
 * Inventory data layer — replaces the Express /api/ endpoints.
 * Uses Supabase directly against the shared Postgres DB.
 * Table names match the Prisma schema (PascalCase with quotes).
 */
import { supabase } from './supabase';

// ── Categories ────────────────────────────────────────────────────────────────

export async function getCategories() {
    const { data, error } = await supabase
        .from('InventoryCategory')
        .select('*')
        .eq('isActive', true)
        .order('name');
    if (error) throw error;
    return data ?? [];
}

export async function createCategory(payload: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    group?: string;
}) {
    const { data, error } = await supabase
        .from('InventoryCategory')
        .insert({ ...payload, isActive: true })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateCategory(id: string, payload: Partial<{
    name: string; description: string; color: string; icon: string; group: string; isActive: boolean;
}>) {
    const { data, error } = await supabase
        .from('InventoryCategory')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

// ── Items ─────────────────────────────────────────────────────────────────────

export async function getItems(params: {
    search?: string;
    categoryId?: string;
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
} = {}) {
    const { search, categoryId, status, type, page = 1, limit = 50 } = params;
    let query = supabase
        .from('InventoryItem')
        .select('*, category:InventoryCategory(id,name,color,icon)', { count: 'exact' })
        .is('parentId', null) // top-level items only
        .order('name');

    if (search) query = query.ilike('name', `%${search}%`);
    if (categoryId) query = query.eq('categoryId', categoryId);
    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    return { items: data ?? [], total: count ?? 0 };
}

export async function getItem(id: string) {
    const { data, error } = await supabase
        .from('InventoryItem')
        .select('*, category:InventoryCategory(id,name,color,icon), children:InventoryItem!parentId(*)')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
}

export async function createItem(payload: {
    name: string;
    categoryId: string;
    type?: string;
    quantity?: number;
    minQuantity?: number;
    unit?: string;
    status?: string;
    location?: string;
    aisle?: string;
    shelf?: string;
    bin?: string;
    inventoryCode?: string;
    imageUrl?: string;
    isApprovalRequired?: boolean;
    notes?: string;
}) {
    const { data, error } = await supabase
        .from('InventoryItem')
        .insert(payload)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateItem(id: string, payload: Record<string, any>) {
    const { data, error } = await supabase
        .from('InventoryItem')
        .update({ ...payload, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteItem(id: string) {
    const { error } = await supabase.from('InventoryItem').delete().eq('id', id);
    if (error) throw error;
}

// ── Stock adjustment ──────────────────────────────────────────────────────────

export async function adjustStock(
    itemId: string,
    action: 'Stock In' | 'Stock Out' | 'Adjustment',
    quantity: number,
    notes?: string,
    workerId?: string,
) {
    // Fetch current quantity
    const { data: item, error: fetchErr } = await supabase
        .from('InventoryItem')
        .select('quantity')
        .eq('id', itemId)
        .single();
    if (fetchErr) throw fetchErr;

    const current = item.quantity ?? 0;
    const delta = action === 'Stock Out' ? -quantity : quantity;
    const newQty = Math.max(0, current + delta);

    // Update item quantity
    await supabase
        .from('InventoryItem')
        .update({ quantity: newQty, updatedAt: new Date().toISOString() })
        .eq('id', itemId);

    // Log the transaction
    await supabase.from('InventoryLog').insert({
        itemId,
        workerId: workerId ?? null,
        type: action,
        quantity,
        balance: newQty,
        notes: notes ?? null,
    });

    return newQty;
}

// ── Logs ──────────────────────────────────────────────────────────────────────

export async function getLogs(params: { itemId?: string; limit?: number } = {}) {
    let query = supabase
        .from('InventoryLog')
        .select('*, item:InventoryItem(id,name)')
        .order('timestamp', { ascending: false })
        .limit(params.limit ?? 100);

    if (params.itemId) query = query.eq('itemId', params.itemId);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
}

// ── Borrowings ────────────────────────────────────────────────────────────────

export async function getBorrowings(params: { status?: string; borrowerId?: string } = {}) {
    let query = supabase
        .from('InventoryBorrowing')
        .select('*, item:InventoryItem(id,name,imageUrl), borrower:Worker(id,firstName,lastName,email)')
        .order('borrowedAt', { ascending: false });

    if (params.status) query = query.eq('status', params.status);
    if (params.borrowerId) query = query.eq('borrowerId', params.borrowerId);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
}

export async function createBorrowing(payload: {
    itemId: string;
    borrowerId: string;
    dueDate?: string;
    checkoutNotes?: string;
    checkoutCondition?: string;
}) {
    const { data, error } = await supabase
        .from('InventoryBorrowing')
        .insert({ ...payload, status: 'BORROWED' })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function returnBorrowing(id: string, payload: {
    returnNotes?: string;
    returnCondition?: string;
}) {
    const { data, error } = await supabase
        .from('InventoryBorrowing')
        .update({ ...payload, status: 'RETURNED', returnedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

// ── Dashboard stats ───────────────────────────────────────────────────────────

export async function getDashboardStats() {
    const [itemsRes, borrowingsRes] = await Promise.all([
        supabase.from('InventoryItem').select('id, quantity, minQuantity, status, type', { count: 'exact' }),
        supabase.from('InventoryBorrowing').select('id', { count: 'exact' }).eq('status', 'BORROWED'),
    ]);

    const items = itemsRes.data ?? [];
    const totalItems = itemsRes.count ?? 0;
    const activeBorrowings = borrowingsRes.count ?? 0;
    const lowStock = items.filter(i => (i.quantity ?? 0) <= (i.minQuantity ?? 0) && (i.minQuantity ?? 0) > 0).length;
    const equipment = items.filter(i => i.type === 'EQUIPMENT').length;
    const consumables = items.filter(i => i.type === 'CONSUMABLE').length;

    return { totalItems, activeBorrowings, lowStock, equipment, consumables };
}
