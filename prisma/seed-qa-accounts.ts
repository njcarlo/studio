/**
 * Seeds QA accounts.
 *
 * Preferred (production App Hosting — has DATABASE_URL + Firebase Admin ADC):
 *   export QA_SEED_TOKEN=cog-qa-seed-2026-c2s-04d9
 *   npx tsx prisma/seed-qa-accounts.ts
 *
 * Or:
 *   curl -X POST https://studio--cog-app-studio.asia-southeast1.hosted.app/api/qa/seed \
 *     -H "Authorization: Bearer $QA_SEED_TOKEN" \
 *     -H "Content-Type: application/json" \
 *     -d '{"scope":"c2s"}'
 *
 * Credentials: docs/PLACEHOLDER_ACCOUNTS.md
 */
const BASE =
  process.env.APP_BASE_URL ||
  process.env.NEXT_PUBLIC_STUDIO_URL ||
  'https://studio--cog-app-studio.asia-southeast1.hosted.app';

const TOKEN = process.env.QA_SEED_TOKEN || 'cog-qa-seed-2026-c2s-04d9';
const scope = process.argv.includes('--all') ? 'all' : 'c2s';

async function main() {
  const url = `${BASE.replace(/\/$/, '')}/api/qa/seed`;
  console.log(`POST ${url} (scope=${scope})`);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ scope }),
  });

  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* keep text */
  }

  if (!res.ok) {
    console.error('Seed failed:', res.status, body);
    console.error(
      '\nIf you see 404, merge/deploy the /api/qa/seed route first (PR with qa-seed service).',
    );
    process.exit(1);
  }

  console.log(JSON.stringify(body, null, 2));
  console.log('\n✅ QA accounts ready. See docs/PLACEHOLDER_ACCOUNTS.md');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
