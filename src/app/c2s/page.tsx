
"use client";

import React, { useState } from "react";
import { collection, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
    PlusCircle,
    Users,
    UserPlus,
    MoreHorizontal,
    Edit,
    Trash2,
    LoaderCircle,
    HeartHandshake,
    Search,
    Filter
} from "lucide-react";
import {
    useFirestore,
    useCollection,
    useMemoFirebase,
    useUser,
    addDocumentNonBlocking,
    updateDocumentNonBlocking,
    deleteDocumentNonBlocking
} from "@/firebase";
import type { C2SGroup, C2SMentee, Worker } from "@/lib/types";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- Group Form Component ---
const GroupForm = ({ group, workers, onSave }: { group: Partial<C2SGroup> | null, workers: Worker[], onSave: (data: any) => void }) => {
    const [formData, setFormData] = useState({
        name: group?.name || "",
        mentorId: group?.mentorId || ""
    });

    return (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                    id="group-name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alpha Group"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="mentor">Connect 2 Souls Mentor</Label>
                <Select value={formData.mentorId} onValueChange={val => setFormData({ ...formData, mentorId: val })}>
                    <SelectTrigger id="mentor">
                        <SelectValue placeholder="Select a mentor" />
                    </SelectTrigger>
                    <SelectContent>
                        {workers.map(w => (
                            <SelectItem key={w.id} value={w.id}>{w.firstName} {w.lastName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <SheetFooter className="mt-6">
                <SheetClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </SheetClose>
                <Button onClick={() => onSave(formData)}>Save Group</Button>
            </SheetFooter>
        </div>
    );
};

// --- Mentee Form Component ---
const MenteeForm = ({ mentee, groups, workers, onSave }: { mentee: Partial<C2SMentee> | null, groups: C2SGroup[], workers: Worker[], onSave: (data: any) => void }) => {
    const [formData, setFormData] = useState({
        firstName: mentee?.firstName || "",
        lastName: mentee?.lastName || "",
        email: mentee?.email || "",
        phone: mentee?.phone || "",
        status: mentee?.status || "In Progress",
        groupId: mentee?.groupId || "",
        mentorId: mentee?.mentorId || ""
    });

    return (
        <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input id="first-name" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input id="last-name" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="group">Group</Label>
                <Select value={formData.groupId} onValueChange={val => {
                    const group = groups.find(g => g.id === val);
                    setFormData({ ...formData, groupId: val, mentorId: group?.mentorId || "" });
                }}>
                    <SelectTrigger id="group">
                        <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                        {groups.map(g => (
                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={val => setFormData({ ...formData, status: val as any })}>
                    <SelectTrigger id="status">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Dropped">Dropped</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <SheetFooter className="mt-6">
                <SheetClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </SheetClose>
                <Button onClick={() => onSave(formData)}>Save Mentee</Button>
            </SheetFooter>
        </div>
    );
};

export default function C2SPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { canManageC2S } = useUserRole();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState("groups");
    const [isGroupSheetOpen, setIsGroupSheetOpen] = useState(false);
    const [isMenteeSheetOpen, setIsMenteeSheetOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<C2SGroup | null>(null);
    const [selectedMentee, setSelectedMentee] = useState<C2SMentee | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'group' | 'mentee', name: string } | null>(null);

    // --- Data Fetching ---
    const groupsRef = useMemoFirebase(() => user ? collection(firestore, "c2s_groups") : null, [firestore, user]);
    const { data: groups, isLoading: groupsLoading } = useCollection<C2SGroup>(groupsRef);

    const menteesRef = useMemoFirebase(() => user ? collection(firestore, "c2s_mentees") : null, [firestore, user]);
    const { data: mentees, isLoading: menteesLoading } = useCollection<C2SMentee>(menteesRef);

    const workersRef = useMemoFirebase(() => user ? collection(firestore, "workers") : null, [firestore, user]);
    const { data: workers, isLoading: workersLoading } = useCollection<Worker>(workersRef);

    const getWorker = (id: string) => workers?.find(w => w.id === id);
    const getGroup = (id: string) => groups?.find(g => g.id === id);

    const isLoading = groupsLoading || menteesLoading || workersLoading;

    // --- Handlers ---
    const handleSaveGroup = async (data: any) => {
        try {
            if (selectedGroup) {
                await updateDocumentNonBlocking(doc(firestore, "c2s_groups", selectedGroup.id), data);
                toast({ title: "Group Updated" });
            } else {
                await addDocumentNonBlocking(collection(firestore, "c2s_groups"), {
                    ...data,
                    menteeIds: [],
                    createdAt: serverTimestamp()
                });
                toast({ title: "Group Created" });
            }
            setIsGroupSheetOpen(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Action Failed", description: "Could not save group." });
        }
    };

    const handleSaveMentee = async (data: any) => {
        try {
            if (selectedMentee) {
                await updateDocumentNonBlocking(doc(firestore, "c2s_mentees", selectedMentee.id), data);
                toast({ title: "Mentee Updated" });
            } else {
                await addDocumentNonBlocking(collection(firestore, "c2s_mentees"), {
                    ...data,
                    createdAt: serverTimestamp()
                });
                toast({ title: "Mentee Added" });
            }
            setIsMenteeSheetOpen(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Action Failed", description: "Could not save mentee." });
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            const collectionName = itemToDelete.type === 'group' ? 'c2s_groups' : 'c2s_mentees';
            await deleteDocumentNonBlocking(doc(firestore, collectionName, itemToDelete.id));
            toast({ title: `${itemToDelete.type === 'group' ? 'Group' : 'Mentee'} Deleted` });
            setItemToDelete(null);
        } catch (error) {
            toast({ variant: "destructive", title: "Delete Failed" });
        }
    };

    if (!canManageC2S) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                    <HeartHandshake className="h-12 w-12 text-muted-foreground/50" />
                    <h2 className="text-xl font-semibold">Access Denied</h2>
                    <p className="text-muted-foreground text-center max-w-md">
                        You don't have permission to access the Connect 2 Souls Member Monitoring System.
                        Contact an administrator to request access.
                    </p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex flex-col space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Connect 2 Souls</h1>
                        <p className="text-muted-foreground mt-1">Manage Connect 2 Souls groups and mentees.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {activeTab === "groups" ? (
                            <Button onClick={() => { setSelectedGroup(null); setIsGroupSheetOpen(true); }} className="shadow-lg shadow-primary/20">
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Group
                            </Button>
                        ) : (
                            <Button onClick={() => { setSelectedMentee(null); setIsMenteeSheetOpen(true); }} className="shadow-lg shadow-primary/20">
                                <UserPlus className="mr-2 h-4 w-4" /> Add Mentee
                            </Button>
                        )}
                    </div>
                </div>

                <Tabs defaultValue="groups" onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
                        <TabsTrigger value="groups" className="text-sm font-medium">
                            <Users className="mr-2 h-4 w-4" /> Groups
                        </TabsTrigger>
                        <TabsTrigger value="mentees" className="text-sm font-medium">
                            <UserPlus className="mr-2 h-4 w-4" /> Mentees
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="groups" className="mt-0">
                        {isLoading ? (
                            <div className="flex justify-center py-12"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {groups?.map(group => {
                                    const mentor = getWorker(group.mentorId);
                                    const groupMentees = mentees?.filter(m => m.groupId === group.id) || [];

                                    return (
                                        <Card key={group.id} className="overflow-hidden border-border/50 transition-all hover:shadow-md">
                                            <CardHeader className="pb-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                                                            <Users className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-lg font-bold">{group.name}</CardTitle>
                                                            <CardDescription>Created {group.createdAt instanceof Timestamp ? group.createdAt.toDate().toLocaleDateString() : 'recently'}</CardDescription>
                                                        </div>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onSelect={() => setTimeout(() => { setSelectedGroup(group); setIsGroupSheetOpen(true); }, 100)}>
                                                                <Edit className="mr-2 h-4 w-4" /> Edit Group
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onSelect={() => setTimeout(() => setItemToDelete({ id: group.id, type: 'group', name: group.name }), 100)}
                                                                className="text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Group
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-6 pb-6">
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mentor</h4>
                                                    {mentor ? (
                                                        <div className="flex items-center gap-3 bg-secondary/30 p-2.5 rounded-lg">
                                                            <Avatar className="h-9 w-9 border border-background">
                                                                <AvatarImage src={mentor.avatarUrl} alt={mentor.firstName} />
                                                                <AvatarFallback>{mentor.firstName.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="text-sm font-semibold">{mentor.firstName} {mentor.lastName}</p>
                                                                <p className="text-[10px] text-muted-foreground">{mentor.email}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-yellow-600 italic">No mentor assigned</p>
                                                    )}
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mentees ({groupMentees.length})</h4>
                                                    </div>
                                                    <div className="flex -space-x-3 overflow-hidden p-1">
                                                        {groupMentees.slice(0, 5).map(m => (
                                                            <Avatar key={m.id} className="inline-block h-8 w-8 ring-2 ring-background grayscale-[0.5] hover:grayscale-0 transition-all cursor-pointer">
                                                                <AvatarFallback className="bg-muted text-[10px]">{m.firstName.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                        ))}
                                                        {groupMentees.length > 5 && (
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted ring-2 ring-background text-[10px] font-medium">
                                                                +{groupMentees.length - 5}
                                                            </div>
                                                        )}
                                                        {groupMentees.length === 0 && (
                                                            <p className="text-xs text-muted-foreground py-1">No mentees yet</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                        {!isLoading && groups?.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-2xl bg-muted/5">
                                <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-medium">No groups found</h3>
                                <p className="text-muted-foreground mb-6">Start by creating your first Connect 2 Souls group.</p>
                                <Button onClick={() => { setSelectedGroup(null); setIsGroupSheetOpen(true); }}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Create Group
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="mentees" className="mt-0">
                        <Card className="border-border/50 shadow-sm overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-4 border-b">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <CardTitle className="text-xl">Mentee Directory</CardTitle>
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Search mentees..." className="pl-9 w-[200px] md:w-[300px] h-9" />
                                        </div>
                                        <Button variant="outline" size="sm" className="h-9">
                                            <Filter className="mr-2 h-3.5 w-3.5" /> Filter
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {menteesLoading ? (
                                    <div className="flex justify-center py-12"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left border-collapse">
                                            <thead>
                                                <tr className="bg-muted/50 text-muted-foreground font-medium border-b border-border/50">
                                                    <th className="px-6 py-4">Mentee</th>
                                                    <th className="px-6 py-4">Group / Mentor</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4">Joined</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                {mentees?.map(mentee => {
                                                    const group = getGroup(mentee.groupId);
                                                    const mentor = getWorker(mentee.mentorId);

                                                    return (
                                                        <tr key={mentee.id} className="hover:bg-muted/5 transition-colors group">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                                        {mentee.firstName.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-semibold text-foreground">{mentee.firstName} {mentee.lastName}</div>
                                                                        <div className="text-xs text-muted-foreground">{mentee.email}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div>
                                                                    <div className="font-medium text-foreground">{group?.name || 'Unassigned'}</div>
                                                                    <div className="text-xs text-muted-foreground italic">{mentor ? `under ${mentor.firstName}` : '-'}</div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <Badge variant={
                                                                    mentee.status === 'Completed' ? 'default' :
                                                                        mentee.status === 'Dropped' ? 'destructive' : 'secondary'
                                                                } className="font-medium px-2.5 py-0.5 rounded-full text-[11px]">
                                                                    {mentee.status}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-6 py-4 text-muted-foreground text-xs font-mono">
                                                                {mentee.createdAt instanceof Timestamp ? mentee.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onSelect={() => setTimeout(() => { setSelectedMentee(mentee); setIsMenteeSheetOpen(true); }, 100)}>
                                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onSelect={() => setTimeout(() => setItemToDelete({ id: mentee.id, type: 'mentee', name: `${mentee.firstName} ${mentee.lastName}` }), 100)}
                                                                            className="text-destructive"
                                                                        >
                                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {!menteesLoading && mentees?.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <UserPlus className="h-10 w-10 text-muted-foreground/30 mb-3" />
                                        <p className="text-muted-foreground">No mentees registered yet.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Sheets & Dialogs */}
            <Sheet open={isGroupSheetOpen} onOpenChange={setIsGroupSheetOpen}>
                <SheetContent className="sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle className="font-headline text-2xl">{selectedGroup ? 'Edit Group' : 'Create New Group'}</SheetTitle>
                        <SheetDescription>Configure Connect 2 Souls group details and assign a mentor.</SheetDescription>
                    </SheetHeader>
                    <GroupForm
                        group={selectedGroup}
                        workers={workers || []}
                        onSave={handleSaveGroup}
                    />
                </SheetContent>
            </Sheet>

            <Sheet open={isMenteeSheetOpen} onOpenChange={setIsMenteeSheetOpen}>
                <SheetContent className="sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle className="font-headline text-2xl">{selectedMentee ? 'Edit Mentee' : 'Register Mentee'}</SheetTitle>
                        <SheetDescription>Enter mentee information and assign to a group.</SheetDescription>
                    </SheetHeader>
                    <MenteeForm
                        mentee={selectedMentee}
                        groups={groups || []}
                        workers={workers || []}
                        onSave={handleSaveMentee}
                    />
                </SheetContent>
            </Sheet>

            <AlertDialog open={!!itemToDelete} onOpenChange={open => !open && setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the {itemToDelete?.type} <strong>{itemToDelete?.name}</strong>.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
