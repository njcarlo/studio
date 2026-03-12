import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

export function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  // Try to find service-account.json in the folder or parent folders
  let serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  // If it's a relative path, resolve it relative to the workspace root if possible, 
  // otherwise relative to current working directory.
  if (serviceAccountPath && !path.isAbsolute(serviceAccountPath)) {
    // In this monorepo, it's usually at the root: c:\Users\Jace\Antigravity\studio\service-account.json
    // We can try to find the root by looking for package.json with "studio-monorepo"
    serviceAccountPath = path.resolve(process.cwd(), serviceAccountPath);
    
    // Fallback search if not found at CWD (useful for scripts in apps/web)
    if (!fs.existsSync(serviceAccountPath)) {
      serviceAccountPath = path.resolve(process.cwd(), '../../', 'service-account.json');
    }
  }

  const config: admin.AppOptions = {
    projectId: 'studio-3072837227-9a1db' // Explicitly set the project ID
  };

  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    config.credential = admin.credential.cert(serviceAccountPath);
  } else {
    // Fallback to application default (works in App Hosting/Cloud Run)
    try {
      config.credential = admin.credential.applicationDefault();
    } catch (e) {
      console.warn('Failed to load application default credentials, proceeding without credentials (may fail if used)');
    }
  }

  return admin.initializeApp(config);
}

export const adminAuth = () => getAdminApp().auth();
export const adminDb = () => getAdminApp().firestore();
