// Pure helpers shared between the server-side meal stub engine and the
// worker-facing /my-schedule UI (which needs to know whether the
// confirm/decline window is currently open, without duplicating the rule).

export type SundayConfirmationSettings = {
    windowOpenDaysBefore: number;
    windowCloseHoursAfterMidnight: number;
};

export function isWithinConfirmationWindow(
    scheduleDate: Date | string,
    now: Date,
    settings: SundayConfirmationSettings,
): boolean {
    const date = new Date(scheduleDate);

    const windowOpen = new Date(date);
    windowOpen.setDate(windowOpen.getDate() - settings.windowOpenDaysBefore);

    const windowClose = new Date(date);
    windowClose.setHours(0, 0, 0, 0);
    windowClose.setTime(windowClose.getTime() + settings.windowCloseHoursAfterMidnight * 60 * 60 * 1000);

    return now >= windowOpen && now <= windowClose;
}
