import { prisma } from '@studio/database/prisma';
import type { InventoryType, Prisma } from '@prisma/client';

// ── Serialization helpers (PostgREST returned ISO date strings) ───────────────

function iso(d: Date | null | undefined): string | null {
    if (!d) return null;
    return d.toISOString();
}

function serializeItem<T extends Record<string, any>>(item: T) {
    return {
        ...item,
        expiryDate: iso(item.expiryDate),
        nextMaintenanceDate: iso(item.nextMaintenanceDate),
        createdAt: iso(item.createdAt) ?? undefined,
        updatedAt: iso(item.updatedAt) ?? undefined,
    };
}

function serializeLog<T extends Record<string, any>>(log: T) {
    return { ...log, timestamp: iso(log.timestamp) ?? undefined };
}

function serializeBorrowing<T extends Record<string, any>>(b: T) {
    return {
        ...b,
        borrowedAt: iso(b.borrowedAt) ?? undefined,
        dueDate: iso(b.dueDate),
        returnedAt: iso(b.returnedAt),
    };
}

const CATEGORY_SELECT = { id: true, name: true, color: true, icon: true } as const;

const INVENTORY_ROLE_META: Record<string, { label: string; description: string }> = {
    'inventory:manage': {
        label: 'Inventory Officer',
        description: 'Full CRUD — create, edit, delete items and manage stock',
    },
    'inventory:access': {
        label: 'Inventory Viewer',
        description: 'Read-only access to inventory data',
    },
};

// ── Categories ────────────────────────────────────────────────────────────────

export async function getCategories() {
    return prisma.inventoryCategory.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
    });
}

export async function createCategory(payload: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    group?: string;
}) {
    return prisma.inventoryCategory.create({
        data: {
            name: payload.name,
            description: payload.description,
            color: payload.color,
            icon: payload.icon,
            group: payload.group,
            isActive: true,
        },
    });
}

export async function updateCategory(
    id: string,
    payload: Partial<{
        name: string;
        description: string;
        color: string;
        icon: string;
        group: string;
        isActive: boolean;
    }>,
) {
    return prisma.inventoryCategory.update({
        where: { id },
        data: payload,
    });
}

// ── Items (ministry-scoped) ───────────────────────────────────────────────────

