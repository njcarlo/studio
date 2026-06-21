import { getPublicSchedules } from "@/actions/schedule";
import { ClipboardList } from "lucide-react";
import { PublicServicesView } from "./PublicServicesView";

export const metadata = {
    title: "Service Schedules - COG Dasma",
    description: "Browse published service schedules for COG Dasma.",
};

export default async function PublicServicesPage() {
    const schedules = await getPublicSchedules();

    return (
        <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6">
            <div className="w-full max-w-4xl py-10">
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-3">
                        <ClipboardList className="h-8 w-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">Service Schedules</h1>
                    <p className="text-gray-600 mt-1">
                        Browse published service schedules and ministry assignments.
                    </p>
                </div>

                {schedules.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center text-muted-foreground">
                        No service schedules have been published yet. Please check back later.
                    </div>
                ) : (
                    <PublicServicesView schedules={schedules} />
                )}
            </div>
        </div>
    );
}
