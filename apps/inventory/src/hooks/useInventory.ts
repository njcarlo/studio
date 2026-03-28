import { useState, useCallback } from 'react';

export function useInventory() {
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

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
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory/logs');
      const data = await res.json();
      setLogs(data);
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
      setItems(data.items);
      setTotalItems(data.total);
    } catch (error) {
      console.error('Failed to fetch items', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Quick Action
  const updateStock = async (id: string, action: 'Stock In' | 'Stock Out', quantity: number) => {
    try {
      await fetch(`/api/inventory/items/${id}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, quantity })
      });
      // Refresh data
      fetchStats();
      fetchLogs();
      fetchItems();
    } catch (error) {
      console.error('Failed to update stock', error);
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch('/api/locations');
      const data = await res.json();
      setLocations(data);
    } catch (error) {
      console.error('Failed to fetch locations', error);
    }
  }, []);

  const createItem = async (data: any) => {
    try {
      await fetch('/api/inventory/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      fetchItems();
      fetchStats();
    } catch (error) {
      console.error('Failed to create item', error);
    }
  };

  const updateItem = async (id: string, data: any) => {
    try {
      await fetch(`/api/inventory/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      fetchItems();
      fetchStats();
    } catch (error) {
      console.error('Failed to update item', error);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/inventory/items/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        throw new Error('Server returned ' + res.status);
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
      await fetch('/api/inventory/items/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds, data })
      });
      fetchItems();
      fetchStats();
    } catch (error) {
      console.error('Failed to bulk update items', error);
    }
  };

  const bulkDeleteItems = async (itemIds: string[]) => {
    try {
      const res = await fetch('/api/inventory/items/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds })
      });
      if (!res.ok) {
        throw new Error('Server returned ' + res.status);
      }
      fetchItems();
      fetchStats();
    } catch (error) {
      console.error('Failed to bulk delete items', error);
      throw error;
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
    fetchStats,
    fetchLogs,
    fetchItems,
    fetchCategories,
    fetchLocations,
    updateStock,
    createItem,
    updateItem,
    deleteItem,
    bulkUpdateItems,
    bulkDeleteItems
  };
}
