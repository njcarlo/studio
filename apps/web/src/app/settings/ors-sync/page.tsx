"use client";

import React, { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@studio/ui";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@studio/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@studio/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@studio/ui";
import { Badge } from "@studio/ui";
import { Checkbox } from "@studio/ui";
import { Input } from "@studio/ui";
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
import { Progress } from "@studio/ui";
import {
  LoaderCircle,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  SkipForward,
  AlertTriangle,
  DatabaseZap,
  Users,
  Building2,
  MapPin,
  HeartHandshake,
  UserCheck,
  ArrowRight,
} from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { useRoles } from "@/hooks/use-roles";
import {
  previewOrsWorkers,
  previewOrsMinistries,
  previewOrsSatellites,
  previewOrsAreas,
  previewOrsMentorGroups,
  previewOrsMentees,
  previewOrsAttendance,
  importOrsWorkersBatch,
  importOrsMinistries,
  importOrsSatellites,
  importOrsAreas,
  importOrsMentorGroups,
  importOrsMentees,
  importOrsAttendanceBatch,
  getOrsSyncStats,
  getOrsMinistryMap,
  type OrsWorker,
  type OrsMinistry,
  type OrsSatellite,
  type OrsArea,
  type OrsMentorGroup,
  type OrsMentee,
  type OrsAttendanceScan,
  type ImportResult,
  type OrsSyncStats,
} from "@/actions/ors-sync";

// ─── Shared sub-components ──────────────────────────────────────────────────

function ImportResultCard({ result }: { result: ImportResult }) {
  return (
    <Card
      className={result.failed > 0 ? "border-destructive" : "border-green-500"}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          {result.failed > 0 ? (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          )}
          Last Import Result
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6 text-sm">
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="h-4 w-4" /> {result.success} imported
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <SkipForward className="h-4 w-4" /> {result.skipped} skipped
          </span>
          <span className="flex items-center gap-1 text-destructive">
            <XCircle className="h-4 w-4" /> {result.failed} failed
          </span>
        </div>
        {result.errors.length > 0 && (
          <details className="mt-3">
            <summary className="text-xs text-muted-foreground cursor-pointer">
              View {result.errors.length} message(s)
            </summary>
            <ul className="mt-2 text-xs text-destructive space-y-1 max-h-32 overflow-y-auto">
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

function StatPill({
  label,
  imported,
  total,
}: {
  label: string;
  imported: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((imported / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>
          {imported.toLocaleString()} / {total.toLocaleString()} ({pct}%)
        </span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}

function PageControls({
  page,
  totalPages,
  totalItems,
  isLoading,
  onPrev,
  onNext,
  selectedCount,
  onImport,
  isImporting,
  importLabel,
  extra,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  isLoading: boolean;
  onPrev: () => void;
  onNext: () => void;
  selectedCount: number;
  onImport: () => void;
  isImporting: boolean;
  importLabel?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground flex-wrap gap-2">
      <span>
        {totalItems > 0
          ? `Page ${page} of ${totalPages} · ${totalItems.toLocaleString()} total`
          : "No results"}
      </span>
      <div className="flex gap-2 items-center flex-wrap">
        {extra}
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={page <= 1 || isLoading}
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={page >= totalPages || isLoading}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          onClick={onImport}
          disabled={selectedCount === 0 || isImporting}
        >
          {isImporting ? (
            <LoaderCircle className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-1.5" />
          )}
          {importLabel || `Import (${selectedCount})`}
        </Button>
      </div>
    </div>
  );
}

function SelectAllHeader({
  allSelected,
  someSelected,
  onToggle,
  disabled,
}: {
  allSelected: boolean;
  someSelected: boolean;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Checkbox
      checked={allSelected}
      data-state={someSelected && !allSelected ? "indeterminate" : undefined}
      onCheckedChange={onToggle}
      disabled={disabled}
    />
  );
}

// ─── Workers tab ─────────────────────────────────────────────────────────────

function WorkersTab({
  ministryMap,
  onResult,
}: {
  ministryMap: Record<string, string>;
  onResult: (r: ImportResult) => void;
}) {
  const { roles } = useRoles();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [roleId, setRoleId] = useState("viewer");
  const [isImporting, setIsImporting] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ors-workers", page, search],
    queryFn: () => previewOrsWorkers(page, 50, search || undefined),
    placeholderData: (p) => p,
  });

  const workers = data?.data || [];
  const allSelected =
    workers.length > 0 && workers.every((w) => selected.has(w.id));
  const someSelected = workers.some((w) => selected.has(w.id));

  const doImport = async () => {
    const toImport = workers.filter((w) => selected.has(w.id));
    if (!toImport.length) return;
    setIsImporting(true);
    setConfirm(false);
    try {
      const result = await importOrsWorkersBatch(toImport, roleId, ministryMap);
      onResult(result);
      setSelected(new Set());
      toast({
        title: "Workers import done",
        description: `${result.success} imported, ${result.skipped} skipped`,
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: e.message,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap items-center">
        <Input
          placeholder="Search first name…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setSearch(searchInput);
              setPage(1);
              setSelected(new Set());
            }
          }}
          className="max-w-xs"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSearch(searchInput);
            setPage(1);
            setSelected(new Set());
          }}
        >
          Search
        </Button>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-muted-foreground">Role:</span>
          <Select value={roleId} onValueChange={setRoleId}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles?.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <SelectAllHeader
                    allSelected={allSelected}
                    someSelected={someSelected}
                    onToggle={(v) =>
                      setSelected(
                        v ? new Set(workers.map((w) => w.id)) : new Set(),
                      )
                    }
                    disabled={!workers.length}
                  />
                </TableHead>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <LoaderCircle className="mx-auto h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && workers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-16 text-center text-muted-foreground"
                  >
                    No workers found.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                workers.map((w: OrsWorker) => (
                  <TableRow
                    key={w.id}
                    className={selected.has(w.id) ? "bg-muted/40" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selected.has(w.id)}
                        onCheckedChange={(c) =>
                          setSelected((prev) => {
                            const n = new Set(prev);
                            c ? n.add(w.id) : n.delete(w.id);
                            return n;
                          })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {w.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {w.first_name} {w.last_name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {w.email || (
                        <span className="italic text-destructive text-xs">
                          no email
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{w.mobile || "—"}</TableCell>
                    <TableCell className="text-sm">
                      {w.worker_type || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          w.status?.toLowerCase() === "active"
                            ? "default"
                            : "secondary"
                        }
                        className={
                          w.status?.toLowerCase() === "active"
                            ? "bg-green-600"
                            : ""
                        }
                      >
                        {w.status || "—"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PageControls
        page={page}
        totalPages={data?.meta?.totalPages || 1}
        totalItems={data?.meta?.total || 0}
        isLoading={isLoading}
        onPrev={() => {
          setPage((p) => p - 1);
          setSelected(new Set());
        }}
        onNext={() => {
          setPage((p) => p + 1);
          setSelected(new Set());
        }}
        selectedCount={selected.size}
        onImport={() => setConfirm(true)}
        isImporting={isImporting}
        importLabel={`Import (${selected.size})`}
      />

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Import {selected.size} worker(s)?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Firebase Auth accounts will be created with temporary passwords.
              Workers will have <strong>passwordChangeRequired</strong> set.
              Already-existing workers (matched by ORS ID or email) are skipped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doImport}>Import Now</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Ministries tab ──────────────────────────────────────────────────────────

const ORS_DEPT_LABELS: Record<number, string> = {
  1: "Worship",
  2: "Outreach",
  3: "Relationship",
  4: "Discipleship",
  5: "Administration",
  6: "Pastoral → Discipleship",
};

function MinistriesTab({ onResult }: { onResult: (r: ImportResult) => void }) {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["ors-ministries", page],
    queryFn: () => previewOrsMinistries(page, 50),
    placeholderData: (p) => p,
  });

  const items = data?.data || [];
  const allSelected =
    items.length > 0 && items.every((m) => selected.has(m.id));
  const someSelected = items.some((m) => selected.has(m.id));

  const doImport = async () => {
    const toImport = items.filter((m) => selected.has(m.id));
    setIsImporting(true);
    setConfirm(false);
    try {
      const result = await importOrsMinistries(toImport);
      onResult(result);
      setSelected(new Set());
      toast({
        title: "Ministries done",
        description: `${result.success} imported, ${result.skipped} skipped`,
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: e.message,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <ArrowRight className="h-3 w-3" />
        ORS departments map to new app&apos;s department enum automatically.
        Import ministries before workers so ministry IDs can be resolved.
      </p>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <SelectAllHeader
                    allSelected={allSelected}
                    someSelected={someSelected}
                    onToggle={(v) =>
                      setSelected(
                        v ? new Set(items.map((m) => m.id)) : new Set(),
                      )
                    }
                    disabled={!items.length}
                  />
                </TableHead>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <LoaderCircle className="mx-auto h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                items.map((m: OrsMinistry) => (
                  <TableRow
                    key={m.id}
                    className={selected.has(m.id) ? "bg-muted/40" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selected.has(m.id)}
                        onCheckedChange={(c) =>
                          setSelected((prev) => {
                            const n = new Set(prev);
                            c ? n.add(m.id) : n.delete(m.id);
                            return n;
                          })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {m.id}
                    </TableCell>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ORS_DEPT_LABELS[m.department_id] ||
                        `Dept ${m.department_id}`}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <PageControls
        page={page}
        totalPages={data?.meta?.totalPages || 1}
        totalItems={data?.meta?.total || 0}
        isLoading={isLoading}
        onPrev={() => {
          setPage((p) => p - 1);
          setSelected(new Set());
        }}
        onNext={() => {
          setPage((p) => p + 1);
          setSelected(new Set());
        }}
        selectedCount={selected.size}
        onImport={() => setConfirm(true)}
        isImporting={isImporting}
      />
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Import {selected.size} ministr{selected.size === 1 ? "y" : "ies"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Duplicates (matched by name) will be skipped. Head workers must be
              imported first to be resolved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doImport}>Import Now</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Areas & Branches tab ────────────────────────────────────────────────────

function AreasTab({ onResult }: { onResult: (r: ImportResult) => void }) {
  const { toast } = useToast();
  const [selectedSat, setSelectedSat] = useState<Set<number>>(new Set());
  const [selectedArea, setSelectedArea] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [importType, setImportType] = useState<"satellites" | "areas" | null>(
    null,
  );

  const { data: satData, isLoading: satLoading } = useQuery({
    queryKey: ["ors-satellites"],
    queryFn: () => previewOrsSatellites(1, 100),
  });
  const { data: areaData, isLoading: areaLoading } = useQuery({
    queryKey: ["ors-areas"],
    queryFn: () => previewOrsAreas(1, 100),
  });

  const satellites = satData?.data || [];
  const areas = areaData?.data || [];

  const doImport = async () => {
    setIsImporting(true);
    setConfirm(false);
    try {
      let result: ImportResult = {
        success: 0,
        skipped: 0,
        failed: 0,
        errors: [],
      };
      if (importType === "satellites") {
        result = await importOrsSatellites(
          satellites.filter((s) => selectedSat.has(s.id)),
        );
      } else {
        result = await importOrsAreas(
          areas.filter((a) => selectedArea.has(a.id)),
        );
      }
      onResult(result);
      setSelectedSat(new Set());
      setSelectedArea(new Set());
      toast({
        title: "Import done",
        description: `${result.success} imported, ${result.skipped} skipped`,
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: e.message,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const selectedCount =
    importType === "satellites" ? selectedSat.size : selectedArea.size;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <ArrowRight className="h-3 w-3" />
        <strong>Satellites</strong> → Branches &nbsp;|&nbsp;{" "}
        <strong>Areas</strong> → Areas (placed under &quot;Main&quot; branch
        automatically)
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Satellites */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Satellites → Branches</CardTitle>
            <CardDescription className="text-xs">
              {satData?.meta?.total || 0} records
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <SelectAllHeader
                      allSelected={
                        satellites.length > 0 &&
                        satellites.every((s) => selectedSat.has(s.id))
                      }
                      someSelected={satellites.some((s) =>
                        selectedSat.has(s.id),
                      )}
                      onToggle={(v) =>
                        setSelectedSat(
                          v ? new Set(satellites.map((s) => s.id)) : new Set(),
                        )
                      }
                      disabled={!satellites.length}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {satLoading && (
                  <TableRow>
                    <TableCell colSpan={2} className="h-16 text-center">
                      <LoaderCircle className="mx-auto h-4 w-4 animate-spin" />
                    </TableCell>
                  </TableRow>
                )}
                {!satLoading &&
                  satellites.map((s: OrsSatellite) => (
                    <TableRow
                      key={s.id}
                      className={selectedSat.has(s.id) ? "bg-muted/40" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedSat.has(s.id)}
                          onCheckedChange={(c) =>
                            setSelectedSat((prev) => {
                              const n = new Set(prev);
                              c ? n.add(s.id) : n.delete(s.id);
                              return n;
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>{s.name}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Areas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Areas → Areas</CardTitle>
            <CardDescription className="text-xs">
              {areaData?.meta?.total || 0} records · placed under
              &quot;Main&quot; branch
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <SelectAllHeader
                      allSelected={
                        areas.length > 0 &&
                        areas.every((a) => selectedArea.has(a.id))
                      }
                      someSelected={areas.some((a) => selectedArea.has(a.id))}
                      onToggle={(v) =>
                        setSelectedArea(
                          v ? new Set(areas.map((a) => a.id)) : new Set(),
                        )
                      }
                      disabled={!areas.length}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Short</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areaLoading && (
                  <TableRow>
                    <TableCell colSpan={3} className="h-16 text-center">
                      <LoaderCircle className="mx-auto h-4 w-4 animate-spin" />
                    </TableCell>
                  </TableRow>
                )}
                {!areaLoading &&
                  areas.map((a: OrsArea) => (
                    <TableRow
                      key={a.id}
                      className={selectedArea.has(a.id) ? "bg-muted/40" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedArea.has(a.id)}
                          onCheckedChange={(c) =>
                            setSelectedArea((prev) => {
                              const n = new Set(prev);
                              c ? n.add(a.id) : n.delete(a.id);
                              return n;
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>{a.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {a.short_name}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={selectedSat.size === 0 || isImporting}
          onClick={() => {
            setImportType("satellites");
            setConfirm(true);
          }}
        >
          <Download className="h-4 w-4 mr-1.5" /> Import Branches (
          {selectedSat.size})
        </Button>
        <Button
          size="sm"
          disabled={selectedArea.size === 0 || isImporting}
          onClick={() => {
            setImportType("areas");
            setConfirm(true);
          }}
        >
          {isImporting ? (
            <LoaderCircle className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-1.5" />
          )}
          Import Areas ({selectedArea.size})
        </Button>
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Import {selectedCount}{" "}
              {importType === "satellites" ? "branch(es)" : "area(s)"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Duplicates (matched by name) will be skipped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doImport}>Import Now</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── C2S tab ─────────────────────────────────────────────────────────────────

function C2STab({ onResult }: { onResult: (r: ImportResult) => void }) {
  const { toast } = useToast();
  const [groupPage, setGroupPage] = useState(1);
  const [menteePage, setMenteePage] = useState(1);
  const [selectedGroups, setSelectedGroups] = useState<Set<number>>(new Set());
  const [selectedMentees, setSelectedMentees] = useState<Set<number>>(
    new Set(),
  );
  const [isImporting, setIsImporting] = useState(false);
  const [confirm, setConfirm] = useState<"groups" | "mentees" | null>(null);

  const { data: groupData, isLoading: groupLoading } = useQuery({
    queryKey: ["ors-mentor-groups", groupPage],
    queryFn: () => previewOrsMentorGroups(groupPage, 50),
    placeholderData: (p) => p,
  });
  const { data: menteeData, isLoading: menteeLoading } = useQuery({
    queryKey: ["ors-mentees", menteePage],
    queryFn: () => previewOrsMentees(menteePage, 50),
    placeholderData: (p) => p,
  });

  const groups = groupData?.data || [];
  const mentees = menteeData?.data || [];

  const doImportGroups = async () => {
    const toImport = groups.filter((g) => selectedGroups.has(g.id));
    setIsImporting(true);
    setConfirm(null);
    try {
      const result = await importOrsMentorGroups(toImport);
      onResult(result);
      setSelectedGroups(new Set());
      toast({
        title: "Groups done",
        description: `${result.success} imported, ${result.skipped} skipped`,
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: e.message,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const doImportMentees = async () => {
    const toImport = mentees.filter((m) => selectedMentees.has(m.id));
    setIsImporting(true);
    setConfirm(null);
    try {
      const result = await importOrsMentees(toImport);
      onResult(result);
      setSelectedMentees(new Set());
      toast({
        title: "Mentees done",
        description: `${result.success} imported, ${result.skipped} skipped`,
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: e.message,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <ArrowRight className="h-3 w-3" />
        Import <strong>Groups</strong> before <strong>Mentees</strong>. Workers
        must be imported first for mentor/mentee lookups to work.
      </p>

      {/* Groups */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm">
          C2S Groups ({groupData?.meta?.total?.toLocaleString() || "—"})
        </h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <SelectAllHeader
                      allSelected={
                        groups.length > 0 &&
                        groups.every((g) => selectedGroups.has(g.id))
                      }
                      someSelected={groups.some((g) =>
                        selectedGroups.has(g.id),
                      )}
                      onToggle={(v) =>
                        setSelectedGroups(
                          v ? new Set(groups.map((g) => g.id)) : new Set(),
                        )
                      }
                      disabled={!groups.length}
                    />
                  </TableHead>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-20 text-center">
                      <LoaderCircle className="mx-auto h-5 w-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                )}
                {!groupLoading &&
                  groups.map((g: OrsMentorGroup) => (
                    <TableRow
                      key={g.id}
                      className={selectedGroups.has(g.id) ? "bg-muted/40" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedGroups.has(g.id)}
                          onCheckedChange={(c) =>
                            setSelectedGroups((prev) => {
                              const n = new Set(prev);
                              c ? n.add(g.id) : n.delete(g.id);
                              return n;
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">{g.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {g.mentor_name || `Worker #${g.mentor_id}`}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            g.status?.toLowerCase() === "active"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            g.status?.toLowerCase() === "active"
                              ? "bg-green-600"
                              : ""
                          }
                        >
                          {g.status || "—"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <PageControls
          page={groupPage}
          totalPages={groupData?.meta?.totalPages || 1}
          totalItems={groupData?.meta?.total || 0}
          isLoading={groupLoading}
          onPrev={() => {
            setGroupPage((p) => p - 1);
            setSelectedGroups(new Set());
          }}
          onNext={() => {
            setGroupPage((p) => p + 1);
            setSelectedGroups(new Set());
          }}
          selectedCount={selectedGroups.size}
          onImport={() => setConfirm("groups")}
          isImporting={isImporting}
          importLabel={`Import Groups (${selectedGroups.size})`}
        />
      </div>

      {/* Mentees */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm">
          Mentees ({menteeData?.meta?.total?.toLocaleString() || "—"})
        </h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <SelectAllHeader
                      allSelected={
                        mentees.length > 0 &&
                        mentees.every((m) => selectedMentees.has(m.id))
                      }
                      someSelected={mentees.some((m) =>
                        selectedMentees.has(m.id),
                      )}
                      onToggle={(v) =>
                        setSelectedMentees(
                          v ? new Set(mentees.map((m) => m.id)) : new Set(),
                        )
                      }
                      disabled={!mentees.length}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menteeLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-20 text-center">
                      <LoaderCircle className="mx-auto h-5 w-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                )}
                {!menteeLoading &&
                  mentees.map((m: OrsMentee) => (
                    <TableRow
                      key={m.id}
                      className={selectedMentees.has(m.id) ? "bg-muted/40" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedMentees.has(m.id)}
                          onCheckedChange={(c) =>
                            setSelectedMentees((prev) => {
                              const n = new Set(prev);
                              c ? n.add(m.id) : n.delete(m.id);
                              return n;
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {m.contact || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        Group #{m.group_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {m.c2s_manual_status || "—"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <PageControls
          page={menteePage}
          totalPages={menteeData?.meta?.totalPages || 1}
          totalItems={menteeData?.meta?.total || 0}
          isLoading={menteeLoading}
          onPrev={() => {
            setMenteePage((p) => p - 1);
            setSelectedMentees(new Set());
          }}
          onNext={() => {
            setMenteePage((p) => p + 1);
            setSelectedMentees(new Set());
          }}
          selectedCount={selectedMentees.size}
          onImport={() => setConfirm("mentees")}
          isImporting={isImporting}
          importLabel={`Import Mentees (${selectedMentees.size})`}
        />
      </div>

      <AlertDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Import{" "}
              {confirm === "groups"
                ? `${selectedGroups.size} group(s)`
                : `${selectedMentees.size} mentee(s)`}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "mentees"
                ? "Workers and groups must already be imported. Mentees without a resolvable group will be skipped."
                : "Mentors are resolved by looking up imported workers. Duplicates are skipped."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirm === "groups" ? doImportGroups : doImportMentees}
            >
              Import Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Attendance tab ───────────────────────────────────────────────────────────

function AttendanceTab({ onResult }: { onResult: (r: ImportResult) => void }) {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["ors-attendance", page],
    queryFn: () => previewOrsAttendance(page, 50),
    placeholderData: (p) => p,
  });

  const records = data?.data || [];
  const allSelected =
    records.length > 0 && records.every((r) => selected.has(r.id));
  const someSelected = records.some((r) => selected.has(r.id));

  const doImport = async () => {
    const toImport = records.filter((r) => selected.has(r.id));
    setIsImporting(true);
    setConfirm(false);
    try {
      const result = await importOrsAttendanceBatch(toImport);
      onResult(result);
      setSelected(new Set());
      toast({
        title: "Attendance done",
        description: `${result.success} records imported`,
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: e.message,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <Card className="border-amber-400 bg-amber-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-4 w-4" /> Large Dataset
          </CardTitle>
          <CardDescription className="text-xs">
            There are ~84,000 attendance records. Import page by page. Workers
            must be imported first. Records with no matching worker in the new
            system will be skipped automatically.
          </CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <SelectAllHeader
                    allSelected={allSelected}
                    someSelected={someSelected}
                    onToggle={(v) =>
                      setSelected(
                        v ? new Set(records.map((r) => r.id)) : new Set(),
                      )
                    }
                    disabled={!records.length}
                  />
                </TableHead>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Worker ID</TableHead>
                <TableHead>Date Scanned</TableHead>
                <TableHead>Scanner Site</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <LoaderCircle className="mx-auto h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && records.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-16 text-center text-muted-foreground"
                  >
                    No records.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                records.map((r: OrsAttendanceScan) => (
                  <TableRow
                    key={r.id}
                    className={selected.has(r.id) ? "bg-muted/40" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selected.has(r.id)}
                        onCheckedChange={(c) =>
                          setSelected((prev) => {
                            const n = new Set(prev);
                            c ? n.add(r.id) : n.delete(r.id);
                            return n;
                          })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.id}
                    </TableCell>
                    <TableCell className="text-sm">
                      Worker #{r.worker_id}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.date_scanned
                        ? new Date(r.date_scanned).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.scanner_site_id ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <PageControls
        page={page}
        totalPages={data?.meta?.totalPages || 1}
        totalItems={data?.meta?.total || 0}
        isLoading={isLoading}
        onPrev={() => {
          setPage((p) => p - 1);
          setSelected(new Set());
        }}
        onNext={() => {
          setPage((p) => p + 1);
          setSelected(new Set());
        }}
        selectedCount={selected.size}
        onImport={() => setConfirm(true)}
        isImporting={isImporting}
        importLabel={`Import Page (${selected.size})`}
      />
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Import {selected.size} attendance record(s)?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Records whose worker cannot be found in the new system will be
              skipped. This uses a bulk insert for speed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doImport}>Import Now</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function OrsLegacySyncPage() {
  const { isSuperAdmin, isLoading: isRoleLoading } = useUserRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [lastResult, setLastResult] = useState<ImportResult | null>(null);

  const {
    data: stats,
    refetch: refetchStats,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ["ors-sync-stats"],
    queryFn: getOrsSyncStats,
  });

  const { data: ministryMap } = useQuery({
    queryKey: ["ors-ministry-map"],
    queryFn: getOrsMinistryMap,
  });

  const handleResult = useCallback(
    (result: ImportResult) => {
      setLastResult(result);
      refetchStats();
      queryClient.invalidateQueries({ queryKey: ["ors-workers"] });
      queryClient.invalidateQueries({ queryKey: ["ors-ministries"] });
      queryClient.invalidateQueries({ queryKey: ["ors-sync-stats"] });
    },
    [refetchStats, queryClient],
  );

  if (isRoleLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-10">
          <LoaderCircle className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!isSuperAdmin) {
    return (
      <AppLayout>
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Only super admins can access ORS Legacy Sync.
            </CardDescription>
          </CardHeader>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold flex items-center gap-2">
            <DatabaseZap className="h-6 w-6" />
            ORS Legacy Sync
          </h1>
          <p className="text-muted-foreground text-sm">
            Preview and import data from the legacy ORS system. Follow the
            recommended order below.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchStats()}
          disabled={statsLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${statsLoading ? "animate-spin" : ""}`}
          />
          Refresh Stats
        </Button>
      </div>

      {/* Import order hint */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap mt-1">
        <span className="font-medium">Recommended import order:</span>
        {[
          "Ministries",
          "Areas & Branches",
          "Workers",
          "C2S Groups",
          "Mentees",
          "Attendance",
        ].map((s, i, arr) => (
          <React.Fragment key={s}>
            <Badge variant="outline" className="text-xs font-normal">
              {i + 1}. {s}
            </Badge>
            {i < arr.length - 1 && <ArrowRight className="h-3 w-3" />}
          </React.Fragment>
        ))}
      </div>

      {/* Stats */}
      {stats && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Import Progress</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(
              Object.entries(stats) as [
                keyof OrsSyncStats,
                { total: number; imported: number },
              ][]
            ).map(([key, val]) => (
              <StatPill
                key={key}
                label={key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (s) => s.toUpperCase())}
                imported={val.imported}
                total={val.total}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Last result */}
      {lastResult && <ImportResultCard result={lastResult} />}

      {/* Tabs */}
      <Tabs defaultValue="ministries" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="ministries" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Ministries
          </TabsTrigger>
          <TabsTrigger value="areas" className="gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Areas & Branches
          </TabsTrigger>
          <TabsTrigger value="workers" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Workers
          </TabsTrigger>
          <TabsTrigger value="c2s" className="gap-1.5">
            <HeartHandshake className="h-3.5 w-3.5" />
            C2S
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-1.5">
            <UserCheck className="h-3.5 w-3.5" />
            Attendance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ministries">
          <MinistriesTab onResult={handleResult} />
        </TabsContent>
        <TabsContent value="areas">
          <AreasTab onResult={handleResult} />
        </TabsContent>
        <TabsContent value="workers">
          <WorkersTab ministryMap={ministryMap || {}} onResult={handleResult} />
        </TabsContent>
        <TabsContent value="c2s">
          <C2STab onResult={handleResult} />
        </TabsContent>
        <TabsContent value="attendance">
          <AttendanceTab onResult={handleResult} />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
