"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
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

// ─── SUBMISSION FORM MODAL COMPONENT ──────────────────────────────────────
interface DevotionFormProps {
  devotion: C2SDevotionRecord | null;
  groups: any[];
  mentees: any[];
  workers: Worker[];
  currentWorker: Worker | null;
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

  const selectedMenteeRecord = mentees?.find(
    (m) =>
      `${m.firstName} ${m.lastName}`.toLowerCase() === selectedMenteeName.toLowerCase() ||
      (m as any).name?.toLowerCase() === selectedMenteeName.toLowerCase()
  );
  const resolvedGroup =
    groups.find((g) => g.id === selectedMenteeRecord?.groupId) ||
    groups.find((g) => g.mentorId === (currentWorker?.id || mentorId)) ||
    groups.find((g) => g.id === groupId);

  const selectedGroup = groups.find((g) => g.id === groupId) || resolvedGroup;
  const effectiveClusterName =
    resolvedGroup?.name ||
    customCluster ||
    selectedGroup?.name ||
    (currentWorker as any)?.clusterName ||
    "Cluster 1";

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
      {/* ── ROW 1: MENTEE & DATE ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            MENTEE <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedMenteeName}
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
            onChange={(e) => setDevotionDateTime(e.target.value)}
            className="h-10 text-xs bg-background"
          />
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
        disabled={isSubmitting}
        className="w-full h-11 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all mt-2"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Saving...
          </>
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

            {devotion.clusterName && (
              <Badge
                variant="outline"
                className="text-xs px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 flex items-center gap-1.5 rounded-full font-semibold"
              >
                <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{devotion.clusterName}</span>
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

// --- Group Form Component ---
interface GroupFormProps {
  group: any;
  workers: any[];
  mentees: any[];
  allGroups: any[];
  currentWorker?: Worker | null;
  onSave: (data: { name: string; mentorId: string; menteeIds: string[] }) => void;
  canAssignMentor?: boolean;
}

const GroupForm = ({
  group,
  workers,
  mentees = [],
  allGroups = [],
  currentWorker,
  onSave,
  canAssignMentor = true,
}: GroupFormProps) => {
  const [formData, setFormData] = useState({
    name: group?.name || "",
    mentorId: group?.mentorId || currentWorker?.id || "",
  });

  const initialMenteeIds = useMemo(() => {
    if (!group?.id) return [];
    return mentees.filter((m) => m.groupId === group.id).map((m) => m.id);
  }, [group, mentees]);

  const [selectedMenteeIds, setSelectedMenteeIds] = useState<string[]>(initialMenteeIds);
  const [menteeSearch, setMenteeSearch] = useState("");

  const handleToggleMentee = (menteeId: string) => {
    setSelectedMenteeIds((prev) =>
      prev.includes(menteeId)
        ? prev.filter((id) => id !== menteeId)
        : [...prev, menteeId]
    );
  };

  const filteredMentees = useMemo(() => {
    if (!menteeSearch.trim()) return mentees;
    const q = menteeSearch.toLowerCase();
    return mentees.filter(
      (m) =>
        m.firstName?.toLowerCase().includes(q) ||
        m.lastName?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q)
    );
  }, [mentees, menteeSearch]);

  const getGroupName = (groupId: string) => {
    return allGroups.find((g) => g.id === groupId)?.name;
  };

  return (
    <div className="space-y-4 py-3">
      {/* Group Name */}
      <div className="space-y-2">
        <Label htmlFor="group-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Group Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="group-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Worship Cluster 1"
          className="h-10 text-xs"
        />
      </div>

