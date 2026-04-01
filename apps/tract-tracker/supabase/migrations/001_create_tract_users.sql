-- Tract Tracker: user tract counts table
-- Run this in your Supabase SQL Editor

create table if not exists public.tract_users (
  id          uuid primary key default gen_random_uuid(),
  password    text not null, -- Stores the raw or hashed password directly in the table
  name        text,
  email       text unique not null,
  region      text,
  sub_region  text,
  barangay    text,
  tracts_given int not null default 0,
  created_at  timestamptz default now()
);

-- Index for fast lookups by auth user
-- Enable Row Level Security (optional, we use service_role admin client)
alter table public.tract_users enable row level security;

-- Users can read all rows (for leaderboard/admin view)
create policy "Anyone can read tract_users"
  on public.tract_users for select
  using (true);

-- To bypass inserts and updates, we just use the supabaseAdmin client in the app.

-- Service role can update all rows (for admin reset)
-- This is handled automatically by the service role key bypassing RLS

-- Atomic increment function (avoids race conditions)
create or replace function public.increment_tracts(uid uuid)
returns void
language sql
security definer
as $$
  update public.tract_users
  set tracts_given = tracts_given + 1
  where id = uid;
$$;
