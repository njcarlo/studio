import { NextResponse } from 'next/server';
import { seedQaAccounts, type SeedQaScope } from '@/services/qa-seed';

/**
 * POST /api/qa/seed
 * Authorization: Bearer <QA_SEED_TOKEN>
 * Body (optional): { "scope": "c2s" | "all" }  — default "c2s"
 *
 * Runs on App Hosting with production DATABASE_URL + ADC Firebase Admin.
 * Token is set in apphosting.yaml (QA_SEED_TOKEN). Remove/rotate after use.
 */
export async function POST(request: Request) {
  const expected = process.env.QA_SEED_TOKEN;
  const authHeader = request.headers.get('authorization');

  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let scope: SeedQaScope = 'c2s';
  try {
    const body = (await request.json()) as { scope?: SeedQaScope };
    if (body?.scope === 'all' || body?.scope === 'c2s') scope = body.scope;
  } catch {
    /* empty body ok */
  }

  try {
    const result = await seedQaAccounts(scope);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/qa/seed]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Seed failed' },
      { status: 500 },
    );
  }
}
