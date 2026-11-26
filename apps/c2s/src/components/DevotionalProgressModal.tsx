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
    const completedModules = Math.floor(progress / 25);
    return MODULE_DEFINITIONS.map((mod) => ({
        ...mod,
        lessons: mod.lessons.map((l) => ({ ...l, done: mod.id <= completedModules })),
    }));
}

type ModuleState = ReturnType<typeof buildInitialModules>;

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
        return {
            moduleId: matchedMod.id,
            moduleTitle: matchedMod.title,
            lessonId: picked.id,
            lessonTitle: picked.title,
            lessonNum: lessonIdx + 1,
        };
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
        setModules((prev) =>
            prev.map((m) =>
                m.id === modId
                    ? { ...m, lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, done: !l.done } : l)) }
                    : m
            )
        );
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
    const availableTrainings = TRAININGS_LIST.filter((t) => !selectedTrainings.includes(t));

    /* ── Shared: left module tree ── */
    const moduleTree = (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-2.5">
            {modules.map((mod) => {
                const modDoneCount = mod.lessons.filter((l) => l.done).length;
                const allDone = modDoneCount === mod.lessons.length;
                const isExpanded = expandedModule === mod.id;
                const hasSelectedLesson = selectedLesson.moduleId === mod.id;

                return (
                    <div key={mod.id} className="rounded-xl border border-[#E7E5E4] bg-[#FAF8F5] overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setExpandedModule(isExpanded ? 0 : mod.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isExpanded || hasSelectedLesson ? 'bg-[#F5F2EC]' : 'hover:bg-[#F5F2EC]/70'
                                }`}
                        >
                            <span
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${allDone
                                    ? 'bg-[#0F766E] text-white'
                                    : hasSelectedLesson
                                        ? 'bg-[#D97706] text-white'
                                        : 'bg-[#1B2432]/10 text-[#1B2432]'
                                    }`}
                            >
                                {allDone ? '✓' : mod.id}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-[10px] font-bold text-[#6B665F] uppercase tracking-wider">Module {mod.id}</p>
                                    <span className="text-[10px] font-semibold text-[#6B665F] shrink-0">
                                        {modDoneCount}/{mod.lessons.length}
                                    </span>
                                </div>
                                <p className="text-sm font-semibold text-[#1B2432] truncate">{mod.title}</p>
                            </div>
                            <svg
                                className={`w-4 h-4 text-[#6B665F] shrink-0 transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`}
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path d="M7 10l5 5 5-5z" />
                            </svg>
                        </button>

                        {isExpanded && (
                            <div className="p-2 pt-1.5 flex flex-col gap-1.5 border-t border-[#E7E5E4] bg-white">
                                {mod.lessons.map((lesson, li) => {
                                    const isSelected = selectedLesson.lessonId === lesson.id;
                                    return (
                                        <button
                                            key={lesson.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedLesson({
                                                    moduleId: mod.id,
                                                    moduleTitle: mod.title,
                                                    lessonId: lesson.id,
                                                    lessonTitle: lesson.title,
                                                    lessonNum: li + 1,
                                                });
                                                setMobileTab('details');
                                            }}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left border ${isSelected
                                                ? 'bg-[#FEF3C7]/70 border-[#D97706] text-[#1B2432]'
                                                : lesson.done
                                                    ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                                                    : 'bg-white border-transparent hover:bg-[#FAF8F5] text-[#292524]'
                                                }`}
                                        >
                                            <span
                                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${lesson.done
                                                    ? 'bg-[#0F766E] text-white'
                                                    : isSelected
                                                        ? 'border-2 border-[#D97706] text-[#D97706]'
                                                        : 'border border-[#D6D3D1] text-transparent'
                                                    }`}
                                            >
                                                {lesson.done ? '✓' : ''}
                                            </span>
                                            <span className="truncate">
                                                Lesson {li + 1}: {lesson.title}
                                            </span>
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
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 flex flex-col gap-5">
            {/* Lesson Header + Quick Actions Menu */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[#D97706] uppercase tracking-wider mb-1">
                        Module {selectedLesson.moduleId} · Lesson {selectedLesson.lessonNum}
                    </p>
                    <h3 className="text-lg sm:text-xl font-bold text-[#1B2432] leading-snug">{selectedLesson.lessonTitle}</h3>
                    <p className="text-xs text-[#6B665F] mt-0.5">{selectedLesson.moduleTitle}</p>
                </div>

                <div ref={menuRef} className="relative shrink-0 z-30">
                    <button
                        type="button"
                        aria-label="Mentee actions"
                        onClick={() => setShowMenu((v) => !v)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B665F] hover:text-[#1B2432] hover:bg-[#F5F2EC] transition-colors"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 top-full mt-1.5 bg-white border border-[#E7E5E4] rounded-xl shadow-xl z-50 w-56 p-1.5">
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
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#292524] hover:bg-[#FEF3C7]/70 transition-colors text-left"
                                >
                                    <svg className="w-4 h-4 text-[#6B665F] shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{item.icon}</svg>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Lesson Status Header + Mark Lesson Completed Action */}
            <div className="rounded-xl border border-[#E7E5E4] bg-[#F5F2EC] p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4">
                    <div>
                        <p className="text-[10px] font-bold text-[#6B665F] uppercase tracking-wider mb-1">Lesson Status</p>
                        <span
                            data-pill="true"
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${isLessonCompleted
                                ? 'bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]'
                                : 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]'
                                }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${isLessonCompleted ? 'bg-[#0F766E]' : 'bg-[#D97706]'}`} />
                            {isLessonCompleted ? 'Completed' : 'In Progress'}
                        </span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-[#6B665F] uppercase tracking-wider mb-1">Completion</p>
                        <p className="text-xs font-semibold text-[#1B2432]">{isLessonCompleted ? 'Marked Done' : 'Pending'}</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => toggleLesson(selectedLesson.moduleId, selectedLesson.lessonId)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${isLessonCompleted
                        ? 'bg-white border border-[#0F766E]/40 text-[#0F766E] hover:bg-[#ECFDF5]'
                        : 'bg-[#0F766E] hover:bg-[#0D5F58] text-white shadow-sm'
                        }`}
                >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    {isLessonCompleted ? 'Lesson Completed ✓' : 'Mark Lesson Completed'}
                </button>
            </div>

            {/* Mentor Notes */}
            <div className="rounded-xl border border-[#E7E5E4] bg-[#F5F2EC] p-4">
                <p className="text-[10px] font-bold text-[#6B665F] uppercase tracking-wider mb-2">Mentor Notes</p>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Write observations, prayer requests, or follow-up notes..."
                    className="w-full text-sm text-[#292524] placeholder:text-[#6B665F]/70 bg-white border border-[#E7E5E4] rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#FEF3C7] leading-relaxed"
                />
            </div>

            {/* Attended Trainings (Removable Pills + Unclipped Picker) */}
            <div className="rounded-xl border border-[#E7E5E4] bg-[#F5F2EC] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold text-[#6B665F] uppercase tracking-wider">Attended Trainings</p>
                    <span className="text-[11px] font-semibold text-[#6B665F]">{selectedTrainings.length} selected</span>
                </div>

                {selectedTrainings.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                        {selectedTrainings.map((t) => (
                            <span
                                key={t}
                                data-pill="true"
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                            >
                                <span>{t}</span>
                                <button
                                    type="button"
                                    onClick={() => removeTraining(t)}
                                    aria-label={`Remove ${t}`}
                                    className="w-4 h-4 rounded-full inline-flex items-center justify-center hover:bg-[#F59E0B]/25 text-[#92400E] leading-none transition-colors"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-[#6B665F] italic">No trainings selected yet.</p>
                )}

                <div ref={trainingRef} className="relative z-40">
                    <button
                        type="button"
                        onClick={() => setShowTrainingList((v) => !v)}
                        disabled={availableTrainings.length === 0}
                        className="w-full flex items-center justify-between bg-white border border-[#E7E5E4] hover:border-[#D97706] rounded-xl px-3.5 py-2 text-xs font-medium text-[#292524] transition-colors disabled:opacity-60"
                    >
                        <span className="text-[#6B665F]">
                            {availableTrainings.length === 0 ? 'All trainings selected' : '+ Add attended training...'}
                        </span>
                        <svg
                            className={`w-4 h-4 text-[#6B665F] transition-transform duration-150 ${showTrainingList ? 'rotate-180' : ''}`}
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path d="M7 10l5 5 5-5z" />
                        </svg>
                    </button>
                    {showTrainingList && availableTrainings.length > 0 && (
                        <ul className="absolute z-50 bottom-full mb-1.5 left-0 right-0 bg-white border border-[#E7E5E4] rounded-xl shadow-xl p-1.5 max-h-44 overflow-y-auto">
                            {availableTrainings.map((t) => (
                                <li
                                    key={t}
                                    onClick={() => addTraining(t)}
                                    className="px-3 py-2 rounded-lg text-xs font-medium text-[#292524] hover:bg-[#FEF3C7] hover:text-[#92400E] cursor-pointer transition-colors"
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

    return (
        <>
            <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-[1px]" onClick={onClose} />
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4" onClick={onClose}>

                {showEndorse && (
                    <EndorseMenteeModal
                        menteeName={mentee.name}
                        onClose={() => setShowEndorse(false)}
                        onConfirm={() => setShowEndorse(false)}
                    />
                )}
                {showTransfer && (
                    <TransferMenteeModal
                        menteeName={mentee.name}
                        menteeInitials={mentee.initials}
                        onClose={() => setShowTransfer(false)}
                        onConfirm={() => setShowTransfer(false)}
                    />
                )}
                {showTransferGroup && (
                    <TransferToGroupModal
                        menteeName={mentee.name}
                        menteeGender={mentee.gender}
                        onClose={() => setShowTransferGroup(false)}
                        onConfirm={() => setShowTransferGroup(false)}
                    />
                )}

                <div
                    className="bg-white rounded-2xl border border-[#E7E5E4] shadow-2xl flex flex-col overflow-hidden w-full"
                    style={{ maxWidth: '56.25rem', minHeight: '28rem', height: 'min(45rem, 92dvh)', maxHeight: '92dvh' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header: Mentee Name + Progress Bar */}
                    <div className="px-5 sm:px-7 py-4 border-b border-[#E7E5E4] bg-[#FAF8F5] flex flex-col gap-3 shrink-0">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-[#D97706] text-white font-bold text-sm flex items-center justify-center shrink-0">
                                    {mentee.initials}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-base sm:text-lg font-bold text-[#1B2432] leading-tight truncate">
                                            {mentee.name}
                                        </h2>
                                        <span
                                            data-pill="true"
                                            className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]"
                                        >
                                            {pct}% Complete
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#6B665F] mt-0.5 truncate">
                                        Devotional Progress · {mentee.assignedGroup}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close modal"
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B665F] hover:text-[#1B2432] hover:bg-[#E7E5E4]/60 transition-colors shrink-0"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                            </button>
                        </div>

                        {/* Header Progress Bar */}
                        <div className="space-y-1">
                            <div className="w-full h-2 rounded-full bg-[#E7E5E4] overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                        width: `${pct}%`,
                                        background: pct === 100 ? '#0F766E' : '#D97706',
                                    }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-medium text-[#6B665F]">
                                <span>Official Connect 2 Souls Devotional Manual</span>
                                <span>{completedLessons} of {totalLessons} lessons completed</span>
                            </div>
                        </div>
                    </div>

                    {/* Mobile tab switcher */}
                    <div className="sm:hidden flex border-b border-[#E7E5E4] bg-white shrink-0">
                        <button
                            type="button"
                            onClick={() => setMobileTab('modules')}
                            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${mobileTab === 'modules' ? 'text-[#D97706] border-b-2 border-[#D97706]' : 'text-[#6B665F]'
                                }`}
                        >
                            Modules
                        </button>
                        <button
                            type="button"
                            onClick={() => setMobileTab('details')}
                            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${mobileTab === 'details' ? 'text-[#D97706] border-b-2 border-[#D97706]' : 'text-[#6B665F]'
                                }`}
                        >
                            Lesson Details
                        </button>
                    </div>

                    {/* Mobile body */}
                    <div className="sm:hidden flex flex-col flex-1 min-h-0 overflow-hidden bg-white">
                        {mobileTab === 'modules' ? moduleTree : detailPanel}
                    </div>

                    {/* Desktop body: two independent scrollable panes */}
                    <div className="hidden sm:flex flex-1 min-h-0 overflow-hidden bg-white">
                        <div className="w-[42%] min-w-0 border-r border-[#E7E5E4] flex flex-col min-h-0">
                            {moduleTree}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col min-h-0">
                            {detailPanel}
                        </div>
                    </div>

                    {/* Footer: Single Save Changes CTA on bottom-right */}
                    <div className="px-5 sm:px-7 py-3.5 border-t border-[#E7E5E4] bg-[#FAF8F5] flex items-center justify-end shrink-0">
                        <button
                            type="button"
                            onClick={handleSave}
                            className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-white px-6 py-2.5 rounded-xl transition-colors shadow-sm"
                            style={{ background: saved ? '#0F766E' : '#D97706' }}
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
