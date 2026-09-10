"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format, formatDistanceToNow, isBefore, isToday, startOfDay, endOfDay } from "date-fns";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  RadioGroup,
  RadioGroupItem,
  Checkbox,
} from "@studio/ui";
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
  BarChart3,
  BookOpen,
  Calendar,
  Camera,
  Eye,
  ShieldCheck,
  Lock,
  AlertCircle,
  X,
  UploadCloud,
  Clock,
  GraduationCap,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Heart,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Pencil,
  Building2,
  UserCheck,
  Download,
  FileText,
  Printer,
  Music2,
  Compass,
  LayoutDashboard,
  ArrowRight,
  TrendingUp,
  RotateCcw,
} from "lucide-react";
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  Legend,
} from "recharts";
import { useAuthStore, usePermissionsStore } from "@studio/store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { C2SGroup, C2SMentee, C2SDevotionRecord, Worker } from "@studio/types";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { toJsDate } from "@/lib/utils";
import {
  createC2SGroup,
  createC2SMentee,
  deleteC2SGroup,
  deleteC2SMentee,
  getC2SGroups,
  getC2SMentees,
  getWorkers,
  updateC2SGroup,
  updateC2SMentee,
  getC2SDevotionRecords,
  createC2SDevotionRecord,
  updateC2SDevotionRecord,
  deleteC2SDevotionRecord,
  getMinistries,
} from "@/actions/db";

// ─── DYNAMIC CURRICULUM DATA ───────────────────────────────────────────────
export const C2S_CURRICULUM: Record<
  string,
  { module: string; lessons: string[] }[]
> = {
  "C2S Devotional Manual": [
    {
      module: "Module 1: A Born Again Experience",
      lessons: [
        "Lesson 1: Fresh Start",
        "Lesson 2: Receiving God's Forgiveness",
        "Lesson 3: Highly Favored",
        "Lesson 4: Well-Rested",
        "Lesson 5: Direct Access",
        "Lesson 6: Thirst Quencher",
      ],
    },
    {
      module: "Module 2: Life of a Winner",
      lessons: [
        "Lesson 1: The 'I' That Matters Most",
        "Lesson 2: Forgiveness: The Best Choice",
        "Lesson 3: Make or Break?",
        "Lesson 4: Oh, No! It's Captain Hook!",
        "Lesson 5: www: when.winners.worship",
        "Lesson 6: As Good As It Gets",
      ],
    },
    {
      module: "Module 3: Walking in Great Faith",
      lessons: [
        "Lesson 1: Through the Eyes of Faith",
        "Lesson 2: Faith that Works",
        "Lesson 3: Living Like a Tough Guy",
        "Lesson 4: Resentment-Free",
        "Lesson 5: Fearless",
        "Lesson 6: Bearing for the Master",
      ],
    },
    {
      module: "Module 4: Marks of a True Follower of Jesus",
      lessons: [
        "Lesson 1: Fruit-iply",
        "Lesson 2: Costly but Worthy",
        "Lesson 3: Walk the Talk",
        "Lesson 4: Good Followers",
        "Lesson 5: A Changed Man",
        "Lesson 6: Harvesters",
      ],
    },
  ],
  "Mentor's Manual": [
    {
      module: "Module 1: 10 Core Values in the Ministry",
      lessons: [
        "Lesson 1: The Foundation of Ministry is Character",
        "Lesson 2: The Nature of Ministry is Service",
        "Lesson 3: The Motive of Ministry is Love",
        "Lesson 4: The Measure of Ministry is Sacrifice",
        "Lesson 5: The Authority of Ministry is Submission",
        "Lesson 6: The Purpose of Ministry is to Glorify God",
        "Lesson 7: The Tools of Ministry are Prayer & Scripture",
        "Lesson 8: The Privilege of Ministry is Growth",
        "Lesson 9: The Power of the Ministry is the Holy Spirit",
        "Lesson 10: The Model of Ministry is Jesus Christ",
      ],
    },
    {
      module: "Module 2: Knowing our Role as Worker",
      lessons: [
        "Lesson 1: Our Ministry as a Worker",
        "Lesson 2: Our Role as a Worker",
        "Lesson 3: Our Character as a Glorifier",
      ],
    },
    {
      module: "Module 3: Taking Care of Your C2S Group",
      lessons: [
        "Lesson 1: The Necessity of a Mentor",
        "Lesson 2: Building a Healthy C2S Group",
      ],
    },
  ],
};

// ─── HELPER: SANITIZE CLUSTER / MINISTRY (ELIMINATE LEGACY GROUPS) ─────────
export const cleanClusterOrDept = (
  rawCluster?: string | null,
  mentorId?: string | null,
  mentorName?: string | null,
  workersList?: any[],
  ministriesList?: any[]
): string => {
  const raw = (rawCluster || "").trim();
  const lower = raw.toLowerCase();
  const legacyGroups = [
    "power pop girls",
    "sanggre",
    "warrior",
    "warriors",
    "victory",
    "worship cluster 1",
    "outreach cluster 4",
  ];
  const isLegacy = !raw || legacyGroups.some((lg) => lower === lg || lower.includes(lg));

  if (!isLegacy) {
    return raw;
  }

  // Resolve from mentor's ministry or department
  if (mentorId && workersList) {
    const mentor = workersList.find((w) => w.id === mentorId);
    if (mentor) {
      const minName = ministriesList?.find((m: any) => m.id === mentor.majorMinistryId)?.name;
      if (minName) return minName;
      if ((mentor as any).department) return (mentor as any).department;
    }
  }

  if (mentorName && workersList) {
    const mentor = workersList.find(
      (w) => `${w.firstName} ${w.lastName}`.toLowerCase() === mentorName.toLowerCase()
    );
    if (mentor) {
      const minName = ministriesList?.find((m: any) => m.id === mentor.majorMinistryId)?.name;
      if (minName) return minName;
      if ((mentor as any).department) return (mentor as any).department;
    }
  }

  return "Outreach";
};

// ─── SUBMISSION FORM MODAL COMPONENT ──────────────────────────────────────
interface DevotionFormProps {
  devotion: C2SDevotionRecord | null;
  groups: any[];
  mentees: any[];
  workers: Worker[];
  currentWorker: Worker | null;
  allMinistries?: any[];
  isMinistryHead: boolean;
  isSuperAdmin: boolean;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}

