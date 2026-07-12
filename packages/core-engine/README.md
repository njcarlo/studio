# @studio/core-engine

Shared platform primitives for Studio apps (Firebase + Prisma stack).

## Current (Slice A + B)

| Export | Purpose |
|---|---|
| `ok` / `err` / `toErrorMessage` | Server action response envelope |
| `configureAuthUserGetter` / `resolveCallerCtx` | Injectable auth → Worker RBAC |
| `withPermission` / `withPublicAction` | Privileged / public action wrappers |
| `EmailService` | Resend email helper |
| `createWorkflow` / `decide` / … | Generic multi-stage approval engine |
| `getTenantConfig` / `DEFAULT_TENANT` | White-label tenant stub |
| `moduleAppUrl(module)` | `https://{module}.{rootDomain}` → `[module].[domain].app` |
| `c2sPublicUrl()` / `studioAppUrl()` | Shortcuts for `c2s` / `studio` |

**URL scheme:** `NEXT_PUBLIC_ROOT_DOMAIN` defaults to `cogdasma.app`, so modules resolve to e.g. `https://c2s.cogdasma.app`, `https://studio.cogdasma.app`. Override a single module with `NEXT_PUBLIC_MODULE_URL_<MODULE>` (e.g. local `NEXT_PUBLIC_MODULE_URL_C2S=http://localhost:9004`).

Client components must import from `@studio/core-engine/tenant` (not the package root — that pulls server-only deps).

## Web wiring

`apps/web/src/lib/auth/with-permission.ts` calls `configureAuthUserGetter(getServerUser)` then re-exports core-engine. Import auth helpers from `@/lib/auth/with-permission` in the web app.

See `docs/CORE_ENGINE_C2S_PLAN.md`.
