# Studio Monorepo

Church operations platform for **Church of God Dasmariñas** (COG App).

## New developers — start here

**[docs/ONBOARDING.md](./docs/ONBOARDING.md)** — local setup, current stack (Firebase + Prisma), and how to pick **one module** and ship a change.

Also useful:

- [AGENTS.md](./AGENTS.md) — environment gotchas and deploy notes
- [docs/architecture.md](./docs/architecture.md) — routes and file map
- [docs/PLATFORM_ARCHITECTURE.md](./docs/PLATFORM_ARCHITECTURE.md) — RBAC, approvals, notifications
- [docs/CUSTOM_DOMAINS.md](./docs/CUSTOM_DOMAINS.md) — `c2s` / `studio` Firebase custom domains

## What’s in this repo

| Path | Description |
|---|---|
| `apps/web` | Flagship Next.js Studio (Firebase App Hosting) |
| `apps/c2s-public` | Public C2S Group Finder (`c2s.[domain].app`) |
| `apps/inventory` | Standalone inventory product (separate module) |
| `packages/*` | Shared UI, Prisma client, core-engine, c2s, types, store |
| `functions/` | Firebase Cloud Functions |
| `prisma/` | Postgres schema (source of truth for `apps/web`) |

> **Sunset:** `apps/tract-tracker` was removed from this monorepo (NTGD Expo app). Do not restore it without a new product decision.

## Quick start

```bash
npm install
npx prisma generate
# configure apps/web/.env.local — see docs/ONBOARDING.md
npm run dev:web
```

## Branching

This repository follows **GitHub Flow**. Work on short-lived feature branches and merge to `main` via Pull Request.

### `main`

* Production-ready branch. Do not commit directly.
* Changes land only through reviewed PRs.

### Feature & fix branches

```bash
git checkout main && git pull
git checkout -b feature/<short-description>
```

| Prefix | Use | Example |
|---|---|---|
| `feature/` / `feat/` | New feature | `feature/c2s-join-filters` |
| `fix/` / `bugfix/` | Bug fix | `fix/workers-search` |
| `docs/` | Documentation | `docs/onboarding` |
| `refactor/` | Restructure without behavior change | `refactor/schedule-service` |

### Commits

Semantic commits: `<type>(optional-scope): <description>`

```
feat(c2s): add barangay filter defaults
fix(workers): fall back when SQL search fn missing
docs: add developer onboarding guide
```

### PR workflow

1. Push your branch
2. Open a PR against `main`
3. Request review, address feedback, merge
4. Delete the branch after merge
