'use client';

import { useState, useRef, useEffect } from 'react';
import type { Mentee } from '@/lib/data';
import EndorseMenteeModal from './EndorseMenteeModal';
import TransferMenteeModal from './TransferMenteeModal';
import TransferToGroupModal from './TransferToGroupModal';

interface Props {
    mentee: Mentee;
    onClose: () => void;
    onSave?: (progress: number, currentModule: string, currentLesson: string, module: string, lesson: string) => void;
}

const MODULE_DEFINITIONS = [
    {
        id: 1, title: 'A Born Again Experience',
        lessons: [
            { id: 'l1', title: 'Fresh Start' },
            { id: 'l2', title: "Receiving God's Forgiveness" },
            { id: 'l3', title: 'Highly Favored' },
        ],
    },
    {
        id: 2, title: 'Life of a Winner',
        lessons: [
            { id: 'l4', title: 'The "I" That Matters Most' },
            { id: 'l5', title: 'Forgiveness: The Best Choice' },
            { id: 'l6', title: 'Walking in Victory' },
        ],
    },
    {
        id: 3, title: 'Walking in Great Faith',
        lessons: [
            { id: 'l7', title: 'Faith That Moves Mountains' },
            { id: 'l8', title: 'Trusting God Always' },
        ],
    },
    {
        id: 4, title: 'Marks of a True Follower of Jesus',
        lessons: [
            { id: 'l9', title: 'The Call to Discipleship' },
            { id: 'l10', title: 'Living the Great Commission' },
        ],
    },
];

const TRAININGS_LIST = ['CLDP 1', 'CLDP 2', 'CLDP 3', 'LIFE Movers', 'LIFE Ambassadors', 'LAMP', 'LW3H', 'C2S 101', 'ASP', 'KnOT'];
const ACTIVE_MENTEES_STORAGE_KEY = 'c2s_active_mentees';

function buildInitialModules(progress: number) {
    const allLessons = MODULE_DEFINITIONS.flatMap((m) => m.lessons);
    const completedCount = Math.min(
        allLessons.length,
        Math.max(0, Math.round((progress / 100) * allLessons.length))
    );
    let runningIdx = 0;
    return MODULE_DEFINITIONS.map((mod) => ({
        ...mod,
        lessons: mod.lessons.map((l) => {
            const done = runningIdx < completedCount;
            runningIdx += 1;
            return { ...l, done };
        }),
    }));
}

type ModuleState = ReturnType<typeof buildInitialModules>;

function getUnlockedFlatIndex(modules: ModuleState): number {
    let idx = 0;
    for (const mod of modules) {
        for (const lesson of mod.lessons) {
            if (!lesson.done) return idx;
            idx += 1;
        }
    }
    return Math.max(0, idx - 1);
}

function getLessonFlatIndex(modules: ModuleState, modId: number, lessonId: string): number {
    let idx = 0;
    for (const mod of modules) {
        for (const lesson of mod.lessons) {
            if (mod.id === modId && lesson.id === lessonId) return idx;
            idx += 1;
        }
    }
    return -1;
}

function calcProgress(modules: ModuleState): number {
    const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const doneLessons = modules.reduce((sum, m) => sum + m.lessons.filter((l) => l.done).length, 0);
    if (totalLessons === 0) return 0;
    return Math.round((doneLessons / totalLessons) * 100);
}

function currentModuleLabel(modules: ModuleState): string {
    const first = modules.find((m) => !m.lessons.every((l) => l.done));
    return first ? `Module ${first.id} — ${first.title}` : `Module 4 — ${MODULE_DEFINITIONS[3].title}`;
}

function currentLessonLabel(modules: ModuleState): string {
    for (const mod of modules) {
        for (let i = 0; i < mod.lessons.length; i++) {
            if (!mod.lessons[i].done) return `Lesson ${i + 1}: ${mod.lessons[i].title}`;
        }
    }
    const lastMod = MODULE_DEFINITIONS[MODULE_DEFINITIONS.length - 1];
    return `Lesson ${lastMod.lessons.length}: ${lastMod.lessons[lastMod.lessons.length - 1].title}`;
}

