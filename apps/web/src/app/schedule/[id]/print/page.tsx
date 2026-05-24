import React from "react";
import { format } from "date-fns";
import { getServiceSchedule, getWorshipSlots } from "@/actions/schedule";
import { getMinistries } from "@/actions/db";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/schedule/print-button";

export default async function PrintSchedulePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [schedule, ministries, worshipSlots] = await Promise.all([
        getServiceSchedule(id),
        getMinistries(),
        getWorshipSlots(id),
    ]);

    if (!schedule) notFound();

    const getMinistryName = (mid: string) => {
        const name = (ministries as any[]).find((m: any) => m.id === mid)?.name || mid;
        return name.replace(/^[A-Z]-/i, '');
    };

    const byMinistry: Record<string, typeof schedule.assignments> = {};
    for (const a of schedule.assignments) {
        if (!byMinistry[a.ministryId]) byMinistry[a.ministryId] = [];
        byMinistry[a.ministryId].push(a);
    }
    const sortedMinistryIds = Object.keys(byMinistry).sort((a, b) =>
        getMinistryName(a).localeCompare(getMinistryName(b))
    );

    const groupByRole = (assignments: typeof schedule.assignments) =>
        assignments.reduce<Record<string, typeof assignments>>((acc, a) => {
            if (!acc[a.roleName]) acc[a.roleName] = [];
            acc[a.roleName].push(a);
            return acc;
        }, {});

    const filled = schedule.assignments.filter(a => a.workerId).length;
    const css = `
        :root {
            --blue-bg: #0000ff; /* Exact blue from PDF */
            --yellow-bg: #ffff00;
            --border-color: #000;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, Helvetica, sans-serif; 
            color: #000; 
            padding: 20px; 
            font-size: 11px;
            background: #fff;
        }
        @page { size: landscape; margin: 1cm; }
        
        .print-btn { 
            margin-bottom: 20px; padding: 8px 16px; cursor: pointer; 
            background: #2563eb; color: #fff; border: none; border-radius: 4px; 
            font-size: 13px; font-weight: bold; 
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 30px;
        }
        th, td {
            border: 1px solid var(--border-color);
            padding: 4px 6px;
            text-align: center;
            vertical-align: middle;
            font-size: 10px;
        }
        
        .main-header {
            background-color: var(--blue-bg);
            color: #fff;
            font-size: 14px;
            font-weight: bold;
            padding: 8px;
            text-transform: uppercase;
        }
        
        .ministry-header-row th {
            background-color: var(--yellow-bg);
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
        }
        
        .date-header {
            font-weight: bold;
            background-color: #f3f4f6;
        }
        
        .role-label {
            font-weight: bold;
            background-color: #f8fafc;
            width: 120px;
            text-align: right;
            padding-right: 12px;
        }
        
        .worker-cell {
            text-align: center;
        }
        
        .unassigned {
            color: #999;
            font-style: italic;
        }
        
        .notes-row td {
            background-color: #fffbeb;
            font-style: italic;
            text-align: left;
            padding: 8px;
        }
        
        .footer-note {
            background-color: var(--blue-bg);
            color: #fff;
            text-align: center;
            padding: 6px;
            font-size: 9px;
            font-style: italic;
            border: 1px solid var(--border-color);
            margin-top: -30px; /* pull up to connect to last table if possible */
        }
        
        @media print {
            body { padding: 0; }
            .print-btn { display: none; }
            .main-header, .ministry-header-row th, .date-header, .role-label, .notes-row td, .footer-note {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    `;

    return (
        <html lang="en">
            <head>
                <title>{schedule.title} — {format(new Date(schedule.date), "MMMM d, yyyy")}</title>
                <meta charSet="utf-8" />
                <style dangerouslySetInnerHTML={{ __html: css }} />
            </head>
            <body>
                <PrintButton />

                <table>
                    <thead>
                        <tr>
                            <th colSpan={2} className="main-header">
                                CHURCH OF GOD WORLD MISSIONS PHILIPPINES - DASMARIÑAS<br/>
                                SCHEDULE FOR {format(new Date(schedule.date), "MMMM d, yyyy").toUpperCase()} - {schedule.title.toUpperCase()}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedMinistryIds.length === 0 && (
                            <tr><td colSpan={2} style={{padding: '20px'}}>No assignments yet.</td></tr>
                        )}
                        
                        {sortedMinistryIds.map(ministryId => {
                            const assignments = byMinistry[ministryId];
                            const byRole = groupByRole(assignments);
                            
                            // Get unique rehearsal string if any
                            const rehearsals = [...new Set(assignments.filter(a => a.rehearsalDate).map(a => 
                                `${format(new Date(a.rehearsalDate!), "EEEE, MMM d, yyyy")} ${a.rehearsalTime || ''}`
                            ))];
                            
                            return (
                                <React.Fragment key={ministryId}>
                                    <tr className="ministry-header-row">
                                        <th className="role-label" style={{textAlign: 'center', padding: '6px'}}>{getMinistryName(ministryId)}</th>
                                        <th className="date-header">{format(new Date(schedule.date), "MMMM d, yyyy")}</th>
                                    </tr>
                                    
                                    {Object.entries(byRole).map(([roleName, slots]) => {
                                        // Group workers by role
                                        const workerNames = slots.map(s => s.workerName ? s.workerName : '').filter(Boolean);
                                        return (
                                            <tr key={roleName}>
                                                <td className="role-label">{roleName}</td>
                                                <td className="worker-cell">
                                                    {workerNames.length > 0 
                                                        ? workerNames.join("  |  ") 
                                                        : <span className="unassigned">—</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    
                                    {rehearsals.length > 0 && (
                                        <tr>
                                            <td className="role-label" style={{fontStyle: 'italic'}}>Rehearsal</td>
                                            <td className="worker-cell" style={{fontStyle: 'italic'}}>
                                                {rehearsals.join(" / ")}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
                
                {worshipSlots.length > 0 && (
                    <table>
                        <thead>
                            <tr>
                                <th colSpan={2} className="main-header" style={{backgroundColor: '#333'}}>
                                    ORDER OF SERVICE
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {worshipSlots.map((slot: any) => {
                                const bySlotRole: Record<string, any[]> = {};
                                for (const sw of slot.workers) {
                                    const key = sw.role || '(No Role)';
                                    if (!bySlotRole[key]) bySlotRole[key] = [];
                                    bySlotRole[key].push(sw);
                                }
                                
                                return (
                                    <React.Fragment key={slot.id}>
                                        <tr className="ministry-header-row">
                                            <th className="role-label" style={{textAlign: 'center', backgroundColor: '#e5e7eb', color: '#000'}}>{slot.slotName}</th>
                                            <th className="date-header" style={{backgroundColor: '#f9fafb'}}>{slot.durationMinutes ? `${slot.durationMinutes} min` : '—'}</th>
                                        </tr>
                                        {Object.entries(bySlotRole).map(([roleName, workers]) => {
                                            const workerNames = workers.map((w: any) => w.workerName).filter(Boolean);
                                            return (
                                                <tr key={roleName}>
                                                    <td className="role-label">{roleName}</td>
                                                    <td className="worker-cell">
                                                        {workerNames.length > 0 ? workerNames.join("  |  ") : <span className="unassigned">—</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {slot.workers.length === 0 && (
                                            <tr>
                                                <td className="role-label">Roles</td>
                                                <td className="unassigned">No workers assigned</td>
                                            </tr>
                                        )}
                                        {slot.notes && (
                                            <tr className="notes-row">
                                                <td colSpan={2}>Note: {slot.notes}</td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                )}

                <div className="footer-note">
                    *NOTE: Please coordinate the altar call song with the preacher and confirm your band and singers for their slots. If you are unable to make it to your slot, please inform the Worship Leader and the schedulers in advance. Thank you. :)
                </div>
            </body>
        </html>
    );
}
