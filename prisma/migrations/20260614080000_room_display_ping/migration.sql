-- Room display realtime ping (SRD 5.8.3)

CREATE TABLE "RoomDisplayPing" (
    "roomId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomDisplayPing_pkey" PRIMARY KEY ("roomId")
);
