export type FeatureFlag =
  | 'c2s'
  | 'reservations'
  | 'schedule'
  | 'inventory'
  | 'meals'
  | (string & {});

export type TenantConfig = {
  id: string;
  brandName: string;
  shortName?: string;
  logoUrl?: string;
  /** Accent color as CSS color (hex/rgb). Applied as `--brand`. */
  primaryColor?: string;
  /**
   * Apex / root domain for module apps.
   * Module URLs are always `https://{module}.{rootDomain}`
   * e.g. rootDomain `cogdasma.app` → `https://c2s.cogdasma.app`
   */
  rootDomain: string;
  /** Staff Studio hostname module slug (default `studio`). */
  studioModule: string;
  featureFlags: Record<FeatureFlag, boolean>;
};

/** Known product module slugs that get their own `https://{slug}.{rootDomain}` app. */
export type ModuleSlug = 'studio' | 'c2s' | 'inventory' | (string & {});

/** Default brand accent when `NEXT_PUBLIC_BRAND_PRIMARY` is unset (C2S rose). */
export const DEFAULT_BRAND_COLOR = '#f43f5e';

function envFlag(name: string, defaultValue = true): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return defaultValue;
  return !['0', 'false', 'off', 'no'].includes(raw.trim().toLowerCase());
}

/** Default tenant — Church of God Dasmariñas (single-tenant until full multi-tenancy). */
export const DEFAULT_TENANT: TenantConfig = {
  id: process.env.TENANT_ID || 'cog-dasma',
  brandName: process.env.NEXT_PUBLIC_BRAND_NAME || 'Church of God Dasmariñas',
  shortName: process.env.NEXT_PUBLIC_BRAND_SHORT || 'COG Dasma',
  logoUrl: process.env.NEXT_PUBLIC_BRAND_LOGO_URL || '/cog-logo.png',
  primaryColor: process.env.NEXT_PUBLIC_BRAND_PRIMARY || DEFAULT_BRAND_COLOR,
  rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'cogdasma.app',
  studioModule: process.env.NEXT_PUBLIC_STUDIO_MODULE || 'studio',
  featureFlags: {
    c2s: envFlag('NEXT_PUBLIC_FEATURE_C2S', true),
    reservations: envFlag('NEXT_PUBLIC_FEATURE_RESERVATIONS', true),
    schedule: envFlag('NEXT_PUBLIC_FEATURE_SCHEDULE', true),
    inventory: envFlag('NEXT_PUBLIC_FEATURE_INVENTORY', true),
    meals: envFlag('NEXT_PUBLIC_FEATURE_MEALS', true),
  },
};

export function getTenantConfig(): TenantConfig {
  return DEFAULT_TENANT;
}

/** Short label for chrome (sidebar, login, metadata). */
export function tenantDisplayName(tenant: TenantConfig = getTenantConfig()): string {
  return tenant.shortName || tenant.brandName;
}

/** 1–2 letter monogram from shortName / brandName (e.g. "COG Dasma" → "CD"). */
export function tenantInitials(tenant: TenantConfig = getTenantConfig()): string {
  const name = (tenant.shortName || tenant.brandName).trim();
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || 'OR';
}

/** Safe filename prefix from shortName / id (e.g. "COG Dasma" → "COG_Dasma"). */
export function tenantFileSlug(tenant: TenantConfig = getTenantConfig()): string {
  const base = tenant.shortName || tenant.id || 'org';
  return base.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '') || 'org';
}

/** True when the tenant has enabled `flag` (missing key → false). */
export function isFeatureEnabled(
  flag: FeatureFlag,
  tenant: TenantConfig = getTenantConfig(),
): boolean {
  return tenant.featureFlags[flag] === true;
}

/** Inline style for `<body>` / shell roots — sets `--brand` for Tailwind `brand` color. */
export function tenantBrandStyle(
  tenant: TenantConfig = getTenantConfig(),
): Record<string, string> {
  const color = tenant.primaryColor || DEFAULT_BRAND_COLOR;
  return { '--brand': color };
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