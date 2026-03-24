import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { MealStub } from "@studio/types"
import { startOfWeek, endOfWeek, isToday, isWithinInterval } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Helper to parse Date from various formats (Prisma Date, timestamp-like object, string) */
function parseDate(date: any): Date {
  if (!date) return new Date(NaN);
  if (date instanceof Date) return date;
  if (typeof date.toDate === 'function') return date.toDate();
  if (typeof date.seconds === 'number') return new Date(date.seconds * 1000);
  return new Date(date);
}

/** Count meal stubs issued to a worker for TODAY only. */
export function getTodayStubCount(stubs: MealStub[], workerId: string, status?: 'Issued' | 'Claimed') {
  return stubs.filter(s => {
    if (s.workerId !== workerId) return false;
    if (status && s.status !== status) return false;
    const d = parseDate(s.date);
    if (isNaN(d.getTime())) return false;
    return isToday(d);
  }).length;
}

/** Count ALL meal stubs for a worker within the current week (Mon–Sun). */
export function getWeeklyStubCount(stubs: MealStub[], workerId: string, status?: 'Issued' | 'Claimed') {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(new Date());
  return stubs.filter(s => {
    if (s.workerId !== workerId) return false;
    if (status && s.status !== status) return false;
    const d = parseDate(s.date);
    if (isNaN(d.getTime())) return false;
    return isWithinInterval(d, { start, end });
  }).length;
}

// Legacy aliases kept for any remaining callers
/** @deprecated Use getTodayStubCount or getWeeklyStubCount */
export function getWeeklyWeekdayCount(stubs: MealStub[], workerId: string, status?: 'Issued' | 'Claimed') {
  return getWeeklyStubCount(stubs, workerId, status);
}
/** @deprecated Use getTodayStubCount or getWeeklyStubCount */
export function getSundayCount(stubs: MealStub[], workerId: string, status?: 'Issued' | 'Claimed') {
  return getTodayStubCount(stubs, workerId, status);
}
/** @deprecated Use getTodayStubCount */
export function getTodayWeekdayCount(stubs: MealStub[], workerId: string, status?: 'Issued' | 'Claimed') {
  return getTodayStubCount(stubs, workerId, status);
}
