import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
    getDashboardStats, getLogs, getItems, getCategories,
    adjustStock, createItem as apiCreateItem, updateItem as apiUpdateItem, deleteItem as apiDeleteItem,
    getBorrowings, createBorrowing, returnBorrowing,
} from '../lib/inventory-api';

export function useInventory() {
    const [stats, setStats] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [borrowings, setBorrowings] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);

    const fetchStats = useCallback(async () => {
        try {
            const data = await getDashboardStats();
            setStats(data);
        } catch (e) {
            console.error('Failed to fetch stats', e);
        }
    }, []);

    const fetchLogs = useCallback(async (itemId?: string) => {
        try {
            const data = await getLogs({ itemId, limit: 100 });
            setLogs(data);
        } catch (e) {
            console.error('Failed to fetch logs', e);
        }
    }, []);

    const fetchItems = useCallback(async (params: any = {}) => {
        setLoading(true);
        try {
            const data = await getItems(params);
            setItems(data.items);
            setTotalItems(data.total);
        } catch (e) {
            console.error('Failed to fetch items', e);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (e) {
            console.error('Failed to fetch categories', e);
        }
    }, []);

    const fetchBorrowings = useCallback(async (params: any = {}) => {
        try {
            const data = await getBorrowings(params);
            setBorrowings(data);
        } catch (e) {
            console.error('Failed to fetch borrowings', e);
        }
    }, []);

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
        const item = await apiCreateItem(payload);
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

    const fetchLocations = useCallback(async () => {
        try {
            const { data } = await supabase
                .from('InventoryItem')
                .select('location')
                .not('location', 'is', null);
            const unique = [...new Set((data ?? []).map((d: any) => d.location).filter(Boolean))];
            setLocations(unique.map((name: string) => ({ id: name, name })));
        } catch (e) {
            console.error('Failed to fetch locations', e);
        }
    }, []);

    const bulkUpdateItems = async (ids: string[], payload: any) => {
        await supabase.from('InventoryItem').update(payload).in('id', ids);
        fetchItems();
    };

    const bulkDeleteItems = async (ids: string[]) => {
        await supabase.from('InventoryItem').delete().in('id', ids);
        fetchItems();
        fetchStats();
    };

    const bulkImportItems = async (rows: any[]) => {
        await supabase.from('InventoryItem').insert(rows);
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
