import { NextResponse } from 'next/server';
import { runDailyJobs } from '@/services/cron-jobs';

export async function GET(request: Request) {
    // Verify Authorization: Bearer <CRON_SECRET>
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await runDailyJobs();
        return NextResponse.json({ ok: true, ...result });
    } catch (error) {
        console.error('Cron /api/cron/daily-jobs error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
