
"use client";

import React, { useState, useEffect } from "react";
import { collection, writeBatch, doc } from "firebase/firestore";
import Papa from "papaparse";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HeartHandshake, User as UserIcon, Users, LoaderCircle, Upload, PlusCircle, MoreHorizontal, Edit, Trash2, UserCog, Utensils } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useFirestore, useCollection, useMemoFirebase, useUser, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase";
import type { Ministry, Worker, Department } from "@/lib/types";
import { useUserRole } from "@/hooks/use-user-role";
import { useAuditLog } from "@/hooks/use-audit-log";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, ClipboardCheck } from "lucide-react";

const generateMinistryId = (name: string, department: string) => {
  const firstLetter = department.charAt(0).toUpperCase();
  const cleanedName = name.trim().replace(/\s+/g, '-');
  return `${firstLetter}-${cleanedName}`;
};


const ImportSheet = ({ onImport, onClose }: { onImport: (csvData: string) => void; onClose: () => void; }) => {
  const [csvData, setCsvData] = useState('');
  const csvFormat = "name,department";

  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-headline">Import Ministries</SheetTitle>
        <SheetDescription>
          Paste CSV data below to bulk-import ministries. The first line must be a header row with `name` and `department`.
        </SheetDescription>
      </SheetHeader>
      <div className="py-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="csv-format">Required CSV Format</Label>
          <Input id="csv-format" readOnly defaultValue={csvFormat} className="font-mono text-xs" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            The `department` column must use a number code:<br />
            1 = Worship, 2 = Outreach, 3 = Relationship, 4 = Discipleship, 5 = Administration.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="csv-data">CSV Data</Label>
          <Textarea
            id="csv-data"
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            placeholder={`name,department\nPrayer Ministry,1\nWelcome Team,3`}
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

const MinistryForm = ({ ministry, workers, departments, onSave, onClose }: { ministry: Partial<Ministry> | null; workers: Worker[]; departments: Department[]; onSave: (data: Partial<Ministry>) => void; onClose: () => void; }) => {
  const [formData, setFormData] = useState<Partial<Ministry>>({ name: '', description: '', department: 'Worship', leaderId: '', headId: '' });

  useEffect(() => {
    if (ministry) {
      setFormData(ministry);
    } else {
      setFormData({ name: '', description: '', department: 'Worship', leaderId: '', headId: '' });
    }
  }, [ministry]);

  const handleChange = (field: keyof Ministry, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-headline">{ministry ? 'Edit Ministry' : 'Add New Ministry'}</SheetTitle>
        <SheetDescription>Fill in the details for the ministry.</SheetDescription>
      </SheetHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Ministry Name</Label>
          <Input id="name" value={formData.name} onChange={e => handleChange('name', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={formData.description} onChange={e => handleChange('description', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Select value={formData.department} onValueChange={(value: string) => handleChange('department', value)}>
            <SelectTrigger id="department"><SelectValue /></SelectTrigger>
            <SelectContent>
              {departments.map(dep => <SelectItem key={dep} value={dep}>{dep}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="leader">Leader</Label>
          <Select value={formData.leaderId || 'none'} onValueChange={(value: string) => handleChange('leaderId', value === 'none' ? '' : value)}>
            <SelectTrigger id="leader"><SelectValue placeholder="Select a leader" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {workers.map(w => <SelectItem key={w.id} value={w.id}>{`${w.firstName} ${w.lastName}`}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="head">Ministry Head</Label>
          <Select value={formData.headId || 'none'} onValueChange={(value: string) => handleChange('headId', value === 'none' ? '' : value)}>
            <SelectTrigger id="head"><SelectValue placeholder="Select a ministry head" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {workers.map(w => <SelectItem key={w.id} value={w.id}>{`${w.firstName} ${w.lastName}`}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <SheetFooter>
        <SheetClose asChild><Button type="button" variant="secondary">Cancel</Button></SheetClose>
        <Button onClick={() => onSave(formData)}>Save Changes</Button>
      </SheetFooter>
    </>
  );
};

const AppointApproverForm = ({
  ministry,
  workers,
  onSave,
  onClose,
  type = 'approver'
}: {
  ministry: Ministry;
  workers: Worker[];
  onSave: (ministryId: string, userId: string | null, type: 'approver' | 'assigner' | 'head') => void;
  onClose: () => void;
  type?: 'approver' | 'assigner' | 'head'
}) => {
  const initialValue = type === 'approver'
    ? (ministry.approverId || 'none')
    : type === 'assigner'
      ? (ministry.mealStubAssignerId || 'none')
      : (ministry.headId || 'none');
  const [selectedUserId, setSelectedUserId] = useState<string>(initialValue);

  const sortedWorkers = [...workers].sort((a, b) => a.firstName.localeCompare(b.firstName));

  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-headline">
          {type === 'approver' ? 'Appoint Approver' : type === 'assigner' ? 'Appoint Meal Stub Assigner' : 'Appoint Ministry Head'}
        </SheetTitle>
        <SheetDescription>
          {type === 'approver'
            ? `Select a worker to be the approver for ${ministry.name}. The approver can approve and reject requests related to this ministry.`
            : type === 'assigner'
              ? `Select a worker to be the Meal Stub Assigner for ${ministry.name}. This person can assign meal stubs for Sundays.`
              : `Select a worker to be the Ministry Head for ${ministry.name}.`
          }
        </SheetDescription>
      </SheetHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="worker-select">{type === 'approver' ? 'Approver' : type === 'assigner' ? 'Meal Stub Assigner' : 'Ministry Head'}</Label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger id="worker-select"><SelectValue placeholder={`Select a ${type === 'head' ? 'ministry head' : type}`} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (Remove {type === 'approver' ? 'Approver' : type === 'assigner' ? 'Assigner' : 'Ministry Head'})</SelectItem>
              {sortedWorkers.map(w => <SelectItem key={w.id} value={w.id}>{`${w.firstName} ${w.lastName}`}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <SheetFooter>
        <SheetClose asChild><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button></SheetClose>
        <Button onClick={() => onSave(ministry.id, selectedUserId === 'none' ? null : selectedUserId, type)}>Save Changes</Button>
      </SheetFooter>
    </>
  );
};

const MinistryDetailsSheet = ({ ministry, workers, members, onEdit, onClose }: {
  ministry: Ministry;
  workers: Worker[];
  members: Worker[];
  onEdit: () => void;
  onClose: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const getWorker = (id: string) => workers.find(w => w.id === id);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const leader = getWorker(ministry.leaderId);
  const head = ministry.headId ? getWorker(ministry.headId) : null;
  const approver = ministry.approverId ? getWorker(ministry.approverId) : null;
  const assigner = ministry.mealStubAssignerId ? getWorker(ministry.mealStubAssignerId) : null;

  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <div>
            <SheetTitle className="font-headline text-2xl">{ministry.name}</SheetTitle>
            <SheetDescription>{ministry.department} Department</SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="py-6 space-y-6">
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

        {ministry.description && (
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Description</Label>
            <p className="text-sm leading-relaxed">{ministry.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label className="text-muted-foreground text-xs">Ministry Leadership</Label>
            <div className="space-y-4">
              <ProfileItem label="Leader" worker={leader} />
              <ProfileItem label="Ministry Head" worker={head} />
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-muted-foreground text-xs">Operational Roles</Label>
            <div className="space-y-4">
              <ProfileItem label="Approver" worker={approver} />
              <ProfileItem label="Meal Assigner" worker={assigner} />
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground text-xs">Members ({members.length})</Label>
          </div>
          <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
            {members.map(member => (
              <div key={member.id} className="flex items-center gap-2 p-2 rounded-md border bg-card/50">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={member.avatarUrl} alt={member.firstName} />
                  <AvatarFallback className="text-[10px]">{member.firstName[0]}</AvatarFallback>
                </Avatar>
                <div className="truncate">
                  <p className="text-xs font-medium truncate">{member.firstName} {member.lastName}</p>
                </div>
              </div>
            ))}
            {members.length === 0 && <p className="text-xs text-muted-foreground italic col-span-2 py-4 text-center">No members found.</p>}
          </div>
        </div>
      </div>

      <SheetFooter className="gap-2 sm:gap-0">
        <Button variant="outline" className="flex-1" onClick={onEdit}>Edit Ministry</Button>
        <SheetClose asChild>
          <Button variant="secondary" className="flex-1">Close</Button>
        </SheetClose>
      </SheetFooter>
    </>
  );
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


export default function MinistryManagementPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { canManageMinistries, canAppointApprovers, workerProfile, isLoading: isRoleLoading } = useUserRole();
  const { toast } = useToast();
  const { logAction } = useAuditLog();

  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [selectedMinistryDetails, setSelectedMinistryDetails] = useState<Ministry | null>(null);
  const [ministryToDelete, setMinistryToDelete] = useState<Ministry | null>(null);
  const [isAppointApproverSheetOpen, setIsAppointApproverSheetOpen] = useState(false);
  const [appointType, setAppointType] = useState<'approver' | 'assigner' | 'head'>('approver');
  const [ministryToAppoint, setMinistryToAppoint] = useState<Ministry | null>(null);

  const ministriesRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, "ministries");
  }, [firestore, user]);
  const { data: ministries, isLoading: ministriesLoading } = useCollection<Ministry>(ministriesRef);

  const workersRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, "workers");
  }, [firestore, user]);
  const { data: workers, isLoading: workersLoading } = useCollection<Worker>(workersRef);

  const getWorker = (workerId: string) => workers?.find(w => w.id === workerId);

  const isLoading = ministriesLoading || workersLoading || isRoleLoading;

  const departments: Department[] = ['Worship', 'Outreach', 'Relationship', 'Discipleship', 'Administration'];

  const canAppointForMinistry = (ministry: Ministry) => {
    return canAppointApprovers || ministry.leaderId === workerProfile?.id;
  };

  const handleOpenImport = () => setIsImportSheetOpen(true);
  const handleAddNew = () => {
    setSelectedMinistry(null);
    setIsFormSheetOpen(true);
  };
  const handleEdit = (ministry: Ministry) => {
    setSelectedMinistry(ministry);
    setIsFormSheetOpen(true);
  };

  const handleSaveMinistry = async (data: Partial<Ministry>) => {
    try {
      if (selectedMinistry) {
        await updateDocumentNonBlocking(doc(firestore, 'ministries', selectedMinistry.id), data);
        await logAction('Updated Ministry', 'Ministries', `Updated configuration for "${data.name || selectedMinistry.name}"`);
        toast({ title: 'Ministry Updated' });
      } else {
        const customId = generateMinistryId(data.name || 'New', data.department || 'Worship');
        await setDocumentNonBlocking(doc(firestore, 'ministries', customId), {
          ...data,
          id: customId,
          description: data.description || '',
          leaderId: data.leaderId || '',
          headId: data.headId || ''
        }, { merge: true });
        await logAction('Created Ministry', 'Ministries', `Created new ministry "${data.name}" in ${data.department}`);
        toast({ title: 'Ministry Added', description: `Assigned ID: ${customId}` });
      }
      setIsFormSheetOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save ministry.' });
    }
  };

  const handleSaveAppointedUser = async (ministryId: string, userId: string | null, type: 'approver' | 'assigner' | 'head') => {
    try {
      const field = type === 'approver' ? 'approverId' : type === 'assigner' ? 'mealStubAssignerId' : 'headId';
      await updateDocumentNonBlocking(doc(firestore, 'ministries', ministryId), { [field]: userId === null ? '' : userId });
      const minInfo = ministries?.find((m: Ministry) => m.id === ministryId);
      const wInfo = userId ? getWorker(userId) : null;
      await logAction('Updated Ministry Assignment', 'Ministries', `Assigned ${wInfo ? `${wInfo.firstName} ${wInfo.lastName}` : 'None'} as ${type} for "${minInfo?.name}"`);
      toast({ title: `${type === 'approver' ? 'Approver' : type === 'assigner' ? 'Meal Stub Assigner' : 'Ministry Head'} Updated` });
      setIsAppointApproverSheetOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Update Failed', description: `Could not update ${type}.` });
    }
  };

  const handleDeleteMinistry = async () => {
    if (!ministryToDelete) return;
    try {
      await deleteDocumentNonBlocking(doc(firestore, 'ministries', ministryToDelete.id));
      await logAction('Deleted Ministry', 'Ministries', `Deleted ministry "${ministryToDelete.name}"`);
      toast({ title: 'Ministry Deleted' });
      setMinistryToDelete(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete ministry.' });
    }
  };

  const handleImportMinistries = (csvData: string) => {
    const departmentMap: { [key: string]: Department } = {
      '1': 'Worship',
      '2': 'Outreach',
      '3': 'Relationship',
      '4': 'Discipleship',
      '5': 'Administration',
    };

    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const newMinistries = results.data;
        if (newMinistries.length === 0) {
          toast({ variant: 'destructive', title: 'No Data Found', description: 'The CSV data was empty or invalid.' });
          return;
        }

        try {
          const batch = writeBatch(firestore);
          let invalidRowCount = 0;

          newMinistries.forEach((newMinistry: any) => {
            const departmentCode = newMinistry.department;
            const departmentName = departmentMap[departmentCode];

            if (!newMinistry.name || !departmentName) {
              console.warn('Skipping invalid row:', newMinistry);
              invalidRowCount++;
              return;
            }

            const customId = generateMinistryId(newMinistry.name, departmentName);
            const newDocRef = doc(firestore, "ministries", customId);
            batch.set(newDocRef, {
              id: customId,
              name: newMinistry.name,
              department: departmentName,
              description: '',
              leaderId: '',
              headId: ''
            });
          });

          if (invalidRowCount === newMinistries.length) {
            toast({
              variant: "destructive",
              title: "Import Failed",
              description: `All ${invalidRowCount} rows were invalid. Please check the department codes and ensure all ministries have a name.`,
            });
            return;
          }

          await batch.commit();

          let description = `${newMinistries.length - invalidRowCount} ministries were imported.`;
          if (invalidRowCount > 0) {
            description += ` ${invalidRowCount} rows were skipped due to invalid data.`
          }

          toast({
            title: "Import Successful",
            description: description
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

  if (isLoading) {
    return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
  }

  if (!canManageMinistries) {
    return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>You do not have permission to view this page.</CardDescription></CardHeader></Card></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-headline font-bold">Ministry Management</h1>
        {canManageMinistries && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleOpenImport}>
              <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Ministry
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-8 mt-4">
        {!isLoading && departments.map(department => {
          const departmentMinistries = ministries?.filter(m => m.department === department);

          if (!departmentMinistries || departmentMinistries.length === 0) {
            return null;
          }

          return (
            <div key={department}>
              <h2 className="text-xl font-headline font-semibold mb-4 border-b pb-2">{department}</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {departmentMinistries.sort((a, b) => a.name.localeCompare(b.name)).map(ministry => {
                  const leader = getWorker(ministry.leaderId);
                  const members = workers?.filter(w => w.primaryMinistryId === ministry.id || w.secondaryMinistryId === ministry.id) || [];

                  return (
                    <Card key={ministry.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg text-primary">
                              <HeartHandshake className="h-5 w-5" />
                            </div>
                            <div className="cursor-pointer" onClick={() => {
                              setSelectedMinistryDetails(ministry);
                              setIsDetailsSheetOpen(true);
                            }}>
                              <CardTitle className="text-lg hover:text-primary transition-colors">{ministry.name}</CardTitle>
                              <p className="text-[10px] font-mono text-muted-foreground uppercase mt-0.5">{ministry.id}</p>
                            </div>
                          </div>
                          {(canManageMinistries || canAppointForMinistry(ministry)) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canAppointForMinistry(ministry) && (
                                  <>
                                    <DropdownMenuItem onSelect={() => {
                                      setTimeout(() => {
                                        setMinistryToAppoint(ministry);
                                        setAppointType('approver');
                                        setIsAppointApproverSheetOpen(true);
                                      }, 100);
                                    }}>
                                      <UserCog className="mr-2 h-4 w-4" /> Appoint Approver
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => {
                                      setTimeout(() => {
                                        setMinistryToAppoint(ministry);
                                        setAppointType('assigner');
                                        setIsAppointApproverSheetOpen(true);
                                      }, 100);
                                    }}>
                                      <Utensils className="mr-2 h-4 w-4" /> Appoint Meal Assigner
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => {
                                      setTimeout(() => {
                                        setMinistryToAppoint(ministry);
                                        setAppointType('head');
                                        setIsAppointApproverSheetOpen(true);
                                      }, 100);
                                    }}>
                                      <Users className="mr-2 h-4 w-4" /> Appoint Ministry Head
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {canManageMinistries && (
                                  <>
                                    <DropdownMenuItem onSelect={() => setTimeout(() => handleEdit(ministry), 100)}>
                                      <Edit className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => setTimeout(() => setMinistryToDelete(ministry), 100)} className="text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground h-10 overflow-hidden">{ministry.description || "No description."}</p>

                        <div>
                          <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                            <UserCog className="h-4 w-4" />
                            Approver
                          </h4>
                          {ministry.approverId && getWorker(ministry.approverId) ? (() => {
                            const approver = getWorker(ministry.approverId)!;
                            return (
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={approver.avatarUrl} alt={`${approver.firstName} ${approver.lastName}`} />
                                  <AvatarFallback>{approver.firstName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{`${approver.firstName} ${approver.lastName}`}</p>
                                  <p className="text-xs text-muted-foreground">{approver.roleId}</p>
                                </div>
                              </div>
                            );
                          })() : (
                            <p className="text-sm text-muted-foreground">No approver assigned.</p>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                            <Utensils className="h-4 w-4" />
                            Meal Stub Assigner
                          </h4>
                          {ministry.mealStubAssignerId && getWorker(ministry.mealStubAssignerId) ? (() => {
                            const assigner = getWorker(ministry.mealStubAssignerId)!;
                            return (
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={assigner.avatarUrl} alt={`${assigner.firstName} ${assigner.lastName}`} />
                                  <AvatarFallback>{assigner.firstName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{`${assigner.firstName} ${assigner.lastName}`}</p>
                                  <p className="text-xs text-muted-foreground">{assigner.roleId}</p>
                                </div>
                              </div>
                            );
                          })() : (
                            <p className="text-sm text-muted-foreground">No assigner assigned.</p>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4" />
                            Ministry Head
                          </h4>
                          {ministry.headId && getWorker(ministry.headId) ? (() => {
                            const head = getWorker(ministry.headId)!;
                            return (
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={head.avatarUrl} alt={`${head.firstName} ${head.lastName}`} />
                                  <AvatarFallback>{head.firstName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{`${head.firstName} ${head.lastName}`}</p>
                                  <p className="text-xs text-muted-foreground">{head.roleId}</p>
                                </div>
                              </div>
                            );
                          })() : (
                            <p className="text-sm text-muted-foreground">No ministry head assigned.</p>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                            <UserIcon className="h-4 w-4" />
                            Leader
                          </h4>
                          {leader ? (
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={leader.avatarUrl} alt={`${leader.firstName} ${leader.lastName}`} />
                                <AvatarFallback>{leader.firstName?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{`${leader.firstName} ${leader.lastName}`}</p>
                                <p className="text-xs text-muted-foreground">{leader.roleId}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No leader assigned.</p>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4" />
                            Members ({members.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            <TooltipProvider>
                              {members.map(member => member && (
                                <Tooltip key={member.id}>
                                  <TooltipTrigger>
                                    <Avatar className="h-8 w-8 border-2 border-background">
                                      <AvatarImage src={member.avatarUrl} alt={`${member.firstName} ${member.lastName}`} />
                                      <AvatarFallback>{member.firstName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{`${member.firstName} ${member.lastName}`}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                            </TooltipProvider>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs text-muted-foreground mt-2"
                          onClick={() => {
                            setSelectedMinistryDetails(ministry);
                            setIsDetailsSheetOpen(true);
                          }}
                        >
                          View Full Details
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Sheet open={isImportSheetOpen} onOpenChange={setIsImportSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <ImportSheet onImport={handleImportMinistries} onClose={() => setIsImportSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      <Sheet open={isDetailsSheetOpen} onOpenChange={setIsDetailsSheetOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {selectedMinistryDetails && workers && (
            <MinistryDetailsSheet
              ministry={selectedMinistryDetails}
              workers={workers}
              members={workers.filter(w => w.primaryMinistryId === selectedMinistryDetails.id || w.secondaryMinistryId === selectedMinistryDetails.id)}
              onEdit={() => {
                setIsDetailsSheetOpen(false);
                setSelectedMinistry(selectedMinistryDetails);
                setIsFormSheetOpen(true);
              }}
              onClose={() => setIsDetailsSheetOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={isFormSheetOpen} onOpenChange={setIsFormSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          {workers && (
            <MinistryForm
              ministry={selectedMinistry}
              workers={workers}
              departments={departments}
              onSave={handleSaveMinistry}
              onClose={() => setIsFormSheetOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={isAppointApproverSheetOpen} onOpenChange={setIsAppointApproverSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          {workers && ministryToAppoint && (
            <AppointApproverForm
              ministry={ministryToAppoint}
              workers={workers}
              type={appointType}
              onSave={handleSaveAppointedUser}
              onClose={() => setIsAppointApproverSheetOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!ministryToDelete} onOpenChange={(open) => !open && setMinistryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the ministry <span className="font-bold">{ministryToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMinistry}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AppLayout>
  );
}


