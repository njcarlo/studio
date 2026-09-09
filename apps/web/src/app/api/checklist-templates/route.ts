import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@studio/database/prisma';

const DEFAULT_TEMPLATES = [
  {
    id: 'checkout_default',
    name: 'Standard Checkout',
    type: 'checkout',
    items: [
      { id: '1', label: 'Battery / Power charged', required: false },
      { id: '2', label: 'No visible physical damage', required: false },
      { id: '3', label: 'All accessories and cables included', required: false },
      { id: '4', label: 'Item cleaned and sanitized', required: false },
      { id: '5', label: 'Serial number verified', required: false },
    ],
  },
  {
    id: 'return_default',
    name: 'Standard Return',
    type: 'return',
    items: [
      { id: '1', label: 'Item returned complete (no missing parts)', required: true },
      { id: '2', label: 'No new physical damage or dents', required: false },
      { id: '3', label: 'Cleaned before return', required: false },
      { id: '4', label: 'Power level acceptable', required: false },
    ],
  },
];

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { id: 'checklist_templates' },
    });

    if (setting?.data) {
      const parsed = typeof setting.data === 'string' ? JSON.parse(setting.data) : setting.data;
      return NextResponse.json(parsed.templates || DEFAULT_TEMPLATES);
    }

    return NextResponse.json(DEFAULT_TEMPLATES);
  } catch (error: any) {
    console.error('[GET /api/checklist-templates] error:', error);
    return NextResponse.json(DEFAULT_TEMPLATES);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { templates } = body;

    await prisma.setting.upsert({
      where: { id: 'checklist_templates' },
      update: { data: { templates } },
      create: { id: 'checklist_templates', data: { templates } },
    });

    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    console.error('[PUT /api/checklist-templates] error:', error);
    return NextResponse.json({ error: 'Failed to save templates', details: error?.message }, { status: 500 });
  }
}
