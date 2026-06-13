-- RLS for TransactionLog. SELECT is broad for any authenticated worker.
-- INSERT is open (append-only audit trail, matches current no-gate
-- behavior). No UPDATE/DELETE policies.

alter table public."TransactionLog" enable row level security;

create policy "transactionlog_select_authenticated" on public."TransactionLog"
  for select to authenticated using (true);

create policy "transactionlog_insert_any" on public."TransactionLog"
  for insert to authenticated with check (true);
