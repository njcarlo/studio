-- My Group feature: per-mentee notes for mentors/admins.

alter table public."C2SMentee"
  add column if not exists "notes" text;
