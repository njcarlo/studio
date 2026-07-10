-- Indexes + functions for Room Reservation (Booking) and Worker Management
-- reads at 20k+ row scale.

-- getBookings / getBookingsForRoomOnDate: every call filters on one or more
-- of these columns with zero index support today (full seq scan on Booking).
CREATE INDEX IF NOT EXISTS idx_booking_room_id ON "Booking" ("roomId");
CREATE INDEX IF NOT EXISTS idx_booking_worker_profile_id ON "Booking" ("workerProfileId");
CREATE INDEX IF NOT EXISTS idx_booking_status ON "Booking" ("status");
CREATE INDEX IF NOT EXISTS idx_booking_start ON "Booking" ("start");
-- getBookingsForRoomOnDate: roomId + start range together (kiosk polling, masterview).
CREATE INDEX IF NOT EXISTS idx_booking_room_start ON "Booking" ("roomId", "start");

-- getPaginatedWorkers: ILIKE '%term%' search on these columns can't use a
-- plain btree index. pg_trgm + GIN makes substring search index-backed.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_worker_first_name_trgm ON "Worker" USING gin ("firstName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_worker_last_name_trgm ON "Worker" USING gin ("lastName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_worker_worker_id_trgm ON "Worker" USING gin ("workerId" gin_trgm_ops);

-- Replaces getBookingsForRoomOnDate's JS day-boundary math with a single
-- indexed query (uses idx_booking_room_start).
CREATE OR REPLACE FUNCTION fn_room_bookings_for_date(p_room_id text, p_date date)
RETURNS SETOF "Booking"
LANGUAGE sql
STABLE
AS $$
    SELECT b.*
    FROM "Booking" b
    WHERE b."roomId" = p_room_id
      AND b."start" >= p_date::timestamp
      AND b."start" < (p_date + 1)::timestamp
    ORDER BY b."start" ASC;
$$;

-- Replaces getPaginatedWorkers' two round trips (count query + select query)
-- with one query using COUNT(*) OVER() for the total, and routes the search
-- filter through the trigram indexes above instead of a seq scan.
CREATE OR REPLACE FUNCTION fn_workers_search(
    p_search text DEFAULT NULL,
    p_search_mode text DEFAULT 'workerId',
    p_ministry_ids text[] DEFAULT NULL,
    p_status text DEFAULT NULL,
    p_sort_field text DEFAULT 'role',
    p_sort_dir text DEFAULT 'asc',
    p_limit int DEFAULT 25,
    p_offset int DEFAULT 0
)
RETURNS TABLE (
    id text,
    "workerId" text,
    "firstName" text,
    "lastName" text,
    email text,
    phone text,
    "roleId" text,
    status text,
    "avatarUrl" text,
    "majorMinistryId" text,
    "minorMinistryId" text,
    "employmentType" text,
    "passwordChangeRequired" boolean,
    "qrToken" text,
    "createdAt" timestamp,
    capabilities text[],
    total_count bigint
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_dir text := CASE WHEN lower(p_sort_dir) = 'desc' THEN 'DESC' ELSE 'ASC' END;
BEGIN
    RETURN QUERY EXECUTE format(
        $q$
        SELECT w.id, w."workerId", w."firstName", w."lastName", w.email, w.phone,
               w."roleId", w.status, w."avatarUrl", w."majorMinistryId", w."minorMinistryId",
               w."employmentType", w."passwordChangeRequired", w."qrToken", w."createdAt",
               w.capabilities,
               COUNT(*) OVER() AS total_count
        FROM "Worker" w
        LEFT JOIN "Role" r ON r.id = w."roleId"
        WHERE ($1 IS NULL OR $1 = '{}' OR w."majorMinistryId" = ANY($1) OR w."minorMinistryId" = ANY($1))
          AND ($2 IS NULL OR w.status = $2)
          AND (
                $3 IS NULL
                OR ($4 = 'name' AND (w."firstName" ILIKE '%%' || $3 || '%%' OR w."lastName" ILIKE '%%' || $3 || '%%'))
                OR ($4 <> 'name' AND w."workerId" ILIKE '%%' || $3 || '%%')
              )
        ORDER BY %s
        LIMIT $5 OFFSET $6
        $q$,
        CASE p_sort_field
            WHEN 'workerId' THEN format('w."workerId" %s NULLS LAST', v_dir)
            WHEN 'name' THEN format('w."firstName" %s, w."lastName" %s', v_dir, v_dir)
            WHEN 'status' THEN format('w."status" %s', v_dir)
            WHEN 'contact' THEN format('w.email %s', v_dir)
            WHEN 'role' THEN format(
                $o$
                CASE
                    WHEN w."isSeniorPastor" THEN 1
                    WHEN w.id IN (SELECT "headId" FROM "DepartmentSetting" WHERE "headId" IS NOT NULL) THEN 2
                    WHEN w.id IN (SELECT "headId" FROM "Ministry" WHERE "headId" IS NOT NULL) THEN 3
                    WHEN r.name IS NOT NULL AND r.name <> 'Viewer' THEN 4
                    ELSE 5
                END %s,
                CASE WHEN r.name IS NOT NULL AND r.name <> 'Viewer' THEN r.name ELSE NULL END %s,
                w."firstName" %s, w."lastName" %s
                $o$,
                v_dir, v_dir, v_dir, v_dir
            )
            ELSE format('w."createdAt" DESC')
        END
    )
    USING p_ministry_ids, p_status, p_search, p_search_mode, p_limit, p_offset;
END;
$$;
