export type TenantConfig = {
  id: string;
  brandName: string;
  shortName?: string;
  logoUrl?: string;
  primaryColor?: string;
  /**
   * Apex / root domain for module apps.
   * Module URLs are always `https://{module}.{rootDomain}`
   * e.g. rootDomain `cogdasma.app` → `https://c2s.cogdasma.app`
   */
  rootDomain: string;
  /** Staff Studio hostname module slug (default `studio`). */
  studioModule: string;
  featureFlags: Record<string, boolean>;
};

/** Known product module slugs that get their own `https://{slug}.{rootDomain}` app. */
export type ModuleSlug = 'studio' | 'c2s' | 'inventory' | (string & {});

/** Default tenant — Church of God Dasmariñas (single-tenant until Phase 3). */
export const DEFAULT_TENANT: TenantConfig = {
  id: process.env.TENANT_ID || 'cog-dasma',
  brandName: process.env.NEXT_PUBLIC_BRAND_NAME || 'Church of God Dasmariñas',
  shortName: process.env.NEXT_PUBLIC_BRAND_SHORT || 'COG Dasma',
  logoUrl: process.env.NEXT_PUBLIC_BRAND_LOGO_URL || '/cog-logo.png',
  primaryColor: process.env.NEXT_PUBLIC_BRAND_PRIMARY || undefined,
  rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'cogdasma.app',
  studioModule: process.env.NEXT_PUBLIC_STUDIO_MODULE || 'studio',
  featureFlags: {
    c2s: true,
    reservations: true,
    schedule: true,
    inventory: true,
  },
};

export function getTenantConfig(): TenantConfig {
  return DEFAULT_TENANT;
}

/**
 * Canonical public URL for a module app: `https://{module}.{rootDomain}`
 *
 * Examples (rootDomain = cogdasma.app):
 * - moduleAppUrl('c2s')     → https://c2s.cogdasma.app
 * - moduleAppUrl('studio')  → https://studio.cogdasma.app
 * - moduleAppUrl('inventory') → https://inventory.cogdasma.app
 *
 * Overrides (local / staging):
 * - NEXT_PUBLIC_MODULE_URL_C2S=http://localhost:9004
 * - NEXT_PUBLIC_C2S_PUBLIC_URL=... (legacy alias for c2s)
 */
export function moduleAppUrl(module: ModuleSlug, tenant: TenantConfig = getTenantConfig()): string {
  const envKey = `NEXT_PUBLIC_MODULE_URL_${String(module).toUpperCase().replace(/-/g, '_')}`;
  const fromEnv = process.env[envKey];
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (module === 'c2s' && process.env.NEXT_PUBLIC_C2S_PUBLIC_URL) {
    return process.env.NEXT_PUBLIC_C2S_PUBLIC_URL.replace(/\/$/, '');
  }

  if (module === 'studio' && process.env.NEXT_PUBLIC_STUDIO_URL) {
    return process.env.NEXT_PUBLIC_STUDIO_URL.replace(/\/$/, '');
  }

  const slug = module === 'studio' ? tenant.studioModule : module;
  return `https://${slug}.${tenant.rootDomain}`;
}

/** Convenience: C2S public Group Finder URL. */
export function c2sPublicUrl(tenant: TenantConfig = getTenantConfig()): string {
  return moduleAppUrl('c2s', tenant);
}

/** Convenience: staff Studio URL. */
export function studioAppUrl(tenant: TenantConfig = getTenantConfig()): string {
  return moduleAppUrl('studio', tenant);
}
