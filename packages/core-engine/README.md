# @studio/core-engine

Shared platform primitives for Studio apps (Firebase + Prisma stack).

## Current

| Export | Purpose |
|---|---|
| `ok` / `err` / `toErrorMessage` | Server action response envelope |
| `configureAuthUserGetter` / `resolveCallerCtx` | Injectable auth → Worker RBAC |
| `withPermission` / `withPublicAction` | Privileged / public action wrappers |
| `EmailService` | Resend email helper |
| `createWorkflow` / `decide` / … | Generic multi-stage approval engine |
| `getTenantConfig` / `tenantDisplayName` / `isFeatureEnabled` | White-label tenant + module flags |
| `tenantInitials` / `tenantFileSlug` | Monogram + CSV/download filename prefix |
| `tenantBrandStyle` / `DEFAULT_BRAND_COLOR` | Sets CSS `--brand` for Tailwind `brand` |
| `moduleAppUrl(module)` | `https://{module}.{rootDomain}` → `[module].[domain].app` |
| `c2sPublicUrl()` / `studioAppUrl()` | Shortcuts for `c2s` / `studio` |

## Env (branding + flags)

```bash
TENANT_ID=cog-dasma
NEXT_PUBLIC_BRAND_NAME="Church of God Dasmariñas"
NEXT_PUBLIC_BRAND_SHORT="COG Dasma"
NEXT_PUBLIC_BRAND_LOGO_URL=/cog-logo.png
NEXT_PUBLIC_BRAND_PRIMARY=#f43f5e
NEXT_PUBLIC_ROOT_DOMAIN=cogdasma.app

# Module visibility (default true). Set false/0/off to hide from Studio nav.
NEXT_PUBLIC_FEATURE_C2S=true
NEXT_PUBLIC_FEATURE_RESERVATIONS=true
NEXT_PUBLIC_FEATURE_SCHEDULE=true
NEXT_PUBLIC_FEATURE_INVENTORY=true
NEXT_PUBLIC_FEATURE_MEALS=true
```

**URL scheme:** `NEXT_PUBLIC_ROOT_DOMAIN` defaults to `cogdasma.app`. Override a module with `NEXT_PUBLIC_MODULE_URL_<MODULE>`.

Client components must import from `@studio/core-engine/tenant` (not the package root — that pulls server-only deps).

See `docs/CORE_ENGINE_C2S_PLAN.md`.
