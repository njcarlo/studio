"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@studio/ui";
import {
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetClose,
} from "@studio/ui";
import { Label } from "@studio/ui";
import { Input } from "@studio/ui";
import { Checkbox } from "@studio/ui";
import { Textarea } from "@studio/ui";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@studio/ui";
import { PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { upsertAssistanceConfig, type AssistanceConfigItemInput } from "@/actions/venue-assistance";

interface Room {
    id: string;
    name: string;
    area?: { name: string; branch?: { name: string } } | null;
}

interface Ministry {
    id: string;
    name: string;
}

interface ConfigItem {
    id?: string;
    name: string;
    description: string;
    quantity: number;
    isRequired: boolean;
}

interface AssistanceConfigFormProps {
    /** Existing config being edited, or null for create */
    existingConfig?: {
        id: string;
        roomId: string;
        ministryId: string;
        items: ConfigItem[];
    } | null;
    rooms: Room[];
    ministries: Ministry[];
    actorId: string;
    /** If set, lock the room selector to this value */
    lockedRoomId?: string;
    /** If set, lock the ministry selector to this value */
    lockedMinistryId?: string;
    onSuccess: () => void;
    onClose: () => void;
}

const emptyItem = (): ConfigItem => ({
    name: "",
    description: "",
    quantity: 1,
    isRequired: true,
});

export function AssistanceConfigForm({
    existingConfig,
    rooms,
    ministries,
    actorId,
    lockedRoomId,
    lockedMinistryId,
    onSuccess,
    onClose,
}: AssistanceConfigFormProps) {
    const { toast } = useToast();
    const [roomId, setRoomId] = useState(existingConfig?.roomId ?? lockedRoomId ?? "");
    const [ministryId, setMinistryId] = useState(existingConfig?.ministryId ?? lockedMinistryId ?? "");
    const [items, setItems] = useState<ConfigItem[]>(
        existingConfig?.items?.length
            ? existingConfig.items.map((i) => ({
                  id: i.id,
                  name: i.name,
                  description: i.description ?? "",
                  quantity: i.quantity,
                  isRequired: i.isRequired,
              }))
            : [emptyItem()]
    );
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (existingConfig) {
            setRoomId(existingConfig.roomId);
            setMinistryId(existingConfig.ministryId);
            setItems(
                existingConfig.items.length
                    ? existingConfig.items.map((i) => ({
                          id: i.id,
                          name: i.name,
                          description: i.description ?? "",
                          quantity: i.quantity,
                          isRequired: i.isRequired,
                      }))
                    : [emptyItem()]
            );
        }
    }, [existingConfig]);

    const addItem = () => setItems((prev) => [...prev, emptyItem()]);

    const removeItem = (index: number) =>
        setItems((prev) => prev.filter((_, i) => i !== index));

    const updateItem = (index: number, patch: Partial<ConfigItem>) =>
        setItems((prev) =>
            prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
        );

    const handleSubmit = async () => {
        if (!roomId) {
            toast({ variant: "destructive", title: "Room required", description: "Please select a room." });
            return;
        }
        if (!ministryId) {
            toast({ variant: "destructive", title: "Ministry required", description: "Please select a ministry." });
            return;
        }
        const validItems = items.filter((i) => i.name.trim());
        if (validItems.length === 0) {
            toast({ variant: "destructive", title: "Items required", description: "Add at least one assistance item." });
            return;
        }

        setIsSaving(true);
        try {
            const payload: AssistanceConfigItemInput[] = validItems.map((i) => ({
                name: i.name.trim(),
                description: i.description.trim() || undefined,
                quantity: i.quantity,
                isRequired: i.isRequired,
            }));
            await upsertAssistanceConfig(roomId, ministryId, payload, actorId);
            toast({ title: existingConfig ? "Configuration updated" : "Configuration created" });
            onSuccess();
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Save failed",
                description: err?.message ?? "Could not save configuration.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const isRoomLocked = !!lockedRoomId || !!existingConfig;
    const isMinistryLocked = !!lockedMinistryId || !!existingConfig;

    return (
        <>
            <SheetHeader>
                <SheetTitle className="font-headline">
                    {existingConfig ? "Edit Assistance Configuration" : "New Assistance Configuration"}
                </SheetTitle>
                <SheetDescription>
                    Configure which items a ministry provides for a room.
                </SheetDescription>
            </SheetHeader>

            <div className="py-4 space-y-5 overflow-y-auto max-h-[calc(100vh-220px)]">
                {/* Room selector */}
                <div className="space-y-2">
                    <Label htmlFor="config-room">Room</Label>
                    <Select
                        value={roomId}
                        onValueChange={setRoomId}
                        disabled={isRoomLocked}
                    >
                        <SelectTrigger id="config-room">
                            <SelectValue placeholder="Select a room" />
                        </SelectTrigger>
                        <SelectContent>
                            {rooms.map((r) => (
                                <SelectItem key={r.id} value={r.id}>
                                    {r.name}
                                    {r.area ? ` — ${r.area.name}` : ""}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Ministry selector */}
                <div className="space-y-2">
                    <Label htmlFor="config-ministry">Ministry</Label>
                    <Select
                        value={ministryId}
                        onValueChange={setMinistryId}
                        disabled={isMinistryLocked}
                    >
                        <SelectTrigger id="config-ministry">
                            <SelectValue placeholder="Select a ministry" />
                        </SelectTrigger>
                        <SelectContent>
                            {ministries.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                    {m.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Items list */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label>Assistance Items</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addItem}>
                            <PlusCircle className="mr-1 h-4 w-4" /> Add Item
                        </Button>
                    </div>

                    {items.map((item, index) => (
                        <div
                            key={index}
                            className="rounded-lg border p-3 space-y-3 bg-muted/30"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">
                                    Item {index + 1}
                                </span>
                                {items.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                        onClick={() => removeItem(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor={`item-name-${index}`} className="text-xs">
                                    Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id={`item-name-${index}`}
                                    value={item.name}
                                    onChange={(e) => updateItem(index, { name: e.target.value })}
                                    placeholder="e.g., Projector"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor={`item-desc-${index}`} className="text-xs">
                                    Description
                                </Label>
                                <Textarea
                                    id={`item-desc-${index}`}
                                    value={item.description}
                                    onChange={(e) => updateItem(index, { description: e.target.value })}
                                    placeholder="Optional details"
                                    className="h-16 resize-none"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="space-y-1 flex-1">
                                    <Label htmlFor={`item-qty-${index}`} className="text-xs">
                                        Quantity
                                    </Label>
                                    <Input
                                        id={`item-qty-${index}`}
                                        type="number"
                                        min={1}
                                        value={item.quantity}
                                        onChange={(e) =>
                                            updateItem(index, {
                                                quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                                            })
                                        }
                                        className="w-24"
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-4">
                                    <Checkbox
                                        id={`item-required-${index}`}
                                        checked={item.isRequired}
                                        onCheckedChange={(checked) =>
                                            updateItem(index, { isRequired: !!checked })
                                        }
                                    />
                                    <Label htmlFor={`item-required-${index}`} className="text-xs font-normal">
                                        Required
                                    </Label>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <SheetFooter className="pt-2">
                <SheetClose asChild>
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                </SheetClose>
                <Button onClick={handleSubmit} disabled={isSaving}>
                    {isSaving ? "Saving…" : existingConfig ? "Save Changes" : "Create"}
                </Button>
            </SheetFooter>
        </>
    );
}
