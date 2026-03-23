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
import { Input } from "@studio/ui";
import { Textarea } from "@studio/ui";

interface ImportSheetProps {
  onImport: (csvData: string) => void;
  onClose: () => void;
}

export function ImportSheet({ onImport, onClose }: ImportSheetProps) {
  const [csvData, setCsvData] = useState("");
  const csvFormat =
    "firstName,lastName,email,phone,roleId,status,primaryMinistryId,secondaryMinistryId,employmentType";

  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-headline">Import Workers</SheetTitle>
        <SheetDescription>
          Paste CSV data below to bulk-import workers. The first line must be a header row.
        </SheetDescription>
      </SheetHeader>
      <div className="py-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="csv-format">Required CSV Format</Label>
          <Input id="csv-format" readOnly defaultValue={csvFormat} className="font-mono text-xs" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="csv-data">CSV Data</Label>
          <Textarea
            id="csv-data"
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            placeholder="Paste your CSV content here..."
            className="h-64 font-mono text-xs"
          />
        </div>
      </div>
      <SheetFooter>
        <SheetClose asChild>
          <Button type="button" variant="secondary">Cancel</Button>
        </SheetClose>
        <Button onClick={() => onImport(csvData)}>Process Import</Button>
      </SheetFooter>
    </>
  );
}
