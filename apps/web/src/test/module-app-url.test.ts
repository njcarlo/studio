import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  moduleAppUrl,
  c2sPublicUrl,
  studioAppUrl,
  getTenantConfig,
} from '@studio/core-engine/tenant';

const ENV_KEYS = [
  'NEXT_PUBLIC_ROOT_DOMAIN',
  'NEXT_PUBLIC_MODULE_URL_C2S',
  'NEXT_PUBLIC_C2S_PUBLIC_URL',
  'NEXT_PUBLIC_STUDIO_URL',
  'NEXT_PUBLIC_STUDIO_MODULE',
] as const;

const saved: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  process.env.NEXT_PUBLIC_ROOT_DOMAIN = 'cogdasma.app';
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe('moduleAppUrl ([module].[domain].app)', () => {
  it('builds https://{module}.{rootDomain}', () => {
    expect(moduleAppUrl('c2s')).toBe('https://c2s.cogdasma.app');
    expect(moduleAppUrl('studio')).toBe('https://studio.cogdasma.app');
    expect(moduleAppUrl('inventory')).toBe('https://inventory.cogdasma.app');
  });

  it('honors NEXT_PUBLIC_MODULE_URL_C2S for local overrides', () => {
    process.env.NEXT_PUBLIC_MODULE_URL_C2S = 'http://localhost:9004/';
    expect(c2sPublicUrl()).toBe('http://localhost:9004');
  });

  it('honors legacy NEXT_PUBLIC_C2S_PUBLIC_URL', () => {
    process.env.NEXT_PUBLIC_C2S_PUBLIC_URL = 'https://join.example.org';
    expect(c2sPublicUrl()).toBe('https://join.example.org');
  });

  it('honors NEXT_PUBLIC_STUDIO_URL', () => {
    process.env.NEXT_PUBLIC_STUDIO_URL = 'https://studio--cog-app-studio.asia-southeast1.hosted.app';
    expect(studioAppUrl()).toBe('https://studio--cog-app-studio.asia-southeast1.hosted.app');
  });

  it('reads rootDomain from tenant config', () => {
    expect(getTenantConfig().rootDomain).toBe('cogdasma.app');
  });
});
