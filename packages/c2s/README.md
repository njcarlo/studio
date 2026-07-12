# @studio/c2s

Connect2Souls domain package — groups, mentees, sessions, public join requests,
admin CRUD, and approvals Kanban mapping.

Depends on `@studio/core-engine` (approvals + `CallerCtx`) and `@studio/database`.

## Usage

```ts
import * as C2S from '@studio/c2s';

await C2S.listPublicC2SGroups();
await C2S.createAdminC2SGroup({ name: 'YA', mentorId: '…' });
await C2S.listC2SJoinRequestKanbanRows(workerId);
```

## Deploy surfaces

| Surface | App | Notes |
|---|---|---|
| Public Group Finder | `apps/c2s-public` | `https://c2s.{rootDomain}` |
| Mentor My Group + admin | `apps/web` `/c2s/**` | **M1** — UI in Studio; logic here |
| Optional mentor app | `apps/c2s` | M2 only if product wants a separate mentor host |

ORS import stays in Studio (`services/ors-sync.ts`).
