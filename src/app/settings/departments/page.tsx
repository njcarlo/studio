"use client";

import React, { useState } from "react";
import { collection, doc } from "firebase/firestore";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, UserCog, LoaderCircle, Users } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, useUser, setDocumentNonBlocking } from "@/firebase";
import type { Department, Worker } from "@/lib/types";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type DepartmentData = {
    id: string; // The literal department name like "Worship"
    headId?: string;
    description?: string;
}

const AppointHeadForm = ({
    departmentName,
    departmentData,
    workers,
    onSave,
    onClose,
}: {
    departmentName: Department;
    departmentData: DepartmentData | null;
    workers: Worker[];
    onSave: (departmentId: string, headId: string | null, description: string) => void;
    onClose: () => void;
}) => {
    const [selectedUserId, setSelectedUserId] = useState<string>(departmentData?.headId || 'none');
    const [description, setDescription] = useState(departmentData?.description || '');

    const sortedWorkers = [...workers].sort((a, b) => a.firstName.localeCompare(b.firstName));

    return (
        <>
            <SheetHeader>
                <SheetTitle className="font-headline">Manage {departmentName}</SheetTitle>
                <SheetDescription>
                    Assign a department head and update the description for the {departmentName} department.
                </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the department's purpose..."
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="worker-select">Department Head</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger id="worker-select"><SelectValue placeholder="Select a department head" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None (Remove Department Head)</SelectItem>
                            {sortedWorkers.map(w => <SelectItem key={w.id} value={w.id}>{`${w.firstName} ${w.lastName}`}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <SheetFooter>
                <SheetClose asChild><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button></SheetClose>
                <Button onClick={() => onSave(departmentName, selectedUserId === 'none' ? null : selectedUserId, description)}>Save Changes</Button>
            </SheetFooter>
        </>
    );
};

export default function DepartmentManagementPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { canManageMinistries, isLoading: isRoleLoading } = useUserRole();
    const { toast } = useToast();

    const [isAppointHeadSheetOpen, setIsAppointHeadSheetOpen] = useState(false);
    const [departmentToAppoint, setDepartmentToAppoint] = useState<Department | null>(null);

    const workersRef = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, "workers");
    }, [firestore, user]);
    const { data: workers, isLoading: workersLoading } = useCollection<Worker>(workersRef);

    const departmentsRef = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, "departments");
    }, [firestore, user]);
    const { data: departmentDataList, isLoading: departmentsLoading } = useCollection<DepartmentData>(departmentsRef);

    const getWorker = (workerId: string) => workers?.find(w => w.id === workerId);
    const getDepartmentData = (deptName: string) => departmentDataList?.find(d => d.id === deptName);

    const isLoading = workersLoading || departmentsLoading || isRoleLoading;

    const departments: Department[] = ['Worship', 'Outreach', 'Relationship', 'Discipleship', 'Administration'];

    const handleSaveDepartment = async (departmentId: string, headId: string | null, description: string) => {
        try {
            await setDocumentNonBlocking(doc(firestore, 'departments', departmentId), {
                id: departmentId,
                headId: headId || '',
                description: description
            }, { merge: true });

            toast({ title: 'Department Updated', description: `${departmentId} department has been successfully updated.` });
            setIsAppointHeadSheetOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Update Failed', description: `Could not update the department.` });
        }
    };

    if (isLoading) {
        return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
    }

    if (!canManageMinistries) {
        return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>You do not have permission to view this page.</CardDescription></CardHeader></Card></AppLayout>;
    }

    return (
        <AppLayout>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-headline font-bold">Department Management</h1>
            </div>
            <p className="text-muted-foreground mt-2">Manage overarching departments and assign department heads.</p>

            <div className="space-y-6 mt-8">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {departments.map((departmentName) => {
                        const data = getDepartmentData(departmentName);
                        const head = data?.headId ? getWorker(data.headId) : null;
                        const members = workers?.filter(w => {
                            // Approximate full department member count (anyone with a ministry under this dept, but since ministry isn't joined here, we just use a generic representation or omit it if complex)
                            // We'll skip member count here since it requires joining ministries
                            return false;
                        }) || [];

                        return (
                            <Card key={departmentName} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                                <Building2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{departmentName}</CardTitle>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <p className="text-sm text-muted-foreground min-h-[40px]">{data?.description || "No description provided."}</p>

                                        <div>
                                            <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 pt-2 border-t">
                                                <UserCog className="h-4 w-4 text-muted-foreground" />
                                                Department Head
                                            </h4>
                                            {head ? (
                                                <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-lg">
                                                    <Avatar className="h-8 w-8 border bg-background">
                                                        <AvatarImage src={head.avatarUrl} alt={`${head.firstName} ${head.lastName}`} />
                                                        <AvatarFallback>{head.firstName?.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="truncate">
                                                        <p className="text-sm font-medium truncate">{`${head.firstName} ${head.lastName}`}</p>
                                                        <p className="text-[10px] text-muted-foreground truncate uppercase">{head.roleId}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-lg border border-dashed">
                                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                                        <Users className="h-4 w-4 text-muted-foreground/50" />
                                                    </div>
                                                    <p className="text-sm text-muted-foreground italic">No head assigned.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t mt-auto">
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => {
                                                setDepartmentToAppoint(departmentName);
                                                setIsAppointHeadSheetOpen(true);
                                            }}
                                        >
                                            Manage Department
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            <Sheet open={isAppointHeadSheetOpen} onOpenChange={setIsAppointHeadSheetOpen}>
                <SheetContent className="sm:max-w-md">
                    {departmentToAppoint && workers && (
                        <AppointHeadForm
                            departmentName={departmentToAppoint}
                            departmentData={getDepartmentData(departmentToAppoint) || null}
                            workers={workers}
                            onSave={handleSaveDepartment}
                            onClose={() => setIsAppointHeadSheetOpen(false)}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </AppLayout>
    );
}
