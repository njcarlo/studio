"use client";

import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { WorkerForm } from "@/components/workers/worker-form";
import { useRoles } from "@/hooks/use-roles";
import { useMinistries } from "@/hooks/use-ministries";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { useWorkers } from "@/hooks/use-workers";
import { LoaderCircle } from "lucide-react";
import { 
  createWorker as createWorkerSql, 
  createApproval as createApprovalSql,
  assignRolesToWorker
} from "@/actions/db";
import { useAuditLog } from "@/hooks/use-audit-log";
import type { Worker } from "@studio/types";

export default function NewWorkerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const { roles, isLoading: rolesLoading } = useRoles();
  const { ministries, isLoading: ministriesLoading } = useMinistries();
  const { workerProfile, canManageWorkers, isLoading: userRoleLoading } = useUserRole();
  const { createWorker: createWorkerHook } = useWorkers();

  const isLoading = rolesLoading || ministriesLoading || userRoleLoading;

  const handleSave = async (workerData: Partial<Worker>, roleIds: string[]) => {
    if (!workerData.firstName || !workerData.lastName || !workerData.email) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Please fill out first name, last name, and email.",
      });
      return;
    }

    try {
      // Generate a temporary workerId if not provided (like in the original logic)
      const workerId = String(20000 + Math.floor(Math.random() * 10000)).padStart(6, "0");
      const dataToSave = {
        ...workerData,
        workerId: workerData.workerId || workerId,
      };

      const newWorker = await createWorkerSql(dataToSave);
      
      // Assign multi-roles immediately after creation
      if (newWorker?.id) {
        await assignRolesToWorker(newWorker.id, roleIds);
      }

      await logAction(
        "Created Worker",
        "Workers",
        `Created worker: ${dataToSave.firstName} ${dataToSave.lastName} (EID: ${dataToSave.workerId})`,
        newWorker.id,
        `${dataToSave.firstName} ${dataToSave.lastName}`,
      );

      if (workerProfile && dataToSave.status === "Pending Approval") {
        await createApprovalSql({
          requester: `${workerProfile.firstName} ${workerProfile.lastName}`,
          type: "New Worker",
          details: `New worker registration for ${dataToSave.firstName} ${dataToSave.lastName}.`,
          status: "Pending",
          workerId: newWorker.id,
        });
        toast({
          title: "Worker Added",
          description: `${dataToSave.firstName} ${dataToSave.lastName} has been added and is now pending approval.`,
        });
      } else {
        toast({
          title: "Worker Added",
          description: `${dataToSave.firstName} ${dataToSave.lastName} has been added successfully.`,
        });
      }

      router.push("/workers");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error.message || "Could not save worker profile.",
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-10">
          <LoaderCircle className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!canManageWorkers) {
    return (
      <AppLayout>
        <div className="p-10 text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p>You do not have permission to manage workers.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <WorkerForm
          worker={null}
          roles={roles}
          ministries={ministries}
          onSave={handleSave}
          onClose={() => router.push("/workers")}
          canManage={canManageWorkers}
        />
      </div>
    </AppLayout>
  );
}
