/**
 * Shared formatting and tenure helpers for C2S Worker ID / Worker Since dates.
 */

const SHORT_MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export function parseWorkerTimestamp(input?: string | Date | null): Date | null {
    if (!input) return null;
    if (input instanceof Date) {
        return Number.isNaN(input.getTime()) ? null : input;
    }
    const trimmed = input.trim();
    if (!trimmed) return null;
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Formats a worker ID / record creation timestamp strictly as `MMM DD, YYYY` (e.g., `Nov 12, 2024`).
 */
export function formatWorkerSince(input?: string | Date | null, fallback = '—'): string {
    const date = parseWorkerTimestamp(input);
    if (!date) return fallback;
    const month = SHORT_MONTHS[date.getUTCMonth()];
    const day = String(date.getUTCDate()).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${month} ${day}, ${year}`;
}

/**
 * Computes a concise tenure badge string (e.g. `2 yrs`, `1 yr`, `10 mos`, `< 1 mo`)
 * from the worker record / Worker ID creation timestamp.
 */
export function formatWorkerTenure(input?: string | Date | null, referenceDate: Date = new Date()): string | null {
    const start = parseWorkerTimestamp(input);
    if (!start) return null;

    let months =
        (referenceDate.getUTCFullYear() - start.getUTCFullYear()) * 12 +
        (referenceDate.getUTCMonth() - start.getUTCMonth());

    if (referenceDate.getUTCDate() < start.getUTCDate()) {
        months -= 1;
    }

    if (months < 0) return '< 1 mo';
    if (months < 1) return '< 1 mo';
    if (months < 12) return `${months} ${months === 1 ? 'mo' : 'mos'}`;

    const years = Math.floor(months / 12);
    return `${years} ${years === 1 ? 'yr' : 'yrs'}`;
}
