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
