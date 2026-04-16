import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import {
  Filter, Search,
  Plus, ChevronLeft, ChevronRight,
  CheckSquare, Square, X, RefreshCw, QrCode, Trash2, Image as ImageIcon,
  LayoutList, LayoutGrid, MoreHorizontal, ArrowDownToLine, ArrowUpFromLine
} from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import { QRModal } from './QRModal';
import { ItemModal } from './ItemModal';
import * as XLSX from 'xlsx';

export function InventoryTable() {
  const { 
    items, totalItems, loading, categories, locations, 
    fetchItems, fetchLocations, updateStock, deleteItem, 
    fetchCategories, bulkUpdateItems, bulkDeleteItems, bulkImportItems 
  } = useInventory();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [skip, setSkip] = useState(0);
  const take = 5;

  const [activeCategory, setActiveCategory] = useState('');
  const [activeType, setActiveType] = useState('');
  const [activeStatus, setActiveStatus] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const [isQrModalOpen, setQrModalOpen] = useState(false);
  const [qrItems, setQrItems] = useState<{ id: string, name: string }[]>([]);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState<any>(null);

  const [bulkAction, setBulkAction] = useState<'status' | 'location' | null>(null);
  const [bulkValue, setBulkValue] = useState('');

  // More menu state per row
  const [moreMenuId, setMoreMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number, right: number } | null>(null);

  useEffect(() => {
    const handleClose = () => setMoreMenuId(null);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.more-dropdown') && !(e.target as Element).closest('.more-btn')) {
        setMoreMenuId(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Delete confirmation modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>('');

  // Bulk Delete confirmation modal
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const hasActiveFilters = !!(activeCategory || activeType || activeStatus);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  useEffect(() => {
    fetchItems({
      search,
      skip: skip.toString(),
      take: take.toString(),
      ...(activeCategory ? { category: activeCategory } : {}),
      ...(activeType ? { type: activeType } : {}),
      ...(activeStatus ? { status: activeStatus } : {}),
    });
  }, [fetchItems, search, skip, activeCategory, activeType, activeStatus]);

  const clearFilters = () => {
    setActiveCategory(''); setActiveType(''); setActiveStatus(''); setSkip(0);
  };

  const handleDelete = (id: string, name: string) => {
    setMoreMenuId(null);
    setDeleteConfirmId(id);
    setDeleteConfirmName(name);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteItem(deleteConfirmId);
      await fetchItems({ search, skip: skip.toString(), take: take.toString() });
      setDeleteConfirmId(null);
      setDeleteConfirmName('');
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete the item. Please try again or check for existing dependencies.');
    }
  };

  const confirmBulkDelete = async () => {
    try {
      await bulkDeleteItems(Array.from(selectedIds));
      await fetchItems({ search, skip: skip.toString(), take: take.toString() });
      setBulkDeleteConfirm(false);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Failed to bulk delete items:', error);
      alert('Failed to delete the selected items. Please try again.');
    }
  };

  const handleExportCSV = () => {
    const selected = items.filter(i => selectedIds.has(i.id));
    if (!selected.length) return;
    
    const rows = selected.map(i => {
      const computedStatus = i.stock === 0 ? 'Out of Stock' : i.stock <= (i.minStock || 5) ? 'Low Stock' : i.status || 'In Stock';
      return {
        'ID': i.id,
        'Inventory Code': i.inventoryCode || '',
        'Name': i.name,
        'Category': i.category?.name || '',
        'Type': i.type,
        'Stock': i.stock,
        'Min Stock': i.minStock,
        'Unit': i.unit,
        'Status': computedStatus,
        'Location': i.location?.name || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
    XLSX.writeFile(workbook, 'inventory_export.xlsx');
    setSelectedIds(new Set());
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(items.map(d => d.id)));
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleApplyBulk = async () => {
    if (!bulkValue) return;
    const ids = Array.from(selectedIds);
    if (bulkAction === 'status') await bulkUpdateItems(ids, { status: bulkValue });
    else if (bulkAction === 'location') await bulkUpdateItems(ids, { locationId: bulkValue });
    setBulkAction(null); setBulkValue(''); setSelectedIds(new Set());
  };

  const handleStockIn = async (id: string) => {
    if (navigator.vibrate) navigator.vibrate(50);
    await updateStock(id, 'Stock In', 1);
  };

  const handleStockOut = async (id: string) => {
    if (navigator.vibrate) navigator.vibrate(50);
    await updateStock(id, 'Stock Out', 1);
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'In Stock': return '#10b981';
      case 'Low Stock': return '#f59e0b';
      case 'Out of Stock': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const getStatusStyle = (status: string): CSSProperties => {
    switch (status) {
      case 'In Stock': return { color: '#10b981', backgroundColor: 'transparent' };
      case 'Low Stock': return { color: '#f59e0b', fontWeight: 600, border: '1px solid #fde68a', backgroundColor: '#fffbeb', padding: '0.15rem 0.5rem', borderRadius: '9999px' };
      case 'Out of Stock': return { color: '#ef4444', fontWeight: 600, border: '1px solid #fecaca', backgroundColor: '#fef2f2', padding: '0.15rem 0.5rem', borderRadius: '9999px' };
      default: return {};
    }
  };

  const getCategoryPillStyle = (): CSSProperties => ({
    display: 'inline-flex', alignItems: 'center',
    padding: '0.15rem 0.6rem',
    borderRadius: '9999px',
    fontSize: '0.75rem', fontWeight: 500,
    border: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    color: '#374151',
    whiteSpace: 'nowrap'
  });

  const getTypePillStyle = (type: string): CSSProperties => {
    if (type === 'Consumable') {
      return {
        display: 'inline-flex', alignItems: 'center',
        padding: '0.15rem 0.6rem',
        borderRadius: '9999px',
        fontSize: '0.75rem', fontWeight: 500,
        backgroundColor: '#ede9fe', color: '#7c3aed',
        whiteSpace: 'nowrap'
      };
    }
    return {
      display: 'inline-flex', alignItems: 'center',
      padding: '0.15rem 0.6rem',
      borderRadius: '9999px',
      fontSize: '0.75rem', fontWeight: 500,
      border: '1px solid #e5e7eb',
      backgroundColor: '#f3f4f6', color: '#4b5563',
      whiteSpace: 'nowrap'
    };
  };

  const statusFilterItems = ['In Stock', 'Low Stock', 'Out of Stock'];

  return (
    <>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', padding: '1.25rem' }}>

        {/* ── Controls Bar ────────────────────────────────────────────────── */}
        <div className="action-bar">
          {/* Search */}
          <div className="search-container">
            <Search size={14} color="#9ca3af" />
            <input
              type="text" placeholder="Search" className="search-input"
              style={{ fontSize: '0.8125rem' }}
              value={search} onChange={e => { setSearch(e.target.value); setSkip(0); }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 0 }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Push right */}
          <div className="action-bar-spacer" />

          {/* Item count pill */}
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '0.35rem 0.75rem',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '0.8125rem', color: '#6b7280',
            backgroundColor: '#f9fafb',
            whiteSpace: 'nowrap'
          }}>
            {totalItems} items
          </span>

          {/* Table / Grid toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.375rem 0.625rem',
                fontSize: '0.8125rem', fontWeight: 500,
                border: 'none', cursor: 'pointer',
                backgroundColor: viewMode === 'table' ? '#fff' : '#f9fafb',
                color: viewMode === 'table' ? '#1a1a2e' : '#9ca3af',
                transition: 'all 0.15s'
              }}
            >
              <LayoutList size={14} /> Table
            </button>
            <div style={{ width: '1px', height: '28px', backgroundColor: '#e5e7eb' }} />
            <button
              onClick={() => setViewMode('grid')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.375rem 0.625rem',
                fontSize: '0.8125rem', fontWeight: 500,
                border: 'none', cursor: 'pointer',
                backgroundColor: viewMode === 'grid' ? '#fff' : '#f9fafb',
                color: viewMode === 'grid' ? '#1a1a2e' : '#9ca3af',
                transition: 'all 0.15s'
              }}
            >
              <LayoutGrid size={14} /> Grid
            </button>
          </div>

          {/* Filter — no badge */}
          <button
            className="btn btn-outline"
            style={{ height: '34px', gap: '0.35rem', fontSize: '0.8125rem', padding: '0 0.75rem', borderRadius: '8px' }}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          >
            <Filter size={14} /> Filter
          </button>

          {/* Import Excel */}
          <label className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', height: '34px', gap: '0.35rem', fontSize: '0.8125rem', padding: '0 0.75rem', borderRadius: '8px', cursor: 'pointer', margin: 0 }}>
            <ArrowUpFromLine size={14} /> Import
            <input type="file" accept=".xlsx, .xls, .csv" style={{ display: 'none' }} onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = async (evt) => {
                  try {
                    const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const rawJson: any[] = XLSX.utils.sheet_to_json(sheet);
                    
                    const formatted = rawJson.map(row => ({
                      name: row['Name'] || row['name'],
                      inventoryCode: row['Inventory Code'] || row['inventoryCode'],
                      category: row['Category'] || row['category'],
                      type: row['Type'] || row['type'],
                      stock: row['Stock'] || row['stock'],
                      minStock: row['Min Stock'] || row['minStock'],
                      unit: row['Unit'] || row['unit'],
                      status: row['Status'] || row['status'],
                      location: row['Location'] || row['location']
                    })).filter(r => r.name);

                    if (formatted.length === 0) {
                      alert('No valid items found in the file. Make sure there is a "Name" column.');
                      return;
                    }

                    try {
                      await bulkImportItems(formatted);
                      alert(`Successfully imported/updated ${formatted.length} items!`);
                    } catch (importErr) {
                      console.error('Backend import error:', importErr);
                      alert('Import failed on the server. There might be duplicates or invalid data.');
                    }

                  } catch (error) {
                    console.error('XLSX parse error:', error);
                    alert('Failed to parse Excel file. The file might be corrupted.');
                  }
                };
                reader.readAsArrayBuffer(file);
                e.target.value = '';
              }
            }} />
          </label>

          {/* Add Item */}
          <button className="btn btn-primary" style={{ height: '34px', gap: '0.35rem', fontSize: '0.8125rem', padding: '0 0.875rem', borderRadius: '8px' }}
            onClick={() => { setModalItem(null); setIsItemModalOpen(true); }}>
            <Plus size={14} /> Add Item
          </button>
        </div>

        {/* ── Filter Panel ────────────────────────────────────────────────── */}
        {showFilterPanel && (
          <div style={{
            padding: '0.875rem 1rem', borderRadius: '8px',
            border: '1px solid #e5e7eb', backgroundColor: '#f9fafb',
            display: 'flex', flexDirection: 'column', gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {/* Category */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button onClick={() => { setActiveCategory(''); setSkip(0); }} style={{ ...getCategoryPillStyle(), ...(activeCategory === '' ? { borderColor: '#3b5bdb', backgroundColor: '#eef2ff', color: '#3b5bdb' } : {}), cursor: 'pointer' }}>All</button>
                  {categories.map((c: any) => (
                    <button key={c.id} onClick={() => { setActiveCategory(c.name); setSkip(0); }} style={{ ...getCategoryPillStyle(), ...(activeCategory === c.name ? { borderColor: '#3b5bdb', backgroundColor: '#eef2ff', color: '#3b5bdb' } : {}), cursor: 'pointer' }}>{c.name}</button>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</label>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button onClick={() => { setActiveType(''); setSkip(0); }} style={{ ...getCategoryPillStyle(), ...(activeType === '' ? { borderColor: '#3b5bdb', backgroundColor: '#eef2ff', color: '#3b5bdb' } : {}), cursor: 'pointer' }}>All</button>
                  {['Equipment', 'Consumable'].map(t => (
                    <button key={t} onClick={() => { setActiveType(t); setSkip(0); }} style={{ ...getCategoryPillStyle(), ...(activeType === t ? { borderColor: '#3b5bdb', backgroundColor: '#eef2ff', color: '#3b5bdb' } : {}), cursor: 'pointer' }}>{t}</button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button onClick={() => { setActiveStatus(''); setSkip(0); }} style={{ ...getCategoryPillStyle(), ...(activeStatus === '' ? { borderColor: '#3b5bdb', backgroundColor: '#eef2ff', color: '#3b5bdb' } : {}), cursor: 'pointer' }}>All</button>
                  {statusFilterItems.map(s => (
                    <button key={s} onClick={() => { setActiveStatus(s); setSkip(0); }} style={{ ...getCategoryPillStyle(), ...(activeStatus === s ? { borderColor: '#3b5bdb', backgroundColor: '#eef2ff', color: '#3b5bdb' } : {}), cursor: 'pointer' }}>{s}</button>
                  ))}
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" style={{ height: '28px', fontSize: '0.75rem', gap: '0.3rem' }} onClick={clearFilters}>
                  <X size={12} /> Clear filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Bulk Action Bar ──────────────────────────────────────────────── */}
        {selectedIds.size > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
            padding: '0.625rem 0.875rem',
            borderRadius: '8px',
            backgroundColor: '#eef2ff',
            border: '1px solid #c7d2fe',
          }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#3730a3' }}>
              {selectedIds.size} selected
            </span>

            {bulkAction === 'status' ? (
              <>
                <select className="form-control" style={{ width: 'auto', height: '32px', fontSize: '0.8rem' }} value={bulkValue} onChange={e => setBulkValue(e.target.value)}>
                  <option value="">Select status…</option>
                  {statusFilterItems.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button className="btn btn-primary" style={{ height: '32px', fontSize: '0.8rem' }} onClick={handleApplyBulk}>Apply</button>
                <button className="btn btn-outline" style={{ height: '32px', fontSize: '0.8rem' }} onClick={() => setBulkAction(null)}>Cancel</button>
              </>
            ) : bulkAction === 'location' ? (
              <>
                <select className="form-control" style={{ width: 'auto', height: '32px', fontSize: '0.8rem' }} value={bulkValue} onChange={e => setBulkValue(e.target.value)}>
                  <option value="">Select location…</option>
                  {locations?.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <button className="btn btn-primary" style={{ height: '32px', fontSize: '0.8rem' }} onClick={handleApplyBulk}>Apply</button>
                <button className="btn btn-outline" style={{ height: '32px', fontSize: '0.8rem' }} onClick={() => setBulkAction(null)}>Cancel</button>
              </>
            ) : (
              <>
                <div className="action-bar-spacer" />
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-outline" style={{ height: '30px', fontSize: '0.75rem', backgroundColor: '#fff' }} onClick={() => { setBulkAction('status'); setBulkValue(''); }}>Update Status</button>
                  <button className="btn btn-outline" style={{ height: '30px', fontSize: '0.75rem', backgroundColor: '#fff' }} onClick={() => { setBulkAction('location'); setBulkValue(''); }}>Assign Location</button>
                  <button className="btn btn-outline" style={{ height: '30px', fontSize: '0.75rem', backgroundColor: '#fff' }} onClick={() => {
                    const selectedArr = items.filter(i => selectedIds.has(i.id)).map(i => ({ id: i.id, name: i.name, inventoryCode: i.inventoryCode || 'No Code' }));
                    setQrItems(selectedArr);
                    setQrModalOpen(true);
                  }}>
                    Print Labels
                  </button>
                  <button className="btn btn-outline" style={{ height: '30px', fontSize: '0.75rem', backgroundColor: '#fff', gap: '0.3rem' }} onClick={handleExportCSV}>
                    <ArrowDownToLine size={13} /> Export Excel
                  </button>
                  <button className="btn btn-outline" style={{ height: '30px', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'var(--danger)', backgroundColor: '#fff', gap: '0.3rem' }} onClick={() => setBulkDeleteConfirm(true)}>
                    <Trash2 size={13} /> Delete
                  </button>
                  <button className="btn btn-outline" style={{ height: '30px', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'var(--danger)', backgroundColor: '#fff' }} onClick={() => setSelectedIds(new Set())}>
                    <X size={12} /> Deselect
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Table View ─────────────────────────────────────────────────── */}
        {viewMode === 'table' ? (
          <div style={{ overflowX: 'auto', border: '1px solid #f3f4f6', borderRadius: '10px' }}>
            <table style={{ minWidth: '860px', width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '0.625rem 0.875rem', width: '36px' }}>
                    <button onClick={toggleSelectAll} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                      {items.length > 0 && selectedIds.size === items.length
                        ? <CheckSquare size={16} color="#3b5bdb" />
                        : <Square size={16} />}
                    </button>
                  </th>
                  {['ITEM NAME', 'CATEGORY', 'TYPE', 'STOCK', 'STATUS', 'LOCATION', 'UPDATED', 'ACTIONS'].map(col => (
                    <th key={col} style={{ padding: '0.625rem 0.875rem', fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                      <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading...
                    </div>
                  </td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ fontSize: '2rem' }}>📦</div>
                      <div style={{ fontWeight: 600, color: '#374151' }}>No items found</div>
                      <div style={{ fontSize: '0.8rem' }}>{hasActiveFilters ? 'Try adjusting your filters.' : 'Click "Add Item" to get started.'}</div>
                      {hasActiveFilters && (
                        <button className="btn btn-outline" style={{ height: '30px', fontSize: '0.8rem', marginTop: '0.25rem' }} onClick={clearFilters}>Clear Filters</button>
                      )}
                    </div>
                  </td></tr>
                ) : items.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  const isMoreOpen = moreMenuId === item.id;
                  const computedStatus = item.stock === 0 ? 'Out of Stock' : item.stock <= (item.minStock || 5) ? 'Low Stock' : item.status || 'In Stock';

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        backgroundColor: isSelected ? '#eef2ff' : 'transparent',
                        transition: 'background-color 0.12s'
                      }}
                    >
                      <td style={{ padding: '0.625rem 0.875rem' }}>
                        <button onClick={() => toggleSelect(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#9ca3af' }}>
                          {isSelected ? <CheckSquare size={16} color="#3b5bdb" /> : <Square size={16} />}
                        </button>
                      </td>
                      <td style={{ padding: '0.625rem 0.875rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: '#f3f4f6', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <ImageIcon size={16} color="#9ca3af" />
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#1a1a2e' }}>{item.name}</div>
                            <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: '0.05rem', fontFamily: 'monospace' }}>
                              {item.inventoryCode || 'No Code'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.625rem 0.875rem' }}>
                        <span style={getCategoryPillStyle()}>{item.category?.name || '—'}</span>
                      </td>
                      <td style={{ padding: '0.625rem 0.875rem' }}>
                        <span style={getTypePillStyle(item.type)}>{item.type}</span>
                      </td>
                      <td style={{ padding: '0.625rem 0.875rem' }}>
                        <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: item.stock === 0 ? '#ef4444' : item.stock < 10 ? '#f59e0b' : '#1a1a2e' }}>
                          {item.stock}
                        </span>
                      </td>
                      <td style={{ padding: '0.625rem 0.875rem', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8125rem', whiteSpace: 'nowrap', ...getStatusStyle(computedStatus) }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: getStatusDot(computedStatus), display: 'inline-block', flexShrink: 0 }} />
                          {computedStatus}
                        </span>
                      </td>
                      <td style={{ padding: '0.625rem 0.875rem', fontSize: '0.8rem', color: '#6b7280' }}>{item.location?.name || '—'}</td>
                      <td style={{ padding: '0.625rem 0.875rem', fontSize: '0.78rem', color: '#9ca3af' }}>{new Date(item.lastUpdated).toLocaleDateString()}</td>
                      <td style={{ padding: '0.625rem 0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                          {/* + In */}
                          <button
                            className="touch-action-btn"
                            onClick={() => handleStockIn(item.id)}
                            title="Stock In"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                              padding: '0.2rem 0.45rem',
                              fontSize: '0.72rem', fontWeight: 600,
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              backgroundColor: '#fff',
                              color: '#374151',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            +
                          </button>
                          {/* – Out */}
                          <button
                            className="touch-action-btn"
                            onClick={() => handleStockOut(item.id)}
                            title="Stock Out"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                              padding: '0.2rem 0.45rem',
                              fontSize: '0.72rem', fontWeight: 600,
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              backgroundColor: '#fff',
                              color: '#374151',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            –
                          </button>
                          {/* QR Label */}
                          <button
                            className="touch-action-btn"
                            onClick={() => { setQrItems([{ id: item.id, name: item.name }]); setQrModalOpen(true); }}
                            title="QR Label"
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: '28px', height: '28px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              backgroundColor: '#fff',
                              color: '#6b7280',
                              cursor: 'pointer',
                            }}
                          >
                            <QrCode size={14} />
                          </button>
                          {/* ··· More */}
                          <div style={{ position: 'relative' }}>
                            <button
                              className="more-btn touch-action-btn"
                              onClick={(e) => {
                                if (isMoreOpen) setMoreMenuId(null);
                                else {
                                  setMoreMenuId(item.id);
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                                }
                              }}
                              title="More options"
                              style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: '28px', height: '28px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                backgroundColor: '#fff',
                                color: '#6b7280',
                                cursor: 'pointer',
                              }}
                            >
                              <MoreHorizontal size={14} />
                            </button>
                            {isMoreOpen && menuPos && (
                              <div className="more-dropdown" style={{
                                position: 'fixed', right: menuPos.right, top: menuPos.top,
                                display: 'flex', flexDirection: 'column',
                                backgroundColor: '#fff', border: '1px solid #e5e7eb',
                                borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                zIndex: 1000, overflow: 'hidden', minWidth: '130px'
                              }}>
                                <button
                                  onClick={() => { setModalItem(item); setIsItemModalOpen(true); setMoreMenuId(null); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem 0.875rem', fontSize: '0.8125rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#374151', textAlign: 'left' }}
                                >
                                  Edit Item
                                </button>
                                <div style={{ height: '1px', backgroundColor: '#f3f4f6', margin: '0.2rem 0' }} />
                                <button
                                  onClick={() => handleDelete(item.id, item.name)}
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem 0.875rem', fontSize: '0.8125rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#ef4444', textAlign: 'left' }}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          // Grid View
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {loading ? (
              <div style={{ gridColumn: '1/-1', padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', display: 'inline' }} /> Loading...
              </div>
            ) : items.length === 0 ? (
              <div style={{ gridColumn: '1/-1', padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
                <div style={{ fontWeight: 600, color: '#374151' }}>No items found</div>
              </div>
            ) : items.map((item) => {
              const computedStatus = item.stock === 0 ? 'Out of Stock' : item.stock < 10 ? 'Low Stock' : 'In Stock';
              return (
                <div key={item.id} style={{
                  backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px',
                  padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: '#f3f4f6', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <ImageIcon size={18} color="#9ca3af" />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a1a2e' }}>{item.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.1rem', fontFamily: 'monospace' }}>{item.inventoryCode || 'No Code'}</div>
                    </div>
                  </div>
                  <span style={getCategoryPillStyle()}>{item.category?.name || '—'}</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: item.stock === 0 ? '#ef4444' : '#1a1a2e' }}>{item.stock}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', ...getStatusStyle(computedStatus) }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getStatusDot(computedStatus), display: 'inline-block' }} />
                      {computedStatus}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{item.location?.name || '—'}</div>
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem' }}>
                    <button className="touch-action-btn" onClick={() => handleStockIn(item.id)} style={{ flex: 1, padding: '0.3rem', fontSize: '0.75rem', fontWeight: 600, border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', color: '#374151' }}>+ In</button>
                    <button className="touch-action-btn" onClick={() => handleStockOut(item.id)} style={{ flex: 1, padding: '0.3rem', fontSize: '0.75rem', fontWeight: 600, border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', color: '#374151' }}>– Out</button>
                    <button className="touch-action-btn" onClick={() => { setModalItem(item); setIsItemModalOpen(true); }} style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', color: '#6b7280' }}>
                      <MoreHorizontal size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
            Showing <strong style={{ color: '#374151' }}>{totalItems === 0 ? 0 : skip + 1}</strong> – <strong style={{ color: '#374151' }}>{Math.min(skip + take, totalItems)}</strong> of <strong style={{ color: '#374151' }}>{totalItems}</strong> items
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', height: '30px', borderRadius: '6px' }}
              disabled={skip === 0} onClick={() => setSkip(s => Math.max(0, s - take))}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: '0.78rem', minWidth: '60px', textAlign: 'center', color: '#6b7280' }}>
              Page {Math.floor(skip / take) + 1} of {Math.max(1, Math.ceil(totalItems / take))}
            </span>
            <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', height: '30px', borderRadius: '6px' }}
              disabled={skip + take >= totalItems} onClick={() => setSkip(s => s + take)}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <QRModal isOpen={isQrModalOpen} onClose={() => setQrModalOpen(false)} items={qrItems} />
      <ItemModal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} item={modalItem} onSaved={() => fetchItems({ search, skip: skip.toString(), take: take.toString() })} />

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            padding: '1.75rem',
            width: '100%',
            maxWidth: '380px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            {/* Icon */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                backgroundColor: '#fee2e2',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ fontSize: '1.5rem' }}>🗑️</span>
              </div>
            </div>
            {/* Text */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a2e', marginBottom: '0.4rem' }}>
                Delete Item
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5 }}>
                Are you sure you want to delete{' '}
                <strong style={{ color: '#1a1a2e' }}>{deleteConfirmName}</strong>?
                <br />This action cannot be undone.
              </div>
            </div>
            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => { setDeleteConfirmId(null); setDeleteConfirmName(''); }}
                style={{
                  flex: 1, padding: '0.6rem',
                  border: '1.5px solid #ef4444',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  color: '#ef4444',
                  fontWeight: 600, fontSize: '0.875rem',
                  cursor: 'pointer', fontFamily: 'inherit'
                }}
              >
                No, Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  flex: 1, padding: '0.6rem',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  fontWeight: 600, fontSize: '0.875rem',
                  cursor: 'pointer', fontFamily: 'inherit'
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            padding: '1.75rem',
            width: '100%',
            maxWidth: '380px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            {/* Icon */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                backgroundColor: '#fee2e2',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ fontSize: '1.5rem' }}>🗑️</span>
              </div>
            </div>
            {/* Text */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a2e', marginBottom: '0.4rem' }}>
                Bulk Delete Items
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5 }}>
                Are you sure you want to delete <strong style={{ color: '#1a1a2e' }}>{selectedIds.size}</strong> selected items?
                <br />This action cannot be undone.
              </div>
            </div>
            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setBulkDeleteConfirm(false)}
                style={{
                  flex: 1, padding: '0.6rem',
                  border: '1.5px solid #ef4444',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  color: '#ef4444',
                  fontWeight: 600, fontSize: '0.875rem',
                  cursor: 'pointer', fontFamily: 'inherit'
                }}
              >
                No, Cancel
              </button>
              <button
                onClick={confirmBulkDelete}
                style={{
                  flex: 1, padding: '0.6rem',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  fontWeight: 600, fontSize: '0.875rem',
                  cursor: 'pointer', fontFamily: 'inherit'
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
