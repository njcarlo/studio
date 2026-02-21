"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useUserRole } from "@/hooks/use-user-role";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { format } from "date-fns";
import { LoaderCircle, Search, ShieldAlert } from "lucide-react";

export default function TransactionLogsPage() {
    const { isSuperAdmin, isLoading: isRoleLoading } = useUserRole();
    const firestore = useFirestore();

    const [searchTerm, setSearchTerm] = useState("");

    const logsQuery = React.useMemo(() => {
        if (!firestore || !isSuperAdmin) return null;
        return query(collection(firestore, "transaction_logs"), orderBy("timestamp", "desc"), limit(200));
    }, [firestore, isSuperAdmin]);

    const { data: logs, isLoading: isLogsLoading } = useCollection<any>(logsQuery);

    const filteredLogs = React.useMemo(() => {
        if (!logs) return [];
        if (!searchTerm) return logs;
        const lower = searchTerm.toLowerCase();
        return logs.filter((log: any) =>
            (log.userName || '').toLowerCase().includes(lower) ||
            (log.action || '').toLowerCase().includes(lower) ||
            (log.module || '').toLowerCase().includes(lower) ||
            (log.details || '').toLowerCase().includes(lower)
        );
    }, [logs, searchTerm]);

    if (isRoleLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center py-10">
                    <LoaderCircle className="h-8 w-8 animate-spin" />
                </div>
            </AppLayout>
        );
    }

    if (!isSuperAdmin) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                    <ShieldAlert className="h-16 w-16 text-destructive opacity-80" />
                    <h2 className="text-2xl font-bold font-headline">Access Denied</h2>
                    <p className="text-muted-foreground w-full max-w-sm">
                        You do not have the required permissions to view transaction logs. This area is restricted to Super Administrators only.
                    </p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight font-headline">Transaction Logs</h1>
                    <p className="text-muted-foreground">Monitor system-wide actions and events.</p>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b border-border/50">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>A chronological record of user transactions.</CardDescription>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search logs..."
                                className="pl-8 bg-muted/50 focus-visible:bg-background"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto w-full">
                        <Table className="min-w-[800px]">
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[180px]">Timestamp</TableHead>
                                    <TableHead className="w-[180px]">User</TableHead>
                                    <TableHead className="w-[120px]">Module</TableHead>
                                    <TableHead className="w-[150px]">Action</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLogsLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <LoaderCircle className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No logs found matching your criteria.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLogs.map((log: any) => (
                                        <TableRow key={log.id} className="hover:bg-muted/30">
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                {log.timestamp ? format(log.timestamp.toDate(), "MMM d, yyyy h:mm a") : "Unknown"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-sm">{log.userName}</div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[150px]">{log.userEmail}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs font-normal">
                                                    {log.module}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium text-sm">{log.action}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {log.details || "-"}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
