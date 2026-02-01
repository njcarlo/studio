"use client";

import React, { useState, useEffect } from "react";
import { collection, doc, serverTimestamp } from "firebase/firestore";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, LoaderCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { Worker, WorkerRole, Ministry } from "@/lib/types";
import { useFirestore, useCollection, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/use-user-role";

const WorkerForm = ({ worker, ministries, onSave, onClose }: { worker: Partial<Worker> | null; ministries: Ministry[]; onSave: (worker: Partial<Worker>) => void; onClose: () => void; }) => {
  const [formData, setFormData] = useState<Partial<Worker>>({
    firstName: '', lastName: '', email: '', phone: '', role: 'Mentee', permissions: [], status: 'Pending Approval', avatarUrl: `https://picsum.photos/seed/${Math.random()}/100/100`,
    primaryMinistryId: '', secondaryMinistryId: ''
  });

  useEffect(() => {
    if (worker) {
        setFormData({
            ...worker,
            primaryMinistryId: worker.primaryMinistryId || '',
            secondaryMinistryId: worker.secondaryMinistryId || '',
        });
    } else {
        setFormData({
            firstName: '', lastName: '', email: '', phone: '', role: 'Mentee', permissions: [], status: 'Pending Approval', avatarUrl: `https://picsum.photos/seed/${Math.random()}/100/100`,
            primaryMinistryId: '', secondaryMinistryId: ''
        });
    }
  }, [worker]);

  const handleSave = () => {
    onSave(formData);
  };
  
  const handlePermissionsChange = (permission: string, checked: boolean) => {
    const newPermissions = formData.permissions ? [...formData.permissions] : [];
    if (checked) {
        if (!newPermissions.includes(permission)) {
            newPermissions.push(permission);
        }
    } else {
        const index = newPermissions.indexOf(permission);
        if (index > -1) {
            newPermissions.splice(index, 1);
        }
    }
    setFormData(prev => ({...prev, permissions: newPermissions}));
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-headline">{worker ? 'Edit Worker' : 'Add New Worker'}</SheetTitle>
        <SheetDescription>
          {worker ? 'Update the details for this worker.' : 'Fill in the details for the new worker.'}
        </SheetDescription>
      </SheetHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="firstName" className="text-right">First Name</Label>
          <Input id="firstName" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="lastName" className="text-right">Last Name</Label>
          <Input id="lastName" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="email" className="text-right">Email</Label>
          <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="phone" className="text-right">Phone</Label>
          <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="role" className="text-right">Role</Label>
          <Select value={formData.role} onValueChange={(value: WorkerRole) => setFormData({...formData, role: value})}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mentee">Mentee</SelectItem>
              <SelectItem value="Volunteer">Volunteer</SelectItem>
              <SelectItem value="Full-time">Full-time Worker</SelectItem>
              <SelectItem value="On-call">On-call Worker</SelectItem>
              <SelectItem value="Clergy">Clergy</SelectItem>
              <SelectItem value="Ministry Head">Ministry Head</SelectItem>
              <SelectItem value="Department Head">Department Head</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Super Admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="primaryMinistry" className="text-right">Primary Ministry</Label>
          <Select value={formData.primaryMinistryId || 'none'} onValueChange={(value) => setFormData({...formData, primaryMinistryId: value === 'none' ? '' : value})}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select a ministry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {ministries.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="secondaryMinistry" className="text-right">Secondary Ministry</Label>
          <Select value={formData.secondaryMinistryId || 'none'} onValueChange={(value) => setFormData({...formData, secondaryMinistryId: value === 'none' ? '' : value})}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select a ministry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {ministries.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label className="text-right pt-2">Permissions</Label>
          <div className="col-span-3 space-y-2">
              {['Room Booking', 'Manage Workers', 'Approve All'].map(p => (
                  <div key={p} className="flex items-center space-x-2">
                      <Checkbox 
                          id={`perm-${p}`} 
                          checked={formData.permissions?.includes(p)}
                          onCheckedChange={(checked) => handlePermissionsChange(p, !!checked)}
                      />
                      <label htmlFor={`perm-${p}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{p}</label>
                  </div>
              ))}
          </div>
        </div>
      </div>
      <SheetFooter>
        <SheetClose asChild>
          <Button type="button" variant="secondary">Cancel</Button>
        </SheetClose>
        <Button onClick={handleSave}>Save changes</Button>
      </SheetFooter>
    </>
  );
};

export default function WorkersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { userProfile } = useUserRole();
  const workersRef = useMemoFirebase(() => collection(firestore, "worker_profiles"), [firestore]);
  const { data: workers, isLoading } = useCollection<Worker>(workersRef);

  const ministriesRef = useMemoFirebase(() => collection(firestore, "ministries"), [firestore]);
  const { data: ministriesData } = useCollection<Ministry>(ministriesRef);
  const ministries = ministriesData || [];

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  const handleAddNew = () => {
    setSelectedWorker(null);
    setIsSheetOpen(true);
  };
  
  const handleEdit = (worker: Worker) => {
    setSelectedWorker(worker);
    setIsSheetOpen(true);
  };
  
  const handleDelete = (workerId: string) => {
    if (!workerId) return;
    deleteDocumentNonBlocking(doc(firestore, "worker_profiles", workerId));
    toast({
        title: "Worker Deleted",
        description: "The worker profile has been removed."
    });
  };

  const handleSaveWorker = async (workerData: Partial<Worker>) => {
    if (!workerData.firstName || !workerData.lastName || !workerData.email) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Please fill out first name, last name, and email.",
      });
      return;
    }

    const dataToSave = { ...workerData };
    if (dataToSave.primaryMinistryId === 'none') {
      dataToSave.primaryMinistryId = '';
    }
    if (dataToSave.secondaryMinistryId === 'none') {
      dataToSave.secondaryMinistryId = '';
    }

    try {
      if (selectedWorker?.id) {
          await updateDocumentNonBlocking(doc(firestore, "worker_profiles", selectedWorker.id), dataToSave);
          toast({
              title: "Worker Updated",
              description: `${dataToSave.firstName} ${dataToSave.lastName}'s profile has been updated.`
          });
      } else {
          const newWorkerId = String(20000 + (workers?.length || 0)).padStart(6, '0');
          const dataToSaveWithId = { ...dataToSave, workerId: newWorkerId };
          const newWorkerRef = await addDocumentNonBlocking(collection(firestore, "worker_profiles"), dataToSaveWithId);
          if (newWorkerRef && userProfile) {
            await addDocumentNonBlocking(collection(firestore, "approvals"), {
              requester: `${userProfile.firstName} ${userProfile.lastName}`,
              type: 'New Worker',
              details: `New worker registration for ${dataToSave.firstName} ${dataToSave.lastName}.`,
              date: serverTimestamp(),
              status: 'Pending',
              workerId: newWorkerRef.id
            });
          }
          toast({
              title: "Worker Added",
              description: `${dataToSave.firstName} ${dataToSave.lastName} has been added and is now pending approval.`
          });
      }
      setIsSheetOpen(false);
    } catch (error) {
      console.error("Failed to save worker:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save worker profile. Check console for details.",
      });
    }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-headline font-bold">Worker Profiles</h1>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Worker
        </Button>
      </div>

      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Worker ID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  <LoaderCircle className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            )}
            {workers && workers.map((worker) => (
              <TableRow key={worker.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={worker.avatarUrl} alt={`${worker.firstName} ${worker.lastName}`} />
                      <AvatarFallback>{worker.firstName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {`${worker.firstName} ${worker.lastName}`}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{worker.workerId}</TableCell>
                <TableCell>{worker.role}</TableCell>
                <TableCell>
                   <Badge variant={worker.status === 'Active' ? 'default' : 'secondary'} className={
                       worker.status === 'Active' ? 'bg-green-100 text-green-800' : 
                       worker.status === 'Pending Approval' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                   }>
                    {worker.status}
                   </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{worker.email}</span>
                    <span className="text-muted-foreground">{worker.phone}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => handleEdit(worker)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleDelete(worker.id)} className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

       <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <WorkerForm 
            key={selectedWorker?.id || 'new-worker-form'}
            worker={selectedWorker} 
            ministries={ministries} 
            onSave={handleSaveWorker} 
            onClose={() => setIsSheetOpen(false)} />
        </SheetContent>
      </Sheet>

    </AppLayout>
  );
}
