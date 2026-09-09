"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Checkbox,
} from '@studio/ui';
import { Package, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useInventory, type InventoryItem } from '@/hooks/use-inventory';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: InventoryItem | null;
  onSaved?: () => void;
}

export function ItemModal({ isOpen, onClose, item, onSaved }: ItemModalProps) {
  const { categories, locations, fetchCategories, fetchLocations, createItem, updateItem } = useInventory();

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    type: 'EQUIPMENT',
    stock: 0,
    minStock: 0,
    unit: 'pcs',
    status: 'Good Condition',
    statusDetails: '',
    location: '',
    inventoryCode: '',
    imageUrl: '',
    isKit: false,
    isApprovalRequired: false,
    nextMaintenanceDate: '',
    aisle: '',
    shelf: '',
    bin: '',
    assignedTo: '',
    parentId: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchLocations();
    }
  }, [isOpen, fetchCategories, fetchLocations]);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        categoryId: item.categoryId || (categories[0]?.id ?? ''),
        type: item.type || 'EQUIPMENT',
        stock: item.stock ?? item.quantity ?? 0,
        minStock: item.minStock ?? item.minQuantity ?? 0,
        unit: item.unit || 'pcs',
        status: item.status || 'Good Condition',
        statusDetails: item.statusDetails || '',
        location: item.location || '',
        inventoryCode: item.inventoryCode || '',
        imageUrl: item.imageUrl || '',
        isKit: item.isKit || item.group === 'Kit' || false,
        isApprovalRequired: item.isApprovalRequired || false,
        nextMaintenanceDate: item.nextMaintenanceDate
          ? new Date(item.nextMaintenanceDate).toISOString().split('T')[0]
          : '',
        aisle: item.aisle || '',
        shelf: item.shelf || '',
        bin: item.bin || '',
        assignedTo: item.assignedTo || '',
        parentId: item.parentId || '',
      });
    } else {
      setFormData({
        name: '',
        categoryId: categories[0]?.id || '',
        type: 'EQUIPMENT',
        stock: 0,
        minStock: 0,
        unit: 'pcs',
        status: 'Good Condition',
        statusDetails: '',
        location: '',
        inventoryCode: '',
        imageUrl: '',
        isKit: false,
        isApprovalRequired: false,
        nextMaintenanceDate: '',
        aisle: '',
        shelf: '',
        bin: '',
        assignedTo: '',
        parentId: '',
      });
    }
    setError('');
  }, [item, isOpen, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Item name is required');
      return;
    }
    if (!formData.categoryId) {
      setError('Please select a category');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (item?.id) {
        await updateItem(item.id, formData);
      } else {
        await createItem(formData);
      }
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {item ? 'Edit Inventory Item' : 'Add New Item'}
          </DialogTitle>
          <DialogDescription>
            {item ? 'Update item details, location, and maintenance status.' : 'Register a new equipment or consumable record into inventory.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-lg">
              {error}
            </div>
          )}

          {/* Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Item Name *</Label>
              <Input
                required
                placeholder="e.g. Shure SM58 Microphone"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Inventory Code / Barcode</Label>
              <Input
                placeholder="Auto-generated if empty"
                value={formData.inventoryCode}
                onChange={(e) => setFormData({ ...formData, inventoryCode: e.target.value })}
              />
            </div>
          </div>

          {/* Category & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Category *</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                required
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Type</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              >
                <option value="EQUIPMENT">Equipment (Tracked & Borrowable)</option>
                <option value="CONSUMABLE">Consumable (Stock tracked only)</option>
              </select>
            </div>
          </div>

          {/* Stock, Min Stock & Unit */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Current Stock</Label>
              <Input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Min Stock Alert</Label>
              <Input
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Unit</Label>
              <Input
                placeholder="pcs, box, roll"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
          </div>

          {/* Status & Maintenance Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Status</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Good Condition">Good Condition</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Damaged">Damaged</option>
                <option value="Borrowed">Borrowed</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Next Maintenance (PMS)</Label>
              <Input
                type="date"
                value={formData.nextMaintenanceDate}
                onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value })}
              />
            </div>
          </div>

          {/* Location details */}
          <div className="space-y-2 border rounded-xl p-3 bg-muted/20">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Location & Placement</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px]">Location Area / Room</Label>
                <Input
                  placeholder="e.g. 4th Floor Studio"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  list="locations-list"
                />
                <datalist id="locations-list">
                  {locations.map((l) => (
                    <option key={l.id} value={l.name} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Assigned Worker / Person</Label>
                <Input
                  placeholder="e.g. Tech Head"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="space-y-1">
                <Label className="text-[11px]">Aisle</Label>
                <Input
                  placeholder="A-1"
                  value={formData.aisle}
                  onChange={(e) => setFormData({ ...formData, aisle: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Shelf</Label>
                <Input
                  placeholder="S-2"
                  value={formData.shelf}
                  onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Bin</Label>
                <Input
                  placeholder="B-04"
                  value={formData.bin}
                  onChange={(e) => setFormData({ ...formData, bin: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Image URL & Bundle/Kit Flag */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Image URL (Optional)</Label>
            <Input
              placeholder="https://..."
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
              <Checkbox
                checked={formData.isKit}
                onCheckedChange={(c) => setFormData({ ...formData, isKit: Boolean(c) })}
              />
              <span>Is Kit / Bundle (Autocheckout child items together)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
              <Checkbox
                checked={formData.isApprovalRequired}
                onCheckedChange={(c) => setFormData({ ...formData, isApprovalRequired: Boolean(c) })}
              />
              <span>Requires Approval Before Borrowing</span>
            </label>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : item ? (
                'Update Item'
              ) : (
                'Add Item'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
