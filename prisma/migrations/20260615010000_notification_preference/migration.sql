-- Per-worker notification channel preferences (Layer 3)

CREATE TABLE "NotificationPreference" (
    "workerId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("workerId")
);

ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
