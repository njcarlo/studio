-- Room display realtime (SRD 5.8.3). RoomDisplayPing contains only a roomId
-- and timestamp (no booking content), so it's safe to expose read-only to
-- anon — the unauthenticated kiosk display subscribes to it via Supabase
-- Realtime and, on a ping, refetches booking details through the existing
-- `getBookings` server action (Prisma, bypasses RLS).

alter table public."RoomDisplayPing" enable row level security;

create policy "room_display_ping_select_anon" on public."RoomDisplayPing"
  for select to anon, authenticated using (true);

-- Trigger: any insert/update/delete on Booking upserts a ping row for the
-- affected roomId, bumping updatedAt so the realtime UPDATE event fires even
-- if the row already exists.
create or replace function public.ping_room_display()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public."RoomDisplayPing" ("roomId", "updatedAt")
  values (coalesce(new."roomId", old."roomId"), now())
  on conflict ("roomId") do update set "updatedAt" = now();
  return null;
end;
$$;

drop trigger if exists booking_ping_room_display on public."Booking";
create trigger booking_ping_room_display
after insert or update or delete on public."Booking"
for each row execute function public.ping_room_display();

-- Add to the realtime publication so postgres_changes subscriptions fire.
alter publication supabase_realtime add table public."RoomDisplayPing";
