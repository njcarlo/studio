import { prisma } from '@studio/database/prisma';
import { getWorkloadCategories } from '@/actions/ministry-categories';
import { EmailService } from '@/services/email-service';
import { allocateMealstubs as allocateMealstubsService } from '@/services/meal-stub-service';
import { allocateStubsForConfirmation, voidStubsForConfirmation } from '@/services/meal-stub-engine';
import { createMinorMinistryAssignmentWorkflow } from '@/services/minor-ministry-assignment-workflow';
import { getUnavailableWorkerIds } from '@/services/availability';
import { canManageWorkersInMinistries, type CallerCtx } from '@/lib/auth/with-permission';
import { writeAudit } from '@/lib/audit/log';
import type {
    CreateServiceScheduleInput,
    UpdateServiceScheduleInput,
    CreateServiceTemplateInput,
    UpdateServiceTemplateInput,
    CreateWorshipSlotInput,
    UpdateWorshipSlotInput,
} from '@/lib/schemas/schedule.schemas';

/**
 * Auto-creates workload categories for role names that don't already exist on the ministry,
 * so templates / schedule assignments referencing new role names don't dangle.
 */
export async function ensureWorkloadCategoriesExist(ministryId: string, roleNames: string[]) {
    if (!roleNames.length) return;
    const existing = await getWorkloadCategories(ministryId);
    const existingNames = new Set(existing.map((c: any) => c.name.toLowerCase()));

    for (const roleName of roleNames) {
        if (!roleName.trim()) continue;
        if (!existingNames.has(roleName.trim().toLowerCase())) {
            try {
                await prisma.workloadCategory.create({
                    data: {
                        ministryId,
                        name: roleName.trim(),
                        sortOrder: existingNames.size,
                    },
                });
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
        include: { assignments: true },
    });
}

export async function getServiceSchedule(id: string) {
    return prisma.serviceSchedule.findUnique({
        where: { id },
        include: {
            assignments: { orderBy: [{ ministryId: 'asc' }, { order: 'asc' }] },
        },
    });
}

export async function createServiceSchedule(data: CreateServiceScheduleInput) {
    return prisma.serviceSchedule.create({
        data: {
            date: data.date,
            title: data.title || 'Sunday Service',
            notes: data.notes,
            createdBy: data.createdBy,
        },
    });
}

export async function updateServiceSchedule(id: string, data: UpdateServiceScheduleInput) {
    return prisma.serviceSchedule.update({ where: { id }, data });
}

export async function deleteServiceSchedule(id: string) {
    await prisma.serviceSchedule.delete({ where: { id } });
}

// ── Schedule Assignments ──────────────────────────────────────────────────────

export async function upsertAssignment(data: {
    id?: string;
    scheduleId: string;
    ministryId: string;
    roleName: string;
    workerId?: string | null;
    workerName?: string | null;
    notes?: string | null;
    rehearsalDate?: Date | null;
    rehearsalTime?: string | null;
    order?: number;
    slotType?: string;
    requestedBy?: string;
}) {
    let existing;
    if (data.id) {
        existing = await prisma.scheduleAssignment.findUnique({ where: { id: data.id } });
    }

    if (!existing) {
        existing = await prisma.scheduleAssignment.findFirst({
            where: {
                scheduleId: data.scheduleId,
                ministryId: data.ministryId,
                roleName: data.roleName,
                order: data.order ?? 0,
            },
        });
    }

    const workerIdChanged = data.workerId !== undefined && data.workerId !== (existing?.workerId ?? null);
    const clearApprovalWorkflow = workerIdChanged && !!existing?.approvalWorkflowId;

    let saved;
    if (existing) {
        saved = await prisma.scheduleAssignment.update({
            where: { id: existing.id },
            data: {
                workerId: data.workerId ?? null,
                workerName: data.workerName ?? null,
                notes: data.notes ?? null,
                rehearsalDate: data.rehearsalDate !== undefined ? data.rehearsalDate : undefined,
                rehearsalTime: data.rehearsalTime !== undefined ? data.rehearsalTime : undefined,
                slotType: data.slotType !== undefined ? data.slotType : undefined,
                ...(clearApprovalWorkflow ? { approvalWorkflowId: null } : {}),
            },
        });
    } else {
        saved = await prisma.scheduleAssignment.create({ data: {
            scheduleId: data.scheduleId,
            ministryId: data.ministryId,
            roleName: data.roleName,
            workerId: data.workerId ?? null,
            workerName: data.workerName ?? null,
            notes: data.notes ?? null,
            rehearsalDate: data.rehearsalDate ?? null,
            rehearsalTime: data.rehearsalTime ?? null,
            order: data.order ?? 0,
            slotType: data.slotType ?? 'Standard',
        }});
    }

    if (workerIdChanged && data.workerId) {
        const worker = await prisma.worker.findUnique({
            where: { id: data.workerId },
            select: { minorMinistryId: true, majorMinistryId: true },
        });
        if (worker && worker.minorMinistryId === data.ministryId && worker.majorMinistryId !== data.ministryId) {
            const workflow = await createMinorMinistryAssignmentWorkflow(saved, data.requestedBy ?? data.workerId, data.ministryId);
            saved = await prisma.scheduleAssignment.update({
                where: { id: saved.id },
                data: { approvalWorkflowId: workflow.id },
            });
        }
    }

    return saved;
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

    await ensureWorkloadCategoriesExist(
        template.ministryId,
        template.roles.map(r => r.roleName)
    );

    // Amend rather than replace, so multiple templates can be layered onto
    // the same ministry without wiping out existing assignments.
    const existing = await prisma.scheduleAssignment.findMany({
        where: { scheduleId, ministryId: template.ministryId },
        select: { roleName: true },
    });
    const countByRole = new Map<string, number>();
    for (const a of existing) {
        countByRole.set(a.roleName, (countByRole.get(a.roleName) ?? 0) + 1);
    }

    await prisma.scheduleAssignment.createMany({
        data: template.roles.flatMap(role => {
            const start = countByRole.get(role.roleName) ?? 0;
            return Array.from({ length: role.count }, (_, i) => ({
                scheduleId,
                ministryId: template.ministryId,
                roleName: role.roleName,
                order: start + i,
                notes: role.notes ?? null,
            }));
        }),
    });
}

// ── Service Templates ─────────────────────────────────────────────────────────

export async function getServiceTemplates(ministryId?: string) {
    return prisma.serviceTemplate.findMany({
        where: ministryId ? { ministryId } : undefined,
        include: { roles: { orderBy: { order: 'asc' } } },
        orderBy: [{ ministryId: 'asc' }, { name: 'asc' }],
    });
}

export async function createServiceTemplate(data: CreateServiceTemplateInput) {
    await ensureWorkloadCategoriesExist(
        data.ministryId,
        data.roles.map(r => r.roleName)
    );

    return prisma.serviceTemplate.create({
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
}

export async function updateServiceTemplate(id: string, data: UpdateServiceTemplateInput) {
    if (data.roles) {
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

    return prisma.serviceTemplate.update({
        where: { id },
        data: {
            name: data.name,
            isDefault: data.isDefault,
        },
        include: { roles: { orderBy: { order: 'asc' } } },
    });
}

export async function deleteServiceTemplate(id: string) {
    await prisma.serviceTemplate.delete({ where: { id } });
}

// ── Publish & Notify ──────────────────────────────────────────────────────────

export async function publishScheduleAndNotify(scheduleId: string, publishedBy: string) {
    const schedule = await prisma.serviceSchedule.update({
        where: { id: scheduleId },
        data: { status: 'Published' },
        include: { assignments: true },
    });

    // Meal stubs are now issued at confirm-time (see meal-stub-engine.ts),
    // not at publish-time.

    const workerIds = [...new Set(
        schedule.assignments
            .filter(a => a.workerId)
            .map(a => a.workerId as string)
    )];

    const workers = await prisma.worker.findMany({
        where: { id: { in: workerIds } }
    });

    let notifiedCount = 0;

    for (const worker of workers) {
        if (worker.email) {
            try {
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

    return { schedule, notified: notifiedCount };
}

// ── Confirm / Attendance ──────────────────────────────────────────────────────

/** True if `ctx` may confirm/decline attendance for `assignment` — its owner, or anyone who can manage workers in its ministry. */
async function canActOnAssignment(ctx: CallerCtx, assignment: { workerId: string | null; ministryId: string }): Promise<boolean> {
    if (assignment.workerId === ctx.workerId) return true;
    if (ctx.permissions.has('schedule:manage')) return true;
    return canManageWorkersInMinistries(ctx, [assignment.ministryId]);
}

export async function confirmAssignment(ctx: CallerCtx, assignmentId: string, confirmedBy: string) {
    const existing = await prisma.scheduleAssignment.findUniqueOrThrow({ where: { id: assignmentId } });

    if (!(await canActOnAssignment(ctx, existing))) {
        throw new Error('You do not have permission to confirm this assignment.');
    }

    const assignment = await prisma.scheduleAssignment.update({
        where: { id: assignmentId },
        data: {
            acknowledgedAt: new Date(),
            acknowledgedBy: confirmedBy,
            attendanceStatus: 'Confirmed',
        },
    });

    let stubsIssued = 0;
    if (existing.attendanceStatus !== 'Confirmed') {
        stubsIssued = await allocateStubsForConfirmation(ctx, assignmentId);
    }

    return { assignment, stubsIssued };
}

export async function setAttendanceStatus(ctx: CallerCtx, assignmentId: string, status: 'Confirmed' | 'Pending' | 'Not Attending', updatedBy: string) {
    const existing = await prisma.scheduleAssignment.findUniqueOrThrow({ where: { id: assignmentId } });

    if (!(await canActOnAssignment(ctx, existing))) {
        throw new Error('You do not have permission to update this assignment.');
    }

    if (existing.attendanceStatus === 'Confirmed' && status !== 'Confirmed') {
        await voidStubsForConfirmation(ctx, assignmentId);
    }

    const assignment = await prisma.scheduleAssignment.update({
        where: { id: assignmentId },
        data: {
            attendanceStatus: status,
            acknowledgedAt: status !== 'Pending' ? new Date() : null,
            acknowledgedBy: status !== 'Pending' ? updatedBy : null,
        },
    });

    let stubsIssued = 0;
    if (status === 'Confirmed' && existing.attendanceStatus !== 'Confirmed') {
        stubsIssued = await allocateStubsForConfirmation(ctx, assignmentId);
    }

    return { assignment, stubsIssued };
}

/** True if `ctx` may reassign an assignment in `ministryId` — schedule:manage, or ministry head/scheduler/manager of that ministry. */
async function canManageAssignment(ctx: CallerCtx, ministryId: string): Promise<boolean> {
    if (ctx.permissions.has('schedule:manage')) return true;
    return canManageWorkersInMinistries(ctx, [ministryId]);
}

/**
 * Emergency reassignment (SRD 5.3.5): swaps the assigned worker on a slot —
 * typically used when the original worker reports `Not Attending`. Voids any
 * meal stubs already issued to the original worker, resets attendance to
 * `Pending` for the replacement (who then runs the normal confirm flow to
 * activate their own stub), and notifies the replacement.
 */
export async function reassignAssignment(
    ctx: CallerCtx,
    assignmentId: string,
    newWorkerId: string,
    newWorkerName: string,
) {
    const existing = await prisma.scheduleAssignment.findUniqueOrThrow({
        where: { id: assignmentId },
        include: { schedule: true },
    });

    if (!(await canManageAssignment(ctx, existing.ministryId))) {
        throw new Error('You do not have permission to reassign this assignment.');
    }

    if (existing.attendanceStatus === 'Confirmed') {
        await voidStubsForConfirmation(ctx, assignmentId);
    }

    const assignment = await prisma.scheduleAssignment.update({
        where: { id: assignmentId },
        data: {
            workerId: newWorkerId,
            workerName: newWorkerName,
            attendanceStatus: 'Pending',
            acknowledgedAt: null,
            acknowledgedBy: null,
            approvalWorkflowId: null,
        },
    });

    await prisma.inAppNotification.create({
        data: {
            userId: newWorkerId,
            title: 'New assignment',
            body: `You've been assigned to "${existing.roleName}" for ${existing.schedule.title} on ${existing.schedule.date.toLocaleDateString()}. Please confirm your attendance.`,
            link: '/my-schedule',
        },
    });

    await writeAudit({
        actor: ctx, module: 'schedule', action: 'emergency_reassign',
        targetId: assignmentId, targetName: existing.roleName,
        before: { workerId: existing.workerId, workerName: existing.workerName },
        after: { workerId: newWorkerId, workerName: newWorkerName },
    });

    return { assignment };
}

// ── My Schedule (worker personal view) ────────────────────────────────────────

export async function getMyAssignments(workerId: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const assignments = await prisma.scheduleAssignment.findMany({
        where: {
            workerId,
            schedule: {
                status: 'Published',
                date: { gte: startOfToday },
            },
        },
        include: { schedule: true },
        orderBy: { schedule: { date: 'asc' } },
    });

    const workflowIds = assignments
        .map((a) => a.approvalWorkflowId)
        .filter((id): id is string => !!id);

    const workflows = workflowIds.length
        ? await prisma.approvalWorkflow.findMany({
            where: { id: { in: workflowIds } },
            select: { id: true, status: true },
        })
        : [];
    const statusById = new Map(workflows.map((w) => [w.id, w.status]));

    return assignments.map((a) => ({
        ...a,
        approvalStatus: a.approvalWorkflowId ? statusById.get(a.approvalWorkflowId) ?? null : null,
    }));
}

export async function getScheduleConfirmationStatus(scheduleId: string) {
    return prisma.scheduleAssignment.findMany({
        where: { scheduleId, workerId: { not: null } },
        select: {
            id: true, workerId: true, workerName: true,
            roleName: true, ministryId: true,
            acknowledgedAt: true, acknowledgedBy: true,
            attendanceStatus: true,
        },
    });
}

// ── Eligible Worker Search ────────────────────────────────────────────────────
// Priority 3: worker belongs to the target ministry; 2: same department; 1: global match (search only)

export async function getEligibleWorkers(params: {
    ministryId: string;
    query?: string;
    limit?: number;
    date?: Date;
}) {
    const { ministryId, query = '', limit = 200, date } = params;

    const nameFilter = query
        ? {
              OR: [
                  { firstName: { contains: query, mode: 'insensitive' as const } },
                  { lastName:  { contains: query, mode: 'insensitive' as const } },
                  { workerId:  { contains: query, mode: 'insensitive' as const } },
              ],
          }
        : {};

    const workerSelect = {
        id: true, firstName: true, lastName: true, workerId: true,
        avatarUrl: true, majorMinistryId: true, minorMinistryId: true, status: true,
    };

    // Fetch direct members, ministry meta, and unavailability in parallel.
    const [directMembers, targetMinistry, unavailableIds] = await Promise.all([
        prisma.worker.findMany({
            where: { status: 'Active', OR: [{ majorMinistryId: ministryId }, { minorMinistryId: ministryId }], ...nameFilter },
            select: workerSelect,
            take: limit,
        }),
        prisma.ministry.findUnique({ where: { id: ministryId }, select: { id: true, departmentCode: true } }),
        date ? getUnavailableWorkerIds(date) : Promise.resolve(new Set<string>()),
    ]);

    const directIds = new Set(directMembers.map(w => w.id));

    // Fetch dept siblings and (if searching) global results in parallel.
    const deptMinistryIds = targetMinistry?.departmentCode
        ? (await prisma.ministry.findMany({
              where: { departmentCode: targetMinistry.departmentCode },
              select: { id: true },
          })).map(m => m.id)
        : [];

    const [deptMembers, globalMembers] = await Promise.all([
        deptMinistryIds.length > 0
            ? prisma.worker.findMany({
                  where: {
                      status: 'Active',
                      OR: [{ majorMinistryId: { in: deptMinistryIds } }, { minorMinistryId: { in: deptMinistryIds } }],
                      id: { notIn: [...directIds] },
                      ...nameFilter,
                  },
                  select: workerSelect,
                  take: limit,
              })
            : Promise.resolve([] as typeof directMembers),
        query
            ? prisma.worker.findMany({
                  where: { status: 'Active', id: { notIn: [...directIds] }, ...nameFilter },
                  select: workerSelect,
                  take: limit,
              })
            : Promise.resolve([] as typeof directMembers),
    ]);

    // Remove dept-level hits that showed up in the global search to avoid duplicates.
    const deptIds = new Set(deptMembers.map(w => w.id));
    const filteredGlobal = globalMembers.filter(w => !deptIds.has(w.id));

    const withPriority = [
        ...directMembers.map(w => ({ ...w, priority: 3 as const })),
        ...deptMembers.map(w =>   ({ ...w, priority: 2 as const })),
        ...filteredGlobal.map(w => ({ ...w, priority: 1 as const })),
    ].map(w => ({ ...w, unavailable: unavailableIds.has(w.id) }));

    // Deprioritize (but don't hide) workers who marked themselves unavailable that day.
    return withPriority.sort((a, b) => {
        if (a.unavailable !== b.unavailable) return a.unavailable ? 1 : -1;
        return b.priority - a.priority;
    });
}

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
    return (prisma.serviceSchedule as any).update({
        where: { id },
        data: { isPublic, publicToken: token },
    });
}

export async function getPublicSchedule(token: string) {
    return (prisma.serviceSchedule as any).findUnique({
        where: { publicToken: token, isPublic: true },
        include: {
            assignments: { orderBy: [{ ministryId: 'asc' }, { order: 'asc' }] },
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

// ── Worship Slots ─────────────────────────────────────────────────────────────

export async function getWorshipSlots(scheduleId: string) {
    return prisma.worshipSlot.findMany({
        where: { scheduleId },
        include: { workers: { orderBy: { createdAt: 'asc' } } },
        orderBy: { order: 'asc' },
    });
}

export async function createWorshipSlot(data: CreateWorshipSlotInput) {
    const isTws = data.slotName.toUpperCase() === 'TWS';
    return prisma.worshipSlot.create({
        data: {
            scheduleId: data.scheduleId,
            ministryId: data.ministryId ?? null,
            slotName: data.slotName,
            isTws,
            notes: data.notes ?? null,
            order: data.order ?? 0,
        },
        include: { workers: true },
    });
}

export async function updateWorshipSlot(id: string, data: UpdateWorshipSlotInput) {
    const updateData: any = { ...data };
    if (data.slotName !== undefined) {
        updateData.isTws = data.slotName.toUpperCase() === 'TWS';
    }
    return prisma.worshipSlot.update({ where: { id }, data: updateData, include: { workers: true } });
}

export async function deleteWorshipSlot(id: string) {
    return prisma.worshipSlot.delete({ where: { id } });
}

export async function addWorkerToWorshipSlot(slotId: string, workerId: string, workerName: string, role?: string) {
    const entry = await prisma.worshipSlotWorker.create({
        data: { slotId, workerId, workerName, role: role ?? null },
    });
    const slot = await prisma.worshipSlot.findUnique({ where: { id: slotId } });
    return { entry, slot };
}

export async function removeWorkerFromWorshipSlot(id: string) {
    const entry = await prisma.worshipSlotWorker.delete({ where: { id } });
    const slot = await prisma.worshipSlot.findUnique({ where: { id: entry.slotId } });
    return { entry, slot };
}

// ── Scheduler Assignment ──────────────────────────────────────────────────────

export async function addMinistryScheduler(ministryId: string, workerId: string) {
    const ministry = await (prisma.ministry as any).findUnique({
        where: { id: ministryId },
        select: { schedulerIds: true },
    }) as { schedulerIds: string[] } | null;

    const schedulerIds = ministry?.schedulerIds ?? [];
    if (schedulerIds.includes(workerId)) return;

    await (prisma.ministry as any).update({
        where: { id: ministryId },
        data: { schedulerIds: [...schedulerIds, workerId] },
    });
}

export async function removeMinistryScheduler(ministryId: string, workerId: string) {
    const ministry = await (prisma.ministry as any).findUnique({
        where: { id: ministryId },
        select: { schedulerIds: true },
    }) as { schedulerIds: string[] } | null;

    const schedulerIds = (ministry?.schedulerIds ?? []).filter(id => id !== workerId);

    await (prisma.ministry as any).update({
        where: { id: ministryId },
        data: { schedulerIds },
    });
}

export async function getMinistrySchedulers() {
    const ministries = await (prisma.ministry as any).findMany({
        select: { id: true, name: true, schedulerIds: true },
    }) as { id: string; name: string; schedulerIds: string[] }[];

    const allSchedulerIds = [...new Set(ministries.flatMap(m => m.schedulerIds))];
    const schedulers = allSchedulerIds.length > 0
        ? await prisma.worker.findMany({
            where: { id: { in: allSchedulerIds } },
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        })
        : [];
    const schedulerById = new Map(schedulers.map(w => [w.id, w]));

    return ministries.map(m => ({
        ...m,
        schedulers: m.schedulerIds.map(id => schedulerById.get(id)).filter((w): w is NonNullable<typeof w> => !!w),
    }));
}

// ── Monthly Duty Caps ─────────────────────────────────────────────────────────

export async function getMonthlyDutyCounts(scheduleId: string) {
    const schedule = await prisma.serviceSchedule.findUnique({
        where: { id: scheduleId },
        select: { date: true }
    });
    if (!schedule) return {};

    const targetDate = new Date(schedule.date);
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

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

    const counts: Record<string, number> = {};
    for (const a of assignments) {
        if (!a.workerId) continue;
        counts[a.workerId] = (counts[a.workerId] || 0) + 1;
    }

    return counts;
}

// ── Mealstub Allocation ───────────────────────────────────────────────────────

export async function allocateMealstubs(scheduleId: string, publishedBy: string = 'system') {
    return allocateMealstubsService(scheduleId, publishedBy);
}
