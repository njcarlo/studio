"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Label, Badge } from "@studio/ui";
import { LoaderCircle, X, CalendarOff } from "lucide-react";
import { useMyAvailability } from "@/hooks/use-availability";
import { useToast } from "@/hooks/use-toast";

const DAYS = [
    { value: 0, label: "Sun" },
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
];

export function AvailabilityCard() {
    const { toast } = useToast();
    const { isLoading, recurringDays, oneTimeBlocks, setRecurringDays, addOneTimeBlock, removeBlock } = useMyAvailability();
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [savingDays, setSavingDays] = useState(false);
    const [blockDate, setBlockDate] = useState("");
    const [blockNote, setBlockNote] = useState("");
    const [addingBlock, setAddingBlock] = useState(false);

    useEffect(() => {
        setSelectedDays(recurringDays);
    }, [recurringDays]);

    const toggleDay = (day: number) => {
        setSelectedDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
    };

    const saveDays = async (days: number[]) => {
        setSavingDays(true);
        try {
            await setRecurringDays(days);
            toast({ title: "Availability updated" });
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setSavingDays(false);
        }
    };

    const handleToggleDay = (day: number) => {
        const next = selectedDays.includes(day) ? selectedDays.filter((d) => d !== day) : [...selectedDays, day];
        setSelectedDays(next);
        saveDays(next);
    };

    const handleAddBlock = async () => {
        if (!blockDate) return;
        setAddingBlock(true);
        try {
            await addOneTimeBlock({ date: new Date(blockDate), note: blockNote || undefined });
            setBlockDate("");
            setBlockNote("");
            toast({ title: "Unavailable date added" });
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setAddingBlock(false);
        }
    };

    const handleRemoveBlock = async (id: string) => {
        try {
            await removeBlock(id);
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Availability</CardTitle>
                <CardDescription>
                    Let schedulers know when you're not available. This won't block an assignment, but it'll be flagged when they assign you.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {isLoading ? (
                    <div className="flex justify-center py-4">
                        <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            <Label>I'm never available on:</Label>
                            <div className="flex flex-wrap gap-2">
                                {DAYS.map((d) => (
                                    <Button
                                        key={d.value}
                                        type="button"
                                        size="sm"
                                        variant={selectedDays.includes(d.value) ? "default" : "outline"}
                                        disabled={savingDays}
                                        onClick={() => handleToggleDay(d.value)}
                                    >
                                        {d.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>One-off unavailable dates</Label>
                            <div className="flex flex-wrap items-end gap-2">
                                <Input
                                    type="date"
                                    value={blockDate}
                                    onChange={(e) => setBlockDate(e.target.value)}
                                    className="w-auto"
                                />
                                <Input
                                    placeholder="Note (optional)"
                                    value={blockNote}
                                    onChange={(e) => setBlockNote(e.target.value)}
                                    className="w-48"
                                />
                                <Button size="sm" onClick={handleAddBlock} disabled={!blockDate || addingBlock}>
                                    Add
                                </Button>
                            </div>
                            {oneTimeBlocks.length > 0 && (
                                <div className="flex flex-col gap-1 pt-1">
                                    {oneTimeBlocks.map((b: any) => (
                                        <div key={b.id} className="flex items-center gap-2 text-sm">
                                            <Badge variant="outline" className="gap-1">
                                                <CalendarOff className="h-3 w-3" />
                                                {format(new Date(b.date), "MMM d, yyyy")}
                                            </Badge>
                                            {b.note && <span className="text-muted-foreground">{b.note}</span>}
                                            <button
                                                type="button"
                                                className="text-muted-foreground hover:text-destructive"
                                                onClick={() => handleRemoveBlock(b.id)}
                                                aria-label="Remove"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
