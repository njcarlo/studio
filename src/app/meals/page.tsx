"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { collection, serverTimestamp } from "firebase/firestore";
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
import { Badge } from "@/components/ui/badge";
import { PlusCircle, QrCode, LoaderCircle } from "lucide-react";
import type { MealStub } from "@/lib/types";
import { useFirestore, useCollection, addDocumentNonBlocking, useUser, useMemoFirebase } from "@/firebase";
import { format } from 'date-fns';

const MealStubDialog = ({ stub, open, onOpenChange }: { stub: MealStub | null, open: boolean, onOpenChange: (open: boolean) => void }) => {
    if (!stub) return null;

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`MEALSTUB:${stub.id}`)}`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-headline">Mealstub for {stub.workerName}</DialogTitle>
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
  const { data: mealStubs, isLoading } = useCollection<MealStub>(mealStubsRef);
  
  const { user } = useUser();
  const [selectedStub, setSelectedStub] = useState<MealStub | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleRowClick = (stub: MealStub) => {
    setSelectedStub(stub);
    setIsDialogOpen(true);
  };
  
  const generateManualStub = () => {
      if (!user) return;
      
      const newStub = {
          workerId: user.uid,
          workerName: user.displayName || "Unknown Worker",
          date: serverTimestamp(),
          status: 'Issued',
      };
      addDocumentNonBlocking(collection(firestore, "mealstubs"), newStub);
  };

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
      
      <p className="text-muted-foreground">
        Click on a row to view the QR code for the mealstub.
      </p>
      
      <div className="rounded-lg border shadow-sm">
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
            {mealStubs && mealStubs.map((stub) => (
              <TableRow key={stub.id} onClick={() => handleRowClick(stub)} className="cursor-pointer">
                <TableCell className="font-medium">{stub.workerName}</TableCell>
                <TableCell>{stub.date ? format(new Date((stub.date as any).seconds * 1000), 'PP') : ''}</TableCell>
                <TableCell>Meal Stub</TableCell>
                <TableCell>
                  <Badge variant={stub.status === 'Issued' ? 'default' : 'secondary'} className={stub.status === 'Issued' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                    {stub.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <MealStubDialog stub={selectedStub} open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </AppLayout>
  );
}
