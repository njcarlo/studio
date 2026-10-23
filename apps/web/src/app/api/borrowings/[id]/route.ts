import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@studio/database/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const borrowing = await prisma.inventoryBorrowing.findUnique({
      where: { id },
      include: {
        item: { select: { id: true, name: true, inventoryCode: true, status: true, imageUrl: true } },
        borrower: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    if (!borrowing) {
      return NextResponse.json({ error: 'Borrowing not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...borrowing,
      borrowerName: borrowing.borrower ? `${borrowing.borrower.firstName} ${borrowing.borrower.lastName}` : 'Unknown Worker',
    });
  } catch (error: any) {
    console.error('[GET /api/borrowings/[id]] error:', error);
    return NextResponse.json({ error: 'Failed to fetch borrowing', details: error?.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { returnCondition, returnNotes, status } = body;

    const existing = await prisma.inventoryBorrowing.findUnique({
      where: { id },
      include: { item: true, borrower: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Borrowing not found' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.inventoryBorrowing.update({
        where: { id },
        data: {
          returnCondition: returnCondition !== undefined ? returnCondition : existing.returnCondition,
          returnNotes: returnNotes !== undefined ? returnNotes : existing.returnNotes,
          status: status !== undefined ? status : existing.status,
        },
        include: {
          item: { select: { id: true, name: true, inventoryCode: true, status: true, imageUrl: true } },
          borrower: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        },
      });

      // Synchronize item status if condition is updated
      if (returnCondition && existing.itemId) {
        const condLower = returnCondition.toLowerCase();
        const isRepairedOrGood = ['good', 'repaired', 'replaced', 'fixed', 'naayos', 'napalitan'].some((s) =>
          condLower.includes(s)
        );
        const isDamaged = condLower.includes('damage');

        if (isRepairedOrGood) {
          await tx.inventoryItem.update({
            where: { id: existing.itemId },
            data: {
              status: 'Good Condition',
              statusDetails: returnNotes ? `Repaired/Replaced: ${returnNotes}` : 'Restored to good condition',
            },
          });

          await tx.inventoryLog.create({
            data: {
              itemId: existing.itemId,
              workerId: existing.borrowerId,
              type: 'Adjustment',
              quantity: 0,
              balance: existing.item?.quantity || 0,
              notes: `Maintenance update: ${returnCondition}${returnNotes ? ` — ${returnNotes}` : ''}`,
            },
          });
        } else if (isDamaged) {
          await tx.inventoryItem.update({
            where: { id: existing.itemId },
            data: {
              status: 'Damaged',
              statusDetails: returnNotes || 'Damaged upon return',
            },
          });
        }
      }

      return b;
    });

    return NextResponse.json({
      ...updated,
      borrowerName: updated.borrower
        ? `${updated.borrower.firstName} ${updated.borrower.lastName}`
        : 'Unknown Worker',
    });
  } catch (error: any) {
    console.error('[PATCH /api/borrowings/[id]] error:', error);
    return NextResponse.json({ error: 'Failed to update borrowing', details: error?.message }, { status: 500 });
  }
}
