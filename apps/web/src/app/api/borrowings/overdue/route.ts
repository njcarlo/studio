import { NextResponse } from 'next/server';
import { prisma } from '@studio/database/prisma';

export async function GET() {
  try {
    const overdue = await prisma.inventoryBorrowing.findMany({
      where: {
        status: 'BORROWED',
        dueDate: { lt: new Date() },
      },
      include: {
        item: { select: { id: true, name: true, inventoryCode: true, imageUrl: true } },
        borrower: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const formatted = overdue.map((b) => ({
      ...b,
      borrowerName: b.borrower ? `${b.borrower.firstName} ${b.borrower.lastName}` : 'Unknown Worker',
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('[GET /api/borrowings/overdue] error:', error);
    return NextResponse.json({ error: 'Failed to fetch overdue borrowings', details: error?.message }, { status: 500 });
  }
}
