'use client';

import { useState } from 'react';
import {
    DEPARTMENTS,
    MINISTRY_DEPARTMENTS,
    type Department,
    type AdminWorker,
    getDepartmentOfWorker,
} from '@/lib/admin-data';

export interface TransferDepartmentResult {
    workerId: string;
    workerName: string;
    fromDepartment: Department;
    fromCluster: string;
    toDepartment: Department;
    toCluster: string;
    reason: string;
    menteeAction: 'retain' | 'reassign';
    effectiveDate: string;
}

interface Props {
    worker: AdminWorker;
    onClose: () => void;
    onConfirm: (result: TransferDepartmentResult) => void;
}

const DEPT_METADATA: Record<Department, { desc: string; color: string; bg: string }> = {
    Worship: {
        desc: 'Music, Production, Creative & Worship Teams',
        color: '#1b365d', // Navy Blue
        bg: '#1b365d',
    },
    Outreach: {
        desc: 'Community Clusters, Missions & Evangelism',
        color: '#df8b22', // Warm Golden Amber
        bg: '#df8b22',
    },
    Relationship: {
        desc: 'Fellowship, Demographics & Care Ministries',
        color: '#9e2a2b', // Crimson Red
        bg: '#9e2a2b',
    },
    Discipleship: {
        desc: 'Spiritual Formation, J12 & Growth Tracks',
        color: '#2e7d32', // Forest Green
        bg: '#2e7d32',
    },
    Administration: {
        desc: 'Operations, Facilities & Ministry Support',
        color: '#18181b', // Solid Black
        bg: '#18181b',
    },
};

