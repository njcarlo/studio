-- Public Group Finder: searchable/filterable directory fields for C2SGroup
-- (age group, demographics tags, meetup day, and static map pin position).

alter table public."C2SGroup"
  add column if not exists "ageGroupLabel" text,
  add column if not exists "ageRangeMin" integer,
  add column if not exists "ageRangeMax" integer,
  add column if not exists "meetupDay" text,
  add column if not exists "demographics" text[] not null default '{}',
  add column if not exists "mapX" double precision,
  add column if not exists "mapY" double precision;

-- Group Finder "Join C2S Group" form: richer applicant details.
alter table public."C2SJoinRequest"
  add column if not exists "birthday" timestamptz,
  add column if not exists "gender" text,
  add column if not exists "socialMediaLink" text,
  add column if not exists "firstAttendedMonth" text,
  add column if not exists "firstAttendedYear" integer,
  add column if not exists "privacyAccepted" boolean not null default false;
