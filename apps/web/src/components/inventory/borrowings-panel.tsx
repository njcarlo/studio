"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  QrCode,
  Calendar,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  FileCheck2,
  Image as ImageIcon,
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
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Label,
  Checkbox,
} from '@studio/ui';
import { useInventory, type InventoryBorrowing } from '@/hooks/use-inventory';
import { useWorkers } from '@/hooks/use-workers';
import { QRModal } from './qr-modal';

export function BorrowingsPanel() {
  const { borrowings, totalBorrowings, loading, fetchBorrowings, items, fetchItems } = useInventory();
  const { workers } = useWorkers({ limit: 99999 });

  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [skip, setSkip] = useState(0);
  const take = 10;

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItemId, setCheckoutItemId] = useState('');
  const [checkoutWorkerId, setCheckoutWorkerId] = useState('');
  const [checkoutDueDate, setCheckoutDueDate] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [checkoutCondition, setCheckoutCondition] = useState('Good Condition');
  const [checkoutChecklist, setCheckoutChecklist] = useState<Record<string, boolean>>({});
  const [submittingCheckout, setSubmittingCheckout] = useState(false);

  // Return Modal State
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [selectedBorrowing, setSelectedBorrowing] = useState<InventoryBorrowing | null>(null);
  const [returnCondition, setReturnCondition] = useState('Good Condition');
  const [returnNotes, setReturnNotes] = useState('');
  const [isDamaged, setIsDamaged] = useState(false);
  const [returnChecklist, setReturnChecklist] = useState<Record<string, boolean>>({});
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Checklist Templates
  const [checklistTemplates, setChecklistTemplates] = useState<any[]>([]);

  // QR Modal
  const [qrItem, setQrItem] = useState<{ id: string; name: string; inventoryCode?: string } | null>(null);

  const loadData = useCallback(() => {
    fetchBorrowings({
      skip: String(skip),
      take: String(take),
      ...(statusFilter && { status: statusFilter }),
    });
  }, [skip, take, statusFilter, fetchBorrowings]);

  useEffect(() => {
    loadData();
    fetchItems({ take: 200 });
  }, [loadData, fetchItems]);

  useEffect(() => {
    fetch('/api/checklist-templates')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setChecklistTemplates(data);
      })
      .catch(() => {});
  }, []);

  const filteredBorrowings = borrowings.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.borrowerName?.toLowerCase().includes(q) ||
      b.item?.name?.toLowerCase().includes(q) ||
      (b.item?.inventoryCode || '').toLowerCase().includes(q)
    );
  });

  const overdueCount = borrowings.filter(
    (b) => b.status === 'BORROWED' && b.dueDate && new Date(b.dueDate) < new Date()
  ).length;

  const checkoutTemplate = checklistTemplates.find((t) => t.type === 'checkout');
  const returnTemplate = checklistTemplates.find((t) => t.type === 'return');

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutItemId || !checkoutWorkerId) {
      alert('Please select both an item and a borrower');
      return;
    }

    const worker = workers?.find((w) => w.id === checkoutWorkerId);
    const workerName = worker ? `${worker.firstName} ${worker.lastName}` : 'Worker';

    setSubmittingCheckout(true);
    try {
      const res = await fetch('/api/borrowings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: checkoutItemId,
          borrowerId: checkoutWorkerId,
          borrowerName: workerName,
          dueDate: checkoutDueDate || null,
          checkoutNotes,
          checkoutCondition,
          checkoutChecklist,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to checkout');
      }

      setIsCheckoutOpen(false);
      setCheckoutItemId('');
      setCheckoutWorkerId('');
      setCheckoutDueDate('');
      setCheckoutNotes('');
      setCheckoutChecklist({});
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingCheckout(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBorrowing) return;

    setSubmittingReturn(true);
    try {
      const res = await fetch(`/api/borrowings/${selectedBorrowing.id}/return`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnNotes,
          returnCondition,
          returnChecklist,
          damaged: isDamaged,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to process return');
      }

      setIsReturnOpen(false);
      setSelectedBorrowing(null);
      setReturnNotes('');
      setIsDamaged(false);
      setReturnChecklist({});
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingReturn(false);
    }
  };

  const openReturnModal = (b: InventoryBorrowing) => {
    setSelectedBorrowing(b);
    setReturnCondition('Good Condition');
    setReturnNotes('');
    setIsDamaged(false);
    setReturnChecklist({});
    setIsReturnOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Overdue Warning Alert Banner */}
      {overdueCount > 0 && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive animate-in fade-in">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm">Overdue Borrowing Alert</h4>
            <p className="text-xs mt-0.5 text-destructive/90">
              There {overdueCount === 1 ? 'is 1 item' : `are ${overdueCount} items`} currently past their scheduled return due date. Please follow up with the assigned workers.
            </p>
          </div>
        </div>
      )}

      {/* Control Header */}
      <Card className="shadow-sm border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search borrower, item name, code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setSkip(0);
                }}
              >
                <option value="">All Statuses</option>
                <option value="BORROWED">Active Borrowed</option>
                <option value="RETURNED">Returned</option>
              </select>

              <Button size="sm" className="gap-1.5 shadow" onClick={() => setIsCheckoutOpen(true)}>
                <Plus className="h-4 w-4" />
                Checkout Item
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Borrowings Table */}
      <Card className="shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Item Details</TableHead>
                <TableHead>Borrower</TableHead>
                <TableHead>Borrowed Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Condition / Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && borrowings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-sm">Loading borrowings...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredBorrowings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="h-8 w-8 text-muted-foreground/40" />
                      <span className="text-sm font-semibold">No borrowing records found</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBorrowings.map((b) => {
                  const isOverdue = b.status === 'BORROWED' && b.dueDate && new Date(b.dueDate) < new Date();

                  return (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-muted border overflow-hidden flex items-center justify-center shrink-0">
                            {b.item?.imageUrl ? (
                              <img src={b.item.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="h-4 w-4 text-muted-foreground/50" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-xs leading-tight">{b.item?.name}</div>
                            <div className="text-[10px] font-mono text-muted-foreground">
                              {b.item?.inventoryCode || b.itemId.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-medium">{b.borrowerName}</div>
                        {b.borrowerEmail && (
                          <div className="text-[10px] text-muted-foreground">{b.borrowerEmail}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {b.borrowedAt ? new Date(b.borrowedAt).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {b.dueDate ? (
                          <span className={isOverdue ? 'text-destructive font-bold' : 'text-muted-foreground'}>
                            {new Date(b.dueDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">No due date</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            b.status === 'RETURNED'
                              ? 'outline'
                              : isOverdue
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-[10px]"
                        >
                          {b.status === 'RETURNED' ? 'Returned' : isOverdue ? 'Overdue' : 'Borrowed'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {b.status === 'RETURNED' ? b.returnNotes || b.returnCondition || 'Returned in good shape' : b.checkoutNotes || b.checkoutCondition || 'Standard checkout'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            title="Print item QR"
                            onClick={() =>
                              setQrItem({
                                id: b.itemId,
                                name: b.item?.name || 'Item',
                                inventoryCode: b.item?.inventoryCode,
                              })
                            }
                          >
                            <QrCode className="h-3.5 w-3.5" />
                          </Button>

                          {b.status === 'BORROWED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 border-emerald-300 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              onClick={() => openReturnModal(b)}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Return
                            </Button>
                          )}
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
        <div className="p-3 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Showing <strong className="text-foreground">{totalBorrowings === 0 ? 0 : skip + 1}</strong> –{' '}
            <strong className="text-foreground">{Math.min(skip + take, totalBorrowings)}</strong> of{' '}
            <strong className="text-foreground">{totalBorrowings}</strong> records
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              disabled={skip === 0}
              onClick={() => setSkip((s) => Math.max(0, s - take))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              disabled={skip + take >= totalBorrowings}
              onClick={() => setSkip((s) => s + take)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Checkout Modal */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-primary" />
              Checkout Equipment
            </DialogTitle>
            <DialogDescription>
              Assign equipment or a kit bundle to a registered church worker.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCheckoutSubmit} className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Select Equipment / Bundle *</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={checkoutItemId}
                onChange={(e) => setCheckoutItemId(e.target.value)}
                required
              >
                <option value="">Select Item...</option>
                {items
                  .filter((i) => i.type === 'EQUIPMENT' && i.stock > 0)
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.stock} avail) {i.isKit ? '— [BUNDLE KIT]' : ''}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Borrower (Worker) *</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={checkoutWorkerId}
                onChange={(e) => setCheckoutWorkerId(e.target.value)}
                required
              >
                <option value="">Select Worker...</option>
                {workers
                  ?.filter((w) => w.status === 'Active')
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.firstName} {w.lastName} ({w.employmentType || 'Worker'})
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Expected Return Date</Label>
              <Input
                type="date"
                value={checkoutDueDate}
                onChange={(e) => setCheckoutDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Condition at Checkout</Label>
              <Input
                value={checkoutCondition}
                onChange={(e) => setCheckoutCondition(e.target.value)}
                placeholder="e.g. Good Condition, fully tested"
              />
            </div>

            {/* Checklist items */}
            {checkoutTemplate?.items && checkoutTemplate.items.length > 0 && (
              <div className="space-y-2 p-3 bg-muted/20 border rounded-xl">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Checkout Verification Checklist
                </Label>
                <div className="space-y-1.5">
                  {checkoutTemplate.items.map((item: any) => (
                    <label key={item.id} className="flex items-center gap-2 cursor-pointer text-xs">
                      <Checkbox
                        checked={checkoutChecklist[item.id] || false}
                        onCheckedChange={(c) =>
                          setCheckoutChecklist({ ...checkoutChecklist, [item.id]: Boolean(c) })
                        }
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Notes / Purpose</Label>
              <Input
                value={checkoutNotes}
                onChange={(e) => setCheckoutNotes(e.target.value)}
                placeholder="e.g. Sunday 2nd Service Audio setup"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCheckoutOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submittingCheckout}>
                {submittingCheckout ? 'Processing...' : 'Confirm Checkout'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Return Modal */}
      <Dialog open={isReturnOpen} onOpenChange={setIsReturnOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-emerald-600" />
              Return Equipment
            </DialogTitle>
            <DialogDescription>
              Verify condition and check in returned items back to inventory.
            </DialogDescription>
          </DialogHeader>

          {selectedBorrowing && (
            <form onSubmit={handleReturnSubmit} className="space-y-3.5 py-2">
              <div className="p-3 bg-muted/30 border rounded-xl space-y-1 text-xs">
                <div className="font-bold text-sm text-foreground">{selectedBorrowing.item?.name}</div>
                <div className="text-muted-foreground">
                  Borrowed by: <strong>{selectedBorrowing.borrowerName}</strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Return Condition</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                >
                  <option value="Good Condition">Good Condition</option>
                  <option value="Minor Wear">Minor Wear (Functional)</option>
                  <option value="Damaged">Damaged / Needs Repair</option>
                </select>
              </div>

              {/* Checklist items */}
              {returnTemplate?.items && returnTemplate.items.length > 0 && (
                <div className="space-y-2 p-3 bg-muted/20 border rounded-xl">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Return Inspection Checklist
                  </Label>
                  <div className="space-y-1.5">
                    {returnTemplate.items.map((item: any) => (
                      <label key={item.id} className="flex items-center gap-2 cursor-pointer text-xs">
                        <Checkbox
                          checked={returnChecklist[item.id] || false}
                          onCheckedChange={(c) =>
                            setReturnChecklist({ ...returnChecklist, [item.id]: Boolean(c) })
                          }
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Inspection Notes</Label>
                <Input
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="e.g. Returned clean, battery at 80%"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium pt-1">
                <Checkbox
                  checked={isDamaged}
                  onCheckedChange={(c) => setIsDamaged(Boolean(c))}
                />
                <span className="text-destructive font-semibold">Flag as Damaged (Prevents future checkouts)</span>
              </label>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsReturnOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingReturn} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {submittingReturn ? 'Processing...' : 'Complete Return'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Modal */}
      {qrItem && (
        <QRModal
          isOpen={Boolean(qrItem)}
          onClose={() => setQrItem(null)}
          item={qrItem}
        />
      )}
    </div>
  );
}
