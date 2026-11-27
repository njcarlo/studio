'use client';

import CustomSelect from '@/components/CustomSelect';
import ModernDatePicker, { formatIsoDate, parseIsoDate } from '@/components/ModernDatePicker';
import { useState } from 'react';
import type { Mentee } from '@/lib/data';

interface Props {
    onClose: () => void;
    onSuccess: (mentee: Mentee) => void;
    defaultGroup?: string;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 40 }, (_, i) => String(currentYear - i));

const DEFAULT_TRAININGS = [
    { label: 'CLDP 1', year: '—' },
    { label: 'CLDP 2', year: '—' },
    { label: 'CLDP 3', year: '—' },
    { label: 'LIFE Movers', year: '—' },
    { label: 'LIFE Ambassadors', year: '—' },
    { label: 'LAMP', year: '—' },
    { label: 'LW3H', year: '—' },
    { label: 'C2S 101', year: '—' },
    { label: 'ASP', year: '—' },
    { label: 'KnOT', year: '—' },
];

export default function AddMenteeModal({ onClose, onSuccess, defaultGroup = 'Orchard Residences' }: Props) {
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
    const [agreed, setAgreed] = useState(false);

    // Track touched fields for inline validation display
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

    const markTouched = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    // Validation helpers
    const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

    const isFirstNameValid = firstName.trim().length > 0;
    const isLastNameValid = lastName.trim().length > 0;
    const isEmailFieldValid = email.trim().length > 0 && isValidEmail(email);
    const isPhoneValid = phone.trim().length > 0;
    const isBirthdayValid = birthday.trim().length > 0;
    const isGenderValid = gender.trim().length > 0;
    const isAttendedMonthValid = attendedMonth.trim().length > 0;
    const isAttendedYearValid = attendedYear.trim().length > 0;
    const isAttendedValid = isAttendedMonthValid && isAttendedYearValid;

    const isFormValid =
        isFirstNameValid &&
        isLastNameValid &&
        isEmailFieldValid &&
        isPhoneValid &&
        isBirthdayValid &&
        isGenderValid &&
        isAttendedValid &&
        agreed;

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isFormValid || isSubmitting) return;

        setIsSubmitting(true);

        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        const initials = `${firstName.trim()[0] ?? ''}${lastName.trim()[0] ?? ''}`.toUpperCase();

        // Calculate age and formatted display from location-agnostic calendar date (no UTC shift)
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

        const now = new Date();
        const connectedSince = now.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        const firstAttended = `${attendedMonth} ${attendedYear}`;

        const newMentee: Mentee & {
            firstName: string;
            lastName: string;
            phoneNumber: string;
            facebookLink: string;
            firstChurchAttendanceMonth: string;
            firstChurchAttendanceYear: string;
            notes: string;
            status: string;
        } = {
            id: `mentee_${Date.now()}`,
            initials,
            name: fullName,
            assignedGroup: defaultGroup,
            connectedSince,
            module: 'Module 1',
            lesson: 'Lesson 1',
            progress: 0,
            email: email.trim(),
            phone: phone.trim(),
            age,
            birthday: birthdayDisplay,
            gender,
            facebook: facebook.trim() || '—',
            firstAttended,
            currentModule: 'Module 1 — Foundations',
            currentLesson: 'Lesson 1: Fresh Start',
            mentorNotes: notes.trim() || 'No notes provided.',
            trainings: DEFAULT_TRAININGS,
            status: 'Active',
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phoneNumber: phone.trim(),
            facebookLink: facebook.trim(),
            firstChurchAttendanceMonth: attendedMonth,
            firstChurchAttendanceYear: attendedYear,
            notes: notes.trim(),
        };

        // Short loading state to provide visual confirmation
        setTimeout(() => {
            setIsSubmitting(false);
            onSuccess(newMentee);
            onClose();
        }, 600);
    }

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={(e) => {
                if (e.target !== e.currentTarget) return;
                if (showPrivacyPolicy) {
                    setShowPrivacyPolicy(false);
                    return;
                }
                if (!isSubmitting) onClose();
            }}
        >
            <div
                className={`bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200 ${showPrivacyPolicy ? 'hidden' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-light leading-none z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Close"
                >
                    ×
                </button>

                <form onSubmit={handleSubmit} className="p-5 sm:p-6">
                    {/* Header */}
                    <div className="mb-4">
                        <h2 className="text-xl font-black text-gray-900 mb-1.5">Add Mentee</h2>
                        <p className="text-sm text-gray-500">
                            Add a new mentee to your mentoring group.
                        </p>
                    </div>

                    {/* First Name + Last Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                First Name <span className="text-[#0E5B52] dark:text-[#5EEAD4]">*</span>
                            </label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                onBlur={() => markTouched('firstName')}
                                placeholder="Enter first name"
                                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
                                    touched.firstName && !isFirstNameValid
                                        ? 'border-red-400 focus:ring-red-400 bg-red-50/20'
                                        : 'border-gray-200 focus:ring-[#0E5B52]/25 focus:border-[#0E5B52]'
                                }`}
                            />
                            {touched.firstName && !isFirstNameValid && (
                                <p className="text-xs text-red-500 mt-1">First Name is required.</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name <span className="text-[#0E5B52] dark:text-[#5EEAD4]">*</span>
                            </label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                onBlur={() => markTouched('lastName')}
                                placeholder="Enter last name"
                                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
                                    touched.lastName && !isLastNameValid
                                        ? 'border-red-400 focus:ring-red-400 bg-red-50/20'
                                        : 'border-gray-200 focus:ring-[#0E5B52]/25 focus:border-[#0E5B52]'
                                }`}
                            />
                            {touched.lastName && !isLastNameValid && (
                                <p className="text-xs text-red-500 mt-1">Last Name is required.</p>
                            )}
                        </div>
                    </div>

                    {/* Email + Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address <span className="text-[#0E5B52] dark:text-[#5EEAD4]">*</span>
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={() => markTouched('email')}
                                placeholder="e.g. name@example.com"
                                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
                                    touched.email && !isEmailFieldValid
                                        ? 'border-red-400 focus:ring-red-400 bg-red-50/20'
                                        : 'border-gray-200 focus:ring-[#0E5B52]/25 focus:border-[#0E5B52]'
                                }`}
                            />
                            {touched.email && !isEmailFieldValid && (
                                <p className="text-xs text-red-500 mt-1">
                                    {email.trim().length === 0 ? 'Email Address is required.' : 'Please enter a valid email address.'}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number <span className="text-[#0E5B52] dark:text-[#5EEAD4]">*</span>
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                onBlur={() => markTouched('phone')}
                                placeholder="e.g. 0917 123 4567"
                                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
                                    touched.phone && !isPhoneValid
                                        ? 'border-red-400 focus:ring-red-400 bg-red-50/20'
                                        : 'border-gray-200 focus:ring-[#0E5B52]/25 focus:border-[#0E5B52]'
                                }`}
                            />
                            {touched.phone && !isPhoneValid && (
                                <p className="text-xs text-red-500 mt-1">Phone Number is required.</p>
                            )}
                        </div>
                    </div>

                    {/* Birthday + Gender */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="add-mentee-birthday" className="block text-sm font-medium text-gray-700 mb-1">
                                Birthday <span className="text-[#0E5B52] dark:text-[#5EEAD4]">*</span>
                            </label>
                            <ModernDatePicker
                                id="add-mentee-birthday"
                                name="birthday"
                                value={birthday}
                                onChange={setBirthday}
                                onBlur={() => markTouched('birthday')}
                                placeholder="Select birthday"
                                max={formatIsoDate({
                                    year: new Date().getFullYear(),
                                    month: new Date().getMonth() + 1,
                                    day: new Date().getDate(),
                                })}
                                hasError={Boolean(touched.birthday && !isBirthdayValid)}
                                required
                            />
                            {touched.birthday && !isBirthdayValid && (
                                <p className="text-xs text-red-500 mt-1">Birthday is required.</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Gender <span className="text-[#0E5B52] dark:text-[#5EEAD4]">*</span>
                            </label>
                            <CustomSelect
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                onBlur={() => markTouched('gender')}
                                className="w-full"
                            >
                                <option value="" disabled>Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </CustomSelect>
                            {touched.gender && !isGenderValid && (
                                <p className="text-xs text-red-500 mt-1">Please select a gender.</p>
                            )}
                        </div>
                    </div>

                    {/* Facebook Link */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Facebook Link
                        </label>
                        <input
                            type="text"
                            placeholder="Facebook URL"
                            value={facebook}
                            onChange={(e) => setFacebook(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E5B52]/25 focus:border-[#0E5B52] placeholder:text-gray-400 text-gray-800"
                        />
                    </div>

                    {/* First Time Attended Church Of God (Month & Year) */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            First Time Attended Church Of God (Month &amp; Year) <span className="text-[#0E5B52] dark:text-[#5EEAD4]">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <CustomSelect
                                value={attendedMonth}
                                onChange={(e) => setAttendedMonth(e.target.value)}
                                onBlur={() => markTouched('attendedMonth')}
                                className="w-full"
                            >
                                <option value="">Select Month</option>
                                {MONTHS.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </CustomSelect>
                            <CustomSelect
                                value={attendedYear}
                                onChange={(e) => setAttendedYear(e.target.value)}
                                onBlur={() => markTouched('attendedYear')}
                                className="w-full"
                            >
                                <option value="">Select Year</option>
                                {YEARS.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </CustomSelect>
                        </div>
                        {((touched.attendedMonth && !isAttendedMonthValid) || (touched.attendedYear && !isAttendedYearValid)) && (
                            <p className="text-xs text-red-500 mt-1">Please select a month and year.</p>
                        )}
                    </div>

                    {/* Notes / Questions */}
                    <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes / Questions
                        </label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any initial notes or questions about this mentee..."
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E5B52]/25 focus:border-[#0E5B52] resize-none text-gray-800 placeholder:text-gray-400"
                        />
                    </div>

                    {/* Privacy Agreement */}
                    <div className="mb-6">
                        <div className="flex items-start gap-2.5 bg-[#F8FAFC] dark:bg-[#222933] p-3.5 rounded-xl border border-[#E2E8E5] dark:border-[#2A323D]">
                            <input
                                id="add-mentee-privacy"
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => {
                                    setAgreed(e.target.checked);
                                    markTouched('agreed');
                                }}
                                className="mt-0.5 w-4 h-4 accent-[#0E5B52] cursor-pointer shrink-0 rounded"
                            />
                            <label htmlFor="add-mentee-privacy" className="text-xs text-[#64748B] dark:text-[#9BA7B4] cursor-pointer select-none leading-relaxed">
                                I agree to the{' '}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowPrivacyPolicy(true);
                                    }}
                                    className="text-[#0E5B52] dark:text-[#5EEAD4] font-semibold underline hover:opacity-80 transition-opacity cursor-pointer"
                                >
                                    Data privacy Policy
                                </button>
                                {' '}of Church of God Dasmariñas.
                            </label>
                        </div>
                        {touched.agreed && !agreed && (
                            <p className="text-xs text-red-500 mt-1.5 px-1">You must agree to the Data Privacy Policy.</p>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="h-[2.375rem] px-5 py-2 rounded-[0.625rem] border border-[#E2E8E5] dark:border-[#2A323D] bg-white dark:bg-[#1A2026] text-[0.8125rem] font-semibold text-[#181F26] dark:text-[#E6EDF3] hover:bg-[#F8FAFC] dark:hover:bg-[#222933] focus:outline-none focus:ring-4 focus:ring-[#0E5B52]/25 transition-colors disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer inline-flex items-center justify-center leading-none"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!isFormValid || isSubmitting}
                            className="h-[2.375rem] px-5 py-2 rounded-[0.625rem] text-[0.8125rem] font-semibold text-white transition-all shadow-sm inline-flex items-center justify-center leading-none bg-[#0E5B52] hover:bg-[#09423B] focus:outline-none focus:ring-4 focus:ring-[#0E5B52]/25 cursor-pointer disabled:bg-[#0E5B52] disabled:opacity-45 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Adding...
                                </span>
                            ) : (
                                'Add Mentee'
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Privacy Policy Modal (swaps inside single active backdrop) */}
            {showPrivacyPolicy && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative max-h-[80vh] overflow-y-auto animate-in fade-in duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        onClick={() => setShowPrivacyPolicy(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-light"
                        aria-label="Close privacy policy"
                    >
                        ×
                    </button>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Data Privacy Policy</h3>
                    <p className="text-xs text-gray-500 mb-4">Church of God Dasmariñas — Connect2Souls Discipleship Ministry</p>
                    <div className="text-xs text-gray-600 space-y-3 leading-relaxed">
                        <p>
                            Church of God Dasmariñas is committed to protecting the privacy and personal data of all members and mentees in accordance with the Data Privacy Act of 2012 (RA 10173).
                        </p>
                        <p>
                            <strong>1. Information Collection:</strong> Information collected through this form (such as full name, contact details, birth date, and spiritual journey milestones) is used strictly for discipleship tracking, spiritual mentoring, and pastoral care.
                        </p>
                        <p>
                            <strong>2. Data Protection:</strong> Personal information is handled with strict confidentiality and accessible only by authorized church mentors, coordinators, and ministry leaders.
                        </p>
                        <p>
                            <strong>3. Consent:</strong> By agreeing to this policy, you consent to the collection and processing of the mentee information for church discipleship and community activities.
                        </p>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button
                            type="button"
                            onClick={() => {
                                setAgreed(true);
                                setShowPrivacyPolicy(false);
                            }}
                            className="px-[1.375rem] py-[0.625rem] rounded-xl text-xs font-bold text-white bg-[#0E5B52] hover:bg-[#09423B] focus:outline-none focus:ring-4 focus:ring-[#0E5B52]/25 transition-colors cursor-pointer"
                        >
                            I Understand &amp; Agree
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
