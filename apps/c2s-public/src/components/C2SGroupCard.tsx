import type { C2SGroup } from '@/lib/data';

interface Props {
    group: C2SGroup;
    onJoin?: (group: C2SGroup) => void;
}

function LocationIcon() {
    return (
        <svg className="w-3 h-3 shrink-0 text-[#e91e8c]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg className="w-3 h-3 shrink-0 text-[#e91e8c]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
        </svg>
    );
}

function PeopleIcon() {
    return (
        <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
    );
}

export default function C2SGroupCard({ group, onJoin }: Props) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
            {/* Tags row */}
            <div className="flex flex-wrap gap-1.5">
                {group.tags.map((t) => (
                    <span key={t.label} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.color}`}>
                        {t.label}
                    </span>
                ))}
            </div>

            {/* Name */}
            <h3 className="font-black text-gray-900 text-lg leading-snug">{group.name}</h3>

            {/* Location */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <LocationIcon />
                <span>{group.location}</span>
            </div>

            {/* Schedule */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <CalendarIcon />
                <span>{group.schedule}</span>
            </div>

            {/* Footer: CTA + age range */}
            <div className="flex items-center justify-between pt-1 mt-auto">
                <button
                    onClick={() => onJoin?.(group)}
                    className="text-[11px] font-bold text-white px-3.5 py-1.5 rounded-full transition-colors"
                    style={{ background: '#e91e8c' }}
                >
                    Join C2S Group
                </button>
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <PeopleIcon />
                    {group.ageRange}
                </span>
            </div>
        </div>
    );
}
