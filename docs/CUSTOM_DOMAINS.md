# Custom domains — `[module].[domain].app`

Studio and module apps resolve URLs via `NEXT_PUBLIC_ROOT_DOMAIN`
(default **`cogdasma.app`**). Helpers live in `@studio/core-engine/tenant`
(`moduleAppUrl`, `c2sPublicUrl`, `studioAppUrl`).

| Host | App | App Hosting backend |
|---|---|---|
| `studio.cogdasma.app` (optional) | `apps/web` | Root `apphosting.yaml` |
| `c2s.cogdasma.app` | `apps/c2s-public` | `apps/c2s-public/apphosting.yaml` |
| `inventory.cogdasma.app` (later) | `apps/inventory` | Add when inventory gets App Hosting |

Current default Studio URL until DNS is attached:  
`https://studio--cog-app-studio.asia-southeast1.hosted.app`

---

## Owner steps (Firebase console)

These cannot be done from the repo alone — they need DNS + Firebase project access
(`cog-app-studio`).

### 1. Create / confirm App Hosting backends

1. Firebase console → **App Hosting** → project `cog-app-studio`
2. Backend for Studio: linked to this GitHub repo, root `/`, uses root `apphosting.yaml`
3. Backend for C2S public: separate backend with root `apps/c2s-public` (or monorepo
   build that targets that package — match how you created it)

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

### 4. Env already in repo

Both App Hosting configs set:

```yaml
NEXT_PUBLIC_ROOT_DOMAIN: cogdasma.app
```

Overrides if needed:

- `NEXT_PUBLIC_MODULE_URL_C2S=https://c2s.cogdasma.app`
- `NEXT_PUBLIC_STUDIO_URL=https://studio.cogdasma.app`
- Local: `NEXT_PUBLIC_MODULE_URL_C2S=http://localhost:9004`

Studio `/public/c2s-join` redirects to `c2sPublicUrl()` unless
`NEXT_PUBLIC_C2S_EMBEDDED=true`.

### 5. Smoke test

1. `https://c2s.cogdasma.app` → Group Finder
2. From Studio, open `/public/c2s-join` → redirects to `c2s.cogdasma.app`
3. Optional: `https://studio.cogdasma.app` → Studio login

---

## Inventory as a separate module?

**Yes — keep `apps/inventory` separate.** It already is a distinct app with its
own port/deploy story. That matches the platform rule: split when audience or
deploy cadence differs.

Recommended path:

1. Keep Studio `/inventory` (Prisma) for staff who live in Studio, **or** deep-link
   to the inventory app once branded.
2. Evolve `apps/inventory` onto Prisma + `@studio/core-engine` (authz/tenant).
3. When ready, host it at `inventory.cogdasma.app` via `moduleAppUrl('inventory')`.
4. Do **not** merge inventory back into the Studio monolith.
