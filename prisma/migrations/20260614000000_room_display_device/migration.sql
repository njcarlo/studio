-- Phase 2 item 2: Room Display Monitor (SRD 5.8.3).
-- A registered kiosk/tablet device, identified by an opaque token, assigned
-- to a single room. No worker login required for the kiosk itself.

CREATE TABLE "RoomDisplayDevice" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "roomId" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomDisplayDevice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RoomDisplayDevice_token_key" ON "RoomDisplayDevice"("token");

ALTER TABLE "RoomDisplayDevice" ADD CONSTRAINT "RoomDisplayDevice_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
