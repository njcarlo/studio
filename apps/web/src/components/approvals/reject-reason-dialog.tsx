"use client";

import React, { useState } from "react";
import { Button } from "@studio/ui";
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogDescription } from "@studio/ui";
import { Textarea } from "@studio/ui";

interface RejectReasonDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string) => void;
    isSubmitting?: boolean;
}

export function RejectReasonDialog({ open, onOpenChange, onConfirm, isSubmitting }: RejectReasonDialogProps) {
    const [reason, setReason] = useState("");

    const handleConfirm = () => {
        if (!reason.trim()) return;
        onConfirm(reason.trim());
        setReason("");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogTitle>Reason for rejection</DialogTitle>
                <DialogDescription>
                    This will be shown to the requester so they can address it and resubmit.
                </DialogDescription>
                <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain why this request is being rejected..."
                    rows={4}
                />
                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={!reason.trim() || isSubmitting}
                    >
                        Reject Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
