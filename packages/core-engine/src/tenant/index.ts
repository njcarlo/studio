export type TenantConfig = {
  id: string;
  brandName: string;
  shortName?: string;
  logoUrl?: string;
  primaryColor?: string;
  featureFlags: Record<string, boolean>;
};

/** Default tenant — Church of God Dasmariñas (single-tenant until Phase 3). */
export const DEFAULT_TENANT: TenantConfig = {
  id: process.env.TENANT_ID || 'cog-dasma',
  brandName: process.env.NEXT_PUBLIC_BRAND_NAME || 'Church of God Dasmariñas',
  shortName: process.env.NEXT_PUBLIC_BRAND_SHORT || 'COG Dasma',
  logoUrl: process.env.NEXT_PUBLIC_BRAND_LOGO_URL || '/cog-logo.png',
  primaryColor: process.env.NEXT_PUBLIC_BRAND_PRIMARY || undefined,
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
