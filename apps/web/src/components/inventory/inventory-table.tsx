"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  QrCode,
  ScanBarcode,
  Download,
  Upload,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Package,
  Layers,
  ArrowUpCircle,
  ArrowDownCircle,
  Pencil,
  Trash2,
  RefreshCw,
  Clock,
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Button,
  Input,
  Badge,
  Checkbox,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@studio/ui';
import { useInventory, type InventoryItem } from '@/hooks/use-inventory';
import { QRModal } from './qr-modal';
import { ItemModal } from './item-modal';
import { StockScanModal } from './stock-scan-modal';
import Papa from 'papaparse';

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'Good Condition': 'outline',
  'In Stock': 'outline',
  'Low Stock': 'secondary',
  'Out of Stock': 'destructive',
  'Under Maintenance': 'secondary',
  'Damaged': 'destructive',
  'Borrowed': 'secondary',
};

export function InventoryTable({ onScanClick }: { onScanClick?: () => void }) {
  const {
    items,
    totalItems,
    loading,
    categories,
    locations,
    fetchItems,
    fetchCategories,
    fetchLocations,
    deleteItem,
    updateStock,
    bulkDeleteItems,
    bulkUpdateItems,
    bulkImportItems,
  } = useInventory();

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [skip, setSkip] = useState(0);
  const take = 12;

  // Selected items for bulk operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState<InventoryItem | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrItems, setQrItems] = useState<InventoryItem[]>([]);
  const [isFastScanOpen, setIsFastScanOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const loadData = useCallback(() => {
    const params: any = {
      skip: String(skip),
      take: String(take),
    };
    if (search.trim()) params.search = search.trim();
    if (selectedCategory) params.categoryId = selectedCategory;
    if (selectedStatus) params.status = selectedStatus;
    if (selectedType) params.type = selectedType;
    if (selectedLocation) params.location = selectedLocation;

    fetchItems(params);
  }, [skip, take, search, selectedCategory, selectedStatus, selectedType, selectedLocation, fetchItems]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    fetchCategories();
    fetchLocations();
  }, [fetchCategories, fetchLocations]);

  // Debounced search reset page
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setSkip(0);
  };

  // Selection
  const handleSelectAll = (e: boolean) => {
    if (e) {
      setSelectedIds(new Set(items.map((i) => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Stock Quick Actions
  const handleQuickStock = async (id: string, action: 'Stock In' | 'Stock Out') => {
    try {
      await updateStock(id, action, 1);
    } catch (err: any) {
      alert(err.message || 'Failed to update stock');
    }
  };

  // Single Delete
  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteItem(deleteConfirmId);
      setDeleteConfirmId(null);
      setDeleteConfirmName('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete item');
    }
  };

  // Bulk Delete
  const confirmBulkDelete = async () => {
    try {
      await bulkDeleteItems(Array.from(selectedIds));
      setSelectedIds(new Set());
      setBulkDeleteConfirm(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete items');
    }
  };

  // Bulk Status Update
  const handleBulkStatusChange = async (status: string) => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUpdateItems(Array.from(selectedIds), { status });
      setSelectedIds(new Set());
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // QR batch print for selected
  const handleBatchQR = () => {
    const selectedItems = items.filter((i) => selectedIds.has(i.id));
    if (selectedItems.length === 0) return;
    setQrItems(selectedItems);
    setIsQrModalOpen(true);
  };

  // Single QR
  const handleSingleQR = (item: InventoryItem) => {
    setQrItems([item]);
    setIsQrModalOpen(true);
  };

  // Export CSV
  const handleExportCSV = () => {
    const exportData = items.map((i) => ({
      'Item Name': i.name,
      'Inventory Code': i.inventoryCode || '',
      Category: i.category?.name || '',
      Type: i.type,
      Stock: i.stock,
      'Min Stock': i.minStock,
      Unit: i.unit,
      Status: i.status,
      Location: i.location || '',
      Aisle: i.aisle || '',
      Shelf: i.shelf || '',
      Bin: i.bin || '',
      'Assigned To': i.assignedTo || '',
      'Next Maintenance': i.nextMaintenanceDate ? new Date(i.nextMaintenanceDate).toISOString().split('T')[0] : '',
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Import CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          await bulkImportItems(results.data);
          alert(`Successfully imported ${results.data.length} items!`);
          loadData();
        } catch (err: any) {
          alert('Import failed: ' + err.message);
        }
      },
    });
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <Card className="shadow-sm border">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, barcode, location, worker..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-9 text-sm bg-background"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setIsFastScanOpen(true)}
              >
                <ScanBarcode className="h-4 w-4 text-primary" />
                Scan to Action
              </Button>

              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild className="gap-1.5 pointer-events-none">
                  <span>
                    <Upload className="h-4 w-4" />
                    Import CSV
                  </span>
                </Button>
                <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
              </label>

              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCSV}>
                <Download className="h-4 w-4" />
                Export
              </Button>

              <Button
                size="sm"
                className="gap-1.5 shadow"
                onClick={() => {
                  setModalItem(null);
                  setIsItemModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
              <Filter className="h-3.5 w-3.5" />
              <span className="font-semibold uppercase tracking-wider text-[10px]">Filter:</span>
            </div>

            {/* Category Filter */}
            <select
              className="h-8 rounded-lg border border-input bg-background px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSkip(0);
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              className="h-8 rounded-lg border border-input bg-background px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setSkip(0);
              }}
            >
              <option value="">All Statuses</option>
              <option value="Good Condition">Good Condition</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Damaged">Damaged</option>
              <option value="Borrowed">Borrowed</option>
            </select>

            {/* Type Filter */}
            <select
              className="h-8 rounded-lg border border-input bg-background px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setSkip(0);
              }}
            >
              <option value="">All Types</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="CONSUMABLE">Consumable</option>
            </select>

            {/* Location Filter */}
            {locations.length > 0 && (
              <select
                className="h-8 rounded-lg border border-input bg-background px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setSkip(0);
                }}
              >
                <option value="">All Locations</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
            )}

            {(search || selectedCategory || selectedStatus || selectedType || selectedLocation) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('');
                  setSelectedStatus('');
                  setSelectedType('');
                  setSelectedLocation('');
                  setSkip(0);
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between flex-wrap gap-3 animate-in fade-in">
          <div className="text-sm font-semibold flex items-center gap-2">
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-bold">
              {selectedIds.size}
            </span>
            <span>item(s) selected</span>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={handleBatchQR}>
              <QrCode className="h-3.5 w-3.5" />
              Batch QR Print
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="text-xs h-8">
                  Update Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkStatusChange('Good Condition')}>
                  Mark Good Condition
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusChange('Under Maintenance')}>
                  Mark Under Maintenance
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusChange('Damaged')}>
                  Mark Damaged
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5 text-xs h-8"
              onClick={() => setBulkDeleteConfirm(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Items Table */}
      <Card className="shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={items.length > 0 && selectedIds.size === items.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Code & Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Stock Level</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-sm">Loading inventory items...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="h-10 w-10 text-muted-foreground/40" />
                      <span className="text-base font-semibold">No inventory items found</span>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {search || selectedCategory || selectedStatus
                          ? 'Try clearing your search query or filters to find items.'
                          : 'Get started by clicking "+ Add Item" or importing a CSV file.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  const isLow = item.stock <= (item.minStock > 0 ? item.minStock : 5) && item.stock > 0;
                  const isOut = item.stock === 0;

                  return (
                    <TableRow key={item.id} className={isSelected ? 'bg-primary/5' : ''}>
                      <TableCell>
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(item.id)} />
                      </TableCell>
                      <TableCell>
                        <div className="w-10 h-10 rounded-lg bg-muted border overflow-hidden flex items-center justify-center shrink-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground/50" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-bold text-sm leading-tight hover:underline cursor-pointer" onClick={() => { setModalItem(item); setIsItemModalOpen(true); }}>
                            {item.name}
                          </div>
                          <div className="text-[11px] font-mono text-muted-foreground mt-0.5 flex items-center gap-2">
                            <span>{item.inventoryCode || item.id.slice(0, 8).toUpperCase()}</span>
                            {item.isKit && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200">
                                Bundle / Kit
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium px-2 py-1 rounded-md bg-muted text-muted-foreground">
                          {item.category?.name || 'General'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {item.type === 'CONSUMABLE' ? 'Consumable' : 'Equipment'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`font-extrabold text-sm ${
                              isOut ? 'text-destructive' : isLow ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
                            }`}
                          >
                            {item.stock} <span className="text-[10px] font-normal text-muted-foreground">{item.unit || 'pcs'}</span>
                          </span>
                          {item.minStock > 0 && (
                            <span className="text-[10px] text-muted-foreground">Min: {item.minStock}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {item.location || '—'}
                          {(item.aisle || item.shelf || item.bin) && (
                            <div className="text-[10px] font-mono text-muted-foreground/80">
                              {[item.aisle && `A:${item.aisle}`, item.shelf && `S:${item.shelf}`, item.bin && `B:${item.bin}`]
                                .filter(Boolean)
                                .join(' ')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === 'Out of Stock' || item.status === 'Damaged'
                              ? 'destructive'
                              : item.status === 'Low Stock' || item.status === 'Under Maintenance' || item.status === 'Borrowed'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="text-[11px] font-medium"
                        >
                          {item.status || 'Good Condition'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick + / - Stock */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            title="Quick Stock In (+1)"
                            onClick={() => handleQuickStock(item.id, 'Stock In')}
                          >
                            <ArrowUpCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                            title="Quick Stock Out (-1)"
                            disabled={item.stock <= 0}
                            onClick={() => handleQuickStock(item.id, 'Stock Out')}
                          >
                            <ArrowDownCircle className="h-4 w-4" />
                          </Button>

                          {/* Print QR */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="View / Print QR Code"
                            onClick={() => handleSingleQR(item)}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>

                          {/* Edit / More Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setModalItem(item);
                                  setIsItemModalOpen(true);
                                }}
                              >
                                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSingleQR(item)}>
                                <QrCode className="mr-2 h-3.5 w-3.5" /> Print QR Label
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setDeleteConfirmId(item.id);
                                  setDeleteConfirmName(item.name);
                                }}
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Item
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
          <div>
            Showing <strong className="text-foreground">{totalItems === 0 ? 0 : skip + 1}</strong> –{' '}
            <strong className="text-foreground">{Math.min(skip + take, totalItems)}</strong> of{' '}
            <strong className="text-foreground">{totalItems}</strong> items
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              disabled={skip === 0}
              onClick={() => setSkip((s) => Math.max(0, s - take))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 font-medium">
              Page {Math.floor(skip / take) + 1} of {Math.max(1, Math.ceil(totalItems / take))}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              disabled={skip + take >= totalItems}
              onClick={() => setSkip((s) => s + take)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* QR Modal */}
      <QRModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} items={qrItems} />

      {/* Item Modal */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        item={modalItem}
        onSaved={loadData}
      />

      {/* Fast Scan Modal */}
      {isFastScanOpen && (
        <StockScanModal
          isOpen={isFastScanOpen}
          onClose={() => setIsFastScanOpen(false)}
          onStockUpdated={loadData}
        />
      )}

      {/* Single Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">Delete Item</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Are you sure you want to delete <strong>{deleteConfirmName}</strong>? This action will remove all associated logs and cannot be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setDeleteConfirmId(null);
                  setDeleteConfirmName('');
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">Bulk Delete</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Are you sure you want to permanently delete <strong>{selectedIds.size}</strong> selected items?
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setBulkDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1" onClick={confirmBulkDelete}>
                Delete All
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
