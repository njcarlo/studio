"use server";

import { prisma } from '@studio/database/prisma';
import { unstable_cache } from 'next/cache';
import {
    withPermission,
    withPublicAction,
    resolveCallerCtx,
    canManageWorker,
    canManageWorkersInMinistries,
    isHRWorker,
} from '@/lib/auth/with-permission';
import { createRoleSchema, updateRoleSchema } from '@/lib/schemas/role.schemas';
import { createWorkerSchema, updateWorkerSchema } from '@/lib/schemas/worker.schemas';
import { RolesService } from '@/services/roles';
import { WorkersService } from '@/services/workers';
import { PERMISSIONS } from '@/lib/permissions/registry';
import { revalidatePath } from 'next/cache';
import { NotificationService } from '@/services/notification-service';
import * as mealsAttendanceService from '@/services/meals-attendance';
import {
    createMealStubSchema,
    updateMealStubSchema,
    createAttendanceRecordSchema,
} from '@/lib/schemas/meals-attendance.schemas';

const DEPARTMENT_NAME_TO_CODE: Record<string, string> = {
    Worship: 'W',
    Outreach: 'O',
    Relationship: 'R',
    Discipleship: 'D',
    Administration: 'A',
};

const DEPARTMENT_CODE_TO_NAME: Record<string, string> = {
    W: 'Worship',
    O: 'Outreach',
    R: 'Relationship',
    D: 'Discipleship',
    A: 'Administration',
};

function normalizeDepartmentCode(input: string | null | undefined): string {
    if (!input) return 'D';
    const trimmed = input.trim();
    if (!trimmed) return 'D';

    if (trimmed.length === 1) {
        const code = trimmed.toUpperCase();
        return DEPARTMENT_CODE_TO_NAME[code] ? code : 'D';
    }

    return DEPARTMENT_NAME_TO_CODE[trimmed] || 'D';
}

function mapMinistryForClient(ministry: any) {
    const departmentCode = ministry.departmentCode;
    return {
        ...ministry,
        department: DEPARTMENT_CODE_TO_NAME[departmentCode] || 'Discipleship',
        departmentCode,
    };
}

// --- Roles ---

// public-action: read-only, used by permission editor and role syncer
export async function getRoles() {
    return await prisma.role.findMany({
        include: {
            rolePermissions: {
                include: { permission: true },
            },
        },
        orderBy: { name: 'asc' },
    });
}

// public-action: read-only
export async function getRoleById(id: string) {
    return await prisma.role.findUnique({
        where: { id },
        include: {
            rolePermissions: {
                include: { permission: true },
            },
        },
    });
}

// --- Permissions ---

