"use server";

import { prisma } from '@studio/database/prisma';
import { revalidatePath } from 'next/cache';
import { getWorkloadCategories, createWorkloadCategory } from './ministry-categories';
import { EmailService } from '@/services/email-service';

async function ensureWorkloadCategoriesExist(ministryId: string, roleNames: string[]) {
    if (!roleNames.length) return;
    const existing = await getWorkloadCategories(ministryId);
    const existingNames = new Set(existing.map((c: any) => c.name.toLowerCase()));
    
    for (const roleName of roleNames) {
        if (!roleName.trim()) continue;
        if (!existingNames.has(roleName.trim().toLowerCase())) {
            try {
                // Use '999999' for automated internal system bypass
                await createWorkloadCategory({ ministryId, name: roleName.trim() }, '999999', { skipAuth: true });
                existingNames.add(roleName.trim().toLowerCase());
            } catch (e) {
                console.error("Failed to auto-create workload category", e);
            }
        }
    }
}

// ── Service Schedules ─────────────────────────────────────────────────────────

export async function getServiceSchedules() {
    return prisma.serviceSchedule.findMany({
        orderBy: { date: 'desc' },
        include: {
            assignments: true,
        },
    });
}

export async function getServiceSchedule(id: string) {
    return prisma.serviceSchedule.findUnique({
        where: { id },
        include: {
            assignments: {
                orderBy: [{ ministryId: 'asc' }, { order: 'asc' }],
            },
        },
    });
}

export async function createServiceSchedule(data: {
    date: Date;
    title?: string;
    notes?: string;
    createdBy: string;
}) {
    const schedule = await prisma.serviceSchedule.create({
        data: {
            date: data.date,
            title: data.title || 'Sunday Service',
            notes: data.notes,
            createdBy: data.createdBy,
        },
    });
    revalidatePath('/schedule');
    return schedule;
}

export async function updateServiceSchedule(id: string, data: {
    title?: string;
    notes?: string;
    status?: string;
}) {
    const schedule = await prisma.serviceSchedule.update({
        where: { id },
        data,
    });
    revalidatePath('/schedule');
    revalidatePath(`/schedule/${id}`);
    return schedule;
}

export async function deleteServiceSchedule(id: string) {
    await prisma.serviceSchedule.delete({ where: { id } });
    revalidatePath('/schedule');
}

// ── Schedule Assignments ──────────────────────────────────────────────────────

export async function upsertAssignment(data: {
    scheduleId: string;
    ministryId: string;
    roleName: string;
    workerId?: string | null;
    workerName?: string | null;
    notes?: string | null;
    rehearsalDate?: Date | null;
    rehearsalTime?: string | null;
    order?: number;
}) {
    // Find existing slot for this schedule + ministry + role + order
    const existing = await prisma.scheduleAssignment.findFirst({
        where: {
            scheduleId: data.scheduleId,
            ministryId: data.ministryId,
            roleName: data.roleName,
            order: data.order ?? 0,
        },
    });

    if (existing) {
        return prisma.scheduleAssignment.update({
            where: { id: existing.id },
            data: {
                workerId: data.workerId ?? null,
                workerName: data.workerName ?? null,
                notes: data.notes ?? null,
                rehearsalDate: data.rehearsalDate !== undefined ? data.rehearsalDate : undefined,
                rehearsalTime: data.rehearsalTime !== undefined ? data.rehearsalTime : undefined,
            },
        });
    }

    return prisma.scheduleAssignment.create({ data: {
        scheduleId: data.scheduleId,
        ministryId: data.ministryId,
        roleName: data.roleName,
        workerId: data.workerId ?? null,
        workerName: data.workerName ?? null,
        notes: data.notes ?? null,
        rehearsalDate: data.rehearsalDate ?? null,
        rehearsalTime: data.rehearsalTime ?? null,
        order: data.order ?? 0,
    }});
}

export async function deleteAssignment(id: string) {
    await prisma.scheduleAssignment.delete({ where: { id } });
}

export async function applyTemplateToSchedule(scheduleId: string, templateId: string) {
    const template = await prisma.serviceTemplate.findUnique({
        where: { id: templateId },
        include: { roles: { orderBy: { order: 'asc' } } },
    });
    if (!template) throw new Error('Template not found');

    // Auto-create missing workload categories for these roles
    await ensureWorkloadCategoriesExist(
        template.ministryId, 
        template.roles.map(r => r.roleName)
    );

    // Remove existing assignments for this ministry on this schedule
    await prisma.scheduleAssignment.deleteMany({
        where: { scheduleId, ministryId: template.ministryId },
    });

    // Create blank slots from template
    await prisma.scheduleAssignment.createMany({
        data: template.roles.flatMap(role =>
            Array.from({ length: role.count }, (_, i) => ({
                scheduleId,
                ministryId: template.ministryId,
                roleName: role.roleName,
                order: i,
                notes: role.notes ?? null,
            }))
        ),
    });

    revalidatePath(`/schedule/${scheduleId}`);
}

