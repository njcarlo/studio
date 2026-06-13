-- Major Event Request tables (SRD 5.11) are managed exclusively via Prisma
-- Server Actions (apps/web/src/actions/db.ts + services/major-event-workflow.ts):
-- catalogue CRUD and the enable/disable toggle in Settings (Sys Admin), and
-- request creation/listing for any worker. Approval decisions go through the
-- existing ApprovalWorkflow/ApprovalStage RLS (20260613080000). Prisma
-- connects as the table-owning role and bypasses RLS, so enabling RLS with no
-- policies here is a deny-all for PostgREST/anon/authenticated, matching the
-- lockdown pattern used for DepartmentSetting, AssistanceConfiguration, etc.

alter table public."MajorEventServiceCatalogItem" enable row level security;
alter table public."MajorEventRequest" enable row level security;
alter table public."MajorEventRequestItem" enable row level security;
alter table public."MajorEventSetting" enable row level security;
