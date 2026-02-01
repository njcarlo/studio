"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { collection, serverTimestamp, doc } from "firebase/firestore";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, QrCode, LoaderCircle, Scan } from "lucide-react";
import type { MealStub, Worker } from "@/lib/types";
import { useFirestore, useCollection, addDocumentNonBlocking, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { useUserRole } from "@/hooks/use-user-role";
import { format, isToday, subDays } from 'date-fns';

const MealStubDialog = ({ stub, worker, open, onOpenChange }: { stub: MealStub | null, worker: Worker | null, open: boolean, onOpenChange: (open: boolean) => void }) => {
    if (!stub) return null;

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`MEALSTUB:${stub.id}`)}`;

    const workerName = worker ? `${worker.firstName} ${worker.lastName}` : stub.workerName;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-headline">Mealstub for {workerName}</DialogTitle>
                    <DialogDescription>
                        Scan this QR code to claim the meal.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center p-4">
                    <Image src={qrCodeUrl} alt="Mealstub QR Code" width={250} height={250} />
                </div>
                 <div className="text-center">
                    <p className="font-semibold">Meal Stub on {stub.date ? format(new Date((stub.date as any).seconds * 1000), 'PP') : ''}</p>
                    <Badge variant={stub.status === 'Issued' ? 'default' : 'secondary'} className={stub.status === 'Issued' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                        {stub.status}
                    </Badge>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default function MealsPage() {
  const firestore = useFirestore();
  const mealStubsRef = useMemoFirebase(() => collection(firestore, "mealstubs"), [firestore]);
  const { data: mealStubs, isLoading: mealStubsLoading } = useCollection<MealStub>(mealStubsRef);
  
  const workersRef = useMemoFirebase(() => collection(firestore, "worker_profiles"), [firestore]);
  const { data: workers, isLoading: workersLoading } = useCollection<Worker>(workersRef);
  
  const { user } = useUser();
  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'worker_profiles', user.uid) : null, [firestore, user]);
  const { data: userProfile } = useDoc<Worker>(userProfileRef);

  const [selectedStub, setSelectedStub] = useState<MealStub | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { viewAsRole } = useUserRole();
  const isAdmin = viewAsRole === 'Admin' || viewAsRole === 'Super Admin';

  const isLoading = mealStubsLoading || workersLoading;

  const handleRowClick = (stub: MealStub) => {
    setSelectedStub(stub);
    const worker = workers?.find(w => w.id === stub.workerId) || null;
    setSelectedWorker(worker);
    setIsDialogOpen(true);
  };
  
  const generateManualStub = () => {
      if (!user || !userProfile) return;
      
      const newStub = {
          workerId: user.uid,
          workerName: `${userProfile.firstName} ${userProfile.lastName}`,
          date: serverTimestamp(),
          status: 'Issued',
      };
      addDocumentNonBlocking(collection(firestore, "mealstubs"), newStub);
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
            <Button asChild variant="outline">
                <Link href="/scan"><QrCode className="mr-2 h-4 w-4"/> Scan Stub</Link>
            </Button>
            <Button onClick={generateManualStub}>
                <PlusCircle className="mr-2 h-4 w-4" /> Generate Manual Stub
            </Button>
        </div>
      </div>
      
      {isAdmin && (
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
        Click on a row to view the QR code for the mealstub.
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
              <TableRow key={stub.id} onClick={() => handleRowClick(stub)} className="cursor-pointer">
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

      <MealStubDialog stub={selectedStub} worker={selectedWorker} open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </AppLayout>
  );
}
