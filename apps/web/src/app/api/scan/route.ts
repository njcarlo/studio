import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@studio/database/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { payload, expectedType } = body;

    if (!payload?.trim()) {
      return NextResponse.json({ error: 'Payload is required' }, { status: 400 });
    }

    let searchCode = payload.trim();

    // Clean URL wrappers if scanned as web URL
    if (searchCode.startsWith('http://') || searchCode.startsWith('https://')) {
      try {
        const parsedUrl = new URL(searchCode);
        searchCode = parsedUrl.searchParams.get('borrowing') ||
                     parsedUrl.searchParams.get('borrow') ||
                     parsedUrl.searchParams.get('code') ||
                     parsedUrl.searchParams.get('item') ||
                     parsedUrl.searchParams.get('id') ||
                     parsedUrl.pathname.split('/').filter(Boolean).pop() ||
                     searchCode;
      } catch {}
    }

    // Determine intended type from prefix
    const isExplicitBorrowingPrefix = /^(borrow|borrowing):/i.test(searchCode) || /^borrow-/i.test(searchCode) || searchCode.startsWith('/borrowings/') || searchCode.startsWith('/borrowing/');
    const isExplicitItemPrefix = /^item:/i.test(searchCode) || /^item-/i.test(searchCode) || searchCode.startsWith('/items/') || searchCode.startsWith('/item/');

    // Strip prefixes
    let cleanCode = searchCode
      .replace(/^\/items\//, '')
      .replace(/^\/item\//, '')
      .replace(/^\/borrowings\//, '')
      .replace(/^\/borrowing\//, '')
      .replace(/^item:/i, '')
      .replace(/^item-/i, '')
      .replace(/^borrow:/i, '')
      .replace(/^borrowing:/i, '');

    // If prefix like BORROW-2026-<id>, extract the id
    const borrowYearMatch = cleanCode.match(/^BORROW-\d{4}-(.+)$/i);
    if (borrowYearMatch) {
      cleanCode = borrowYearMatch[1];
    } else if (/^BORROW-/i.test(cleanCode)) {
      cleanCode = cleanCode.replace(/^BORROW-/i, '');
    }

    // ─────────────────────────────────────────────────────────────
    // CASE A: EXPLICIT BORROWING QR (OR SEARCH CODE MATCHES BORROWING)
    // ─────────────────────────────────────────────────────────────
    if (isExplicitBorrowingPrefix) {
      // Look up borrowing by UUID or prefix match
      let borrowing = await prisma.inventoryBorrowing.findFirst({
        where: {
          OR: [
            { id: cleanCode },
            { id: { startsWith: cleanCode, mode: 'insensitive' } },
          ],
        },
        include: {
          item: { include: { category: true } },
          borrower: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      if (!borrowing) {
        return NextResponse.json({
          error: `Borrowing transaction not found for code: "${payload}".`,
          qrType: 'BORROWING',
        }, { status: 404 });
      }

      const borrowYear = borrowing.borrowedAt ? new Date(borrowing.borrowedAt).getFullYear() : 2026;
      return NextResponse.json({
        success: true,
        qrType: 'BORROWING',
        borrowing: {
          id: borrowing.id,
          borrowingCode: `BORROW-${borrowYear}-${borrowing.id.slice(0, 8).toUpperCase()}`,
          borrowerId: borrowing.borrowerId,
          borrowerName: borrowing.borrower
            ? `${borrowing.borrower.firstName} ${borrowing.borrower.lastName}`
            : (borrowing as any).borrowerName || 'Worker',
          borrowerEmail: borrowing.borrower?.email || '',
          borrowedAt: borrowing.borrowedAt,
          dueDate: borrowing.dueDate,
          returnedAt: borrowing.returnedAt,
          status: borrowing.status,
          quantity: (borrowing as any).quantity || 1,
          checkoutNotes: borrowing.checkoutNotes,
          checkoutCondition: borrowing.checkoutCondition,
          returnNotes: borrowing.returnNotes,
          returnCondition: borrowing.returnCondition,
          returnPhotos: (borrowing as any).returnPhotos || [],
          item: {
            id: borrowing.item.id,
            name: borrowing.item.name,
            inventoryCode: borrowing.item.inventoryCode,
            itemQrCode: `ITEM-${borrowing.item.inventoryCode}`,
            category: borrowing.item.category?.name || 'General',
            imageUrl: borrowing.item.imageUrl,
            stock: borrowing.item.quantity,
            unit: borrowing.item.unit || 'pcs',
            location: (borrowing.item as any).location || 'Main Storage',
            condition: (borrowing.item as any).condition || 'Good Condition',
            status: borrowing.item.status,
          },
        },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // CASE B: WORKER QR (COG_USER:<id>:<token> or Worker UUID)
    // ─────────────────────────────────────────────────────────────
    let workerId: string | null = null;
    if (searchCode.startsWith('COG_USER:')) {
      const parts = searchCode.split(':');
      workerId = parts[1] || null;
    }

    if (workerId) {
      const workerBorrowing = await prisma.inventoryBorrowing.findFirst({
        where: {
          borrowerId: workerId,
          status: 'BORROWED',
        },
        orderBy: { borrowedAt: 'desc' },
        include: {
          item: { include: { category: true } },
          borrower: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      if (workerBorrowing) {
        const borrowYear = workerBorrowing.borrowedAt ? new Date(workerBorrowing.borrowedAt).getFullYear() : 2026;
        return NextResponse.json({
          success: true,
          qrType: 'BORROWING',
          borrowing: {
            id: workerBorrowing.id,
            borrowingCode: `BORROW-${borrowYear}-${workerBorrowing.id.slice(0, 8).toUpperCase()}`,
            borrowerId: workerBorrowing.borrowerId,
            borrowerName: workerBorrowing.borrower
              ? `${workerBorrowing.borrower.firstName} ${workerBorrowing.borrower.lastName}`
              : 'Worker',
            borrowerEmail: workerBorrowing.borrower?.email || '',
            borrowedAt: workerBorrowing.borrowedAt,
            dueDate: workerBorrowing.dueDate,
            returnedAt: workerBorrowing.returnedAt,
            status: workerBorrowing.status,
            quantity: (workerBorrowing as any).quantity || 1,
            checkoutNotes: workerBorrowing.checkoutNotes,
            checkoutCondition: workerBorrowing.checkoutCondition,
            returnNotes: workerBorrowing.returnNotes,
            returnCondition: workerBorrowing.returnCondition,
            returnPhotos: (workerBorrowing as any).returnPhotos || [],
            item: {
              id: workerBorrowing.item.id,
              name: workerBorrowing.item.name,
              inventoryCode: workerBorrowing.item.inventoryCode,
              itemQrCode: `ITEM-${workerBorrowing.item.inventoryCode}`,
              category: workerBorrowing.item.category?.name || 'General',
              imageUrl: workerBorrowing.item.imageUrl,
              stock: workerBorrowing.item.quantity,
              unit: workerBorrowing.item.unit || 'pcs',
              location: (workerBorrowing.item as any).location || 'Main Storage',
              condition: (workerBorrowing.item as any).condition || 'Good Condition',
              status: workerBorrowing.item.status,
            },
          },
        });
      }
    }

    // ─────────────────────────────────────────────────────────────
    // CASE C: ITEM QR LOOKUP (OR RAW CODE MATCHING INVENTORY ITEM)
    // ─────────────────────────────────────────────────────────────
    // Try finding by InventoryItem (by ID or inventoryCode)
    const item = await prisma.inventoryItem.findFirst({
      where: {
        OR: [
          { id: cleanCode },
          { inventoryCode: { equals: cleanCode, mode: 'insensitive' } },
        ],
      },
      include: { category: true, children: true },
    });

    if (item) {
      return NextResponse.json({
        success: true,
        qrType: 'ITEM',
        item: {
          id: item.id,
          name: item.name,
          inventoryCode: item.inventoryCode,
          itemQrCode: `ITEM-${item.inventoryCode}`,
          category: item.category?.name || 'General',
          categoryId: item.categoryId,
          imageUrl: item.imageUrl,
          stock: item.quantity,
          quantity: item.quantity,
          minQuantity: item.minQuantity,
          minStock: item.minQuantity,
          unit: item.unit || 'pcs',
          location: (item as any).location || 'Main Storage',
          condition: (item as any).condition || 'Good Condition',
          status: item.status || 'Good Condition',
          availability: item.quantity > 0 ? 'Available' : 'Out of Stock',
          description: (item as any).description || (item as any).statusDetails || '',
        },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // CASE D: CHECK IF UNPREFIXED UUID IS DIRECT BORROWING ID
    // ─────────────────────────────────────────────────────────────
    const borrowingDirect = await prisma.inventoryBorrowing.findUnique({
      where: { id: cleanCode },
      include: {
        item: { include: { category: true } },
        borrower: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (borrowingDirect) {
      const borrowYear = borrowingDirect.borrowedAt ? new Date(borrowingDirect.borrowedAt).getFullYear() : 2026;
      return NextResponse.json({
        success: true,
        qrType: 'BORROWING',
        borrowing: {
          id: borrowingDirect.id,
          borrowingCode: `BORROW-${borrowYear}-${borrowingDirect.id.slice(0, 8).toUpperCase()}`,
          borrowerId: borrowingDirect.borrowerId,
          borrowerName: borrowingDirect.borrower
            ? `${borrowingDirect.borrower.firstName} ${borrowingDirect.borrower.lastName}`
            : (borrowingDirect as any).borrowerName || 'Worker',
          borrowerEmail: borrowingDirect.borrower?.email || '',
          borrowedAt: borrowingDirect.borrowedAt,
          dueDate: borrowingDirect.dueDate,
          returnedAt: borrowingDirect.returnedAt,
          status: borrowingDirect.status,
          quantity: (borrowingDirect as any).quantity || 1,
          checkoutNotes: borrowingDirect.checkoutNotes,
          checkoutCondition: borrowingDirect.checkoutCondition,
          returnNotes: borrowingDirect.returnNotes,
          returnCondition: borrowingDirect.returnCondition,
          returnPhotos: (borrowingDirect as any).returnPhotos || [],
          item: {
            id: borrowingDirect.item.id,
            name: borrowingDirect.item.name,
            inventoryCode: borrowingDirect.item.inventoryCode,
            itemQrCode: `ITEM-${borrowingDirect.item.inventoryCode}`,
            category: borrowingDirect.item.category?.name || 'General',
            imageUrl: borrowingDirect.item.imageUrl,
            stock: borrowingDirect.item.quantity,
            unit: borrowingDirect.item.unit || 'pcs',
            location: (borrowingDirect.item as any).location || 'Main Storage',
            condition: (borrowingDirect.item as any).condition || 'Good Condition',
            status: borrowingDirect.item.status,
          },
        },
      });
    }

    // If neither Item nor Borrowing was found:
    return NextResponse.json({
      error: 'Unrecognized QR code. Please scan a valid Item QR (e.g. ITEM-...) or Borrowing QR (e.g. BORROW-...).',
    }, { status: 404 });

  } catch (error: any) {
    console.error('[POST /api/scan] error:', error);
    return NextResponse.json({ error: 'Scan lookup failed', details: error?.message }, { status: 500 });
  }
}
