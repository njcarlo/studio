"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@studio/ui";
import { Button } from "@studio/ui";
import { Textarea } from "@studio/ui";
import { Inbox, Check, X, LoaderCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { toJsDate } from "@/lib/utils";
import { getMyC2SJoinRequestsAction } from "@/actions/c2s";
import { decideApprovalStage } from "@/actions/db";
import type { MentorJoinRequest } from "@/services/c2s";
import type { GroupWithMentees } from "./types";

const JoinRequestRow = ({ request }: { request: MentorJoinRequest }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const decide = useMutation({
    mutationFn: async (decision: "approve" | "reject") => {
      if (!request.stageId) throw new Error("This request can no longer be actioned.");
      const res = await decideApprovalStage(
        request.stageId,
        decision,
        decision === "reject" ? reason.trim() : undefined,
      );
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (_data, decision) => {
      toast({ title: decision === "approve" ? "Join request approved" : "Join request rejected" });
      queryClient.invalidateQueries({ queryKey: ["my-c2s-join-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-c2s-group"] });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Could not process request", description: err.message });
    },
  });

  return (
    <div className="rounded-lg border border-border/50 p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">{request.requesterName}</p>
          <p className="text-xs text-muted-foreground">{request.requesterEmail}</p>
          {request.requesterPhone && (
            <p className="text-xs text-muted-foreground">{request.requesterPhone}</p>
          )}
          <p className="text-[11px] text-muted-foreground mt-1">
            Requested {toJsDate(request.createdAt).toLocaleDateString()}
          </p>
        </div>
        {!rejecting && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => decide.mutate("approve")}
              disabled={decide.isPending}
            >
              {decide.isPending ? (
                <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="mr-1.5 h-3.5 w-3.5" />
              )}
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => setRejecting(true)} disabled={decide.isPending}>
              <X className="mr-1.5 h-3.5 w-3.5" /> Reject
            </Button>
          </div>
        )}
      </div>
      {request.message && (
        <p className="text-sm text-muted-foreground bg-muted/30 rounded-md p-2">{request.message}</p>
      )}
      {rejecting && (
        <div className="space-y-2">
          <Textarea
            placeholder="Reason for rejecting (required)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setRejecting(false)} disabled={decide.isPending}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => decide.mutate("reject")}
              disabled={decide.isPending || !reason.trim()}
            >
              {decide.isPending ? <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Confirm Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const JoinRequestsCard = ({ group }: { group: GroupWithMentees }) => {
  const { data: requests, isLoading } = useQuery({
    queryKey: ["my-c2s-join-requests"],
    queryFn: async () => {
      const res = await getMyC2SJoinRequestsAction();
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  const groupRequests = (requests ?? []).filter((r) => r.groupId === group.id);

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Inbox className="h-5 w-5 text-primary" /> Join Requests
          {groupRequests.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">({groupRequests.length})</span>
          )}
        </CardTitle>
        <CardDescription>People who have asked to join this group.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : groupRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No pending join requests.</p>
        ) : (
          <div className="space-y-3">
            {groupRequests.map((request) => (
              <JoinRequestRow key={request.workflowId} request={request} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
