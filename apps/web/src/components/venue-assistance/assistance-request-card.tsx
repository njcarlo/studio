"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@studio/ui";
import { Badge } from "@studio/ui";
import { Button } from "@studio/ui";
import { Separator } from "@studio/ui";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { AssistanceResponseDialog } from "./assistance-response-dialog";

// ---------------------------------------------------------------------------
// Types (inferred from Prisma includes used in getAssistanceRequestsForBooking)
// ---------------------------------------------------------------------------

interface AssistanceRequestItem {
    id: string;
    name: string;
    description?: string | null;
    quantity: number;
    isRequired: boolean;
    status: string;
    adjustedQty?: number | null;
    adjustedDesc?: string | null;
}

export interface AssistanceRequest {
    id: string;
    ministryId: string;
    status: string;
    explanation?: string | null;
    respondedAt?: Date | string | null;
    respondedBy?: string | null;
    items: AssistanceRequestItem[];
}

interface AssistanceRequestCardProps {
    request: AssistanceRequest;
    ministryName?: string;
    /** When true, shows the "Respond" button */
    canRespond?: boolean;
    onRespond?: (requestId: string) => void;
    /** The current user's worker profile ID (needed to submit a response) */
    responderId?: string;
    /** bookingId for cache invalidation */
    bookingId?: string;
    /** recurringBookingId to enable bulk-apply toggle */
    recurringBookingId?: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requestStatusVariant(
    status: string,
): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
        case "Approved":
            return "default";
        case "Partial":
            return "secondary";
        case "Declined":
            return "destructive";
        case "In_Progress":
            return "default";
        case "Fulfilled":
            return "secondary";
        case "Cancelled":
            return "destructive";
        case "Pending":
        default:
            return "outline";
    }
}

function requestStatusLabel(status: string): string {
    if (status === "In_Progress") return "In Progress";
    return status;
}

function itemStatusIcon(status: string) {
    switch (status) {
        case "Approved":
            return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
        case "Declined":
            return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
        case "Pending":
        default:
            return <Clock className="h-4 w-4 text-muted-foreground shrink-0" />;
    }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AssistanceRequestCard({
    request,
    ministryName,
    canRespond = false,
    onRespond,
    responderId,
    bookingId,
    recurringBookingId,
}: AssistanceRequestCardProps) {
    const displayName = ministryName ?? request.ministryId;
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <>
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-base">{displayName}</CardTitle>
                    <div className="flex items-center gap-2">
                        <Badge variant={requestStatusVariant(request.status)}>
                            {requestStatusLabel(request.status)}
                        </Badge>
                        {canRespond && request.status === "Pending" && (
                            <Button
                                size="sm"
                                onClick={() => {
                                    if (responderId && bookingId) {
                                        setDialogOpen(true);
                                    } else {
                                        onRespond?.(request.id);
                                    }
                                }}
                            >
                                Respond
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {/* Item list */}
                {request.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No items configured.</p>
                ) : (
                    <ul className="space-y-2">
                        {request.items.map((item) => (
                            <li key={item.id} className="flex items-start gap-2 text-sm">
                                {itemStatusIcon(item.status)}
                                <div className="min-w-0 flex-1">
                                    <span className="font-medium">{item.name}</span>
                                    {item.isRequired && (
                                        <span className="ml-1 text-xs text-muted-foreground">
                                            (required)
                                        </span>
                                    )}
                                    {(item.adjustedQty != null || item.adjustedDesc) ? (
                                        <p className="text-muted-foreground mt-0.5">
                                            {item.adjustedDesc ?? item.description}
                                            {item.adjustedQty != null && (
                                                <span className="ml-1">× {item.adjustedQty}</span>
                                            )}
                                        </p>
                                    ) : (
                                        <>
                                            {item.description && (
                                                <p className="text-muted-foreground mt-0.5">
                                                    {item.description}
                                                </p>
                                            )}
                                            <p className="text-muted-foreground mt-0.5">
                                                Qty: {item.quantity}
                                            </p>
                                        </>
                                    )}
                                </div>
                                <Badge
                                    variant={
                                        item.status === "Approved"
                                            ? "default"
                                            : item.status === "Declined"
                                            ? "destructive"
                                            : "outline"
                                    }
                                    className="text-xs shrink-0"
                                >
                                    {item.status}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Explanation */}
                {request.explanation && (
                    <>
                        <Separator />
                        <div className="flex items-start gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-muted-foreground">{request.explanation}</p>
                        </div>
                    </>
                )}

                {/* Responded timestamp */}
                {request.respondedAt && (
                    <p className="text-xs text-muted-foreground">
                        Responded{" "}
                        {new Date(request.respondedAt).toLocaleString()}
                    </p>
                )}
            </CardContent>
        </Card>

        {/* Response dialog — only rendered when responderId and bookingId are provided */}
        {responderId && bookingId && (
            <AssistanceResponseDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                request={request}
                responderId={responderId}
                bookingId={bookingId}
                recurringBookingId={recurringBookingId}
            />
        )}
    </>
    );
}