export async function getItems(
    ministryId: string | null,
    params: {
        search?: string;
        categoryId?: string;
        status?: string;
        type?: string;
        page?: number;
        limit?: number;
    } = {},
) {
    const { search, categoryId, status, type, page = 1, limit = 50 } = params;
    const where: Prisma.InventoryItemWhereInput = { parentId: null };
    if (ministryId) where.group = ministryId;
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (type) where.type = type as InventoryType;

    const [items, total] = await Promise.all([
        prisma.inventoryItem.findMany({
            where,
            include: { category: { select: CATEGORY_SELECT } },
            orderBy: { name: 'asc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.inventoryItem.count({ where }),
    ]);

    return { items: items.map(serializeItem), total };
}

export async function getItem(id: string) {
    const item = await prisma.inventoryItem.findUnique({
        where: { id },
        include: {
            category: { select: CATEGORY_SELECT },
            children: true,
        },
    });
    if (!item) throw new Error('Item not found');
    return {
        ...serializeItem(item),
        children: item.children.map(serializeItem),
    };
}

export async function createItem(
    ministryId: string | null,
    payload: {
        name: string;
        categoryId: string;
        type?: string;
        quantity?: number;
        minQuantity?: number;
        unit?: string;
        status?: string;
        location?: string;
        aisle?: string;
        shelf?: string;
        bin?: string;
        inventoryCode?: string;
        imageUrl?: string;
        isApprovalRequired?: boolean;
        weight?: number;
        role?: string;
        assignedTo?: string;
        purchaseDate?: string;
        statusCode?: number;
        statusDetails?: string;
        recommendation?: string;
    },
) {
    const item = await prisma.inventoryItem.create({
        data: {
            name: payload.name,
            categoryId: payload.categoryId,
            group: ministryId,
            type: (payload.type as InventoryType) ?? 'EQUIPMENT',
            quantity: payload.quantity ?? 0,
            minQuantity: payload.minQuantity ?? 0,
            unit: payload.unit ?? 'pcs',
            status: payload.status,
            location: payload.location,
            aisle: payload.aisle,
            shelf: payload.shelf,
            bin: payload.bin,
            inventoryCode: payload.inventoryCode,
            imageUrl: payload.imageUrl,
            isApprovalRequired: payload.isApprovalRequired ?? false,
            weight: payload.weight,
            role: payload.role,
            assignedTo: payload.assignedTo,
            purchaseDate: payload.purchaseDate,
            statusCode: payload.statusCode,
            statusDetails: payload.statusDetails,
            recommendation: payload.recommendation,
        },
    });
    return serializeItem(item);
}

export async function updateItem(id: string, payload: Record<string, any>) {
    const { updatedAt: _ignore, ...rest } = payload;
    const data: Prisma.InventoryItemUpdateInput = { ...rest };
    if (rest.type) data.type = rest.type as InventoryType;
    if (rest.expiryDate !== undefined) {
        data.expiryDate = rest.expiryDate ? new Date(rest.expiryDate) : null;
    }
    if (rest.nextMaintenanceDate !== undefined) {
        data.nextMaintenanceDate = rest.nextMaintenanceDate
            ? new Date(rest.nextMaintenanceDate)
            : null;
    }
    const item = await prisma.inventoryItem.update({ where: { id }, data });
    return serializeItem(item);
}

export async function deleteItem(id: string) {
    await prisma.inventoryItem.delete({ where: { id } });
}

// ── Stock adjustment ──────────────────────────────────────────────────────────

export async function adjustStock(
    itemId: string,
    action: 'Stock In' | 'Stock Out' | 'Adjustment',
    quantity: number,
    notes?: string,
    workerId?: string,
) {
    return prisma.$transaction(async (tx) => {
        const item = await tx.inventoryItem.findUnique({
            where: { id: itemId },
            select: { quantity: true },
        });
        if (!item) throw new Error('Item not found');

        const current = item.quantity ?? 0;
        const delta = action === 'Stock Out' ? -quantity : quantity;
        const newQty = Math.max(0, current + delta);

        await tx.inventoryItem.update({
            where: { id: itemId },
            data: { quantity: newQty },
        });

        await tx.inventoryLog.create({
            data: {
                itemId,
                workerId: workerId ?? null,
                type: action,
                quantity,
                balance: newQty,
                notes: notes ?? null,
            },
        });

        return newQty;
    });
}

// ── Logs (ministry-scoped via item join) ──────────────────────────────────────

export async function getLogs(
    ministryId: string | null,
    params: { itemId?: string; limit?: number } = {},
) {
    const where: Prisma.InventoryLogWhereInput = {};
    if (params.itemId) where.itemId = params.itemId;
    if (ministryId) where.item = { group: ministryId };

    const logs = await prisma.inventoryLog.findMany({
        where,
        include: {
            item: { select: { id: true, name: true, group: true } },
        },
        orderBy: { timestamp: 'desc' },
        take: params.limit ?? 100,
    });

    return logs.map(serializeLog);
}

// ── Borrowings (ministry-scoped via item join) ────────────────────────────────

export async function getBorrowings(
    ministryId: string | null,
    params: { status?: string; borrowerId?: string } = {},
) {
    const where: Prisma.InventoryBorrowingWhereInput = {};
    if (ministryId) where.item = { group: ministryId };
    if (params.status) where.status = params.status;
    if (params.borrowerId) where.borrowerId = params.borrowerId;

    const rows = await prisma.inventoryBorrowing.findMany({
        where,
        include: {
            item: { select: { id: true, name: true, imageUrl: true, group: true } },
            borrower: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { borrowedAt: 'desc' },
    });

    return rows.map(serializeBorrowing);
}

export async function getBorrowing(id: string) {
    const row = await prisma.inventoryBorrowing.findUnique({
        where: { id },
        include: {
            item: { select: { id: true, name: true, imageUrl: true, group: true } },
            borrower: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
    });
    if (!row) throw new Error('Borrowing not found');
    return serializeBorrowing(row);
}

export async function getActiveBorrowingForItem(itemId: string) {
    const row = await prisma.inventoryBorrowing.findFirst({
        where: { itemId, status: 'BORROWED' },
        select: {
            id: true,
            borrowerId: true,
            dueDate: true,
            borrower: { select: { firstName: true, lastName: true } },
        },
    });
    if (!row) return null;
    return {
        ...row,
        dueDate: iso(row.dueDate),
        borrowerName: row.borrower
            ? `${row.borrower.firstName} ${row.borrower.lastName}`.trim()
            : undefined,
    };
}

export async function createBorrowing(payload: {
    itemId: string;
    borrowerId: string;
    dueDate?: string;
    checkoutNotes?: string;
    checkoutCondition?: string;
}) {
    const row = await prisma.inventoryBorrowing.create({
        data: {
            itemId: payload.itemId,
            borrowerId: payload.borrowerId,
            dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
            checkoutNotes: payload.checkoutNotes,
            checkoutCondition: payload.checkoutCondition,
            status: 'BORROWED',
        },
    });
    return serializeBorrowing(row);
}

export async function returnBorrowing(
    id: string,
    payload: { returnNotes?: string; returnCondition?: string },
) {
    const row = await prisma.inventoryBorrowing.update({
        where: { id },
        data: {
            ...payload,
            status: 'RETURNED',
            returnedAt: new Date(),
        },
    });
    return serializeBorrowing(row);
}

// ── Dashboard stats (ministry-scoped) ────────────────────────────────────────

export async function getDashboardStats(ministryId: string | null) {
    const itemWhere: Prisma.InventoryItemWhereInput = {};
    if (ministryId) itemWhere.group = ministryId;

    const borrowWhere: Prisma.InventoryBorrowingWhereInput = { status: 'BORROWED' };
    if (ministryId) borrowWhere.item = { group: ministryId };

    const [items, activeBorrowings] = await Promise.all([
        prisma.inventoryItem.findMany({
            where: itemWhere,
            select: { id: true, quantity: true, minQuantity: true, status: true, type: true },
        }),
        prisma.inventoryBorrowing.count({ where: borrowWhere }),
    ]);

    const totalItems = items.length;
    const lowStock = items.filter(
        (i) => (i.quantity ?? 0) <= (i.minQuantity ?? 0) && (i.minQuantity ?? 0) > 0,
    ).length;
    const equipment = items.filter((i) => i.type === 'EQUIPMENT').length;
    const consumables = items.filter((i) => i.type === 'CONSUMABLE').length;

    return { totalItems, activeBorrowings, lowStock, equipment, consumables };
}

// ── Item lookup by QR payload (inventoryCode or id) ──────────────────────────

export async function lookupItemByQR(payload: string) {
    const item = await prisma.inventoryItem.findFirst({
        where: {
            OR: [{ inventoryCode: payload }, { id: payload }],
        },
        include: { category: { select: { name: true } } },
    });
    if (!item) throw new Error('Item not found');
    return { item: { ...serializeItem(item), stock: item.quantity } };
}

// ── Locations ─────────────────────────────────────────────────────────────────

export async function getLocations(ministryId: string) {
    const rows = await prisma.inventoryItem.findMany({
        where: { group: ministryId, location: { not: null } },
        select: { location: true },
        distinct: ['location'],
    });
    return rows
        .map((r) => r.location)
        .filter((loc): loc is string => Boolean(loc))
        .map((name) => ({ id: name, name }));
}

// ── Bulk ops ──────────────────────────────────────────────────────────────────

export async function bulkUpdateItems(ids: string[], payload: Record<string, any>) {
    const { updatedAt: _ignore, ...rest } = payload;
    await prisma.inventoryItem.updateMany({
        where: { id: { in: ids } },
        data: rest,
    });
}

export async function bulkDeleteItems(ids: string[]) {
    await prisma.inventoryItem.deleteMany({ where: { id: { in: ids } } });
}

export async function bulkImportItems(rows: Record<string, any>[]) {
    if (rows.length === 0) return;
    await prisma.inventoryItem.createMany({
        data: rows.map((r) => ({
            name: r.name,
            categoryId: r.categoryId,
            group: r.group ?? null,
            type: (r.type as InventoryType) ?? 'EQUIPMENT',
            quantity: r.quantity ?? 0,
            minQuantity: r.minQuantity ?? 0,
            unit: r.unit ?? 'pcs',
            status: r.status ?? undefined,
            location: r.location ?? null,
            aisle: r.aisle ?? null,
            shelf: r.shelf ?? null,
            bin: r.bin ?? null,
            inventoryCode: r.inventoryCode ?? null,
            imageUrl: r.imageUrl ?? null,
            isApprovalRequired: r.isApprovalRequired ?? false,
            weight: r.weight ?? null,
            role: r.role ?? null,
            assignedTo: r.assignedTo ?? null,
            purchaseDate: r.purchaseDate ?? null,
            statusCode: r.statusCode ?? null,
            statusDetails: r.statusDetails ?? null,
            recommendation: r.recommendation ?? null,
        })),
        skipDuplicates: true,
    });
}

/** Excel import used by ImportPage — creates categories as needed, skips dup codes. */
export async function importInventoryRows(
    ministryId: string | null,
    rows: Array<{
        weight?: number;
        category: string;
        inventoryCode?: string;
        name: string;
        role?: string;
        location?: string;
        assignedTo?: string;
        purchaseDate?: string;
        statusCode?: number;
        status?: string;
        statusDetails?: string;
        recommendation?: string;
    }>,
) {
    const existingCats = await prisma.inventoryCategory.findMany({
        select: { id: true, name: true },
    });
    const catMap = new Map(existingCats.map((c) => [c.name.toLowerCase(), c.id]));

    const result = { total: rows.length, imported: 0, skipped: 0, errors: [] as string[] };

    for (const row of rows) {
        try {
            const catKey = row.category.toLowerCase();
            let categoryId = catMap.get(catKey);
            if (!categoryId) {
                const newCat = await prisma.inventoryCategory.create({
                    data: { name: row.category, isActive: true },
                });
                categoryId = newCat.id;
                catMap.set(catKey, categoryId);
            }

            if (row.inventoryCode) {
                const existing = await prisma.inventoryItem.findUnique({
                    where: { inventoryCode: row.inventoryCode },
                    select: { id: true },
                });
                if (existing) {
                    result.skipped++;
                    continue;
                }
            }

            const statusText =
                row.status ||
                (row.statusCode
                    ? ({ 1: 'Good Condition', 2: 'For Repair', 3: 'For Replacement', 4: 'For Disposal', 5: 'For PMS' } as Record<number, string>)[
                          row.statusCode
                      ]
                    : 'Good Condition');

            await prisma.inventoryItem.create({
                data: {
                    name: row.name,
                    categoryId,
                    inventoryCode: row.inventoryCode || null,
                    group: ministryId,
                    role: row.role || null,
                    location: row.location || null,
                    assignedTo: row.assignedTo || null,
                    purchaseDate: row.purchaseDate || null,
                    statusCode: row.statusCode || null,
                    status: statusText,
                    statusDetails: row.statusDetails || null,
                    recommendation: row.recommendation || null,
                    weight: row.weight || null,
                    quantity: 1,
                    type: 'EQUIPMENT',
                },
            });
            result.imported++;
        } catch (e: any) {
            result.skipped++;
            result.errors.push(`${row.name}: ${e.message}`);
        }
    }

    return result;
}

// ── Settings helpers ──────────────────────────────────────────────────────────

export async function getMinistrySummary(ministryId: string) {
    const [ministry, itemCount] = await Promise.all([
        prisma.ministry.findUnique({
            where: { id: ministryId },
            select: { id: true, name: true, description: true, departmentCode: true },
        }),
        prisma.inventoryItem.count({ where: { group: ministryId } }),
    ]);
    return { ministry, itemCount };
}

export async function searchWorkersForInventory(q: string) {
    const term = q.trim();
    if (!term) return [];

    const workers = await prisma.worker.findMany({
        where: {
            OR: [
                { email: { contains: term, mode: 'insensitive' } },
                { firstName: { contains: term, mode: 'insensitive' } },
                { lastName: { contains: term, mode: 'insensitive' } },
            ],
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            majorMinistryId: true,
            roles: {
                select: {
                    role: {
                        select: {
                            id: true,
                            name: true,
                            rolePermissions: {
                                select: {
                                    permission: { select: { module: true, action: true } },
                                },
                            },
                        },
                    },
                },
            },
        },
        take: 10,
    });

    return workers;
}

export async function toggleInventoryWorkerPerm(
    workerId: string,
    permKey: string,
    currentlyHas: boolean,
) {
    const meta = INVENTORY_ROLE_META[permKey];
    const [module, action] = permKey.split(':');
    if (!module || !action) throw new Error('Invalid permission key');

    let perm = await prisma.permission.findUnique({
        where: { module_action: { module, action } },
    });
    if (!perm) {
        perm = await prisma.permission.create({
            data: {
                module,
                action,
                description: meta?.description,
            },
        });
    }

    const roleName = meta?.label ?? permKey;
    let role = await prisma.role.findFirst({ where: { name: roleName } });
    if (!role) {
        role = await prisma.role.create({
            data: {
                name: roleName,
                permissions: [],
                isSuperAdmin: false,
                isSystemRole: false,
            },
        });
        await prisma.rolePermission.create({
            data: { roleId: role.id, permissionId: perm.id },
        });
    }

    if (currentlyHas) {
        await prisma.workerRole.deleteMany({
            where: { workerId, roleId: role.id },
        });
        return { removed: true, roleName };
    }

    await prisma.workerRole.upsert({
        where: { workerId_roleId: { workerId, roleId: role.id } },
        create: { workerId, roleId: role.id },
        update: {},
    });
    return { removed: false, roleName };
}

// ── Reports ───────────────────────────────────────────────────────────────────

export async function getReportsData(ministryId: string | null) {
    const borrowWhere: Prisma.InventoryBorrowingWhereInput = {};
    if (ministryId) borrowWhere.item = { group: ministryId };

    const itemWhere: Prisma.InventoryItemWhereInput = {};
    if (ministryId) itemWhere.group = ministryId;

    const [borrowings, items] = await Promise.all([
        prisma.inventoryBorrowing.findMany({
            where: borrowWhere,
            select: {
                itemId: true,
                item: { select: { id: true, name: true, group: true } },
            },
        }),
        prisma.inventoryItem.findMany({
            where: itemWhere,
            select: {
                categoryId: true,
                quantity: true,
                minQuantity: true,
                status: true,
                name: true,
                inventoryCode: true,
                category: { select: { id: true, name: true } },
            },
        }),
    ]);

    const countMap = new Map<string, { item: any; count: number }>();
    for (const b of borrowings) {
        const key = b.itemId;
        if (!countMap.has(key)) countMap.set(key, { item: b.item, count: 0 });
        countMap.get(key)!.count += 1;
    }
    const mostUsed = Array.from(countMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

    const catMap = new Map<string, { name: string; count: number }>();
    for (const item of items) {
        const cat = item.category;
        const key = cat?.id ?? 'uncategorized';
        const label = cat?.name ?? 'Uncategorized';
        if (!catMap.has(key)) catMap.set(key, { name: label, count: 0 });
        catMap.get(key)!.count += 1;
    }
    const stockByCategory = Array.from(catMap.values()).sort((a, b) => b.count - a.count);

    const lowStockItems = items
        .filter((i) => (i.minQuantity ?? 0) > 0 && (i.quantity ?? 0) <= (i.minQuantity ?? 0))
        .map((i) => ({ ...i, stock: i.quantity, minStock: i.minQuantity }))
        .sort((a, b) => a.stock - b.stock);

    return { mostUsed, stockByCategory, lowStockItems };
}
