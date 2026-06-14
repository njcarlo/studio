-- MealStubLedger (Layer 6 reporting ledger, SRD 5.4) is written exclusively by
-- apps/web/src/services/meal-stub-engine.ts via Prisma (table-owning role,
-- bypasses RLS). Enable RLS with no policies — deny-all for
-- PostgREST/anon/authenticated, matching the lockdown pattern used for
-- TrainingRecord, LeaveRequest, MasterSchedule, etc.

alter table public."MealStubLedger" enable row level security;
