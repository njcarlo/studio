'use client';

import ConfirmModal from '@/components/ConfirmModal';

interface Props {
    menteeName: string;
    onClose: () => void;
    onConfirm: () => void;
}

export default function EndorseMenteeModal({ menteeName, onClose, onConfirm }: Props) {
    return (
        <ConfirmModal
            open
            variant="default"
            icon="check"
            title="Endorse Mentee?"
            description={
                <>
                    Endorse <strong className="font-semibold text-[#181F26] dark:text-[#E6EDF3]">{menteeName}</strong> to become a mentor? They will appear in the Endorsed tab.
                </>
            }
            cancelLabel="Cancel"
            confirmLabel="Endorse"
            onCancel={onClose}
            onConfirm={() => {
                onConfirm();
                onClose();
            }}
        />
    );
}
