'use client';

interface Props {
    menteeName: string;
    onClose: () => void;
    onConfirm: () => void;
}

export default function EndorseMenteeModal({ menteeName, onClose, onConfirm }: Props) {
    return (
        <>
            <div className="fixed inset-0 z-[200] bg-black/40" onClick={onClose} />
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 flex flex-col gap-6" onClick={e => e.stopPropagation()}>
                    <h2 className="text-2xl font-semibold text-gray-900">Endorse Mentee</h2>
                    <hr className="border-gray-100" />
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Endorse <span className="font-bold text-gray-900">{menteeName}</span> to become a mentor? They will appear in the Endorsed tab.
                    </p>
                    <hr className="border-gray-100" />
                    <div className="flex items-center justify-between">
                        <button onClick={onClose}
                            className="px-5 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button onClick={() => { onConfirm(); onClose(); }}
                            className="px-6 py-2 text-sm font-semibold text-white rounded-lg transition-colors"
                            style={{ background: '#5b50d6' }}>
                            Endorse
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
