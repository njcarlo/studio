"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useUserRole } from "@/hooks/use-user-role";
import { useAuthStore } from "@studio/store";
import { useToast } from "@/hooks/use-toast";
import { updateWorker } from "@/actions/db";
import { useMinistries } from "@/hooks/use-ministries";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "@studio/ui";
import { LoaderCircle } from "lucide-react";

export default function ProfilePage() {
  const { workerProfile, isLoading } = useUserRole();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const { ministries } = useMinistries();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (workerProfile) {
      setFirstName(workerProfile.firstName || "");
      setLastName(workerProfile.lastName || "");
      setPhone(workerProfile.phone || "");
      setAddress((workerProfile as any).address || "");
    }
  }, [workerProfile]);

  const handleSave = async () => {
    if (!workerProfile?.id) return;
    setSaving(true);
    try {
      await updateWorker(workerProfile.id, { firstName, lastName, phone, address });
      toast({ title: "Profile Updated", description: "Your information has been saved." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!workerProfile) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto py-12 text-center space-y-4">
          <p className="text-muted-foreground">No worker profile is linked to your account.</p>
          <Button onClick={() => window.location.href = '/workers'}>Go to Workers</Button>
        </div>
      </AppLayout>
    );
  }

  const majorMinistry = ministries?.find((m) => m.id === workerProfile.majorMinistryId)?.name ?? "—";
  const minorMinistry = ministries?.find((m) => m.id === workerProfile.minorMinistryId)?.name ?? "—";

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto space-y-6 py-8">
        <h1 className="text-3xl font-headline font-bold">My Profile</h1>

        <Card>
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={workerProfile.email || user?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ministry & Role</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Major Ministry</span><span>{majorMinistry}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Minor Ministry</span><span>{minorMinistry}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Worker ID</span><span>{workerProfile.workerId || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span>{workerProfile.status}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Employment Type</span><span>{(workerProfile as any).employmentType || "—"}</span></div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Changes
        </Button>
      </div>
    </AppLayout>
  );
}
