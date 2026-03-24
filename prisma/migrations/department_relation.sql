-- Migration: ministry-department-relation
-- Replace Ministry.department enum column with required FK to Department table.

DO $$
BEGIN
    -- Table names and type names share a namespace in Postgres.
    -- If a legacy enum "Department" exists, rename it before creating the table.
    IF EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'Department'
          AND typtype = 'e'
    ) THEN
        ALTER TYPE "Department" RENAME TO "Department_enum_legacy";
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Department" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    CONSTRAINT "Department_pkey" PRIMARY KEY ("code")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Department_name_key" ON "Department"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Department_weight_key" ON "Department"("weight");

INSERT INTO "Department" ("code", "name", "weight")
VALUES
    ('W', 'Worship', 1),
    ('O', 'Outreach', 2),
    ('R', 'Relationship', 3),
    ('D', 'Discipleship', 4),
    ('A', 'Administration', 5)
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "weight" = EXCLUDED."weight";

ALTER TABLE "Ministry"
ADD COLUMN IF NOT EXISTS "departmentCode" TEXT;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Ministry'
          AND column_name = 'department'
    ) THEN
        UPDATE "Ministry"
        SET "departmentCode" = CASE
            WHEN "department"::text = 'Worship' THEN 'W'
            WHEN "department"::text = 'Outreach' THEN 'O'
            WHEN "department"::text = 'Relationship' THEN 'R'
            WHEN "department"::text = 'Discipleship' THEN 'D'
            WHEN "department"::text = 'Administration' THEN 'A'
            ELSE COALESCE("departmentCode", 'D')
        END
        WHERE "departmentCode" IS NULL;

        ALTER TABLE "Ministry" DROP COLUMN "department";
    END IF;
END $$;

UPDATE "Ministry"
SET "departmentCode" = 'D'
WHERE "departmentCode" IS NULL;

ALTER TABLE "Ministry"
ALTER COLUMN "departmentCode" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "Ministry_departmentCode_idx" ON "Ministry"("departmentCode");

ALTER TABLE "Ministry" DROP CONSTRAINT IF EXISTS "Ministry_departmentCode_fkey";
ALTER TABLE "Ministry"
ADD CONSTRAINT "Ministry_departmentCode_fkey"
FOREIGN KEY ("departmentCode") REFERENCES "Department"("code")
ON DELETE RESTRICT ON UPDATE CASCADE;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'Department_enum_legacy'
          AND typtype = 'e'
    ) THEN
        DROP TYPE "Department_enum_legacy";
    END IF;
END $$;
