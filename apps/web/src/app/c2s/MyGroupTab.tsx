"use client";

import { useQuery } from "@tanstack/react-query";
import { LoaderCircle, Users } from "lucide-react";
import { getMyC2SGroup } from "@/actions/c2s";
import { GroupProfileCard } from "./my-group/components/GroupProfileCard";
import { JoinRequestsCard } from "./my-group/components/JoinRequestsCard";
import { GroupMenteesCard } from "./my-group/components/GroupMenteesCard";
import { GroupSessionsCard } from "./my-group/components/GroupSessionsCard";
import { GroupAnalyticsCard } from "./my-group/components/GroupAnalyticsCard";
import type { GroupWithMentees } from "./my-group/components/types";

export default function MyGroupTab() {
  const { data: groups, isLoading } = useQuery({
    queryKey: ["my-c2s-group"],
    queryFn: async () => {
      const res = await getMyC2SGroup();
      if (!res.success) throw new Error(res.error);
      return res.data as GroupWithMentees[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-2xl bg-muted/5">
        <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium">No group assigned</h3>
        <p className="text-muted-foreground">
          You haven't been assigned as a mentor for any Connect 2 Souls group yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.id} className="space-y-6">
          <GroupProfileCard group={group} />
          <JoinRequestsCard group={group} />
          <GroupMenteesCard group={group} />
          <GroupSessionsCard group={group} />
          <GroupAnalyticsCard group={group} />
        </div>
      ))}
    </div>
  );
}
