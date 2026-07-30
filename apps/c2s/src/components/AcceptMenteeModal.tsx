'use client';

interface Props {
    menteeName: string;
    groupName: string;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function AcceptMenteeModal({ menteeName, groupName, onCancel, onConfirm }: Props) {
    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[200] bg-black/40" onClick={onCancel} />

            {/* Dialog */}
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
                <div
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 flex flex-col gap-5"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Title */}
                    <h2 className="text-xl font-semibold text-gray-900">Accept Mentee?</h2>

                    {/* Body text */}
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Are you sure you want to accept <span className="font-bold text-gray-900">{menteeName}</span> into
                        your C2S Group <span className="font-bold text-gray-900">{groupName}</span>? A Devotional Progress
                        record will be created starting at Module 1 · Lesson 1.
                    </p>

                    {/* Reminder banner */}
                    <div className="flex items-start gap-3 bg-[#fffbeb] border border-[#fde68a] rounded-xl px-4 py-3">
                        <svg className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                        </svg>
                        <div>
                            <p className="text-xs font-bold text-[#92400e] mb-0.5">Reminder</p>
                            <p className="text-xs text-[#92400e] leading-relaxed">
                                Mentors should personally meet the potential mentee before accepting the mentoring request.
                                This helps ensure both mentor and mentee are ready for discipleship.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-1">
                        <button
                            onClick={onCancel}
                            className="px-5 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => { onConfirm(); onCancel(); }}
                            className="px-6 py-2 text-sm font-semibold text-white rounded-lg transition-colors"
                            style={{ background: '#5b50d6' }}
                        >
                            Accept
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
