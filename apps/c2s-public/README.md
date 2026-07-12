# C2S Public — Group Finder

Standalone Next.js app for the anonymous Connect2Souls Group Finder.

**Canonical URL:** `https://c2s.{NEXT_PUBLIC_ROOT_DOMAIN}`  
Default: **`https://c2s.cogdasma.app`**

- Local: `npm run dev:c2s-public` → http://localhost:9004  
  (`NEXT_PUBLIC_MODULE_URL_C2S=http://localhost:9004`)
- Domain logic: `@studio/c2s`
- Platform: `@studio/core-engine` (`moduleAppUrl('c2s')`, tenant branding)
- UI: `@studio/ui`

## Env

```bash
DATABASE_URL=...
DIRECT_URL=...

# White-label / module hosts  →  https://[module].[domain].app
NEXT_PUBLIC_ROOT_DOMAIN=cogdasma.app
NEXT_PUBLIC_BRAND_NAME="Church of God Dasmariñas"
NEXT_PUBLIC_BRAND_SHORT="COG Dasma"
NEXT_PUBLIC_BRAND_LOGO_URL=/cog-logo.png
NEXT_PUBLIC_BRAND_PRIMARY=#f43f5e
TENANT_ID=cog-dasma

# Local only
# NEXT_PUBLIC_MODULE_URL_C2S=http://localhost:9004
```

Accent color is applied as CSS `--brand` (Tailwind `bg-brand` / `text-brand`).

## DNS / App Hosting

Point **`c2s.cogdasma.app`** (or your root domain) at the Firebase App Hosting
backend for this app (`apphosting.yaml` in this folder). Studio redirects
`/public/c2s-join` → `https://c2s.{rootDomain}` unless
`NEXT_PUBLIC_C2S_EMBEDDED=true`.
