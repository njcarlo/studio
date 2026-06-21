import { getPublicSchedulesWithAssignments } from "@/actions/schedule";
import { getMinistries } from "@/actions/db";
import { PortalTopNav } from "./PortalTopNav";
import { ScheduleMatrixPortal } from "./ScheduleMatrixPortal";

export const metadata = {
    title: "Service Schedules - COG Dasma",
    description: "Browse published service schedules for COG Dasma.",
};

export default async function PublicServicesPage() {
    const [schedules, ministries] = await Promise.all([
        getPublicSchedulesWithAssignments(),
        getMinistries(),
    ]);

    return (
        <div className="min-h-screen bg-gray-50">
            <PortalTopNav />

            <div className="mx-auto max-w-5xl px-6 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Service Schedules</h1>
                    <p className="text-gray-600 mt-1">
                        A summarized view of roles and assignments by Day, Week, or Month.
                    </p>
                </div>

                <ScheduleMatrixPortal schedules={schedules} ministries={ministries as any} />
            </div>
        </div>
    );
}
