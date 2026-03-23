"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@studio/ui";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@studio/ui";
import { Label } from "@studio/ui";
import { Input } from "@studio/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@studio/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@studio/ui";
import { Mail } from "lucide-react";
import type { Worker, Role, Ministry } from "@studio/types";
import { WorkerActivityLog } from "./worker-activity-log";

interface WorkerFormProps {
  worker: Partial<Worker> | null;
  roles: Role[];
  ministries: Ministry[];
  onSave: (worker: Partial<Worker>) => void;
  onClose: () => void;
  onResetPassword?: (worker: Worker) => void;
  canManage: boolean;
}

export function WorkerForm({
  worker,
  roles,
  ministries,
  onSave,
  onClose,
  onResetPassword,
  canManage,
}: WorkerFormProps) {
  const [formData, setFormData] = useState<Partial<Worker>>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    roleId: "viewer",
    status: canManage ? "Active" : "Pending Approval",
    avatarUrl: `https://picsum.photos/seed/${Math.random()}/100/100`,
    majorMinistryId: "",
    minorMinistryId: "",
    birthDate: "",
  });

  useEffect(() => {
    if (worker) {
      setFormData({
        ...worker,
        firstName: worker.firstName || "",
        lastName: worker.lastName || "",
        email: worker.email || "",
        phone: worker.phone || "",
        roleId: worker.roleId || "viewer",
        majorMinistryId: worker.majorMinistryId || "",
        minorMinistryId: worker.minorMinistryId || "",
        birthDate: worker.birthDate || "",
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        roleId: "viewer",
        status: canManage ? "Active" : "Pending Approval",
        avatarUrl: `https://picsum.photos/seed/${Math.random()}/100/100`,
        majorMinistryId: "",
        minorMinistryId: "",
        birthDate: "",
      });
    }
  }, [worker, canManage]);

  const groupedMinistries = useMemo(() => {
    const groups: Record<string, Ministry[]> = {};
    ministries.forEach((m) => {
      const dept = m.department || "Other";
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(m);
    });
    return groups;
  }, [ministries]);

  const MinistrySelect = ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) => (
    <Select
      value={value || "none"}
      onValueChange={(v) => onChange(v === "none" ? "" : v)}
    >
      <SelectTrigger className="col-span-3">
        <SelectValue placeholder="Select a ministry" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">None</SelectItem>
        {Object.entries(groupedMinistries).map(([dept, mins]) => (
          <SelectGroup key={dept}>
            <SelectLabel className="text-muted-foreground uppercase text-xs tracking-wider">
              {dept}
            </SelectLabel>
            {[...mins]
              .sort((a, b) => {
                const wA = a.weight ?? 0;
                const wB = b.weight ?? 0;
                if (wA !== wB) return wA - wB;
                return a.name.localeCompare(b.name);
              })
              .map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );

  const fields = (
    <div className="grid gap-4 py-1">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="firstName" className="text-right">First Name</Label>
        <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="lastName" className="text-right">Last Name</Label>
        <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="email" className="text-right">Email</Label>
        <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="phone" className="text-right">Phone</Label>
        <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="birthDate" className="text-right">Date of Birth</Label>
        <Input id="birthDate" type="date" value={formData.birthDate || ""} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="role" className="text-right">Role</Label>
        <Select value={formData.roleId} onValueChange={(v) => setFormData({ ...formData, roleId: v })} disabled={!canManage}>
          <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a role" /></SelectTrigger>
          <SelectContent>{roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="status" className="text-right">Status</Label>
        <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })} disabled={!canManage && !worker}>
          <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="Pending Approval">Pending Approval</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Major Ministry</Label>
        <MinistrySelect value={formData.majorMinistryId || ""} onChange={(v) => setFormData({ ...formData, majorMinistryId: v })} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Minor Ministry</Label>
        <MinistrySelect value={formData.minorMinistryId || ""} onChange={(v) => setFormData({ ...formData, minorMinistryId: v })} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="employmentType" className="text-right">Worker Type</Label>
        <Select value={formData.employmentType || "Volunteer"} onValueChange={(v: any) => setFormData({ ...formData, employmentType: v })} disabled={!canManage}>
          <SelectTrigger className="col-span-3"><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Full-Time">Full-Time</SelectItem>
            <SelectItem value="On-Call">On-Call</SelectItem>
            <SelectItem value="Volunteer">Volunteer</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <>
      <SheetHeader className="pb-2">
        <SheetTitle className="font-headline">{worker ? "Edit Worker" : "Add New Worker"}</SheetTitle>
        <SheetDescription>{worker ? "Update the details for this worker." : "Fill in the details for the new worker."}</SheetDescription>
      </SheetHeader>

      {worker ? (
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="mt-0 space-y-4">
            {fields}
            <SheetFooter className="flex-col sm:flex-row gap-2 pt-4">
              {worker && onResetPassword && (
                <Button type="button" variant="outline" onClick={() => onResetPassword(worker as Worker)} className="mr-auto">
                  <Mail className="mr-2 h-4 w-4" /> Send Reset Link
                </Button>
              )}
              <div className="flex gap-2">
                <SheetClose asChild><Button type="button" variant="secondary">Cancel</Button></SheetClose>
                <Button onClick={() => onSave(formData)}>Save changes</Button>
              </div>
            </SheetFooter>
          </TabsContent>
          <TabsContent value="activity">
            <WorkerActivityLog workerId={worker.id!} />
            <div className="mt-6 pt-4 border-t text-center">
              <SheetClose asChild><Button variant="secondary" className="w-full">Close</Button></SheetClose>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <>
          <div className="grid gap-4 py-4">{fields}</div>
          <SheetFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 ml-auto">
              <SheetClose asChild><Button type="button" variant="secondary">Cancel</Button></SheetClose>
              <Button onClick={() => onSave(formData)}>Save changes</Button>
            </div>
          </SheetFooter>
        </>
      )}
    </>
  );
}
