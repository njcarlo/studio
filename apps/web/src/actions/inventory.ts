'use server';

import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/permissions/registry';
import * as svc from '@studio/inventory';

// ── Reads ─────────────────────────────────────────────────────────────────────

export async function getCategories() {
    await requirePermission(PERMISSIONS.inventory.access);
    return svc.getCategories();
}

export async function getItems(
    ministryId: string | null,
    params: {
        search?: string;
        categoryId?: string;
        status?: string;
        type?: string;
        page?: number;
        limit?: number;
    } = {},
) {
    await requirePermission(PERMISSIONS.inventory.access);
    return svc.getItems(ministryId, params);
}

export async function getItem(id: string) {
    await requirePermission(PERMISSIONS.inventory.access);
    return svc.getItem(id);
}

export async function getLogs(
    ministryId: string | null,
    params: { itemId?: string; limit?: number } = {},
) {
    await requirePermission(PERMISSIONS.inventory.access);
    return svc.getLogs(ministryId, params);
}

export async function getBorrowings(
    ministryId: string | null,
    params: { status?: string; borrowerId?: string } = {},
) {
    await requirePermission(PERMISSIONS.inventory.access);
    return svc.getBorrowings(ministryId, params);
}

export async function getBorrowing(id: string) {
    await requirePermission(PERMISSIONS.inventory.access);
    return svc.getBorrowing(id);
}

export async function getActiveBorrowingForItem(itemId: string) {
    await requirePermission(PERMISSIONS.inventory.access);
    return svc.getActiveBorrowingForItem(itemId);
}

export async function getDashboardStats(ministryId: string | null) {
    await requirePermission(PERMISSIONS.inventory.access);
    return svc.getDashboardStats(ministryId);
}

export async function lookupItemByQR(payload: string) {
    await requirePermission(PERMISSIONS.inventory.access);
    return svc.lookupItemByQR(payload);
}

export async function getLocations(ministryId: string) {
    await requirePermission(PERMISSIONS.inventory.access);
    return svc.getLocations(ministryId);
}

export async function getMinistrySummary(ministryId: string) {
    await requirePermission(PERMISSIONS.inventory.access);
    return svc.getMinistrySummary(ministryId);
}

export async function searchWorkersForInventory(q: string) {
    await requirePermission(PERMISSIONS.inventory.manage);
    return svc.searchWorkersForInventory(q);
}

export async function getReportsData(ministryId: string | null) {
    await requirePermission(PERMISSIONS.inventory.access);
    return svc.getReportsData(ministryId);
}

// ── Writes ────────────────────────────────────────────────────────────────────

export async function createCategory(payload: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    group?: string;
}) {
    await requirePermission(PERMISSIONS.inventory.manage);
    return svc.createCategory(payload);
}

export async function updateCategory(
    id: string,
    payload: Partial<{
        name: string;
        description: string;
        color: string;
        icon: string;
        group: string;
        isActive: boolean;
    }>,
) {
    await requirePermission(PERMISSIONS.inventory.manage);
    return svc.updateCategory(id, payload);
}

export async function createItem(
    ministryId: string | null,
    payload: {
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
        weight?: number;
        role?: string;
        assignedTo?: string;
        purchaseDate?: string;
        statusCode?: number;
        statusDetails?: string;
        recommendation?: string;
    },
) {
    await requirePermission(PERMISSIONS.inventory.manage);
    return svc.createItem(ministryId, payload);
}

export async function updateItem(id: string, payload: Record<string, any>) {
    await requirePermission(PERMISSIONS.inventory.manage);
    return svc.updateItem(id, payload);
}

export async function deleteItem(id: string) {
    await requirePermission(PERMISSIONS.inventory.manage);
    return svc.deleteItem(id);
}

export async function adjustStock(
    itemId: string,
    action: 'Stock In' | 'Stock Out' | 'Adjustment',
    quantity: number,
    notes?: string,
    workerId?: string,
) {
    await requirePermission(PERMISSIONS.inventory.manage);
    return svc.adjustStock(itemId, action, quantity, notes, workerId);
}

export async function createBorrowing(payload: {
    itemId: string;
    borrowerId: string;
    dueDate?: string;
    checkoutNotes?: string;
    checkoutCondition?: string;
}) {
    await requirePermission(PERMISSIONS.inventory.manage);
    return svc.createBorrowing(payload);
}

export async function returnBorrowing(
    id: string,
    payload: { returnNotes?: string; returnCondition?: string },
) {
    await requirePermission(PERMISSIONS.inventory.manage);
    return svc.returnBorrowing(id, payload);
}

export async function bulkUpdateItems(ids: string[], payload: Record<string, any>) {
    await requirePermission(PERMISSIONS.inventory.manage);
    return svc.bulkUpdateItems(ids, payload);
}

export async function bulkDeleteItems(ids: string[]) {
    await requirePermission(PERMISSIONS.inventory.manage);
    return svc.bulkDeleteItems(ids);
}

export async function bulkImportItems(rows: Record<string, any>[]) {
    await requirePermission(PERMISSIONS.inventory.manage);
    return svc.bulkImportItems(rows);
}

export async function importInventoryRows(
    ministryId: string | null,
    rows: Array<{
        weight?: number;
        category: string;
        inventoryCode?: string;
        name: string;
        role?: string;
        location?: string;
        assignedTo?: string;
        purchaseDate?: string;
        statusCode?: number;
        status?: string;
        statusDetails?: string;
        recommendation?: string;
    }>,
) {
    await requirePermission(PERMISSIONS.inventory.manage);
    return svc.importInventoryRows(ministryId, rows);
}

export async function toggleInventoryWorkerPerm(
    workerId: string,
    permKey: string,
    currentlyHas: boolean,
) {
    await requirePermission(PERMISSIONS.inventory.manage);
    return svc.toggleInventoryWorkerPerm(workerId, permKey, currentlyHas);
}
