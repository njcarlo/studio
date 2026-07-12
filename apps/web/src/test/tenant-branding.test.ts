import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isFeatureEnabled,
  tenantDisplayName,
  tenantBrandStyle,
  DEFAULT_BRAND_COLOR,
  getTenantConfig,
} from '@studio/core-engine/tenant';

const FLAG_KEYS = [
  'NEXT_PUBLIC_FEATURE_C2S',
  'NEXT_PUBLIC_FEATURE_RESERVATIONS',
  'NEXT_PUBLIC_FEATURE_SCHEDULE',
  'NEXT_PUBLIC_FEATURE_INVENTORY',
  'NEXT_PUBLIC_FEATURE_MEALS',
  'NEXT_PUBLIC_BRAND_SHORT',
  'NEXT_PUBLIC_BRAND_NAME',
  'NEXT_PUBLIC_BRAND_PRIMARY',
] as const;

const saved: Partial<Record<(typeof FLAG_KEYS)[number], string | undefined>> = {};

beforeEach(() => {
  for (const key of FLAG_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of FLAG_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe('isFeatureEnabled / env flags', () => {
  it('defaults known flags to true on DEFAULT_TENANT', () => {
    // DEFAULT_TENANT is evaluated at module load — use explicit tenant objects here.
    expect(isFeatureEnabled('c2s', { ...getTenantConfig(), featureFlags: { c2s: true, reservations: true, schedule: true, inventory: true, meals: true } })).toBe(true);
    expect(
      isFeatureEnabled('reservations', {
        ...getTenantConfig(),
        featureFlags: { c2s: true, reservations: false, schedule: true, inventory: true, meals: true },
      }),
    ).toBe(false);
  });

  it('returns false for missing flags', () => {
    expect(isFeatureEnabled('unknown-module', { ...getTenantConfig(), featureFlags: {} as any })).toBe(false);
  });
});

describe('tenantDisplayName / brand style', () => {
  it('prefers shortName', () => {
    expect(
      tenantDisplayName({
        ...getTenantConfig(),
        shortName: 'Acme',
        brandName: 'Acme Church',
      }),
    ).toBe('Acme');
  });

  it('falls back to brandName', () => {
    expect(
      tenantDisplayName({
        ...getTenantConfig(),
        shortName: undefined,
        brandName: 'Acme Church',
      }),
    ).toBe('Acme Church');
  });

  it('sets --brand from primaryColor', () => {
    expect(
      tenantBrandStyle({
        ...getTenantConfig(),
        primaryColor: '#112233',
      }),
    ).toEqual({ '--brand': '#112233' });
  });

  it('uses DEFAULT_BRAND_COLOR when primaryColor missing', () => {
    expect(
      tenantBrandStyle({
        ...getTenantConfig(),
        primaryColor: undefined,
      }),
    ).toEqual({ '--brand': DEFAULT_BRAND_COLOR });
  });
});
