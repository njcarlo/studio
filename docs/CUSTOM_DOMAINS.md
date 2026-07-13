# Custom domains — `[module].[domain].app`

**Status: deferred.** Keep using Firebase App Hosting default URLs for now
(e.g. `https://studio--cog-app-studio.asia-southeast1.hosted.app`). Revisit when
you want branded hosts.

Studio and module apps still resolve URLs via `NEXT_PUBLIC_ROOT_DOMAIN`
(default **`cogdasma.app`**). Helpers live in `@studio/core-engine/tenant`
(`moduleAppUrl`, `c2sPublicUrl`, `studioAppUrl`). Until DNS is attached, set
overrides:

```bash
# Local / staging without custom DNS
NEXT_PUBLIC_MODULE_URL_C2S=http://localhost:9004
# or the App Hosting URL for c2s-public once deployed
# NEXT_PUBLIC_C2S_PUBLIC_URL=https://<c2s-public-backend>.hosted.app
NEXT_PUBLIC_STUDIO_URL=https://studio--cog-app-studio.asia-southeast1.hosted.app
```

| Host (when ready) | App | App Hosting backend |
|---|---|---|
| `studio.cogdasma.app` (optional) | `apps/web` (includes `/inventory`) | Root `apphosting.yaml` |
| `c2s.cogdasma.app` | `apps/c2s-public` | `apps/c2s-public/apphosting.yaml` |

Full attach steps (Firebase console + DNS) are optional until this is un-deferred.
See git history or ask the team before changing production DNS.

## Inventory

Inventory is a **Studio module** (`apps/web` → `/inventory`, domain in
`@studio/inventory`). The standalone `apps/inventory` app was sunset and removed.
