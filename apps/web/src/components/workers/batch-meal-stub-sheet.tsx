"use client";

import React, { useState } from "react";
import { Button } from "@studio/ui";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@studio/ui";
import { Label } from "@studio/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@studio/ui";

interface BatchMealStubSheetProps {
  selectedCount: number;
  onSave: (type: "weekday" | "sunday", count: number) => void;
  onClose: () => void;
}

export function BatchMealStubSheet({
  selectedCount,
  onSave,
  onClose,
}: BatchMealStubSheetProps) {
  const [type, setType] = useState<"weekday" | "sunday">("weekday");
  const [count, setCount] = useState(1);

  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-headline">Batch Issue Meal Stubs</SheetTitle>
        <SheetDescription>Issue meal stubs to {selectedCount} selected worker(s).</SheetDescription>
      </SheetHeader>
      <div className="py-4 space-y-4">
        <div className="space-y-2">
          <Label>Stub Type</Label>
          <Select value={type} onValueChange={(v: any) => setType(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weekday">Weekday Stub</SelectItem>
              <SelectItem value="sunday">Sunday Stub</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Count per Worker</Label>
          <Select value={count.toString()} onValueChange={(v) => setCount(parseInt(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={n.toString()}>{n} stub(s)</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1 text-amber-600">
            ⚠️ This will respect weekly limits (5 weekdays, 2 Sunday). Workers already at limit will be skipped.
          </p>
        </div>
      </div>
      <SheetFooter>
        <SheetClose asChild>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </SheetClose>
        <Button onClick={() => onSave(type, count)}>Issue Stubs</Button>
      </SheetFooter>
    </>
  );
}