// ── Service Templates ─────────────────────────────────────────────────────────

export async function getServiceTemplates(ministryId?: string) {
    return prisma.serviceTemplate.findMany({
        where: ministryId ? { ministryId } : undefined,
        include: { roles: { orderBy: { order: 'asc' } } },
        orderBy: [{ ministryId: 'asc' }, { name: 'asc' }],
    });
}

export async function createServiceTemplate(data: {
    ministryId: string;
    name: string;
    isDefault?: boolean;
    createdBy: string;
    roles: { roleName: string; count: number; notes?: string; order?: number }[];
}) {
    // Auto-create missing workload categories for these roles
    await ensureWorkloadCategoriesExist(
        data.ministryId, 
        data.roles.map(r => r.roleName)
    );

    const template = await prisma.serviceTemplate.create({
        data: {
            ministryId: data.ministryId,
            name: data.name,
            isDefault: data.isDefault ?? false,
            createdBy: data.createdBy,
            roles: {
                create: data.roles.map((r, i) => ({
                    roleName: r.roleName,
                    count: r.count,
                    notes: r.notes ?? null,
                    order: r.order ?? i,
                })),
            },
        },
        include: { roles: true },
    });
    revalidatePath('/schedule/templates');
    return template;
}

export async function updateServiceTemplate(id: string, data: {
    name?: string;
    isDefault?: boolean;
    roles?: { roleName: string; count: number; notes?: string; order?: number }[];
}) {
    if (data.roles) {
        // Fetch the template to get the ministryId
        const template = await prisma.serviceTemplate.findUnique({ where: { id } });
        if (template) {
            await ensureWorkloadCategoriesExist(
                template.ministryId, 
                data.roles.map(r => r.roleName)
            );
        }

        await prisma.templateRole.deleteMany({ where: { templateId: id } });
        await prisma.templateRole.createMany({
            data: data.roles.map((r, i) => ({
                templateId: id,
                roleName: r.roleName,
                count: r.count,
                notes: r.notes ?? null,
                order: r.order ?? i,
            })),
        });
    }

    const template = await prisma.serviceTemplate.update({
        where: { id },
        data: {
            name: data.name,
            isDefault: data.isDefault,
        },
        include: { roles: { orderBy: { order: 'asc' } } },
    });
    revalidatePath('/schedule/templates');
    return template;
}

export async function deleteServiceTemplate(id: string) {
    await prisma.serviceTemplate.delete({ where: { id } });
    revalidatePath('/schedule/templates');
}

// ── Publish & Notify ──────────────────────────────────────────────────────────

