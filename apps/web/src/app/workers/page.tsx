"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@studio/ui";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@studio/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@studio/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@studio/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@studio/ui";
import { Badge } from "@studio/ui";
import {
  MoreHorizontal,
  PlusCircle,
  LoaderCircle,
  Upload,
  LogIn,
  Users,
  UserCheck,
  UserX,
  Users2,
  Building2,
  Mail,
  Trash2,
  ArrowRightLeft,
  X,
  Ticket,
} from "lucide-react";
import { startOfWeek, endOfWeek } from "date-fns";
import { getWeeklyWeekdayCount, getSundayCount } from "@studio/ui";
import { Checkbox } from "@studio/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@studio/ui";
import { Label } from "@studio/ui";
import { Input } from "@studio/ui";
import type { Worker, Role, Ministry } from "@studio/types";
import { useAuthStore } from "@studio/store";
import { supabase } from "@studio/database";
import { useWorkers, useWorkerStats } from "@/hooks/use-workers";
import { useRoles } from "@/hooks/use-roles";
import { useMinistries } from "@/hooks/use-ministries";
import { useDepartments } from "@/hooks/use-departments";
import { useMealStubs } from "@/hooks/use-meal-stubs";
import { useAttendance } from "@/hooks/use-attendance";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/use-user-role";
import { useAuditLog } from "@/hooks/use-audit-log";
import { useImpersonation } from "@/hooks/use-impersonation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@studio/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@studio/ui";
import { format, subDays } from "date-fns";
import { useApprovals } from "@/hooks/use-approvals";
import {
  updateWorker as updateWorkerSql,
  createWorker as createWorkerSql,
  updateWorkersMinistries,
  createMealStub as createMealStubSql,
  deleteWorker as deleteWorkerSql,
  deleteWorkers as deleteWorkersSql,
  createApproval as createApprovalSql,
} from "@/actions/db";

import { ImportSheet } from "@/components/workers/import-sheet";
import { BatchMinistrySheet } from "@/components/workers/batch-ministry-sheet";
import { BatchMealStubSheet } from "@/components/workers/batch-meal-stub-sheet";

