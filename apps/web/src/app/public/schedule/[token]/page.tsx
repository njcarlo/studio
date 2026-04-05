import { format } from "date-fns";
import { getPublicSchedule } from "@/actions/schedule";
import { getMinistries } from "@/actions/db";
import { notFound } from "next/navigation";

export default async function PublicSchedulePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const [schedule, ministries] = await Promise.all([
        getPublicSchedule(token),
        getMinistries(),
    ]);

    if (!schedule) notFound();

    const s = schedule as any;
    const ministryMap = Object.fromEntries(ministries.map((m: any) => [m.id, m.name]));

    const byMinistry: Record<string, any[]> = {};
    for (const a of s.assignments || []) {
        if (!byMinistry[a.ministryId]) byMinistry[a.ministryId] = [];
        byMinistry[a.ministryId].push(a);
    }

    const groupByRole = (assignments: any[]) =>
        assignments.reduce<Record<string, any[]>>((acc: Record<string, any[]>, a: any) => {
            if (!acc[a.roleName]) acc[a.roleName] = [];
            acc[a.roleName].push(a);
            return acc;
        }, {});

    const filled = (s.assignments || []).filter((a: any) => a.workerId).length;
    const total = (s.assignments || []).length;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-3xl mx-auto px-6 py-8">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">COG Nation</p>
                    <h1 className="text-3xl font-bold text-gray-900">{schedule.title}</h1>
                    <p className="text-gray-500 mt-1">
                        {format(new Date(s.date), "EEEE, MMMM d, yyyy")}
                    </p>
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                        <span>{filled} of {total} slots filled</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {s.status}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                {Object.entries(byMinistry).map(([ministryId, assignments]) => {
                    const byRole = groupByRole(assignments);
                    return (
                        <div key={ministryId} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                            <div className="px-6 py-4 border-b bg-gray-50">
                                <h2 className="font-bold text-gray-800 uppercase tracking-wide text-sm">
                                    {ministryMap[ministryId] || ministryId}
                                </h2>
                            </div>
                            <div className="divide-y">
                                {Object.entries(byRole).map(([roleName, slots]) => (
                                    <div key={roleName} className="px-6 py-4">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{roleName}</p>
                                        <div className="space-y-2">
                                            {(slots as any[]).map((slot: any) => (
                                                <div key={slot.id} className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full shrink-0 ${slot.workerId ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                    {slot.workerName ? (
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <span className="text-sm font-medium text-gray-800">{slot.workerName}</span>
                                                            {slot.acknowledgedAt && (
                                                                <span className="text-xs text-green-600 font-medium">✓ Confirmed</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400 italic">Unassigned</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {s.notes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-6 py-4">
                        <p className="text-sm font-semibold text-yellow-800 mb-1">Notes</p>
                        <p className="text-sm text-yellow-700">{s.notes}</p>
                    </div>
                )}

                <p className="text-center text-xs text-gray-400 pb-8">
                    This schedule is shared publicly by COG Nation. Last updated {format(new Date(s.updatedAt), "MMM d, yyyy 'at' h:mm a")}.
                </p>
            </div>
        </div>
    );
}
