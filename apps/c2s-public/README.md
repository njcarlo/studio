# C2S Public — Group Finder

Standalone Next.js app for the anonymous Connect2Souls Group Finder.

- Port: **9004** (`npm run dev:c2s-public`)
- Domain logic: `@studio/c2s`
- Platform: `@studio/core-engine` (public actions + `getTenantConfig` branding)
- UI: `@studio/ui`

## Env

Same Postgres as Studio:

```bash
DATABASE_URL=...
DIRECT_URL=...
# optional white-label
NEXT_PUBLIC_BRAND_NAME="Church of God Dasmariñas"
NEXT_PUBLIC_BRAND_LOGO_URL=/cog-logo.png
TENANT_ID=cog-dasma
```

## Deploy

Create a second Firebase App Hosting backend pointing at this app (or run behind
your reverse proxy). Studio can redirect `/public/c2s-join` when
`NEXT_PUBLIC_C2S_PUBLIC_URL` is set.
