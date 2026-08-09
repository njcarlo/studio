'use client';

import { useFontSize, FONT_SIZE_MIN, FONT_SIZE_MAX, FONT_SIZE_DEFAULT } from '@/lib/font-size-context';
import { useAuth } from '@/lib/auth-context';

interface SettingsModalProps {
    onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
    const { fontSize, setFontSize } = useFontSize();
    const { user } = useAuth();

    const sizeLabels: Record<number, string> = {
        12: 'XS',
        14: 'S',
        16: 'M',
        18: 'L',
        20: 'XL',
        22: 'XXL',
        24: 'XXXL',
    };

    const presets = [12, 14, 16, 18, 20, 22, 24];

    function getLabel(size: number) {
        // Find the closest preset label
        const closest = presets.reduce((prev, curr) =>
            Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev
        );
        return sizeLabels[closest] ?? `${size}px`;
    }

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Settings</h2>
                    <button
                        onClick={onClose}
                        aria-label="Close settings"
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>

                {/* Profile info */}
                {user && (
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                            style={{ background: '#5b50d6' }}
                        >
                            {user.avatar}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">{user.name}</p>
                            <p className="text-xs text-gray-400 capitalize">{user.role?.replace(/_/g, ' ')}</p>
                        </div>
                    </div>
                )}

                <hr className="border-gray-100" />

                {/* Font Size Slider */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-gray-900 text-sm">Text Size</p>
                            <p className="text-xs text-gray-400 mt-0.5"></p>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#ede9fe] text-[#5b50d6]">
                            {getLabel(fontSize)} — {fontSize}px
                        </span>
                    </div>

                    {/* Preview text */}
                    <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                        <p className="font-semibold text-gray-800" style={{ fontSize: `${fontSize}px` }}>
                           
                        </p>
                        <p className="text-gray-400 mt-1" style={{ fontSize: `${Math.max(10, fontSize - 3)}px` }}>
                            Preview
                        </p>
                    </div>

                    {/* Slider */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 font-bold w-3 shrink-0">A</span>
                        <input
                            type="range"
                            min={FONT_SIZE_MIN}
                            max={FONT_SIZE_MAX}
                            step={1}
                            value={fontSize}
                            onChange={(e) => setFontSize(Number(e.target.value))}
                            aria-label="Adjust text size"
                            className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-[#5b50d6]"
                            style={{
                                background: `linear-gradient(to right, #5b50d6 ${((fontSize - FONT_SIZE_MIN) / (FONT_SIZE_MAX - FONT_SIZE_MIN)) * 100}%, #e5e7eb ${((fontSize - FONT_SIZE_MIN) / (FONT_SIZE_MAX - FONT_SIZE_MIN)) * 100}%)`
                            }}
                        />
                        <span className="text-base text-gray-400 font-bold w-4 shrink-0 text-right">A</span>
                    </div>

                    {/* Preset buttons */}
                    <div className="grid grid-cols-7 gap-1">
                        {presets.map((size) => (
                            <button
                                key={size}
                                onClick={() => setFontSize(size)}
                                className={`text-[10px] font-bold py-1.5 rounded-lg transition-colors ${
                                    fontSize === size
                                        ? 'bg-[#5b50d6] text-white'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                            >
                                {sizeLabels[size]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Reset */}
                {fontSize !== FONT_SIZE_DEFAULT && (
                    <button
                        onClick={() => setFontSize(FONT_SIZE_DEFAULT)}
                        className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors text-center"
                    >
                    Default ({FONT_SIZE_DEFAULT}px)
                    </button>
                )}

                <button
                    onClick={onClose}
                    className="w-full bg-[#5b50d6] hover:bg-[#4a41c0] text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                >
                    Confirm
                </button>
            </div>
        </div>
    );
}