export default function WorkersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const {
    workerProfile,
    canManageWorkers,
    isSuperAdmin,
    allRoles,
    isLoading: isRoleLoading,
  } = useUserRole();
  const { startImpersonation } = useImpersonation();
  const { logAction } = useAuditLog();
  const { isMealStubAssigner, canManageAllMealStubs } = useUserRole();

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<'workerId' | 'name'>('workerId');
  const [sortField, setSortField] = useState("workerId");
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Debounce search — only fire query after user stops typing for 400ms
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const formatWorkerId = (id: string | null | undefined) => {
    if (!id) return '—';
    const num = parseInt(id, 10);
    if (isNaN(num)) return id;
    return String(num).padStart(6, '0');
  };

  const {
    workers: allWorkers,
    pagination,
    isLoading: workersLoading,
    updateWorker: updateWorkerSql,
    createWorker: createWorkerSql,
    deleteWorker: deleteWorkerSql,
    deleteWorkers: deleteWorkersSql,
    error: workersError,
  } = useWorkers({
    page: currentPage,
    limit: itemsPerPage,
    search: searchQuery,
    searchMode,
    sortField,
    sortDir,
  });

  const { ministries: ministries, isLoading: ministriesLoading } =
    useMinistries();

  const { roles: roles, isLoading: rolesLoading } = useRoles();

  // Meal stubs only fetched when batch sheet is open — avoids loading all stubs on page load
  const { mealStubs: allMealStubs } = useMealStubs({
    dateFrom: subDays(new Date(), 30),
  });
  const { createApproval: createApprovalSql } = useApprovals();

  const { departments: allDepartments, isLoading: departmentsLoading } =
    useDepartments();

  const departmentDataList = allDepartments;

  const isLoading =
    rolesLoading ||
    ministriesLoading ||
    isRoleLoading ||
    departmentsLoading;

  const isWorkersLoading = workersLoading;

  // Detect Department Head by role name OR explicit assignment
  const explicitlyAssignedDepartment = useMemo(() => {
    if (!workerProfile?.id || !departmentDataList) return null;
    return (
      (departmentDataList as any[]).find(
        (d) => d.headId === workerProfile.id,
      ) || null
    );
  }, [workerProfile, departmentDataList]);

  const isDepartmentHead = useMemo(() => {
    if (explicitlyAssignedDepartment) return true;
    if (!workerProfile?.roleId || !roles.length) return false;
    const roleName =
      roles.find((r) => r.id === workerProfile.roleId)?.name || "";
    return roleName.toLowerCase().includes("department head");
  }, [workerProfile, roles, explicitlyAssignedDepartment]);

  // Find the department of this user
  const userDepartment = useMemo(() => {
    if (explicitlyAssignedDepartment) return explicitlyAssignedDepartment.id;

    if (!workerProfile?.majorMinistryId || !ministries.length) return null;
    return (
      ministries.find((m) => m.id === workerProfile.majorMinistryId)
        ?.department || null
    );
  }, [workerProfile, ministries, explicitlyAssignedDepartment]);

  // All ministries in the department head's department
  const departmentMinistries = useMemo(() => {
    if (!isDepartmentHead || !userDepartment) return [];
    return ministries.filter((m) => m.department === userDepartment);
  }, [isDepartmentHead, userDepartment, ministries]);

  // Use specialized stats hook for summary cards to avoid fetching all workers
  const { data: statsData } = useWorkerStats(
    isSuperAdmin || (canManageWorkers && !workerProfile?.majorMinistryId)
      ? undefined
      : isDepartmentHead
        ? departmentMinistries.map((m) => m.id)
        : ([
            workerProfile?.majorMinistryId,
            workerProfile?.minorMinistryId,
          ].filter(Boolean) as string[]),
  );

  const workers = allWorkers;

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [isBatchMoveSheetOpen, setIsBatchMoveSheetOpen] = useState(false);
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
  const [isBatchMealStubSheetOpen, setIsBatchMealStubSheetOpen] =
    useState(false);
  const [isAssigningStubs, setIsAssigningStubs] = useState(false);

  // Form state for Add Worker sheet
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [status, setStatus] = useState("Pending Approval");
  const [majorMinistryId, setMajorMinistryId] = useState("");
  const [minorMinistryId, setMinorMinistryId] = useState("");
  const [employmentType, setEmploymentType] = useState("Volunteer");

  // Reset form when selectedWorker changes
  useEffect(() => {
    if (!selectedWorker) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setWorkerId("");
      setRoleId("");
      setStatus("Pending Approval");
      setMajorMinistryId("");
      setMinorMinistryId("");
      setEmploymentType("Volunteer");
    }
  }, [selectedWorker]);

  const handleAddNew = () => {
    setSelectedWorker(null);
    setIsSheetOpen(true);
  };

  const handleWorkerFormSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({ variant: "destructive", title: "Missing Fields", description: "First name and last name are required." });
      return;
    }
    if (!email.trim()) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Email is required." });
      return;
    }
    if (!majorMinistryId) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please select a Major Ministry." });
      return;
    }

    try {
      const newWorkerId =
        workerId ||
        String(100000 + (allWorkers?.length || 0)).slice(-6);

      const firstRole = roles?.[0]?.id;
      await createWorkerSql({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || "N/A",
        roleId: roleId || firstRole || null,
        status: status || "Pending Approval",
        majorMinistryId,
        minorMinistryId: minorMinistryId || majorMinistryId,
        employmentType: employmentType || "Volunteer",
        workerId: newWorkerId,
        avatarUrl: `https://picsum.photos/seed/${newWorkerId}/100/100`,
      });

      toast({ title: "Worker Created", description: `${firstName} ${lastName} has been added.` });
      setIsSheetOpen(false);
      setSelectedWorker(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Create Worker",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };

  const handleOpenImport = () => {
    setIsImportSheetOpen(true);
  };

  const handleEdit = (worker: Worker) => {
    router.push(`/workers/${worker.id}/edit`);
  };

  const handlePasswordReset = async (worker: Worker) => {
    if (!worker.email) {
      toast({
        variant: "destructive",
        title: "No email found",
        description: "This worker does not have an email address set.",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        worker.email,
        {
          redirectTo: `${window.location.origin}/auth/update-password`,
        },
      );

      if (error) throw error;

      toast({
        title: "Reset link sent",
        description: `A password reset link has been sent to ${worker.email}.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to send reset link",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };
  const handleImpersonate = (worker: Worker) => {
    toast({
      title: "Impersonation Started",
      description: `You are now viewing the app as ${worker.firstName} ${worker.lastName}.`,
    });
    startImpersonation(worker.id);
  };

  const handleDelete = async (workerId: string) => {
    if (!workerId) return;
    const w = allWorkers?.find((w) => w.id === workerId);

    try {
      await deleteWorkerSql(workerId);
      if (w) {
        await logAction(
          "Deleted Worker (SQL)",
          "Workers",
          `Removed worker profile for ${w.firstName} ${w.lastName} (ID: ${w.workerId})`,
          workerId,
          `${w.firstName} ${w.lastName}`,
        );
      }
      toast({
        title: "Worker Deleted",
        description: "The worker profile has been removed from SQL database.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Could not delete worker from SQL database.",
      });
    }
  };

  const handleBatchDelete = async () => {
    try {
      await deleteWorkersSql(selectedWorkerIds);
      await logAction(
        "Batch Deleted Workers (SQL)",
        "Workers",
        `Deleted ${selectedWorkerIds.length} workers from SQL.`,
      );
      toast({
        title: "Batch Delete Successful",
        description: `${selectedWorkerIds.length} workers have been removed from SQL database.`,
      });
      setSelectedWorkerIds([]);
      setIsBatchDeleteDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Batch Delete Failed",
        description: "Could not delete workers from SQL database.",
      });
    }
  };

  const handleBatchMove = async (major: string, minor: string) => {
    try {
      if (!isSuperAdmin) {
        const promises = selectedWorkerIds.map(async (id) => {
          const w = allWorkers?.find((worker) => worker.id === id);
          if (!w) return;

          const newMajorId =
            major === "unchanged"
              ? w.majorMinistryId || ""
              : major === "none"
                ? ""
                : major;
          const newMinorId =
            minor === "unchanged"
              ? w.minorMinistryId || ""
              : minor === "none"
                ? ""
                : minor;

          if (
            newMajorId === (w.majorMinistryId || "") &&
            newMinorId === (w.minorMinistryId || "")
          )
            return;

          const details =
            `Batch ministry change request for ${w.firstName} ${w.lastName}.\n` +
            (major !== "unchanged"
              ? `Major: ${ministries.find((m) => m.id === w.majorMinistryId)?.name || "None"} -> ${ministries.find((m) => m.id === newMajorId)?.name || "None"}\n`
              : "") +
            (minor !== "unchanged"
              ? `Minor: ${ministries.find((m) => m.id === w.minorMinistryId)?.name || "None"} -> ${ministries.find((m) => m.id === newMinorId)?.name || "None"}`
              : "");

          return createApprovalSql({
            requester: `${workerProfile?.firstName} ${workerProfile?.lastName}`,
            type: "Ministry Change",
            details,
            status: "Pending Outgoing Approval",
            workerId: w.id,
            oldMajorId: w.majorMinistryId || "",
            newMajorId,
            oldMinorId: w.minorMinistryId || "",
            newMinorId,
            outgoingApproved: false,
            incomingApproved: false,
          });
        });

        await Promise.all(promises);
        await logAction(
          "Requested Batch Ministry Change",
          "Workers",
          `Requested ministry change for ${selectedWorkerIds.length} workers.`,
        );
        toast({
          title: "Changes Pending Approval",
          description:
            "Batch ministry changes have been submitted for approval by the respective ministry heads.",
        });
      } else {
        const majorVal =
          major === "unchanged" ? undefined : major === "none" ? "" : major;
        const minorVal =
          minor === "unchanged" ? undefined : minor === "none" ? "" : minor;
        await updateWorkersMinistries(selectedWorkerIds, majorVal, minorVal);
        await logAction(
          "Batch Moved Workers (SQL)",
          "Workers",
          `Updated ministries for ${selectedWorkerIds.length} workers.`,
        );
        toast({
          title: "Batch Update Successful",
          description: `Updated ${selectedWorkerIds.length} workers.`,
        });
      }
      setSelectedWorkerIds([]);
      setIsBatchMoveSheetOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Batch Update Failed",
        description: "Could not update workers.",
      });
    }
  };

  const handleBatchMealStub = async (
    type: "weekday" | "sunday",
    count: number,
  ) => {
    if (isAssigningStubs) return;
    setIsAssigningStubs(true);
    let totalIssued = 0;
    let skipped = 0;

    try {
      const promises = selectedWorkerIds.map(async (id) => {
        const w = allWorkers?.find((worker) => worker.id === id);
        if (!w) return;

        const allStubs = allMealStubs || [];
        const current =
          getWeeklyWeekdayCount(allStubs, id) + getSundayCount(allStubs, id);

        const ministry = ministries.find(
          (m) => m.id === w.majorMinistryId || m.id === w.minorMinistryId,
        );
        const limit = ministry?.mealStubWeeklyLimit || 7;

        const remaining = limit - current;
        if (remaining <= 0) {
          skipped++;
          return;
        }

        const toIssue = Math.min(count, remaining);

        for (let i = 0; i < toIssue; i++) {
          await createMealStubSql({
            workerId: id as any,
            workerName: `${w.firstName} ${w.lastName}`,
            status: "Issued",
            assignedBy: workerProfile?.id,
            assignedByName: `${workerProfile?.firstName} ${workerProfile?.lastName}`,
            stubType: type,
          });
          totalIssued++;
        }
      });

      await Promise.all(promises);

      toast({
        title: "Batch Stubs Issued",
        description: `Successfully issued ${totalIssued} total stubs. ${skipped > 0 ? `${skipped} workers were skipped (limit reached).` : ""}`,
      });

      await logAction(
        "Batch Issued Meal Stubs",
        "MealStubs",
        `Issued ${totalIssued} ${type} stubs to ${selectedWorkerIds.length} workers.`,
      );
      setIsBatchMealStubSheetOpen(false);
      setSelectedWorkerIds([]);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Batch Assignment Failed",
        description: "Could not issue stubs.",
      });
    } finally {
      setIsAssigningStubs(false);
    }
  };

  const toggleSelectAll = (currentWorkers: Worker[]) => {
    if (
      selectedWorkerIds.length === currentWorkers.length &&
      currentWorkers.length > 0
    ) {
      setSelectedWorkerIds([]);
    } else {
      setSelectedWorkerIds(currentWorkers.map((w) => w.id));
    }
  };

  const toggleSelectWorker = (id: string) => {
    setSelectedWorkerIds((prev) =>
      prev.includes(id) ? prev.filter((wId) => wId !== id) : [...prev, id],
    );
  };

  const handleImportWorkers = (csvData: string) => {
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const newWorkers = results.data;
        if (newWorkers.length === 0) {
          toast({
            variant: "destructive",
            title: "No Data Found",
            description: "The CSV data was empty or invalid.",
          });
          return;
        }

        try {
          let approvalCount = 0;
          let importedCount = 0;

          for (let index = 0; index < newWorkers.length; index++) {
            const newWorker = newWorkers[index] as any;
            if (
              !newWorker.firstName ||
              !newWorker.lastName ||
              !newWorker.email
            ) {
              console.warn("Skipping invalid row:", newWorker);
              continue;
            }

            const workerId = String(
              100000 + (allWorkers?.length || 0) + index,
            ).slice(-6);

            const created = await createWorkerSql({
              firstName: newWorker.firstName || "",
              lastName: newWorker.lastName || "",
              email: newWorker.email || "",
              phone: newWorker.phone || "",
              roleId: newWorker.roleId || "viewer",
              status: newWorker.status || "Pending Approval",
              majorMinistryId: newWorker.majorMinistryId || "",
              minorMinistryId: newWorker.minorMinistryId || "",
              employmentType: newWorker.employmentType || "Volunteer",
              workerId,
              avatarUrl: `https://picsum.photos/seed/${workerId}/100/100`,
            });

            importedCount++;

            if (
              (newWorker.status || "Pending Approval") === "Pending Approval"
            ) {
              approvalCount++;
              await createApprovalSql({
                requester: workerProfile
                  ? `${workerProfile.firstName} ${workerProfile.lastName}`
                  : "System Import",
                type: "New Worker",
                details: `New worker import: ${newWorker.email}`,
                status: "Pending",
                workerId: created.id,
              });
            }
          }

          toast({
            title: "Import Successful",
            description: `${importedCount} workers were imported. ${approvalCount} approval requests were created.`,
          });
          setIsImportSheetOpen(false);
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Import Failed",
            description:
              "An error occurred during the import. Check console for details.",
          });
          console.error("Import error:", error);
        }
      },
    });
  };

  const getRoleName = (roleId?: string | null) => {
    if (!roleId) return "Unassigned";
    return roles.find((r) => r.id === roleId)?.name || roleId;
  };

  const getPermissions = (roleId?: string | null) => {
    if (!roleId) return [];
    const role = roles.find((r) => r.id === roleId);
    if (roleId === "admin") return ["all_access"];
    return role?.permissions || [];
  };

  // --- Ministry / Department Worker Summary Stats ---
  const isGlobalManager =
    isSuperAdmin || (canManageWorkers && !workerProfile?.majorMinistryId);
  const userMinistryIds = [
    workerProfile?.majorMinistryId,
    workerProfile?.minorMinistryId,
  ].filter(Boolean) as string[];

  const { totalWorkers, totalActive, totalInactive, totalSecondary } =
    useMemo(() => {
      if (!statsData)
        return {
          totalWorkers: 0,
          totalActive: 0,
          totalInactive: 0,
          totalSecondary: 0,
        };

      return {
        totalWorkers: statsData.total,
        totalActive: statsData.active,
        totalInactive: statsData.inactive,
        totalSecondary: statsData.secondary,
      };
    }, [statsData]);

  // --- Per-ministry breakdown for Department Head ---
  const ministryBreakdown = useMemo(() => {
    if (
      !isDepartmentHead ||
      departmentMinistries.length === 0 ||
      !statsData?.ministryStats
    )
      return [];

    return departmentMinistries.map((ministry) => {
      const stats = statsData.ministryStats.find(
        (s) => s.ministryId === ministry.id,
      );

      return {
        ministry,
        total: stats?.total || 0,
        active: stats?.active || 0,
        inactive: stats?.inactive || 0,
        secondary: stats?.secondary || 0,
        // primaryWorkers is tricky here because we only have the paginated ones.
        // For the ministry breakdown tabs, we should probably fetch the workers for that ministry specifically.
        // For now, let's just use the current page's workers filtered by ministry.
        primaryWorkers: allWorkers.filter(
          (w) => w.majorMinistryId === ministry.id,
        ),
      };
    });
  }, [isDepartmentHead, departmentMinistries, statsData, allWorkers]);

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
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to view this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-headline font-bold">Worker Management</h1>
        {canManageWorkers && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleOpenImport}>
              <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Worker
            </Button>
          </div>
        )}
      </div>

      {/* Summary Stats (dept-wide for Dept Head, ministry-scoped for others) */}
      <div className="mt-4 space-y-1">
        {isDepartmentHead && (
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              {userDepartment} Department Overview
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Workers
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-2xl font-bold">{totalWorkers}</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Active
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {totalActive}
              </p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Inactive
              </CardTitle>
              <UserX className="h-4 w-4 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                {totalInactive}
              </p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Secondary Workers
              </CardTitle>
              <Users2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                {totalSecondary}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Department Head: per-ministry breakdown */}
      {isDepartmentHead && ministryBreakdown.length > 0 && (
        <div className="mt-5">
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Ministry Breakdown
          </h2>
          <Tabs defaultValue={ministryBreakdown[0]?.ministry.id}>
            <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
              {ministryBreakdown.map(({ ministry }) => (
                <TabsTrigger
                  key={ministry.id}
                  value={ministry.id}
                  className="text-xs"
                >
                  {ministry.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {ministryBreakdown.map(
              ({
                ministry,
                total,
                active,
                inactive,
                secondary,
                primaryWorkers: mWorkers,
              }) => (
                <TabsContent
                  key={ministry.id}
                  value={ministry.id}
                  className="space-y-3"
                >
                  {/* Per-ministry stat row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Card className="border-primary/20 bg-primary/5">
                      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
                        <CardTitle className="text-xs font-medium text-muted-foreground">
                          Total
                        </CardTitle>
                        <Users className="h-3.5 w-3.5 text-primary" />
                      </CardHeader>
                      <CardContent className="px-4 pb-3">
                        <p className="text-xl font-bold">{total}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
                      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
                        <CardTitle className="text-xs font-medium text-muted-foreground">
                          Active
                        </CardTitle>
                        <UserCheck className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </CardHeader>
                      <CardContent className="px-4 pb-3">
                        <p className="text-xl font-bold text-green-700 dark:text-green-400">
                          {active}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
                      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
                        <CardTitle className="text-xs font-medium text-muted-foreground">
                          Inactive
                        </CardTitle>
                        <UserX className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                      </CardHeader>
                      <CardContent className="px-4 pb-3">
                        <p className="text-xl font-bold text-red-700 dark:text-red-400">
                          {inactive}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
                      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
                        <CardTitle className="text-xs font-medium text-muted-foreground">
                          Secondary
                        </CardTitle>
                        <Users2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      </CardHeader>
                      <CardContent className="px-4 pb-3">
                        <p className="text-xl font-bold text-amber-700 dark:text-amber-400">
                          {secondary}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  {/* Per-ministry worker table */}
                  <div className="rounded-lg border shadow-sm overflow-x-auto w-full">
                    <Table className="min-w-[700px]">
                      <TableHeader>
                        <TableRow>
                          {canManageWorkers && (
                            <TableHead className="w-[40px]">
                              <Checkbox
                                checked={
                                  mWorkers.length > 0 &&
                                  mWorkers.every((w) =>
                                    selectedWorkerIds.includes(w.id),
                                  )
                                }
                                onCheckedChange={() =>
                                  toggleSelectAll(mWorkers)
                                }
                              />
                            </TableHead>
                          )}
                          <TableHead>Name</TableHead>
                          <TableHead>Worker ID</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Contact</TableHead>
                          {canManageWorkers && (
                            <TableHead>
                              <span className="sr-only">Actions</span>
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mWorkers.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center text-muted-foreground py-6 text-sm"
                            >
                              No workers in this ministry.
                            </TableCell>
                          </TableRow>
                        )}
                        {mWorkers.map((worker) => (
                          <TableRow
                            key={worker.id}
                            className={
                              selectedWorkerIds.includes(worker.id)
                                ? "bg-muted/50 transition-colors"
                                : "transition-colors"
                            }
                          >
                            {canManageWorkers && (
                              <TableCell>
                                <Checkbox
                                  checked={selectedWorkerIds.includes(
                                    worker.id,
                                  )}
                                  onCheckedChange={() =>
                                    toggleSelectWorker(worker.id)
                                  }
                                />
                              </TableCell>
                            )}
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage
                                    src={worker.avatarUrl}
                                    alt={`${worker.firstName} ${worker.lastName}`}
                                  />
                                  <AvatarFallback>
                                    {worker.firstName?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                {`${worker.firstName} ${worker.lastName}`}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {worker.workerId}
                            </TableCell>
                            <TableCell>
                              {(worker as any).roles?.length > 0
                                ? (worker as any).roles
                                    .map(
                                      (wr: any) => wr.role?.name ?? wr.roleId,
                                    )
                                    .join(", ")
                                : getRoleName(worker.roleId)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  worker.status === "Active"
                                    ? "default"
                                    : "secondary"
                                }
                                className={
                                  worker.status === "Active"
                                    ? "bg-green-100 text-green-800"
                                    : worker.status === "Pending Approval"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                }
                              >
                                {worker.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-xs">{worker.email}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {worker.phone}
                                </span>
                              </div>
                            </TableCell>
                            {canManageWorkers && (
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      aria-haspopup="true"
                                      size="icon"
                                      variant="ghost"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">
                                        Toggle menu
                                      </span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onSelect={() =>
                                        setTimeout(
                                          () => handleEdit(worker),
                                          100,
                                        )
                                      }
                                    >
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onSelect={() =>
                                        setTimeout(
                                          () => handlePasswordReset(worker),
                                          100,
                                        )
                                      }
                                    >
                                      <Mail className="mr-2 h-4 w-4" /> Send
                                      Reset Link
                                    </DropdownMenuItem>
                                    {worker.id !== user?.uid && (
                                      <DropdownMenuItem
                                        onSelect={() =>
                                          setTimeout(
                                            () => handleImpersonate(worker),
                                            100,
                                          )
                                        }
                                      >
                                        <LogIn className="mr-2 h-4 w-4" />{" "}
                                        Impersonate
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onSelect={() =>
                                        setTimeout(
                                          () => handleDelete(worker.id),
                                          100,
                                        )
                                      }
                                      className="text-destructive"
                                    >
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              ),
            )}
          </Tabs>
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row gap-4 items-end">
        <div className="w-full sm:max-w-sm">
          <Label htmlFor="worker-search" className="mb-2 block">
            Search Workers
          </Label>
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Input
                id="worker-search"
                placeholder={searchMode === 'workerId' ? "Search by Worker ID..." : "Search by first or last name..."}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => {
                    setSearchInput("");
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Button
              variant={searchMode === 'workerId' ? "default" : "outline"}
              size="sm"
              onClick={() => { setSearchMode('workerId'); setSearchInput(""); setSearchQuery(""); }}
              className="shrink-0"
            >
              ID
            </Button>
            <Button
              variant={searchMode === 'name' ? "default" : "outline"}
              size="sm"
              onClick={() => { setSearchMode('name'); setSearchInput(""); setSearchQuery(""); }}
              className="shrink-0"
            >
              Name
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <div className="rounded-lg border shadow-sm overflow-x-auto w-full">
          <Table className="min-w-[1000px]">
            <TableHeader>
              <TableRow>
                {canManageWorkers && (
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={
                        workers.length > 0 &&
                        workers.every((w) => selectedWorkerIds.includes(w.id))
                      }
                      onCheckedChange={() => toggleSelectAll(workers)}
                    />
                  </TableHead>
                )}
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                  <span className="flex items-center gap-1">Name {sortField === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('workerId')}>
                  <span className="flex items-center gap-1">Worker ID {sortField === 'workerId' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</span>
                </TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('status')}>
                  <span className="flex items-center gap-1">Status {sortField === 'status' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</span>
                </TableHead>
                <TableHead>Contact</TableHead>
                {canManageWorkers && (
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {workersLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground mt-2">
                      Loading workers...
                    </p>
                  </TableCell>
                </TableRow>
              )}
              {!workersLoading && workers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No workers found.
                  </TableCell>
                </TableRow>
              )}
              {!workersLoading &&
                workers.map((worker) => (
                  <TableRow
                    key={worker.id}
                    className={
                      selectedWorkerIds.includes(worker.id)
                        ? "bg-muted/50 transition-colors"
                        : "transition-colors"
                    }
                  >
                    {canManageWorkers && (
                      <TableCell>
                        <Checkbox
                          checked={selectedWorkerIds.includes(worker.id)}
                          onCheckedChange={() => toggleSelectWorker(worker.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={worker.avatarUrl}
                            alt={`${worker.firstName} ${worker.lastName}`}
                          />
                          <AvatarFallback>
                            {worker.firstName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {`${worker.firstName} ${worker.lastName}`}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatWorkerId(worker.workerId)}
                    </TableCell>
                    <TableCell>
                      {(worker as any).roles?.length > 0
                        ? (worker as any).roles
                            .map((wr: any) => wr.role?.name ?? wr.roleId)
                            .join(", ")
                        : getRoleName(worker.roleId)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {getPermissions(worker.roleId).map((p) => (
                          <Badge
                            key={p}
                            variant="outline"
                            className="text-[10px] px-1 py-0 h-4 normal-case font-normal border-primary/20 bg-primary/5"
                          >
                            {p.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          worker.status === "Active" ? "default" : "secondary"
                        }
                        className={
                          worker.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : worker.status === "Pending Approval"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }
                      >
                        {worker.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs">{worker.email}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {worker.phone}
                        </span>
                      </div>
                    </TableCell>
                    {canManageWorkers && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() =>
                                setTimeout(() => handleEdit(worker), 100)
                              }
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() =>
                                setTimeout(
                                  () => handlePasswordReset(worker),
                                  100,
                                )
                              }
                            >
                              <Mail className="mr-2 h-4 w-4" /> Send Reset Link
                            </DropdownMenuItem>
                            {worker.id !== user?.uid && (
                              <DropdownMenuItem
                                onSelect={() =>
                                  setTimeout(
                                    () => handleImpersonate(worker),
                                    100,
                                  )
                                }
                              >
                                <LogIn className="mr-2 h-4 w-4" />
                                Impersonate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onSelect={() =>
                                setTimeout(() => handleDelete(worker.id), 100)
                              }
                              className="text-destructive"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {pagination && pagination.total > 0 && (
          <div className="flex items-center justify-between px-2 py-4 border-t bg-muted/20 rounded-b-lg">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, pagination.total)}
              </span>{" "}
              of <span className="font-medium">{pagination.total.toLocaleString()}</span> workers
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1 mx-2">
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    let pageNum = i + 1;
                    if (pagination.totalPages > 5 && currentPage > 3) {
                      pageNum = currentPage - 3 + i;
                      if (pageNum + (5 - i) > pagination.totalPages) {
                        pageNum = pagination.totalPages - 4 + i;
                      }
                    }
                    if (pageNum <= 0 || pageNum > pagination.totalPages) return null;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  },
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>


      <Sheet open={isImportSheetOpen} onOpenChange={setIsImportSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <ImportSheet
            onImport={handleImportWorkers}
            onClose={() => setIsImportSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Batch Actions Bar */}
      {selectedWorkerIds.length > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardContent className="p-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  {selectedWorkerIds.length}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">Workers Selected</p>
                  <p className="text-xs text-muted-foreground">
                    Perform batch actions
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(isMealStubAssigner || canManageAllMealStubs) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-primary/50 text-primary hover:bg-primary/5"
                    onClick={() => setIsBatchMealStubSheetOpen(true)}
                  >
                    <Ticket className="h-4 w-4 mr-2" /> Meal Stubs
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsBatchMoveSheetOpen(true)}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2" /> Move
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setIsBatchDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
                <div className="w-px h-8 bg-border mx-1 hidden sm:block" />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setSelectedWorkerIds([])}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Batch Delete Confirmation */}
      <AlertDialog
        open={isBatchDeleteDialogOpen}
        onOpenChange={setIsBatchDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedWorkerIds.length} worker
              profile(s). This action cannot be undone and will remove all
              associated records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Workers
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Move Sheet */}
      <Sheet open={isBatchMoveSheetOpen} onOpenChange={setIsBatchMoveSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <BatchMinistrySheet
            selectedCount={selectedWorkerIds.length}
            ministries={ministries}
            onSave={handleBatchMove}
            onClose={() => setIsBatchMoveSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Batch Meal Stub Sheet */}
      <Sheet
        open={isBatchMealStubSheetOpen}
        onOpenChange={setIsBatchMealStubSheetOpen}
      >
        <SheetContent className="sm:max-w-md">
          <BatchMealStubSheet
            selectedCount={selectedWorkerIds.length}
            onSave={handleBatchMealStub}
            onClose={() => setIsBatchMealStubSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Add Worker Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-headline">
              {selectedWorker ? "Edit Worker" : "Add Worker"}
            </SheetTitle>
            <SheetDescription>
              Fill in the details below to add a new worker.
            </SheetDescription>
          </SheetHeader>

          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-firstName">First Name</Label>
                <Input
                  id="add-firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-lastName">Last Name</Label>
                <Input
                  id="add-lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-phone">Phone</Label>
              <Input
                id="add-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-workerId">Worker ID</Label>
              <Input
                id="add-workerId"
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                placeholder="Auto-generated if blank"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-role">Role</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger id="add-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="add-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-majorMinistry">Major Ministry</Label>
              <Select value={majorMinistryId} onValueChange={setMajorMinistryId}>
                <SelectTrigger id="add-majorMinistry">
                  <SelectValue placeholder="Select major ministry" />
                </SelectTrigger>
                <SelectContent>
                  {ministries.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-minorMinistry">Minor Ministry</Label>
              <Select value={minorMinistryId} onValueChange={setMinorMinistryId}>
                <SelectTrigger id="add-minorMinistry">
                  <SelectValue placeholder="Select minor ministry" />
                </SelectTrigger>
                <SelectContent>
                  {ministries.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-employmentType">Employment Type</Label>
              <Select value={employmentType} onValueChange={setEmploymentType}>
                <SelectTrigger id="add-employmentType">
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Volunteer">Volunteer</SelectItem>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter>
            <Button variant="secondary" onClick={() => setIsSheetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleWorkerFormSubmit}>
              Add Worker
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