function resolveInitialSelection(mentee: Mentee, initialModules: ModuleState) {
    const unlockedFlatIdx = getUnlockedFlatIndex(initialModules);
    const modMatch = (mentee.currentModule || mentee.module || '').match(/Module\s*(\d+)/i);
    const parsedModId = modMatch ? Number(modMatch[1]) : 0;
    const lessonNumMatch = (mentee.currentLesson || mentee.lesson || '').match(/Lesson\s*(\d+)/i);
    const parsedLessonNum = lessonNumMatch ? Number(lessonNumMatch[1]) : 0;

    const matchedMod = initialModules.find((m) => m.id === parsedModId);
    if (matchedMod) {
        const lessonIdx = parsedLessonNum > 0 && parsedLessonNum <= matchedMod.lessons.length
            ? parsedLessonNum - 1
            : Math.max(0, matchedMod.lessons.findIndex((l) => !l.done));
        const picked = matchedMod.lessons[lessonIdx] ?? matchedMod.lessons[0];
        const flatIdx = getLessonFlatIndex(initialModules, matchedMod.id, picked.id);
        if (flatIdx >= 0 && flatIdx <= unlockedFlatIdx) {
            return {
                moduleId: matchedMod.id,
                moduleTitle: matchedMod.title,
                lessonId: picked.id,
                lessonTitle: picked.title,
                lessonNum: lessonIdx + 1,
            };
        }
    }

    for (const mod of initialModules) {
        const idx = mod.lessons.findIndex((l) => !l.done);
        if (idx >= 0) {
            return {
                moduleId: mod.id,
                moduleTitle: mod.title,
                lessonId: mod.lessons[idx].id,
                lessonTitle: mod.lessons[idx].title,
                lessonNum: idx + 1,
            };
        }
    }

    const fallbackMod = initialModules[0];
    return {
        moduleId: fallbackMod.id,
        moduleTitle: fallbackMod.title,
        lessonId: fallbackMod.lessons[0].id,
        lessonTitle: fallbackMod.lessons[0].title,
        lessonNum: 1,
    };
}

