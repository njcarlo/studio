-- RLS for ApprovalRequest. SELECT is broad for any authenticated worker.
-- INSERT is open (any worker can submit a request). UPDATE (approve/reject)
-- requires one of the approvals/venues approval permissions. No DELETE
-- policy.

alter table public."ApprovalRequest" enable row level security;

create policy "approvalrequest_select_authenticated" on public."ApprovalRequest"
  for select to authenticated using (true);

create policy "approvalrequest_insert_any" on public."ApprovalRequest"
  for insert to authenticated with check (true);

create policy "approvalrequest_update_approvers" on public."ApprovalRequest"
  for update to authenticated using (
    public.has_permission('approvals','manage')
    or public.has_permission('approvals','approve_all')
    or public.has_permission('approvals','approve_events')
    or public.has_permission('venues','approve')
  ) with check (
    public.has_permission('approvals','manage')
    or public.has_permission('approvals','approve_all')
    or public.has_permission('approvals','approve_events')
    or public.has_permission('venues','approve')
  );
