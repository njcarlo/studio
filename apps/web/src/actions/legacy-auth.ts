"use server";

import crypto from "crypto";
import { prisma } from "@studio/database/prisma";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type LegacyLoginResult = {
  success: boolean;
  email?: string;
  error?: string;
};

const LEGACY_LOGIN_WINDOW_MINUTES = 15;
const LEGACY_LOGIN_MAX_ATTEMPTS = 5;

function isWorkerIdLoginEnabled(): boolean {
  const raw =
    process.env.ENABLE_WORKER_ID_LOGIN ??
    process.env.NEXT_PUBLIC_ENABLE_WORKER_ID_LOGIN;
  if (raw == null) return true;
  return raw.toLowerCase() !== "false";
}

async function logLegacyAuthEvent(
  action: "legacy_login" | "legacy_login_failed",
  details: string,
  targetId?: string,
) {
  try {
    await prisma.transactionLog.create({
      data: {
        action,
        module: "auth",
        details,
        targetId,
      },
    });
  } catch {
    // Logging must never block auth flow.
  }
}

async function getRecentFailedAttempts(workerNumber: number): Promise<number> {
  const windowStart = new Date(
    Date.now() - LEGACY_LOGIN_WINDOW_MINUTES * 60 * 1000,
  );

  return prisma.transactionLog.count({
    where: {
      module: "auth",
      action: "legacy_login_failed",
      targetId: String(workerNumber),
      timestamp: { gte: windowStart },
    },
  });
}

export async function legacyWorkerIdLogin(
  workerNumber: number,
  password: string,
): Promise<LegacyLoginResult> {
  const genericError = "Invalid Worker ID or password.";

  if (!isWorkerIdLoginEnabled()) {
    await logLegacyAuthEvent(
      "legacy_login_failed",
      "Worker ID login attempted while feature flag is disabled",
      String(workerNumber),
    );
    return {
      success: false,
      error: "Worker ID login is currently disabled.",
    };
  }

  if (!Number.isInteger(workerNumber) || workerNumber <= 0 || !password) {
    return { success: false, error: genericError };
  }

  const recentAttempts = await getRecentFailedAttempts(workerNumber);
  if (recentAttempts >= LEGACY_LOGIN_MAX_ATTEMPTS) {
    await logLegacyAuthEvent(
      "legacy_login_failed",
      `Rate limit hit for worker #${workerNumber}`,
      String(workerNumber),
    );
    return {
      success: false,
      error: "Too many failed attempts. Please try again later.",
    };
  }

  type LegacyWorkerLookup = {
    id: string;
    email: string | null;
    status: string;
    legacyPasswordHash: string | null;
    firstName: string;
    lastName: string;
  };

  const rows = await prisma.$queryRaw<LegacyWorkerLookup[]>`
    SELECT
      "id",
      "email",
      "status",
      "legacyPasswordHash",
      "firstName",
      "lastName"
    FROM "Worker"
    WHERE "workerNumber" = ${workerNumber}
       OR "workerId" = ${String(workerNumber)}
    LIMIT 1
  `;
  const worker = rows[0];

  if (!worker || !worker.email || !worker.legacyPasswordHash) {
    await logLegacyAuthEvent(
      "legacy_login_failed",
      `Failed legacy login for workerNumber ${workerNumber}: missing worker/email/hash`,
      String(workerNumber),
    );
    return { success: false, error: genericError };
  }

  if (worker.status !== "Active") {
    await logLegacyAuthEvent(
      "legacy_login_failed",
      `Failed legacy login for worker #${workerNumber}: inactive account`,
      String(workerNumber),
    );
    return {
      success: false,
      error: "Your account is inactive. Please contact your administrator.",
    };
  }

  const submittedHash = crypto
    .createHash("md5")
    .update(password)
    .digest("hex")
    .toLowerCase();
  const storedHash = worker.legacyPasswordHash.trim().toLowerCase();

  if (submittedHash !== storedHash) {
    await logLegacyAuthEvent(
      "legacy_login_failed",
      `Failed legacy login for worker #${workerNumber}: hash mismatch`,
      String(workerNumber),
    );
    return { success: false, error: genericError };
  }

  const supabaseAdmin = getSupabaseAdminClient();
  const { error } = await supabaseAdmin.auth.admin.updateUserById(worker.id, {
    password,
    email_confirm: true,
  });

  if (error) {
    await logLegacyAuthEvent(
      "legacy_login_failed",
      `Failed legacy login for worker #${workerNumber}: ${error.message}`,
      String(workerNumber),
    );
    return {
      success: false,
      error: genericError,
    };
  }

  await logLegacyAuthEvent(
    "legacy_login",
    `Worker #${workerNumber} (${worker.firstName} ${worker.lastName}) logged in via Worker ID`,
    worker.id,
  );

  return { success: true, email: worker.email };
}
