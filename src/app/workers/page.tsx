
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
import { MoreHorizontal, PlusCircle, LoaderCircle, Upload, LogIn, Users, UserCheck, UserX, Users2, Building2, Key, Mail } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import type { Worker, Role, Ministry } from "@/lib/types";
import { useFirestore, useCollection, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase, useUser, initiatePasswordReset, useFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/use-user-role";
import { useImpersonation } from "@/hooks/use-impersonation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const WorkerForm = ({ worker, roles, ministries, onSave, onClose, onResetPassword, canManage }: {
  worker: Partial<Worker> | null;
  roles: Role[];
  ministries: Ministry[];
  onSave: (worker: Partial<Worker>) => void;
  onClose: () => void;
  onResetPassword?: (worker: Worker) => void;
  canManage: boolean;
}) => {
  const [formData, setFormData] = useState<Partial<Worker>>({
    firstName: '', lastName: '', email: '', phone: '', roleId: 'viewer', status: canManage ? 'Active' : 'Pending Approval', avatarUrl: `https://picsum.photos/seed/${Math.random()}/100/100`,
    primaryMinistryId: '', secondaryMinistryId: ''
  });

  useEffect(() => {
    if (worker) {
      // Explicitly fall back to '' for every string field so inputs never
      // switch from controlled → uncontrolled when a field is missing
      // (e.g. workers created via signup don't have phone).
      setFormData({
        ...worker,
        firstName: worker.firstName || '',
        lastName: worker.lastName || '',
        email: worker.email || '',
        phone: worker.phone || '',
        roleId: worker.roleId || 'viewer',
        primaryMinistryId: worker.primaryMinistryId || '',
        secondaryMinistryId: worker.secondaryMinistryId || '',
      });
    } else {
      setFormData({
        firstName: '', lastName: '', email: '', phone: '', roleId: 'viewer',
        status: canManage ? 'Active' : 'Pending Approval',
        avatarUrl: `https://picsum.photos/seed/${Math.random()}/100/100`,
        primaryMinistryId: '', secondaryMinistryId: ''
      });
    }
  }, [worker, canManage]);

  const groupedMinistries = useMemo(() => {
    const groups: Record<string, Ministry[]> = {};
    ministries.forEach(m => {
      const dept = m.department || 'Other';
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(m);
    });
    return groups;
  }, [ministries]);

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
          <Input id="firstName" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="lastName" className="text-right">Last Name</Label>
          <Input id="lastName" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="email" className="text-right">Email</Label>
          <Input id="email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="phone" className="text-right">Phone</Label>
          <Input id="phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="role" className="text-right">Role</Label>
          <Select value={formData.roleId} onValueChange={(value: string) => setFormData({ ...formData, roleId: value })} disabled={!canManage}>
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
          <Select value={formData.status} onValueChange={(value: 'Active' | 'Inactive' | 'Pending Approval') => setFormData({ ...formData, status: value })} disabled={!canManage && !worker}>
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
          <Select value={formData.primaryMinistryId || 'none'} onValueChange={(value: string) => setFormData({ ...formData, primaryMinistryId: value === 'none' ? '' : value })}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select a ministry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {Object.entries(groupedMinistries).map(([dept, mins]) => (
                <SelectGroup key={dept}>
                  <SelectLabel className="text-muted-foreground uppercase text-xs tracking-wider">{dept}</SelectLabel>
                  {mins.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="secondaryMinistry" className="text-right">Secondary Ministry</Label>
          <Select value={formData.secondaryMinistryId || 'none'} onValueChange={(value: string) => setFormData({ ...formData, secondaryMinistryId: value === 'none' ? '' : value })}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select a ministry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {Object.entries(groupedMinistries).map(([dept, mins]) => (
                <SelectGroup key={dept}>
                  <SelectLabel className="text-muted-foreground uppercase text-xs tracking-wider">{dept}</SelectLabel>
                  {mins.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="employmentType" className="text-right">Worker Type</Label>
          <Select value={formData.employmentType || 'Volunteer'} onValueChange={(value: any) => setFormData({ ...formData, employmentType: value })} disabled={!canManage}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Full-Time">Full-Time</SelectItem>
              <SelectItem value="On-Call">On-Call</SelectItem>
              <SelectItem value="Volunteer">Volunteer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <SheetFooter className="flex-col sm:flex-row gap-2">
        {worker && onResetPassword && (
          <Button type="button" variant="outline" onClick={() => onResetPassword(worker as Worker)} className="mr-auto">
            <Mail className="mr-2 h-4 w-4" /> Send Reset Link
          </Button>
        )}
        <div className="flex gap-2">
          <SheetClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </SheetClose>
          <Button onClick={handleSave}>Save changes</Button>
        </div>
      </SheetFooter>
    </>
  );
};

const ImportSheet = ({ onImport, onClose }: { onImport: (csvData: string) => void; onClose: () => void; }) => {
  const [csvData, setCsvData] = useState('');
  const csvFormat = "firstName,lastName,email,phone,roleId,status,primaryMinistryId,secondaryMinistryId,employmentType";

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
  const { workerProfile, canManageWorkers, isSuperAdmin, allRoles, isLoading: isRoleLoading } = useUserRole();
  const { startImpersonation } = useImpersonation();
  const { auth } = useFirebase();

  const workersRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, "workers");
  }, [firestore, user]);
  const { data: allWorkers, isLoading: workersLoading } = useCollection<Worker>(workersRef);

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

  const departmentsRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, "departments");
  }, [firestore, user]);
  const { data: departmentDataList, isLoading: departmentsLoading } = useCollection<any>(departmentsRef);

  const isLoading = workersLoading || rolesLoading || ministriesLoading || isRoleLoading || departmentsLoading;

  // Detect Department Head by role name OR explicit assignment
  const explicitlyAssignedDepartment = useMemo(() => {
    if (!workerProfile?.id || !departmentDataList) return null;
    return departmentDataList.find(d => d.headId === workerProfile.id) || null;
  }, [workerProfile, departmentDataList]);

  const isDepartmentHead = useMemo(() => {
    if (explicitlyAssignedDepartment) return true;
    if (!workerProfile?.roleId || !roles.length) return false;
    const roleName = roles.find(r => r.id === workerProfile.roleId)?.name || '';
    return roleName.toLowerCase().includes('department head');
  }, [workerProfile, roles, explicitlyAssignedDepartment]);

  // Find the department of this user
  const userDepartment = useMemo(() => {
    if (explicitlyAssignedDepartment) return explicitlyAssignedDepartment.id;

    if (!workerProfile?.primaryMinistryId || !ministries.length) return null;
    return ministries.find(m => m.id === workerProfile.primaryMinistryId)?.department || null;
  }, [workerProfile, ministries, explicitlyAssignedDepartment]);

  // All ministries in the department head's department
  const departmentMinistries = useMemo(() => {
    if (!isDepartmentHead || !userDepartment) return [];
    return ministries.filter(m => m.department === userDepartment);
  }, [isDepartmentHead, userDepartment, ministries]);

  const workers = useMemo(() => {
    if (!allWorkers) return [];

    // Global managers (Super Admin or those with manage_workers but no specific ministry assigned)
    const isGlobalManager = isSuperAdmin || (canManageWorkers && !workerProfile?.primaryMinistryId);

    if (isGlobalManager) return allWorkers;

    // Department Heads see all workers across their whole department
    if (isDepartmentHead && departmentMinistries.length > 0) {
      const deptMinistryIds = departmentMinistries.map(m => m.id);
      return allWorkers.filter(w =>
        deptMinistryIds.includes(w.primaryMinistryId) ||
        deptMinistryIds.includes(w.secondaryMinistryId)
      );
    }

    // Filter by ministry: show workers in same ministries as current user
    const userMinistryIds = [workerProfile?.primaryMinistryId, workerProfile?.secondaryMinistryId].filter(Boolean);
    if (userMinistryIds.length === 0) return [];

    return allWorkers.filter(w =>
      userMinistryIds.includes(w.primaryMinistryId) ||
      userMinistryIds.includes(w.secondaryMinistryId)
    );
  }, [allWorkers, isSuperAdmin, canManageWorkers, workerProfile, isDepartmentHead, departmentMinistries]);

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
    // Add a tiny delay to allow the dropdown menu to close fully before opening the sheet.
    // This prevents focus-trap and scroll-lock conflicts.
    setTimeout(() => setIsSheetOpen(true), 10);
  };

  const handlePasswordReset = (worker: Worker) => {
    if (!worker.email) {
      toast({ variant: 'destructive', title: 'No email found', description: 'This worker does not have an email address set.' });
      return;
    }

    if (!auth) {
      toast({ variant: 'destructive', title: 'Auth Error', description: 'Firebase Auth is not initialized.' });
      return;
    }

    initiatePasswordReset(
      auth,
      worker.email,
      () => {
        toast({ title: "Email Sent", description: `A password reset link has been sent to ${worker.email}.` });
      },
      (error) => {
        console.error("Password reset error:", error);
        toast({ variant: "destructive", title: "Error", description: error.message });
      }
    );
  };
  const handleImpersonate = (worker: Worker) => {
    toast({
      title: "Impersonation Started",
      description: `You are now viewing the app as ${worker.firstName} ${worker.lastName}.`,
    });
    startImpersonation(worker.id);
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
        const newWorkerId = String(20000 + (allWorkers?.length || 0)).padStart(6, '0');
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
      // Close the sheet after a tiny delay to ensure Firestore operations 
      // and state transitions don't conflict with Radix UI animations.
      setTimeout(() => setIsSheetOpen(false), 50);
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
          toast({ variant: 'destructive', title: 'No Data Found', description: 'The CSV data was empty or invalid.' });
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
            const workerId = String(100000 + (allWorkers?.length || 0) + index).slice(-6);

            batch.set(newDocRef, {
              firstName: newWorker.firstName || '',
              lastName: newWorker.lastName || '',
              email: newWorker.email || '',
              phone: newWorker.phone || '',
              roleId: newWorker.roleId || 'viewer',
              status: newWorker.status || 'Pending Approval',
              primaryMinistryId: newWorker.primaryMinistryId || '',
              secondaryMinistryId: newWorker.secondaryMinistryId || '',
              employmentType: newWorker.employmentType || 'Volunteer',
              workerId: workerId,
              createdAt: serverTimestamp(),
              avatarUrl: `https://picsum.photos/seed/${newDocRef.id.slice(0, 5)}/100/100`,
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

  const getPermissions = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (roleId === 'admin') return ['all_access'];
    return role?.permissions || [];
  }

  // --- Ministry / Department Worker Summary Stats ---
  const isGlobalManager = isSuperAdmin || (canManageWorkers && !workerProfile?.primaryMinistryId);
  const userMinistryIds = [workerProfile?.primaryMinistryId, workerProfile?.secondaryMinistryId].filter(Boolean) as string[];

  // For Department Head: use the full set of department ministry IDs
  const statsMinistryIds = isDepartmentHead
    ? departmentMinistries.map(m => m.id)
    : userMinistryIds;

  // Primary workers: those whose PRIMARY ministry is in the stats scope
  const primaryWorkers = isGlobalManager
    ? (workers || [])
    : (workers || []).filter(w => w.primaryMinistryId && statsMinistryIds.includes(w.primaryMinistryId));

  // Secondary workers: those whose SECONDARY ministry is in the stats scope — NOT counted in total
  const totalSecondary = isGlobalManager
    ? (workers || []).filter(w => !!w.secondaryMinistryId).length
    : (workers || []).filter(w => w.secondaryMinistryId && statsMinistryIds.includes(w.secondaryMinistryId)).length;

  const totalWorkers = primaryWorkers.length;
  const totalActive = primaryWorkers.filter(w => w.status === 'Active').length;
  const totalInactive = primaryWorkers.filter(w => w.status === 'Inactive').length;

  // --- Per-ministry breakdown for Department Head ---
  const ministryBreakdown = useMemo(() => {
    if (!isDepartmentHead || departmentMinistries.length === 0) return [];
    return departmentMinistries.map(ministry => {
      const mPrimary = (allWorkers || []).filter(w => w.primaryMinistryId === ministry.id);
      const mSecondary = (allWorkers || []).filter(w => w.secondaryMinistryId === ministry.id);
      return {
        ministry,
        total: mPrimary.length,
        active: mPrimary.filter(w => w.status === 'Active').length,
        inactive: mPrimary.filter(w => w.status === 'Inactive').length,
        secondary: mSecondary.length,
        primaryWorkers: mPrimary,
      };
    });
  }, [isDepartmentHead, departmentMinistries, allWorkers]);

  if (isLoading) {
    return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
  }

  if (!canManageWorkers) {
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
        <h1 className="text-2xl font-headline font-bold">Worker Management</h1>
        {canManageWorkers && (
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

      {/* Summary Stats (dept-wide for Dept Head, ministry-scoped for others) */}
      <div className="mt-4 space-y-1">
        {isDepartmentHead && (
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              {userDepartment} Department Overview
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Workers</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-2xl font-bold">{totalWorkers}</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Active</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{totalActive}</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Inactive</CardTitle>
              <UserX className="h-4 w-4 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">{totalInactive}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Secondary Workers</CardTitle>
              <Users2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{totalSecondary}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Department Head: per-ministry breakdown */}
      {isDepartmentHead && ministryBreakdown.length > 0 && (
        <div className="mt-5">
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Ministry Breakdown</h2>
          <Tabs defaultValue={ministryBreakdown[0]?.ministry.id}>
            <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
              {ministryBreakdown.map(({ ministry }) => (
                <TabsTrigger key={ministry.id} value={ministry.id} className="text-xs">
                  {ministry.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {ministryBreakdown.map(({ ministry, total, active, inactive, secondary, primaryWorkers: mWorkers }) => (
              <TabsContent key={ministry.id} value={ministry.id} className="space-y-3">
                {/* Per-ministry stat row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
                      <CardTitle className="text-xs font-medium text-muted-foreground">Total</CardTitle>
                      <Users className="h-3.5 w-3.5 text-primary" />
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                      <p className="text-xl font-bold">{total}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
                      <CardTitle className="text-xs font-medium text-muted-foreground">Active</CardTitle>
                      <UserCheck className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                      <p className="text-xl font-bold text-green-700 dark:text-green-400">{active}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
                      <CardTitle className="text-xs font-medium text-muted-foreground">Inactive</CardTitle>
                      <UserX className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                      <p className="text-xl font-bold text-red-700 dark:text-red-400">{inactive}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
                      <CardTitle className="text-xs font-medium text-muted-foreground">Secondary</CardTitle>
                      <Users2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                      <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{secondary}</p>
                    </CardContent>
                  </Card>
                </div>
                {/* Per-ministry worker table */}
                <div className="rounded-lg border shadow-sm overflow-x-auto w-full">
                  <Table className="min-w-[700px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Worker ID</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Contact</TableHead>
                        {canManageWorkers && <TableHead><span className="sr-only">Actions</span></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mWorkers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-6 text-sm">
                            No workers in this ministry.
                          </TableCell>
                        </TableRow>
                      )}
                      {mWorkers.map(worker => (
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
                              <span className="text-xs">{worker.email}</span>
                              <span className="text-[10px] text-muted-foreground">{worker.phone}</span>
                            </div>
                          </TableCell>
                          {canManageWorkers && (
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onSelect={() => setTimeout(() => handleEdit(worker), 100)}>Edit</DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => setTimeout(() => handlePasswordReset(worker), 100)}>
                                    <Mail className="mr-2 h-4 w-4" /> Send Reset Link
                                  </DropdownMenuItem>
                                  {worker.id !== user?.uid && (
                                    <DropdownMenuItem onSelect={() => setTimeout(() => handleImpersonate(worker), 100)}>
                                      <LogIn className="mr-2 h-4 w-4" /> Impersonate
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onSelect={() => setTimeout(() => handleDelete(worker.id), 100)} className="text-destructive">Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}

      <div className="rounded-lg border shadow-sm mt-4 overflow-x-auto w-full">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Worker ID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Contact</TableHead>
              {canManageWorkers && (
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
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
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {getPermissions(worker.roleId).map(p => (
                      <Badge key={p} variant="outline" className="text-[10px] px-1 py-0 h-4 normal-case font-normal border-primary/20 bg-primary/5">
                        {p.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
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
                    <span className="text-xs">{worker.email}</span>
                    <span className="text-[10px] text-muted-foreground">{worker.phone}</span>
                  </div>
                </TableCell>
                {canManageWorkers && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setTimeout(() => handleEdit(worker), 100)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setTimeout(() => handlePasswordReset(worker), 100)}>
                          <Mail className="mr-2 h-4 w-4" /> Send Reset Link
                        </DropdownMenuItem>
                        {worker.id !== user?.uid && (
                          <DropdownMenuItem onSelect={() => setTimeout(() => handleImpersonate(worker), 100)}>
                            <LogIn className="mr-2 h-4 w-4" />
                            Impersonate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onSelect={() => setTimeout(() => handleDelete(worker.id), 100)} className="text-destructive">Delete</DropdownMenuItem>
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
            onResetPassword={handlePasswordReset}
            canManage={canManageWorkers}
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
