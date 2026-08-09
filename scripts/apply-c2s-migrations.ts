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
 * Uses the Prisma client the repo already ships — no extra dependency to
 * install first. Connects with DIRECT_URL (falling back to DATABASE_URL); use
 * a session-mode connection, because the transaction pooler on port 6543
 * cannot run DDL reliably.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
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

/**
 * Splits a migration file into individual statements.
 *
 * Prisma sends one statement per call, so the file cannot be handed over
 * whole. Naively splitting on `;` would break the `DO $$ ... $$` blocks that
 * guard the foreign keys, so this tracks dollar-quoted bodies, string
 * literals and both comment styles.
 */
export function splitStatements(sql: string): string[] {
    const statements: string[] = [];
    let current = '';
    let i = 0;

    while (i < sql.length) {
        const rest = sql.slice(i);

        // -- line comment
        if (rest.startsWith('--')) {
            const end = sql.indexOf('\n', i);
            const stop = end === -1 ? sql.length : end;
            current += sql.slice(i, stop);
            i = stop;
            continue;
        }

        // /* block comment */
        if (rest.startsWith('/*')) {
            const end = sql.indexOf('*/', i + 2);
            const stop = end === -1 ? sql.length : end + 2;
            current += sql.slice(i, stop);
            i = stop;
            continue;
        }

        // 'string literal', with '' as the escape
        if (sql[i] === "'") {
            let j = i + 1;
            while (j < sql.length) {
                if (sql[j] === "'" && sql[j + 1] === "'") { j += 2; continue; }
                if (sql[j] === "'") { j += 1; break; }
                j += 1;
            }
            current += sql.slice(i, j);
            i = j;
            continue;
        }

        // $tag$ dollar-quoted body $tag$ (tag may be empty, as in $$)
        const dollar = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(rest);
        if (dollar) {
            const tag = dollar[0];
            const end = sql.indexOf(tag, i + tag.length);
            const stop = end === -1 ? sql.length : end + tag.length;
            current += sql.slice(i, stop);
            i = stop;
            continue;
        }

        if (sql[i] === ';') {
            statements.push(current);
            current = '';
            i += 1;
            continue;
        }

        current += sql[i];
        i += 1;
    }

    statements.push(current);

    // A chunk usually opens with the comment that introduced it. Strip leading
    // comments before deciding whether anything executable remains — dropping
    // the whole chunk because it *starts* with `--` would silently skip the
    // statement underneath it.
    return statements
        .map(stripLeadingComments)
        .filter((s) => s.length > 0);
}

function stripLeadingComments(statement: string): string {
    let s = statement.trim();
    for (;;) {
        if (s.startsWith('--')) {
            const nl = s.indexOf('\n');
            if (nl === -1) return '';
            s = s.slice(nl + 1).trim();
            continue;
        }
        if (s.startsWith('/*')) {
            const end = s.indexOf('*/');
            if (end === -1) return '';
            s = s.slice(end + 2).trim();
            continue;
        }
        return s;
    }
}

type Presence = { tables: Record<string, boolean>; columns: Record<string, boolean> };

async function inspect(prisma: PrismaClient): Promise<Presence> {
    const tables = await prisma.$queryRawUnsafe<{ table_name: string }[]>(
        `SELECT table_name FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
        EXPECTED_TABLES,
    );
    const columnTables = [...new Set(EXPECTED_COLUMNS.map(([t]) => t))];
    const columns = await prisma.$queryRawUnsafe<{ table_name: string; column_name: string }[]>(
        `SELECT table_name, column_name FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
        columnTables,
    );

    const present = new Set(columns.map((r) => `${r.table_name}.${r.column_name}`));
    return {
        tables: Object.fromEntries(
            EXPECTED_TABLES.map((t) => [t, tables.some((r) => r.table_name === t)]),
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
            'Use the session pooler on port 5432 as DIRECT_URL — see docs/C2S_DEPLOY_CHECKLIST.md.',
        );
        process.exit(1);
    }

    const prisma = new PrismaClient({ datasources: { db: { url } } });

    try {
        const before = await inspect(prisma);
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
            const statements = splitStatements(sql);
            process.stdout.write(`\nApplying ${name} (${statements.length} statements) ... `);

            // One transaction per migration: a failure leaves nothing half-applied.
            await prisma.$transaction(
                async (tx) => {
                    for (const statement of statements) {
                        await tx.$executeRawUnsafe(statement);
                    }
                },
                { timeout: 120_000 },
            );
            console.log('ok');
        }

        const after = await inspect(prisma);
        report('After:', after);

        const stillMissing = missingCount(after);
        if (stillMissing > 0) {
            console.error(`\n${stillMissing} object(s) still missing — check the output above.`);
            process.exitCode = 1;
        } else {
            console.log('\nAll C2S objects present. Run `npx prisma generate` next.');
        }
    } finally {
        await prisma.$disconnect();
    }
}

// Only run when invoked directly, so the splitter can be imported by a test.
const invokedDirectly =
    !!process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
    main().catch((error) => {
        console.error('\nMigration failed:', error instanceof Error ? error.message : error);
        process.exitCode = 1;
    });
}
