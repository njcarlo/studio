"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Save, CheckCircle2, FileCheck } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Label,
  Checkbox,
} from '@studio/ui';

interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
}

interface ChecklistTemplate {
  id: string;
  name: string;
  type: 'checkout' | 'return';
  items: ChecklistItem[];
}

export function SettingsPanel() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // New item inputs
  const [newCheckoutItem, setNewCheckoutItem] = useState('');
  const [newReturnItem, setNewReturnItem] = useState('');

  useEffect(() => {
    fetch('/api/checklist-templates')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTemplates(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await fetch('/api/checklist-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates }),
      });
      if (!res.ok) throw new Error('Failed to save templates');
      setSuccessMsg('Checklist verification templates saved successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addCheckoutItem = () => {
    if (!newCheckoutItem.trim()) return;
    setTemplates((prev) =>
      prev.map((t) =>
        t.type === 'checkout'
          ? {
              ...t,
              items: [
                ...t.items,
                { id: `chk-${Date.now()}`, label: newCheckoutItem.trim(), required: false },
              ],
            }
          : t
      )
    );
    setNewCheckoutItem('');
  };

  const removeCheckoutItem = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.type === 'checkout'
          ? { ...t, items: t.items.filter((i) => i.id !== id) }
          : t
      )
    );
  };

  const addReturnItem = () => {
    if (!newReturnItem.trim()) return;
    setTemplates((prev) =>
      prev.map((t) =>
        t.type === 'return'
          ? {
              ...t,
              items: [
                ...t.items,
                { id: `ret-${Date.now()}`, label: newReturnItem.trim(), required: false },
              ],
            }
          : t
      )
    );
    setNewReturnItem('');
  };

  const removeReturnItem = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.type === 'return'
          ? { ...t, items: t.items.filter((i) => i.id !== id) }
          : t
      )
    );
  };

  const checkoutTemplate = templates.find((t) => t.type === 'checkout');
  const returnTemplate = templates.find((t) => t.type === 'return');

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-muted-foreground">
        Loading inventory settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <Card className="shadow-sm border">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base">Checklist & Inspection Templates</h3>
            <p className="text-xs text-muted-foreground">
              Customize standard verification steps required during equipment checkout and return workflows.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2 shadow">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </CardContent>
      </Card>

      {successMsg && (
        <div className="p-3 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid of Checklist Configurations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Checkout Checklist */}
        <Card className="shadow-sm border">
          <CardHeader className="p-5 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold">Checkout Checklist Items</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Steps verified before handing equipment to workers
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              {checkoutTemplate?.items.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg border bg-card flex items-center justify-between gap-2 text-xs"
                >
                  <span className="font-medium text-foreground">{item.label}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                    onClick={() => removeCheckoutItem(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add item */}
            <div className="flex gap-2 pt-2">
              <Input
                placeholder="New checkout checklist item..."
                value={newCheckoutItem}
                onChange={(e) => setNewCheckoutItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCheckoutItem())}
                className="h-9 text-xs"
              />
              <Button size="sm" variant="outline" onClick={addCheckoutItem} className="h-9">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Return Checklist */}
        <Card className="shadow-sm border">
          <CardHeader className="p-5 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-sm font-bold">Return Inspection Checklist</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Inspection criteria checked when equipment is returned
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              {returnTemplate?.items.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg border bg-card flex items-center justify-between gap-2 text-xs"
                >
                  <span className="font-medium text-foreground">{item.label}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                    onClick={() => removeReturnItem(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add item */}
            <div className="flex gap-2 pt-2">
              <Input
                placeholder="New return inspection item..."
                value={newReturnItem}
                onChange={(e) => setNewReturnItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addReturnItem())}
                className="h-9 text-xs"
              />
              <Button size="sm" variant="outline" onClick={addReturnItem} className="h-9">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
