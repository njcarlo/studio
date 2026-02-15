"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { collection, serverTimestamp, doc, query, where } from "firebase/firestore";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, QrCode, LoaderCircle, Scan, RefreshCw } from "lucide-react";
import type { MealStub, Worker } from "@/lib/types";
import { useFirestore, useCollection, addDocumentNonBlocking, useUser, useMemoFirebase } from "@/firebase";
import { useUserRole } from "@/hooks/use-user-role";
import { format, isToday, subDays } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

export default function MealsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { isSuperAdmin, workerProfile, isLoading: isRoleLoading } = useUserRole();
  const { toast } = useToast();

  const canManageMealStubs = isSuperAdmin;

  const mealStubsQuery = useMemoFirebase(() => {
    if (!user) return null;
    if (canManageMealStubs) {
        // For admins, fetch all stubs from the last 30 days to keep it manageable
        const thirtyDaysAgo = subDays(new Date(), 30);
        return query(collection(firestore, "mealstubs"), where('date', '>=', thirtyDaysAgo));
    }
    // For regular users, fetch their own stubs
    return query(collection(firestore, "mealstubs"), where('workerId', '==', user.uid));
  }, [firestore, user, canManageMealStubs]);

  const { data: mealStubs, isLoading: mealStubsLoading } = useCollection<MealStub>(mealStubsQuery);
  
  const workersRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, "workers");
  }, [firestore, user]);
  const { data: workers, isLoading: workersLoading } = useCollection<Worker>(workersRef);

  const isLoading = mealStubsLoading || workersLoading || isRoleLoading;
  
  const generateManualStub = () => {
      if (!user || !workerProfile) return;

      const todaysStubs = mealStubs?.filter(s => s.workerId === user.uid && s.status === 'Issued' && isToday(new Date((s.date as any).seconds * 1000)));
      if (todaysStubs && todaysStubs.length > 0) {
          toast({
              variant: "default",
              title: "Stub Already Exists",
              description: "You already have an issued meal stub for today.",
          });
          return;
      }
      
      const newStub = {
          workerId: user.uid,
          workerName: `${workerProfile.firstName} ${workerProfile.lastName}`,
          date: serverTimestamp(),
          status: 'Issued' as 'Issued',
      };
      addDocumentNonBlocking(collection(firestore, "mealstubs"), newStub);
       toast({
        title: "Meal Stub Issued",
        description: "A meal stub for today has been issued to your account.",
      });
  };

  const claimedStubs = mealStubs?.filter(s => s.status === 'Claimed') || [];
  const todayScans = claimedStubs.filter(s => s.date && isToday(new Date((s.date as any).seconds * 1000))).length;
  const weekScans = claimedStubs.filter(s => {
      if (!s.date) return false;
      const sevenDaysAgo = subDays(new Date(), 7);
      return new Date((s.date as any).seconds * 1000) > sevenDaysAgo;
  }).length;

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-headline font-bold">Mealstub Management</h1>
        <div className="flex items-center gap-2">
            <Button onClick={generateManualStub}>
                <PlusCircle className="mr-2 h-4 w-4" /> Generate My Meal Stub
            </Button>
        </div>
      </div>
      
      {canManageMealStubs && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 my-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Scans</CardTitle>
                    <Scan className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{todayScans}</div>
                    <p className="text-xs text-muted-foreground">Meal stubs claimed today</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">This Week's Scans</CardTitle>
                    <Scan className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{weekScans}</div>
                    <p className="text-xs text-muted-foreground">Meal stubs claimed in the last 7 days</p>
                </CardContent>
            </Card>
        </div>
      )}

      <p className="text-muted-foreground">
        Your personal QR code on the <Link href="/attendance" className="underline text-primary">Attendance page</Link> can be used to claim meal stubs.
      </p>
      
      <div className="rounded-lg border shadow-sm mt-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  <LoaderCircle className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            )}
            {mealStubs && workers && mealStubs.map((stub) => {
              const worker = workers.find(w => w.id === stub.workerId);
              const workerName = worker ? `${worker.firstName} ${worker.lastName}` : stub.workerName;
              return (
              <TableRow key={stub.id}>
                <TableCell className="font-medium">{workerName}</TableCell>
                <TableCell>{stub.date ? format(new Date((stub.date as any).seconds * 1000), 'PP') : ''}</TableCell>
                <TableCell>Meal Stub</TableCell>
                <TableCell>
                  <Badge variant={stub.status === 'Issued' ? 'default' : 'secondary'} className={stub.status === 'Issued' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                    {stub.status}
                  </Badge>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}
