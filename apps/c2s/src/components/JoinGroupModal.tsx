'use client';

import CustomSelect from '@/components/CustomSelect';
import ModernDatePicker, { formatIsoDate, parseIsoDate } from '@/components/ModernDatePicker';
import { useState } from 'react';
import type { C2SGroup, PotentialMentee } from '@/lib/data';

const STORAGE_KEY = 'c2s_potential_mentees';

interface Props {
    group: C2SGroup;
    onClose: () => void;
    onSuccess: (groupName: string) => void;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => String(currentYear - i));

const DEFAULT_TRAININGS = [
    { label: 'CLDP 1', year: '—' }, { label: 'CLDP 2', year: '—' },
    { label: 'CLDP 3', year: '—' }, { label: 'LIFE Movers', year: '—' },
    { label: 'LIFE Ambassadors', year: '—' }, { label: 'LAMP', year: '—' },
    { label: 'LW3H', year: '—' }, { label: 'C2S 101', year: '—' },
    { label: 'ASP', year: '—' }, { label: 'KnOT', year: '—' },
];

export default function JoinGroupModal({ group, onClose, onSuccess }: Props) {
    const [agreed, setAgreed] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [birthday, setBirthday] = useState('');
    const [gender, setGender] = useState('');
    const [facebook, setFacebook] = useState('');
    const [attendedMonth, setAttendedMonth] = useState('');
    const [attendedYear, setAttendedYear] = useState('');
    const [notes, setNotes] = useState('');

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!agreed) return;

        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        const initials = `${firstName.trim()[0] ?? ''}${lastName.trim()[0] ?? ''}`.toUpperCase();

        // Calculate age and formatted display without UTC timezone drift
        let age = 0;
        let birthdayDisplay = '';
        const parsedBirth = birthday ? parseIsoDate(birthday) : null;
        if (parsedBirth) {
            const today = new Date();
            age = today.getFullYear() - parsedBirth.year;
            const m = (today.getMonth() + 1) - parsedBirth.month;
            if (m < 0 || (m === 0 && today.getDate() < parsedBirth.day)) age--;
            if (age < 0) age = 0;
            birthdayDisplay = `${String(parsedBirth.month).padStart(2, '0')}/${String(parsedBirth.day).padStart(2, '0')}/${parsedBirth.year}`;
        }

        const firstAttended = attendedMonth && attendedYear
            ? `${attendedMonth} ${attendedYear}`
            : '—';

        const newMentee: PotentialMentee = {
            id: `pm_${Date.now()}`,
            initials,
            name: fullName,
            age,
            gender,
            phone,
            source: 'From C2S Group Finder',
            sourceColor: 'bg-[#E0F2FE] text-[#0369A1]',
            requestedGroup: group.name,
            notes: notes.trim() || 'No notes provided.',
            status: 'Pending',
            email,
            birthday: birthdayDisplay,
            facebook: facebook.trim() || '—',
            firstAttended,
            progress: 0,
            currentModule: 'Module 1 — Foundations',
            currentLesson: 'Lesson 1: Who Am I in Christ',
            trainings: DEFAULT_TRAININGS,
        };

        // Persist to localStorage
        try {
            const existing: PotentialMentee[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
            existing.push(newMentee);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
        } catch {
            // localStorage unavailable — silently continue
        }

        onClose();
        onSuccess(group.name);
    }

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-light leading-none z-10 p-1"
                    aria-label="Close"
                >×</button>

                <form onSubmit={handleSubmit} className="p-5 sm:p-6">
                    {/* Header */}
                    <h2 className="text-xl font-black text-gray-900 mb-1">Sign Up</h2>
                    <p className="text-sm text-gray-500 mb-5">
                        You&apos;re signing up for{' '}
                        <span style={{ color: '#D97706' }} className="font-semibold">{group.name}</span>
                        {' '}in {group.location}.
                    </p>

                    {/* First Name + Last Name */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-5 mb-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                First Name <span className="text-[#D97706]">*</span>
                            </label>
                            <input required type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Last Name <span className="text-[#D97706]">*</span>
                            </label>
                            <input required type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]" />
                        </div>
                    </div>

                    {/* Email + Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address <span className="text-[#D97706]">*</span>
                            </label>
                            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number <span className="text-[#D97706]">*</span>
                            </label>
                            <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]" />
                        </div>
                    </div>

                    {/* Birthday + Gender */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                        <div>
                            <label htmlFor="join-group-birthday" className="block text-sm font-medium text-gray-700 mb-2">
                                Birthday <span className="text-[#0E5B52] dark:text-[#5EEAD4]">*</span>
                            </label>
                            <ModernDatePicker
                                id="join-group-birthday"
                                name="birthday"
                                value={birthday}
                                onChange={setBirthday}
                                placeholder="Select birthday"
                                max={formatIsoDate({
                                    year: new Date().getFullYear(),
                                    month: new Date().getMonth() + 1,
                                    day: new Date().getDate(),
                                })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Gender <span className="text-[#0E5B52] dark:text-[#5EEAD4]">*</span>
                            </label>
                            <CustomSelect required value={gender} onChange={(e) => setGender(e.target.value)} className="w-full">
                                <option value="" disabled>Select</option>
                                <option>Male</option>
                                <option>Female</option>
                                <option>Prefer not to say</option>
                            </CustomSelect>
                        </div>
                    </div>

                    {/* Facebook Link */}
                    <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Facebook Link</label>
                        <input type="text" placeholder="Facebook URL" value={facebook} onChange={(e) => setFacebook(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] placeholder:text-gray-300" />
                    </div>

                    {/* First Time Attended */}
                    <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Time Attended Church Of God (Month &amp; Year)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <CustomSelect value={attendedMonth} onChange={(e) => setAttendedMonth(e.target.value)} className="w-full">
                                <option value="">Select Month</option>
                                {MONTHS.map((m) => <option key={m}>{m}</option>)}
                            </CustomSelect>
                            <CustomSelect value={attendedYear} onChange={(e) => setAttendedYear(e.target.value)} className="w-full">
                                <option value="">Select Year</option>
                                {YEARS.map((y) => <option key={y}>{y}</option>)}
                            </CustomSelect>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes / Questions</label>
                        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E5B52]/25 focus:border-[#0E5B52] resize-none" />
                    </div>

                    {/* Privacy checkbox */}
                    <div className="flex items-start gap-3 mb-7 bg-[#F8FAFC] dark:bg-[#222933] p-4 rounded-xl border border-[#E2E8E5] dark:border-[#2A323D]">
                        <input id="join-privacy" type="checkbox" checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="mt-0.5 w-4 h-4 accent-[#0E5B52] cursor-pointer shrink-0 rounded" />
                        <label htmlFor="join-privacy" className="text-xs text-[#64748B] dark:text-[#9BA7B4] cursor-pointer">
                            I agree to the{' '}
                            <span className="text-[#0E5B52] dark:text-[#5EEAD4] font-semibold underline">Data privacy Policy</span>
                            {' '}of Church of God Dasmariñas.
                        </label>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3.5 pt-2">
                        <button type="button" onClick={onClose}
                            className="px-[1.375rem] py-[0.625rem] rounded-xl border border-[#E2E8E5] dark:border-[#2A323D] bg-white dark:bg-[#1A2026] text-sm font-bold text-[#181F26] dark:text-[#E6EDF3] hover:bg-gray-50 dark:hover:bg-[#222933] focus:outline-none focus:ring-4 focus:ring-[#0E5B52]/25 transition-colors cursor-pointer">
                            Cancel
                        </button>
                        <button type="submit" disabled={!agreed}
                            className="px-[1.375rem] py-[0.625rem] rounded-xl text-sm font-bold text-white bg-[#0E5B52] hover:bg-[#09423B] focus:outline-none focus:ring-4 focus:ring-[#0E5B52]/25 transition-all cursor-pointer disabled:bg-[#0E5B52] disabled:opacity-45 disabled:cursor-not-allowed">
                            Sign Up
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
