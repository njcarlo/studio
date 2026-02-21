import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { MealStub } from "./types"
import { startOfWeek, endOfWeek, isSunday, isWithinInterval } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getWeeklyWeekdayCount(stubs: MealStub[], workerId: string, status?: 'Issued' | 'Claimed') {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(new Date());
  return stubs.filter(s => {
    if (s.workerId !== workerId) return false;
    if (status && s.status !== status) return false;
    // Handle both Firestore Timestamp and JS Date
    const d = s.date && (s.date as any).seconds
      ? new Date((s.date as any).seconds * 1000)
      : new Date(s.date as any);
    if (isNaN(d.getTime())) return false;
    return !isSunday(d) && isWithinInterval(d, { start, end });
  }).length;
}

export function getSundayCount(stubs: MealStub[], workerId: string, status?: 'Issued' | 'Claimed') {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(new Date());
  return stubs.filter(s => {
    if (s.workerId !== workerId) return false;
    if (status && s.status !== status) return false;
    const d = s.date && (s.date as any).seconds
      ? new Date((s.date as any).seconds * 1000)
      : new Date(s.date as any);
    if (isNaN(d.getTime())) return false;
    return isSunday(d) && isWithinInterval(d, { start, end });
  }).length;
}
