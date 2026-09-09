import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@studio/database/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { returnNotes, returnCondition, returnChecklist, returnPhotos, damaged, quantity = 1 } = body;

    const borrowing = await prisma.inventoryBorrowing.findUnique({
      where: { id },
      include: {
        item: true,
        borrower: true,
      },
    });

    if (!borrowing) {
      return NextResponse.json({ error: 'Borrowing record not found' }, { status: 404 });
    }

    if (borrowing.status === 'RETURNED') {
      return NextResponse.json({ error: 'Item has already been marked as returned' }, { status: 400 });
    }

    const returnedQty = Number(quantity) || 1;

    const updatedBorrowing = await prisma.$transaction(async (tx) => {
      const b = await tx.inventoryBorrowing.update({
        where: { id },
        data: {
          returnedAt: new Date(),
          status: 'RETURNED',
          returnNotes: returnNotes || null,
          returnCondition: returnCondition || null,
          returnChecklist: returnChecklist ? (returnChecklist as any) : undefined,
          returnPhotos: Array.isArray(returnPhotos) ? returnPhotos : [],
        },
        include: {
          item: { select: { id: true, name: true, inventoryCode: true, imageUrl: true } },
          borrower: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      const currentItem = await tx.inventoryItem.findUnique({ where: { id: borrowing.itemId } });
      const newStock = (currentItem?.quantity || 0) + returnedQty;

      await tx.inventoryItem.update({
        where: { id: borrowing.itemId },
        data: {
          quantity: newStock,
          status: damaged ? 'Damaged' : (newStock > 0 && currentItem?.status === 'Borrowed' ? 'Good Condition' : undefined),
        },
      });

      const borrowerName = borrowing.borrower ? `${borrowing.borrower.firstName} ${borrowing.borrower.lastName}` : 'Worker';

      await tx.inventoryLog.create({
        data: {
          itemId: borrowing.itemId,
          workerId: borrowing.borrowerId,
          type: 'Return',
          quantity: returnedQty,
          balance: newStock,
          notes: `Returned by ${borrowerName}. Condition: ${returnCondition || 'N/A'}${damaged ? ' — DAMAGED' : ''}`,
        },
      });

      return b;
    });

    const borrowerName = updatedBorrowing.borrower
      ? `${updatedBorrowing.borrower.firstName} ${updatedBorrowing.borrower.lastName}`
      : 'Worker';

    return NextResponse.json({
      ...updatedBorrowing,
      borrowerName,
    });
  } catch (error: any) {
    console.error('[PATCH /api/borrowings/[id]/return] error:', error);
    return NextResponse.json({ error: 'Failed to process return', details: error?.message }, { status: 500 });
  }
}
