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
            { id: 'l9',  title: 'The Call to Discipleship' },
            { id: 'l10', title: 'Living the Great Commission' },
        ],
    },
];

const TRAININGS_LIST = ['CLDP 1','CLDP 2','CLDP 3','LIFE Movers','LIFE Ambassadors','LAMP','LW3H','C2S 101','ASP','KnOT'];
const ACTIVE_MENTEES_STORAGE_KEY = 'c2s_active_mentees';

/** Derive initial lesson-done state from mentee's stored progress (0–100) */
function buildInitialModules(progress: number) {
    // Each completed module = 25%. Determine how many modules are fully done.
    const completedModules = Math.floor(progress / 25);
    return MODULE_DEFINITIONS.map((mod) => ({
        ...mod,
        lessons: mod.lessons.map((l) => ({
            ...l,
            done: mod.id <= completedModules,
        })),
    }));
}

/** Calculate progress: each fully completed module contributes 25% */
function calcProgress(modules: typeof MODULES_INIT): number {
    const completed = modules.filter((m) => m.lessons.every((l) => l.done)).length;
    return completed * 25;
}

/** Get the label of the current (first incomplete) module */
function currentModuleLabel(modules: typeof MODULES_INIT): string {
    const first = modules.find((m) => !m.lessons.every((l) => l.done));
    return first ? `Module ${first.id} — ${first.title}` : `Module 4 — ${MODULE_DEFINITIONS[3].title}`;
}

/** Get the label of the current (first incomplete) lesson */
function currentLessonLabel(modules: typeof MODULES_INIT): string {
    for (const mod of modules) {
        for (let i = 0; i < mod.lessons.length; i++) {
            if (!mod.lessons[i].done) return `Lesson ${i + 1}: ${mod.lessons[i].title}`;
        }
    }
    return `Lesson ${MODULE_DEFINITIONS[3].lessons.length}: ${MODULE_DEFINITIONS[3].lessons[MODULE_DEFINITIONS[3].lessons.length - 1].title}`;
}

// type alias for the modules array
type ModuleState = ReturnType<typeof buildInitialModules>;
// keep a module-level reference for the type helper functions above
const MODULES_INIT = buildInitialModules(0);

