
"use client";

import React, { useState } from "react";
import { collection } from "firebase/firestore";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HeartHandshake, User, Users, LoaderCircle, PlusCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import type { Ministry, Worker, Department } from "@/lib/types";
import { useUserRole } from "@/hooks/use-user-role";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
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


const MinistryForm = ({ workers, departments, onSave }: { workers: Worker[], departments: Department[], onSave: (ministry: Partial<Ministry>) => void }) => {
  const [formData, setFormData] = useState<Partial<Ministry>>({
    name: '',
    description: '',
    leaderId: '',
    department: 'Worship',
    memberIds: [],
  });

  const handleSave = () => {
    if (!formData.name || !formData.description || !formData.leaderId) {
        // Add proper validation/toast here in a real app
        console.error("Missing required fields");
        return;
    }
    onSave(formData);
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">Name</Label>
        <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="col-span-3" />
      </div>
       <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="description" className="text-right pt-2">Description</Label>
        <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="department" className="text-right">Department</Label>
        <Select value={formData.department} onValueChange={(value: Department) => setFormData({...formData, department: value})}>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select a department" />
          </SelectTrigger>
          <SelectContent>
            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
       <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="leader" className="text-right">Leader</Label>
        <Select value={formData.leaderId} onValueChange={(value: string) => setFormData({...formData, leaderId: value})}>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select a leader" />
          </SelectTrigger>
          <SelectContent>
            {workers.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <SheetFooter>
        <SheetClose asChild>
          <Button type="button" variant="secondary">Cancel</Button>
        </SheetClose>
        <SheetClose asChild>
            <Button onClick={handleSave}>Save Ministry</Button>
        </SheetClose>
      </SheetFooter>
    </div>
  );
};


export default function MinistriesPage() {
  const firestore = useFirestore();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const ministriesRef = useMemoFirebase(() => collection(firestore, "ministries"), [firestore]);
  const { data: ministries, isLoading: ministriesLoading } = useCollection<Ministry>(ministriesRef);

  const workersRef = useMemoFirebase(() => collection(firestore, "worker_profiles"), [firestore]);
  const { data: workers, isLoading: workersLoading } = useCollection<Worker>(workersRef);

  const { viewAsRole } = useUserRole();
  const canManageMinistries = ['Admin', 'Super Admin', 'Ministry Head', 'Department Head'].includes(viewAsRole);

  const getWorker = (workerId: string) => workers?.find(w => w.id === workerId);
  
  const isLoading = ministriesLoading || workersLoading;

  const departments: Department[] = ['Worship', 'Outreach', 'Relationship', 'Discipleship', 'Administration'];

  const handleSaveMinistry = (ministryData: Partial<Ministry>) => {
    addDocumentNonBlocking(collection(firestore, 'ministries'), ministryData);
    setIsSheetOpen(false);
  };


  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-headline font-bold">Ministries</h1>
        {canManageMinistries && (
          <Button onClick={() => setIsSheetOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Ministry
          </Button>
        )}
      </div>
      
      {isLoading && (
        <div className="flex justify-center py-10">
          <LoaderCircle className="h-8 w-8 animate-spin" />
        </div>
      )}

      <div className="space-y-8">
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
                  const members = ministry.memberIds.map(getWorker).filter(Boolean);

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
                            <User className="h-4 w-4" />
                            Leader
                          </h4>
                          {leader ? (
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={leader.avatarUrl} alt={leader.name} />
                                    <AvatarFallback>{leader.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium">{leader.name}</p>
                                    <p className="text-xs text-muted-foreground">{leader.role}</p>
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
                              {(members as Worker[]).map(member => member && (
                                <Tooltip key={member.id}>
                                  <TooltipTrigger>
                                    <Avatar className="h-8 w-8 border-2 border-background">
                                        <AvatarImage src={member.avatarUrl} alt={member.name} />
                                        <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{member.name}</p>
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

       <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="font-headline">Add New Ministry</SheetTitle>
            <SheetDescription>
              Fill in the details for the new ministry.
            </SheetDescription>
          </SheetHeader>
          {workers && <MinistryForm workers={workers} departments={departments} onSave={handleSaveMinistry} />}
        </SheetContent>
      </Sheet>

    </AppLayout>
  );
}
