import Link from "next/link";
import { getPublicSchedule, getPublicSchedules } from "@/actions/schedule";
import { getMinistries } from "@/actions/db";
// notFound removed; using custom placeholder UI
import { format } from "date-fns";
import PublicScheduleClient from "./PublicScheduleClient";
import { getTenantConfig, tenantDisplayName } from "@studio/core-engine/tenant";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const brand = tenantDisplayName(getTenantConfig());
    const schedule = await getPublicSchedule(token);
    if (!schedule) {
        // No published schedule; render a placeholder page allowing navigation or showing info
        return {
            title: `Schedule Unpublished - ${brand}`,
            description: "Public schedule not yet published for this token.",
        };
    }
    return {
        title: `${schedule.title} - ${brand}`,
        description: `Public service schedule for ${brand} on ${format(new Date(schedule.date), "EEEE, MMMM d, yyyy")}.`,
    };
}


export default async function PublicSchedulePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const [schedule, ministries, publicSchedules] = await Promise.all([
        getPublicSchedule(token),
        getMinistries(),
        getPublicSchedules(),
    ]);

    // If schedule is not published, show a friendly placeholder instead of a 404
    if (!schedule) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Schedule Unpublished</h1>
                <p className="text-lg text-gray-600 mb-6 text-center max-w-prose">
                    This public schedule has not been published yet. Please check back later or explore other schedules.
                </p>
                <Link href="/schedule" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    View All Schedules
                </Link>
            </div>
        );
    }

    return (
        <PublicScheduleClient
            schedule={schedule as any}
            ministries={ministries}
            publicSchedules={publicSchedules}
        />
    );
}
