import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitStatements } from './apply-c2s-migrations';

/**
 * The statement splitter is the sharp edge of the migration runner: Prisma
 * sends one statement per call, so a splitting bug silently drops DDL rather
 * than failing loudly. An early version filtered out any chunk beginning with
 * `--`, which quietly discarded five statements from the hierarchy migration
 * and the whole of the meeting-mode one, because each opens with a comment.
 */

const migrationsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../prisma/migrations');

const read = (name: string) =>
    readFileSync(resolve(migrationsDir, name, 'migration.sql'), 'utf8');

test('a DO $$ block stays a single statement', () => {
    const parts = splitStatements(`
DO $$ BEGIN
    ALTER TABLE "A" ADD CONSTRAINT "a_fkey" FOREIGN KEY ("x") REFERENCES "B"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
SELECT 1;`);

    assert.equal(parts.length, 2);
    assert.ok(parts[0].includes('EXCEPTION WHEN duplicate_object'));
});

test('semicolons inside string literals do not split', () => {
    assert.equal(splitStatements(`INSERT INTO t VALUES ('a;b'); SELECT 2;`).length, 2);
});

test("'' escapes inside string literals are handled", () => {
    assert.equal(splitStatements(`INSERT INTO t VALUES ('it''s; fine'); SELECT 3;`).length, 2);
});

test('semicolons inside comments do not split', () => {
    assert.equal(splitStatements(`-- a; comment\nSELECT 4;\n/* another; one */\nSELECT 5;`).length, 2);
});

test('a statement introduced by a comment is kept, not dropped', () => {
    const parts = splitStatements('-- add a column\nALTER TABLE "T" ADD COLUMN "c" TEXT;');
    assert.equal(parts.length, 1);
    assert.ok(parts[0].startsWith('ALTER TABLE'));
});

test('a comment-only tail produces no statement', () => {
    assert.equal(splitStatements('SELECT 1;\n-- trailing note\n').length, 1);
});

test('every C2S migration yields the statements it should', () => {
    const counts: Record<string, number> = {
        '20260809010000_c2s_hierarchy': 55,
        '20260809020000_c2s_pipeline_timeline': 6,
        '20260809030000_c2s_meeting_mode': 1,
    };

    for (const [name, expected] of Object.entries(counts)) {
        const parts = splitStatements(read(name));
        assert.equal(parts.length, expected, `${name} split into ${parts.length}, expected ${expected}`);
        assert.ok(parts.every((p) => p.trim().length > 0), `${name} produced an empty statement`);
        assert.ok(
            parts.every((p) => (p.match(/\$\$/g) ?? []).length % 2 === 0),
            `${name} left a dollar-quote unbalanced`,
        );
        assert.ok(
            parts.every((p) => !p.trimStart().startsWith('--')),
            `${name} left a leading comment on a statement`,
        );
    }
});

test('the hierarchy migration guards all five foreign keys', () => {
    const parts = splitStatements(read('20260809010000_c2s_hierarchy'));
    assert.equal(parts.filter((p) => p.startsWith('DO $$')).length, 5);
});

test('the migrations stay replayable', () => {
    const hierarchy = read('20260809010000_c2s_hierarchy');
    const timeline = read('20260809020000_c2s_pipeline_timeline');

    // Bare ADD COLUMN / CREATE TABLE would fail on a second run.
    assert.ok(!/ADD COLUMN "/.test(hierarchy), 'found an unguarded ADD COLUMN');
    assert.ok(!/CREATE TABLE "/.test(hierarchy), 'found an unguarded CREATE TABLE');
    assert.ok(!/CREATE (UNIQUE )?INDEX "/.test(hierarchy), 'found an unguarded CREATE INDEX');

    // The backfill must only fill NULLs, or a replay overwrites real timestamps.
    const updates = timeline.match(/UPDATE "C2SJoinRequest"[\s\S]*?;/g) ?? [];
    assert.equal(updates.length, 3);
    assert.ok(updates.every((u) => u.includes('IS NULL')), 'a backfill could overwrite data');
});
