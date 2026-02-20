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
  CardContent,
  CardDescription
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
  const { canViewMealStubs, canManageAllMealStubs, workerProfile, isLoading: isRoleLoading } = useUserRole();
  const { toast } = useToast();

  const mealStubsQuery = useMemoFirebase(() => {
    if (!user) return null;
    if (canManageAllMealStubs) {
      // For admins, fetch all stubs from the last 30 days to keep it manageable
      const thirtyDaysAgo = subDays(new Date(), 30);
      return query(collection(firestore, "mealstubs"), where('date', '>=', thirtyDaysAgo));
    }
    // For regular users, fetch their own stubs
    return query(collection(firestore, "mealstubs"), where('workerId', '==', user.uid));
  }, [firestore, user, canManageAllMealStubs]);

  const { data: mealStubs, isLoading: mealStubsLoading } = useCollection<MealStub>(mealStubsQuery);

  const workersRef = useMemoFirebase(() => {
    if (!user || !canManageAllMealStubs) return null;
    return collection(firestore, "workers");
  }, [firestore, user, canManageAllMealStubs]);
  const { data: workers, isLoading: workersLoading } = useCollection<Worker>(workersRef);

  const isLoading = mealStubsLoading || (canManageAllMealStubs && workersLoading) || isRoleLoading;

  const [qrSeed, setQrSeed] = useState(Date.now());
  const refreshQrCode = () => setQrSeed(Date.now());
  const qrData = user ? `MEAL_STUB:${user.uid}:${qrSeed}` : '';
  const qrUrl = qrData ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}` : '';

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

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
      </AppLayout>
    );
  }

  if (!canViewMealStubs) {
    return (
      <AppLayout>
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to view this page.</CardDescription>
          </CardHeader>
        </Card>
      </AppLayout>
    );
  }


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

      {canManageAllMealStubs && (
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 my-6">
        <Card className="flex flex-col items-center justify-center p-6 lg:col-span-1">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-headline text-lg">Personal Meal Stub QR</CardTitle>
            <CardDescription className="text-xs">Codes refresh automatically and expire in 5 minutes to prevent sharing.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4">
            {qrUrl ? (
              <>
                <div className="bg-white p-2 rounded-lg">
                  <Image src={qrUrl} alt="Meal Stub QR Code" width={150} height={150} />
                </div>
                <Button variant="outline" size="sm" onClick={refreshQrCode}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh Code
                </Button>
              </>
            ) : (
              <LoaderCircle className="h-8 w-8 animate-spin" />
            )}
          </CardContent>
        </Card>
      </div>

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
            {mealStubs && mealStubs.map((stub) => {
              const worker = canManageAllMealStubs ? workers?.find(w => w.id === stub.workerId) : null;
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
              )
            })}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}
