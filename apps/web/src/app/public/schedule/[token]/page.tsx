import { getPublicSchedule, getPublicSchedules } from "@/actions/schedule";
import { getMinistries } from "@/actions/db";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import PublicScheduleClient from "./PublicScheduleClient";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const schedule = await getPublicSchedule(token);
    if (!schedule) {
        return {
            title: "Schedule Not Found - COG Dasma",
        };
    }
    return {
        title: `${schedule.title} - COG Dasma`,
        description: `Public service schedule for COG Dasma on ${format(new Date(schedule.date), "EEEE, MMMM d, yyyy")}.`,
    };
}

export default async function PublicSchedulePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const [schedule, ministries, publicSchedules] = await Promise.all([
        getPublicSchedule(token),
        getMinistries(),
        getPublicSchedules(),
    ]);

    if (!schedule) notFound();

    return (
        <PublicScheduleClient
            schedule={schedule as any}
            ministries={ministries}
            publicSchedules={publicSchedules}
        />
    );
}
