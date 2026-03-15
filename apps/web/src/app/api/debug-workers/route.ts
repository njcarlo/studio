import { NextResponse } from 'next/server';
import { getPaginatedWorkers, getWorkerStats } from '@/actions/db';

export async function GET() {
  try {
    console.log('--- DEBUG API CALLED ---');
    const workersResult = await getPaginatedWorkers(1, 10, {});
    const statsResult = await getWorkerStats();
    
    return NextResponse.json({
      workers: workersResult,
      stats: statsResult,
    });
  } catch (error: any) {
    console.error('--- DEBUG API ERROR ---', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
