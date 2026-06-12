import { NextResponse } from 'next/server';
import { allocateMealstubs } from '@/services/meal-stub-service';
import { requirePermission } from '@/lib/auth/require-permission';

export async function POST(request: Request) {
  try {
    await requirePermission('meals:manage');
  } catch (error: any) {
    const status = error.message === 'Not authenticated' ? 401 : 403;
    return NextResponse.json({ error: error.message }, { status });
  }

  try {
    const body = await request.json();
    const { scheduleId, publishedBy } = body;

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'scheduleId is required' },
        { status: 400 }
      );
    }

    // Trigger the allocation service
    const mealstubs = await allocateMealstubs(scheduleId, publishedBy || 'system');

    return NextResponse.json({
      success: true,
      count: mealstubs.length,
      mealstubs,
    });
  } catch (error: any) {
    console.error('POST /api/mealstubs/allocate error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to allocate mealstubs' },
      { status: 500 }
    );
  }
}
