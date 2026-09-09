import { useState, useCallback } from 'react';

export interface InventoryItem {
  id: string;
  name: string;
  inventoryCode?: string;
  categoryId: string;
  type: 'EQUIPMENT' | 'CONSUMABLE';
  stock: number;
  quantity?: number;
  minStock: number;
  minQuantity?: number;
  unit: string;
  status: string;
  statusDetails?: string;
  location?: string;
  aisle?: string;
  shelf?: string;
  bin?: string;
  assignedTo?: string;
  imageUrl?: string;
  isApprovalRequired?: boolean;
  isKit?: boolean;
  group?: string;
  nextMaintenanceDate?: string;
  parentId?: string;
  category?: { id: string; name: string; color?: string; icon?: string };
  children?: any[];
  parent?: any;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  group?: string;
  isActive: boolean;
  itemCount?: number;
}

export interface InventoryLog {
  id: string;
  itemId: string;
  workerId?: string;
  workerName?: string;
  action: string;
  type: string;
  quantity: number;
  balance: number;
  notes?: string;
  timestamp: string;
  item?: { id: string; name: string; inventoryCode?: string; imageUrl?: string };
  worker?: { id: string; firstName: string; lastName: string; avatarUrl?: string };
}

export interface InventoryBorrowing {
  id: string;
  itemId: string;
  borrowerId: string;
  borrowerName: string;
  borrowerEmail?: string;
  borrowedAt: string;
  dueDate?: string;
  returnedAt?: string;
  status: string;
  checkoutNotes?: string;
  checkoutCondition?: string;
  checkoutChecklist?: any;
  returnNotes?: string;
  returnCondition?: string;
  returnChecklist?: any;
  returnPhotos?: string[];
  item: { id: string; name: string; inventoryCode?: string; status: string; imageUrl?: string; stock?: number };
  borrower?: { id: string; firstName: string; lastName: string; email?: string; phone?: string; avatarUrl?: string };
}

export function useInventory() {
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [borrowings, setBorrowings] = useState<InventoryBorrowing[]>([]);
  const [totalBorrowings, setTotalBorrowings] = useState(0);

  // Fetch Dashboard Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  }, []);

  // Fetch Activity Logs
  const fetchLogs = useCallback(async (take: number = 30) => {
    try {
      const res = await fetch(`/api/inventory/logs?take=${take}`);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch logs', error);
    }
  }, []);

  // Fetch Inventory Items
  const fetchItems = useCallback(async (params: any = {}) => {
    setLoading(true);
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`/api/inventory/items?${query}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotalItems(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch items', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Quick Action
  const updateStock = async (id: string, action: 'Stock In' | 'Stock Out' | 'Adjustment', quantity: number, notes?: string) => {
    try {
      const res = await fetch(`/api/inventory/items/${id}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, quantity, notes }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update stock');
      }
      // Refresh data
      fetchStats();
      fetchLogs();
      fetchItems();
      return await res.json();
    } catch (error) {
      console.error('Failed to update stock', error);
      throw error;
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch('/api/locations');
      const data = await res.json();
      setLocations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch locations', error);
    }
  }, []);

  const fetchBorrowings = useCallback(async (params: any = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`/api/borrowings?${query}`);
      const data = await res.json();
      setBorrowings(data.borrowings || []);
      setTotalBorrowings(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch borrowings', error);
    }
  }, []);

  const createItem = async (data: any) => {
    try {
      const res = await fetch('/api/inventory/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create item');
      }
      fetchItems();
      fetchStats();
      fetchLocations();
      return await res.json();
    } catch (error) {
      console.error('Failed to create item', error);
      throw error;
    }
  };

  const updateItem = async (id: string, data: any) => {
    try {
      const res = await fetch(`/api/inventory/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update item');
      }
      fetchItems();
      fetchStats();
      return await res.json();
    } catch (error) {
      console.error('Failed to update item', error);
      throw error;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/inventory/items/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete item');
      }
      fetchItems();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete item', error);
      throw error;
    }
  };

  const bulkUpdateItems = async (itemIds: string[], data: any) => {
    try {
      const res = await fetch('/api/inventory/items/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds, data }),
      });
      if (!res.ok) throw new Error('Failed to bulk update');
      fetchItems();
      fetchStats();
    } catch (error) {
      console.error('Failed to bulk update items', error);
      throw error;
    }
  };

  const bulkDeleteItems = async (itemIds: string[]) => {
    try {
      const res = await fetch('/api/inventory/items/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds }),
      });
      if (!res.ok) throw new Error('Failed to bulk delete');
      fetchItems();
      fetchStats();
    } catch (error) {
      console.error('Failed to bulk delete items', error);
      throw error;
    }
  };

  const bulkImportItems = async (items: any[]) => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory/items/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error('Failed to import items');
      fetchItems();
      fetchStats();
      fetchCategories();
      fetchLocations();
      return await res.json();
    } catch (error) {
      console.error('Failed to bulk import', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    logs,
    items,
    totalItems,
    loading,
    categories,
    locations,
    borrowings,
    totalBorrowings,
    fetchStats,
    fetchLogs,
    fetchItems,
    fetchCategories,
    fetchLocations,
    fetchBorrowings,
    updateStock,
    createItem,
    updateItem,
    deleteItem,
    bulkUpdateItems,
    bulkDeleteItems,
    bulkImportItems,
  };
}
