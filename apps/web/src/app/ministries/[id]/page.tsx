"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Label } from "@studio/ui";
import { Button } from "@studio/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@studio/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@studio/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@studio/ui";
import { HeartHandshake, Copy, ClipboardCheck, ArrowLeft, Edit, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useMinistries } from "@/hooks/use-ministries";
import { useWorkers } from "@/hooks/use-workers";
import { useUserRole } from "@/hooks/use-user-role";
import type { Ministry, Worker } from "@studio/types";
import { WorkloadCategoriesSection } from "../workload-categories-section";
import { LoaderCircle } from "lucide-react";

const DEPT_COLORS: Record<string, string> = {
  Worship: "bg-violet-500/10 text-violet-600 border-violet-200",
  Outreach: "bg-orange-500/10 text-orange-600 border-orange-200",
  Relationship: "bg-pink-500/10 text-pink-600 border-pink-200",
  Discipleship: "bg-blue-500/10 text-blue-600 border-blue-200",
  Administration: "bg-slate-500/10 text-slate-600 border-slate-200",
};

const ProfileItem = ({ label, worker }: { label: string; worker?: Worker | null }) => (
  <div className="space-y-1.5">
    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">{label}</p>
    {worker ? (
      <div className="flex items-center gap-2">
        <Avatar className="h-7 w-7">
          <AvatarImage src={worker.avatarUrl} />
          <AvatarFallback>{worker.firstName?.[0]}</AvatarFallback>
        </Avatar>
        <div className="truncate">
          <p className="text-xs font-medium truncate">{worker.firstName} {worker.lastName}</p>
          <p className="text-[9px] text-muted-foreground truncate">{worker.roleId}</p>
        </div>
      </div>
    ) : (
      <p className="text-[10px] text-muted-foreground italic">Unassigned</p>
    )}
  </div>
);

export default function MinistryDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const decodedId = decodeURIComponent(id);

  const { ministries, isLoading: ministriesLoading } = useMinistries();
  const { workers, isLoading: workersLoading } = useWorkers({ limit: 2000 });
  const { workerProfile, canManageWorkers } = useUserRole();

  const [copied, setCopied] = useState(false);
  const [sortColumn, setSortColumn] = useState<'name' | 'role' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const isLoading = ministriesLoading || workersLoading;

  if (isLoading) {
    return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
  }

  const ministry = ministries?.find((m) => m.id === decodedId);
  
  if (!ministry) {
    return <AppLayout><div className="flex flex-col items-center py-20"><p className="text-muted-foreground mb-4">Ministry not found.</p><Button onClick={() => router.push('/ministries')}>Back to Ministries</Button></div></AppLayout>;
  }

  const getWorker = (id: string) => workers?.find(w => w.id === id);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const leader = getWorker(ministry.leaderId);
  const head = ministry.headId ? getWorker(ministry.headId) : null;
  const manager = ministry.managerId ? getWorker(ministry.managerId) : null;
  const approver = ministry.approverId ? getWorker(ministry.approverId) : null;
  const assigner = ministry.mealStubAssignerId ? getWorker(ministry.mealStubAssignerId) : null;

  const members = workers?.filter(w => w.majorMinistryId === ministry.id || w.minorMinistryId === ministry.id) || [];
  
  const isMinistryHead = ministry.headId === workerProfile?.id;
  const canEditWorker = canManageWorkers || isMinistryHead;

  const sortedMembers = [...members].sort((a, b) => {
    let comparison = 0;
    if (sortColumn === 'name') {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      comparison = nameA.localeCompare(nameB);
    } else if (sortColumn === 'role') {
      comparison = (a.roleId || '').localeCompare(b.roleId || '');
    } else if (sortColumn === 'status') {
      comparison = (a.status || 'Active').localeCompare(b.status || 'Active');
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (column: 'name' | 'role' | 'status') => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (column: 'name' | 'role' | 'status') => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground opacity-50" />;
    return sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const primaryMembers = sortedMembers.filter(m => m.majorMinistryId === ministry.id);
  const secondaryMembers = sortedMembers.filter(m => m.minorMinistryId === ministry.id && m.majorMinistryId !== ministry.id);

  const WorkerTable = ({ membersList, title, emptyMessage }: { membersList: Worker[], title: string, emptyMessage: string }) => (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        {title} <span className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded-full">{membersList.length}</span>
      </h3>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                <div className="flex items-center">Worker {renderSortIcon('name')}</div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort('role')}>
                <div className="flex items-center">Role {renderSortIcon('role')}</div>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort('status')}>
                <div className="flex items-center">Status {renderSortIcon('status')}</div>
              </TableHead>
              {canEditWorker && <TableHead className="w-[80px] text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {membersList.map(member => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatarUrl} alt={member.firstName} />
                      <AvatarFallback className="text-[10px]">{member.firstName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{member.firstName} {member.lastName}</span>
                        {member.minorMinistryId === ministry.id && member.majorMinistryId !== ministry.id && (
                          <span className="text-[9px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Minor</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{member.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs uppercase tracking-wide bg-muted px-2 py-1 rounded-md text-muted-foreground border">
                    {member.roleId}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {member.status || 'Active'}
                  </span>
                </TableCell>
                {canEditWorker && (
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/workers/${member.id}/edit`)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {membersList.length === 0 && (
              <TableRow>
                <TableCell colSpan={canEditWorker ? 4 : 3} className="text-center py-8 text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="mb-8 mt-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-full bg-muted hover:bg-muted/80" onClick={() => router.push('/ministries')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-bold border-2 ${DEPT_COLORS[ministry.department] || 'bg-muted text-muted-foreground'}`}>
              {ministry.name.charAt(0)}
            </div>
            <div>
              <h1 className="font-headline text-3xl font-bold tracking-tight">{ministry.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${DEPT_COLORS[ministry.department] || 'bg-muted'}`}>
                  {ministry.department}
                </span>
                <span className="text-xs text-muted-foreground">Ministry Details</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workers">Workers ({members.length})</TabsTrigger>
            <TabsTrigger value="roles">Roles / Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 animate-in fade-in-50 duration-500">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Ministry ID</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1.5"
                      onClick={() => copyToClipboard(ministry.id)}
                    >
                      {copied ? <ClipboardCheck className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                  <p className="font-mono text-sm break-all font-semibold select-all">{ministry.id}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Description</Label>
                  <p className="text-sm leading-relaxed">{ministry.description || 'No description provided.'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-muted/20 p-6 rounded-lg border">
                <div className="space-y-4">
                  <Label className="text-muted-foreground text-xs">Ministry Leadership</Label>
                  <div className="space-y-5">
                    <ProfileItem label="Leader" worker={leader} />
                    <ProfileItem label="Ministry Head" worker={head} />
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-muted-foreground text-xs">Operational Roles</Label>
                  <div className="space-y-5">
                    <ProfileItem label="Ministry Manager" worker={manager} />
                    <ProfileItem label="Approver" worker={approver} />
                    <ProfileItem label="Meal Assigner" worker={assigner} />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="workers" className="animate-in fade-in-50 duration-500 space-y-8">
            <WorkerTable 
              membersList={primaryMembers} 
              title="Primary Members" 
              emptyMessage="No primary members found in this ministry." 
            />
            
            {secondaryMembers.length > 0 && (
              <WorkerTable 
                membersList={secondaryMembers} 
                title="Secondary Members" 
                emptyMessage="No secondary members found in this ministry." 
              />
            )}
          </TabsContent>

          <TabsContent value="roles" className="animate-in fade-in-50 duration-500">
            <div className="max-w-4xl">
              <WorkloadCategoriesSection ministry={ministry} members={members} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
