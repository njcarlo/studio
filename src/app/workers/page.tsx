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
import type { User, Role, Ministry } from "@/lib/types";
import { useFirestore, useCollection, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/use-user-role";

const UserForm = ({ user, roles, ministries, onSave, onClose }: { user: Partial<User> | null; roles: Role[]; ministries: Ministry[]; onSave: (user: Partial<User>) => void; onClose: () => void; }) => {
  const [formData, setFormData] = useState<Partial<User>>({
    firstName: '', lastName: '', email: '', phone: '', roleId: 'viewer', status: 'Pending Approval', avatarUrl: `https://picsum.photos/seed/${Math.random()}/100/100`,
    primaryMinistryId: '', secondaryMinistryId: ''
  });

  useEffect(() => {
    if (user) {
        setFormData({
            ...user,
            primaryMinistryId: user.primaryMinistryId || '',
            secondaryMinistryId: user.secondaryMinistryId || '',
        });
    } else {
        setFormData({
            firstName: '', lastName: '', email: '', phone: '', roleId: 'viewer', status: 'Pending Approval', avatarUrl: `https://picsum.photos/seed/${Math.random()}/100/100`,
            primaryMinistryId: '', secondaryMinistryId: ''
        });
    }
  }, [user]);

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-headline">{user ? 'Edit User' : 'Add New User'}</SheetTitle>
        <SheetDescription>
          {user ? 'Update the details for this user.' : 'Fill in the details for the new user.'}
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
          <Select value={formData.roleId} onValueChange={(value: string) => setFormData({...formData, roleId: value})}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map(role => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}
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

export default function WorkersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { userProfile } = useUserRole();
  const usersRef = useMemoFirebase(() => collection(firestore, "users"), [firestore]);
  const { data: users, isLoading } = useCollection<User>(usersRef);

  const rolesRef = useMemoFirebase(() => collection(firestore, "roles"), [firestore]);
  const { data: rolesData } = useCollection<Role>(rolesRef);
  const roles = rolesData || [];

  const ministriesRef = useMemoFirebase(() => collection(firestore, "ministries"), [firestore]);
  const { data: ministriesData } = useCollection<Ministry>(ministriesRef);
  const ministries = ministriesData || [];

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleAddNew = () => {
    setSelectedUser(null);
    setIsSheetOpen(true);
  };
  
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsSheetOpen(true);
  };
  
  const handleDelete = (userId: string) => {
    if (!userId) return;
    deleteDocumentNonBlocking(doc(firestore, "users", userId));
    toast({
        title: "User Deleted",
        description: "The user profile has been removed."
    });
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    if (!userData.firstName || !userData.lastName || !userData.email) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Please fill out first name, last name, and email.",
      });
      return;
    }

    const dataToSave = { ...userData };
    if (dataToSave.primaryMinistryId === 'none') {
      dataToSave.primaryMinistryId = '';
    }
    if (dataToSave.secondaryMinistryId === 'none') {
      dataToSave.secondaryMinistryId = '';
    }

    try {
      if (selectedUser?.id) {
          await updateDocumentNonBlocking(doc(firestore, "users", selectedUser.id), dataToSave);
          toast({
              title: "User Updated",
              description: `${dataToSave.firstName} ${dataToSave.lastName}'s profile has been updated.`
          });
      } else {
          const newWorkerId = String(20000 + (users?.length || 0)).padStart(6, '0');
          const dataToSaveWithId = { ...dataToSave, workerId: newWorkerId, createdAt: serverTimestamp() };
          const newUserRef = await addDocumentNonBlocking(collection(firestore, "users"), dataToSaveWithId);
          if (newUserRef && userProfile) {
            await addDocumentNonBlocking(collection(firestore, "approvals"), {
              requester: `${userProfile.firstName} ${userProfile.lastName}`,
              type: 'New Worker',
              details: `New user registration for ${dataToSave.firstName} ${dataToSave.lastName}.`,
              date: serverTimestamp(),
              status: 'Pending',
              workerId: newUserRef.id
            });
          }
          toast({
              title: "User Added",
              description: `${dataToSave.firstName} ${dataToSave.lastName} has been added and is now pending approval.`
          });
      }
      setIsSheetOpen(false);
    } catch (error) {
      console.error("Failed to save user:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save user profile. Check console for details.",
      });
    }
  };

  const getRoleName = (roleId: string) => {
    return roles.find(r => r.id === roleId)?.name || roleId;
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-headline font-bold">User Profiles</h1>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add User
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
            {users && users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback>{user.firstName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {`${user.firstName} ${user.lastName}`}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{user.workerId}</TableCell>
                <TableCell>{getRoleName(user.roleId)}</TableCell>
                <TableCell>
                   <Badge variant={user.status === 'Active' ? 'default' : 'secondary'} className={
                       user.status === 'Active' ? 'bg-green-100 text-green-800' : 
                       user.status === 'Pending Approval' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                   }>
                    {user.status}
                   </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{user.email}</span>
                    <span className="text-muted-foreground">{user.phone}</span>
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
                      <DropdownMenuItem onSelect={() => handleEdit(user)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleDelete(user.id)} className="text-destructive">Delete</DropdownMenuItem>
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
          <UserForm 
            key={selectedUser?.id || 'new-user-form'}
            user={selectedUser} 
            roles={roles}
            ministries={ministries} 
            onSave={handleSaveUser} 
            onClose={() => setIsSheetOpen(false)} />
        </SheetContent>
      </Sheet>

    </AppLayout>
  );
}