export async function publishScheduleAndNotify(scheduleId: string, publishedBy: string) {
    const schedule = await prisma.serviceSchedule.update({
        where: { id: scheduleId },
        data: { status: 'Published' },
        include: { assignments: true },
    });

    void publishedBy; // reserved for audit log

    // Get unique worker IDs that are assigned
    const workerIds = [...new Set(
        schedule.assignments
            .filter(a => a.workerId)
            .map(a => a.workerId as string)
    )];

    // Fetch workers to get emails
    const workers = await prisma.worker.findMany({
        where: { id: { in: workerIds } }
    });

    let notifiedCount = 0;
    
    for (const worker of workers) {
        if (worker.email) {
            try {
                // Formatting the date nicely
                const formattedDate = new Intl.DateTimeFormat('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }).format(new Date(schedule.date));
                
                await EmailService.sendEmail({
                    to: worker.email,
                    subject: `You have been scheduled for ${schedule.title} (${formattedDate})`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
                            <div style="background-color: #3b82f6; padding: 24px; text-align: center; color: white;">
                                <h2 style="margin: 0; font-size: 24px;">Schedule Assignment</h2>
                            </div>
                            <div style="padding: 24px; color: #333;">
                                <p style="font-size: 16px;">Hello ${worker.firstName},</p>
                                <p style="font-size: 16px;">You have been assigned to duties in the upcoming service:</p>
                                
                                <div style="background-color: #f3f4f6; border-radius: 6px; padding: 16px; margin: 20px 0;">
                                    <h3 style="margin-top: 0; color: #1f2937;">${schedule.title}</h3>
                                    <p style="margin: 8px 0; color: #4b5563;"><strong>Date:</strong> ${formattedDate}</p>
                                </div>
                                
                                <p style="font-size: 16px;">Please log in to the COG App to view your specific roles, rehearsal times, and confirm your attendance.</p>
                                
                                <div style="text-align: center; margin-top: 32px;">
                                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/schedule/${scheduleId}" 
                                       style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                                        View Schedule
                                    </a>
                                </div>
                            </div>
                            <div style="background-color: #f9fafb; padding: 16px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #eaeaea;">
                                This is an automated message from the COG App. Please do not reply.
                            </div>
                        </div>
                    `,
                    text: `Hello ${worker.firstName},\n\nYou have been assigned to duties in the upcoming service: ${schedule.title} on ${formattedDate}.\n\nPlease log in to the COG App to view your specific roles and confirm your attendance.\n\nLink: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/schedule/${scheduleId}`
                });
                notifiedCount++;
            } catch (err) {
                console.error(`Failed to send email to ${worker.email}`, err);
            }
        }
    }

    revalidatePath(`/schedule/${scheduleId}`);
    revalidatePath('/schedule');
    return { schedule, notified: notifiedCount };
}

// ── Confirm Assignment ────────────────────────────────────────────────────────

export async function confirmAssignment(assignmentId: string, confirmedBy: string) {
    const assignment = await (prisma.scheduleAssignment as any).update({
        where: { id: assignmentId },
        data: {
            acknowledgedAt: new Date(),
            acknowledgedBy: confirmedBy,
            attendanceStatus: 'Confirmed',
        },
    });
    revalidatePath(`/schedule/${assignment.scheduleId}`);
    return assignment;
}

export async function setAttendanceStatus(assignmentId: string, status: 'Confirmed' | 'Pending' | 'Not Attending', updatedBy: string) {
    const assignment = await (prisma.scheduleAssignment as any).update({
        where: { id: assignmentId },
        data: {
            attendanceStatus: status,
            acknowledgedAt: status !== 'Pending' ? new Date() : null,
            acknowledgedBy: status !== 'Pending' ? updatedBy : null,
        },
    });
    revalidatePath(`/schedule/${assignment.scheduleId}`);
    return assignment;
}

export async function getScheduleConfirmationStatus(scheduleId: string) {
    const assignments = await prisma.scheduleAssignment.findMany({
        where: { scheduleId, workerId: { not: null } },
        select: {
            id: true, workerId: true, workerName: true,
            roleName: true, ministryId: true,
            acknowledgedAt: true, acknowledgedBy: true,
            attendanceStatus: true,
        },
    });
    return assignments;
}

// ── Worker ID lookup for assignment ──────────────────────────────────────────

export async function findWorkerByWorkerId(workerId: string) {
    return prisma.worker.findFirst({
        where: { workerId },
        select: { id: true, firstName: true, lastName: true, majorMinistryId: true, status: true },
    });
}

// ── Conflict Detection ────────────────────────────────────────────────────────

export async function getWorkerConflicts(scheduleId: string) {
    const assignments = await prisma.scheduleAssignment.findMany({
        where: { scheduleId, workerId: { not: null } },
        select: { id: true, workerId: true, workerName: true, ministryId: true, roleName: true },
    });

    // Find workers assigned to more than one ministry in this schedule
    const byWorker: Record<string, typeof assignments> = {};
    for (const a of assignments) {
        if (!a.workerId) continue;
        if (!byWorker[a.workerId]) byWorker[a.workerId] = [];
        byWorker[a.workerId].push(a);
    }

    return Object.entries(byWorker)
        .filter(([, slots]) => {
            const ministries = new Set(slots.map(s => s.ministryId));
            return ministries.size > 1;
        })
        .map(([workerId, slots]) => ({ workerId, workerName: slots[0].workerName, slots }));
}

// ── Public Schedule ───────────────────────────────────────────────────────────

export async function togglePublicSchedule(id: string, isPublic: boolean) {
    const token = isPublic ? crypto.randomUUID() : null;
    const schedule = await (prisma.serviceSchedule as any).update({
        where: { id },
        data: { isPublic, publicToken: token },
    });
    revalidatePath(`/schedule/${id}`);
    return schedule;
}

export async function getPublicSchedule(token: string) {
    return (prisma.serviceSchedule as any).findUnique({
        where: { publicToken: token, isPublic: true },
        include: {
            assignments: {
                orderBy: [{ ministryId: 'asc' }, { order: 'asc' }],
            },
        },
    });
}

export async function getPublicSchedules() {
    return (prisma.serviceSchedule as any).findMany({
        where: { isPublic: true },
        orderBy: { date: 'desc' },
        select: {
            id: true,
            title: true,
            date: true,
            publicToken: true,
            status: true,
        }
    });
}

// ── History ───────────────────────────────────────────────────────────────────

export async function getScheduleHistory() {
    const now = new Date();
    return prisma.serviceSchedule.findMany({
        where: { date: { lt: now } },
        orderBy: { date: 'desc' },
        include: { assignments: true },
        take: 20,
    });
}

// ── Scheduler Assignment ──────────────────────────────────────────────────────

// ── Worship Slots ─────────────────────────────────────────────────────────────

export async function getWorshipSlots(scheduleId: string) {
    return prisma.worshipSlot.findMany({
        where: { scheduleId },
        include: { workers: { orderBy: { createdAt: 'asc' } } },
        orderBy: { order: 'asc' },
    });
}

export async function createWorshipSlot(data: {
    scheduleId: string;
    slotName: string;
    notes?: string;
    order?: number;
}) {
    const isTws = data.slotName.toUpperCase() === 'TWS';
    const slot = await prisma.worshipSlot.create({
        data: {
            scheduleId: data.scheduleId,
            slotName: data.slotName,
            isTws,
            notes: data.notes ?? null,
            order: data.order ?? 0,
        },
        include: { workers: true },
    });
    revalidatePath(`/schedule/${data.scheduleId}`);
    return slot;
}

export async function updateWorshipSlot(id: string, data: { slotName?: string; notes?: string; order?: number }) {
    const updateData: any = { ...data };
    if (data.slotName !== undefined) {
        updateData.isTws = data.slotName.toUpperCase() === 'TWS';
    }
    const slot = await prisma.worshipSlot.update({ where: { id }, data: updateData, include: { workers: true } });
    revalidatePath(`/schedule/${slot.scheduleId}`);
    return slot;
}

export async function deleteWorshipSlot(id: string) {
    const slot = await prisma.worshipSlot.delete({ where: { id } });
    revalidatePath(`/schedule/${slot.scheduleId}`);
}

export async function addWorkerToWorshipSlot(slotId: string, workerId: string, workerName: string, role?: string) {
    const entry = await prisma.worshipSlotWorker.create({
        data: { slotId, workerId, workerName, role: role ?? null },
    });
    const slot = await prisma.worshipSlot.findUnique({ where: { id: slotId } });
    if (slot) revalidatePath(`/schedule/${slot.scheduleId}`);
    return entry;
}

export async function removeWorkerFromWorshipSlot(id: string) {
    const entry = await prisma.worshipSlotWorker.delete({ where: { id } });
    const slot = await prisma.worshipSlot.findUnique({ where: { id: entry.slotId } });
    if (slot) revalidatePath(`/schedule/${slot.scheduleId}`);
}

// ── Scheduler Assignment ──────────────────────────────────────────────────────

export async function assignMinistryScheduler(ministryId: string, workerId: string | null) {
    await (prisma.ministry as any).update({
        where: { id: ministryId },
        data: { schedulerId: workerId },
    });
    revalidatePath('/schedule');
}

export async function getMinistrySchedulers() {
    const ministries = await (prisma.ministry as any).findMany({
        select: { id: true, name: true, schedulerId: true },
    });
    return ministries as { id: string; name: string; schedulerId: string | null }[];
}

// ── Monthly Duty Caps ─────────────────────────────────────────────────────────

export async function getMonthlyDutyCounts(scheduleId: string) {
    // 1. Get the target schedule to find the month
    const schedule = await prisma.serviceSchedule.findUnique({
        where: { id: scheduleId },
        select: { date: true }
    });
    if (!schedule) return {};

    const targetDate = new Date(schedule.date);
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

    // 2. Find all assignments in this month
    const assignments = await prisma.scheduleAssignment.findMany({
        where: {
            workerId: { not: null },
            schedule: {
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                }
            }
        },
        select: { workerId: true }
    });

    // 3. Count
    const counts: Record<string, number> = {};
    for (const a of assignments) {
        if (!a.workerId) continue;
        counts[a.workerId] = (counts[a.workerId] || 0) + 1;
    }

    return counts;
}
