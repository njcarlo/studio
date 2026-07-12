# @studio/core-engine

Shared platform primitives for Studio apps (Firebase + Prisma stack).

## Slice A (current)

| Export | Purpose |
|---|---|
| `ok` / `err` / `toErrorMessage` | Server action response envelope |
| `EmailService` | Resend email helper |
| `createWorkflow` / `decide` / … | Generic multi-stage approval engine |
| `getTenantConfig` / `DEFAULT_TENANT` | White-label tenant stub |

## Usage

```ts
import { createWorkflow, decide, getTenantConfig } from '@studio/core-engine';
// Legacy paths still work via re-exports:
import * as ApprovalEngine from '@/services/approval-engine';
```

## Next slices

- Auth gate: move `withPermission` / `resolveCallerCtx` here (injectable `getServerUser`)
- `packages/c2s` domain module + public app

See `docs/CORE_ENGINE_C2S_PLAN.md`.
