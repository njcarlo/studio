-- RLS for AttendanceRecord and ScanLog. SELECT is broad for any
-- authenticated worker. INSERT requires attendance:scan; both tables are
-- append-only from PostgREST's perspective (no UPDATE/DELETE policies).

alter table public."AttendanceRecord" enable row level security;
alter table public."ScanLog" enable row level security;

-- AttendanceRecord
create policy "attendancerecord_select_authenticated" on public."AttendanceRecord"
  for select to authenticated using (true);

create policy "attendancerecord_insert_attendance_scan" on public."AttendanceRecord"
  for insert to authenticated with check (public.has_permission('attendance','scan'));

-- ScanLog
create policy "scanlog_select_authenticated" on public."ScanLog"
  for select to authenticated using (true);

create policy "scanlog_insert_attendance_scan" on public."ScanLog"
  for insert to authenticated with check (public.has_permission('attendance','scan'));
