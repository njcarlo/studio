import { getApps, initializeApp, type App } from 'firebase-admin/app';

/**
 * Idempotent Firebase Admin SDK initializer for Cloud Functions.
 *
 * Credentials: Application Default Credentials (ADC) on GCP / the Functions
 * runtime. Project id is taken from GCLOUD_PROJECT, GOOGLE_CLOUD_PROJECT, or
 * FIREBASE_CONFIG.projectId when present.
 *
 * Auth emulator: set FIREBASE_AUTH_EMULATOR_HOST (e.g. `127.0.0.1:9099`) and
 * the Admin SDK auto-routes Auth calls to the emulator — no extra code needed.
 */
export function adminApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0]!;

  let projectId =
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    undefined;

  if (!projectId && process.env.FIREBASE_CONFIG) {
    try {
      const cfg = JSON.parse(process.env.FIREBASE_CONFIG) as { projectId?: string };
      projectId = cfg.projectId;
    } catch {
      // ignore malformed FIREBASE_CONFIG
    }
  }

  return initializeApp(projectId ? { projectId } : undefined);
}
