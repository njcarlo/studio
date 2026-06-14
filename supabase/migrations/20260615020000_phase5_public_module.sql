-- Phase 5 — Attendee-facing public module (5.13): sermons catalogue,
-- public service schedule directory (uses existing ServiceSchedule.isPublic),
-- event sign-ups, and prayer/counselling requests.

-- Sermon
create table if not exists public."Sermon" (
  id          text primary key default gen_random_uuid()::text,
  title       text not null,
  speaker     text,
  date        timestamptz not null,
  scripture   text,
  description text,
  "videoUrl"  text,
  "audioUrl"  text,
  "isPublic"  boolean not null default true,
  "createdBy" text not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- ChurchEvent: public visibility toggle for /public/events sign-ups
alter table public."ChurchEvent"
  add column if not exists "isPublic" boolean not null default false;

-- EventSignup
create table if not exists public."EventSignup" (
  id          text primary key default gen_random_uuid()::text,
  "eventId"   text not null references public."ChurchEvent"(id) on delete cascade,
  name        text not null,
  email       text not null,
  phone       text,
  "guestCount" integer not null default 1,
  notes       text,
  "createdAt" timestamptz not null default now()
);

create index if not exists "EventSignup_eventId_idx" on public."EventSignup"("eventId");

-- PrayerRequest
create table if not exists public."PrayerRequest" (
  id          text primary key default gen_random_uuid()::text,
  name        text not null,
  email       text not null,
  phone       text,
  type        text not null,
  message     text not null,
  status      text not null default 'New',
  "assignedTo" text,
  response    text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists "PrayerRequest_status_idx" on public."PrayerRequest"(status);

-- ---------------------------------------------------------------------------
-- RLS — all access goes through Prisma Server Actions (withPublicAction /
-- withPermission), which connect as the table-owning role and bypass RLS.
-- Enable RLS with no policies, same deny-all-via-PostgREST stance as
-- ChurchEvent and other Prisma-only tables (20260612010001).
-- ---------------------------------------------------------------------------

alter table public."Sermon" enable row level security;
alter table public."EventSignup" enable row level security;
alter table public."PrayerRequest" enable row level security;
