/**
 * Local / manual QA seed (requires DATABASE_URL + Firebase Admin credentials).
 *
 * On App Hosting, seeding runs automatically during build when
 * QA_SEED_ON_DEPLOY=true (see apphosting.yaml + scripts/apphosting-build.sh).
 *
 *   set -a && source apps/web/.env.local && set +a
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
 *   npx tsx prisma/seed-qa-accounts.ts
 *
 * Credentials: docs/PLACEHOLDER_ACCOUNTS.md
 */
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

async function main() {
  // Re-use the App Hosting seeder implementation.
  await import(pathToFileURL(resolve(process.cwd(), 'scripts/seed-qa-accounts-core.ts')).href);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