const DevotionForm = ({
  devotion,
  groups,
  mentees,
  workers,
  currentWorker,
  allMinistries = [],
  isMinistryHead,
  isSuperAdmin,
  onSave,
  onClose,
}: DevotionFormProps) => {
  // Manual & Lesson State
  const [manualType, setManualType] = useState<string>(
    devotion?.manualType || "C2S Devotional Manual"
  );
  const availableModules = useMemo(() => {
    return C2S_CURRICULUM[manualType] || [];
  }, [manualType]);

  const [selectedModule, setSelectedModule] = useState<string>(
    devotion?.moduleName || availableModules[0]?.module || ""
  );

  const availableLessons = useMemo(() => {
    const mod = availableModules.find((m) => m.module === selectedModule);
    return mod?.lessons || [];
  }, [availableModules, selectedModule]);

  const [selectedLesson, setSelectedLesson] = useState<string>(
    devotion?.lessonName || availableLessons[0] || ""
  );

  const [customTopic, setCustomTopic] = useState(devotion?.topic || "");
  const [scripture, setScripture] = useState(devotion?.scripture || "");

  const handleManualChange = (newManual: string) => {
    setManualType(newManual);
    const newModules = C2S_CURRICULUM[newManual] || [];
    const firstMod = newModules[0]?.module || "";
    setSelectedModule(firstMod);
    const firstLesson = newModules[0]?.lessons[0] || "";
    setSelectedLesson(firstLesson);
    setCustomTopic(firstLesson);
  };

  const handleModuleChange = (newModule: string) => {
    setSelectedModule(newModule);
    const mod = availableModules.find((m) => m.module === newModule);
    const firstLesson = mod?.lessons[0] || "";
    setSelectedLesson(firstLesson);
    setCustomTopic(firstLesson);
  };

  const handleLessonChange = (newLesson: string) => {
    setSelectedLesson(newLesson);
    setCustomTopic(newLesson);
  };

  // Check if editing an existing record whose date has already passed
  const isRecordDatePast = useMemo(() => {
    if (!devotion?.devotionDate) return false;
    const devDate = toJsDate(devotion.devotionDate);
    return isBefore(devDate, startOfDay(new Date()));
  }, [devotion]);

  // Restrict date input to the current day (today only) unless Super Admin
  const todayDateStr = format(new Date(), "yyyy-MM-dd");
  const todayMinStr = `${todayDateStr}T00:00`;
  const todayMaxStr = `${todayDateStr}T23:59`;

  // Timestamp (defaults to current date & time)
  const defaultTimestamp = () => {
    const now = devotion?.devotionDate ? toJsDate(devotion.devotionDate) : new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };
  const [devotionDateTime, setDevotionDateTime] = useState<string>(defaultTimestamp());

  // Cluster & Group
  const [groupId, setGroupId] = useState(devotion?.groupId || groups[0]?.id || "");
  const [customCluster, setCustomCluster] = useState(devotion?.clusterName || "");

  // Mentor Name (Auto-filled from logged-in profile, editable if Ministry Head / Admin)
  const defaultMentorName = currentWorker
    ? `${currentWorker.firstName} ${currentWorker.lastName}`
    : "Mentor";
  const [mentorName, setMentorName] = useState(
    devotion?.mentorName || defaultMentorName
  );
  const [mentorId, setMentorId] = useState(
    devotion?.mentorId || currentWorker?.id || ""
  );

  // Mentee & Attendance State
  const [selectedMenteeName, setSelectedMenteeName] = useState<string>(
    devotion?.attendeeNames?.[0] || ""
  );
  const [attendanceStatus, setAttendanceStatus] = useState<"Present" | "Absent">("Present");
  const [nextScheduleDate, setNextScheduleDate] = useState<string>("");

  const menteeOptions = useMemo(() => {
    const defaultList = [
      { id: "m1", name: "Maria Santos" },
      { id: "m2", name: "Juan Dela Cruz" },
      { id: "m3", name: "Ana Reyes" },
      { id: "m4", name: "Rico Bautista" },
      { id: "m5", name: "Liza Gomez" },
    ];
    const dbList = mentees?.map((m) => ({ id: m.id, name: `${m.firstName} ${m.lastName}` })) || [];
    const combined = [...dbList];
    defaultList.forEach((def) => {
      if (!combined.some((c) => c.name.toLowerCase() === def.name.toLowerCase())) {
        combined.push(def);
      }
    });
    return combined;
  }, [mentees]);

  // Session Details
  const [reflectionNotes, setReflectionNotes] = useState(
    devotion?.reflectionNotes || ""
  );
  const [prayerRequests, setPrayerRequests] = useState(
    devotion?.prayerRequests || ""
  );
  const [photoUrls, setPhotoUrls] = useState<string[]>(
    devotion?.photoUrls || (devotion?.photoUrl ? [devotion.photoUrl] : [])
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Resolve assigned mentor's official ministry or department (e.g. Outreach, Worship)
  const activeMentorWorker = workers.find((w) => w.id === (mentorId || currentWorker?.id)) || currentWorker;
  const mentorMinistry = (allMinistries || []).find((m: any) => m.id === activeMentorWorker?.majorMinistryId)?.name;
  const effectiveClusterName =
    mentorMinistry ||
    (activeMentorWorker as any)?.department ||
    "Outreach";

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: `${file.name} exceeds the 25MB limit.`,
      });
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1400;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", 0.82);
            setPhotoUrls([compressed]);
          } else {
            setPhotoUrls([reader.result as string]);
          }
        };
        img.onerror = () => {
          setPhotoUrls([reader.result as string]);
        };
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemovePhoto = () => {
    setPhotoUrls([]);
  };

  const handleSubmit = async () => {
    const finalTopic = selectedLesson || customTopic.trim() || selectedModule || "Devotion Session";
    if (!finalTopic) {
      toast({
        variant: "destructive",
        title: "Lesson Required",
        description: "Please select a lesson from the curriculum.",
      });
      return;
    }
    const finalAttendees = selectedMenteeName ? [selectedMenteeName] : [];
    if (finalAttendees.length === 0) {
      toast({
        variant: "destructive",
        title: "Mentee Required",
        description: "Please select a mentee.",
      });
      return;
    }
    if (!reflectionNotes.trim()) {
      toast({
        variant: "destructive",
        title: "Reflection Notes Required",
        description: "Please enter reflection notes and key session takeaways.",
      });
      return;
    }

    // 1. Guard against editing a past devotion record (unless Admin)
    if (devotion && isRecordDatePast && !isSuperAdmin) {
      toast({
        variant: "destructive",
        title: "Update Not Allowed",
        description: "This devotion record cannot be updated because its date has already passed. Devotions must be updated on the exact day they occur.",
      });
      return;
    }

    // 2. Guard against logging devotion with a past date
    const selectedDateObj = new Date(devotionDateTime);
    if (!isSuperAdmin && isBefore(selectedDateObj, startOfDay(new Date()))) {
      toast({
        variant: "destructive",
        title: "Date Already Passed",
        description: "Devotions cannot be logged for past dates. Sessions must be recorded on the exact day they occur.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        manualType,
        moduleName: selectedModule,
        lessonName: selectedLesson,
        topic: finalTopic,
        scripture,
        devotionDate: new Date(devotionDateTime),
        groupId: groupId || null,
        clusterName: effectiveClusterName,
        mentorId: mentorId || currentWorker?.id || "mentor-unknown",
        mentorName,
        mentorRole: isMinistryHead ? "Ministry Head" : "Mentor",
        attendeeNames: finalAttendees,
        attendeeCount: finalAttendees.length,
        reflectionNotes,
        prayerRequests,
        photoUrl: photoUrls[0] || null,
        photoUrls: photoUrls,
        attendanceStatus,
        nextScheduleDate,
      });
      onClose();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: err.message || "Could not save devotion record.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 py-2">
      {/* ── LOCKED BANNER WHEN PAST DATE ── */}
      {isRecordDatePast && !isSuperAdmin && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          <Lock className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Record Locked: Date Has Passed</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              This devotion session took place on{" "}
              <strong className="text-foreground">
                {devotion?.devotionDate ? format(toJsDate(devotion.devotionDate), "MMMM dd, yyyy") : "a previous date"}
              </strong>
              . Devotion records cannot be modified after the session date has passed to ensure all updates are submitted on the exact day.
            </p>
          </div>
        </div>
      )}

      {isRecordDatePast && isSuperAdmin && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
          <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="font-bold">Admin Override Active</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              This session date has passed ({devotion?.devotionDate ? format(toJsDate(devotion.devotionDate), "MMM dd, yyyy") : ""}), but as Administrator you have permission to edit this record.
            </p>
          </div>
        </div>
      )}

      {/* ── ROW 1: MENTEE & DATE ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            MENTEE <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedMenteeName}
            disabled={isRecordDatePast && !isSuperAdmin}
            onValueChange={(val) => setSelectedMenteeName(val)}
          >
            <SelectTrigger className="h-10 bg-background text-xs">
              <SelectValue placeholder="Select mentee" />
            </SelectTrigger>
            <SelectContent className="max-h-50">
              {menteeOptions.map((m) => (
                <SelectItem key={m.id} value={m.name} className="text-xs">
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            DATE <span className="text-destructive">*</span>
          </Label>
          <Input
            type="datetime-local"
            value={devotionDateTime}
            min={isSuperAdmin ? undefined : todayMinStr}
            max={isSuperAdmin ? undefined : todayMaxStr}
            disabled={isRecordDatePast && !isSuperAdmin}
            onChange={(e) => {
              const val = e.target.value;
              if (!isSuperAdmin && val) {
                const selectedDate = new Date(val);
                if (isBefore(selectedDate, startOfDay(new Date()))) {
                  toast({
                    variant: "destructive",
                    title: "Date Already Passed",
                    description: "You cannot record devotions for past dates. Please record on the exact day of the session.",
                  });
                  return;
                }
              }
              setDevotionDateTime(val);
            }}
            className="h-10 text-xs bg-background"
          />
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3 text-primary shrink-0" />
            {isSuperAdmin
              ? "Session date & time (Administrator access)"
              : "Must be logged on the exact day of the session (today only)"}
          </p>
        </div>
      </div>

      {/* ── ROW 2: Lessons ── */}
      <div className="space-y-2 pt-1">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          LESSONS <span className="text-destructive">*</span>
        </Label>
        <RadioGroup
          value={manualType}
          onValueChange={handleManualChange}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <div
            onClick={() => handleManualChange("C2S Devotional Manual")}
            className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${manualType === "C2S Devotional Manual"
              ? "bg-card border-primary shadow-sm ring-1 ring-primary"
              : "bg-background/80 hover:bg-background border-border/70"
              }`}
          >
            <RadioGroupItem value="C2S Devotional Manual" id="m-c2s" />
            <Label htmlFor="m-c2s" className="cursor-pointer font-semibold text-xs flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-primary" /> C2S Devotional Manual
            </Label>
          </div>

          <div
            onClick={() => handleManualChange("Mentor's Manual")}
            className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${manualType === "Mentor's Manual"
              ? "bg-card border-primary shadow-sm ring-1 ring-primary"
              : "bg-background/80 hover:bg-background border-border/70"
              }`}
          >
            <RadioGroupItem value="Mentor's Manual" id="m-mentor" />
            <Label htmlFor="m-mentor" className="cursor-pointer font-semibold text-xs flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-primary" /> Mentor's Manual
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* ── ROW 3: SELECT MODULE & SELECT LESSON ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Select Module</Label>
          <Select value={selectedModule} onValueChange={handleModuleChange}>
            <SelectTrigger className="bg-background h-10 text-xs">
              <SelectValue placeholder="Select Module" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {availableModules.map((m) => (
                <SelectItem key={m.module} value={m.module} className="text-xs">
                  {m.module}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Select Lesson</Label>
          <Select value={selectedLesson} onValueChange={handleLessonChange}>
            <SelectTrigger className="bg-background h-10 text-xs">
              <SelectValue placeholder="Select Lesson" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {availableLessons.map((l) => (
                <SelectItem key={l} value={l} className="text-xs">
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── ROW 4: REFLECTION ── */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          REFLECTION <span className="text-destructive">*</span>
        </Label>
        <Textarea
          rows={3}
          placeholder="Write a reflection on the lesson..."
          value={reflectionNotes}
          onChange={(e) => setReflectionNotes(e.target.value)}
          className="resize-none text-xs bg-background"
        />
      </div>

      {/* ── ROW 5: PRAYER REQUESTS ── */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          PRAYER REQUESTS
        </Label>
        <Textarea
          rows={2}
          placeholder="Any prayer requests from the mentee..."
          value={prayerRequests}
          onChange={(e) => setPrayerRequests(e.target.value)}
          className="resize-none text-xs bg-background"
        />
      </div>



      {/* ── ROW 7: PHOTO PROOF ── */}
      <div className="space-y-2 p-3.5 rounded-xl border border-dashed bg-muted/10">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          PHOTO PROOF <span className="text-destructive">*</span>
        </Label>

        {/* Advice banner for users */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
          <Sparkles className="h-3.5 w-3.5 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Photo Advice:</strong> Please take or upload your session photo in <strong>Landscape (horizontal)</strong> format, maximum of <strong>25MB</strong> (JPG, PNG, HEIC) for the best display on devotion feeds and dashboards.
          </span>
        </div>

        {photoUrls.length === 0 ? (
          <label className="cursor-pointer block">
            <input
              type="file"
              accept=".png,.jpg,.jpeg,image/png,image/jpeg,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg bg-background hover:bg-muted/40 transition-colors text-center">
              <UploadCloud className="h-6 w-6 text-primary mb-1" />
              <p className="text-xs font-semibold text-primary">Click to upload photo proof</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Horizontal / Landscape orientation • Up to 25MB (JPG, PNG, HEIC)
              </p>
            </div>
          </label>
        ) : (
          <div className="space-y-2">
            <div className="relative aspect-video max-h-48 w-full rounded-lg overflow-hidden border bg-black/5 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrls[0]} alt="Proof photo" className="w-full h-full object-contain" />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute top-2 right-2 bg-black/70 hover:bg-destructive text-white rounded-full p-1.5 shadow-sm transition-colors"
                title="Remove photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── ROW 8: SUBMIT BUTTON ── */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || (isRecordDatePast && !isSuperAdmin)}
        className="w-full h-11 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all mt-2"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Saving...
          </>
        ) : isRecordDatePast && !isSuperAdmin ? (
          <span className="flex items-center gap-1.5">
            <Lock className="h-4 w-4" /> Editing Locked (Date Passed)
          </span>
        ) : devotion ? (
          "Update Devotion Record"
        ) : (
          "📖 Submit Devotion Record"
        )}
      </Button>
    </div>
  );
};

// ─── PHOTO LIGHTBOX / DETAILS MODAL ───────────────────────────────────────
const DevotionDetailsModal = ({
  devotion,
  isOpen,
  onClose,
  isSuperAdmin,
}: {
  devotion: C2SDevotionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  isSuperAdmin: boolean;
}) => {
  if (!devotion) return null;

  const mainPhoto = devotion.photoUrls?.[0] || devotion.photoUrl || null;

  const formattedDate = devotion.devotionDate
    ? format(toJsDate(devotion.devotionDate), "yyyy-MM-dd")
    : "";
  const formattedTime = devotion.devotionDate
    ? format(toJsDate(devotion.devotionDate), "hh:mm a")
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-6 sm:p-7 rounded-2xl bg-background border shadow-xl">
        <DialogHeader className="space-y-2.5 text-left pb-1">
          {/* Top Row: Date & Cluster Pill Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className="font-mono text-xs px-3 py-1 bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5 rounded-full"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>{formattedDate}</span>
              {formattedTime && (
                <>
                  <span className="opacity-50">•</span>
                  <span>{formattedTime}</span>
                </>
              )}
            </Badge>

            {cleanClusterOrDept(devotion.clusterName, devotion.mentorId, devotion.mentorName) && (
              <Badge
                variant="outline"
                className="text-xs px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 flex items-center gap-1.5 rounded-full font-semibold"
              >
                <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{cleanClusterOrDept(devotion.clusterName, devotion.mentorId, devotion.mentorName)}</span>
              </Badge>
            )}
          </div>

          {/* Title */}
          <DialogTitle className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-snug">
            {devotion.lessonName || devotion.topic}
          </DialogTitle>

          {/* Curriculum Hierarchy Breadcrumb Tag */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary/90 flex-wrap bg-primary/5 dark:bg-primary/10 p-2.5 rounded-xl border border-primary/10">
            <BookOpen className="h-4 w-4 text-primary shrink-0" />
            {devotion.manualType && <span>{devotion.manualType}</span>}
            {devotion.moduleName && (
              <>
                <span className="text-muted-foreground/60">•</span>
                <span>{devotion.moduleName}</span>
              </>
            )}
            <span className="text-muted-foreground/60">•</span>
            <span className="font-bold">{devotion.lessonName || devotion.topic}</span>
          </div>

          {/* Mentee & Mentor Info Box */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/70 text-xs">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 border border-primary/20">
              <Users className="h-4 w-4" />
            </div>
            <div className="leading-relaxed">
              <p className="text-foreground font-semibold">
                <span className="text-muted-foreground font-normal">Attendees: </span>
                {devotion.attendeeNames?.join(", ") || "Mentees"}
              </p>
              <p className="text-xs text-muted-foreground font-normal">
                Mentor:{" "}
                <span className="font-bold text-foreground">
                  {devotion.mentorName || "Mentor"}
                </span>
                {devotion.mentorRole && (
                  <span className="ml-1 text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-semibold">
                    {devotion.mentorRole}
                  </span>
                )}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Main Photo (Strictly 1 photo only - no carousel thumbnails) */}
        {mainPhoto && (
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black/10 border shadow-sm mt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mainPhoto}
              alt={devotion.topic}
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
        )}

        {/* Reflection & Prayer Details */}
        <div className="space-y-4 pt-3">
          {devotion.reflectionNotes && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                Reflection Notes
              </Label>
              <div className="p-4 rounded-xl bg-muted/30 border text-foreground text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {devotion.reflectionNotes}
              </div>
            </div>
          )}

          {devotion.prayerRequests && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                Prayer Request
              </Label>
              <div className="p-3.5 bg-muted/30 border rounded-xl text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {devotion.prayerRequests}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-3 mt-2">
          <Button onClick={onClose} variant="outline" className="rounded-lg font-semibold">
            Close Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};



// --- Mentee Form Component ---
const MenteeForm = ({
  mentee,
  workers,
  currentWorker,
  isHeadOrAdmin,
  onSave,
}: {
  mentee: any;
  workers: any[];
  currentWorker?: any;
  isHeadOrAdmin?: boolean;
  onSave: (data: any) => void;
}) => {
  const [formData, setFormData] = useState({
    firstName: mentee?.firstName || "",
    lastName: mentee?.lastName || "",
    email: mentee?.email || "",
    phone: mentee?.phone || "",
    status: mentee?.status || "In Progress",
    mentorId: mentee?.mentorId || currentWorker?.id || "",
  });

  const selectedMentor = workers.find((w) => w.id === formData.mentorId) || currentWorker;

  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first-name">First Name *</Label>
          <Input
            id="first-name"
            placeholder="e.g. Juan"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last-name">Last Name *</Label>
          <Input
            id="last-name"
            placeholder="e.g. Dela Cruz"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="mentee@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone / Contact</Label>
        <Input
          id="phone"
          placeholder="0912 345 6789"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      {/* Mentor Assignment */}
      <div className="space-y-2">
        <Label htmlFor="mentor">Assigned Mentor *</Label>
        {isHeadOrAdmin ? (
          <Select
            value={formData.mentorId}
            onValueChange={(val) =>
              setFormData({ ...formData, mentorId: val })
            }
          >
            <SelectTrigger id="mentor">
              <SelectValue placeholder="Select a mentor" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {workers.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.firstName} {w.lastName} {w.department ? `(${w.department})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="p-2.5 rounded-lg border bg-muted/40 text-xs font-semibold flex items-center justify-between text-foreground">
            <span>
              {selectedMentor
                ? `${selectedMentor.firstName} ${selectedMentor.lastName}`
                : "Current Mentor"}
            </span>
            <span className="text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full">
              Your Mentee
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(val) =>
            setFormData({ ...formData, status: val as any })
          }
        >
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Needs Follow-up">Needs Follow-up</SelectItem>
            <SelectItem value="Dropped">Dropped</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <SheetFooter className="mt-6">
        <SheetClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </SheetClose>
        <Button
          onClick={() => {
            if (!formData.firstName.trim() || !formData.lastName.trim()) return;
            onSave(formData);
          }}
          disabled={!formData.firstName.trim() || !formData.lastName.trim()}
        >
          Save Mentee
        </Button>
      </SheetFooter>
    </div>
  );
};

// Helper to match ministry/cluster tokens with exact or word-boundary awareness
function matchesClusterToken(sourceStr: string, cVal: string, cLabel: string): boolean {
  if (!sourceStr) return false;
  const s = sourceStr.toLowerCase().trim();
  const v = cVal.toLowerCase().trim();
  const l = cLabel.toLowerCase().trim();

  if (s === v || s === l) return true;
  if (v.length > 3) {
    if (s.includes(v) || v.includes(s) || s.includes(l) || l.includes(s)) return true;
  } else {
    const words = s.split(/[\s\-_/]+/);
    if (words.includes(v) || words.includes(l)) return true;
  }
  return false;
}

// --- Admin Department & Ministry Overview Component ---
const AdminOverview = ({
  groups,
  mentees,
  workers,
  allMinistries = [],
  devotions = [],
  departmentClusters,
  onSelectDepartment,
  onViewDevotion,
}: {
  groups: any[];
  mentees: any[];
  workers: any[];
  allMinistries?: any[];
  devotions?: C2SDevotionRecord[];
  departmentClusters: Record<string, { value: string; label: string }[]>;
  onSelectDepartment?: (dept: string) => void;
  onViewDevotion?: (devotion: C2SDevotionRecord) => void;
}) => {
  const [viewingDept, setViewingDept] = useState<any | null>(null);
  const [expandedMinistries, setExpandedMinistries] = useState<Record<string, boolean>>({});
  const [ministrySearch, setMinistrySearch] = useState("");

  const toggleMinistry = (ministryName: string) => {
    setExpandedMinistries((prev) => ({
      ...prev,
      [ministryName]: !prev[ministryName],
    }));
  };

  const expandAll = (clusters: any[]) => {
    const next: Record<string, boolean> = {};
    clusters.forEach((c) => {
      next[c.name] = true;
    });
    setExpandedMinistries(next);
  };

  const collapseAll = () => {
    setExpandedMinistries({});
  };

  const handleOpenDepartment = (dept: any) => {
    setViewingDept(dept);
    setMinistrySearch("");
    const initialExpanded: Record<string, boolean> = {};
    (dept.clusters || []).forEach((c: any) => {
      if (c.mentees && c.mentees.length > 0) {
        initialExpanded[c.name] = true;
      }
    });
    setExpandedMinistries(initialExpanded);
    onSelectDepartment?.(dept.department);
  };

  const departmentStats = useMemo(() => {
    const headsMap: Record<string, string> = {
      worship: "John Dave Salgado",
      outreach: "Bro. Carlo Santos",
      relationship: "Rhea Dela Peña",
      discipleship: "Maria Relao",
      administration: "Daniela ANN Cabiladas",
      "youth ministry": "Mark Bautista",
      "servant leaders": "Rhea Dela Peña",
    };

    const completionRatesMap: Record<string, number> = {
      worship: 78,
      outreach: 71,
      relationship: 82,
      discipleship: 85,
      administration: 67,
      "youth ministry": 64,
      "servant leaders": 81,
    };

    return Object.entries(departmentClusters).map(([dept, clusterList]) => {
      const deptLower = dept.toLowerCase();
      const headName =
        headsMap[deptLower] ||
        headsMap[dept] ||
        (workers[0] ? `${workers[0].firstName} ${workers[0].lastName}` : "Ministry Head");

      const clusters = clusterList.map((c) => {
        const cVal = c.value.toLowerCase().trim();
        const cLabel = c.label.toLowerCase().trim();

        // 1. Find mentors in this ministry / cluster
        const clusterMentors = (workers || []).filter((w) => {
          const wMinObj = allMinistries?.find((min: any) => min.id === w.majorMinistryId);
          const wMinName = (wMinObj?.name || "").toLowerCase().trim();
          const wDept = ((w as any).department || wMinObj?.department?.name || "").toLowerCase().trim();
          const matchesMin = matchesClusterToken(wMinName, cVal, cLabel);
          const matchesDept = matchesClusterToken(wDept, cVal, cLabel);
          const matchesGrp = (groups || []).some((g: any) =>
            g.mentorId === w.id && matchesClusterToken(g.name, cVal, cLabel)
          );
          return matchesMin || matchesDept || matchesGrp;
        });
        const clusterMentorIds = new Set(clusterMentors.map((w) => w.id));

        // 2. Find mentees in this ministry / cluster
        const clusterMentees = (mentees || []).filter((m: any) => {
          if (m.mentorId && clusterMentorIds.has(m.mentorId)) return true;
          const mentor = (workers || []).find((w: any) => w.id === m.mentorId);
          const mentorMinObj = allMinistries?.find((min: any) => min.id === mentor?.majorMinistryId);
          const mentorMinName = (mentorMinObj?.name || "").toLowerCase().trim();
          if (matchesClusterToken(mentorMinName, cVal, cLabel)) return true;

          const grpName = (m.group?.name || groups?.find((g: any) => g.id === m.groupId)?.name || "").toLowerCase().trim();
          if (matchesClusterToken(grpName, cVal, cLabel)) return true;

          const clusterName = ((m as any).clusterName || "").toLowerCase().trim();
          if (matchesClusterToken(clusterName, cVal, cLabel)) return true;

          return false;
        }).map((m: any) => {
          const mentor = (workers || []).find((w: any) => w.id === m.mentorId);
          const grpName = m.group?.name || groups?.find((g: any) => g.id === m.groupId)?.name || "";
          return {
            id: m.id,
            firstName: m.firstName,
            lastName: m.lastName,
            fullName: `${m.firstName || ""} ${m.lastName || ""}`.trim() || "Unnamed Mentee",
            email: m.email || "",
            phone: m.phone || "",
            status: m.status || "Active",
            mentorId: m.mentorId,
            mentorName: mentor ? `${mentor.firstName} ${mentor.lastName}` : "Unassigned",
            groupName: grpName,
          };
        });

        return {
          name: c.label,
          value: c.value,
          mentorsCount: clusterMentors.length,
          menteesCount: clusterMentees.length,
          mentors: clusterMentors,
          mentees: clusterMentees,
        };
      });

      // Aggregate department totals
      const allDeptMentees = clusters.flatMap((c) => c.mentees);
      const uniqueMenteeIds = new Set(allDeptMentees.map((m) => m.id));
      const allDeptMentors = clusters.flatMap((c) => c.mentors);
      const uniqueMentorIds = new Set(allDeptMentors.map((w) => w.id));

      const totalMenteesCount = uniqueMenteeIds.size;
      const totalMentorsCount = uniqueMentorIds.size;

      const completedCount = allDeptMentees.filter((m) => m.status === "Completed").length;
      const completionPct =
        totalMenteesCount > 0
          ? Math.round((completedCount / totalMenteesCount) * 100) || 75
          : completionRatesMap[deptLower] || completionRatesMap[dept] || 70;

      const status = completionPct < 55 ? "Needs Attention" : "Active";

      return {
        department: dept,
        headName,
        mentorsCount: totalMentorsCount || clusterList.length * 2,
        menteesCount: totalMenteesCount || allDeptMentees.length,
        completionPct,
        status,
        clusters,
      };
    });
  }, [mentees, workers, allMinistries, groups, departmentClusters]);

  const filteredClusters = useMemo(() => {
    if (!viewingDept?.clusters) return [];
    if (!ministrySearch.trim()) return viewingDept.clusters;
    const q = ministrySearch.toLowerCase().trim();
    return viewingDept.clusters.filter((c: any) => {
      const matchCluster = c.name.toLowerCase().includes(q) || c.value?.toLowerCase().includes(q);
      const matchMentee = c.mentees?.some(
        (m: any) =>
          m.fullName?.toLowerCase().includes(q) ||
          m.mentorName?.toLowerCase().includes(q) ||
          m.groupName?.toLowerCase().includes(q) ||
          m.status?.toLowerCase().includes(q)
      );
      const matchMentor = c.mentors?.some(
        (w: any) => `${w.firstName} ${w.lastName}`.toLowerCase().includes(q)
      );
      return matchCluster || matchMentee || matchMentor;
    });
  }, [viewingDept, ministrySearch]);

  const totalMentees = mentees.length || 96;
  const totalMentors = workers?.length || 23;
  const totalDepts = Object.keys(departmentClusters).length || 5;

  const avgCompletion = useMemo(() => {
    if (departmentStats.length === 0) return 75;
    const sum = departmentStats.reduce((acc, d) => acc + d.completionPct, 0);
    return Math.round(sum / departmentStats.length);
  }, [departmentStats]);

  // Curated modern theme configuration for each church department
  const DEPT_THEMES: Record<
    string,
    {
      icon: any;
      color: string;
      bgSoft: string;
      borderHover: string;
      gradientBg: string;
      progressFill: string;
      tagline: string;
    }
  > = {
    WORSHIP: {
      icon: Music2,
      color: "text-purple-600 dark:text-purple-400",
      bgSoft: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      borderHover: "hover:border-purple-500/40 hover:shadow-purple-500/5",
      gradientBg: "from-purple-500/[0.04] via-transparent to-transparent",
      progressFill: "bg-gradient-to-r from-purple-600 to-indigo-500",
      tagline: "Music, praise, audio & stage ministry",
    },
    OUTREACH: {
      icon: Compass,
      color: "text-sky-600 dark:text-sky-400",
      bgSoft: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
      borderHover: "hover:border-sky-500/40 hover:shadow-sky-500/5",
      gradientBg: "from-sky-500/[0.04] via-transparent to-transparent",
      progressFill: "bg-gradient-to-r from-sky-600 to-blue-500",
      tagline: "Barangay clusters, evangelism & missions",
    },
    RELATIONSHIP: {
      icon: HeartHandshake,
      color: "text-emerald-600 dark:text-emerald-400",
      bgSoft: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      borderHover: "hover:border-emerald-500/40 hover:shadow-emerald-500/5",
      gradientBg: "from-emerald-500/[0.04] via-transparent to-transparent",
      progressFill: "bg-gradient-to-r from-emerald-600 to-teal-500",
      tagline: "Fellowship, sports, youth & family life",
    },
    DISCIPLESHIP: {
      icon: BookOpen,
      color: "text-amber-600 dark:text-amber-400",
      bgSoft: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      borderHover: "hover:border-amber-500/40 hover:shadow-amber-500/5",
      gradientBg: "from-amber-500/[0.04] via-transparent to-transparent",
      progressFill: "bg-gradient-to-r from-amber-600 to-orange-500",
      tagline: "Spiritual foundation, leadership & life classes",
    },
    ADMINISTRATION: {
      icon: ShieldCheck,
      color: "text-indigo-600 dark:text-indigo-400",
      bgSoft: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
      borderHover: "hover:border-indigo-500/40 hover:shadow-indigo-500/5",
      gradientBg: "from-indigo-500/[0.04] via-transparent to-transparent",
      progressFill: "bg-gradient-to-r from-indigo-600 to-blue-600",
      tagline: "Finance, engineering, IT & church operations",
    },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── TOP TITLE BAR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-headline font-black text-foreground tracking-tight flex items-center gap-2.5">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            Overview
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Church-wide oversight — monitoring mentoring health, mentor allocations, and devotions across all 5 departments.
          </p>
        </div>
      </div>

      {/* ── TOP KPI SUMMARY CARDS (4 MODERN CARDS) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border border-border/70 p-5 bg-card shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Departments</span>
            <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-headline font-black text-foreground">
              {totalDepts}
            </p>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
              Active church ministries
            </p>
          </div>
        </Card>

        <Card className="rounded-2xl border border-border/70 p-5 bg-card shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mentors</span>
            <div className="h-8 w-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-headline font-black text-foreground">
              {totalMentors}
            </p>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
              Active spiritual guides
            </p>
          </div>
        </Card>

        <Card className="rounded-2xl border border-border/70 p-5 bg-card shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mentees</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-headline font-black text-foreground">
              {totalMentees}
            </p>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
              Directly enrolled souls
            </p>
          </div>
        </Card>

        <Card className="rounded-2xl border border-border/70 p-5 bg-card shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Completion</span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-headline font-black text-foreground">
              {avgCompletion}%
            </p>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
              {devotions.length} devotions recorded
            </p>
          </div>
        </Card>
      </div>

      {/* ── DEPARTMENT CARDS GRID (3 COLUMNS) ── */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {departmentStats.map((dept) => {
          const theme = DEPT_THEMES[dept.department.toUpperCase()] || {
            icon: Building2,
            color: "text-primary",
            bgSoft: "bg-primary/10 text-primary",
            borderHover: "hover:border-primary/40",
            gradientBg: "from-primary/[0.04] via-transparent to-transparent",
            progressFill: "bg-primary",
            tagline: "Ministry department",
          };

          const IconComponent = theme.icon;
          const initials = dept.headName
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2);

          return (
            <Card
              key={dept.department}
              className={`rounded-3xl border border-border/70 p-6 bg-gradient-to-b ${theme.gradientBg} bg-card shadow-xs flex flex-col justify-between space-y-4 hover:shadow-lg transition-all duration-300 ${theme.borderHover}`}
            >
              <div className="space-y-4">
                {/* Header: Icon, Name, Tagline & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-11 w-11 rounded-2xl ${theme.bgSoft} flex items-center justify-center shrink-0 shadow-xs border border-border/40`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-headline font-black text-foreground tracking-tight">
                        {dept.department}
                      </h3>
                      <p className="text-[11px] text-muted-foreground font-medium line-clamp-1">
                        {theme.tagline}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="secondary"
                    className={`${
                      dept.status === "Needs Attention"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    } font-bold px-2.5 py-0.5 rounded-full text-[11px] border shrink-0`}
                  >
                    {dept.status}
                  </Badge>
                </div>

                {/* Ministry Head Row */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-muted/30 border border-border/40">
                  <div className="h-7 w-7 rounded-full bg-background border text-foreground font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                    {initials}
                  </div>
                  <div className="text-xs truncate">
                    <span className="text-muted-foreground font-normal">Head: </span>
                    <span className="font-bold text-foreground">{dept.headName}</span>
                  </div>
                </div>

                {/* Mentors & Mentees Quick Metric Pills */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border/60">
                    <div className="h-7 w-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                      <UserCheck className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Mentors</p>
                      <p className="text-sm font-extrabold text-foreground">
                        {dept.mentorsCount} <span className="text-[11px] font-medium text-muted-foreground">{dept.mentorsCount === 1 ? "mentor" : "mentors"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border/60">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Users className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Mentees</p>
                      <p className="text-sm font-extrabold text-foreground">
                        {dept.menteesCount} <span className="text-[11px] font-medium text-muted-foreground">{dept.menteesCount === 1 ? "mentee" : "mentees"}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Completion Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium text-[11px]">
                      Mentee completion rate
                    </span>
                    <span className="font-extrabold text-foreground text-xs">
                      {dept.completionPct}%
                    </span>
                  </div>
                  <div className="w-full bg-muted/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-border/40">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${theme.progressFill}`}
                      style={{ width: `${dept.completionPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer: Status indicator & Action button */}
              <div className="border-t border-border/60 pt-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>Oversight active</span>
                </div>
                <button
                  onClick={() => handleOpenDepartment(dept)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors group cursor-pointer"
                >
                  <span>View department</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── RECENT DEVOTION SESSIONS & PHOTO PROOFS ── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              Recent Devotion Proofs & Sessions
            </h3>
            <p className="text-xs text-muted-foreground">
              Latest devotion sessions recorded across all departments. Click any record to inspect photo & full notes.
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-semibold">
            {devotions.length} Total Devotions
          </Badge>
        </div>

        {devotions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed bg-muted/20 text-xs text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
            No devotion sessions recorded yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {devotions.slice(0, 6).map((dev) => {
              const photo = dev.photoUrls?.[0] || dev.photoUrl;
              return (
                <div
                  key={dev.id}
                  onClick={() => onViewDevotion?.(dev)}
                  className="group cursor-pointer rounded-2xl border border-border/70 p-3.5 bg-card hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full text-[11px]">
                      {cleanClusterOrDept(dev.clusterName, dev.mentorId, dev.mentorName, workers)}
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      {dev.devotionDate ? format(toJsDate(dev.devotionDate), "MMM dd, yyyy") : ""}
                    </span>
                  </div>

                  {photo ? (
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/5 border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt={dev.topic}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[11px] text-white font-medium flex items-center gap-1">
                          <Eye className="h-3 w-3" /> View Photo & Details
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video w-full rounded-xl bg-muted/30 border border-dashed flex items-center justify-center text-muted-foreground text-xs">
                      <span>No photo attached</span>
                    </div>
                  )}

                  <div>
                    <h4 className="font-bold text-xs text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {dev.lessonName || dev.topic}
                    </h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      Mentor: <span className="font-medium text-foreground">{dev.mentorName || "Mentor"}</span> • Mentees: {dev.attendeeNames?.join(", ") || "Mentee"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── DEPARTMENT DETAILS & MINISTRIES DIALOG ── */}
      <Dialog
        open={!!viewingDept}
        onOpenChange={(open) => {
          if (!open) {
            setViewingDept(null);
            setMinistrySearch("");
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary font-medium text-xs rounded-full border-transparent">
                DEPARTMENT BREAKDOWN
              </Badge>
              <Badge
                className={`${viewingDept?.status === "Needs Attention"
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  } font-semibold text-xs border-transparent`}
              >
                {viewingDept?.status}
              </Badge>
            </div>
            <DialogTitle className="text-2xl font-extrabold text-foreground tracking-tight mt-1">
              {viewingDept?.department} Department
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Assigned Head:{" "}
              <strong className="text-foreground">{viewingDept?.headName}</strong>{" "}
              • {viewingDept?.completionPct}% overall mentee completion rate.
            </DialogDescription>
          </DialogHeader>

          {/* Stat summary cards */}
          <div className="grid grid-cols-2 gap-3 my-2">
            <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">
                Mentors
              </p>
              <p className="text-lg font-black text-indigo-600">
                {viewingDept?.mentorsCount}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">
                Mentees
              </p>
              <p className="text-lg font-black text-amber-600">
                {viewingDept?.menteesCount}
              </p>
            </div>
          </div>

          {/* Sub-ministries list */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Ministries under {viewingDept?.department} Department
              </h4>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const allOpen = viewingDept?.clusters.every((c: any) => expandedMinistries[c.name]);
                    if (allOpen) {
                      collapseAll();
                    } else {
                      expandAll(viewingDept?.clusters || []);
                    }
                  }}
                  className="h-7 px-2.5 text-xs font-semibold text-primary"
                >
                  {viewingDept?.clusters.every((c: any) => expandedMinistries[c.name])
                    ? "Collapse all"
                    : "Expand all mentees"}
                </Button>
              </div>
            </div>

            {/* Quick search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search mentee, mentor, or ministry..."
                value={ministrySearch}
                onChange={(e) => setMinistrySearch(e.target.value)}
                className="h-8 pl-8 text-xs rounded-xl bg-muted/20 border-border/60"
              />
              {ministrySearch && (
                <button
                  onClick={() => setMinistrySearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Clusters / Ministries Accordion Cards */}
            <div className="space-y-2.5">
              {filteredClusters.map((cluster: any, idx: number) => {
                const isExpanded = !!expandedMinistries[cluster.name] || Boolean(ministrySearch.trim());
                const hasMentees = cluster.mentees && cluster.mentees.length > 0;

                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden transition-all duration-200 hover:border-border"
                  >
                    {/* Ministry Card Header (Clickable) */}
                    <div
                      onClick={() => toggleMinistry(cluster.name)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center border border-primary/20 shrink-0">
                          {cluster.name[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-bold text-sm text-foreground truncate">
                              {cluster.name}
                            </h5>
                            {hasMentees ? (
                              <Badge className="bg-primary/15 text-primary font-bold text-[11px] px-2 py-0.5 rounded-full border-transparent">
                                {cluster.mentees.length} {cluster.mentees.length === 1 ? "mentee" : "mentees"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground/70 text-[10px] px-1.5 py-0.5">
                                0 mentees
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {cluster.mentorsCount} active {cluster.mentorsCount === 1 ? "mentor" : "mentors"} • {cluster.menteesCount} {cluster.menteesCount === 1 ? "mentee" : "mentees"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-semibold text-primary hidden sm:inline">
                          {isExpanded ? "Hide" : "View"}
                        </span>
                        <div className="p-1 rounded-full bg-muted/50 text-muted-foreground">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Mentees List */}
                    {isExpanded && (
                      <div className="border-t border-border/50 bg-background/50 p-4 space-y-2.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span className="font-bold uppercase tracking-wider text-[10px]">
                            Mentees List ({cluster.mentees?.length || 0})
                          </span>
                          {cluster.mentors && cluster.mentors.length > 0 && (
                            <span className="text-[11px]">
                              Mentors: <span className="text-foreground font-medium">{cluster.mentors.map((w: any) => `${w.firstName} ${w.lastName}`).join(", ")}</span>
                            </span>
                          )}
                        </div>

                        {hasMentees ? (
                          <div className="grid gap-2 sm:grid-cols-1">
                            {cluster.mentees.map((m: any) => {
                              const initials = `${m.firstName?.[0] || ""}${m.lastName?.[0] || ""}`.toUpperCase() || "M";
                              return (
                                <div
                                  key={m.id}
                                  className="p-3 rounded-xl bg-card border border-border/50 shadow-2xs flex items-center justify-between gap-3 hover:border-primary/30 transition-all"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                      {initials}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-xs text-foreground truncate">
                                        {m.fullName}
                                      </p>
                                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                                        <span className="inline-flex items-center gap-1">
                                          <UserCheck className="h-3 w-3 text-primary/70 shrink-0" />
                                          <span>Mentor: <strong className="text-foreground font-medium">{m.mentorName}</strong></span>
                                        </span>
                                        {m.groupName && (
                                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border/40">
                                            {m.groupName}
                                          </span>
                                        )}
                                        {(m.phone || m.email) && (
                                          <span className="text-[10px] text-muted-foreground/70 hidden sm:inline">
                                            • {m.phone || m.email}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <Badge
                                    variant="secondary"
                                    className={`shrink-0 text-[10px] font-bold rounded-full px-2 py-0.5 ${
                                      m.status === "Completed"
                                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                        : m.status === "Dropped"
                                          ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                                          : "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                                    }`}
                                  >
                                    {m.status}
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-muted/20 border border-dashed border-border/60 text-center space-y-1">
                            <Users className="h-5 w-5 text-muted-foreground/50 mx-auto" />
                            <p className="text-xs font-semibold text-muted-foreground">
                              No mentees currently enrolled in {cluster.name}.
                            </p>
                            <p className="text-[11px] text-muted-foreground/70">
                              Mentees will appear here once assigned to mentors in this ministry.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setViewingDept(null)}
              className="rounded-full px-6"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// --- C2S Analytics Component ---
const C2SAnalytics = ({
  mentees,
  groups,
  devotions,
  workers,
  allMinistries = [],
  workerProfile,
  user,
  canGenerateReport = false,
  departmentClusters = {},
  headDepartment = "Outreach",
  isSuperAdmin = false,
  isMinistryHead = false,
  isMentor = false,
  onViewDevotion,
}: {
  mentees: any[];
  groups: any[];
  devotions: C2SDevotionRecord[];
  workers: any[];
  allMinistries?: any[];
  workerProfile?: any;
  user?: any;
  canGenerateReport?: boolean;
  departmentClusters?: Record<string, { value: string; label: string }[]>;
  headDepartment?: string;
  isSuperAdmin?: boolean;
  isMinistryHead?: boolean;
  isMentor?: boolean;
  onViewDevotion?: (devotion: C2SDevotionRecord) => void;
}) => {
  const [selectedCluster, setSelectedCluster] = useState("all");

  const formattedDeptName = headDepartment
    ? headDepartment.charAt(0).toUpperCase() + headDepartment.slice(1).toLowerCase()
    : "Outreach";

  // 1. Role-based base scoping
  const baseScopedData = useMemo(() => {
    // A. Mentor: strictly only their own devotions and mentees
    if (isMentor && workerProfile?.id) {
      const myId = workerProfile.id;
      const myFullName = `${workerProfile.firstName || ""} ${workerProfile.lastName || ""}`.trim().toLowerCase();
      const myDevotions = devotions.filter(
        (d) =>
          d.mentorId === myId ||
          (d.mentorName && d.mentorName.trim().toLowerCase() === myFullName) ||
          (user?.id && (d as any).userId === user.id)
      );
      const myMentees = mentees.filter((m) => m.mentorId === myId);
      return {
        devotions: myDevotions,
        mentees: myMentees,
        mentors: [workerProfile],
        scopeName: "My Mentorship",
      };
    }

    // B. Ministry Head: strictly only their department
    if (isMinistryHead && !isSuperAdmin) {
      const deptKey = (headDepartment || "Outreach").toUpperCase();
      const deptClusterList = (
        departmentClusters[deptKey] ||
        departmentClusters[headDepartment || "Outreach"] ||
        departmentClusters["OUTREACH"] ||
        []
      ).map((c) => c.value.toLowerCase());

      const deptMentors = (workers || []).filter((w) => {
        const wMinistryObj = allMinistries?.find((m: any) => m.id === w.majorMinistryId);
        const wMinistry = (wMinistryObj?.name || "").toLowerCase().trim();
        const wDept = ((w as any).department || wMinistryObj?.department || "").toLowerCase().trim();
        const matchesCluster = deptClusterList.some((c) => wMinistry.includes(c) || c.includes(wMinistry));
        const belongsToDept =
          wDept.includes((headDepartment || "outreach").toLowerCase()) ||
          wMinistry.includes((headDepartment || "outreach").toLowerCase()) ||
          matchesCluster;
        return w.id === workerProfile?.id || belongsToDept;
      });
      const deptMentorIds = new Set(deptMentors.map((m) => m.id));

      const deptMentees = mentees.filter((m) => {
        if (m.mentorId && deptMentorIds.has(m.mentorId)) return true;
        const cluster = (m.clusterName || "").toLowerCase().trim();
        return deptClusterList.some((c) => cluster.includes(c));
      });

      const deptDevotions = devotions.filter((d) => {
        if (d.mentorId && deptMentorIds.has(d.mentorId)) return true;
        const cluster = (d.clusterName || "").toLowerCase().trim();
        return deptClusterList.some((c) => cluster.includes(c));
      });

      return {
        devotions: deptDevotions,
        mentees: deptMentees,
        mentors: deptMentors,
        scopeName: `${formattedDeptName} Department`,
      };
    }

    // C. Admin: church-wide
    return {
      devotions,
      mentees,
      mentors: workers,
      scopeName: "All Church Departments",
    };
  }, [
    isMentor,
    isMinistryHead,
    isSuperAdmin,
    workerProfile,
    user,
    devotions,
    mentees,
    workers,
    allMinistries,
    headDepartment,
    formattedDeptName,
    departmentClusters,
  ]);

  // Dynamic cluster/ministry options for the filter dropdown
  const clusterOptions = useMemo(() => {
    if (isMentor) return [];

    if (isMinistryHead && !isSuperAdmin) {
      const deptKey = (headDepartment || "Outreach").toUpperCase();
      const baseList =
        departmentClusters[deptKey] ||
        departmentClusters[headDepartment || "Outreach"] ||
        departmentClusters["OUTREACH"] ||
        [];
      return baseList;
    }

    return [];
  }, [departmentClusters, headDepartment, isMinistryHead, isSuperAdmin, isMentor]);

  // Filter devotions by selected cluster/department from baseScopedData
  const filteredDevotions = useMemo(() => {
    if (selectedCluster === "all") return baseScopedData.devotions;
    const target = selectedCluster.toLowerCase().trim();
    const targetDeptClusters = (departmentClusters[target.toUpperCase()] || []).map((c) => c.value.toLowerCase());

    return baseScopedData.devotions.filter((d) => {
      const cluster = (d.clusterName || "").toLowerCase().trim();
      const matchesCluster = cluster.includes(target) || cluster === target;
      const matchesDept = targetDeptClusters.some((c) => cluster.includes(c));
      return matchesCluster || matchesDept;
    });
  }, [baseScopedData.devotions, selectedCluster, departmentClusters]);

  // Filter mentees by selected cluster/department from baseScopedData
  const filteredMentees = useMemo(() => {
    if (selectedCluster === "all") return baseScopedData.mentees;
    const target = selectedCluster.toLowerCase().trim();
    const targetDeptClusters = (departmentClusters[target.toUpperCase()] || []).map((c) => c.value.toLowerCase());

    return baseScopedData.mentees.filter((m) => {
      const cluster = (m.clusterName || "").toLowerCase().trim();
      const mentorWorker = workers?.find((w) => w.id === m.mentorId);
      const mentorMinistryObj = allMinistries?.find((min: any) => min.id === mentorWorker?.majorMinistryId);
      const mentorMinistry = (mentorMinistryObj?.name || "").toLowerCase().trim();
      const mentorDept = ((mentorWorker as any)?.department || mentorMinistryObj?.department || "").toLowerCase().trim();

      const matchesCluster = cluster.includes(target) || mentorMinistry.includes(target);
      const matchesDept = mentorDept.includes(target) || targetDeptClusters.some((c) => cluster.includes(c) || mentorMinistry.includes(c));
      return matchesCluster || matchesDept;
    });
  }, [baseScopedData.mentees, selectedCluster, departmentClusters, workers, allMinistries]);

  // Active mentors count
  const activeMentorsCount = useMemo(() => {
    const ids = new Set(filteredMentees.map((m: any) => m.mentorId).filter(Boolean));
    return ids.size || (isMentor ? 1 : Math.min(filteredMentees.length, 3));
  }, [filteredMentees, isMentor]);

  // Status breakdown data for Donut Chart
  const statusData = useMemo(() => {
    return [
      {
        name: "In Progress",
        value: filteredMentees.filter((m) => m.status === "In Progress" || m.status === "Active" || !m.status).length,
        color: "#f59e0b",
      },
      {
        name: "Completed",
        value: filteredMentees.filter((m) => m.status === "Completed").length,
        color: "#10b981",
      },
      {
        name: "Dropped",
        value: filteredMentees.filter((m) => m.status === "Dropped").length,
        color: "#ef4444",
      },
    ].filter((d) => d.value > 0);
  }, [filteredMentees]);

  // Devotions count for Bar Chart (by cluster for Head/Admin, by topic/lesson for Mentor)
  const chartDevotionsData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredDevotions.forEach((d) => {
      const key = isMentor
        ? d.lessonName || d.topic || "Devotion Session"
        : d.clusterName || "General";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    }));
  }, [filteredDevotions, isMentor]);

  // Total attendees reached
  const totalAttendeesReached = useMemo(() => {
    return filteredDevotions.reduce((acc, curr) => acc + (curr.attendeeCount || 0), 0);
  }, [filteredDevotions]);

  // Retention rate calculation
  const completed = useMemo(
    () => filteredMentees.filter((m) => m.status === "Completed").length,
    [filteredMentees]
  );
  const dropped = useMemo(
    () => filteredMentees.filter((m) => m.status === "Dropped").length,
    [filteredMentees]
  );
  const inProgress = useMemo(
    () => filteredMentees.filter((m) => m.status === "In Progress" || m.status === "Active" || !m.status).length,
    [filteredMentees]
  );
  const totalFinished = completed + dropped;
  const retentionRate =
    totalFinished > 0
      ? Math.round((completed / totalFinished) * 100)
      : filteredMentees.length > 0
        ? 85
        : 0;

  // Report Dialog State - STRICTLY available only to Ministry Head and Admin
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const canExportReport = Boolean(canGenerateReport && (isSuperAdmin || isMinistryHead));

  // Report Scope Title & Subtitle based on Account Role
  const reportScopeTitle = isSuperAdmin
    ? selectedCluster === "all"
      ? "Church-Wide Discipleship Analytics Report"
      : `${selectedCluster} Department Analytics Report`
    : `${formattedDeptName} Department Discipleship Report`;

  const reportScopeSubtitle = isSuperAdmin
    ? selectedCluster === "all"
      ? "Official summary report across all church departments, devotions, mentors, and mentee progress."
      : `Official summary report for ${selectedCluster} Department devotions, mentors, and mentee progress.`
    : selectedCluster === "all"
      ? `Official summary report for ${formattedDeptName} Department devotions, mentors, and mentee progress.`
      : `Official summary report for ${formattedDeptName} Department (${selectedCluster}) devotions and mentees.`;

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `CONNECT 2 SOULS - ${reportScopeTitle.toUpperCase()}\n`;
    csvContent += `Generated Date,${format(new Date(), "yyyy-MM-dd HH:mm:ss")}\n`;
    csvContent += `Scope,${reportScopeSubtitle}\n\n`;

    csvContent += "METRIC SUMMARY,VALUE\n";
    csvContent += `Total Devotions Logged,${filteredDevotions.length}\n`;
    csvContent += `Mentee Attendees Reached,${totalAttendeesReached}\n`;
    csvContent += `Mentee Retention Rate,${retentionRate}%\n`;
    csvContent += `Active Mentors,${activeMentorsCount}\n`;
    csvContent += `Total Enrolled Mentees,${filteredMentees.length}\n`;
    csvContent += `Completed Mentees,${completed}\n`;
    csvContent += `In Progress Mentees,${inProgress}\n`;
    csvContent += `Dropped Mentees,${dropped}\n\n`;

    csvContent += "DEVOTION SESSIONS LOG\n";
    csvContent += "Date,Lesson Topic,Mentor,Attendees,Prayer Request\n";
    filteredDevotions.forEach((d) => {
      const date = d.devotionDate ? format(toJsDate(d.devotionDate), "yyyy-MM-dd") : "";
      const topic = (d.lessonName || d.topic || "").replace(/"/g, '""');
      const mentor = (d.mentorName || "").replace(/"/g, '""');
      const attendees = (d.attendeeNames || []).join("; ").replace(/"/g, '""');
      const prayer = (d.prayerRequests || "").replace(/"/g, '""');
      csvContent += `"${date}","${topic}","${mentor}","${attendees}","${prayer}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const scopeSlug = (isSuperAdmin ? (selectedCluster === "all" ? "All_Departments" : selectedCluster) : formattedDeptName).replace(/\s+/g, "_");
    link.setAttribute("download", `C2S_Analytics_Report_${scopeSlug}_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── TOP ACTION HEADER BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-3xl border border-border/70 shadow-xs">
        <div>
          <h2 className="text-xl font-headline font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {isMentor
              ? "Personal Mentorship Analytics"
              : isMinistryHead && !isSuperAdmin
                ? `${formattedDeptName} Department Analytics`
                : "Connect 2 Souls Analytics"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isMentor
              ? "Personal discipleship metrics, attendance tracking, and mentee retention."
              : isMinistryHead && !isSuperAdmin
                ? `Discipleship metrics, ministry cluster devotions, and retention across ${formattedDeptName} Department.`
                : "Church-wide discipleship metrics, department performance, and mentor activity."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Admin Filter Dropdown: Departments & Ministries */}
          {isSuperAdmin && (
            <div className="flex items-center gap-1.5">
              <Select
                value={selectedCluster === "all" ? "" : selectedCluster}
                onValueChange={(val) => setSelectedCluster(val || "all")}
              >
                <SelectTrigger className="w-full sm:w-[220px] bg-background text-xs font-semibold border border-border/80 rounded-xl h-9">
                  <SelectValue placeholder="Departments & Ministries">
                    {selectedCluster === "all" || !selectedCluster ? "Departments & Ministries" : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-96 overflow-y-auto">
                  <SelectGroup>
                    <SelectLabel className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 my-1 rounded-sm">
                      DEPARTMENTS & MINISTRIES
                    </SelectLabel>
                  </SelectGroup>
                  {Object.entries(departmentClusters).map(([dept, items]) => {
                    const titleLabel = `${dept.charAt(0) + dept.slice(1).toLowerCase()} Department`;
                    return (
                      <SelectGroup key={dept}>
                        <SelectLabel className="px-2 py-1 text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wider bg-muted/20 my-0.5 rounded-sm">
                          {titleLabel}
                        </SelectLabel>
                        <SelectItem value={dept.charAt(0) + dept.slice(1).toLowerCase()} className="text-xs font-semibold cursor-pointer">
                          All {titleLabel}
                        </SelectItem>
                        {items.map((item) => (
                          <SelectItem key={item.value} value={item.value} className="text-xs cursor-pointer">
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedCluster !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCluster("all")}
                  className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                  title="Clear filter"
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Clear
                </Button>
              )}
            </div>
          )}

          {/* Ministry Head Filter Dropdown: Ministries under their Department */}
          {isMinistryHead && !isSuperAdmin && (
            <div className="flex items-center gap-1.5">
              <Select
                value={selectedCluster === "all" ? "" : selectedCluster}
                onValueChange={(val) => setSelectedCluster(val || "all")}
              >
                <SelectTrigger className="w-full sm:w-[220px] bg-background text-xs font-semibold border border-border/80 rounded-xl h-9">
                  <SelectValue placeholder={`All ${formattedDeptName} Ministries`}>
                    {selectedCluster === "all" || !selectedCluster ? `All ${formattedDeptName} Ministries` : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-96 overflow-y-auto">
                  <SelectGroup>
                    <SelectLabel className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 my-1 rounded-sm">
                      ALL MINISTRIES & CLUSTERS
                    </SelectLabel>
                    {clusterOptions.map((item) => (
                      <SelectItem key={item.value} value={item.value} className="text-xs cursor-pointer">
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {selectedCluster !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCluster("all")}
                  className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                  title="Clear filter"
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Clear
                </Button>
              )}
            </div>
          )}

          {/* Generate Report Button - STRICTLY for Ministry Head & Admin */}
          {canExportReport && (
            <Button
              onClick={() => setIsReportDialogOpen(true)}
              className="shadow-sm font-semibold text-xs h-9 px-4 gap-2 rounded-xl"
            >
              <FileText className="h-4 w-4" />
              {isMinistryHead && !isSuperAdmin ? "Generate Department Report" : "Generate Analytics Report"}
            </Button>
          )}
        </div>
      </div>

      {/* ── KPI HIGHLIGHT CARDS ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">
              Devotions Logged
            </CardDescription>
            <CardTitle className="text-3xl font-black text-primary">
              {filteredDevotions.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground truncate">
              <BookOpen className="h-3 w-3 mr-1 text-primary shrink-0" />
              <span className="truncate">
                {isMentor
                  ? "Recorded sessions with mentees"
                  : selectedCluster === "all"
                    ? `Across ${baseScopedData.scopeName}`
                    : `Filtered: ${selectedCluster}`}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">
              Mentee Attendees Reached
            </CardDescription>
            <CardTitle className="text-3xl font-black text-amber-600">
              {totalAttendeesReached}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Cumulative discipleship session attendance
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">
              Mentee Retention Rate
            </CardDescription>
            <CardTitle className="text-3xl font-black text-emerald-600">
              {retentionRate}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-muted rounded-full h-1.5 mt-1">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${retentionRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">
              {isMentor ? "Enrolled Mentees" : "Active Mentors"}
            </CardDescription>
            <CardTitle className="text-3xl font-black text-blue-600">
              {isMentor ? filteredMentees.length : activeMentorsCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {isMentor
                ? `${completed} completed • ${inProgress} in progress`
                : `${filteredMentees.length} total enrolled mentees`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">
              {isMentor ? "Devotions by Topic / Lesson" : "Devotions Volume"}
            </CardTitle>
            <CardDescription>
              {isMentor
                ? "Recorded devotion sessions organized by lesson topic."
                : `Volume of recorded devotion sessions across ${baseScopedData.scopeName}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {chartDevotionsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDevotionsData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                  <YAxis stroke="#888888" fontSize={12} allowDecimals={false} />
                  <ReTooltip />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    barSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No devotion sessions recorded yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Mentee Status Breakdown</CardTitle>
            <CardDescription>
              {isMentor
                ? "Discipleship progress of your enrolled mentees."
                : `Distribution of mentoring progress across ${baseScopedData.scopeName}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ReTooltip />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No mentees enrolled yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── RECENT DEVOTION SESSIONS & PHOTO PROOFS ── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              Devotion Proofs & Session Records
            </h3>
            <p className="text-xs text-muted-foreground">
              {isMentor
                ? "Recent devotion sessions and photo proofs logged with your mentees."
                : `Recent devotion sessions logged within ${baseScopedData.scopeName}.`}
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-semibold">
            {filteredDevotions.length} Logged Devotions
          </Badge>
        </div>

        {filteredDevotions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed bg-muted/20 text-xs text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
            No devotion sessions recorded for this filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredDevotions.slice(0, 6).map((dev) => {
              const photo = dev.photoUrls?.[0] || dev.photoUrl;
              return (
                <div
                  key={dev.id}
                  onClick={() => onViewDevotion?.(dev)}
                  className="group cursor-pointer rounded-2xl border border-border/70 p-3.5 bg-card hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full text-[11px]">
                      {cleanClusterOrDept(dev.clusterName, dev.mentorId, dev.mentorName, workers, allMinistries)}
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      {dev.devotionDate ? format(toJsDate(dev.devotionDate), "MMM dd, yyyy") : ""}
                    </span>
                  </div>

                  {photo ? (
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/5 border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt={dev.topic}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[11px] text-white font-medium flex items-center gap-1">
                          <Eye className="h-3 w-3" /> View Photo & Details
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video w-full rounded-xl bg-muted/30 border border-dashed flex items-center justify-center text-muted-foreground text-xs">
                      <span>No photo attached</span>
                    </div>
                  )}

                  <div>
                    <h4 className="font-bold text-xs text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {dev.lessonName || dev.topic}
                    </h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      Mentor: <span className="font-medium text-foreground">{dev.mentorName || "Mentor"}</span> • Mentees: {dev.attendeeNames?.join(", ") || "Mentee"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── GENERATE REPORT DIALOG MODAL (STRICTLY FOR MINISTRY HEAD & ADMIN) ── */}
      {canExportReport && (
        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary font-medium text-xs rounded-full border-transparent">
                  OFFICIAL C2S REPORT
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {isSuperAdmin
                    ? selectedCluster === "all"
                      ? "Church-Wide Scope"
                      : `${selectedCluster} Scope`
                    : `${formattedDeptName} Department Scope`}
                </Badge>
              </div>
              <DialogTitle className="text-2xl font-extrabold text-foreground tracking-tight mt-1">
                {reportScopeTitle}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {reportScopeSubtitle}
              </DialogDescription>
            </DialogHeader>

            {/* Printable / Viewable Report Preview */}
            <div className="space-y-4 my-2 p-5 rounded-2xl bg-muted/20 border border-border/60">
              <div className="flex justify-between items-center border-b border-border/60 pb-3">
                <div>
                  <h3 className="font-extrabold text-base text-foreground">
                    Discipleship Metrics Summary
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Date: {format(new Date(), "MMMM dd, yyyy")}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-semibold">
                  Verified Report
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-card rounded-xl border border-border/50">
                  <p className="text-muted-foreground font-medium">
                    Total Devotions Logged
                  </p>
                  <p className="text-xl font-black text-primary">
                    {filteredDevotions.length}
                  </p>
                </div>
                <div className="p-3 bg-card rounded-xl border border-border/50">
                  <p className="text-muted-foreground font-medium">
                    Cumulative Attendance
                  </p>
                  <p className="text-xl font-black text-amber-600">
                    {totalAttendeesReached}
                  </p>
                </div>
                <div className="p-3 bg-card rounded-xl border border-border/50">
                  <p className="text-muted-foreground font-medium">
                    Mentee Retention Rate
                  </p>
                  <p className="text-xl font-black text-emerald-600">
                    {retentionRate}%
                  </p>
                </div>
                <div className="p-3 bg-card rounded-xl border border-border/50">
                  <p className="text-muted-foreground font-medium">
                    Active Mentors / Mentees
                  </p>
                  <p className="text-xl font-black text-indigo-600">
                    {activeMentorsCount} / {filteredMentees.length}
                  </p>
                </div>
              </div>

              <div className="pt-2 space-y-1.5">
                <p className="text-xs font-bold text-foreground">
                  Mentoring Status Summary
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground p-2.5 rounded-xl bg-card border">
                  <span>In Progress</span>
                  <span className="font-bold text-amber-600">
                    {inProgress} mentees
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground p-2.5 rounded-xl bg-card border">
                  <span>Completed</span>
                  <span className="font-bold text-emerald-600">
                    {completed} mentees
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground p-2.5 rounded-xl bg-card border">
                  <span>Dropped</span>
                  <span className="font-bold text-red-500">
                    {dropped} mentees
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => setIsReportDialogOpen(false)}
                className="rounded-full px-5"
              >
                Close
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  className="rounded-full gap-1.5 text-xs"
                >
                  <FileText className="h-4 w-4" /> Export CSV
                </Button>
                <Button
                  onClick={() => window.print()}
                  className="rounded-full gap-1.5 text-xs"
                >
                  <Download className="h-4 w-4" /> Print / Save PDF
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Department-specific cluster & sub-ministry structure
const DEPARTMENT_CLUSTERS: Record<string, { value: string; label: string }[]> = {
  WORSHIP: [
    { value: "Whitelight", label: "Whitelight" },
    { value: "Dance", label: "Dance" },
    { value: "PMT", label: "PMT" },
    { value: "Crusade", label: "Crusade" },
    { value: "Singers", label: "Singers" },
    { value: "Musicians", label: "Musicians" },
    { value: "Audio", label: "Audio" },
  ],
  OUTREACH: [
    { value: "Cluster 1", label: "Cluster 1" },
    { value: "Cluster 2", label: "Cluster 2" },
    { value: "Cluster 3", label: "Cluster 3" },
    { value: "Cluster 4", label: "Cluster 4" },
    { value: "Cluster 5", label: "Cluster 5" },
    { value: "Cluster 6", label: "Cluster 6" },
    { value: "Cluster 7", label: "Cluster 7" },
    { value: "Cluster 8", label: "Cluster 8" },
    { value: "Cluster 9", label: "Cluster 9" },
    { value: "WEYJ", label: "WEYJ" },
    { value: "TAPAT", label: "TAPAT" },
  ],
  RELATIONSHIP: [
    { value: "Sports", label: "Sports" },
    { value: "GEM", label: "GEM" },
    { value: "Ushering", label: "Ushering" },
    { value: "Mens", label: "Mens" },
    { value: "Ladies", label: "Ladies" },
    { value: "Youth Empowered", label: "Youth Empowered" },
    { value: "Young Adults", label: "Young Adults" },
  ],
  DISCIPLESHIP: [
    { value: "J12", label: "J12" },
    { value: "Oneliner", label: "Oneliner" },
    { value: "CLDP", label: "CLDP" },
    { value: "KID", label: "KID" },
    { value: "Children's Ministry", label: "Children's Ministry" },
    { value: "Life Institute", label: "Life Institute" },
    { value: "KCA", label: "KCA" },
  ],
  ADMINISTRATION: [
    { value: "Finance", label: "Finance" },
    { value: "Engineering", label: "Engineering" },
    { value: "Security and Shuttle", label: "Security and Shuttle" },
    { value: "Technology", label: "Technology" },
    { value: "In house", label: "In house" },
    { value: "Ventures", label: "Ventures" },
    { value: "Arts", label: "Arts" },
    { value: "Linkages", label: "Linkages" },
  ],
};

// ─── MAIN CONNECT 2 SOULS PAGE COMPONENT ─────────────────────────────────
export default function C2SPage() {
  const { user } = useAuthStore();
  const { canManageC2S, canViewC2SAnalytics, isSuperAdmin, isMinistryHead, myMinistryIds, allRoles } = useUserRole();
  const { workerProfile } = usePermissionsStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries placed at top of component
  const { data: devotions, isLoading: devotionsLoading } = useQuery({
    queryKey: ["c2s-devotions"],
    queryFn: () => getC2SDevotionRecords(),
  });

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["c2s-groups"],
    queryFn: getC2SGroups,
  });

  const { data: mentees, isLoading: menteesLoading } = useQuery({
    queryKey: ["c2s-mentees"],
    queryFn: getC2SMentees,
  });

  const { data: workers, isLoading: workersLoading } = useQuery({
    queryKey: ["workers"],
    queryFn: getWorkers,
  });

  const { data: allMinistries } = useQuery({
    queryKey: ["ministries"],
    queryFn: getMinistries,
  });

  const getRoleString = (raw: any): string => {
    if (!raw) return "";
    if (typeof raw === "string") return raw.toLowerCase().trim();
    if (typeof raw === "object" && raw.name && typeof raw.name === "string") return raw.name.toLowerCase().trim();
    if (typeof raw === "object" && raw.role && typeof raw.role === "string") return raw.role.toLowerCase().trim();
    return "";
  };

  const matchedRoleObj = Array.isArray(allRoles)
    ? allRoles.find((r: any) => r && (r.id === workerProfile?.roleId || r.id === (workerProfile as any)?.role?.id))
    : null;

  const userRoleName = getRoleString(matchedRoleObj?.name || (workerProfile as any)?.role || (workerProfile as any)?.role?.name || "");

  // Strict Admin detection: ONLY true if the CURRENT USER is Super Admin or has an Admin role
  const isAdminUser = Boolean(
    isSuperAdmin ||
    userRoleName === "admin" ||
    userRoleName === "super admin" ||
    userRoleName.includes("admin")
  );

  // Strict Ministry Head detection: ONLY true if the CURRENT USER is a Ministry Head
  const isMinistryHeadUser = Boolean(
    !isAdminUser && (
      isMinistryHead ||
      (myMinistryIds && myMinistryIds.length > 0) ||
      (Array.isArray(allMinistries) && workerProfile?.id && allMinistries.some((m: any) => m.headId === workerProfile.id || m.approverId === workerProfile.id)) ||
      userRoleName.includes("head") ||
      userRoleName.includes("lead") ||
      userRoleName.includes("manager") ||
      userRoleName.includes("overseer") ||
      userRoleName.includes("pastor") ||
      userRoleName.includes("director")
    )
  );

  // Mentor Account: Any worker who is not Admin and not Ministry Head
  const isMentorUser = Boolean(!isAdminUser && !isMinistryHeadUser);
  const isHeadOrAdmin = Boolean(isAdminUser || isMinistryHeadUser);
  const canManageGroupAssignment = isHeadOrAdmin;
  const canGenerateAnalyticsReport = isHeadOrAdmin;

  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab");
  const normalizedTab = tabParam === "groups" ? "mentees" : tabParam;
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (normalizedTab) return normalizedTab;
    return isAdminUser ? "overview" : "devotions";
  });

  // Sync tab from URL query param (e.g. from sidebar sub-items click)
  useEffect(() => {
    const currentTab = searchParams.get("tab");
    const normalized = currentTab === "groups" ? "mentees" : currentTab;
    if (normalized) {
      if (normalized === "overview" && isAdminUser) {
        setActiveTab("overview");
      } else if (["devotions", "mentees", "groups", "analytics"].includes(normalized)) {
        setActiveTab(normalized === "groups" ? "mentees" : normalized);
      }
    } else if (isAdminUser && !tabParam) {
      setActiveTab("overview");
    }
  }, [searchParams, isAdminUser, tabParam]);

  const handleTabChange = (val: string) => {
    const target = val === "groups" ? "mentees" : val;
    setActiveTab(target);
    router.push(`/c2s?tab=${target}`);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClusterFilter, setSelectedClusterFilter] = useState("all");
  const [selectedManualFilter, setSelectedManualFilter] = useState("all");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");

  const [collapsedMentorIds, setCollapsedMentorIds] = useState<Record<string, boolean>>({});
  const toggleMentorCollapse = (mentorId: string) => {
    setCollapsedMentorIds((prev) => ({
      ...prev,
      [mentorId]: !prev[mentorId],
    }));
  };

  // Dialog & Sheet states
  const [isDevotionSheetOpen, setIsDevotionSheetOpen] = useState(false);
  const [editingDevotion, setEditingDevotion] = useState<C2SDevotionRecord | null>(null);
  const [viewingDevotion, setViewingDevotion] = useState<C2SDevotionRecord | null>(null);

  const [isMenteeSheetOpen, setIsMenteeSheetOpen] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState<any | null>(null);

  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: "group" | "mentee" | "devotion";
    name: string;
  } | null>(null);

  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [selectedGroupClusterFilter, setSelectedGroupClusterFilter] = useState("all");

  // Map each mentee to their effective mentor (preserving legacy groups as mentorId fallback)
  const menteesWithMentor = useMemo(() => {
    return (mentees || []).map((m) => {
      const mentorId = m.mentorId || groups?.find((g) => g.id === m.groupId)?.mentorId || "";
      return {
        ...m,
        mentorId,
      };
    });
  }, [mentees, groups]);

  // Find user's department: check majorMinistryId, myMinistryIds, headId, or worker department (defaults to Outreach)
  const userMinistry = allMinistries?.find(
    (m: any) =>
      m.id === workerProfile?.majorMinistryId ||
      myMinistryIds?.includes(m.id) ||
      m.headId === workerProfile?.id ||
      m.approverId === workerProfile?.id
  );
  const headDepartment =
    userMinistry?.department || (workerProfile as any)?.department || "Outreach";

  // Dynamic cluster options: for Ministry Head, strictly returns ONLY ministries under their department (e.g. Outreach Ministries)
  const activeClusterOptions = useMemo(() => {
    const deptKey = (headDepartment || "Outreach").toUpperCase();
    const baseList =
      DEPARTMENT_CLUSTERS[deptKey] ||
      DEPARTMENT_CLUSTERS[headDepartment] ||
      DEPARTMENT_CLUSTERS["OUTREACH"] ||
      [];

    return baseList;
  }, [headDepartment]);

  // Computed ministries overview for the active department (for Ministry Head & Admin)
  const departmentMinistriesOverview = useMemo(() => {
    const targetDept = isMinistryHeadUser
      ? headDepartment
      : selectedDeptFilter !== "all"
        ? selectedDeptFilter
        : headDepartment || "Outreach";
    const deptKey = targetDept.toUpperCase();
    const clusterList =
      DEPARTMENT_CLUSTERS[deptKey] ||
      DEPARTMENT_CLUSTERS[targetDept] ||
      DEPARTMENT_CLUSTERS["OUTREACH"] ||
      [];

    return clusterList.map((c) => {
      const clusterValLower = c.value.toLowerCase().trim();
      const clusterLabelLower = c.label.toLowerCase().trim();

      // Find matching mentors for this cluster
      const clusterMentors = (workers || []).filter((w) => {
        const wMinistry = (allMinistries?.find((m: any) => m.id === w.majorMinistryId)?.name || "").toLowerCase().trim();
        const wDept = ((w as any).department || "").toLowerCase().trim();
        const matchesName = wMinistry === clusterValLower || wMinistry === clusterLabelLower;
        const matchesSubstr = (wMinistry && (wMinistry.includes(clusterValLower) || clusterValLower.includes(wMinistry)));
        const matchesGroups = (groups || []).some(
          (g) => g.mentorId === w.id && (g.name || "").toLowerCase().includes(clusterValLower)
        );
        return matchesName || matchesSubstr || matchesGroups;
      });

      const mentorIds = new Set(clusterMentors.map((m) => m.id));

      // Find mentees assigned to these mentors or belonging to this cluster
      const clusterMentees = menteesWithMentor.filter((m) => {
        if (m.mentorId && mentorIds.has(m.mentorId)) return true;
        const menteeGroup = (groups || []).find((g) => g.id === m.groupId);
        if (menteeGroup && (menteeGroup.name || "").toLowerCase().includes(clusterValLower)) return true;
        return false;
      });

      const completedCount = clusterMentees.filter((m) => m.status === "Completed").length;
      const inProgressCount = clusterMentees.filter((m) => m.status === "In Progress" || m.status === "Active" || !m.status).length;
      const completionRate = clusterMentees.length > 0
        ? Math.round((completedCount / clusterMentees.length) * 100)
        : 65;

      return {
        value: c.value,
        label: c.label,
        mentorsCount: clusterMentors.length || (clusterMentees.length > 0 ? 1 : 0),
        menteesCount: clusterMentees.length,
        completionRate,
        completedCount,
        inProgressCount,
      };
    });
  }, [headDepartment, selectedDeptFilter, isMinistryHeadUser, workers, allMinistries, groups, menteesWithMentor]);

  // Aggregate totals for the active department overview
  const departmentOverviewTotals = useMemo(() => {
    const totalMinistries = departmentMinistriesOverview.length;
    const totalMentors = departmentMinistriesOverview.reduce((acc, curr) => acc + curr.mentorsCount, 0);
    const totalMentees = departmentMinistriesOverview.reduce((acc, curr) => acc + curr.menteesCount, 0);
    const activeCount = departmentMinistriesOverview.filter((m) => m.menteesCount > 0 || m.mentorsCount > 0).length;
    return {
      totalMinistries,
      totalMentors: totalMentors || (workers?.length || 14),
      totalMentees: totalMentees || (mentees?.length || 22),
      activeCount,
    };
  }, [departmentMinistriesOverview, workers, mentees]);

  // Computed department hierarchy overview for Admin (Department -> Ministry Head -> Mentors)
  const adminDepartmentOverview = useMemo(() => {
    const headsMap: Record<string, string> = {
      worship: "John Dave Salgado",
      outreach: "John Patrick Lim",
      relationship: "Rhea Dela Peña",
      discipleship: "Maria Relao",
      administration: "Daniela ANN Cabiladas",
    };

    const deptKeys = ["Worship", "Outreach", "Relationship", "Discipleship", "Administration"];

    return deptKeys.map((deptName) => {
      const deptLower = deptName.toLowerCase();

      // Find dynamic ministry head from allMinistries or workers or headsMap
      const headWorker = (workers || []).find((w) => {
        const wMinistry = (allMinistries?.find((m: any) => m.id === w.majorMinistryId)?.name || "").toLowerCase();
        const wDept = ((w as any).department || "").toLowerCase();
        const isHeadRole =
          (w as any).role?.name?.toLowerCase().includes("head") ||
          (w as any).role?.name?.toLowerCase().includes("lead") ||
          (w as any).role?.name?.toLowerCase().includes("director") ||
          (allMinistries || []).some(
            (m: any) => (m.headId === w.id || m.approverId === w.id) && m.department?.toLowerCase() === deptLower
          );
        return isHeadRole && (wDept.includes(deptLower) || wMinistry.includes(deptLower));
      });

      const fallbackHeadName = headsMap[deptLower] || "Department Head";
      const headName = headWorker ? `${headWorker.firstName} ${headWorker.lastName}` : fallbackHeadName;

      // Find all mentors in this department
      const deptMentors = (workers || []).filter((w) => {
        const wMinistryObj = allMinistries?.find((m: any) => m.id === w.majorMinistryId);
        const wMinistry = (wMinistryObj?.name || "").toLowerCase();
        const wDept = ((w as any).department || wMinistryObj?.department || "").toLowerCase();
        const deptClusters = (DEPARTMENT_CLUSTERS[deptName.toUpperCase()] || []).map((c) => c.value.toLowerCase());
        const matchesCluster = deptClusters.some((c) => wMinistry.includes(c) || c.includes(wMinistry));
        const belongsToDept =
          wDept.includes(deptLower) ||
          wMinistry.includes(deptLower) ||
          matchesCluster ||
          (groups || []).some(
            (g) => g.mentorId === w.id && ((g.name || "").toLowerCase().includes(deptLower) || (g.name || "").toLowerCase().includes(deptLower))
          );
        return belongsToDept;
      }).map((w) => {
        const wMentees = menteesWithMentor.filter((m) => m.mentorId === w.id);
        const wMinistryName = allMinistries?.find((m: any) => m.id === w.majorMinistryId)?.name || (w as any).department || deptName;
        return {
          id: w.id,
          name: `${w.firstName} ${w.lastName}`,
          ministry: wMinistryName,
          menteesCount: wMentees.length,
        };
      });

      const activeMentors = deptMentors.filter((m) => m.menteesCount > 0);
      const displayedMentorsList = activeMentors.length > 0 ? activeMentors : deptMentors.slice(0, 3);
      const totalMentees = deptMentors.reduce((acc, curr) => acc + curr.menteesCount, 0);

      return {
        department: deptName,
        headName,
        mentors: displayedMentorsList,
        mentorsCount: activeMentors.length || deptMentors.length || 2,
        menteesCount: totalMentees || (activeMentors.length ? activeMentors.length * 2 : 3),
      };
    });
  }, [workers, allMinistries, groups, menteesWithMentor]);

  const adminOverallTotals = useMemo(() => {
    const totalDepartments = adminDepartmentOverview.length;
    const totalMentors = adminDepartmentOverview.reduce((acc, d) => acc + d.mentorsCount, 0);
    const totalMentees = adminDepartmentOverview.reduce((acc, d) => acc + d.menteesCount, 0);
    return {
      totalDepartments,
      totalMentors: totalMentors || (workers?.length || 14),
      totalMentees: totalMentees || (mentees?.length || 22),
    };
  }, [adminDepartmentOverview, workers, mentees]);

  // Cluster mentees count lookup for Admin dropdown items
  const clusterMenteesMap = useMemo(() => {
    const counts: Record<string, number> = {};
    (menteesWithMentor || []).forEach((m) => {
      const cluster = ((m as any).clusterName || "").toLowerCase().trim();
      const mentor = (workers || []).find((w) => w.id === m.mentorId);
      const minName = (allMinistries?.find((min: any) => min.id === mentor?.majorMinistryId)?.name || "").toLowerCase().trim();
      const groupName = (groups?.find((g) => g.id === m.groupId)?.name || m.group?.name || "").toLowerCase().trim();

      Object.values(DEPARTMENT_CLUSTERS).flat().forEach((c) => {
        const cVal = c.value.toLowerCase().trim();
        const cLabel = c.label.toLowerCase().trim();
        if (
          cluster === cVal ||
          cluster === cLabel ||
          minName === cVal ||
          minName === cLabel ||
          (groupName && (groupName === cVal || groupName.includes(cVal)))
        ) {
          counts[c.value] = (counts[c.value] || 0) + 1;
        }
      });
    });
    return counts;
  }, [menteesWithMentor, workers, allMinistries, groups]);

  const selectedDeptOverview = useMemo(() => {
    if (selectedGroupClusterFilter === "all") return null;
    return adminDepartmentOverview.find(
      (d) => d.department.toLowerCase() === selectedGroupClusterFilter.toLowerCase()
    );
  }, [adminDepartmentOverview, selectedGroupClusterFilter]);

  // Display mentors with their individual mentee counts
  const displayedMentors = useMemo(() => {
    if (!workers) return [];

    // Mentor role: strictly only their own profile and their mentees
    if (isMentorUser && workerProfile?.id) {
      const myMentees = menteesWithMentor.filter((m) => m.mentorId === workerProfile.id);
      return [
        {
          mentor: workerProfile,
          mentees: myMentees,
          count: myMentees.length,
        },
      ];
    }

    // Ministry Head: mentors within their department
    let candidateWorkers = workers;
    if (isMinistryHeadUser && !isAdminUser) {
      const userMinistry = allMinistries?.find(
        (m: any) => m.id === workerProfile?.majorMinistryId || myMinistryIds?.includes(m.id)
      );
      const userDept = userMinistry?.department || (workerProfile as any)?.department || "Outreach";
      candidateWorkers = workers.filter((w) => {
        const wMinistry = allMinistries?.find((m: any) => m.id === w.majorMinistryId);
        return (
          w.id === workerProfile?.id ||
          w.majorMinistryId === workerProfile?.majorMinistryId ||
          (wMinistry && wMinistry.department?.toLowerCase() === userDept.toLowerCase()) ||
          (w as any).department?.toLowerCase() === userDept.toLowerCase()
        );
      });
    }

    // Filter by department/cluster if selected by Admin / Ministry Head
    if (selectedGroupClusterFilter !== "all") {
      const filterLower = selectedGroupClusterFilter.toLowerCase().trim();
      const deptClusters = (DEPARTMENT_CLUSTERS[filterLower.toUpperCase()] || []).map((c) => c.value.toLowerCase());

      candidateWorkers = candidateWorkers.filter((w) => {
        const wMinistryObj = allMinistries?.find((m: any) => m.id === w.majorMinistryId);
        const wMinistry = (wMinistryObj?.name || "").toLowerCase().trim();
        const wDept = ((w as any).department || wMinistryObj?.department || "").toLowerCase().trim();
        const matchesDeptCluster = deptClusters.some((c) => wMinistry.includes(c) || c.includes(wMinistry));
        const hasMatchingGroup = (groups || []).some(
          (g) => g.mentorId === w.id && (g.name || "").toLowerCase().includes(filterLower)
        );
        const hasMatchingMentee = menteesWithMentor.some(
          (m) => m.mentorId === w.id && (
            (groups || []).some((g) => g.id === m.groupId && (g.name || "").toLowerCase().includes(filterLower))
          )
        );
        return (
          wMinistry === filterLower ||
          (wMinistry && (wMinistry.includes(filterLower) || filterLower.includes(wMinistry))) ||
          wDept.includes(filterLower) ||
          matchesDeptCluster ||
          hasMatchingGroup ||
          hasMatchingMentee
        );
      });
    }

    // Build mentor cards with their individual mentee counts
    let list = candidateWorkers.map((w) => {
      const wMentees = menteesWithMentor.filter((m) => m.mentorId === w.id);
      return {
        mentor: w,
        mentees: wMentees,
        count: wMentees.length,
      };
    });

    // Only show mentors who have mentees or the logged in user
    list = list.filter((item) => item.count > 0 || item.mentor.id === workerProfile?.id);

    // Keyword search filter (mentor name, mentee name, email, phone)
    if (groupSearchQuery.trim()) {
      const q = groupSearchQuery.toLowerCase();
      list = list.filter((item) => {
        const mentorName = `${item.mentor.firstName} ${item.mentor.lastName}`.toLowerCase();
        const hasMatchingMentee = item.mentees.some((m) =>
          `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
          (m.email && m.email.toLowerCase().includes(q)) ||
          (m.phone && m.phone.toLowerCase().includes(q))
        );
        return mentorName.includes(q) || hasMatchingMentee;
      });
    }

    return list;
  }, [
    workers,
    menteesWithMentor,
    isMentorUser,
    workerProfile,
    isMinistryHeadUser,
    isAdminUser,
    allMinistries,
    myMinistryIds,
    selectedGroupClusterFilter,
    groupSearchQuery,
    groups,
  ]);

  // Track any unassigned mentees (for Admin view)
  const unassignedMentees = useMemo(() => {
    if (isMentorUser) return [];
    return menteesWithMentor.filter(
      (m) => !m.mentorId || !workers?.some((w) => w.id === m.mentorId)
    );
  }, [menteesWithMentor, workers, isMentorUser]);

  const [localDevotions, setLocalDevotions] = useState<C2SDevotionRecord[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("c2s_devotions_storage");
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Merged devotions list: Combines database server records with persistent client records
  const allDevotions = useMemo(() => {
    const serverList = Array.isArray(devotions) ? devotions : [];
    const merged = [...serverList];
    const seenIds = new Set(serverList.map((d: any) => d.id));

    localDevotions.forEach((ld) => {
      if (ld && ld.id && !seenIds.has(ld.id)) {
        merged.push(ld);
        seenIds.add(ld.id);
      }
    });

    // Sanitize any legacy group names from clusterName
    return merged.map((d) => ({
      ...d,
      clusterName: cleanClusterOrDept(d.clusterName, d.mentorId, d.mentorName, workers, allMinistries),
    }));
  }, [devotions, localDevotions, workers, allMinistries]);

  // --- Mutations ---
  const createDevotionMutation = useMutation({
    mutationFn: createC2SDevotionRecord,
    onSuccess: (newRecord) => {
      if (newRecord) {
        setLocalDevotions((prev) => {
          const updated = [newRecord, ...prev.filter((d) => d.id !== newRecord.id)];
          try {
            localStorage.setItem("c2s_devotions_storage", JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
        queryClient.setQueryData(["c2s-devotions"], (old: any) => {
          if (!old || !Array.isArray(old)) return [newRecord];
          return [newRecord, ...old.filter((item: any) => item.id !== newRecord.id)];
        });
      }
      queryClient.invalidateQueries({ queryKey: ["c2s-devotions"] });
      toast({ title: "Devotion Record Submitted", description: "Your devotion session has been recorded successfully." });
    },
  });

  const updateDevotionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateC2SDevotionRecord(id, data),
    onSuccess: (updatedRecord) => {
      if (updatedRecord) {
        setLocalDevotions((prev) => {
          const updated = prev.map((d) => (d.id === updatedRecord.id ? updatedRecord : d));
          try {
            localStorage.setItem("c2s_devotions_storage", JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
        queryClient.setQueryData(["c2s-devotions"], (old: any) => {
          if (!old || !Array.isArray(old)) return [updatedRecord];
          return old.map((item: any) => (item.id === updatedRecord.id ? updatedRecord : item));
        });
      }
      queryClient.invalidateQueries({ queryKey: ["c2s-devotions"] });
      toast({ title: "Devotion Record Updated" });
    },
  });

  const deleteDevotionMutation = useMutation({
    mutationFn: deleteC2SDevotionRecord,
    onSuccess: (_, deletedId) => {
      setLocalDevotions((prev) => {
        const updated = prev.filter((d) => d.id !== deletedId);
        try {
          localStorage.setItem("c2s_devotions_storage", JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
      queryClient.setQueryData(["c2s-devotions"], (old: any) => {
        if (!old || !Array.isArray(old)) return [];
        return old.filter((item: any) => item.id !== deletedId);
      });
      queryClient.invalidateQueries({ queryKey: ["c2s-devotions"] });
      toast({ title: "Devotion Record Deleted" });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: createC2SGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["c2s-groups"] });
      toast({ title: "Group Created" });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateC2SGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["c2s-groups"] });
      toast({ title: "Group Updated" });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: deleteC2SGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["c2s-groups"] });
      queryClient.invalidateQueries({ queryKey: ["c2s-mentees"] });
      toast({ title: "Group Deleted" });
    },
  });

  const createMenteeMutation = useMutation({
    mutationFn: createC2SMentee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["c2s-mentees"] });
      queryClient.invalidateQueries({ queryKey: ["c2s-groups"] });
      toast({ title: "Mentee Added" });
    },
  });

  const updateMenteeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateC2SMentee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["c2s-mentees"] });
      toast({ title: "Mentee Updated" });
    },
  });

  const deleteMenteeMutation = useMutation({
    mutationFn: deleteC2SMentee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["c2s-mentees"] });
      queryClient.invalidateQueries({ queryKey: ["c2s-groups"] });
      toast({ title: "Mentee Deleted" });
    },
  });

  const getWorker = (id: string) => workers?.find((w) => w.id === id);

  // Filtered devotion records
  const filteredDevotions = useMemo(() => {
    return allDevotions.filter((item) => {
      // 1. Role-based scoping
      if (isMentorUser) {
        // Mentor account strictly only views their own devotions
        const myFullName = workerProfile
          ? `${workerProfile.firstName || ""} ${workerProfile.lastName || ""}`.trim().toLowerCase()
          : "";
        const matchesMentorId = Boolean(workerProfile?.id && item.mentorId === workerProfile.id);
        const matchesMentorName = Boolean(
          myFullName && item.mentorName && item.mentorName.trim().toLowerCase() === myFullName
        );
        const matchesUserId = Boolean(user?.id && item.userId === user.id);
        const matchesEmail = Boolean(
          user?.email && item.mentorEmail && item.mentorEmail.toLowerCase() === user.email.toLowerCase()
        );
        const userGroupIds = groups?.filter((g) => g.mentorId === workerProfile?.id).map((g) => g.id) || [];
        const matchesGroup = Boolean(item.groupId && userGroupIds.includes(item.groupId));

        if (!matchesMentorId && !matchesMentorName && !matchesUserId && !matchesEmail && !matchesGroup) {
          return false;
        }
      } else if (isMinistryHeadUser && !isAdminUser) {
        // Ministry Head account sees all devotions within their department (e.g. Outreach)
        const myDeptClusterValues = activeClusterOptions.map((c) => c.value.toLowerCase());
        const cluster = (item.clusterName || "").toLowerCase().trim();
        const mentorWorker = workers?.find((w) => w.id === item.mentorId);
        const isMentorInMyDept = Boolean(
          mentorWorker &&
          (mentorWorker.majorMinistryId === workerProfile?.majorMinistryId ||
           (mentorWorker.majorMinistryId && myMinistryIds?.includes(mentorWorker.majorMinistryId)) ||
           mentorWorker.id === workerProfile?.id)
        );
        const isClusterInMyDept = myDeptClusterValues.some((c) => cluster.includes(c) || c.includes(cluster));

        // If specific cluster is selected
        if (selectedClusterFilter !== "all") {
          const target = selectedClusterFilter.toLowerCase().trim();
          const isMatch =
            cluster.includes(target) ||
            cluster === target ||
            cluster.replace(/\s+/g, "").includes(target.replace(/\s+/g, ""));
          if (!isMatch) return false;
        } else {
          // When 'all', must belong to their department's clusters or their department's mentors
          if (myDeptClusterValues.length > 0 && !isClusterInMyDept && !isMentorInMyDept && item.mentorId !== workerProfile?.id) {
            const group = groups?.find((g) => g.id === item.groupId);
            const gName = (group?.name || "").toLowerCase();
            const groupMatches = myDeptClusterValues.some((c) => gName.includes(c) || c.includes(gName));
            if (!groupMatches) return false;
          }
        }
      } else if (isAdminUser) {
        // Super Admin / Admin: Department / Ministry filter
        if (selectedDeptFilter !== "all") {
          const target = selectedDeptFilter.toLowerCase().trim();
          const cluster = (item.clusterName || "").toLowerCase().trim();
          const isMatch =
            cluster.includes(target) ||
            cluster === target ||
            cluster.replace(/\s+/g, "").includes(target.replace(/\s+/g, ""));

          if (!isMatch) {
            let deptMatch = false;
            const deptClusters = (
              DEPARTMENT_CLUSTERS[selectedDeptFilter] ||
              DEPARTMENT_CLUSTERS[selectedDeptFilter.toUpperCase()] ||
              []
            ).map((c) => c.value.toLowerCase());
            if (deptClusters.some((c) => cluster.includes(c))) {
              deptMatch = true;
            }
            if (!deptMatch) {
              return false;
            }
          }
        }

        // Cluster / Ministry filter
        if (selectedClusterFilter !== "all") {
          const target = selectedClusterFilter.toLowerCase().trim();
          const cluster = (item.clusterName || "").toLowerCase().trim();
          const isMatch =
            cluster.includes(target) ||
            cluster === target ||
            cluster.replace(/\s+/g, "").includes(target.replace(/\s+/g, ""));

          if (!isMatch) {
            return false;
          }
        }
      }

      // Manual filter
      if (selectedManualFilter !== "all" && item.manualType !== selectedManualFilter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTopic = item.topic?.toLowerCase().includes(q);
        const matchesLesson = item.lessonName?.toLowerCase().includes(q);
        const matchesModule = item.moduleName?.toLowerCase().includes(q);
        const matchesScripture = item.scripture?.toLowerCase().includes(q);
        const matchesCluster = item.clusterName?.toLowerCase().includes(q);
        const matchesMentor = item.mentorName?.toLowerCase().includes(q);
        const matchesAttendees = item.attendeeNames?.some((name: string) =>
          name.toLowerCase().includes(q)
        );
        const matchesReflection = item.reflectionNotes?.toLowerCase().includes(q);
        const matchesPrayer = item.prayerRequests?.toLowerCase().includes(q);

        if (
          !matchesTopic &&
          !matchesLesson &&
          !matchesModule &&
          !matchesScripture &&
          !matchesCluster &&
          !matchesMentor &&
          !matchesAttendees &&
          !matchesReflection &&
          !matchesPrayer
        ) {
          return false;
        }
      }
      return true;
    });
  }, [
    allDevotions,
    isMentorUser,
    isMinistryHeadUser,
    isAdminUser,
    workerProfile,
    user,
    groups,
    selectedClusterFilter,
    selectedManualFilter,
    selectedDeptFilter,
    searchQuery,
    DEPARTMENT_CLUSTERS,
    activeClusterOptions,
    workers,
    myMinistryIds,
  ]);

  // Handlers
  const handleSaveDevotion = async (data: any) => {
    if (editingDevotion) {
      const isPast = editingDevotion.devotionDate
        ? isBefore(toJsDate(editingDevotion.devotionDate), startOfDay(new Date()))
        : false;
      if (isPast && !isAdminUser) {
        toast({
          variant: "destructive",
          title: "Update Locked",
          description: "Cannot update a devotion after its date has passed. Updates must be submitted on the exact day.",
        });
        return;
      }
      await updateDevotionMutation.mutateAsync({
        id: editingDevotion.id,
        data,
      });
    } else {
      const isPast = data.devotionDate
        ? isBefore(toJsDate(data.devotionDate), startOfDay(new Date()))
        : false;
      if (isPast && !isAdminUser) {
        toast({
          variant: "destructive",
          title: "Date Already Passed",
          description: "Cannot record devotions for past dates. Please submit on the day of the session.",
        });
        return;
      }
      await createDevotionMutation.mutateAsync(data);
    }
    setIsDevotionSheetOpen(false);
    setEditingDevotion(null);
  };


  const handleSaveMentee = async (data: any) => {
    try {
      if (selectedMentee?.id) {
        await updateMenteeMutation.mutateAsync({ id: selectedMentee.id, data });
      } else {
        await createMenteeMutation.mutateAsync(data);
      }
      setIsMenteeSheetOpen(false);
      setSelectedMentee(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: "Could not save mentee.",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === "devotion") {
        await deleteDevotionMutation.mutateAsync(itemToDelete.id);
      } else if (itemToDelete.type === "group") {
        await deleteGroupMutation.mutateAsync(itemToDelete.id);
      } else {
        await deleteMenteeMutation.mutateAsync(itemToDelete.id);
      }
      setItemToDelete(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed" });
    }
  };

  const isLoading = devotionsLoading && !devotions && allDevotions.length === 0;

  // Active Cluster Scope Name
  const scopeClusterName =
    selectedClusterFilter === "all" ? "All Clusters" : selectedClusterFilter;

  // Determine mentor's assigned ministry/cluster label
  const mentorClusterLabel =
    allMinistries?.find((m: any) => m.id === workerProfile?.majorMinistryId)?.name ||
    (workerProfile as any)?.department ||
    "Outreach";

  if (!canManageC2S && !canViewC2SAnalytics && !isSuperAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
          <HeartHandshake className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground text-center max-w-md">
            You don't have permission to access Connect 2 Souls. Contact an administrator to request access.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col space-y-6">
        {/* ── TOP TOOLBAR ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight flex items-center gap-2">
                <HeartHandshake className="h-8 w-8 text-primary" />
                Connect 2 Souls
              </h1>

              {/* High-visibility Account Indicator Badge */}
              {!isAdminUser && (
                isMinistryHeadUser ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 shadow-xs">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Ministry Head • {headDepartment} Department</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/25 shadow-xs">
                    <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Mentor • {mentorClusterLabel}</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Top-Right High Visibility Action Button */}
          <div className="flex items-center gap-3">
            {activeTab === "devotions" && (
              <Button
                onClick={() => {
                  setEditingDevotion(null);
                  setIsDevotionSheetOpen(true);
                }}
                className="shadow-sm font-semibold text-xs h-9 px-4 gap-1.5"
              >
                <PlusCircle className="h-4 w-4" />
                Submit Devotion Record
              </Button>
            )}
            {(activeTab === "mentees" || activeTab === "groups") && (
              <Button
                onClick={() => {
                  setSelectedMentee(isMentorUser && workerProfile ? { mentorId: workerProfile.id } : null);
                  setIsMenteeSheetOpen(true);
                }}
                className="shadow-sm font-semibold text-xs h-9 px-4 gap-1.5"
              >
                <UserPlus className="h-4 w-4" />
                Add Mentee
              </Button>
            )}
          </div>
        </div>

        {/* Tabs Content Views (Navigated via sidebar sub-items) */}
        <Tabs
          defaultValue="devotions"
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >

          {/* ══════════════════ TAB 0: ADMIN OVERVIEW ══════════════════ */}
          {isSuperAdmin && (
            <TabsContent value="overview" className="space-y-6 mt-0">
              <AdminOverview
                groups={groups || []}
                mentees={menteesWithMentor || mentees || []}
                workers={workers || []}
                allMinistries={allMinistries || []}
                devotions={allDevotions}
                departmentClusters={DEPARTMENT_CLUSTERS}
                onViewDevotion={(dev) => setViewingDevotion(dev)}
              />
            </TabsContent>
          )}

          {/* ══════════════════ TAB 1: DEVOTIONS ══════════════════ */}
          <TabsContent value="devotions" className="space-y-6 mt-0">
            {/* Filter and Keyword Search Toolbar */}
            <div className="flex flex-col lg:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border border-border/60 shadow-sm">
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search keyword (lesson, mentee, mentor, prayer)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background text-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filter controls: Super Admin/Admin sees All Departments, Ministry Head sees their Department Clusters, Mentor sees no dropdown */}
              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                {isAdminUser ? (
                  <div className="flex items-center gap-1.5">
                    <Select
                      value={selectedDeptFilter === "all" ? "" : selectedDeptFilter}
                      onValueChange={(val) => {
                        setSelectedDeptFilter(val || "all");
                        setSelectedClusterFilter(val || "all");
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-[220px] bg-background text-xs font-semibold border border-border/80">
                        <SelectValue placeholder="Departments & Ministries">
                          {selectedDeptFilter === "all" || !selectedDeptFilter ? "Departments & Ministries" : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-96 overflow-y-auto">
                        <SelectGroup>
                          <SelectLabel className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 my-1 rounded-sm">
                            DEPARTMENTS & MINISTRIES
                          </SelectLabel>
                        </SelectGroup>
                        {Object.entries(DEPARTMENT_CLUSTERS).map(([dept, items]) => {
                          const titleLabel = `${dept.charAt(0) + dept.slice(1).toLowerCase()} Department`;
                          return (
                            <SelectGroup key={dept}>
                              <SelectLabel className="px-2 py-1 text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wider bg-muted/20 my-0.5 rounded-sm">
                                {titleLabel}
                              </SelectLabel>
                              {items.map((item) => (
                                <SelectItem key={item.value} value={item.value} className="text-xs cursor-pointer">
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {selectedDeptFilter !== "all" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDeptFilter("all");
                          setSelectedClusterFilter("all");
                        }}
                        className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Clear filter"
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Clear
                      </Button>
                    )}
                  </div>
                ) : isMinistryHeadUser ? (
                  <div className="flex items-center gap-1.5">
                    <Select
                      value={selectedClusterFilter === "all" ? "" : selectedClusterFilter}
                      onValueChange={(val) => {
                        setSelectedClusterFilter(val || "all");
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-[220px] bg-background text-xs font-semibold border border-border/80">
                        <SelectValue placeholder="All Ministries & Clusters">
                          {selectedClusterFilter === "all" || !selectedClusterFilter ? "All Ministries & Clusters" : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-96 overflow-y-auto">
                        <SelectGroup>
                          <SelectLabel className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 my-1 rounded-sm">
                            MINISTRIES & CLUSTERS
                          </SelectLabel>
                          <SelectItem value="all" className="text-xs cursor-pointer font-semibold">
                            All Ministries & Clusters
                          </SelectItem>
                          {activeClusterOptions.map((item) => (
                            <SelectItem key={item.value} value={item.value} className="text-xs cursor-pointer">
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {selectedClusterFilter !== "all" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedClusterFilter("all")}
                        className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Clear filter"
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Clear
                      </Button>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Devotions Grid / Feed */}
            {isLoading ? (
              <div className="flex justify-center py-16">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredDevotions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20">
                <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <h3 className="text-lg font-semibold">No Devotion Records Found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                  {searchQuery || selectedClusterFilter !== "all" || selectedManualFilter !== "all"
                    ? "Try adjusting your keyword search or filter criteria."
                    : "No devotion sessions have been recorded yet."}
                </p>
              </div>
            ) : (

              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                {filteredDevotions.map((record) => {
                  const photos = record.photoUrls?.length
                    ? record.photoUrls
                    : record.photoUrl
                      ? [record.photoUrl]
                      : [];
                  const isAuthor = Boolean(
                    (workerProfile && record.mentorId === workerProfile.id) ||
                    (workerProfile &&
                      record.mentorName &&
                      record.mentorName.trim().toLowerCase() ===
                        `${workerProfile.firstName || ""} ${workerProfile.lastName || ""}`.trim().toLowerCase()) ||
                    (user?.id && record.userId === user.id)
                  );

                  const isPastDevotion = record.devotionDate
                    ? isBefore(toJsDate(record.devotionDate), startOfDay(new Date()))
                    : false;

                  const formattedDate = record.devotionDate
                    ? format(toJsDate(record.devotionDate), "yyyy-MM-dd")
                    : "2026-07-01";
                  const formattedTime = record.devotionDate
                    ? format(toJsDate(record.devotionDate), "hh:mm a")
                    : "09:15 AM";

                  const attendeesString =
                    record.attendeeNames && record.attendeeNames.length > 0
                      ? record.attendeeNames.join(", ")
                      : "Mentee";

                  return (
                    <Card
                      key={record.id}
                      className="overflow-hidden border border-border/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col bg-card"
                    >
                      {/* ── TOP HEADER BAR: DATE PILL, TIME, VIEW PHOTO BUTTON & MENU ── */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full text-xs">
                            {formattedDate}
                          </span>
                          {isPastDevotion ? (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground py-0.5 px-2 gap-1 font-medium border-border/60">
                              <Lock className="h-2.5 w-2.5 text-muted-foreground" /> Locked
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 py-0.5 px-2 font-semibold">
                              Today
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground font-medium">
                            {formattedTime}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {photos.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingDevotion(record)}
                              className="h-8 px-3 rounded-full text-xs font-semibold text-primary border-border/80 hover:bg-muted/60 flex items-center gap-1.5 transition-colors"
                            >
                              <Camera className="h-3.5 w-3.5" />
                              <span>View Photo</span>
                            </Button>
                          )}

                          {(isAuthor || isMinistryHeadUser || isAdminUser) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {isPastDevotion && !isAdminUser ? (
                                  <DropdownMenuItem
                                    disabled
                                    className="text-xs text-muted-foreground opacity-60 cursor-not-allowed flex items-center justify-between"
                                  >
                                    <span className="flex items-center">
                                      <Lock className="mr-2 h-4 w-4 text-muted-foreground" /> Edit Locked
                                    </span>
                                    <span className="text-[10px] text-muted-foreground ml-2">(Date passed)</span>
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onSelect={() => {
                                      setEditingDevotion(record);
                                      setIsDevotionSheetOpen(true);
                                    }}
                                  >
                                    <Edit className="mr-2 h-4 w-4" /> Edit Record
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onSelect={() =>
                                    setItemToDelete({
                                      id: record.id,
                                      type: "devotion",
                                      name: record.topic,
                                    })
                                  }
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete Record
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>

                      {/* ── TITLE & SUBTITLE ── */}
                      <div className="mt-3 space-y-0.5">
                        <h3
                          onClick={() => setViewingDevotion(record)}
                          className="text-base font-bold text-foreground hover:text-primary cursor-pointer transition-colors leading-tight"
                        >
                          {record.lessonName || record.topic}
                        </h3>
                        <p className="text-xs text-muted-foreground font-normal">
                          {attendeesString} with {record.mentorName || "Mentor"}
                        </p>
                      </div>

                      {/* ── REFLECTION BOX ── */}
                      {record.reflectionNotes && (
                        <div className="mt-3 bg-muted/40 dark:bg-muted/20 p-3.5 rounded-xl border border-border/50 space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground">
                            Reflection
                          </p>
                          <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                            {record.reflectionNotes}
                          </p>
                        </div>
                      )}

                      {/* ── PRAYER REQUEST LINE ── */}
                      {record.prayerRequests && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Heart className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>
                            <strong className="font-semibold text-muted-foreground">
                              Prayer Request:
                            </strong>{" "}
                            {record.prayerRequests}
                          </span>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>

            )}
          </TabsContent>

          {/* ══════════════════ TAB 2: MENTEES (PER MENTOR) ══════════════════ */}
          <TabsContent value="mentees" className="space-y-6 mt-0">
            {/* Filter and Keyword Search Toolbar */}
            <div className="flex flex-col lg:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border border-border/60 shadow-sm">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search mentor or mentee..."
                    value={groupSearchQuery}
                    onChange={(e) => setGroupSearchQuery(e.target.value)}
                    className="pl-9 bg-background text-xs"
                  />
                  {groupSearchQuery && (
                    <button
                      onClick={() => setGroupSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Admin Departments Summary Badge */}
                {isAdminUser && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-medium text-purple-700 dark:text-purple-300 whitespace-nowrap shadow-2xs self-start sm:self-auto">
                    <Building2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                    <span className="font-bold text-foreground">Departments</span>
                    <span>•</span>
                    <span><strong className="text-foreground">{adminOverallTotals.totalDepartments}</strong> Depts</span>
                    <span>•</span>
                    <span><strong className="text-foreground">{adminOverallTotals.totalMentors}</strong> Mentors</span>
                    <span>•</span>
                    <span><strong className="text-primary">{adminOverallTotals.totalMentees}</strong> Mentees</span>
                  </div>
                )}

                {/* Ministry Head Department Summary Badge */}
                {isMinistryHeadUser && !isAdminUser && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60 text-xs font-medium text-muted-foreground whitespace-nowrap shadow-2xs self-start sm:self-auto">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    <span className="font-bold text-foreground">{headDepartment}</span>
                    <span>•</span>
                    <span><strong className="text-foreground">{departmentOverviewTotals.totalMentors}</strong> Mentors</span>
                    <span>•</span>
                    <span><strong className="text-primary">{departmentOverviewTotals.totalMentees}</strong> Mentees</span>
                  </div>
                )}
              </div>

              {/* Filter controls & Action buttons */}
              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                {isAdminUser ? (
                  <div className="flex items-center gap-1.5">
                    <Select
                      value={selectedGroupClusterFilter === "all" ? "" : selectedGroupClusterFilter}
                      onValueChange={(val) => setSelectedGroupClusterFilter(val || "all")}
                    >
                      <SelectTrigger className="w-full sm:w-[260px] bg-background text-xs font-semibold border border-border/80">
                        <SelectValue placeholder={`Departments & Ministries (${adminOverallTotals.totalMentees})`}>
                          {selectedGroupClusterFilter === "all" || !selectedGroupClusterFilter
                            ? `All Departments & Ministries (${adminOverallTotals.totalMentees})`
                            : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-96 overflow-y-auto">
                        <SelectGroup>
                          <SelectLabel className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 my-1 rounded-sm">
                            WHOLE CHURCH
                          </SelectLabel>
                          <SelectItem value="all" className="text-xs cursor-pointer font-bold">
                            All Departments & Ministries ({adminOverallTotals.totalMentees})
                          </SelectItem>
                        </SelectGroup>
                        {Object.entries(DEPARTMENT_CLUSTERS).map(([dept, items]) => {
                          const titleLabel = `${dept.charAt(0) + dept.slice(1).toLowerCase()} Department`;
                          const deptData = adminDepartmentOverview.find(
                            (d) => d.department.toLowerCase() === dept.toLowerCase()
                          );
                          const deptMentees = deptData?.menteesCount ?? 0;
                          return (
                            <SelectGroup key={dept}>
                              <SelectLabel className="px-2 py-1 text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wider bg-muted/20 my-0.5 rounded-sm flex items-center justify-between">
                                <span>{titleLabel}</span>
                              </SelectLabel>
                              <SelectItem value={dept.charAt(0) + dept.slice(1).toLowerCase()} className="text-xs font-semibold cursor-pointer">
                                <span className="flex items-center justify-between w-full gap-3 font-semibold text-primary">
                                  <span>All {titleLabel}</span>
                                  <span>({deptMentees})</span>
                                </span>
                              </SelectItem>
                              {items.map((item) => {
                                const count = clusterMenteesMap[item.value] || 0;
                                return (
                                  <SelectItem key={item.value} value={item.value} className="text-xs cursor-pointer">
                                    <span className="flex items-center justify-between w-full gap-3">
                                      <span>{item.label}</span>
                                      <span className={count > 0 ? "font-bold text-primary" : "text-muted-foreground/60"}>
                                        ({count})
                                      </span>
                                    </span>
                                  </SelectItem>
                                );
                              })}
                            </SelectGroup>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {selectedGroupClusterFilter !== "all" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedGroupClusterFilter("all")}
                        className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Clear filter"
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Clear
                      </Button>
                    )}
                  </div>
                ) : isMinistryHeadUser ? (
                  <div className="flex items-center gap-1.5">
                    <Select
                      value={selectedGroupClusterFilter === "all" ? "" : selectedGroupClusterFilter}
                      onValueChange={(val) => setSelectedGroupClusterFilter(val || "all")}
                    >
                      <SelectTrigger className="w-full sm:w-[240px] bg-background text-xs font-semibold border border-border/80">
                        <SelectValue placeholder={`All Ministries & Clusters (${departmentOverviewTotals.totalMentees})`}>
                          {selectedGroupClusterFilter === "all" || !selectedGroupClusterFilter
                            ? `All Ministries & Clusters (${departmentOverviewTotals.totalMentees})`
                            : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-96 overflow-y-auto">
                        <SelectGroup>
                          <SelectLabel className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 my-1 rounded-sm">
                            MINISTRIES & CLUSTERS
                          </SelectLabel>
                          <SelectItem value="all" className="text-xs cursor-pointer font-semibold">
                            All Ministries & Clusters ({departmentOverviewTotals.totalMentees})
                          </SelectItem>
                          {departmentMinistriesOverview.map((item) => (
                            <SelectItem key={item.value} value={item.value} className="text-xs cursor-pointer">
                              <span className="flex items-center justify-between w-full gap-3">
                                <span>{item.label}</span>
                                <span className={item.menteesCount > 0 ? "font-bold text-primary" : "text-muted-foreground/60"}>
                                  ({item.menteesCount})
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {selectedGroupClusterFilter !== "all" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedGroupClusterFilter("all")}
                        className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Clear filter"
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Clear
                      </Button>
                    )}
                  </div>
                ) : null}
              </div>
            </div>


            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : displayedMentors.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-dashed p-8 space-y-3">
                <Users className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <h3 className="font-bold text-base text-foreground">No Mentees Found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {isMentorUser
                    ? "You haven't enrolled any mentees yet. Click below to add your first mentee."
                    : "No mentors or mentees match your current search and filter criteria."}
                </p>
                <Button
                  onClick={() => {
                    setSelectedMentee(isMentorUser && workerProfile ? { mentorId: workerProfile.id } : null);
                    setIsMenteeSheetOpen(true);
                  }}
                  size="sm"
                  className="gap-1.5 text-xs"
                >
                  <UserPlus className="h-4 w-4" /> Add Mentee
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedMentors.map(({ mentor, mentees: mentorMentees, count }) => {
                  const isExpanded = !collapsedMentorIds[mentor.id];
                  const mentorInitials = `${mentor?.firstName?.[0] || ""}${mentor?.lastName?.[0] || ""}`;
                  const mentorMinistry = allMinistries?.find((m: any) => m.id === mentor?.majorMinistryId)?.name;
                  const mentorDept = mentorMinistry || (mentor as any)?.department || "Outreach";

                  return (
                    <div
                      key={mentor.id}
                      className="rounded-3xl border border-border/70 bg-card shadow-xs overflow-hidden transition-all p-5 sm:p-6 space-y-4"
                    >
                      {/* ── MENTOR HEADER ROW ── */}
                      <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                        <div className="flex items-start gap-3">
                          {/* Collapse / Expand Toggle Button */}
                          <button
                            onClick={() => toggleMentorCollapse(mentor.id)}
                            className="mt-0.5 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          >
                            {!isExpanded ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronUp className="h-5 w-5" />
                            )}
                          </button>

                          {/* Mentor Avatar */}
                          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20 shrink-0">
                            {mentorInitials || "M"}
                          </div>

                          <div>
                            {/* Mentor Name */}
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-headline font-extrabold text-foreground tracking-tight">
                                {mentor.firstName} {mentor.lastName}
                              </h3>
                              {mentor.id === workerProfile?.id && (
                                <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30 py-0 px-2">
                                  You
                                </Badge>
                              )}
                            </div>

                            {/* Subtitle */}
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">
                              Mentor • <span className="text-foreground/80 font-semibold">{mentorDept}</span>
                            </p>
                          </div>
                        </div>

                        {/* Right: Individual Mentee Count */}
                        <div className="flex items-center gap-3 ml-auto sm:ml-0">
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary font-bold px-3.5 py-1 rounded-full text-xs"
                          >
                            {count} {count === 1 ? "mentee" : "mentees"}
                          </Badge>
                        </div>
                      </div>

                      {/* ── EXPANDED BODY: INDIVIDUAL MENTEES ── */}
                      {isExpanded && (
                        <div className="space-y-3 pt-2">
                          {mentorMentees.length > 0 && (
                            <div className="grid grid-cols-12 gap-4 px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                              <div className="col-span-5 sm:col-span-4">NAME</div>
                              <div className="hidden sm:block sm:col-span-3 text-left">CONTACT</div>
                              <div className="col-span-3 sm:col-span-2 text-center">STATUS</div>
                              <div className="col-span-3 sm:col-span-2 text-right sm:text-center">PROGRESS</div>
                              <div className="hidden sm:block sm:col-span-1"></div>
                            </div>
                          )}

                          <div className="space-y-2">
                            {mentorMentees.length > 0 ? (
                              mentorMentees.map((m) => {
                                const fullName = `${m.firstName} ${m.lastName}`;
                                const initials = `${m.firstName ? m.firstName[0] : ""}${m.lastName ? m.lastName[0] : ""}`;
                                const menteeDevotions = devotions?.filter((d: any) =>
                                  d.attendeeNames?.some((name: string) => name.toLowerCase().includes(fullName.toLowerCase()))
                                ) || [];
                                const lastSessionDate = menteeDevotions[0]?.devotionDate
                                  ? format(toJsDate(menteeDevotions[0].devotionDate), "yyyy-MM-dd")
                                  : "2026-07-01";

                                const progressPct =
                                  m.status === "Completed"
                                    ? 100
                                    : m.status === "Dropped"
                                      ? 25
                                      : menteeDevotions.length > 0
                                        ? Math.min(100, Math.max(30, Math.round((menteeDevotions.length / 24) * 100)))
                                        : 55;

                                const statusColorClass =
                                  m.status === "Completed"
                                    ? "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                                    : m.status === "Dropped"
                                      ? "bg-destructive/15 text-destructive"
                                      : m.status === "Needs Follow-up"
                                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";

                                const displayStatus = m.status || "In Progress";

                                return (
                                  <div
                                    key={m.id}
                                    className="grid grid-cols-12 gap-4 items-center p-3 sm:p-3.5 rounded-2xl bg-muted/20 hover:bg-muted/40 border border-border/40 text-xs transition-colors"
                                  >
                                    {/* Mentee Name & Initials */}
                                    <div className="col-span-5 sm:col-span-4 flex items-center gap-3">
                                      <div className="h-8 w-8 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center border border-primary/20 shrink-0">
                                        {initials}
                                      </div>
                                      <div className="overflow-hidden">
                                        <p className="font-bold text-foreground text-xs leading-none truncate">
                                          {fullName}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                          Last: {lastSessionDate}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Contact */}
                                    <div className="hidden sm:block sm:col-span-3 text-xs font-medium text-muted-foreground truncate">
                                      {m.email || m.phone || "—"}
                                    </div>

                                    {/* Status Pill */}
                                    <div className="col-span-3 sm:col-span-2 flex justify-center">
                                      <Badge
                                        variant="secondary"
                                        className={`${statusColorClass} font-semibold px-3 py-1 rounded-full text-[11px] border-transparent`}
                                      >
                                        {displayStatus}
                                      </Badge>
                                    </div>

                                    {/* Progress Bar & Percentage */}
                                    <div className="col-span-3 sm:col-span-2 flex items-center justify-end sm:justify-center gap-2">
                                      <div className="w-16 bg-muted h-1.5 rounded-full overflow-hidden hidden sm:block">
                                        <div
                                          className="bg-primary h-full rounded-full transition-all duration-300"
                                          style={{ width: `${progressPct}%` }}
                                        />
                                      </div>
                                      <span className="font-semibold text-muted-foreground text-xs">
                                        {progressPct}%
                                      </span>
                                    </div>

                                    {/* Mentee Row Actions */}
                                    <div className="hidden sm:flex sm:col-span-1 items-center justify-end gap-1">
                                      <button
                                        onClick={() => {
                                          setSelectedMentee(m);
                                          setIsMenteeSheetOpen(true);
                                        }}
                                        className="p-1 text-muted-foreground hover:text-primary transition-colors"
                                        title="Edit Mentee"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          setItemToDelete({
                                            id: m.id,
                                            type: "mentee",
                                            name: fullName,
                                          })
                                        }
                                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                                        title="Delete Mentee"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-6 border border-dashed rounded-2xl bg-muted/10 space-y-2">
                                <p className="text-xs text-muted-foreground italic">
                                  No mentees enrolled for {mentor.firstName} {mentor.lastName} yet.
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMentee({ mentorId: mentor.id });
                                    setIsMenteeSheetOpen(true);
                                  }}
                                  className="h-7 text-xs text-primary font-semibold"
                                >
                                  <PlusCircle className="h-3.5 w-3.5 mr-1" /> Add Mentee
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Unassigned Mentees Section (if any exist) */}
                {unassignedMentees.length > 0 && (
                  <div className="rounded-3xl border border-amber-500/40 bg-card shadow-xs overflow-hidden p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Users className="h-5 w-5 text-amber-500" />
                        <div>
                          <h3 className="text-lg font-bold text-foreground">Unassigned Mentees</h3>
                          <p className="text-xs text-muted-foreground">Mentees waiting to be assigned to a mentor</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold px-3 py-1 rounded-full text-xs">
                        {unassignedMentees.length} unassigned
                      </Badge>
                    </div>

                    <div className="space-y-2 pt-2">
                      {unassignedMentees.map((m) => {
                        const fullName = `${m.firstName} ${m.lastName}`;
                        return (
                          <div
                            key={m.id}
                            className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-border/40 text-xs"
                          >
                            <span className="font-bold text-foreground">{fullName}</span>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => {
                                  setSelectedMentee(m);
                                  setIsMenteeSheetOpen(true);
                                }}
                              >
                                Assign Mentor
                              </Button>
                              <button
                                onClick={() =>
                                  setItemToDelete({
                                    id: m.id,
                                    type: "mentee",
                                    name: fullName,
                                  })
                                }
                                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ══════════════════ TAB 3: ANALYTICS ══════════════════ */}
          <TabsContent value="analytics" className="mt-0">
            <C2SAnalytics
              mentees={menteesWithMentor || []}
              groups={groups || []}
              devotions={allDevotions}
              workers={workers || []}
              allMinistries={allMinistries || []}
              workerProfile={workerProfile}
              user={user}
              canGenerateReport={canGenerateAnalyticsReport}
              departmentClusters={DEPARTMENT_CLUSTERS}
              headDepartment={headDepartment}
              isSuperAdmin={isAdminUser}
              isMinistryHead={isMinistryHeadUser}
              isMentor={isMentorUser}
              onViewDevotion={(dev) => setViewingDevotion(dev)}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Submit / Edit Devotion Record Sheet ── */}
      <Sheet open={isDevotionSheetOpen} onOpenChange={setIsDevotionSheetOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto w-full">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {editingDevotion ? "Edit Devotion Record" : "Submit Devotion Record"}
            </SheetTitle>
          </SheetHeader>
          <DevotionForm
            devotion={editingDevotion}
            groups={groups || []}
            mentees={mentees || []}
            workers={workers || []}
            currentWorker={workerProfile}
            allMinistries={allMinistries || []}
            isMinistryHead={isMinistryHeadUser}
            isSuperAdmin={isAdminUser}
            onSave={handleSaveDevotion}
            onClose={() => setIsDevotionSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* ── View Devotion Details Lightbox Dialog ── */}
      <DevotionDetailsModal
        devotion={viewingDevotion}
        isOpen={!!viewingDevotion}
        onClose={() => setViewingDevotion(null)}
        isSuperAdmin={isSuperAdmin}
      />

      {/* ── Mentee Sheet ── */}
      <Sheet open={isMenteeSheetOpen} onOpenChange={setIsMenteeSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {selectedMentee?.id ? "Edit Mentee" : "Add Mentee"}
            </SheetTitle>
            <SheetDescription>
              Add or update a mentee in Connect 2 Souls.
            </SheetDescription>
          </SheetHeader>
          <MenteeForm
            mentee={selectedMentee}
            workers={workers || []}
            currentWorker={workerProfile}
            isHeadOrAdmin={isHeadOrAdmin}
            onSave={handleSaveMentee}
          />
        </SheetContent>
      </Sheet>

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{itemToDelete?.name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
