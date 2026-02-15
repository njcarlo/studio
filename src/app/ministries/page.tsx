"use client";

import React, { useState } from "react";
import { collection, writeBatch, doc } from "firebase/firestore";
import Papa from "papaparse";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HeartHandshake, User as UserIcon, Users, LoaderCircle, Upload } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ImportSheet = ({ onImport, onClose }: { onImport: (csvData: string) => void; onClose: () => void; }) => {
    const [csvData, setCsvData] = useState('');
    const csvFormat = "name,department";

    return (
        <>
            <SheetHeader>
                <SheetTitle className="font-headline">Import Ministries</SheetTitle>
                <SheetDescription>
                    Paste CSV data below to bulk-import ministries. The first line must be a header row.
                </SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="csv-format">Required CSV Format</Label>
                    <Input id="csv-format" readOnly defaultValue={csvFormat} className="font-mono text-xs" />
                    <p className="text-xs text-muted-foreground">
                        `department` must be one of: Worship, Outreach, Relationship, Discipleship, Administration.
                    </p>
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

export default function MinistriesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { isSuperAdmin, isLoading: isRoleLoading } = useUserRole();
  const { toast } = useToast();

  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  
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

  const handleOpenImport = () => {
    setIsImportSheetOpen(true);
  }

  const handleImportMinistries = (csvData: string) => {
    Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
            const newMinistries = results.data;
            if (newMinistries.length === 0) {
                toast({ variant: 'destructive', title: 'No Data Found', description: 'The CSV data was empty or invalid.'});
                return;
            }

            const validDepartments = new Set(departments);

            try {
                const batch = writeBatch(firestore);
                let invalidRowCount = 0;
                
                newMinistries.forEach((newMinistry: any) => {
                    if (!newMinistry.name || !newMinistry.department || !validDepartments.has(newMinistry.department)) {
                        console.warn('Skipping invalid row:', newMinistry);
                        invalidRowCount++;
                        return;
                    }

                    const newDocRef = doc(collection(firestore, "ministries"));
                    batch.set(newDocRef, {
                        name: newMinistry.name,
                        department: newMinistry.department,
                        description: '',
                        leaderId: ''
                    });
                });

                if (invalidRowCount === newMinistries.length) {
                    toast({
                        variant: "destructive",
                        title: "Import Failed",
                        description: `All ${invalidRowCount} rows were invalid. Please check the department names and ensure all ministries have a name.`,
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
        <h1 className="text-2xl font-headline font-bold">Ministries</h1>
        {isSuperAdmin && (
            <Button variant="outline" onClick={handleOpenImport}>
                <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
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
                {departmentMinistries.map(ministry => {
                  const leader = getWorker(ministry.leaderId);
                  const members = workers?.filter(w => w.primaryMinistryId === ministry.id || w.secondaryMinistryId === ministry.id) || [];

                  return (
                    <Card key={ministry.id}>
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/10 rounded-lg text-primary">
                            <HeartHandshake className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{ministry.name}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{ministry.description}</p>
                        
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
    </AppLayout>
  );
}
