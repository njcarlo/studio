-- RLS for the generic Approval Workflow engine (Layer 2).
-- Workflows/stages are written exclusively by the service-role Prisma layer
-- (apps/web/src/services/approval-engine.ts), which enforces approver
-- authorization in-app. RLS here only governs client-side reads:
--   - the requester can see their own workflows
--   - a worker who can act on a stage (per its approverSpec) can see the
--     workflow that stage belongs to
--   - super admins / holders of approvals:manage can see everything
-- No insert/update/delete policies — those go through the service role only.

create or replace function public.can_act_on_approval_stage(p_spec jsonb) returns boolean
language sql stable security definer set search_path = public as $$
  select case p_spec->>'kind'
    when 'worker' then p_spec->>'workerId' = public.current_worker_id()
    when 'permission' then public.has_permission(p_spec->>'module', p_spec->>'action')
    when 'ministryRole' then exists (
      select 1 from "Ministry" m
      where m.id = p_spec->>'ministryId'
        and (
          case p_spec->>'role'
            when 'head' then public.current_worker_id() = m."headId"
            when 'manager' then public.current_worker_id() = m."managerId"
            when 'approver' then public.current_worker_id() = m."approverId"
            when 'scheduler' then public.current_worker_id() = any(m."schedulerIds")
            else false
          end
        )
    )
    else false
  end
$$;

grant execute on function public.can_act_on_approval_stage(jsonb) to authenticated, anon;

alter table public."ApprovalWorkflow" enable row level security;
alter table public."ApprovalStage" enable row level security;

create policy "approvalworkflow_select" on public."ApprovalWorkflow"
  for select to authenticated using (
    "requesterId" = public.current_worker_id()
    or public.has_permission('approvals', 'manage')
    or exists (
      select 1 from "ApprovalStage" s
      where s."workflowId" = "ApprovalWorkflow".id
        and public.can_act_on_approval_stage(s."approverSpec")
    )
  );

create policy "approvalstage_select" on public."ApprovalStage"
  for select to authenticated using (
    public.has_permission('approvals', 'manage')
    or public.can_act_on_approval_stage("approverSpec")
    or exists (
      select 1 from "ApprovalWorkflow" w
      where w.id = "ApprovalStage"."workflowId"
        and w."requesterId" = public.current_worker_id()
    )
  );
