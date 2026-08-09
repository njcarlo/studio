import { NextResponse } from 'next/server';
import { runWeeklyOrsSync } from '@/services/ors-sync';

// The weekly ORS refresh pages through the whole legacy worker table to build
// its diff summary, which is far slower than the default serverless budget.
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Verify Authorization: Bearer <CRON_SECRET> — same contract as the other
    // cron routes, since this is reachable from the public internet.
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await runWeeklyOrsSync();
        return NextResponse.json({ ok: true, ...result });
    } catch (error) {
        console.error('Cron /api/cron/ors-weekly-sync error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
