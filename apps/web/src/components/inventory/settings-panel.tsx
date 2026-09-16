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
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* Header */}
      <Card className="rounded-2xl border border-slate-200/90 dark:border-border/80 shadow-xs bg-card">
        <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-sidebar/10 text-sidebar dark:text-blue-400 border border-sidebar/20 flex items-center justify-center shrink-0">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold font-headline text-lg text-foreground tracking-tight">
                Checklist &amp; Inspection Templates
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Customize standard verification steps required during equipment checkout and return workflows.
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-10 px-5 rounded-xl bg-sidebar hover:bg-sidebar/90 text-white font-bold text-xs sm:text-sm shadow-xs cursor-pointer flex items-center gap-2 shrink-0 transition-all"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </CardContent>
      </Card>

      {successMsg && (
        <div className="p-3.5 text-xs sm:text-sm bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2.5 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Grid of Checklist Configurations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Checkout Checklist */}
        <Card className="rounded-2xl border border-slate-200/90 dark:border-border/80 shadow-xs bg-card overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-5 border-b border-slate-200/70 dark:border-border/60 bg-slate-50/70 dark:bg-muted/30">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-sidebar/10 text-sidebar dark:text-blue-400 flex items-center justify-center shrink-0 border border-sidebar/20">
                  <FileCheck className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Checkout Checklist Items
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Steps verified before handing equipment to workers
                  </CardDescription>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sidebar/10 text-sidebar dark:text-blue-400 border border-sidebar/20 shrink-0">
                {checkoutTemplate?.items.length || 0} items
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              {(!checkoutTemplate?.items || checkoutTemplate.items.length === 0) ? (
                <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                  No checkout checklist items yet. Add one below.
                </div>
              ) : (
                checkoutTemplate.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 sm:px-4 rounded-xl border border-slate-200/80 dark:border-border/60 bg-slate-50/50 dark:bg-muted/20 flex items-center justify-between gap-3 hover:border-sidebar/40 hover:bg-slate-50/90 transition-all group shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-sidebar/10 text-sidebar dark:text-blue-400 font-bold text-[11px] flex items-center justify-center shrink-0 border border-sidebar/20">
                        {idx + 1}
                      </div>
                      <span className="font-semibold text-xs sm:text-sm text-foreground truncate">
                        {item.label}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      onClick={() => removeCheckoutItem(item.id)}
                      title="Delete Item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add item */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-200/60 dark:border-border/40">
              <Input
                placeholder="New checkout checklist item..."
                value={newCheckoutItem}
                onChange={(e) => setNewCheckoutItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCheckoutItem())}
                className="h-10 text-xs sm:text-sm rounded-xl border-slate-200/80 dark:border-border/60 focus:ring-2 focus:ring-primary/30 flex-1"
              />
              <Button
                type="button"
                onClick={addCheckoutItem}
                className="h-10 px-4 rounded-xl bg-sidebar hover:bg-sidebar/90 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Return Checklist */}
        <Card className="rounded-2xl border border-slate-200/90 dark:border-border/80 shadow-xs bg-card overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-5 border-b border-slate-200/70 dark:border-border/60 bg-slate-50/70 dark:bg-muted/30">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <FileCheck className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Return Inspection Checklist
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Inspection criteria checked when equipment is returned
                  </CardDescription>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                {returnTemplate?.items.length || 0} items
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              {(!returnTemplate?.items || returnTemplate.items.length === 0) ? (
                <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                  No return inspection items yet. Add one below.
                </div>
              ) : (
                returnTemplate.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 sm:px-4 rounded-xl border border-slate-200/80 dark:border-border/60 bg-slate-50/50 dark:bg-muted/20 flex items-center justify-between gap-3 hover:border-sidebar/40 hover:bg-slate-50/90 transition-all group shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center justify-center shrink-0 border border-emerald-500/20">
                        {idx + 1}
                      </div>
                      <span className="font-semibold text-xs sm:text-sm text-foreground truncate">
                        {item.label}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      onClick={() => removeReturnItem(item.id)}
                      title="Delete Item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add item */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-200/60 dark:border-border/40">
              <Input
                placeholder="New return inspection item..."
                value={newReturnItem}
                onChange={(e) => setNewReturnItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addReturnItem())}
                className="h-10 text-xs sm:text-sm rounded-xl border-slate-200/80 dark:border-border/60 focus:ring-2 focus:ring-primary/30 flex-1"
              />
              <Button
                type="button"
                onClick={addReturnItem}
                className="h-10 px-4 rounded-xl bg-sidebar hover:bg-sidebar/90 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
