'use client';

import { useState, useCallback } from 'react';
import {
    getDashboardStats, getLogs, getItems, getCategories, getLocations,
    adjustStock, createItem as apiCreateItem, updateItem as apiUpdateItem, deleteItem as apiDeleteItem,
    getBorrowings, createBorrowing, returnBorrowing,
    bulkUpdateItems as apiBulkUpdate, bulkDeleteItems as apiBulkDelete, bulkImportItems as apiBulkImport,
} from '@/services/inventory-api';

export function useInventory(ministryId?: string | null) {
    const [stats, setStats] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [borrowings, setBorrowings] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);

    const fetchStats = useCallback(async () => {
        if (ministryId === undefined) return;
        try {
            const data = await getDashboardStats(ministryId ?? null);
            setStats(data);
        } catch (e) {
            console.error('Failed to fetch stats', e);
        }
    }, [ministryId]);

    const fetchLogs = useCallback(async (itemId?: string) => {
        if (ministryId === undefined) return;
        try {
            const data = await getLogs(ministryId ?? null, { itemId, limit: 100 });
            setLogs(data);
        } catch (e) {
            console.error('Failed to fetch logs', e);
        }
    }, [ministryId]);

    const fetchItems = useCallback(async (params: any = {}) => {
        if (ministryId === undefined) return;
        setLoading(true);
        try {
            const data = await getItems(ministryId ?? null, params);
            setItems(data.items);
            setTotalItems(data.total);
        } catch (e) {
            console.error('Failed to fetch items', e);
        } finally {
            setLoading(false);
        }
    }, [ministryId]);

    const fetchCategories = useCallback(async () => {
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (e) {
            console.error('Failed to fetch categories', e);
        }
    }, []);

    const fetchBorrowings = useCallback(async (params: any = {}) => {
        if (ministryId === undefined) return;
        try {
            const data = await getBorrowings(ministryId ?? null, params);
            setBorrowings(data);
        } catch (e) {
            console.error('Failed to fetch borrowings', e);
        }
    }, [ministryId]);

    const fetchLocations = useCallback(async () => {
        if (!ministryId) return;
        try {
            const data = await getLocations(ministryId);
            setLocations(data);
        } catch (e) {
            console.error('Failed to fetch locations', e);
        }
    }, [ministryId]);

    const updateStock = async (id: string, action: 'Stock In' | 'Stock Out', quantity: number, notes?: string) => {
        try {
            await adjustStock(id, action, quantity, notes);
            fetchStats();
            fetchLogs();
            fetchItems();
        } catch (e) {
            console.error('Failed to update stock', e);
        }
    };

    const addItem = async (payload: any): Promise<any> => {
        const item = await apiCreateItem(ministryId ?? null, payload);
        fetchItems();
        fetchStats();
        return item;
    };

    const editItem = async (id: string, payload: any): Promise<any> => {
        const item = await apiUpdateItem(id, payload);
        fetchItems();
        return item;
    };

    const removeItem = async (id: string): Promise<void> => {
        await apiDeleteItem(id);
        fetchItems();
        fetchStats();
    };

    const checkoutItem = async (payload: any) => {
        const b = await createBorrowing(payload);
        fetchBorrowings();
        fetchStats();
        return b;
    };

    const returnItem = async (id: string, payload: any) => {
        const b = await returnBorrowing(id, payload);
        fetchBorrowings();
        fetchStats();
        return b;
    };

    const bulkUpdateItems = async (ids: string[], payload: any) => {
        await apiBulkUpdate(ids, payload);
        fetchItems();
    };

    const bulkDeleteItems = async (ids: string[]) => {
        await apiBulkDelete(ids);
        fetchItems();
        fetchStats();
    };

    const bulkImportItems = async (rows: any[]) => {
        const tagged = rows.map(r => ({ ...r, group: ministryId }));
        await apiBulkImport(tagged);
        fetchItems();
        fetchStats();
    };

    const createItem = async (payload: any): Promise<any> => addItem(payload);
    const updateItem = async (id: string, payload: any): Promise<any> => editItem(id, payload);
    const deleteItem = async (id: string): Promise<void> => removeItem(id);

    return {
        stats, logs, items, totalItems, loading, categories, borrowings, locations,
        fetchStats, fetchLogs, fetchItems, fetchCategories, fetchBorrowings, fetchLocations,
        updateStock, addItem, editItem, removeItem, checkoutItem, returnItem,
        createItem, updateItem, deleteItem,
        bulkUpdateItems, bulkDeleteItems, bulkImportItems,
    };
}
