import { format } from "date-fns";
import { getServiceSchedule } from "@/actions/schedule";
import { getMinistries } from "@/actions/db";
import { notFound } from "next/navigation";

export default async function PrintSchedulePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [schedule, ministries] = await Promise.all([
        getServiceSchedule(id),
        getMinistries(),
    ]);

    if (!schedule) notFound();

    const ministryMap = Object.fromEntries(ministries.map((m: any) => [m.id, m.name]));

    // Group by ministry
    const byMinistry: Record<string, typeof schedule.assignments> = {};
    for (const a of schedule.assignments) {
        if (!byMinistry[a.ministryId]) byMinistry[a.ministryId] = [];
        byMinistry[a.ministryId].push(a);
    }

    // Group by role within ministry
    const groupByRole = (assignments: typeof schedule.assignments) =>
        assignments.reduce<Record<string, typeof assignments>>((acc, a) => {
            if (!acc[a.roleName]) acc[a.roleName] = [];
            acc[a.roleName].push(a);
            return acc;
        }, {});

    const filled = schedule.assignments.filter(a => a.workerId).length;
    const total = schedule.assignments.length;

    return (
        <html>
            <head>
                <title>{schedule.title} — {format(new Date(schedule.date), "MMMM d, yyyy")}</title>
                <style>{`
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: Georgia, serif; color: #111; padding: 32px; max-width: 800px; margin: 0 auto; }
                    h1 { font-size: 22px; font-weight: bold; margin-bottom: 4px; }
                    .meta { font-size: 13px; color: #555; margin-bottom: 24px; }
                    .ministry { margin-bottom: 24px; break-inside: avoid; }
                    .ministry-name { font-size: 14px; font-weight: bold; text-transform: uppercase;
                        letter-spacing: 0.05em; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 10px; }
                    .role-name { font-size: 12px; font-weight: bold; color: #444; margin: 8px 0 4px; }
                    .slot { display: flex; align-items: center; gap: 8px; padding: 4px 0;
                        border-bottom: 1px dotted #ddd; font-size: 13px; }
                    .slot-name { flex: 1; }
                    .slot-empty { color: #aaa; font-style: italic; }
                    .ack { font-size: 11px; color: #27ae60; }
                    .summary { font-size: 12px; color: #666; margin-bottom: 20px; }
                    @media print {
                        body { padding: 16px; }
                        button { display: none; }
                    }
                `}</style>
            </head>
            <body>
                <button
                    onClick={() => window.print()}
                    style={{ marginBottom: 20, padding: '8px 16px', cursor: 'pointer', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6 }}
                >
                    Print / Save as PDF
                </button>

                <h1>{schedule.title}</h1>
                <div className="meta">
                    {format(new Date(schedule.date), "EEEE, MMMM d, yyyy")} &nbsp;·&nbsp; {filled}/{total} slots filled &nbsp;·&nbsp; {schedule.status}
                </div>

                {Object.entries(byMinistry).map(([ministryId, assignments]) => {
                    const byRole = groupByRole(assignments);
                    return (
                        <div key={ministryId} className="ministry">
                            <div className="ministry-name">{ministryMap[ministryId] || ministryId}</div>
                            {Object.entries(byRole).map(([roleName, slots]) => (
                                <div key={roleName}>
                                    <div className="role-name">{roleName}</div>
                                    {slots.map(slot => (
                                        <div key={slot.id} className="slot">
                                            {slot.workerName ? (
                                                <>
                                                    <span className="slot-name">{slot.workerName}</span>
                                                    {slot.acknowledgedAt && <span className="ack">✓ Confirmed</span>}
                                                </>
                                            ) : (
                                                <span className="slot-empty">— Unassigned —</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    );
                })}

                {schedule.notes && (
                    <div style={{ marginTop: 24, fontSize: 12, color: '#555', borderTop: '1px solid #ccc', paddingTop: 12 }}>
                        <strong>Notes:</strong> {schedule.notes}
                    </div>
                )}
            </body>
        </html>
    );
}
