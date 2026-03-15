-- Tract Tracker: user tract counts table
-- Run this in your Supabase SQL Editor

create table if not exists public.tract_users (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  name        text,
  email       text unique not null,
  region      text,
  sub_region  text,
  barangay    text,
  tracts_given int not null default 0,
  created_at  timestamptz default now()
);

-- Index for fast lookups by auth user
create index if not exists tract_users_user_id_idx on public.tract_users(user_id);

-- Enable Row Level Security
alter table public.tract_users enable row level security;

-- Users can read all rows (for leaderboard/admin view)
create policy "Anyone can read tract_users"
  on public.tract_users for select
  using (true);

-- Users can only insert their own row
create policy "Users can insert own row"
  on public.tract_users for insert
  with check (auth.uid() = user_id);

-- Users can only update their own row
create policy "Users can update own row"
  on public.tract_users for update
  using (auth.uid() = user_id);

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
  where user_id = uid;
$$;