export default function TransferDepartmentModal({ worker, onClose, onConfirm }: Props) {
    const currentDept = getDepartmentOfWorker(worker);
    const currentCluster = worker.cluster || worker.ministry || 'General';

    const [step, setStep] = useState<1 | 2>(1);
    const [targetDept, setTargetDept] = useState<Department>(() => {
        // Default to a different department if possible
        const other = DEPARTMENTS.find(d => d !== currentDept);
        return other || 'Worship';
    });
    const [targetCluster, setTargetCluster] = useState<string>(() => {
        const other = DEPARTMENTS.find(d => d !== currentDept) || 'Worship';
        return MINISTRY_DEPARTMENTS[other][0] || '';
    });
    const [reason, setReason] = useState<string>('');
    const [menteeAction, setMenteeAction] = useState<'retain' | 'reassign'>('reassign');
    const [effectiveDate, setEffectiveDate] = useState<string>(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touchedReason, setTouchedReason] = useState(false);

    function formatDisplayDate(dateStr: string) {
        if (!dateStr) return '—';
        try {
            const [y, m, d] = dateStr.split('-').map(Number);
            const dt = new Date(y, m - 1, d);
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const dd = String(dt.getDate()).padStart(2, '0');
            const yyyy = dt.getFullYear();
            const dayOfWeek = dt.toLocaleDateString('en-US', { weekday: 'long' });
            return `${mm}/${dd}/${yyyy} · ${dayOfWeek}`;
        } catch {
            return dateStr;
        }
    }

    // Get available clusters for the chosen target department
    const availableClusters = MINISTRY_DEPARTMENTS[targetDept] || [];

    function handleDeptChange(dept: Department) {
        setTargetDept(dept);
        const clusters = MINISTRY_DEPARTMENTS[dept] || [];
        // pick first cluster not identical to current if possible
        const defaultCluster = clusters.find(c => c !== currentCluster) || clusters[0] || '';
        setTargetCluster(defaultCluster);
    }

    const isSameAssignment = targetDept === currentDept && targetCluster === currentCluster;
    const isReasonValid = reason.trim().length > 0;
    const isDateValid = Boolean(effectiveDate);
    const canProceed = targetDept && targetCluster && !isSameAssignment && isReasonValid && isDateValid;

    function handleNext() {
        setTouchedReason(true);
        if (canProceed) {
            setStep(2);
        }
    }

    function handleFinalSubmit() {
        if (!isReasonValid) return;
        setIsSubmitting(true);
        setTimeout(() => {
            onConfirm({
                workerId: worker.id,
                workerName: worker.name,
                fromDepartment: currentDept,
                fromCluster: currentCluster,
                toDepartment: targetDept,
                toCluster: targetCluster,
                reason: reason.trim(),
                menteeAction,
                effectiveDate,
            });
            setIsSubmitting(false);
            onClose();
        }, 300);
    }

    return (
        <>
            <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto" onClick={onClose}>
                <div
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col my-auto border border-gray-100 overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* ── Header ── */}
                    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#ede9fe] text-[#5b50d6] flex items-center justify-center font-bold text-lg shrink-0">
                                ⇄
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 leading-tight">
                                    Transfer Department
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Reassign mentor or worker to another ministry department
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                            </svg>
                        </button>
                    </div>

                    {/* ── Stepper indicator ── */}
                    <div className="flex border-b border-gray-100 text-xs font-semibold bg-gray-50/50">
                        <button
                            onClick={() => setStep(1)}
                            className={`flex-1 py-2.5 px-4 text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${step === 1 ? 'border-[#5b50d6] text-[#5b50d6] bg-white' : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 1 ? 'bg-[#5b50d6] text-white' : 'bg-gray-200 text-gray-600'
                                }`}>1</span>
                            <span>1. Select Target Department</span>
                        </button>
                        <button
                            onClick={() => canProceed && setStep(2)}
                            disabled={!canProceed}
                            className={`flex-1 py-2.5 px-4 text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${step === 2 ? 'border-[#5b50d6] text-[#5b50d6] bg-white' : 'border-transparent text-gray-400 hover:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed'
                                }`}
                        >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 2 ? 'bg-[#5b50d6] text-white' : 'bg-gray-200 text-gray-600'
                                }`}>2</span>
                            <span>2. Review & Confirmation</span>
                        </button>
                    </div>

                    {/* ── Body ── */}
                    <div className="p-6 overflow-y-auto max-h-[calc(85vh-150px)] flex flex-col gap-5">
                        {/* Worker Identity Card */}
                        <div className="rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-4 bg-gray-50/60">
                            <div className="flex items-center gap-3 min-w-0">
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0 shadow-sm"
                                    style={{ background: worker.color }}
                                >
                                    {worker.initials}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-bold text-gray-900 text-sm truncate">{worker.name}</p>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ede9fe] text-[#5b50d6]">
                                            {worker.c2sRole ? worker.c2sRole.replace('_', ' ').toUpperCase() : 'WORKER'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 truncate mt-0.5">{worker.email}</p>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Assignment</p>
                                <div className="flex items-center gap-1.5 justify-end mt-1">
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-800 shadow-2xs">
                                        {currentDept}
                                    </span>
                                    <span className="text-gray-300">·</span>
                                    <span className="text-xs font-medium text-gray-600">
                                        {currentCluster}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ── STEP 1: CONFIGURATION ── */}
                        {step === 1 && (
                            <div className="flex flex-col gap-5">
                                {/* Target Department Selection */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                        Select Target Department <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {DEPARTMENTS.map(dept => {
                                            const meta = DEPT_METADATA[dept];
                                            const isSelected = targetDept === dept;
                                            const isCurrent = currentDept === dept;

                                            return (
                                                <button
                                                    key={dept}
                                                    type="button"
                                                    onClick={() => handleDeptChange(dept)}
                                                    style={{ backgroundColor: meta.bg }}
                                                    className={`p-4 rounded-2xl text-left transition-all relative flex flex-col justify-between text-white shadow-sm min-h-[96px] ${isSelected
                                                        ? 'ring-4 ring-[#5b50d6]/40 ring-offset-2 shadow-lg scale-[1.02]'
                                                        : 'opacity-85 hover:opacity-100 hover:shadow-md'
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between w-full mb-1.5">
                                                        <span className="text-base font-black tracking-tight drop-shadow-xs">{dept}</span>
                                                        <div className="flex items-center gap-1.5">
                                                            {isCurrent && (
                                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/30 text-white backdrop-blur-xs border border-white/20">
                                                                    Current
                                                                </span>
                                                            )}
                                                            {isSelected && (
                                                                <div className="w-5 h-5 rounded-full bg-white text-[#5b50d6] flex items-center justify-center font-black text-xs shadow-sm shrink-0">
                                                                    ✓
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-[11px] text-white/85 line-clamp-2 leading-relaxed">
                                                        {meta.desc}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Target Ministry / Cluster Selection */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Target Ministry / Cluster <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={targetCluster}
                                                onChange={e => setTargetCluster(e.target.value)}
                                                className="w-full appearance-none border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5b50d6] pr-8 text-gray-800 font-medium"
                                            >
                                                {availableClusters.map(c => (
                                                    <option key={c} value={c}>
                                                        {c} {c === currentCluster && targetDept === currentDept ? '(Current)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            <svg
                                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                            >
                                                <path d="M7 10l5 5 5-5z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Effective Date */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Effective Date <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={effectiveDate}
                                            onChange={e => setEffectiveDate(e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5b50d6] text-gray-800 font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Warning if selecting exact same department and cluster */}
                                {isSameAssignment && (
                                    <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                                        <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                        </svg>
                                        <span>
                                            Please select a different department or cluster than the mentor's current assignment.
                                        </span>
                                    </div>
                                )}

                                {/* Mentee Handling Options (for Mentors) */}
                                <div className="rounded-xl border border-gray-200 p-4 flex flex-col gap-3 bg-gray-50/40">
                                    <div>
                                        <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                            Mentees & Group Handling
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                            Specify how active mentees assigned to {worker.name} should be handled during this transfer.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <label
                                            className={`p-3 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-colors ${menteeAction === 'reassign'
                                                ? 'border-[#5b50d6] bg-[#f5f3ff]'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="menteeAction"
                                                checked={menteeAction === 'reassign'}
                                                onChange={() => setMenteeAction('reassign')}
                                                className="mt-0.5 text-[#5b50d6] focus:ring-[#5b50d6]"
                                            />
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">Reassign to Cluster Pool</p>
                                                <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                                                    Mentees remain in <span className="font-semibold">{currentCluster}</span> for reassignment by the coordinator to another mentor.
                                                </p>
                                            </div>
                                        </label>

                                        <label
                                            className={`p-3 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-colors ${menteeAction === 'retain'
                                                ? 'border-[#5b50d6] bg-[#f5f3ff]'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="menteeAction"
                                                checked={menteeAction === 'retain'}
                                                onChange={() => setMenteeAction('retain')}
                                                className="mt-0.5 text-[#5b50d6] focus:ring-[#5b50d6]"
                                            />
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">Transfer with Mentor</p>
                                                <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                                                    Keep current mentees under this mentor and transition their mentoring records to the new department.
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Reason for Transfer (Required) */}
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Reason for Transfer <span className="text-red-500">*</span>
                                        </label>

                                    </div>
                                    <textarea
                                        rows={3}
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                        onBlur={() => setTouchedReason(true)}
                                        placeholder="Enter the specific reason for transferring this mentor/worker to another department (e.g. ministry reassignment, relocation, leadership deployment)..."
                                        className={`w-full text-xs border rounded-xl p-3 focus:outline-none focus:ring-2 text-gray-800 transition-colors ${touchedReason && !isReasonValid
                                            ? 'border-red-300 bg-red-50/20 focus:ring-red-400'
                                            : 'border-gray-200 focus:ring-[#5b50d6]'
                                            }`}
                                    />
                                    {touchedReason && !isReasonValid && (
                                        <p className="text-[11px] font-medium text-red-500 flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                            </svg>
                                            Please provide a reason for the transfer before proceeding.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── STEP 2: REVIEW & CONFIRMATION ── */}
                        {step === 2 && (
                            <div className="flex flex-col gap-5">
                                {/* Visual Transfer Path Card */}
                                <div className="rounded-2xl border border-gray-200 p-5 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/40">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-4">
                                        Department Transfer Route
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-7 items-center gap-3 text-center">
                                        {/* Current Box */}
                                        <div
                                            className="sm:col-span-3 rounded-xl p-4 text-white shadow-sm"
                                            style={{ backgroundColor: DEPT_METADATA[currentDept]?.bg ?? '#1b365d' }}
                                        >
                                            <p className="text-[10px] font-bold text-white/70 uppercase">From</p>
                                            <p className="text-base font-extrabold text-white mt-1">{currentDept}</p>
                                            <p className="text-xs font-semibold text-white/80 mt-0.5">{currentCluster}</p>
                                        </div>

                                        {/* Arrow indicator */}
                                        <div className="sm:col-span-1 flex items-center justify-center">
                                            <div className="w-10 h-10 rounded-full bg-[#5b50d6] text-white flex items-center justify-center shadow-md">
                                                <svg className="w-5 h-5 rotate-90 sm:rotate-0" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Target Box */}
                                        <div
                                            className="sm:col-span-3 rounded-xl p-4 text-white shadow-md ring-2 ring-white/50"
                                            style={{ backgroundColor: DEPT_METADATA[targetDept]?.bg ?? '#1b365d' }}
                                        >
                                            <p className="text-[10px] font-bold text-white/70 uppercase">To</p>
                                            <p className="text-base font-extrabold text-white mt-1">{targetDept}</p>
                                            <p className="text-xs font-semibold text-white/80 mt-0.5">{targetCluster}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary Details Table */}
                                <div className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100 text-xs">
                                    <div className="flex justify-between px-4 py-2.5 bg-gray-50/70">
                                        <span className="font-medium text-gray-500">Worker / Mentor</span>
                                        <span className="font-bold text-gray-900">{worker.name}</span>
                                    </div>
                                    <div className="flex justify-between px-4 py-2.5">
                                        <span className="font-medium text-gray-500">Target Department</span>
                                        <span className="font-bold text-gray-900">{targetDept}</span>
                                    </div>
                                    <div className="flex justify-between px-4 py-2.5">
                                        <span className="font-medium text-gray-500">Target Cluster / Ministry</span>
                                        <span className="font-bold text-[#5b50d6]">{targetCluster}</span>
                                    </div>
                                    <div className="flex justify-between px-4 py-2.5">
                                        <span className="font-medium text-gray-500">Mentee Disposition</span>
                                        <span className="font-semibold text-gray-800">
                                            {menteeAction === 'retain' ? 'Retain with Mentor' : 'Reassign to Cluster Pool'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between px-4 py-2.5">
                                        <span className="font-medium text-gray-500">Reason for Transfer</span>
                                        <span className="font-bold text-gray-900 text-right max-w-xs">{reason}</span>
                                    </div>
                                    <div className="flex justify-between px-4 py-2.5">
                                        <span className="font-medium text-gray-500">Effective Date</span>
                                        <span className="font-semibold text-gray-800">{formatDisplayDate(effectiveDate)}</span>
                                    </div>
                                </div>

                                {/* Confirmation notice */}
                                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 leading-relaxed">
                                    <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                                    </svg>
                                    <div>
                                        <p className="font-bold">Administrative Action Confirmation</p>
                                        <p className="text-blue-800 mt-0.5">
                                            Executing this transfer will reassign <strong>{worker.name}</strong> to the <strong>{targetDept}</strong> department ({targetCluster}). A permanent audit record will be logged and the department metrics will update immediately.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Footer ── */}
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                        {step === 1 ? (
                            <>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={!canProceed}
                                    className="px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-[#5b50d6] hover:bg-[#4d42c4]"
                                >
                                    Next: Review Transfer →
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-5 py-2.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-white transition-colors"
                                >
                                    ← Back to Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={handleFinalSubmit}
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all bg-[#0b9b8a] hover:bg-[#098375] flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            <span>Processing Transfer...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                            </svg>
                                            <span>Confirm & Transfer Department</span>
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
