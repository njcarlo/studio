import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { MealStub } from "./types"
import { startOfWeek, endOfWeek, isToday, isWithinInterval } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getWeeklyWeekdayCount(stubs: MealStub[], workerId: string, status?: 'Issued' | 'Claimed') {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(new Date());
  return stubs.filter(s => {
    if (s.workerId !== workerId) return false;
    if (status && s.status !== status) return false;
    const d = s.date && (s.date as any).seconds
      ? new Date((s.date as any).seconds * 1000)
      : new Date(s.date as any);
    if (isNaN(d.getTime())) return false;
    const day = d.getDay();
    const isWeekday = day >= 1 && day <= 6;
    return isWeekday && isWithinInterval(d, { start, end });
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
    return d.getDay() === 0 && isWithinInterval(d, { start, end });
  }).length;
}

/** Count weekday stubs assigned to a worker for TODAY only (for volunteer daily limit). */
export function getTodayWeekdayCount(stubs: MealStub[], workerId: string, status?: 'Issued' | 'Claimed') {
  return stubs.filter(s => {
    if (s.workerId !== workerId) return false;
    if (status && s.status !== status) return false;
    const d = s.date && (s.date as any).seconds
      ? new Date((s.date as any).seconds * 1000)
      : new Date(s.date as any);
    if (isNaN(d.getTime())) return false;
    const day = d.getDay();
    return day >= 1 && day <= 6 && isToday(d);
  }).length;
}
