
"use client";

import React, { useState, useEffect } from "react";
import { collection, writeBatch, doc } from "firebase/firestore";
import Papa from "papaparse";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HeartHandshake, User as UserIcon, Users, LoaderCircle, Upload, PlusCircle, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useFirestore, useCollection, useMemoFirebase, useUser, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import type { Ministry, Worker, Department } from "@/lib/types";
import { useUserRole } from "@/hooks/use-user-role";
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
    const [formData, setFormData] = useState<Partial<Ministry>>({ name: '', description: '', department: 'Worship', leaderId: '' });

    useEffect(() => {
        if (ministry) {
            setFormData(ministry);
        } else {
            setFormData({ name: '', description: '', department: 'Worship', leaderId: '' });
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
                    <Select value={formData.department} onValueChange={value => handleChange('department', value)}>
                        <SelectTrigger id="department"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {departments.map(dep => <SelectItem key={dep} value={dep}>{dep}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="leader">Leader</Label>
                    <Select value={formData.leaderId || 'none'} onValueChange={value => handleChange('leaderId', value === 'none' ? '' : value)}>
                        <SelectTrigger id="leader"><SelectValue placeholder="Select a leader" /></SelectTrigger>
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


export default function MinistryManagementPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { isSuperAdmin, isLoading: isRoleLoading } = useUserRole();
  const { toast } = useToast();

  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [ministryToDelete, setMinistryToDelete] = useState<Ministry | null>(null);

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
            toast({ title: 'Ministry Updated' });
        } else {
            await addDocumentNonBlocking(collection(firestore, 'ministries'), data);
            toast({ title: 'Ministry Added' });
        }
        setIsFormSheetOpen(false);
      } catch (error) {
          toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save ministry.' });
      }
  };
  
  const handleDeleteMinistry = async () => {
      if (!ministryToDelete) return;
      try {
          await deleteDocumentNonBlocking(doc(firestore, 'ministries', ministryToDelete.id));
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
                toast({ variant: 'destructive', title: 'No Data Found', description: 'The CSV data was empty or invalid.'});
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

                    const newDocRef = doc(collection(firestore, "ministries"));
                    batch.set(newDocRef, {
                        name: newMinistry.name,
                        department: departmentName,
                        description: '',
                        leaderId: ''
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

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-headline font-bold">Ministry Management</h1>
        {isSuperAdmin && (
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

      {isLoading && (
        <div className="flex justify-center py-10">
          <LoaderCircle className="h-8 w-8 animate-spin" />
        </div>
      )}

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
                                <div>
                                    <CardTitle className="text-lg">{ministry.name}</CardTitle>
                                </div>
                            </div>
                            {isSuperAdmin && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onSelect={() => handleEdit(ministry)}>
                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => setMinistryToDelete(ministry)} className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground h-10 overflow-hidden">{ministry.description || "No description."}</p>

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

    