'use client';

import ConfirmModal from '@/components/ConfirmModal';

interface Props {
    menteeName: string;
    groupName: string;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function AcceptMenteeModal({ menteeName, groupName, onCancel, onConfirm }: Props) {
    return (
        <ConfirmModal
            open
            variant="default"
            icon="check"
            title="Accept Mentee?"
            description={
                <>
                    Are you sure you want to accept <strong className="font-semibold text-[#181F26] dark:text-[#E6EDF3]">{menteeName}</strong> into
                    your C2S Group <strong className="font-semibold text-[#181F26] dark:text-[#E6EDF3]">{groupName}</strong>?
                </>
            }
            extra={
                <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 bg-[#FAF8F5] dark:bg-[#222933] border border-[#E2E8E5] dark:border-[#2A323D]">
                    <svg className="w-4 h-4 text-[#0E5B52] dark:text-[#2A9D8F] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                    </svg>
                    <p className="text-xs text-[#475569] dark:text-[#9BA7B4] leading-relaxed">
                        <span className="font-bold text-[#181F26] dark:text-[#E6EDF3]">Reminder: </span>
                        Mentors should personally meet the potential mentee before accepting the mentoring request to ensure readiness for discipleship.
                    </p>
                </div>
            }
            cancelLabel="Cancel"
            confirmLabel="Accept"
            onCancel={onCancel}
            onConfirm={() => {
                onConfirm();
                onCancel();
            }}
        />
    );
}
