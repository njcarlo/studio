'use client';

import { useState } from 'react';
import type { C2SGroup } from '@/lib/data';
import { submitC2SJoinRequest } from '@/actions/c2s';

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

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!agreed || submitting) return;

        setSubmitting(true);
        setError('');

        // Goes through the approval engine: the request lands in the group
        // mentor's inbox and becomes a mentee once approved.
        const result = await submitC2SJoinRequest({
            groupId: group.id,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone: phone.trim() || undefined,
            message: notes.trim() || undefined,
            birthday: birthday ? new Date(birthday) : undefined,
            gender: gender || undefined,
            socialMediaLink: facebook.trim() || undefined,
            firstAttendedMonth: attendedMonth || undefined,
            firstAttendedYear: attendedYear ? Number(attendedYear) : undefined,
            privacyAccepted: agreed,
        });

        setSubmitting(false);

        if (!result.success) {
            setError(result.error);
            return;
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
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-light leading-none z-10"
                    aria-label="Close"
                >×</button>

                <form onSubmit={handleSubmit} className="p-7">
                    {/* Header */}
                    <h2 className="text-xl font-black text-gray-900 mb-1">Sign Up</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        You&apos;re signing up for{' '}
                        <span style={{ color: '#e91e8c' }} className="font-semibold">{group.name}</span>
                        {' '}in {group.location}.
                    </p>

                    {/* First Name + Last Name */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                First Name <span className="text-[#e91e8c]">*</span>
                            </label>
                            <input required type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name <span className="text-[#e91e8c]">*</span>
                            </label>
                            <input required type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be]" />
                        </div>
                    </div>

                    {/* Email + Phone */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address <span className="text-[#e91e8c]">*</span>
                            </label>
                            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number <span className="text-[#e91e8c]">*</span>
                            </label>
                            <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be]" />
                        </div>
                    </div>

                    {/* Birthday + Gender */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Birthday <span className="text-[#e91e8c]">*</span>
                            </label>
                            <input required type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be] text-gray-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Gender <span className="text-[#e91e8c]">*</span>
                            </label>
                            <div className="relative">
                                <select required value={gender} onChange={(e) => setGender(e.target.value)}
                                    className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be] bg-white pr-8 text-gray-500">
                                    <option value="" disabled>Select</option>
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Prefer not to say</option>
                                </select>
                                <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Facebook Link */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Link</label>
                        <input type="text" placeholder="Facebook URL" value={facebook} onChange={(e) => setFacebook(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be] placeholder:text-gray-300" />
                    </div>

                    {/* First Time Attended */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            First Time Attended Church Of God (Month &amp; Year)
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <select value={attendedMonth} onChange={(e) => setAttendedMonth(e.target.value)}
                                    className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be] bg-white pr-8 text-gray-500">
                                    <option value="">Select Month</option>
                                    {MONTHS.map((m) => <option key={m}>{m}</option>)}
                                </select>
                                <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                            <div className="relative">
                                <select value={attendedYear} onChange={(e) => setAttendedYear(e.target.value)}
                                    className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be] bg-white pr-8 text-gray-500">
                                    <option value="">Select Year</option>
                                    {YEARS.map((y) => <option key={y}>{y}</option>)}
                                </select>
                                <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Questions</label>
                        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dc7be] resize-none" />
                    </div>

                    {/* Privacy checkbox */}
                    <div className="flex items-start gap-2.5 mb-6 bg-gray-50 p-3 rounded-xl">
                        <input id="join-privacy" type="checkbox" checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="mt-0.5 w-4 h-4 accent-[#e91e8c] cursor-pointer shrink-0" />
                        <label htmlFor="join-privacy" className="text-xs text-gray-600 cursor-pointer">
                            I agree to the{' '}
                            <span className="text-[#e91e8c] underline">Data privacy Policy</span>
                            {' '}of Church of God Dasmariñas.
                        </label>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose}
                            className="px-6 py-2.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={!agreed || submitting}
                            className="px-8 py-2.5 rounded-full text-sm font-bold text-white transition-colors"
                            style={{
                                background: agreed && !submitting ? '#e91e8c' : '#f0a0cc',
                                cursor: agreed && !submitting ? 'pointer' : 'not-allowed',
                            }}>
                            {submitting ? 'Sending…' : 'Sign Up'}
                        </button>
                    </div>
                    {error && (
                        <p className="mt-3 text-right text-xs font-semibold text-[#e6184d]">{error}</p>
                    )}
                </form>
            </div>
        </div>
    );
}