// public-action: read-only, used by permission editor
export async function getPermissions() {
    return await prisma.permission.findMany({
        orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
}

export const setRolePermissions = withPermission(
    PERMISSIONS.roles.update,
    async (_ctx, roleId: string, permissionIds: string[]) => {
        await prisma.rolePermission.deleteMany({ where: { roleId } });
        if (permissionIds.length > 0) {
            await prisma.rolePermission.createMany({
                data: permissionIds.map(permissionId => ({ roleId, permissionId })),
            });
        }
        revalidatePath('/settings/roles');
    },
    { auditAction: 'roles:update:permissions' },
);

/** Set permissions using "module:action" strings instead of UUIDs. */
export const setRolePermissionsByKeys = withPermission(
    PERMISSIONS.roles.update,
    async (_ctx, roleId: string, permKeys: string[]) => {
        if (permKeys.length === 0) {
            await prisma.rolePermission.deleteMany({ where: { roleId } });
            revalidatePath('/settings/roles');
            return;
        }

        const allPerms = await prisma.permission.findMany();
        const permMap = new Map(allPerms.map(p => [`${p.module}:${p.action}`, p.id]));

        const missing = permKeys.filter(k => !permMap.has(k));
        for (const key of missing) {
            const [module, ...actionParts] = key.split(':');
            const action = actionParts.join(':');
            if (!module || !action) continue;
            const created = await prisma.permission.upsert({
                where: { module_action: { module, action } },
                update: {},
                create: { module, action },
            });
            permMap.set(key, created.id);
        }

        const ids = permKeys.map(k => permMap.get(k)).filter(Boolean) as string[];
        await prisma.rolePermission.deleteMany({ where: { roleId } });
        if (ids.length > 0) {
            await prisma.rolePermission.createMany({
                data: ids.map(permissionId => ({ roleId, permissionId })),
            });
        }
        revalidatePath('/settings/roles');
    },
    { auditAction: 'roles:update:permissions-by-keys' },
);

// --- WorkerRole ---

// public-action: read-only, used by worker profile page
export async function getWorkerRoles(workerId: string) {
    return await prisma.workerRole.findMany({
        where: { workerId },
        include: {
            role: {
                include: {
                    rolePermissions: { include: { permission: true } },
                },
            },
        },
    });
}

export const assignRolesToWorker = withPermission(
    PERMISSIONS.roles.assign,
    async (_ctx, workerId: string, roleIds: string[], assignedBy?: string) => {
        // Remove roles not in the new list
        await prisma.workerRole.deleteMany({
            where: { workerId, roleId: { notIn: roleIds } },
        });
        // Add any new roles
        for (const roleId of roleIds) {
            await prisma.workerRole.upsert({
                where: { workerId_roleId: { workerId, roleId } },
                update: {},
                create: { workerId, roleId, assignedBy },
            });
        }
        // Keep legacy roleId in sync (use first role as primary)
        if (roleIds.length > 0) {
            await prisma.worker.update({
                where: { id: workerId },
                data: { roleId: roleIds[0] },
            });
        }
        revalidatePath('/workers');
    },
);

/**
 * Assigns the fixed lowest-privilege "viewer" role to a brand-new
 * self-registered worker during signup. Intentionally bypasses
 * `requirePermission` — a freshly created account has no permissions yet —
 * and only ever assigns the single hardcoded "viewer" role, so it cannot
 * be used for privilege escalation.
 */
export async function assignViewerRoleOnSignup(workerId: string) {
    await prisma.workerRole.upsert({
        where: { workerId_roleId: { workerId, roleId: 'viewer' } },
        update: {},
        create: { workerId, roleId: 'viewer' },
    });
    await prisma.worker.update({
        where: { id: workerId },
        data: { roleId: 'viewer' },
    });
    revalidatePath('/workers');
}

export const createRole = withPermission(
    PERMISSIONS.roles.create,
    async (_ctx, data: any) => {
        const input = createRoleSchema.parse(data);
        const role = await RolesService.createRole({ ...input, permissions: data.permissions });
        revalidatePath('/settings/roles');
        return role;
    },
);

// public-action: one-time system bootstrap. Seeds the default role set and promotes
// the calling worker to System Administrator — but ONLY while no Role rows exist yet
// (i.e. the system has never been initialized). Once any role exists this always
// fails, so it cannot be replayed for privilege escalation after setup.
export const claimSystemAdmin = withPublicAction(async () => {
    const ctx = await resolveCallerCtx();
    if (!ctx) throw new Error('You must be logged in to do this.');

    const existingRoleCount = await prisma.role.count();
    if (existingRoleCount > 0) {
        throw new Error('The system has already been initialized.');
    }

    const rolesData: { id: string; name: string; permissions: string[]; isSuperAdmin?: boolean; isSystemRole?: boolean }[] = [
        { id: 'admin', name: 'Admin', permissions: [], isSuperAdmin: true, isSystemRole: true },
        { id: 'approver', name: 'Approver', permissions: ['manage_approvals'], isSystemRole: true },
        { id: 'editor', name: 'Editor', permissions: ['manage_ministries', 'manage_rooms'], isSystemRole: true },
        { id: 'viewer', name: 'Viewer', permissions: [], isSystemRole: true },
    ];

    await prisma.$transaction([
        ...rolesData.map((role) =>
            prisma.role.upsert({
                where: { id: role.id },
                update: { name: role.name, permissions: role.permissions, isSuperAdmin: role.isSuperAdmin ?? false, isSystemRole: role.isSystemRole ?? false },
                create: { id: role.id, name: role.name, permissions: role.permissions, isSuperAdmin: role.isSuperAdmin ?? false, isSystemRole: role.isSystemRole ?? false },
            }),
        ),
        prisma.worker.update({
            where: { id: ctx.workerId },
            data: { roleId: 'admin', status: 'Active' },
        }),
    ]);

    revalidatePath('/workers');
    revalidatePath('/settings');
});

export const updateRole = withPermission(
    PERMISSIONS.roles.update,
    async (_ctx, id: string, data: any) => {
        const input = updateRoleSchema.parse(data);
        const role = await RolesService.updateRole(id, input);
        revalidatePath('/settings/roles');
        return role;
    },
);

export const deleteRole = withPermission(
    PERMISSIONS.roles.delete,
    async (_ctx, id: string) => {
        await RolesService.deleteRole(id);
        revalidatePath('/settings/roles');
    },
);

// --- Workers ---

export async function getWorkers() {
    return await prisma.worker.findMany({
        include: {
            role: true,
            roles: { include: { role: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
}

// Minimal projection of every worker — for ministry rosters, member pickers,
// and other UI that needs to list/lookup all workers by id without paying
// for the full record (roles, contact info, etc.) on every fetch.
export async function getWorkersLite() {
    return await prisma.worker.findMany({
        select: {
            id: true,
            workerId: true,
            firstName: true,
            lastName: true,
            email: true,
            roleId: true,
            status: true,
            avatarUrl: true,
            majorMinistryId: true,
            minorMinistryId: true,
            capabilities: true,
        },
        orderBy: { createdAt: 'desc' },
    });
}

export async function getPaginatedWorkers(
    page: number = 1,
    limit: number = 25,
    filters: {
        search?: string;
        searchMode?: 'workerId' | 'name';
        ministryIds?: string[];
        status?: string;
        sortField?: string;
        sortDir?: 'asc' | 'desc';
    } = {}
) {
    const where: any = {};
    if (filters.ministryIds && filters.ministryIds.length > 0) {
        where.OR = [
            { majorMinistryId: { in: filters.ministryIds } },
            { minorMinistryId: { in: filters.ministryIds } }
        ];
    }
    if (filters.search) {
        const q = filters.search.trim();
        const mode = filters.searchMode || 'workerId';
        where.AND = [{
            OR: mode === 'workerId'
                ? [{ workerId: { contains: q, mode: 'insensitive' } }]
                : [
                    { firstName: { contains: q, mode: 'insensitive' } },
                    { lastName: { contains: q, mode: 'insensitive' } },
                ]
        }];
    }

    const sortField = filters.sortField || 'workerId';
    const sortDir = filters.sortDir || 'asc';
    const offset = (page - 1) * limit;

    // Build ORDER BY
    let orderByClause: string;
    if (sortField === 'workerId') {
        orderByClause = `"workerId" ${sortDir.toUpperCase()} NULLS LAST`;
    } else if (sortField === 'name') {
        orderByClause = `"firstName" ${sortDir.toUpperCase()}, "lastName" ${sortDir.toUpperCase()}`;
    } else if (sortField === 'status') {
        orderByClause = `"status" ${sortDir.toUpperCase()}`;
    } else {
        orderByClause = `"createdAt" DESC`;
    }

    // Build WHERE conditions for raw query
    const conditions: string[] = [];
    const queryParams: any[] = [];
    let paramIdx = 1;

    if (filters.ministryIds && filters.ministryIds.length > 0) {
        const ids = filters.ministryIds;
        const majorPlaceholders = ids.map(() => `$${paramIdx++}`).join(', ');
        const minorPlaceholders = ids.map(() => `$${paramIdx++}`).join(', ');
        conditions.push(`("majorMinistryId" IN (${majorPlaceholders}) OR "minorMinistryId" IN (${minorPlaceholders}))`);
        queryParams.push(...ids, ...ids);
    }

    if (filters.status) {
        conditions.push(`"status" = $${paramIdx++}`);
        queryParams.push(filters.status);
    }

    if (filters.search) {
        const q = `%${filters.search.trim()}%`;
        if (filters.searchMode === 'name') {
            conditions.push(`("firstName" ILIKE $${paramIdx} OR "lastName" ILIKE $${paramIdx})`);
            queryParams.push(q);
            paramIdx++;
        } else {
            conditions.push(`"workerId" ILIKE $${paramIdx}`);
            queryParams.push(q);
            paramIdx++;
        }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Run count + paginated fetch in parallel
    const [countResult, workers] = await Promise.all([
        prisma.$queryRawUnsafe<[{ count: bigint }]>(
            `SELECT COUNT(*) as count FROM "Worker" ${whereClause}`,
            ...queryParams
        ),
        prisma.$queryRawUnsafe<any[]>(
            `SELECT id, "workerId", "firstName", "lastName", email, phone, "roleId", status,
                    "avatarUrl", "majorMinistryId", "minorMinistryId", "employmentType",
                    "passwordChangeRequired", "qrToken", "createdAt", "capabilities"
             FROM "Worker"
             ${whereClause}
             ORDER BY ${orderByClause}
             LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
            ...queryParams, limit, offset
        ),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    return { total, workers, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getWorkerStats(ministryIds?: string[]) {
    const where: any = {};
    if (ministryIds && ministryIds.length > 0) {
        where.OR = [
            { majorMinistryId: { in: ministryIds } },
            { minorMinistryId: { in: ministryIds } }
        ];
    }

    // Use DB-level counts — much faster than fetching all rows
    const [total, active, inactive] = await prisma.$transaction([
        prisma.worker.count({ where }),
        prisma.worker.count({ where: { ...where, status: 'Active' } }),
        prisma.worker.count({ where: { ...where, status: 'Inactive' } }),
    ]);
    const secondary = 0; // legacy field — skip expensive query

    let ministryStats: { ministryId: string; total: number; active: number; inactive: number; secondary: number }[] = [];

    if (ministryIds?.length) {
        ministryStats = await Promise.all(ministryIds.map(async (id) => {
            const [total, active] = await prisma.$transaction([
                prisma.worker.count({ where: { OR: [{ majorMinistryId: id }, { minorMinistryId: id }] } }),
                prisma.worker.count({ where: { OR: [{ majorMinistryId: id }, { minorMinistryId: id }], status: 'Active' } }),
            ]);
            return { ministryId: id, total, active, inactive: total - active, secondary: 0 };
        }));
    }

    return { total, active, inactive, secondary, ministryStats };
}

export async function getWorkerById(id: string) {
    try {
        return await prisma.worker.findUnique({
            where: { id },
            include: {
                role: true,
                roles: {
                    include: {
                        role: {
                            include: {
                                rolePermissions: { include: { permission: true } },
                            },
                        },
                    },
                },
            },
        });
    } catch {
        // Fallback if rolePermissions table doesn't exist yet
        return await prisma.worker.findUnique({
            where: { id },
            include: { role: true },
        });
    }
}

export async function getWorkerByEmail(email: string) {
    try {
        return await prisma.worker.findUnique({
            where: { email },
            include: {
                role: true,
                roles: {
                    include: {
                        role: {
                            include: {
                                rolePermissions: { include: { permission: true } },
                            },
                        },
                    },
                },
            },
        });
    } catch {
        return await prisma.worker.findUnique({
            where: { email },
            include: { role: true },
        });
    }
}

// public-action: createWorker used during signup/ORS import — must remain open.
// Only callers with worker-management permission over the target ministry may set
// privileged fields (role, status, ministries, employment type, RBAC flags,
// sub-ministry); everyone else gets the same safe defaults the signup form sends.
export const createWorker = withPublicAction(async (data: any) => {
    try {
        const input = createWorkerSchema.parse(data);

        const ctx = await resolveCallerCtx();
        const authorized = ctx
            ? await canManageWorkersInMinistries(ctx, [input.majorMinistryId, input.minorMinistryId])
            : false;

        const safeInput = authorized
            ? input
            : {
                ...input,
                roleId: 'viewer',
                status: 'Pending Approval',
                flags: undefined,
                subMinistryId: undefined,
                employmentType: undefined,
                majorMinistryId: undefined,
                minorMinistryId: undefined,
            };

        const worker = await WorkersService.createWorker(safeInput);
        revalidatePath('/workers');
        return worker;
    } catch (err: any) {
        console.error('[createWorker] error:', err?.message, err?.code);
        if (err?.code === 'P2002') throw new Error('A worker with this email already exists.');
        throw new Error(err?.message ?? 'Failed to create worker');
    }
});

// public-action: updateWorker used by the profile page (self-service) and admin worker
// management. Self-service fields below may always be changed on the caller's own
// record. Any other field (role, status, ministries, employment type, RBAC flags,
// sub-ministry, etc.) — or any change to someone else's record — requires
// worker-management permission, resolved server-side via resolveCallerCtx().
const SELF_SERVICE_WORKER_FIELDS = new Set<string>([
    'firstName', 'lastName', 'phone', 'address', 'avatarUrl', 'qrToken',
    'passwordChangeRequired', 'firstLogin', 'birthday', 'gender',
]);

export const updateWorker = withPublicAction(async (id: string, data: any) => {
    const input = updateWorkerSchema.parse(data);
    const fields = Object.keys(input);

    if (fields.length > 0) {
        const ctx = await resolveCallerCtx();
        const isSelfServiceOnly = fields.every((f) => SELF_SERVICE_WORKER_FIELDS.has(f));
        const isSelfProfileEdit = isSelfServiceOnly && ctx?.workerId === id;

        if (!isSelfProfileEdit) {
            if (!ctx) throw new Error('You must be logged in to do this.');
            if (!(await canManageWorker(ctx, id))) {
                throw new Error('You do not have permission to update this worker.');
            }
            if ('employmentType' in input) {
                const canChangeType =
                    ctx.isSuperAdmin ||
                    ctx.permissions.has('worker_type:change') ||
                    (await isHRWorker(ctx.workerId));
                if (!canChangeType) {
                    throw new Error('You do not have permission to change Worker Type.');
                }
            }
        }
    }

    const worker = await WorkersService.updateWorker(id, input);
    revalidatePath('/workers');
    return worker;
});

// public-action: kiosk unlock screen — checks the shared scanner password
// server-side against KIOSK_SCANNER_PASSWORD so it never ships in the client bundle.
export const verifyKioskPassword = withPublicAction(async (password: string) => {
    const expected = process.env.KIOSK_SCANNER_PASSWORD;
    if (!expected) return false;
    return password === expected;
});

export const deleteWorker = withPermission(
    PERMISSIONS.workers.delete,
    async (_ctx, id: string) => {
        await WorkersService.deleteWorker(id);
        revalidatePath('/workers');
    },
);

export const deleteWorkers = withPermission(
    PERMISSIONS.workers.delete,
    async (_ctx, ids: string[]) => {
        await WorkersService.deleteWorkers(ids);
        revalidatePath('/workers');
    },
);

// --- Approvals ---

export async function createApproval(data: any) {
    const approval = await prisma.approvalRequest.create({
        data: {
            ...data,
            date: new Date(),
        },
    });

    // Trigger async notification
    NotificationService.notifyNewRequest(approval);

    return approval;
}

export async function getApprovals(scope?: {
    workerId?: string;
    ministryIds?: string[];
    isSuperAdmin?: boolean;
}) {
    const where = buildApprovalScope(scope);
    return await prisma.approvalRequest.findMany({
        where,
        orderBy: { date: 'desc' },
        include: {
            worker: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    majorMinistryId: true,
                    minorMinistryId: true,
                },
            },
        },
    });
}

function buildApprovalScope(scope?: {
    workerId?: string;
    ministryIds?: string[];
    isSuperAdmin?: boolean;
}) {
    if (!scope || scope.isSuperAdmin || !scope.ministryIds?.length) return undefined;
    const ids = scope.ministryIds;
    return {
        OR: [
            { worker: { OR: [{ majorMinistryId: { in: ids } }, { minorMinistryId: { in: ids } }] } },
            { type: 'Room Booking' },
            { oldMajorId: { in: ids } },
            { oldMinorId: { in: ids } },
            { newMajorId: { in: ids } },
            { newMinorId: { in: ids } },
        ],
    };
}

// Returns the next valid status for an approve/reject action, or null if the transition is invalid.
function resolveNextApprovalStatus(
    type: string,
    currentStatus: string,
    action: 'approve' | 'reject',
): { nextStatus: string; outgoingApproved?: boolean } | null {
    if (action === 'reject') {
        const rejectableStatuses = [
            'Pending', 'Pending Ministry Approval', 'Pending Admin Approval',
            'Pending Outgoing Approval', 'Pending Incoming Approval',
        ];
        if (!rejectableStatuses.includes(currentStatus)) return null;
        return { nextStatus: 'Rejected' };
    }

    if (type === 'Room Booking') {
        if (currentStatus === 'Pending' || currentStatus === 'Pending Ministry Approval') {
            return { nextStatus: 'Pending Admin Approval' };
        }
        if (currentStatus === 'Pending Admin Approval') return { nextStatus: 'Approved' };
        return null;
    }

    if (type === 'Ministry Change') {
        if (currentStatus === 'Pending Outgoing Approval') {
            return { nextStatus: 'Pending Incoming Approval', outgoingApproved: true };
        }
        if (currentStatus === 'Pending Incoming Approval' || currentStatus === 'Pending') {
            return { nextStatus: 'Approved' };
        }
        return null;
    }

    // New Worker, Profile Update, Events — single-stage
    if (currentStatus === 'Pending') return { nextStatus: 'Approved' };
    return null;
}

/**
 * Intent-based approval action. Handles multi-stage state machines and
 * executes all side-effects atomically in a Prisma transaction.
 */
export async function respondToApproval(
    id: string,
    action: 'approve' | 'reject',
): Promise<{ approval: any; nextStatus: string }> {
    const current = await prisma.approvalRequest.findUniqueOrThrow({ where: { id } });
    const transition = resolveNextApprovalStatus(current.type, current.status, action);
    if (!transition) {
        throw new Error(
            `Invalid transition: cannot ${action} a "${current.type}" request in status "${current.status}"`,
        );
    }

    const { nextStatus, outgoingApproved } = transition;
    const updateData: any = { status: nextStatus };
    if (outgoingApproved !== undefined) updateData.outgoingApproved = outgoingApproved;

    const approval = await prisma.$transaction(async (tx) => {
        const updated = await tx.approvalRequest.update({ where: { id }, data: updateData });

        if (nextStatus === 'Approved') {
            if (updated.type === 'New Worker' && updated.workerId) {
                await tx.worker.update({ where: { id: updated.workerId }, data: { status: 'Active' } });
            }
            if (updated.type === 'Ministry Change' && updated.workerId) {
                await tx.worker.update({
                    where: { id: updated.workerId },
                    data: {
                        majorMinistryId: updated.newMajorId || '',
                        minorMinistryId: updated.newMinorId || '',
                    },
                });
            }
            if (updated.type === 'Room Booking' && updated.reservationId) {
                await tx.booking.update({ where: { id: updated.reservationId }, data: { status: 'Approved' } });
            }
        }

        if (nextStatus === 'Rejected' && updated.type === 'Room Booking' && updated.reservationId) {
            await tx.booking.update({ where: { id: updated.reservationId }, data: { status: 'Rejected' } });
        }

        return updated;
    });

    revalidatePath('/approvals');
    revalidatePath('/dashboard');
    return { approval, nextStatus };
}

export const updateApproval = withPermission(
    PERMISSIONS.approvals.manage,
    async (_ctx, id: string, data: any) => {
        const approval = await prisma.approvalRequest.update({ where: { id }, data });
        revalidatePath('/approvals');
        revalidatePath('/dashboard');
        return approval;
    }
);

// --- Ministries ---

export async function getMinistries() {
    const ministries = await prisma.ministry.findMany({
        include: {
            department: true,
        },
        orderBy: [
            { department: { weight: 'asc' } },
            { weight: 'asc' },
            { name: 'asc' },
        ],
    });

    return ministries.map(mapMinistryForClient);
}

export const createMinistry = withPermission(
    PERMISSIONS.ministries.manage,
    async (_ctx, data: any) => {
        const departmentCode = normalizeDepartmentCode(data.departmentCode || data.department);
        const { department, departmentCode: _departmentCode, ...rest } = data;
        const ministry = await prisma.ministry.create({
            data: {
                ...rest,
                department: {
                    connect: { code: departmentCode },
                },
            },
            include: {
                department: true,
            },
        });
        revalidatePath('/ministries');
        return mapMinistryForClient(ministry);
    }
);

export const updateMinistry = withPermission(
    PERMISSIONS.ministries.manage,
    async (_ctx, id: string, data: any) => {
        const departmentCode = data.department || data.departmentCode
            ? normalizeDepartmentCode(data.departmentCode || data.department)
            : null;

        const { department, departmentCode: _departmentCode, ...rest } = data;
        const updateData: any = { ...rest };

        if (departmentCode) {
            updateData.department = {
                connect: { code: departmentCode },
            };
        }

        const ministry = await prisma.ministry.update({
            where: { id },
            data: updateData,
            include: {
                department: true,
            },
        });
        revalidatePath('/ministries');
        return mapMinistryForClient(ministry);
    }
);

export const createMinistries = withPermission(
    PERMISSIONS.ministries.manage,
    async (_ctx, data: any[]) => {
        let createdCount = 0;

        for (const row of data) {
            const departmentCode = normalizeDepartmentCode(row.departmentCode || row.department);
            const { department, departmentCode: _departmentCode, ...rest } = row;

            const existing = await prisma.ministry.findFirst({
                where: {
                    OR: [
                        { id: rest.id },
                        { name: { equals: rest.name, mode: 'insensitive' } },
                    ],
                },
                select: { id: true },
            });

            if (existing) continue;

            await prisma.ministry.create({
                data: {
                    ...rest,
                    department: {
                        connect: { code: departmentCode },
                    },
                },
            });
            createdCount++;
        }

        revalidatePath('/ministries');
        return { count: createdCount };
    }
);

export const deleteMinistry = withPermission(
    PERMISSIONS.ministries.manage,
    async (_ctx, id: string) => {
        await prisma.ministry.delete({ where: { id } });
        revalidatePath('/ministries');
    }
);

// --- Bookings ---

export async function getBookings(filters: {
    workerProfileId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    roomId?: string;
    status?: string;
} = {}) {
    const where: any = {};
    if (filters.workerProfileId) {
        where.workerProfileId = filters.workerProfileId;
    }
    if (filters.roomId) {
        where.roomId = filters.roomId;
    }
    if (filters.status) {
        where.status = filters.status;
    }
    if (filters.dateFrom || filters.dateTo) {
        where.start = {
            ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
            ...(filters.dateTo ? { lte: filters.dateTo } : {}),
        };
    }

    return await prisma.booking.findMany({
        where,
        include: {
            room: true,
            worker: true,
        },
        orderBy: {
            start: 'asc',
        },
    });
}

export async function getBookingsForRoomOnDate(roomId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return prisma.booking.findMany({
        where: {
            roomId,
            start: { gte: startOfDay, lte: endOfDay },
        },
    });
}

export const createBooking = withPermission(
    PERMISSIONS.venues.create,
    async (_ctx, data: any) => {
        const { workerProfileId, roomId, ...rest } = data;
        if (!workerProfileId) throw new Error('workerProfileId is required to create a booking');
        if (!roomId) throw new Error('roomId is required to create a booking');

        // Strip fields not in the Booking schema to avoid Prisma validation errors
        const {
            requesterEmail: _re, dateRequested: _dr,
            ...cleanRest
        } = rest;

        try {
            const booking = await prisma.booking.create({
                data: { ...cleanRest, workerProfileId, roomId },
            });
            revalidatePath('/reservations');
            revalidatePath('/dashboard');
            return booking;
        } catch (err: any) {
            console.error('[createBooking] Prisma error:', err);
            throw new Error(`Failed to create booking: ${err.message || 'Unknown error'}`);
        }
    }
);

export const updateBooking = withPermission(
    PERMISSIONS.venues.update,
    async (_ctx, id: string, data: any) => {
        const booking = await prisma.booking.update({
            where: { id },
            data,
        });
        revalidatePath('/reservations');
        revalidatePath('/dashboard');
        return booking;
    }
);

export const deleteBooking = withPermission(
    PERMISSIONS.venues.delete,
    async (_ctx, id: string) => {
        await prisma.booking.delete({ where: { id } });
        revalidatePath('/reservations');
        revalidatePath('/dashboard');
    }
);

// --- Meal Stubs ---

export async function getMealStubs(filters: { workerId?: string; dateFrom?: Date; dateTo?: Date } = {}) {
    return mealsAttendanceService.getMealStubs(filters);
}

export const createMealStub = withPermission(
    PERMISSIONS.meals.manage,
    async (_ctx, data: {
        workerId: string;
        workerName: string;
        status: string;
        stubType?: string;
        assignedBy?: string;
        assignedByName?: string;
        date?: Date;
        scheduleId?: string;
    }) => {
        return mealsAttendanceService.createMealStub(createMealStubSchema.parse(data));
    }
);

export const updateMealStub = withPermission(
    PERMISSIONS.meals.manage,
    async (_ctx, id: string, data: any) => {
        const stub = await mealsAttendanceService.updateMealStub(id, updateMealStubSchema.parse(data));
        revalidatePath('/meals');
        return stub;
    }
);

export const deleteMealStub = withPermission(
    PERMISSIONS.meals.manage,
    async (_ctx, id: string) => {
        await mealsAttendanceService.deleteMealStub(id);
        revalidatePath('/meals');
    }
);

// --- Attendance ---

export async function getAttendanceRecords(filters: { workerProfileId?: string; dateFrom?: Date; dateTo?: Date } = {}) {
    return mealsAttendanceService.getAttendanceRecords(filters);
}

export const createAttendanceRecord = withPermission(
    PERMISSIONS.attendance.scan,
    async (_ctx, data: { workerProfileId: string; type: string }) => {
        const record = await mealsAttendanceService.createAttendanceRecord(createAttendanceRecordSchema.parse(data));
        revalidatePath('/attendance');
        return record;
    }
);

// --- Rooms, Areas, Branches ---

export async function getRooms() {
    return await prisma.room.findMany({
        include: {
            area: {
                include: {
                    branch: true,
                },
            },
        },
        orderBy: {
            weight: 'asc',
        },
    });
}

export const createRoom = withPermission(
    PERMISSIONS.facilities.manage,
    async (_ctx, data: any) => {
        const room = await prisma.room.create({ data });
        revalidatePath('/settings/rooms');
        return room;
    }
);

export const updateRoom = withPermission(
    PERMISSIONS.facilities.manage,
    async (_ctx, id: string, data: any) => {
        const room = await prisma.room.update({
            where: { id },
            data,
        });
        revalidatePath('/settings/rooms');
        return room;
    }
);

export const deleteRoom = withPermission(
    PERMISSIONS.facilities.manage,
    async (_ctx, id: string) => {
        await prisma.room.delete({ where: { id } });
        revalidatePath('/settings/rooms');
    }
);

export const createRooms = withPermission(
    PERMISSIONS.facilities.manage,
    async (_ctx, data: any[]) => {
        await prisma.room.createMany({ data });
        revalidatePath('/settings/rooms');
    }
);

export async function getAreas() {
    return await prisma.area.findMany({
        include: {
            branch: true,
        },
        orderBy: {
            name: 'asc',
        },
    });
}

export const createArea = withPermission(
    PERMISSIONS.facilities.manage,
    async (_ctx, data: any) => {
        const area = await prisma.area.create({ data });
        revalidatePath('/settings/rooms');
        return area;
    }
);

export const updateArea = withPermission(
    PERMISSIONS.facilities.manage,
    async (_ctx, id: string, data: any) => {
        const area = await prisma.area.update({
            where: { id },
            data,
        });
        revalidatePath('/settings/rooms');
        return area;
    }
);

export const deleteArea = withPermission(
    PERMISSIONS.facilities.manage,
    async (_ctx, id: string) => {
        await prisma.area.delete({ where: { id } });
        revalidatePath('/settings/rooms');
    }
);

export const createAreas = withPermission(
    PERMISSIONS.facilities.manage,
    async (_ctx, data: any[]) => {
        await prisma.area.createMany({ data });
        revalidatePath('/settings/rooms');
    }
);

export async function getBranches() {
    return await prisma.branch.findMany({
        orderBy: {
            name: 'asc',
        },
    });
}

export const createBranch = withPermission(
    PERMISSIONS.facilities.manage,
    async (_ctx, data: any) => {
        const branch = await prisma.branch.create({ data });
        revalidatePath('/settings/rooms');
        return branch;
    }
);

export const updateBranch = withPermission(
    PERMISSIONS.facilities.manage,
    async (_ctx, id: string, data: any) => {
        const branch = await prisma.branch.update({
            where: { id },
            data,
        });
        revalidatePath('/settings/rooms');
        return branch;
    }
);

export const deleteBranch = withPermission(
    PERMISSIONS.facilities.manage,
    async (_ctx, id: string) => {
        await prisma.branch.delete({ where: { id } });
        revalidatePath('/settings/rooms');
    }
);

// --- Scan Logs ---

export async function getScanLogs(limit: number = 100) {
    return await prisma.scanLog.findMany({
        take: limit,
        orderBy: {
            timestamp: 'desc',
        },
    });
}

export const createScanLog = withPermission(
    PERMISSIONS.attendance.scan,
    async (_ctx, data: any) => {
        return await prisma.scanLog.create({
            data: {
                ...data,
                timestamp: new Date(),
            },
        });
    }
);

// --- C2S ---

export async function getC2SGroups() {
    return await prisma.c2SGroup.findMany({
        include: {
            mentees: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
}

export async function getC2SMentees() {
    return await prisma.c2SMentee.findMany({
        include: {
            group: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
}

export const createC2SGroup = withPermission(
    PERMISSIONS.mentorship.manage,
    async (_ctx, data: {
        name: string;
        mentorId: string;
        menteeIds?: string[];
    }) => {
        const group = await prisma.c2SGroup.create({
            data: {
                name: data.name,
                mentorId: data.mentorId,
                menteeIds: data.menteeIds ?? [],
            },
        });
        revalidatePath('/c2s');
        return group;
    }
);

export const updateC2SGroup = withPermission(
    PERMISSIONS.mentorship.manage,
    async (_ctx, id: string, data: { name?: string; mentorId?: string; menteeIds?: string[] }) => {
        const group = await prisma.c2SGroup.update({
            where: { id },
            data,
        });
        revalidatePath('/c2s');
        return group;
    }
);

export const deleteC2SGroup = withPermission(
    PERMISSIONS.mentorship.manage,
    async (_ctx, id: string) => {
        await prisma.c2SGroup.delete({ where: { id } });
        revalidatePath('/c2s');
    }
);

export const createC2SMentee = withPermission(
    PERMISSIONS.mentorship.manage,
    async (_ctx, data: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        status: string;
        groupId: string;
        mentorId: string;
    }) => {
        const mentee = await prisma.c2SMentee.create({ data });
        revalidatePath('/c2s');
        return mentee;
    }
);

export const updateC2SMentee = withPermission(
    PERMISSIONS.mentorship.manage,
    async (_ctx, id: string, data: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        status?: string;
        groupId?: string;
        mentorId?: string;
    }) => {
        const mentee = await prisma.c2SMentee.update({
            where: { id },
            data,
        });
        revalidatePath('/c2s');
        return mentee;
    }
);

export const deleteC2SMentee = withPermission(
    PERMISSIONS.mentorship.manage,
    async (_ctx, id: string) => {
        await prisma.c2SMentee.delete({ where: { id } });
        revalidatePath('/c2s');
    }
);

// --- Venue Elements ---

export async function getVenueElements() {
    return await prisma.venueElement.findMany({
        orderBy: {
            name: 'asc',
        },
    });
}

export const createVenueElement = withPermission(
    PERMISSIONS.facilities.manage,
    async (_ctx, data: any) => {
        const element = await prisma.venueElement.create({ data });
        revalidatePath('/settings/venue-elements');
        revalidatePath('/settings/rooms');
        return element;
    }
);

export const updateVenueElement = withPermission(
    PERMISSIONS.facilities.manage,
    async (_ctx, id: string, data: any) => {
        const element = await prisma.venueElement.update({
            where: { id },
            data,
        });
        revalidatePath('/settings/venue-elements');
        revalidatePath('/settings/rooms');
        return element;
    }
);

export const deleteVenueElement = withPermission(
    PERMISSIONS.facilities.manage,
    async (_ctx, id: string) => {
        await prisma.venueElement.delete({ where: { id } });
        revalidatePath('/settings/venue-elements');
        revalidatePath('/settings/rooms');
    }
);

// --- Batch Ministry Update ---

export const updateWorkersMinistries = withPermission(
    PERMISSIONS.workers.update,
    async (_ctx, ids: string[], majorMinistryId?: string, minorMinistryId?: string) => {
        const data: any = {};
        if (majorMinistryId !== undefined) data.majorMinistryId = majorMinistryId;
        if (minorMinistryId !== undefined) data.minorMinistryId = minorMinistryId;

        await prisma.worker.updateMany({
            where: { id: { in: ids } },
            data,
        });
        revalidatePath('/workers');
    }
);

// --- Settings ---

export async function getSetting(id: string) {
    const setting = await prisma.setting.findUnique({
        where: { id },
    });
    return (setting?.data as any) || null;
}

export const updateSetting = withPermission(
    null, // super-admin only
    async (_ctx, id: string, data: any) => {
        const setting = await prisma.setting.upsert({
            where: { id },
            update: { data },
            create: { id, data },
        });
        revalidatePath('/settings');
        return setting.data;
    }
);

// --- Department Settings ---

export async function getDepartmentSettings() {
    return await prisma.departmentSetting.findMany({
        orderBy: {
            id: 'asc',
        },
    });
}

export async function getDepartmentSetting(id: string) {
    return await prisma.departmentSetting.findUnique({
        where: { id },
    });
}

export const createDepartmentSetting = withPermission(
    null, // super-admin only
    async (_ctx, data: any) => {
        return await prisma.departmentSetting.create({ data });
    }
);

export const updateDepartmentSetting = withPermission(
    null, // super-admin only
    async (_ctx, id: string, data: any) => {
        return await prisma.departmentSetting.update({
            where: { id },
            data,
        });
    }
);

export const upsertDepartmentSetting = withPermission(
    null, // super-admin only
    async (_ctx, id: string, data: any) => {
        return await prisma.departmentSetting.upsert({
            where: { id },
            update: data,
            create: { id, ...data },
        });
    }
);

export const deleteDepartmentSetting = withPermission(
    null, // super-admin only
    async (_ctx, id: string) => {
        return await prisma.departmentSetting.delete({
            where: { id },
        });
    }
);

// --- Transaction Logs ---

export async function createTransactionLog(data: any) {
    return await prisma.transactionLog.create({
        data,
    });
}

export async function getTransactionLogs() {
    return await prisma.transactionLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 200,
    });
}

export async function getWorkerLogs(workerId: string) {
    return await prisma.transactionLog.findMany({
        where: {
            OR: [
                { targetId: workerId },
                { userId: workerId }
            ]
        },
        orderBy: {
            timestamp: 'desc',
        },
        take: 50,
    });
}
