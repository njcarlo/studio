'use client';

import type { ReactNode } from 'react';
import { formatWorkerSince, formatWorkerTenure } from '@/lib/worker-date';

/**
 * Clean left-aligned two-line stack for WORKER ID table cells and cards:
 * bold Worker ID on top + `Worker since: MMM DD, YYYY` directly underneath.
 */
export function WorkerIdStack({
    workerId,
    createdAt,
    badge,
    className = '',
}: {
    workerId?: string;
    createdAt?: string | Date | null;
    badge?: ReactNode;
    className?: string;
}) {
    const formattedDate = formatWorkerSince(createdAt);

    return (
        <div className={`text-left flex flex-col items-start ${className}`}>
            <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-[#181F26] dark:text-[#E6EDF3] tabular-nums tracking-[0.01em] text-[0.8125rem] leading-tight">
                    {workerId ?? '—'}
                </span>
                {badge}
            </div>
            <span className="text-[0.75rem] text-[#64748B] dark:text-[#9BA7B4] whitespace-nowrap leading-tight mt-0.5 tabular-nums">
                Worker since: {formattedDate}
            </span>
        </div>
    );
}

/**
 * Displays the formatted `MMM DD, YYYY` issue date alongside a subtle Deep Pine Teal tenure badge.
 */
export function WorkerSinceValue({
    createdAt,
    className = '',
}: {
    createdAt?: string | Date | null;
    className?: string;
}) {
    const formattedDate = formatWorkerSince(createdAt);
    const tenure = formatWorkerTenure(createdAt);

    return (
        <span className={`inline-flex items-center flex-wrap gap-1.5 ${className}`}>
            <span className="font-bold text-[#181F26] dark:text-[#E6EDF3] tabular-nums whitespace-nowrap">
                {formattedDate}
            </span>
            {tenure && (
                <span
                    data-pill="true"
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.6875rem] font-semibold leading-none whitespace-nowrap bg-[rgba(14,91,82,0.10)] text-[#0E5B52] dark:bg-[rgba(42,157,143,0.18)] dark:text-[#2DD4BF]"
                >
                    {tenure}
                </span>
            )}
        </span>
    );
}