export default function DevotionalProgressModal({ mentee, onClose, onSave }: Props) {
    const [expandedModule, setExpandedModule]       = useState<number>(1);
    const [selectedLesson, setSelectedLesson]       = useState({
        moduleId: 2, moduleTitle: 'Life of a Winner',
        lessonTitle: 'Forgiveness: The Best Choice', lessonNum: 2,
    });
    const [modules, setModules]                     = useState<ModuleState>(() => buildInitialModules(mentee.progress));
    const [status]                                  = useState<'In Progress' | 'Completed'>('In Progress');
    const [notes, setNotes]                         = useState(mentee.mentorNotes);
    const [selectedTraining, setSelectedTraining]   = useState('');
    const [showTrainingList, setShowTrainingList]   = useState(false);
    const [showMenu, setShowMenu]                   = useState(false);
    const [showEndorse, setShowEndorse]             = useState(false);
    const [showTransfer, setShowTransfer]           = useState(false);
    const [showTransferGroup, setShowTransferGroup] = useState(false);
    const [saved, setSaved]                         = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const pct = calcProgress(modules);

    // Close menu on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    function toggleLesson(modId: number, lessonId: string) {
        setModules(prev => prev.map(m =>
            m.id === modId
                ? { ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, done: !l.done } : l) }
                : m
        ));
    }

    function markModuleComplete() {
        setModules(prev => prev.map(m =>
            m.id === expandedModule ? { ...m, lessons: m.lessons.map(l => ({ ...l, done: true })) } : m
        ));
    }

    function handleSave() {
        const newProgress = calcProgress(modules);
        const newModule = currentModuleLabel(modules);
        const newLesson = currentLessonLabel(modules);

        // Determine module/lesson shorthand for the table column
        const completedCount = modules.filter((m) => m.lessons.every((l) => l.done)).length;
        const moduleShort = `Module ${Math.min(completedCount + 1, 4)}`;
        const lessonShort = newLesson.split(':')[0]; // e.g. "Lesson 2"

        // Persist updated progress into localStorage
        try {
            const stored: Mentee[] = JSON.parse(localStorage.getItem(ACTIVE_MENTEES_STORAGE_KEY) ?? '[]');
            const updated = stored.map((m) =>
                m.id === mentee.id
                    ? { ...m, progress: newProgress, currentModule: newModule, currentLesson: newLesson, module: moduleShort, lesson: lessonShort, mentorNotes: notes }
                    : m
            );
            localStorage.setItem(ACTIVE_MENTEES_STORAGE_KEY, JSON.stringify(updated));
        } catch { /* ignore */ }

        onSave?.(newProgress, newModule, newLesson, moduleShort, lessonShort);
        setSaved(true);
        setTimeout(() => { setSaved(false); onClose(); }, 900);
    }

    return (
        <>
            <div className="fixed inset-0 z-[100] bg-black/50" onClick={onClose} />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4" onClick={onClose}>

            {/* Sub-modals */}
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
                    className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    style={{ width: '860px', maxWidth: '95vw', height: '92vh', maxHeight: '680px' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-8 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between shrink-0">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Devotional Progress</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Official Connect 2 Souls Devotional Manual · {pct}% complete</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 transition-colors">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>

                    {/* Two-panel body */}
                    <div className="flex flex-1 overflow-hidden">

                        {/* ── Left: Module tree ── */}
                        <div className="w-[42%] border-r border-gray-100 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
                                {modules.map((mod) => {
                                    const allDone = mod.lessons.every(l => l.done);
                                    return (
                                        <div key={mod.id}>
                                            <button
                                                onClick={() => setExpandedModule(expandedModule === mod.id ? 0 : mod.id)}
                                                className="w-full flex items-center gap-3 px-4 py-3.5 bg-[#f8f9fc] hover:bg-[#f0effe] transition-colors rounded-xl"
                                            >
                                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                                    allDone ? 'bg-[#5b50d6] text-white' : 'bg-gray-200 text-gray-500'
                                                }`}>{mod.id}</span>
                                                <div className="flex-1 text-left">
                                                    <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">Module {mod.id}</p>
                                                    <p className="text-sm font-semibold text-gray-800">{mod.title}</p>
                                                </div>
                                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedModule === mod.id ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M7 10l5 5 5-5z"/>
                                                </svg>
                                            </button>

                                            {expandedModule === mod.id && (
                                                <div className="mt-1.5 flex flex-col gap-1 pl-3">
                                                    {mod.lessons.map((lesson, li) => (
                                                        <button
                                                            key={lesson.id}
                                                            onClick={() => {
                                                                toggleLesson(mod.id, lesson.id);
                                                                setSelectedLesson({ moduleId: mod.id, moduleTitle: mod.title, lessonTitle: lesson.title, lessonNum: li + 1 });
                                                            }}
                                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors text-left ${
                                                                lesson.done ? 'bg-[#f0fdf4] text-[#166534]' : 'bg-white hover:bg-[#f8f9fc] text-gray-700 border border-gray-100'
                                                            }`}
                                                        >
                                                            <svg className={`w-5 h-5 shrink-0 ${lesson.done ? 'text-[#22c55e]' : 'text-gray-300'}`} viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                                            </svg>
                                                            Lesson {li + 1}: {lesson.title}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Mark as Completed */}
                            <div className="px-5 py-4 border-t border-gray-100 shrink-0">
                                <button
                                    onClick={markModuleComplete}
                                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white rounded-xl transition-colors"
                                    style={{ background: '#5b50d6' }}
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                    Mark as Completed
                                </button>
                            </div>
                        </div>

                        {/* ── Right: Lesson detail ── */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto px-7 py-5 flex flex-col gap-5">

                                {/* Lesson header row */}
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
                                            Module {selectedLesson.moduleId} · Lesson {selectedLesson.lessonNum}
                                        </p>
                                        <h3 className="text-2xl font-semibold text-gray-900">{selectedLesson.lessonTitle}</h3>
                                    </div>

                                    {/* 3-dot menu */}
                                    <div ref={menuRef} className="relative ml-3 shrink-0">
                                        <button
                                            onClick={() => setShowMenu(!showMenu)}
                                            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                            </svg>
                                        </button>
                                        {showMenu && (
                                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-52 overflow-hidden">
                                                {[
                                                    { icon: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>, label: 'Transfer to Another Mentor' },
                                                    { icon: <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>, label: 'Endorse as Worker' },
                                                    { icon: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>, label: 'Transfer to Group' },
                                                ].map((item) => (
                                                    <button key={item.label}
                                                        onClick={() => {
                                                            setShowMenu(false);
                                                            if (item.label === 'Endorse as Worker') setShowEndorse(true);
                                                            else if (item.label === 'Transfer to Another Mentor') setShowTransfer(true);
                                                            else if (item.label === 'Transfer to Group') setShowTransferGroup(true);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-[#f0effe] transition-colors text-left">
                                                        <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">{item.icon}</svg>
                                                        {item.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Status row */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Current Status</p>
                                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                            status === 'In Progress' ? 'bg-[#fde8ef] text-[#e6184d]' : 'bg-[#dcfce7] text-[#166534]'
                                        }`}>{status}</span>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Completion Date</p>
                                        <p className="text-sm text-gray-400">——</p>
                                    </div>
                                </div>

                                {/* Mentor Notes */}
                                <div className="rounded-xl bg-[#f8f9fc] border border-gray-100 px-4 py-3">
                                    <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Mentor Notes</p>
                                    <textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        rows={3}
                                        className="w-full text-sm text-gray-700 bg-transparent resize-none focus:outline-none leading-relaxed"
                                    />
                                </div>

                                {/* Trainings */}
                                <div>
                                    <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Trainings</p>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowTrainingList(!showTrainingList)}
                                            className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 text-sm bg-[#f8f9fc] text-gray-400"
                                        >
                                            {selectedTraining || 'Choose an attended training....'}
                                            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                                        </button>
                                        {showTrainingList && (
                                            <ul className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 overflow-hidden">
                                                {TRAININGS_LIST.map(t => (
                                                    <li key={t}
                                                        onClick={() => { setSelectedTraining(t); setShowTrainingList(false); }}
                                                        className="px-4 py-3 text-sm text-gray-700 hover:bg-[#f0effe] cursor-pointer">
                                                        {t}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-7 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                                <button
                                    className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 border border-gray-200 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                                    Add Notes
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-1.5 text-sm font-semibold text-white px-6 py-2.5 rounded-xl transition-colors"
                                    style={{ background: saved ? '#22c55e' : '#5b50d6' }}
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                    {saved ? 'Saved!' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
