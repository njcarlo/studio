"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@studio/ui";
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  Legend,
} from "recharts";
import { BarChart3, LoaderCircle } from "lucide-react";
import { toJsDate } from "@/lib/utils";
import { getC2SSessionsForGroupAction } from "@/actions/c2s";
import type { GroupWithMentees } from "./types";

export const GroupAnalyticsCard = ({ group }: { group: GroupWithMentees }) => {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["c2s-sessions", group.id],
    queryFn: async () => {
      const res = await getC2SSessionsForGroupAction(group.id);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  const statusData = [
    {
      name: "In Progress",
      value: group.mentees.filter((m) => m.status === "In Progress").length,
      color: "#f59e0b",
    },
    {
      name: "Completed",
      value: group.mentees.filter((m) => m.status === "Completed").length,
      color: "#10b981",
    },
    {
      name: "Dropped",
      value: group.mentees.filter((m) => m.status === "Dropped").length,
      color: "#ef4444",
    },
  ].filter((d) => d.value > 0);

  const attendanceData = (sessions ?? [])
    .slice()
    .sort((a, b) => toJsDate(a.date).getTime() - toJsDate(b.date).getTime())
    .map((s) => ({
      date: toJsDate(s.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      rate:
        s.attendance.length > 0
          ? Math.round((s.attendance.filter((a) => a.present).length / s.attendance.length) * 100)
          : 0,
    }));

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> Analytics
        </CardTitle>
        <CardDescription>Mentee progress and session attendance for this group.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-[260px]">
              <p className="text-sm font-medium mb-2">Mentee Status</p>
              {statusData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No mentees yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={statusData} innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value">
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ReTooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </RePieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="h-[260px]">
              <p className="text-sm font-medium mb-2">Attendance Rate by Session</p>
              {attendanceData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData}>
                    <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                    <ReTooltip
                      cursor={{ fill: "rgba(0,0,0,0.05)" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                      formatter={(value: number) => [`${value}%`, "Attendance"]}
                    />
                    <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