export default function DevotionalProgressModal({ mentee, onClose, onSave }: Props) {
    const [modules, setModules] = useState<ModuleState>(() => buildInitialModules(mentee.progress));
    const initialSelection = useRef(resolveInitialSelection(mentee, modules)).current;

    const [expandedModule, setExpandedModule] = useState<number>(initialSelection.moduleId);
    const [selectedLesson, setSelectedLesson] = useState(initialSelection);
    const [notes, setNotes] = useState(mentee.mentorNotes ?? '');
    const [selectedTrainings, setSelectedTrainings] = useState<string[]>(() =>
        (mentee.trainings ?? [])
            .filter((t) => t.year && t.year !== '—' && t.year !== '-')
            .map((t) => t.label)
    );
    const [showTrainingList, setShowTrainingList] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showEndorse, setShowEndorse] = useState(false);
    const [showTransfer, setShowTransfer] = useState(false);
    const [showTransferGroup, setShowTransferGroup] = useState(false);
    const [saved, setSaved] = useState(false);
    const [mobileTab, setMobileTab] = useState<'modules' | 'details'>('modules');

    const menuRef = useRef<HTMLDivElement>(null);
    const trainingRef = useRef<HTMLDivElement>(null);

    const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const completedLessons = modules.reduce((sum, m) => sum + m.lessons.filter((l) => l.done).length, 0);
    const pct = calcProgress(modules);

    // Keep left active module expanded to match the currently selected lesson
    useEffect(() => {
        setExpandedModule(selectedLesson.moduleId);
    }, [selectedLesson.moduleId]);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
            if (trainingRef.current && !trainingRef.current.contains(e.target as Node)) setShowTrainingList(false);
        }
        function keyHandler(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setShowMenu(false);
                setShowTrainingList(false);
            }
        }
        document.addEventListener('mousedown', handler);
        document.addEventListener('keydown', keyHandler);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('keydown', keyHandler);
        };
    }, []);

    function toggleLesson(modId: number, lessonId: string) {
        setModules((prev) => {
            const targetIdx = getLessonFlatIndex(prev, modId, lessonId);
            const currentUnlocked = getUnlockedFlatIndex(prev);
            if (targetIdx < 0 || targetIdx > currentUnlocked) return prev;

            const targetDone = prev
                .find((m) => m.id === modId)
                ?.lessons.find((l) => l.id === lessonId)?.done;

            let idx = 0;
            return prev.map((m) => ({
                ...m,
                lessons: m.lessons.map((l) => {
                    const currIdx = idx;
                    idx += 1;
                    if (currIdx === targetIdx) {
                        return { ...l, done: !targetDone };
                    }
                    // Unmarking a prior lesson locks/resets later lessons to keep progression strictly sequential
                    if (targetDone && currIdx > targetIdx) {
                        return { ...l, done: false };
                    }
                    return l;
                }),
            }));
        });
    }

    function addTraining(label: string) {
        setSelectedTrainings((prev) => (prev.includes(label) ? prev : [...prev, label]));
        setShowTrainingList(false);
    }

    function removeTraining(label: string) {
        setSelectedTrainings((prev) => prev.filter((item) => item !== label));
    }

    function handleSave() {
        const newProgress = calcProgress(modules);
        const newModule = currentModuleLabel(modules);
        const newLesson = currentLessonLabel(modules);
        const completedMods = modules.filter((m) => m.lessons.every((l) => l.done)).length;
        const moduleShort = `Module ${Math.min(completedMods + 1, 4)}`;
        const lessonShort = newLesson.split(':')[0];
        const currentYear = String(new Date().getFullYear());
        const updatedTrainings = TRAININGS_LIST.map((label) => ({
            label,
            year: selectedTrainings.includes(label)
                ? mentee.trainings?.find((t) => t.label === label && t.year !== '—')?.year || currentYear
                : '—',
        }));

        try {
            const stored: Mentee[] = JSON.parse(localStorage.getItem(ACTIVE_MENTEES_STORAGE_KEY) ?? '[]');
            const updated = stored.map((m) =>
                m.id === mentee.id
                    ? {
                        ...m,
                        progress: newProgress,
                        currentModule: newModule,
                        currentLesson: newLesson,
                        module: moduleShort,
                        lesson: lessonShort,
                        mentorNotes: notes,
                        trainings: updatedTrainings,
                    }
                    : m
            );
            localStorage.setItem(ACTIVE_MENTEES_STORAGE_KEY, JSON.stringify(updated));
        } catch { /* ignore */ }

        onSave?.(newProgress, newModule, newLesson, moduleShort, lessonShort);
        setSaved(true);
        setTimeout(() => { setSaved(false); onClose(); }, 900);
    }

    const activeModuleObj = modules.find((m) => m.id === selectedLesson.moduleId);
    const activeLessonObj = activeModuleObj?.lessons.find((l) => l.id === selectedLesson.lessonId);
    const isLessonCompleted = Boolean(activeLessonObj?.done);
    const unlockedFlatIndex = getUnlockedFlatIndex(modules);
    const selectedFlatIndex = getLessonFlatIndex(modules, selectedLesson.moduleId, selectedLesson.lessonId);
    const isSelectedLocked = selectedFlatIndex > unlockedFlatIndex;
    const availableTrainings = TRAININGS_LIST.filter((t) => !selectedTrainings.includes(t));

    // Compute starting flat index per module for sequential locking
    const moduleStartIndices = modules.reduce<number[]>((acc, mod, i) => {
        if (i === 0) return [0];
        return [...acc, acc[i - 1] + modules[i - 1].lessons.length];
    }, []);

    /* ── Shared: left module tree ── */
    const moduleTree = (
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none p-4 sm:p-5 space-y-2.5">
            {modules.map((mod, modIdx) => {
                const modDoneCount = mod.lessons.filter((l) => l.done).length;
                const allDone = modDoneCount === mod.lessons.length;
                const modStartIdx = moduleStartIndices[modIdx] ?? 0;
                const isModLocked = modStartIdx > unlockedFlatIndex;
                const isExpanded = expandedModule === mod.id;
                const hasSelectedLesson = selectedLesson.moduleId === mod.id;

                return (
                    <div
                        key={mod.id}
                        className={`rounded-xl border overflow-hidden transition-colors ${isModLocked
                            ? 'border-[#E2E8E5] dark:border-[#2A323D] bg-[#F8FAFC]/70 dark:bg-[#161B22]/70 opacity-75'
                            : 'border-[#E2E8E5] dark:border-[#2A323D] bg-[#F8FAFC] dark:bg-[#222933]'
                            }`}
                    >
                        <button
                            type="button"
                            onClick={() => setExpandedModule(isExpanded ? 0 : mod.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isExpanded || hasSelectedLesson
                                ? 'bg-[#F1F5F9] dark:bg-[#262E3A]'
                                : 'hover:bg-[#F1F5F9]/70 dark:hover:bg-[#262E3A]/60'
                                }`}
                        >
                            <span
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${allDone
                                    ? 'bg-[#0E5B52] text-white'
                                    : hasSelectedLesson
                                        ? 'bg-[#181F26] dark:bg-[#2A9D8F] text-white'
                                        : isModLocked
                                            ? 'bg-slate-200/80 dark:bg-[#2A323D] text-[#64748B] dark:text-[#9BA7B4]'
                                            : 'bg-[#181F26]/10 dark:bg-white/10 text-[#181F26] dark:text-[#E6EDF3]'
                                    }`}
                            >
                                {allDone ? (
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                ) : isModLocked ? (
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                                    </svg>
                                ) : mod.id}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-[10px] font-bold text-[#64748B] dark:text-[#9BA7B4] uppercase tracking-wider">Module {mod.id}</p>
                                    <span className="text-[10px] font-semibold text-[#64748B] dark:text-[#9BA7B4] shrink-0 tabular-nums">
                                        {modDoneCount}/{mod.lessons.length}
                                    </span>
                                </div>
                                <p className="text-sm font-semibold text-[#181F26] dark:text-[#E6EDF3] truncate">{mod.title}</p>
                            </div>
                            <svg
                                className={`w-4 h-4 text-[#64748B] dark:text-[#9BA7B4] shrink-0 transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`}
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path d="M7 10l5 5 5-5z" />
                            </svg>
                        </button>

                        {isExpanded && (
                            <div className="p-2 pt-1.5 flex flex-col gap-1.5 border-t border-[#E2E8E5] dark:border-[#2A323D] bg-white dark:bg-[#1A2026]">
                                {mod.lessons.map((lesson, li) => {
                                    const lessonFlatIdx = modStartIdx + li;
                                    const isLocked = lessonFlatIdx > unlockedFlatIndex;
                                    const isSelected = selectedLesson.lessonId === lesson.id;
                                    return (
                                        <button
                                            key={lesson.id}
                                            type="button"
                                            disabled={isLocked}
                                            title={isLocked ? 'Complete the previous lesson first to unlock' : undefined}
                                            onClick={() => {
                                                if (isLocked) return;
                                                setSelectedLesson({
                                                    moduleId: mod.id,
                                                    moduleTitle: mod.title,
                                                    lessonId: lesson.id,
                                                    lessonTitle: lesson.title,
                                                    lessonNum: li + 1,
                                                });
                                                setMobileTab('details');
                                            }}
                                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left border ${isLocked
                                                ? 'bg-[#F8FAFC]/60 dark:bg-[#161B22]/60 border-transparent text-[#94A3B8] dark:text-[#64748B] cursor-not-allowed opacity-70'
                                                : isSelected
                                                    ? 'bg-[#0E5B52]/10 dark:bg-[#2A9D8F]/15 border-[#0E5B52] dark:border-[#2A9D8F] text-[#181F26] dark:text-[#E6EDF3] font-semibold cursor-pointer'
                                                    : lesson.done
                                                        ? 'bg-[#0E5B52]/5 dark:bg-[#2A9D8F]/10 border-[#0E5B52]/20 dark:border-[#2A9D8F]/30 text-[#0E5B52] dark:text-[#5EEAD4] cursor-pointer'
                                                        : 'bg-white dark:bg-[#1A2026] border-transparent hover:bg-[#F8FAFC] dark:hover:bg-[#222933] text-[#181F26] dark:text-[#E6EDF3] cursor-pointer'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span
                                                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${lesson.done
                                                        ? 'bg-[#0E5B52] text-white'
                                                        : isLocked
                                                            ? 'text-[#94A3B8] dark:text-[#64748B]'
                                                            : isSelected
                                                                ? 'border-2 border-[#0E5B52] dark:border-[#2A9D8F]'
                                                                : 'border border-[#CBD5E1] dark:border-[#475569]'
                                                        }`}
                                                >
                                                    {lesson.done ? (
                                                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                        </svg>
                                                    ) : isLocked ? (
                                                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                                                        </svg>
                                                    ) : null}
                                                </span>
                                                <span className="truncate">
                                                    Lesson {li + 1}: {lesson.title}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    /* ── Shared: right detail panel ── */
    const detailPanel = (
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none p-5 sm:p-6 flex flex-col gap-4">
            {/* Lesson Header + Quick Actions Menu */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[#0E5B52] dark:text-[#5EEAD4] uppercase tracking-wider mb-1">
                        Module {selectedLesson.moduleId} · Lesson {selectedLesson.lessonNum}
                    </p>
                    <h3 className="text-lg sm:text-xl font-bold text-[#181F26] dark:text-[#E6EDF3] leading-snug">{selectedLesson.lessonTitle}</h3>
                    <p className="text-xs text-[#64748B] dark:text-[#9BA7B4] mt-0.5">{selectedLesson.moduleTitle}</p>
                </div>

                <div ref={menuRef} className="relative shrink-0 z-30">
                    <button
                        type="button"
                        data-action-menu-trigger="true"
                        aria-label="Mentee actions"
                        onClick={() => setShowMenu((v) => !v)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] dark:text-[#9BA7B4] hover:text-[#181F26] dark:hover:text-[#E6EDF3] hover:bg-[#F1F5F9] dark:hover:bg-[#222933] transition-colors cursor-pointer"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 top-full mt-1.5 bg-white dark:bg-[#1A2026] border border-[#E2E8E5] dark:border-[#2A323D] rounded-xl shadow-xl z-50 w-56 p-1.5">
                            {[
                                { icon: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />, label: 'Transfer to Another Mentor' },
                                { icon: <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />, label: 'Endorse as Worker' },
                                { icon: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />, label: 'Transfer to Group' },
                            ].map((item) => (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => {
                                        setShowMenu(false);
                                        if (item.label === 'Endorse as Worker') setShowEndorse(true);
                                        else if (item.label === 'Transfer to Another Mentor') setShowTransfer(true);
                                        else if (item.label === 'Transfer to Group') setShowTransferGroup(true);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#181F26] dark:text-[#E6EDF3] hover:bg-[#0E5B52]/10 hover:text-[#0E5B52] dark:hover:bg-[#2A9D8F]/15 dark:hover:text-[#5EEAD4] transition-colors text-left cursor-pointer"
                                >
                                    <svg className="w-4 h-4 text-[#64748B] dark:text-[#9BA7B4] shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{item.icon}</svg>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Lesson Status Header + Single-Check Mark Action */}
            <div className="rounded-xl border border-[#E2E8E5] dark:border-[#2A323D] bg-[#F8FAFC] dark:bg-[#222933] p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-5">
                    <div>
                        <p className="text-[10px] font-bold text-[#64748B] dark:text-[#9BA7B4] uppercase tracking-wider mb-1">Lesson Status</p>
                        <span
                            data-pill="true"
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${isLessonCompleted
                                ? 'bg-[#0E5B52]/10 text-[#0E5B52] border border-[#0E5B52]/20 dark:bg-[#2A9D8F]/15 dark:text-[#5EEAD4] dark:border-[#2A9D8F]/30'
                                : 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]'
                                }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${isLessonCompleted ? 'bg-[#0E5B52] dark:bg-[#5EEAD4]' : 'bg-[#D97706]'}`} />
                            {isLessonCompleted ? 'Completed' : 'In Progress'}
                        </span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-[#64748B] dark:text-[#9BA7B4] uppercase tracking-wider mb-1">Completion</p>
                        <p className="text-xs font-semibold text-[#181F26] dark:text-[#E6EDF3]">{isLessonCompleted ? 'Marked Done' : 'Pending'}</p>
                    </div>
                </div>

                <button
                    type="button"
                    data-confirm-modal-btn="true"
                    disabled={isSelectedLocked}
                    onClick={() => toggleLesson(selectedLesson.moduleId, selectedLesson.lessonId)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${isLessonCompleted
                        ? 'bg-white dark:bg-[#1A2026] border border-[#0E5B52]/40 dark:border-[#2A9D8F]/50 text-[#0E5B52] dark:text-[#5EEAD4] hover:bg-[#0E5B52]/5'
                        : 'bg-[#0E5B52] hover:bg-[#0A463F] dark:bg-[#0E5B52] dark:hover:bg-[#147468] text-white shadow-sm'
                        }`}
                >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    {isLessonCompleted ? 'Lesson Completed' : 'Mark Lesson Completed'}
                </button>
            </div>

            {/* Mentor Notes */}
            <div className="rounded-xl border border-[#E2E8E5] dark:border-[#2A323D] bg-[#F8FAFC] dark:bg-[#222933] p-4">
                <p className="text-[10px] font-bold text-[#64748B] dark:text-[#9BA7B4] uppercase tracking-wider mb-2">Mentor Notes</p>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Write observations, prayer requests, or follow-up notes..."
                    className="w-full text-sm text-[#181F26] dark:text-[#E6EDF3] placeholder:text-[#64748B]/70 bg-white dark:bg-[#1A2026] border border-[#E2E8E5] dark:border-[#2A323D] rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-[#0E5B52] leading-relaxed"
                />
            </div>

            {/* Attended Trainings (Clean Removable Pills) */}
            <div className="rounded-xl border border-[#E2E8E5] dark:border-[#2A323D] bg-[#F8FAFC] dark:bg-[#222933] p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold text-[#64748B] dark:text-[#9BA7B4] uppercase tracking-wider">Attended Trainings</p>
                    <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#9BA7B4]">{selectedTrainings.length} selected</span>
                </div>

                {selectedTrainings.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                        {selectedTrainings.map((t) => (
                            <span
                                key={t}
                                data-pill="true"
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#0E5B52]/10 text-[#0E5B52] border border-[#0E5B52]/20 dark:bg-[#2A9D8F]/15 dark:text-[#5EEAD4] dark:border-[#2A9D8F]/30"
                            >
                                <span>{t}</span>
                                <button
                                    type="button"
                                    data-confirm-modal-btn="true"
                                    onClick={() => removeTraining(t)}
                                    aria-label={`Remove ${t}`}
                                    className="p-0.5 rounded-full inline-flex items-center justify-center text-[#0E5B52] dark:text-[#5EEAD4] hover:bg-[#0E5B52]/15 dark:hover:bg-[#2A9D8F]/25 transition-colors cursor-pointer"
                                    style={{ background: 'transparent', border: 'none' }}
                                >
                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-[#64748B] dark:text-[#9BA7B4] italic">No trainings selected yet.</p>
                )}

                <div ref={trainingRef} className="relative z-40">
                    <button
                        type="button"
                        onClick={() => setShowTrainingList((v) => !v)}
                        disabled={availableTrainings.length === 0}
                        className="w-full flex items-center justify-between bg-white dark:bg-[#1A2026] border border-[#E2E8E5] dark:border-[#2A323D] hover:border-[#0E5B52] rounded-xl px-3.5 py-2 text-xs font-medium text-[#181F26] dark:text-[#E6EDF3] transition-colors disabled:opacity-60 cursor-pointer"
                    >
                        <span className="text-[#64748B] dark:text-[#9BA7B4]">
                            {availableTrainings.length === 0 ? 'All trainings selected' : '+ Add attended training...'}
                        </span>
                        <svg
                            className={`w-4 h-4 text-[#64748B] dark:text-[#9BA7B4] transition-transform duration-150 ${showTrainingList ? 'rotate-180' : ''}`}
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path d="M7 10l5 5 5-5z" />
                        </svg>
                    </button>
                    {showTrainingList && availableTrainings.length > 0 && (
                        <ul className="absolute z-50 bottom-full mb-1.5 left-0 right-0 bg-white dark:bg-[#1A2026] border border-[#E2E8E5] dark:border-[#2A323D] rounded-xl shadow-xl p-1.5 max-h-44 overflow-y-auto scrollbar-none">
                            {availableTrainings.map((t) => (
                                <li
                                    key={t}
                                    onClick={() => addTraining(t)}
                                    className="px-3 py-2 rounded-lg text-xs font-medium text-[#181F26] dark:text-[#E6EDF3] hover:bg-[#0E5B52]/10 hover:text-[#0E5B52] dark:hover:bg-[#2A9D8F]/15 dark:hover:text-[#5EEAD4] cursor-pointer transition-colors"
                                >
                                    {t}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );

    if (showEndorse) {
        return (
            <EndorseMenteeModal
                menteeName={mentee.name}
                onClose={() => setShowEndorse(false)}
                onConfirm={() => setShowEndorse(false)}
            />
        );
    }

    if (showTransfer) {
        return (
            <TransferMenteeModal
                menteeName={mentee.name}
                menteeInitials={mentee.initials}
                onClose={() => setShowTransfer(false)}
                onConfirm={() => setShowTransfer(false)}
            />
        );
    }

    if (showTransferGroup) {
        return (
            <TransferToGroupModal
                menteeName={mentee.name}
                menteeGender={mentee.gender}
                onClose={() => setShowTransferGroup(false)}
                onConfirm={() => setShowTransferGroup(false)}
            />
        );
    }

    return (
        <>
            <div className="fixed inset-0 z-[9999] bg-black/50" onClick={onClose} />
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4" onClick={onClose}>

                <div
                    className="bg-white dark:bg-[#1A2026] rounded-2xl border border-[#E2E8E5] dark:border-[#2A323D] shadow-2xl flex flex-col overflow-hidden w-full"
                    style={{ maxWidth: '58rem', maxHeight: '92dvh' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header: Mentee Name + Progress Bar */}
                    <div className="px-5 sm:px-7 py-4 border-b border-[#E2E8E5] dark:border-[#2A323D] bg-[#F8FAFC] dark:bg-[#161B22] flex flex-col gap-3 shrink-0">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-[#181F26] text-white font-bold text-sm flex items-center justify-center shrink-0">
                                    {mentee.initials}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-base sm:text-lg font-bold text-[#181F26] dark:text-[#E6EDF3] leading-tight truncate">
                                            {mentee.name}
                                        </h2>
                                        <span
                                            data-pill="true"
                                            className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#0E5B52]/10 text-[#0E5B52] dark:bg-[#2A9D8F]/15 dark:text-[#5EEAD4]"
                                        >
                                            {pct}% Complete
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#64748B] dark:text-[#9BA7B4] mt-0.5 truncate">
                                        Devotional Progress · {mentee.assignedGroup}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                data-confirm-modal-btn="true"
                                onClick={onClose}
                                aria-label="Close modal"
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] dark:text-[#9BA7B4] hover:text-[#181F26] dark:hover:text-[#E6EDF3] hover:bg-[#E2E8E5]/60 dark:hover:bg-[#222933] transition-colors shrink-0 cursor-pointer"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                            </button>
                        </div>

                        {/* Header Progress Bar */}
                        <div className="space-y-1">
                            <div className="w-full h-2 rounded-full bg-[#E2E8E5] dark:bg-[#2A323D] overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-300 bg-[#0E5B52] dark:bg-[#2A9D8F]"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-medium text-[#64748B] dark:text-[#9BA7B4]">
                                <span>Official Connect 2 Souls Devotional Manual</span>
                                <span className="tabular-nums">{completedLessons} of {totalLessons} lessons completed</span>
                            </div>
                        </div>
                    </div>

                    {/* Mobile tab switcher */}
                    <div className="sm:hidden flex border-b border-[#E2E8E5] dark:border-[#2A323D] bg-white dark:bg-[#1A2026] shrink-0">
                        <button
                            type="button"
                            onClick={() => setMobileTab('modules')}
                            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${mobileTab === 'modules' ? 'text-[#0E5B52] dark:text-[#5EEAD4] border-b-2 border-[#0E5B52] dark:border-[#5EEAD4]' : 'text-[#64748B] dark:text-[#9BA7B4]'
                                }`}
                        >
                            Modules
                        </button>
                        <button
                            type="button"
                            onClick={() => setMobileTab('details')}
                            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${mobileTab === 'details' ? 'text-[#0E5B52] dark:text-[#5EEAD4] border-b-2 border-[#0E5B52] dark:border-[#5EEAD4]' : 'text-[#64748B] dark:text-[#9BA7B4]'
                                }`}
                        >
                            Lesson Details
                        </button>
                    </div>

                    {/* Mobile body */}
                    <div className="sm:hidden flex flex-col flex-1 min-h-0 overflow-hidden bg-white dark:bg-[#1A2026]">
                        {mobileTab === 'modules' ? moduleTree : detailPanel}
                    </div>

                    {/* Desktop body: two independent panes */}
                    <div className="hidden sm:flex flex-1 min-h-0 overflow-hidden bg-white dark:bg-[#1A2026]">
                        <div className="w-[42%] min-w-0 border-r border-[#E2E8E5] dark:border-[#2A323D] flex flex-col min-h-0">
                            {moduleTree}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col min-h-0">
                            {detailPanel}
                        </div>
                    </div>

                    {/* Footer: Single Save Changes CTA on bottom-right */}
                    <div className="px-5 sm:px-7 py-3.5 border-t border-[#E2E8E5] dark:border-[#2A323D] bg-[#F8FAFC] dark:bg-[#161B22] flex items-center justify-end shrink-0">
                        <button
                            type="button"
                            data-confirm-modal-btn="true"
                            onClick={handleSave}
                            className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-[#0E5B52] hover:bg-[#0A463F] dark:bg-[#0E5B52] dark:hover:bg-[#147468] px-6 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer"
                        >
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                            {saved ? 'Saved!' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
