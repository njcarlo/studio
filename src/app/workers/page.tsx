"use client";

import React, { useState } from "react";
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
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle } from "lucide-react";
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
import { workers as initialWorkers, rooms } from "@/lib/placeholder-data";
import type { Worker } from "@/lib/types";

const WorkerForm = ({ worker, onSave }: { worker: Partial<Worker> | null; onSave: (worker: Partial<Worker>) => void }) => {
  const [formData, setFormData] = useState<Partial<Worker>>(worker || {
    name: '', email: '', phone: '', role: 'Volunteer', permissions: [], status: 'Pending Approval'
  });

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
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">Name</Label>
        <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="col-span-3" />
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
        <Select value={formData.role} onValueChange={(value: Worker['role']) => setFormData({...formData, role: value})}>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Volunteer">Volunteer</SelectItem>
            <SelectItem value="Staff">Staff</SelectItem>
            <SelectItem value="Clergy">Clergy</SelectItem>
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
      <SheetFooter>
        <SheetClose asChild>
          <Button type="button" variant="secondary">Cancel</Button>
        </SheetClose>
        <SheetClose asChild>
          <Button onClick={handleSave}>Save changes</Button>
        </SheetClose>
      </SheetFooter>
    </div>
  );
};

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers);
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
    setWorkers(workers.filter(w => w.id !== workerId));
  };

  const handleSaveWorker = (workerData: Partial<Worker>) => {
    if (selectedWorker) {
        setWorkers(workers.map(w => w.id === selectedWorker.id ? {...w, ...workerData} as Worker : w));
    } else {
        const newWorker: Worker = {
            id: (workers.length + 1).toString(),
            avatarUrl: 'https://picsum.photos/seed/105/100/100',
            ...workerData,
        } as Worker;
        setWorkers([newWorker, ...workers]);
    }
    setIsSheetOpen(false);
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
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workers.map((worker) => (
              <TableRow key={worker.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={worker.avatarUrl} alt={worker.name} />
                      <AvatarFallback>{worker.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {worker.name}
                  </div>
                </TableCell>
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
                    <span className="text-sm text-muted-foreground">{worker.phone}</span>
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
          <SheetHeader>
            <SheetTitle className="font-headline">{selectedWorker ? 'Edit Worker' : 'Add New Worker'}</SheetTitle>
            <SheetDescription>
              {selectedWorker ? 'Update the details for this worker.' : 'Fill in the details for the new worker.'}
            </SheetDescription>
          </SheetHeader>
          <WorkerForm worker={selectedWorker} onSave={handleSaveWorker} />
        </SheetContent>
      </Sheet>

    </AppLayout>
  );
}
