"use client";

import React, { useState } from "react";
import { Button, Input, Textarea, Label, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, Checkbox, ScrollArea, Avatar, AvatarImage, AvatarFallback } from "@studio/ui";
import { ArrowDown, ArrowUp, Edit2, GripVertical, Plus, Trash2, Users, Search, X } from "lucide-react";
import { useWorkloadCategories } from "@/hooks/use-workload-categories";
import { useWorkers } from "@/hooks/use-workers";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import type { Ministry, WorkloadCategory, Worker } from "@studio/types";

export const WorkloadCategoriesSection = ({ ministry, members }: { ministry: Ministry, members: Worker[] }) => {
    const { categories, isLoading, createCategory, updateCategory, deleteCategory, reorderCategories } = useWorkloadCategories(ministry.id);
    const { workerProfile, canManageMinistries } = useUserRole();
    const { toast } = useToast();

    const isCategoryManager = canManageMinistries || ministry.headId === workerProfile?.id || ministry.managerId === workerProfile?.id;

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<WorkloadCategory | null>(null);
    const [assigningCategory, setAssigningCategory] = useState<WorkloadCategory | null>(null);

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        if (!categories) return;
        const newCats = [...categories];
        if (direction === 'up' && index > 0) {
            [newCats[index - 1], newCats[index]] = [newCats[index], newCats[index - 1]];
        } else if (direction === 'down' && index < newCats.length - 1) {
            [newCats[index + 1], newCats[index]] = [newCats[index], newCats[index + 1]];
        } else {
            return;
        }

        const orderedIds = newCats.map(c => c.id);
        try {
            await reorderCategories(orderedIds);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to reorder categories." });
        }
    };

    if (isLoading) {
        return <div className="text-sm text-muted-foreground">Loading categories...</div>;
    }

    return (
        <div className="space-y-4 pt-4 border-t mt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold font-headline">Workload Categories</h3>
                    <p className="text-xs text-muted-foreground">Define the capabilities and roles specific to this ministry.</p>
                </div>
                {isCategoryManager && !isFormOpen && (
                    <Button size="sm" variant="outline" onClick={() => setIsFormOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Add Category
                    </Button>
                )}
            </div>

            {isFormOpen && (
                <WorkloadCategoryForm 
                    category={editingCategory}
                    onSubmit={async (data) => {
                        try {
                            if (editingCategory) {
                                await updateCategory({ id: editingCategory.id, data });
                                toast({ title: "Category updated" });
                            } else {
                                await createCategory(data);
                                toast({ title: "Category created" });
                            }
                            setIsFormOpen(false);
                            setEditingCategory(null);
                        } catch (error: any) {
                            toast({ variant: "destructive", title: "Error", description: error.message || "Failed to save category." });
                        }
                    }}
                    onCancel={() => {
                        setIsFormOpen(false);
                        setEditingCategory(null);
                    }}
                />
            )}

            {!isFormOpen && (
                <div className="space-y-2">
                    {categories?.length === 0 ? (
                        <div className="text-sm text-muted-foreground italic bg-muted/30 p-4 rounded-md text-center">
                            No workload categories defined.
                        </div>
                    ) : (
                        categories?.map((category, index) => (
                            <WorkloadCategoryRow
                                key={category.id}
                                category={category}
                                members={members}
                                index={index}
                                isFirst={index === 0}
                                isLast={index === categories.length - 1}
                                isCategoryManager={isCategoryManager}
                                onMove={handleMove}
                                onAssign={() => setAssigningCategory(category)}
                                onEdit={() => {
                                    setEditingCategory(category);
                                    setIsFormOpen(true);
                                }}
                                onDelete={async () => {
                                    try {
                                        await deleteCategory(category.id);
                                        toast({ title: "Category deleted" });
                                    } catch (error: any) {
                                        toast({ variant: "destructive", title: "Error", description: "Failed to delete category." });
                                    }
                                }}
                            />
                        ))
                    )}
                </div>
            )}

            <Sheet open={!!assigningCategory} onOpenChange={(open) => !open && setAssigningCategory(null)}>
                <SheetContent side="right" className="sm:max-w-[400px]">
                    {assigningCategory && (
                        <AssignWorkersSheet 
                            category={assigningCategory}
                            members={members}
                            onClose={() => setAssigningCategory(null)}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
};

const WorkloadCategoryRow = ({ 
    category, 
    members,
    index, 
    isFirst, 
    isLast, 
    isCategoryManager, 
    onMove, 
    onAssign,
    onEdit, 
    onDelete 
}: { 
    category: WorkloadCategory; 
    members: Worker[];
    index: number; 
    isFirst: boolean; 
    isLast: boolean; 
    isCategoryManager: boolean; 
    onMove: (index: number, direction: 'up'|'down') => void;
    onAssign: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) => {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const assignedCount = members.filter(m => m.capabilities?.includes(category.id)).length;

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-md bg-card/50 gap-3">
            <div className="flex items-start sm:items-center gap-3 overflow-hidden">
                {isCategoryManager && (
                    <div className="flex flex-col shrink-0">
                        <Button variant="ghost" size="icon" className="h-5 w-5 rounded-sm" disabled={isFirst} onClick={() => onMove(index, 'up')}>
                            <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5 rounded-sm" disabled={isLast} onClick={() => onMove(index, 'down')}>
                            <ArrowDown className="h-3 w-3" />
                        </Button>
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate flex items-center gap-2">
                        {category.name}
                        {assignedCount > 0 && (
                            <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                {assignedCount} {assignedCount === 1 ? 'Worker' : 'Workers'}
                            </span>
                        )}
                    </p>
                    {category.description && (
                        <p className="text-xs text-muted-foreground truncate">{category.description}</p>
                    )}
                </div>
            </div>
            {isCategoryManager && (
                <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                    <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={onAssign}>
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">Assign</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={onEdit}>
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the "{category.name}" category? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                            onClick={() => {
                                onDelete();
                                setIsDeleteDialogOpen(false);
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

const WorkloadCategoryForm = ({ 
    category, 
    onSubmit, 
    onCancel 
}: { 
    category: WorkloadCategory | null; 
    onSubmit: (data: { name: string; description: string }) => Promise<void>; 
    onCancel: () => void;
}) => {
    const [name, setName] = useState(category?.name || '');
    const [description, setDescription] = useState(category?.description || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit({ name, description });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="border rounded-md p-4 bg-muted/20 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="category-name">Name <span className="text-destructive">*</span></Label>
                <Input 
                    id="category-name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="e.g. Guitar, Usher, Sound Tech" 
                    required 
                    autoFocus
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="category-desc">Description (Optional)</Label>
                <Textarea 
                    id="category-desc" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Brief details about this category..." 
                    maxLength={255}
                    className="h-20"
                />
                <p className="text-[10px] text-muted-foreground text-right">{description.length}/255</p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" size="sm" disabled={!name.trim() || isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Category'}
                </Button>
            </div>
        </form>
    );
};

const AssignWorkersSheet = ({ 
    category, 
    members, 
    onClose 
}: { 
    category: WorkloadCategory, 
    members: Worker[], 
    onClose: () => void 
}) => {
    const { updateWorker } = useWorkers({});
    const { toast } = useToast();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(
        members.filter(m => m.capabilities?.includes(category.id)).map(m => m.id)
    ));
    const [isSaving, setIsSaving] = useState(false);

    const toggleWorker = (workerId: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(workerId)) {
                next.delete(workerId);
            } else {
                next.add(workerId);
            }
            return next;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const toAdd = members.filter(m => selectedIds.has(m.id) && !m.capabilities?.includes(category.id));
            const toRemove = members.filter(m => !selectedIds.has(m.id) && m.capabilities?.includes(category.id));

            const updates = [];
            for (const m of toAdd) {
                updates.push(updateWorker({ id: m.id, data: { capabilities: [...(m.capabilities || []), category.id] } }));
            }
            for (const m of toRemove) {
                updates.push(updateWorker({ id: m.id, data: { capabilities: (m.capabilities || []).filter(c => c !== category.id) } }));
            }

            await Promise.all(updates);
            toast({ title: "Workers assigned to category successfully." });
            onClose();
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update workers." });
        } finally {
            setIsSaving(false);
        }
    };

    const [search, setSearch] = useState('');

    const assignedMembers = members.filter(m => selectedIds.has(m.id));
    const availableMembers = members.filter(m => !selectedIds.has(m.id) && (
        m.firstName.toLowerCase().includes(search.toLowerCase()) ||
        m.lastName.toLowerCase().includes(search.toLowerCase()) ||
        m.roleId?.toLowerCase().includes(search.toLowerCase())
    ));

    return (
        <div className="flex flex-col h-full">
            <SheetHeader className="pb-4">
                <SheetTitle>Assign Workers</SheetTitle>
                <div className="text-sm text-muted-foreground">
                    Assign members to the <span className="font-semibold text-foreground">{category.name}</span> category.
                </div>
            </SheetHeader>

            <div className="px-6 pb-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search members to add..." 
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-6 py-4">
                    {/* Assigned Members */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                            Currently Assigned ({assignedMembers.length})
                        </h4>
                        <div className="space-y-2">
                            {assignedMembers.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">No members assigned yet.</p>
                            ) : (
                                assignedMembers.map(member => (
                                    <div key={member.id} className="flex items-center justify-between p-2 rounded-md border bg-card">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <Avatar className="h-8 w-8 shrink-0">
                                                <AvatarImage src={member.avatarUrl} />
                                                <AvatarFallback className="text-[10px]">{member.firstName[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{member.firstName} {member.lastName}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">{member.roleId}</p>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-7 px-2 text-destructive hover:bg-destructive/10 shrink-0"
                                            onClick={() => toggleWorker(member.id)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Available Members */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                            Available Members
                        </h4>
                        <div className="space-y-2">
                            {availableMembers.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">
                                    {search ? "No matches found." : "All members are assigned."}
                                </p>
                            ) : (
                                availableMembers.slice(0, 20).map(member => (
                                    <div key={member.id} className="flex items-center justify-between p-2 rounded-md border border-dashed hover:border-solid hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <Avatar className="h-8 w-8 shrink-0 opacity-80">
                                                <AvatarImage src={member.avatarUrl} />
                                                <AvatarFallback className="text-[10px]">{member.firstName[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{member.firstName} {member.lastName}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">{member.roleId}</p>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="secondary" 
                                            size="sm" 
                                            className="h-7 px-3 shrink-0"
                                            onClick={() => toggleWorker(member.id)}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                ))
                            )}
                            {availableMembers.length > 20 && (
                                <p className="text-xs text-center text-muted-foreground pt-2">
                                    +{availableMembers.length - 20} more. Use search to find specific members.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </ScrollArea>

            <SheetFooter className="pt-4 mt-auto">
                <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Assignments"}
                </Button>
            </SheetFooter>
        </div>
    );
};
