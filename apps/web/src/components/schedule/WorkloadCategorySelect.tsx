"use client";

import React, { useState } from "react";
import { Input, Button, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@studio/ui";
import { Plus, LoaderCircle } from "lucide-react";
import { useWorkloadCategories } from "@/hooks/use-workload-categories";
import { useToast } from "@/hooks/use-toast";

export interface WorkloadCategorySelectProps {
    ministryId: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const WorkloadCategorySelect: React.FC<WorkloadCategorySelectProps> = ({
    ministryId,
    value,
    onChange,
    placeholder,
    className,
    onKeyDown
}) => {
    const { categories, isLoading, createCategory } = useWorkloadCategories(ministryId);
    const { toast } = useToast();
    
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // If still loading and we have a ministryId, show a disabled input as a skeleton
    if (isLoading && ministryId) {
        return (
            <Input 
                value="Loading..." 
                disabled 
                className={className} 
            />
        );
    }

    const handleCreateRole = async () => {
        if (!newRoleName.trim() || !ministryId) return;
        setIsSaving(true);
        try {
            await createCategory({ name: newRoleName.trim() });
            onChange(newRoleName.trim());
            setIsCreateOpen(false);
            setNewRoleName("");
            toast({ title: "Role created successfully" });
        } catch (e: any) {
            toast({ variant: "destructive", title: "Failed to create role", description: e.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleValueChange = (v: string) => {
        if (v === "__ADD_NEW__") {
            setNewRoleName("");
            setIsCreateOpen(true);
        } else {
            onChange(v);
        }
    };

    // If the currently typed value is NOT in the list (from legacy templates),
    // ensure it displays correctly. We can just add it to the list temporarily.
    const displayCategories = [...categories];
    if (value && !categories.some((c: any) => c.name === value) && value !== "__ADD_NEW__") {
        displayCategories.push({ id: 'temp-' + value, name: value, ministryId } as any);
    }

    return (
        <>
            <Select value={value || ""} onValueChange={handleValueChange}>
                <SelectTrigger className={className} onKeyDown={e => onKeyDown?.(e as any)}>
                    <SelectValue placeholder={placeholder || "Select a role..."} />
                </SelectTrigger>
                <SelectContent>
                    {displayCategories.map(cat => (
                        <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                        </SelectItem>
                    ))}
                    {ministryId && (
                        <SelectItem value="__ADD_NEW__" className="text-primary font-medium focus:bg-primary/10 cursor-pointer">
                            <div className="flex items-center gap-2">
                                <Plus className="h-4 w-4" /> Add New Role
                            </div>
                        </SelectItem>
                    )}
                </SelectContent>
            </Select>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Role</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label>Role Name</Label>
                        <Input 
                            value={newRoleName} 
                            onChange={(e) => setNewRoleName(e.target.value)} 
                            placeholder="e.g. Stage Manager" 
                            autoFocus
                            onKeyDown={e => {
                                if (e.key === "Enter") handleCreateRole();
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateRole} disabled={isSaving || !newRoleName.trim()}>
                            {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Create Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