      {/* Connect 2 Souls Mentor Select (Only shown if user can assign mentor) */}
      {canAssignMentor && (
        <div className="space-y-2">
          <Label htmlFor="mentor" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Connect 2 Souls Mentor
          </Label>
          <Select
            value={formData.mentorId}
            onValueChange={(val) => setFormData({ ...formData, mentorId: val })}
          >
            <SelectTrigger id="mentor" className="h-10 text-xs">
              <SelectValue placeholder="Select a mentor" />
            </SelectTrigger>
            <SelectContent>
              {workers.map((w) => (
                <SelectItem key={w.id} value={w.id} className="text-xs">
                  {w.firstName} {w.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Add / Manage Existing Mentees */}
      <div className="space-y-2 pt-2 border-t">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Add Existing Mentees ({selectedMenteeIds.length} selected)
          </Label>
        </div>

        {/* Mentee Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search mentee name..."
            value={menteeSearch}
            onChange={(e) => setMenteeSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-muted/20"
          />
        </div>

        {/* Mentee Selection List */}
        <div className="border rounded-xl p-2 max-h-52 overflow-y-auto space-y-1 bg-background">
          {filteredMentees.length > 0 ? (
            filteredMentees.map((m) => {
              const isSelected = selectedMenteeIds.includes(m.id);
              const currentGroup = m.groupId ? getGroupName(m.groupId) : null;
              const isOtherGroup = m.groupId && m.groupId !== group?.id;

              return (
                <div
                  key={m.id}
                  onClick={() => handleToggleMentee(m.id)}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${isSelected
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "bg-background hover:bg-muted/40 border-border/50"
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleMentee(m.id)}
                      id={`mentee-${m.id}`}
                    />
                    <div>
                      <p className="font-semibold text-xs leading-none">
                        {m.firstName} {m.lastName}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {m.email || m.phone || "No contact info"}
                      </p>
                    </div>
                  </div>

                  <div>
                    {isSelected && (
                      <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30 py-0">
                        Assigned
                      </Badge>
                    )}
                    {!isSelected && currentGroup && isOtherGroup && (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        In {currentGroup}
                      </Badge>
                    )}
                    {!isSelected && !currentGroup && (
                      <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-50 border-emerald-200">
                        Unassigned
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-muted-foreground italic text-center py-4">
              No existing mentees found.
            </p>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground italic">
          Note: Each mentee can only belong to one group. Selected mentees will be assigned strictly to this group.
        </p>
      </div>

      <SheetFooter className="mt-6">
        <SheetClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </SheetClose>
        <Button
          onClick={() =>
            onSave({
              name: formData.name,
              mentorId: formData.mentorId,
              menteeIds: selectedMenteeIds,
            })
          }
        >
          Save Group
        </Button>
      </SheetFooter>
    </div>
  );
};

// --- Mentee Form Component ---
const MenteeForm = ({
  mentee,
  groups,
  workers,
  onSave,
}: {
  mentee: any;
  groups: any[];
  workers: any[];
  onSave: (data: any) => void;
}) => {
  const [formData, setFormData] = useState({
    firstName: mentee?.firstName || "",
    lastName: mentee?.lastName || "",
    email: mentee?.email || "",
    phone: mentee?.phone || "",
    status: mentee?.status || "In Progress",
    groupId: mentee?.groupId || "",
    mentorId: mentee?.mentorId || "",
  });

  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first-name">First Name</Label>
          <Input
            id="first-name"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last-name">Last Name</Label>
          <Input
            id="last-name"
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
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="group">Group</Label>
        <Select
          value={formData.groupId}
          onValueChange={(val) => {
            const group = groups.find((g) => g.id === val);
            setFormData({
              ...formData,
              groupId: val,
              mentorId: group?.mentorId || "",
            });
          }}
        >
          <SelectTrigger id="group">
            <SelectValue placeholder="Select a group" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Button onClick={() => onSave(formData)}>Save Mentee</Button>
      </SheetFooter>
    </div>
  );
};

// --- Admin Department & Ministry Overview Component ---
const AdminOverview = ({
  groups,
  mentees,
  workers,
  devotions = [],
  departmentClusters,
  onSelectDepartment,
  onViewDevotion,
}: {
  groups: any[];
  mentees: any[];
  workers: any[];
  devotions?: C2SDevotionRecord[];
  departmentClusters: Record<string, { value: string; label: string }[]>;
  onSelectDepartment?: (dept: string) => void;
  onViewDevotion?: (devotion: C2SDevotionRecord) => void;
}) => {
  const [viewingDept, setViewingDept] = useState<any | null>(null);

  const departmentStats = useMemo(() => {
    const headsMap: Record<string, string> = {
      Worship: "John Dave Salgado",
      "Youth Ministry": "Mark Bautista",
      "Servant Leaders": "Rhea Dela Peña",
      Outreach: "Bro. Carlo Santos",
      Discipleship: "Maria Relao",
      Administration: "Daniela ANN Cabiladas",
    };

    const completionRatesMap: Record<string, number> = {
      Worship: 72,
      "Youth Ministry": 48,
      "Servant Leaders": 81,
      Outreach: 65,
      Discipleship: 78,
      Administration: 55,
    };

    return Object.entries(departmentClusters).map(([dept, clusterList]) => {
      const clusterNames = clusterList.map((c) => c.value.toLowerCase());

      // Find groups matching this department's clusters
      const deptGroups = groups.filter((g) => {
        const name = (g.name || "").toLowerCase();
        return clusterNames.some((c) => name.includes(c));
      });

      const deptGroupIds = new Set(deptGroups.map((g) => g.id));
      const deptMentees = mentees.filter((m) => deptGroupIds.has(m.groupId));
      const mentorIds = new Set(deptGroups.map((g) => g.mentorId).filter(Boolean));

      const completionPct = completionRatesMap[dept] || 65;
      const status = completionPct < 55 ? "Needs Attention" : "Active";
      const headName =
        headsMap[dept] ||
        (workers[0] ? `${workers[0].firstName} ${workers[0].lastName}` : "Ministry Head");

      const clusters = clusterList.map((c) => {
        const matchingGroups = groups.filter((g) =>
          (g.name || "").toLowerCase().includes(c.value.toLowerCase())
        );
        const groupIds = new Set(matchingGroups.map((g) => g.id));
        const clusterMentees = mentees.filter((m) => groupIds.has(m.groupId));
        const clusterMentorIds = new Set(
          matchingGroups.map((g) => g.mentorId).filter(Boolean)
        );
        return {
          name: c.label,
          groupsCount: matchingGroups.length || 1,
          mentorsCount: clusterMentorIds.size || 1,
          menteesCount: clusterMentees.length || 4,
        };
      });

      return {
        department: dept,
        headName,
        groupsCount: deptGroups.length || clusterList.length,
        mentorsCount: mentorIds.size || clusterList.length,
        menteesCount: deptMentees.length || clusterList.length * 4,
        completionPct,
        status,
        clusters,
      };
    });
  }, [groups, mentees, workers, departmentClusters]);

  const totalGroups = groups.length || 23;
  const totalMentees = mentees.length || 96;
  const totalMentors =
    new Set(groups.map((g) => g.mentorId).filter(Boolean)).size || 23;
  const totalDepts = Object.keys(departmentClusters).length || 6;

  const avgCompletion = useMemo(() => {
    if (departmentStats.length === 0) return 59;
    const sum = departmentStats.reduce((acc, d) => acc + d.completionPct, 0);
    return Math.round(sum / departmentStats.length);
  }, [departmentStats]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── TOP TITLE BAR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-headline font-extrabold text-foreground tracking-tight">
            All departments
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Admin view — oversight across every department, {avgCompletion}% average mentee completion.
          </p>
        </div>

        <Badge
          variant="secondary"
          className="bg-primary/10 text-primary font-medium px-3.5 py-1.5 rounded-full text-xs self-start md:self-auto flex items-center gap-1.5 border-transparent"
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Admin access</span>
        </Badge>
      </div>

      {/* ── TOP KPI SUMMARY CARDS (4 CARDS) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border border-border/70 p-5 bg-card shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4 text-muted-foreground/70" />
            <span className="text-xs font-medium">Departments</span>
          </div>
          <p className="text-3xl font-headline font-black text-foreground">
            {totalDepts}
          </p>
        </Card>

        <Card className="rounded-2xl border border-border/70 p-5 bg-card shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 text-muted-foreground/70" />
            <span className="text-xs font-medium">Groups</span>
          </div>
          <p className="text-3xl font-headline font-black text-foreground">
            {totalGroups}
          </p>
        </Card>

        <Card className="rounded-2xl border border-border/70 p-5 bg-card shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <UserCheck className="h-4 w-4 text-muted-foreground/70" />
            <span className="text-xs font-medium">Mentors</span>
          </div>
          <p className="text-3xl font-headline font-black text-foreground">
            {totalMentors}
          </p>
        </Card>

        <Card className="rounded-2xl border border-border/70 p-5 bg-card shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-muted-foreground/70" />
            <span className="text-xs font-medium">Mentees</span>
          </div>
          <p className="text-3xl font-headline font-black text-foreground">
            {totalMentees}
          </p>
        </Card>
      </div>

      {/* ── DEPARTMENT CARDS GRID (3 COLUMNS) ── */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {departmentStats.map((dept) => {
          const initials = dept.headName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2);

          return (
            <Card
              key={dept.department}
              className="rounded-3xl border border-border/70 p-6 bg-card shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
            >
              <div className="space-y-4">
                {/* Header: Name & Status */}
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xl font-headline font-extrabold text-foreground tracking-tight">
                    {dept.department}
                  </h3>
                  <Badge
                    variant="secondary"
                    className={`${dept.status === "Needs Attention"
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      } font-semibold px-3 py-1 rounded-full text-xs border-transparent`}
                  >
                    {dept.status}
                  </Badge>
                </div>

                {/* Head / Leader Info */}
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center border border-primary/20 shrink-0">
                    {initials}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Head:{" "}
                    <span className="font-semibold text-foreground">
                      {dept.headName}
                    </span>
                  </p>
                </div>

                {/* Stat Pills Row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="secondary"
                    className="bg-muted/70 text-foreground font-medium px-3 py-1 rounded-full text-xs border-transparent"
                  >
                    {dept.groupsCount} Groups
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-muted/70 text-foreground font-medium px-3 py-1 rounded-full text-xs border-transparent"
                  >
                    {dept.mentorsCount} Mentors
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-muted/70 text-foreground font-medium px-3 py-1 rounded-full text-xs border-transparent"
                  >
                    {dept.menteesCount} Mentees
                  </Badge>
                </div>

                {/* Completion Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">
                      Mentee completion
                    </span>
                    <span className="font-semibold text-foreground">
                      {dept.completionPct}%
                    </span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300"
                      style={{ width: `${dept.completionPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer Row */}
              <div className="border-t border-border/60 pt-3 mt-4 flex items-center justify-between text-xs">
                <span className="text-muted-foreground text-xs font-normal">
                  Oversight enabled
                </span>
                <button
                  onClick={() => {
                    setViewingDept(dept);
                    onSelectDepartment?.(dept.department);
                  }}
                  className="text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer transition-all"
                >
                  View department
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
                      {dev.clusterName || "General"}
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
        onOpenChange={(open) => !open && setViewingDept(null)}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6">
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
          <div className="grid grid-cols-3 gap-3 my-2">
            <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">
                Groups
              </p>
              <p className="text-lg font-black text-primary">
                {viewingDept?.groupsCount}
              </p>
            </div>
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Ministries under {viewingDept?.department} Department
            </h4>

            <div className="space-y-2.5">
              {viewingDept?.clusters.map((cluster: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-muted/20 border border-border/60 flex flex-col space-y-2 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center border border-primary/20">
                        {cluster.name[0]}
                      </div>
                      <h5 className="font-bold text-sm text-foreground">
                        {cluster.name}
                      </h5>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {cluster.menteesCount} mentees
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span>
                      {cluster.groupsCount} active groups • {cluster.mentorsCount}{" "}
                      mentors
                    </span>
                    <span className="font-semibold text-emerald-600">Active</span>
                  </div>
                </div>
              ))}
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
  canGenerateReport = false,
  departmentClusters = {},
  headDepartment = "Outreach",
  isSuperAdmin = false,
  isMinistryHead = false,
  isHeadOrAdmin = false,
  onViewDevotion,
}: {
  mentees: any[];
  groups: any[];
  devotions: C2SDevotionRecord[];
  workers: any[];
  canGenerateReport?: boolean;
  departmentClusters?: Record<string, { value: string; label: string }[]>;
  headDepartment?: string;
  isSuperAdmin?: boolean;
  isMinistryHead?: boolean;
  isHeadOrAdmin?: boolean;
  onViewDevotion?: (devotion: C2SDevotionRecord) => void;
}) => {
  const [selectedCluster, setSelectedCluster] = useState("all");

  const formattedDeptName = headDepartment
    ? headDepartment.charAt(0).toUpperCase() + headDepartment.slice(1).toLowerCase()
    : "Outreach";

  // Dynamic cluster options for the Ministry Head's department
  const clusterOptions = useMemo(() => {
    const deptKey =
      Object.keys(departmentClusters || {}).find(
        (k) => k.toLowerCase() === (headDepartment || "outreach").toLowerCase()
      ) || "OUTREACH";
    const baseList = (departmentClusters && departmentClusters[deptKey]) || [];
    const existingGroupNames = groups?.map((g) => g.name).filter(Boolean) || [];
    const customList = existingGroupNames
      .filter((name) => !baseList.some((b) => b.value.toLowerCase() === name.toLowerCase()))
      .map((name) => ({ value: name, label: name }));
    return [...baseList, ...customList];
  }, [departmentClusters, headDepartment, groups]);

  // Filter devotions by selected cluster
  const filteredDevotions = useMemo(() => {
    if (selectedCluster === "all") return devotions;
    const target = selectedCluster.toLowerCase().trim();
    return devotions.filter((d) => {
      const cluster = (d.clusterName || "").toLowerCase().trim();
      return (
        cluster.includes(target) ||
        cluster === target ||
        cluster.replace(/\s+/g, "").includes(target.replace(/\s+/g, ""))
      );
    });
  }, [devotions, selectedCluster]);

  // Filter groups by selected cluster
  const filteredGroups = useMemo(() => {
    if (selectedCluster === "all") return groups;
    const target = selectedCluster.toLowerCase().trim();
    return groups.filter((g) => {
      const name = (g.name || "").toLowerCase().trim();
      return name.includes(target) || name === target;
    });
  }, [groups, selectedCluster]);

  // Filter mentees by selected cluster
  const filteredMentees = useMemo(() => {
    if (selectedCluster === "all") return mentees;
    const target = selectedCluster.toLowerCase().trim();
    const groupIds = new Set(filteredGroups.map((g) => g.id));
    return mentees.filter((m) => {
      if (m.groupId && groupIds.has(m.groupId)) return true;
      const cluster = (m.clusterName || m.groupName || "").toLowerCase().trim();
      return cluster.includes(target) || cluster === target;
    });
  }, [mentees, filteredGroups, selectedCluster]);

  // Status breakdown data for Donut Chart
  const statusData = useMemo(() => {
    return [
      {
        name: "In Progress",
        value: filteredMentees.filter((m) => m.status === "In Progress").length,
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

  // Devotions count by cluster for Bar Chart
  const clusterDevotionsData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredDevotions.forEach((d) => {
      const c = d.clusterName || "Other";
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    }));
  }, [filteredDevotions]);

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
    () => filteredMentees.filter((m) => m.status === "In Progress").length,
    [filteredMentees]
  );
  const totalFinished = completed + dropped;
  const retentionRate =
    totalFinished > 0 ? Math.round((completed / totalFinished) * 100) : 0;

  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "CONNECT 2 SOULS - ANALYTICS SUMMARY REPORT\n";
    csvContent += `Generated Date,${format(new Date(), "yyyy-MM-dd HH:mm:ss")}\n`;
    csvContent += `Filtered Cluster,${selectedCluster === "all" ? `All ${formattedDeptName} Ministries` : selectedCluster}\n\n`;

    csvContent += "METRIC SUMMARY,VALUE\n";
    csvContent += `Total Devotions Logged,${filteredDevotions.length}\n`;
    csvContent += `Mentee Attendees Reached,${totalAttendeesReached}\n`;
    csvContent += `Mentee Retention Rate,${retentionRate}%\n`;
    csvContent += `Active Groups,${filteredGroups.length}\n`;
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
    link.setAttribute("download", `C2S_Analytics_Report_${format(new Date(), "yyyyMMdd")}.csv`);
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
            Connect 2 Souls Analytics
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time metric summary, retention rates, and cluster devotions tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Dynamic Cluster/Sub-Ministry Filter: Only shown for Ministry Head / Admin */}
          {(isSuperAdmin || isMinistryHead || isHeadOrAdmin) && (
            <Select
              value={selectedCluster}
              onValueChange={(val) => setSelectedCluster(val)}
            >
              <SelectTrigger className="w-full sm:w-[220px] bg-background text-xs font-semibold border border-border/80 rounded-xl h-9">
                <SelectValue placeholder={`All ${formattedDeptName} Ministries`} />
              </SelectTrigger>
              <SelectContent className="max-h-96 overflow-y-auto">
                <SelectItem value="all" className="text-xs font-bold text-primary">
                  All {formattedDeptName} Ministries
                </SelectItem>
                <SelectGroup>
                  <SelectLabel className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 my-1 rounded-sm">
                    {formattedDeptName.toUpperCase()} MINISTRIES
                  </SelectLabel>
                  {clusterOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value} className="text-xs pl-6 cursor-pointer">
                      • {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}

          {canGenerateReport && (
            <Button
              onClick={() => setIsReportDialogOpen(true)}
              className="shadow-sm font-semibold text-xs h-9 px-4 gap-2 rounded-xl"
            >
              <FileText className="h-4 w-4" />
              Generate Analytics Report
            </Button>
          )}
        </div>
      </div>

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
                {selectedCluster === "all"
                  ? `Across all ${formattedDeptName} clusters`
                  : `Cluster: ${selectedCluster}`}
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
              Cumulative session attendance
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">
              Mentee Retention Rate
            </CardDescription>
            <CardTitle className="text-3xl font-black text-green-600">
              {retentionRate}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-muted rounded-full h-1.5 mt-1">
              <div
                className="bg-green-500 h-1.5 rounded-full"
                style={{ width: `${retentionRate}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold tracking-wider">
              Active Groups / Clusters
            </CardDescription>
            <CardTitle className="text-3xl font-black text-blue-600">
              {filteredGroups.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {filteredMentees.length} total enrolled mentees
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Devotions by Cluster</CardTitle>
            <CardDescription>
              Volume of recorded devotion sessions per cluster group.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {clusterDevotionsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clusterDevotionsData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                  <YAxis stroke="#888888" fontSize={12} allowDecimals={false} />
                  <ReTooltip />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
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
              Overall distribution of mentoring progress.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
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
              {selectedCluster === "all"
                ? `Recent devotion sessions logged across ${formattedDeptName} Ministries.`
                : `Recent devotion sessions for ${selectedCluster}.`}
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
                      {dev.clusterName || "General"}
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

      {/* ── GENERATE REPORT DIALOG MODAL ── */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary font-medium text-xs rounded-full border-transparent">
                OFFICIAL C2S REPORT
              </Badge>
            </div>
            <DialogTitle className="text-2xl font-extrabold text-foreground tracking-tight mt-1">
              Connect 2 Souls Analytics Report
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Official summary report for devotions, groups, retention, and mentee progress.
            </DialogDescription>
          </DialogHeader>

          {/* Printable / Viewable Report Preview */}
          <div className="space-y-4 my-2 p-5 rounded-2xl bg-muted/20 border border-border/60">
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-foreground">
                  Ministry Analytics Overview
                </h3>
                <p className="text-xs text-muted-foreground">
                  Date: {format(new Date(), "MMMM dd, yyyy")}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
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
                  Active Groups / Mentees
                </p>
                <p className="text-xl font-black text-indigo-600">
                  {filteredGroups.length} / {filteredMentees.length}
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
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (tabParam) return tabParam;
    return isAdminUser ? "overview" : "devotions";
  });

  // Sync tab from URL query param (e.g. from sidebar sub-items click)
  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (currentTab) {
      if (currentTab === "overview" && isAdminUser) {
        setActiveTab("overview");
      } else if (["devotions", "groups", "analytics"].includes(currentTab)) {
        setActiveTab(currentTab);
      }
    } else if (isAdminUser && !tabParam) {
      setActiveTab("overview");
    }
  }, [searchParams, isAdminUser, tabParam]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    router.push(`/c2s?tab=${val}`);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClusterFilter, setSelectedClusterFilter] = useState("all");
  const [selectedManualFilter, setSelectedManualFilter] = useState("all");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");

  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Record<string, boolean>>({});
  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroupIds((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Dialog & Sheet states
  const [isDevotionSheetOpen, setIsDevotionSheetOpen] = useState(false);
  const [editingDevotion, setEditingDevotion] = useState<C2SDevotionRecord | null>(null);
  const [viewingDevotion, setViewingDevotion] = useState<C2SDevotionRecord | null>(null);

  const [isGroupSheetOpen, setIsGroupSheetOpen] = useState(false);
  const [isMenteeSheetOpen, setIsMenteeSheetOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [selectedMentee, setSelectedMentee] = useState<any | null>(null);

  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: "group" | "mentee" | "devotion";
    name: string;
  } | null>(null);

  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [selectedGroupClusterFilter, setSelectedGroupClusterFilter] = useState("all");

  // Filter groups: Mentor account sees only their own group(s), Ministry Head sees their department's groups, Admin sees all groups with filter options
  const displayedGroups = useMemo(() => {
    if (!groups) return [];

    let result = groups;

    // Role filtering:
    if (isMentorUser && workerProfile?.id) {
      // Mentor strictly only sees their own assigned group(s)
      result = groups.filter((g) => g.mentorId === workerProfile.id);
    } else if (isMinistryHeadUser && !isAdminUser) {
      // Ministry Head sees groups under their department
      const userMinistry = allMinistries?.find(
        (m: any) => m.id === workerProfile?.majorMinistryId || myMinistryIds?.includes(m.id)
      );
      const userDept = userMinistry?.department || (workerProfile as any)?.department || "Outreach";
      const myDeptClusters = (
        DEPARTMENT_CLUSTERS[userDept] ||
        DEPARTMENT_CLUSTERS["OUTREACH"] ||
        []
      ).map((c) => c.value.toLowerCase());

      const deptGroups = groups.filter((g) => {
        const gName = (g.name || "").toLowerCase();
        const mentor = workers?.find((w) => w.id === g.mentorId);
        const isMentorInDept = Boolean(
          mentor &&
          (mentor.majorMinistryId === workerProfile?.majorMinistryId ||
           (mentor.majorMinistryId && myMinistryIds?.includes(mentor.majorMinistryId)) ||
           mentor.id === workerProfile?.id)
        );
        return (
          myDeptClusters.some((c) => gName.includes(c) || c.includes(gName)) ||
          g.mentorId === workerProfile?.id ||
          isMentorInDept
        );
      });
      result = deptGroups.length > 0 ? deptGroups : groups;
    }

    // Sub-ministry Cluster filter for Ministry Head / Admin
    if (selectedGroupClusterFilter !== "all") {
      const filterLower = selectedGroupClusterFilter.toLowerCase();
      result = result.filter((g) => (g.name || "").toLowerCase().includes(filterLower));
    }

    // Keyword search filter (group name, mentor name, or mentee name)
    if (groupSearchQuery.trim()) {
      const q = groupSearchQuery.toLowerCase();
      result = result.filter((g) => {
        const gName = (g.name || "").toLowerCase();
        const mentor = workers?.find((w) => w.id === g.mentorId);
        const mName = mentor ? `${mentor.firstName} ${mentor.lastName}`.toLowerCase() : "";
        const groupMentees = mentees?.filter((m) => m.groupId === g.id) || [];
        const hasMatchingMentee = groupMentees.some((m) =>
          `${m.firstName} ${m.lastName}`.toLowerCase().includes(q)
        );
        return gName.includes(q) || mName.includes(q) || hasMatchingMentee;
      });
    }

    return result;
  }, [
    groups,
    isMentorUser,
    isMinistryHeadUser,
    isAdminUser,
    workerProfile,
    allMinistries,
    myMinistryIds,
    DEPARTMENT_CLUSTERS,
    selectedGroupClusterFilter,
    groupSearchQuery,
    mentees,
    workers,
  ]);

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

    return merged;
  }, [devotions, localDevotions]);

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
      await updateDevotionMutation.mutateAsync({
        id: editingDevotion.id,
        data,
      });
    } else {
      await createDevotionMutation.mutateAsync(data);
    }
    setIsDevotionSheetOpen(false);
    setEditingDevotion(null);
  };

  const handleSaveGroup = async (data: { name: string; mentorId: string; menteeIds: string[] }) => {
    try {
      let targetGroupId = selectedGroup?.id;
      const targetMentorId = data.mentorId || selectedGroup?.mentorId || workerProfile?.id || "";

      if (selectedGroup) {
        await updateGroupMutation.mutateAsync({
          id: selectedGroup.id,
          data: {
            name: data.name,
            mentorId: targetMentorId,
            menteeIds: data.menteeIds || [],
          },
        });
      } else {
        const createdGroup = await createGroupMutation.mutateAsync({
          name: data.name,
          mentorId: targetMentorId,
          menteeIds: data.menteeIds || [],
        });
        targetGroupId = createdGroup?.id;
      }

      // Sync all selected mentees to this group (preventing duplicates across multiple groups)
      if (targetGroupId) {
        const selectedIds = new Set(data.menteeIds || []);
        const previousMentees = mentees?.filter((m) => m.groupId === targetGroupId) || [];

        // 1. Assign selected mentees strictly to this group
        for (const mId of data.menteeIds || []) {
          const mentee = mentees?.find((m) => m.id === mId);
          if (mentee && (mentee.groupId !== targetGroupId || mentee.mentorId !== targetMentorId)) {
            await updateMenteeMutation.mutateAsync({
              id: mId,
              data: { groupId: targetGroupId, mentorId: targetMentorId },
            });
          }
        }

        // 2. Unassign mentees that were unchecked from this group
        for (const m of previousMentees) {
          if (!selectedIds.has(m.id)) {
            await updateMenteeMutation.mutateAsync({
              id: m.id,
              data: { groupId: "", mentorId: "" },
            });
          }
        }
      }

      setIsGroupSheetOpen(false);
      setSelectedGroup(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: "Could not save group.",
      });
    }
  };

  const handleSaveMentee = async (data: any) => {
    try {
      if (selectedMentee) {
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

  // Determine mentor's assigned cluster/group name
  const myAssignedGroup = groups?.find((g) => g.mentorId === workerProfile?.id);
  const mentorClusterLabel =
    myAssignedGroup?.name ||
    allMinistries?.find((m: any) => m.id === workerProfile?.majorMinistryId)?.name ||
    "Outreach Cluster 4";

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
              {isAdminUser ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/25 shadow-xs">
                  <Building2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Admin Mode • All Departments</span>
                </div>
              ) : isMinistryHeadUser ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 shadow-xs">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Ministry Head • {headDepartment} Department</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/25 shadow-xs">
                  <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Mentor • {mentorClusterLabel}</span>
                </div>
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
                mentees={mentees || []}
                workers={workers || []}
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
                  <Select
                    value={selectedDeptFilter}
                    onValueChange={(val) => {
                      setSelectedDeptFilter(val);
                      setSelectedClusterFilter(val);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[220px] bg-background text-xs font-semibold border border-border/80">
                      <SelectValue placeholder="All Departments & Ministries" />
                    </SelectTrigger>
                    <SelectContent className="max-h-96 overflow-y-auto">
                      <SelectItem value="all" className="text-xs font-bold text-primary">
                        All Departments & Ministries
                      </SelectItem>
                      {Object.entries(DEPARTMENT_CLUSTERS).map(([dept, items]) => {
                        const titleLabel = `${dept.charAt(0) + dept.slice(1).toLowerCase()} Department`;
                        return (
                          <SelectGroup key={dept}>
                            <SelectLabel className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 my-1 rounded-sm">
                              {titleLabel}
                            </SelectLabel>
                            {items.map((item) => (
                              <SelectItem key={item.value} value={item.value} className="text-xs pl-6 cursor-pointer">
                                • {item.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        );
                      })}
                    </SelectContent>
                  </Select>
                ) : isMinistryHeadUser ? (
                  <Select
                    value={selectedClusterFilter}
                    onValueChange={(val) => {
                      setSelectedClusterFilter(val);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[220px] bg-background text-xs font-semibold border border-border/80">
                      <SelectValue placeholder="All Ministries & Clusters" />
                    </SelectTrigger>
                    <SelectContent className="max-h-96 overflow-y-auto">
                      <SelectItem value="all" className="text-xs font-bold text-primary">
                        All Ministries & Clusters
                      </SelectItem>
                      <SelectGroup>
                        <SelectLabel className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 my-1 rounded-sm">
                          {headDepartment.toUpperCase()} MINISTRIES
                        </SelectLabel>
                        {activeClusterOptions.map((item) => (
                          <SelectItem key={item.value} value={item.value} className="text-xs pl-6 cursor-pointer">
                            • {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
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
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setEditingDevotion(record);
                                    setIsDevotionSheetOpen(true);
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Edit Record
                                </DropdownMenuItem>
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

          {/* ══════════════════ TAB 2: GROUPS & MENTEES ══════════════════ */}
          <TabsContent value="groups" className="space-y-6 mt-0">
            {/* Filter and Keyword Search Toolbar */}
            <div className="flex flex-col lg:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border border-border/60 shadow-sm">
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search group, mentor, or mentee..."
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

              {/* Filter controls & Action buttons */}
              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                {isAdminUser ? (
                  <Select
                    value={selectedGroupClusterFilter}
                    onValueChange={(val) => setSelectedGroupClusterFilter(val)}
                  >
                    <SelectTrigger className="w-full sm:w-[220px] bg-background text-xs font-semibold border border-border/80">
                      <SelectValue placeholder="All Departments & Ministries" />
                    </SelectTrigger>
                    <SelectContent className="max-h-96 overflow-y-auto">
                      <SelectItem value="all" className="text-xs font-bold text-primary">
                        All Departments & Ministries
                      </SelectItem>
                      {Object.entries(DEPARTMENT_CLUSTERS).map(([dept, items]) => {
                        const titleLabel = `${dept.charAt(0) + dept.slice(1).toLowerCase()} Department`;
                        return (
                          <SelectGroup key={dept}>
                            <SelectLabel className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 my-1 rounded-sm">
                              {titleLabel}
                            </SelectLabel>
                            {items.map((item) => (
                              <SelectItem key={item.value} value={item.value} className="text-xs pl-6 cursor-pointer">
                                • {item.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        );
                      })}
                    </SelectContent>
                  </Select>
                ) : isMinistryHeadUser ? (
                  <Select
                    value={selectedGroupClusterFilter}
                    onValueChange={(val) => setSelectedGroupClusterFilter(val)}
                  >
                    <SelectTrigger className="w-full sm:w-[220px] bg-background text-xs font-semibold border border-border/80">
                      <SelectValue placeholder="All Ministries & Clusters" />
                    </SelectTrigger>
                    <SelectContent className="max-h-96 overflow-y-auto">
                      <SelectItem value="all" className="text-xs font-bold text-primary">
                        All Ministries & Clusters
                      </SelectItem>
                      <SelectGroup>
                        <SelectLabel className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 my-1 rounded-sm">
                          {headDepartment.toUpperCase()} MINISTRIES
                        </SelectLabel>
                        {activeClusterOptions.map((item) => (
                          <SelectItem key={item.value} value={item.value} className="text-xs pl-6 cursor-pointer">
                            • {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                ) : null}

                {isHeadOrAdmin && (
                  <>
                    <Button
                      onClick={() => {
                        setSelectedGroup(null);
                        setIsGroupSheetOpen(true);
                      }}
                      size="sm"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Group
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedMentee(null);
                        setIsMenteeSheetOpen(true);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <UserPlus className="mr-2 h-4 w-4" /> Add Mentee
                    </Button>
                  </>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {displayedGroups?.map((group) => {
                  const mentor = getWorker(group.mentorId);
                  const groupMentees =
                    mentees?.filter((m) => m.groupId === group.id) || [];
                  const isExpanded = !!collapsedGroupIds[group.id];
                  const isCollapsed = !isExpanded;

                  return (
                    <div
                      key={group.id}
                      className="rounded-3xl border border-border/70 bg-card shadow-xs overflow-hidden transition-all p-5 sm:p-6 space-y-4"
                    >
                      {/* ── HEADER ROW ── */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          {/* Collapse / Expand Toggle Button */}
                          <button
                            onClick={() => toggleGroupCollapse(group.id)}
                            className="mt-0.5 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          >
                            {isCollapsed ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronUp className="h-5 w-5" />
                            )}
                          </button>

                          <div>
                            {/* Group Name & Inline Edit */}
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-headline font-extrabold text-foreground tracking-tight">
                                {group.name}
                              </h3>
                              <button
                                onClick={() => {
                                  setSelectedGroup(group);
                                  setIsGroupSheetOpen(true);
                                }}
                                className="text-muted-foreground/70 hover:text-primary transition-colors p-1"
                                title="Edit Group"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* Mentor Subtitle & Cluster */}
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">
                              Mentor:{" "}
                              <span className="text-foreground/90 font-semibold">
                                {mentor ? `${mentor.firstName} ${mentor.lastName}` : "Unassigned"}
                              </span>{" "}
                              • {group.name || "Brgy. 1"}
                            </p>
                          </div>
                        </div>

                        {/* Right Header Actions & Mentee Count Badge */}
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary font-medium px-3.5 py-1 rounded-full text-xs"
                          >
                            {groupMentees.length} mentees
                          </Badge>

                          <button
                            onClick={() =>
                              setItemToDelete({
                                id: group.id,
                                type: "group",
                                name: group.name,
                              })
                            }
                            className="text-muted-foreground/50 hover:text-destructive transition-colors p-1"
                            title="Delete Group"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* ── EXPANDED BODY ── */}
                      {!isCollapsed && (
                        <div className="space-y-3 pt-2">
                          {/* Table Header Labels */}
                          {groupMentees.length > 0 && (
                            <div className="grid grid-cols-12 gap-4 px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                              <div className="col-span-5 sm:col-span-4">NAME</div>
                              <div className="hidden sm:block sm:col-span-3 text-left">BARANGAY</div>
                              <div className="col-span-3 sm:col-span-2 text-center">STATUS</div>
                              <div className="col-span-3 sm:col-span-2 text-right sm:text-center">PROGRESS</div>
                              <div className="hidden sm:block sm:col-span-1"></div>
                            </div>
                          )}

                          {/* Mentee List Rows */}
                          <div className="space-y-2">
                            {groupMentees.length > 0 ? (
                              groupMentees.map((m) => {
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

                                const displayStatus = m.status || "Active";

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

                                    {/* Barangay / Cluster */}
                                    <div className="hidden sm:block sm:col-span-3 text-xs font-medium text-muted-foreground">
                                      {m.phone ? `Brgy. ${m.phone.slice(-1) || "1"}` : "Brgy. 1"}
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
                              <p className="text-xs text-muted-foreground italic py-3 text-center">
                                No mentees enrolled in this group yet.
                              </p>
                            )}
                          </div>

                          {/* Bottom Dashed Add Mentee Button */}
                          <button
                            onClick={() => {
                              setSelectedMentee({ groupId: group.id });
                              setIsMenteeSheetOpen(true);
                            }}
                            className="w-full border-2 border-dashed border-border/80 hover:border-primary/50 hover:bg-primary/5 rounded-2xl py-3 text-xs font-semibold text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-1.5 mt-3"
                          >
                            <PlusCircle className="h-4 w-4" /> Add Mentee to {group.name}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ══════════════════ TAB 3: ANALYTICS ══════════════════ */}
          <TabsContent value="analytics" className="mt-0">
            <C2SAnalytics
              mentees={mentees || []}
              groups={groups || []}
              devotions={allDevotions}
              workers={workers || []}
              canGenerateReport={canGenerateAnalyticsReport}
              departmentClusters={DEPARTMENT_CLUSTERS}
              headDepartment={headDepartment}
              isSuperAdmin={isAdminUser}
              isMinistryHead={isMinistryHeadUser}
              isHeadOrAdmin={isHeadOrAdmin}
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
            isMinistryHead={isMinistryHead}
            isSuperAdmin={isSuperAdmin}
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

      {/* ── Group Sheet ── */}
      <Sheet open={isGroupSheetOpen} onOpenChange={setIsGroupSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {selectedGroup ? "Edit C2S Group" : "Create C2S Group"}
            </SheetTitle>
            <SheetDescription>
              Groups represent clusters of mentees assigned to a mentor.
            </SheetDescription>
          </SheetHeader>
          <GroupForm
            group={selectedGroup}
            workers={workers || []}
            mentees={mentees || []}
            allGroups={groups || []}
            currentWorker={workerProfile}
            onSave={handleSaveGroup}
            canAssignMentor={canManageGroupAssignment}
          />
        </SheetContent>
      </Sheet>

      {/* ── Mentee Sheet ── */}
      <Sheet open={isMenteeSheetOpen} onOpenChange={setIsMenteeSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {selectedMentee?.id ? "Edit Mentee" : "Add Mentee"}
            </SheetTitle>
            <SheetDescription>
              Add a mentee to a Connect 2 Souls mentoring cluster.
            </SheetDescription>
          </SheetHeader>
          <MenteeForm
            mentee={selectedMentee}
            groups={groups || []}
            workers={workers || []}
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
