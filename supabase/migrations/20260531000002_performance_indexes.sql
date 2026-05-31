-- Performance indexes per implementation plan

-- Speed up worker allocation lookups (schedule assignment, eligible worker search)
CREATE INDEX IF NOT EXISTS idx_worker_ministry_status
ON "Worker" ("status", "majorMinistryId", "minorMinistryId");

-- Speed up item category filtering in inventory
CREATE INDEX IF NOT EXISTS idx_inventory_item_category
ON "InventoryItem" ("categoryId", "status");

-- Speed up time overlap checking in venue bookings (correct column names: start/end)
CREATE INDEX IF NOT EXISTS idx_booking_time_room
ON "Booking" ("roomId", "start", "end") WHERE "status" != 'Cancelled';

-- Speed up approval request lookups by worker and status
CREATE INDEX IF NOT EXISTS idx_approval_worker_status
ON "ApprovalRequest" ("workerId", "status");

-- Speed up approval ministry-change lookups
CREATE INDEX IF NOT EXISTS idx_approval_ministry_ids
ON "ApprovalRequest" ("oldMajorId", "oldMinorId", "newMajorId", "newMinorId");
