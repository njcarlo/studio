"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Layers, Folder, Box, Mic, Video, Lightbulb, Music, Laptop, Armchair, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Label } from '@studio/ui';
import { useInventory, type InventoryCategory } from '@/hooks/use-inventory';

const AVAILABLE_ICONS = [
  { name: 'box', icon: Box, label: 'Box / Supply' },
  { name: 'mic', icon: Mic, label: 'Audio / Mic' },
  { name: 'video', icon: Video, label: 'Video / Screen' },
  { name: 'lightbulb', icon: Lightbulb, label: 'Lighting' },
  { name: 'music', icon: Music, label: 'Music' },
  { name: 'laptop', icon: Laptop, label: 'IT / Computer' },
  { name: 'armchair', icon: Armchair, label: 'Furniture' },
  { name: 'folder', icon: Folder, label: 'Folder' },
];

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#64748b', // slate
  '#ef4444', // red
];

export function CategoriesPanel() {
  const { categories, fetchCategories, loading } = useInventory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [icon, setIcon] = useState('box');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openAdd = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setColor('#3b82f6');
    setIcon('box');
    setError('');
    setIsModalOpen(true);
  };

  const openEdit = (cat: InventoryCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setColor(cat.color || '#3b82f6');
    setIcon(cat.icon || 'box');
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description, color, icon }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update category');
        }
      } else {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description, color, icon }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create category');
        }
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Are you sure you want to delete category "${catName}"?`)) return;

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete category');
      }
      fetchCategories();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const renderIcon = (iconName?: string) => {
    const found = AVAILABLE_ICONS.find((i) => i.name === iconName);
    const Comp = found ? found.icon : Folder;
    return <Comp className="h-5 w-5" />;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="shadow-sm border">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">Inventory Categories</h3>
            <p className="text-xs text-muted-foreground">
              Organize and classify equipment and consumables across ministries and teams.
            </p>
          </div>
          <Button size="sm" className="gap-1.5 shadow" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </CardContent>
      </Card>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <Card key={cat.id} className="shadow-sm border hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: cat.color || '#3b82f6' }}
            />
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between gap-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: `${cat.color || '#3b82f6'}15`,
                    color: cat.color || '#3b82f6',
                    borderColor: `${cat.color || '#3b82f6'}30`,
                  }}
                >
                  {renderIcon(cat.icon)}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => openEdit(cat)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(cat.id, cat.name)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <CardTitle className="text-sm font-bold mt-2">{cat.name}</CardTitle>
              {cat.description && (
                <CardDescription className="text-xs line-clamp-2">
                  {cat.description}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="p-4 pt-2 border-t mt-3 bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
              <span>Items Tracked</span>
              <span className="font-bold text-foreground">{cat.itemCount || 0}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
            <DialogDescription>
              Define the category label, theme color, and icon.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            {error && (
              <div className="p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Category Name *</Label>
              <Input
                required
                placeholder="e.g. Sound & Acoustics"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Description</Label>
              <Input
                placeholder="Microphones, PA systems, cables"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Icon Picker */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Icon</Label>
              <div className="grid grid-cols-4 gap-2">
                {AVAILABLE_ICONS.map((ic) => {
                  const IconComp = ic.icon;
                  const isSelected = icon === ic.name;
                  return (
                    <button
                      key={ic.name}
                      type="button"
                      onClick={() => setIcon(ic.name)}
                      className={`p-2 rounded-lg border text-xs flex flex-col items-center gap-1 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                          : 'hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <IconComp className="h-4 w-4" />
                      <span className="text-[10px] truncate max-w-full">{ic.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Picker */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Theme Color</Label>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      color === c ? 'scale-110 border-foreground shadow' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
