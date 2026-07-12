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

## Web wiring

`apps/web/src/lib/auth/with-permission.ts` calls `configureAuthUserGetter(getServerUser)` then re-exports core-engine. Import auth helpers from `@/lib/auth/with-permission` in the web app.

## Next

- `packages/c2s` domain module + public app

See `docs/CORE_ENGINE_C2S_PLAN.md`.
