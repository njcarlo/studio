/**
 * Applies the C2S schema migrations directly, without touching Prisma's
 * migration history.
 *
 * `prisma migrate deploy` is the right tool only when `_prisma_migrations`
 * already lists every earlier migration. On a database that was migrated by
 * hand or restored from a dump, that table is missing or incomplete and deploy
 * tries to replay the whole history against a populated schema. The C2S
 * migrations are written to be idempotent, so this runner applies just those,
 * in order, and reports what it changed.
 *
 *   npm run migrate:c2s          # apply
 *   npm run migrate:c2s -- --dry # report only, change nothing
 *
 * Connects with DIRECT_URL (falling back to DATABASE_URL). Use a session-mode
 * connection: the transaction pooler on port 6543 cannot run DDL reliably.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const MIGRATIONS = [
    '20260809010000_c2s_hierarchy',
    '20260809020000_c2s_pipeline_timeline',
    '20260809030000_c2s_meeting_mode',
];

/** Objects the migrations create, checked before and after so the run is auditable. */
const EXPECTED_TABLES = [
    'C2SCluster',
    'C2SCoordinatorAssignment',
    'C2SMentorAssignment',
    'C2STraining',
    'C2SDevotionEntry',
];

const EXPECTED_COLUMNS: [table: string, column: string][] = [
    ['C2SGroup', 'clusterId'],
    ['C2SGroup', 'meetingMode'],
    ['C2SGroup', 'barangay'],
    ['C2SMentee', 'progress'],
    ['C2SMentee', 'inactiveAt'],
    ['C2SJoinRequest', 'pipelineStatus'],
    ['C2SJoinRequest', 'assignedCoordinatorAt'],
];

const migrationsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../prisma/migrations');

type Presence = { tables: Record<string, boolean>; columns: Record<string, boolean> };

async function inspect(client: Client): Promise<Presence> {
    const tables = await client.query<{ table_name: string }>(
        `SELECT table_name FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = ANY($1)`,
        [EXPECTED_TABLES],
    );
    const columns = await client.query<{ table_name: string; column_name: string }>(
        `SELECT table_name, column_name FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = ANY($1)`,
        [[...new Set(EXPECTED_COLUMNS.map(([t]) => t))]],
    );

    const present = new Set(columns.rows.map((r) => `${r.table_name}.${r.column_name}`));
    return {
        tables: Object.fromEntries(
            EXPECTED_TABLES.map((t) => [t, tables.rows.some((r) => r.table_name === t)]),
        ),
        columns: Object.fromEntries(
            EXPECTED_COLUMNS.map(([t, c]) => [`${t}.${c}`, present.has(`${t}.${c}`)]),
        ),
    };
}

function report(label: string, presence: Presence): void {
    console.log(`\n${label}`);
    for (const [name, ok] of Object.entries(presence.tables)) {
        console.log(`  table  ${ok ? '✓' : '·'} ${name}`);
    }
    for (const [name, ok] of Object.entries(presence.columns)) {
        console.log(`  column ${ok ? '✓' : '·'} ${name}`);
    }
}

function missingCount(presence: Presence): number {
    return [...Object.values(presence.tables), ...Object.values(presence.columns)]
        .filter((ok) => !ok).length;
}

async function main() {
    const dryRun = process.argv.includes('--dry');
    const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

    if (!url) {
        console.error('Set DIRECT_URL (preferred) or DATABASE_URL before running.');
        process.exit(1);
    }
    if (url.includes('6543') || url.includes('pgbouncer=true')) {
        console.error(
            'Refusing to run DDL through the transaction pooler (port 6543).\n' +
            'Use the session pooler on port 5432 as DIRECT_URL — see README.',
        );
        process.exit(1);
    }

    // Supabase presents a real certificate; keep verification on.
    const client = new Client({ connectionString: url });
    await client.connect();

    try {
        const before = await inspect(client);
        report('Before:', before);

        if (missingCount(before) === 0) {
            console.log('\nEverything is already present — nothing to apply.');
            return;
        }
        if (dryRun) {
            console.log(`\n${missingCount(before)} object(s) missing. Re-run without --dry to apply.`);
            return;
        }

        for (const name of MIGRATIONS) {
            const sql = readFileSync(resolve(migrationsDir, name, 'migration.sql'), 'utf8');
            process.stdout.write(`\nApplying ${name} ... `);
            // Each migration is one transaction: a failure leaves nothing half-applied.
            await client.query('BEGIN');
            try {
                await client.query(sql);
                await client.query('COMMIT');
                console.log('ok');
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            }
        }

        const after = await inspect(client);
        report('After:', after);

        const stillMissing = missingCount(after);
        if (stillMissing > 0) {
            console.error(`\n${stillMissing} object(s) still missing — check the output above.`);
            process.exitCode = 1;
        } else {
            console.log('\nAll C2S objects present. Run `npx prisma generate` next.');
        }
    } finally {
        await client.end();
    }
}

main().catch((error) => {
    console.error('\nMigration failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
