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

---

## Owner steps (Firebase console) — when you un-defer

These cannot be done from the repo alone — they need DNS + Firebase project access
(`cog-app-studio`).

### 1. Create / confirm App Hosting backends

1. Firebase console → **App Hosting** → project `cog-app-studio`
2. Backend for Studio: linked to this GitHub repo, root `/`, uses root `apphosting.yaml`
3. Backend for C2S public: separate backend with root `apps/c2s-public`

### 2. Attach custom domains

For each backend:

1. App Hosting → backend → **Custom domains** → **Add**
2. Enter `c2s.cogdasma.app` (C2S) or `studio.cogdasma.app` (Studio)
3. Firebase shows DNS records (usually a CNAME or A/AAAA + TXT for verification)

### 3. DNS at your domain registrar

On the zone for **`cogdasma.app`**, add the records Firebase shows, for example:

```text
c2s.cogdasma.app      CNAME   <firebase-provided-target>
studio.cogdasma.app   CNAME   <firebase-provided-target>
```

Wait for TLS provisioning (Firebase marks the domain **Connected**).

### 4. Env

Both App Hosting configs set `NEXT_PUBLIC_ROOT_DOMAIN: cogdasma.app`.

Overrides if needed:

- `NEXT_PUBLIC_MODULE_URL_C2S=https://c2s.cogdasma.app`
- `NEXT_PUBLIC_STUDIO_URL=https://studio.cogdasma.app`
- Local: `NEXT_PUBLIC_MODULE_URL_C2S=http://localhost:9004`

Studio `/public/c2s-join` redirects to `c2sPublicUrl()` unless
`NEXT_PUBLIC_C2S_EMBEDDED=true`.

### 5. Smoke test

1. `https://c2s.cogdasma.app` → Group Finder
2. From Studio, open `/public/c2s-join` → redirects to `c2s.cogdasma.app`
3. Optional: `https://studio.cogdasma.app` → Studio login (inventory at `/inventory`)

---

## Inventory

Inventory is a **Studio module** (`apps/web` → `/inventory`, domain in
`@studio/inventory`). The standalone `apps/inventory` app was sunset and removed.
