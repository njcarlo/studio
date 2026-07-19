# Hosting & domains

## Current setup: one hosting, one domain

**Decision:** run Studio + public C2S on a **single** Firebase App Hosting backend.

| What | URL |
|---|---|
| Studio (staff) | https://studio--cog-app-studio.asia-southeast1.hosted.app |
| Public C2S Group Finder | https://studio--cog-app-studio.asia-southeast1.hosted.app/public/c2s-join |

Same deploy (`apphosting.yaml` at repo root), same Postgres secrets, same Firebase project (`cog-app-studio`).

Production sets:

- `NEXT_PUBLIC_C2S_EMBEDDED=true` — render the finder inside Studio (no redirect)
- `NEXT_PUBLIC_MODULE_URL_C2S=…/public/c2s-join` — links resolve on this host
- `NEXT_PUBLIC_STUDIO_URL=https://studio--cog-app-studio.asia-southeast1.hosted.app`

`apps/c2s-public` remains in the monorepo for **local** standalone work (`npm run dev:c2s-public` on `:9004`) and a possible future split. It is **not** required for production while embedded mode is on.

## Local overrides

```bash
# Default: use Studio embed (or open Studio /public/c2s-join)

# Optional: run standalone c2s-public locally
NEXT_PUBLIC_MODULE_URL_C2S=http://localhost:9004
NEXT_PUBLIC_C2S_EMBEDDED=false
```

## Future (optional): branded / split hosts

**Status: deferred.** Only if you later want separate hosts:

| Host | App | Notes |
|---|---|---|
| `studio.cogdasma.app` | `apps/web` | Custom domain on current backend |
| `c2s.cogdasma.app` | `apps/c2s-public` | Needs its own App Hosting backend first |

Helpers still support `https://[module].[domain].app` via `NEXT_PUBLIC_ROOT_DOMAIN` and `@studio/core-engine/tenant` (`moduleAppUrl`, `c2sPublicUrl`, `studioAppUrl`). Do not attach DNS until product asks for it.

## Inventory

Inventory is a **Studio module** (`apps/web` → `/inventory`), not a separate host.
