"use client";

import React, { useState, useEffect, useMemo } from "react";
import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import Papa from "papaparse";
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
import { MoreHorizontal, PlusCircle, LoaderCircle, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Worker, Role, Ministry } from "@/lib/types";
import { useFirestore, useCollection, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase, useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/use-user-role";

const WorkerForm = ({ worker, roles, ministries, onSave, onClose, canManage }: { worker: Partial<Worker> | null; roles: Role[]; ministries: Ministry[]; onSave: (worker: Partial<Worker>) => void; onClose: () => void; canManage: boolean; }) => {
  const [formData, setFormData] = useState<Partial<Worker>>({
    firstName: '', lastName: '', email: '', phone: '', roleId: 'viewer', status: canManage ? 'Active' : 'Pending Approval', avatarUrl: `https://picsum.photos/seed/${Math.random()}/100/100`,
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
            firstName: '', lastName: '', email: '', phone: '', roleId: 'viewer', status: canManage ? 'Active' : 'Pending Approval', avatarUrl: `https://picsum.photos/seed/${Math.random()}/100/100`,
            primaryMinistryId: '', secondaryMinistryId: ''
        });
    }
  }, [worker, canManage]);

  const handleSave = () => {
    onSave(formData);
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
          <Select value={formData.roleId} onValueChange={(value: string) => setFormData({...formData, roleId: value})} disabled={!canManage}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map(role => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="status" className="text-right">Status</Label>
          <Select value={formData.status} onValueChange={(value: 'Active' | 'Inactive' | 'Pending Approval') => setFormData({...formData, status: value})} disabled={!canManage && !worker}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Pending Approval">Pending Approval</SelectItem>
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

const ImportSheet = ({ onImport, onClose }: { onImport: (csvData: string) => void; onClose: () => void; }) => {
    const [csvData, setCsvData] = useState('');
    const csvFormat = "firstName,lastName,email,phone,roleId,status,primaryMinistryId,secondaryMinistryId";

    return (
        <>
            <SheetHeader>
                <SheetTitle className="font-headline">Import Workers</SheetTitle>
                <SheetDescription>
                    Paste CSV data below to bulk-import workers. The first line must be a header row.
                </SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="csv-format">Required CSV Format</Label>
                    <Input id="csv-format" readOnly defaultValue={csvFormat} className="font-mono text-xs" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="csv-data">CSV Data</Label>
                    <Textarea 
                        id="csv-data"
                        value={csvData}
                        onChange={(e) => setCsvData(e.target.value)}
                        placeholder="Paste your CSV content here..."
                        className="h-64 font-mono text-xs"
                    />
                </div>
            </div>
            <SheetFooter>
                <SheetClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                </SheetClose>
                <Button onClick={() => onImport(csvData)}>Process Import</Button>
            </SheetFooter>
        </>
    )
}

export default function WorkersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();
  const { workerProfile, isSuperAdmin, realUserRole, isLoading: isRoleLoading } = useUserRole();

  const canManageUsers = useMemo(() => {
    if (isRoleLoading || !realUserRole) return false;
    return isSuperAdmin || !!realUserRole.privileges?.['manage_users'];
  }, [isRoleLoading, realUserRole, isSuperAdmin]);

  const workersRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, "workers");
  }, [firestore, user]);
  const { data: workers, isLoading: workersLoading } = useCollection<Worker>(workersRef);

  const rolesRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, "roles");
  }, [firestore, user]);
  const { data: rolesData, isLoading: rolesLoading } = useCollection<Role>(rolesRef);
  const roles = rolesData || [];

  const ministriesRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, "ministries");
  }, [firestore, user]);
  const { data: ministriesData, isLoading: ministriesLoading } = useCollection<Ministry>(ministriesRef);
  const ministries = ministriesData || [];
  
  const isLoading = workersLoading || rolesLoading || ministriesLoading || isRoleLoading;

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  const handleAddNew = () => {
    setSelectedWorker(null);
    setIsSheetOpen(true);
  };

  const handleOpenImport = () => {
      setIsImportSheetOpen(true);
  }
  
  const handleEdit = (worker: Worker) => {
    setSelectedWorker(worker);
    setIsSheetOpen(true);
  };
  
  const handleDelete = (workerId: string) => {
    if (!workerId) return;
    deleteDocumentNonBlocking(doc(firestore, "workers", workerId));
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
          await updateDocumentNonBlocking(doc(firestore, "workers", selectedWorker.id), dataToSave);
          toast({
              title: "Worker Updated",
              description: `${dataToSave.firstName} ${dataToSave.lastName}'s profile has been updated.`
          });
      } else {
          const newWorkerId = String(20000 + (workers?.length || 0)).padStart(6, '0');
          const dataToSaveWithId = { ...dataToSave, workerId: newWorkerId, createdAt: serverTimestamp() };
          const newWorkerRef = await addDocumentNonBlocking(collection(firestore, "workers"), dataToSaveWithId);

          if (newWorkerRef && workerProfile && dataToSave.status === 'Pending Approval') {
            await addDocumentNonBlocking(collection(firestore, "approvals"), {
              requester: `${workerProfile.firstName} ${workerProfile.lastName}`,
              type: 'New Worker',
              details: `New worker registration for ${dataToSave.firstName} ${dataToSave.lastName}.`,
              date: serverTimestamp(),
              status: 'Pending',
              workerId: newWorkerRef.id
            });
            toast({
                title: "Worker Added",
                description: `${dataToSave.firstName} ${dataToSave.lastName} has been added and is now pending approval.`
            });
          } else {
            toast({
                title: "Worker Added",
                description: `${dataToSave.firstName} ${dataToSave.lastName} has been added with status: ${dataToSave.status}.`
            });
          }
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

  const handleImportWorkers = (csvData: string) => {
    Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
            const newWorkers = results.data;
            if (newWorkers.length === 0) {
                toast({ variant: 'destructive', title: 'No Data Found', description: 'The CSV data was empty or invalid.'});
                return;
            }

            try {
                const batch = writeBatch(firestore);
                let approvalCount = 0;
                
                newWorkers.forEach((newWorker: any, index) => {
                    if (!newWorker.firstName || !newWorker.lastName || !newWorker.email) {
                        console.warn('Skipping invalid row:', newWorker);
                        return;
                    }

                    const newDocRef = doc(collection(firestore, "workers"));
                    const workerId = String(100000 + (workers?.length || 0) + index).slice(-6);

                    batch.set(newDocRef, {
                        firstName: newWorker.firstName || '',
                        lastName: newWorker.lastName || '',
                        email: newWorker.email || '',
                        phone: newWorker.phone || '',
                        roleId: newWorker.roleId || 'viewer',
                        status: newWorker.status || 'Pending Approval',
                        primaryMinistryId: newWorker.primaryMinistryId || '',
                        secondaryMinistryId: newWorker.secondaryMinistryId || '',
                        workerId: workerId,
                        createdAt: serverTimestamp(),
                        avatarUrl: `https://picsum.photos/seed/${newDocRef.id.slice(0,5)}/100/100`,
                    });

                    if ((newWorker.status || 'Pending Approval') === 'Pending Approval') {
                        approvalCount++;
                        const approvalRef = doc(collection(firestore, "approvals"));
                        batch.set(approvalRef, {
                            requester: workerProfile ? `${workerProfile.firstName} ${workerProfile.lastName}` : 'System Import',
                            type: 'New Worker',
                            details: `New worker import: ${newWorker.email}`,
                            date: serverTimestamp(),
                            status: 'Pending',
                            workerId: newDocRef.id
                        });
                    }
                });

                await batch.commit();

                toast({
                    title: "Import Successful",
                    description: `${newWorkers.length} workers were imported. ${approvalCount} approval requests were created.`
                });
                setIsImportSheetOpen(false);

            } catch (error) {
                 toast({
                    variant: "destructive",
                    title: "Import Failed",
                    description: "An error occurred during the import. Check console for details.",
                });
                console.error("Import error:", error);
            }
        }
    })
  }

  const getRoleName = (roleId: string) => {
    return roles.find(r => r.id === roleId)?.name || roleId;
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-headline font-bold">Worker Profiles</h1>
        {canManageUsers && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleOpenImport}>
                <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Worker
            </Button>
          </div>
        )}
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
              {canManageUsers && (
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
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
                <TableCell>{getRoleName(worker.roleId)}</TableCell>
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
                {canManageUsers && (
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
                )}
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
            roles={roles}
            ministries={ministries} 
            onSave={handleSaveWorker} 
            onClose={() => setIsSheetOpen(false)}
            canManage={canManageUsers}
             />
        </SheetContent>
      </Sheet>

      <Sheet open={isImportSheetOpen} onOpenChange={setIsImportSheetOpen}>
        <SheetContent className="sm:max-w-lg">
            <ImportSheet onImport={handleImportWorkers} onClose={() => setIsImportSheetOpen(false)} />
        </SheetContent>
      </Sheet>

    </AppLayout>
  );
}
