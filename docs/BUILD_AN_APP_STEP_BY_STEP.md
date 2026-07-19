# Build something in this monorepo — step by step (for beginners)

This guide assumes you have **never worked in this repo before**.  
Follow the steps in order. Do not skip Step 0–3 the first time.

> **Related:** [`ONBOARDING.md`](./ONBOARDING.md) (deeper reference) · [`SYSTEM_ARCHITECTURE.md`](./SYSTEM_ARCHITECTURE.md) (big picture)

---

## What “an app” means here

This is a **monorepo**. Almost everything staff use lives in **one** Next.js app:

| Thing | Path | When you use it |
|---|---|---|
| **Studio** (main product) | `apps/web` | Default. Add pages, features, modules here. **One production host** — public C2S is `/public/c2s-join` on the same domain. |
| **Public mini-app** | `apps/c2s-public` | Optional local/future split. Production uses Studio embed. |
| **Shared logic** | `packages/*` | Code reused by Studio and/or public apps. |

**Rule of thumb**

1. Need a new screen for staff who already log in? → Add a **module inside Studio** (`apps/web`).  
2. Need a public site with its own URL/deploy? → Add a **new app** under `apps/` (copy `c2s-public`).  
3. Need shared business rules with no UI? → Add a **package** under `packages/`.

Do **not** create a new `apps/*` project for every feature. Inventory, schedule, C2S mentor UI, etc. all live inside Studio.

---

## Step 0 — What you need installed

Install these on your machine before cloning:

| Tool | Why | How to check |
|---|---|---|
| **Git** | Clone / branch / PR | `git --version` |
| **Node.js 20+** | Runs Next.js and scripts | `node -v` (should be v20+) |
| **npm 11** | Package manager (see root `packageManager`) | `npm -v` |
| **Docker** (recommended) | Local Postgres in one command | `docker --version` |
| **Java** (optional) | Only if you run Firebase emulators | `java -version` |
| **firebase-tools** (optional) | Emulators / Functions | `npx firebase --version` |

You also need:

- Access to this GitHub repo  
- Either a teammate’s **`.env.local` template**, or Firebase web config from the console (project `cog-app-studio`)

---

## Step 1 — Clone the repo

```bash
git clone <repo-url>
cd studio
git checkout main
git pull
```

You should see folders like `apps/`, `packages/`, `prisma/`, `docs/`.

---

## Step 2 — Install dependencies

Always run these from the **repo root** (`studio/`), not from inside `apps/web`:

```bash
npm install
npx prisma generate
```

What this does:

- `npm install` — installs all workspace apps and packages  
- `npx prisma generate` — builds the Prisma client used to talk to Postgres  

If install fails, fix Node/npm versions first (Step 0).

---

## Step 3 — Start a local database

Studio needs **Postgres**. Easiest path: Docker.

```bash
docker run -d --name cog-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=postgres \
  -p 54322:5432 \
  postgres:15
```

Then push the schema (use **`db push`**, not `migrate deploy` — migration history is incomplete):

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
export DIRECT_URL="postgresql://postgres:postgres@localhost:54322/postgres"
npx prisma db push
```

Later these same URLs go into `apps/web/.env.local`.

---

## Step 4 — Create your env file

Create:

```text
apps/web/.env.local
```

Minimum contents:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
DIRECT_URL=postgresql://postgres:postgres@localhost:54322/postgres

# From Firebase console → Project settings → Your apps
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cog-app-studio
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Local emulators (optional but recommended)
NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199
GCLOUD_PROJECT=cog-app-studio
```

Ask a teammate for a working template if you should not invent secrets.

---

## Step 5 — (Optional) Start Firebase emulators

In a **second terminal**, from the repo root:

```bash
npx firebase emulators:start --only auth,firestore,storage,functions --project cog-app-studio
```

Useful ports:

| Service | Port |
|---|---|
| Emulator UI | 4000 |
| Auth | 9099 |
| Firestore | 8080 |
| Storage | 9199 |
| Functions | 5001 |

Create a user in the Auth emulator. You also need a matching `Worker` row in Postgres (ask a teammate how your team seeds admins, or see `scripts/seed-admin-worker.ts` / `prisma/seed.ts`).

---

## Step 6 — Run Studio locally

From the repo root:

```bash
npm run dev:web
```

Open: **http://localhost:9002**

You should see the login page. If the page loads, your monorepo setup works.

### Common gotchas

| Problem | Fix |
|---|---|
| Port in use | Stop the other process, or change the port in `apps/web/package.json` |
| Blank / 500 after a build | `rm -rf apps/web/.next` then restart `npm run dev:web` |
| Never run `next build` while `dev:web` is running | They share `.next` and break each other |
| Prisma client missing | Re-run `npx prisma generate` from root |

---

## Step 7 — Decide what you are building

Answer these questions:

### A) “I want a new feature inside Studio for logged-in staff”

→ Go to **Path A** below.  
Examples: inventory tweak, new settings page, schedule UI, C2S mentor screen.

### B) “I want a public website (no Studio sidebar), own port / deploy”

→ Go to **Path B** below.  
Example: `apps/c2s-public` (Group Finder).

### C) “I want reusable business logic shared by apps”

→ Go to **Path C** below.  
Examples: `@studio/c2s`, `@studio/inventory`, `@studio/core-engine`.

---

# Path A — Add a feature / module inside Studio (most common)

This is what almost every developer should do first.

## A1. Create a branch

```bash
git checkout main && git pull
git checkout -b feature/<short-name>
```

Example: `feature/events-empty-state`

## A2. Know the folder pattern

Every feature is a **vertical slice**:

```text
Page (UI)
  → optional React Query hook
    → Server Action   (auth + permission)
      → Service / domain package
        → Prisma (Postgres)
```

| Layer | Where it lives |
|---|---|
| Page | `apps/web/src/app/<route>/page.tsx` |
| Components | `apps/web/src/components/...` |
| Hook | `apps/web/src/hooks/use-*.ts` |
| Action | `apps/web/src/actions/<module>.ts` |
| Service | `apps/web/src/services/<module>.ts` **or** `packages/<domain>` |
| Schema | `prisma/schema.prisma` |
| Nav / permissions | `lib/permissions/registry.ts`, `store/user-role-syncer-sql.tsx`, `components/layout/nav.tsx` |

## A3. Copy an existing module

Do **not** invent a new architecture. Pick a similar module and copy its shape:

| If you’re building… | Copy from… |
|---|---|
| Staff CRUD list | Workers or Events |
| Approval-related flow | Reservations / C2S join |
| Public + staff pair | C2S (`@studio/c2s` + Studio pages) |
| Stock / items | Inventory (`@studio/inventory` + `/inventory`) |

## A4. Schema change? (only if you need new tables/fields)

1. Edit `prisma/schema.prisma`  
2. Run locally:

```bash
npx prisma db push
npx prisma generate
```

3. Tell the team before changing production DB.

## A5. Add the server write path

1. Put business logic in a service or domain package.  
2. Expose it from a Server Action.  
3. Wrap privileged actions with `withPermission(...)`.

Example shape (simplified):

```ts
// apps/web/src/actions/my-module.ts
'use server';
import { withPermission } from '@/lib/auth/with-permission';
import { PERMISSIONS } from '@/lib/permissions/registry';
import { doSomething } from '@/services/my-module';

export const doSomethingAction = withPermission(
  PERMISSIONS.myModule.edit,
  async (input) => {
    return doSomething(input);
  },
);
```

**Never** import `@studio/core-engine` (main barrel) from client components. That breaks the Next build. For branding/URLs on the client, use `@studio/core-engine/tenant`.

## A6. Add the UI page

1. Create `apps/web/src/app/my-route/page.tsx`  
2. Call your action / React Query hook  
3. Prefer components from `@studio/ui`  
4. Add a nav link only if the user should see it (permission-gated)

## A7. New permission? Do all four places

1. Add key in `apps/web/src/lib/permissions/registry.ts`  
2. Map a `can*` flag in `user-role-syncer-sql.tsx` (and `@studio/store` if needed)  
3. Gate the nav item in `components/layout/nav.tsx`  
4. Wrap the Server Action with `withPermission(...)`

## A8. Run and verify

```bash
npm run dev:web
```

Manual checks:

- Happy path works while logged in  
- User **without** permission is blocked  
- No console / server errors  

Then:

```bash
npm run typecheck
```

## A9. Commit and open a PR

```bash
git add -A
git commit -m "feat(my-module): short description"
git push -u origin HEAD
```

Open a PR into `main`. Merging usually deploys Studio via Firebase App Hosting.

---

# Path B — Add a brand-new app under `apps/`

Only do this if you need a **separate deployable site** (different audience or URL), like the public C2S finder.

Golden template: **`apps/c2s-public`**.

## B1. Pick a name and port

Examples:

| App folder | Package name | Dev port |
|---|---|---|
| `apps/c2s-public` | `c2s-public` | 9004 |
| `apps/my-public` | `my-public` | 9005 (choose unused) |

Studio already uses **9002**. Don’t reuse it.

## B2. Copy the public app skeleton

```bash
cp -R apps/c2s-public apps/my-public
```

Then edit:

1. `apps/my-public/package.json`  
   - `"name": "my-public"`  
   - `"dev": "next dev --turbopack -p 9005"`  
   - Dependencies: keep `@studio/database`, `@studio/ui`, `@studio/core-engine` as needed; swap domain packages  
2. `apps/my-public/next.config.ts`  
   - Update `transpilePackages` to the packages you actually import  
3. Replace `src/app/*` pages/components with your UI  
4. Keep `output: 'standalone'` and `outputFileTracingRoot` pointing at the monorepo root  

## B3. Wire root scripts

In the **root** `package.json`, add:

```json
"dev:my-public": "turbo run dev --filter=my-public",
"build:my-public": "turbo run build --filter=my-public"
```

`workspaces` already includes `apps/*`, so npm will pick up the new folder after:

```bash
npm install
```

## B4. Env for the new app

Create `apps/my-public/.env.local` as needed (at least `DATABASE_URL` / `DIRECT_URL` if you use Prisma).

If Studio must link to this app:

```bash
# in apps/web/.env.local
NEXT_PUBLIC_MODULE_URL_MYTHING=http://localhost:9005
```

(URL helpers live in `@studio/core-engine/tenant` — extend them the same way as C2S if this becomes a real module host.)

## B5. Run it

```bash
npm run dev:my-public
# → http://localhost:9005
```

## B6. Deploy later (Firebase App Hosting)

1. Keep / adapt `apps/my-public/apphosting.yaml`  
2. Create a **separate** App Hosting backend in Firebase console pointing at this app’s config  
3. **Do not** put `buildCommand` in `apphosting.yaml` (breaks npm workspaces)  
4. Custom DNS (`mything.cogdasma.app`) is **deferred** — use the default `*.hosted.app` URL for now  

See [`CUSTOM_DOMAINS.md`](./CUSTOM_DOMAINS.md) and [`DEPLOYMENT.md`](./DEPLOYMENT.md) when you get there.

---

# Path C — Add a shared package under `packages/`

Use this when **two apps** (or Studio + public) share the same business rules.

Golden templates: `packages/c2s`, `packages/inventory`.

## C1. Create the package

```bash
mkdir -p packages/my-domain/src
```

Minimal `packages/my-domain/package.json`:

```json
{
  "name": "@studio/my-domain",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "dependencies": {
    "@studio/database": "file:../database",
    "@studio/core-engine": "file:../core-engine"
  }
}
```

Export functions from `src/index.ts` (list/create/update helpers, no React).

## C2. Depend on it from an app

In `apps/web/package.json` (and/or your public app):

```json
"@studio/my-domain": "file:../../packages/my-domain"
```

Add `@studio/my-domain` to that app’s `next.config.ts` → `transpilePackages`.

Then:

```bash
npm install
```

## C3. Call it from a Server Action

Studio actions stay thin: permission check → call package function → return `ok` / `err`.

---

## Checklist before you say “done”

- [ ] Ran from **repo root**: `npm install`, `npx prisma generate`  
- [ ] Local Studio opens at http://localhost:9002  
- [ ] Chose Path A, B, or C on purpose (not by accident)  
- [ ] Privileged writes use `withPermission`  
- [ ] No client import of `@studio/core-engine` barrel  
- [ ] `npm run typecheck` passes  
- [ ] You did **not** restore sunset apps (`tract-tracker`, standalone `inventory`)  
- [ ] PR describes what you changed and how you tested it  

---

## Quick command cheat sheet

```bash
# one-time / whenever deps change
npm install
npx prisma generate

# local DB schema
npx prisma db push

# run Studio
npm run dev:web                 # :9002

# run public C2S app
npm run dev:c2s-public          # :9004

# quality gate before push
npm run typecheck

# if Next got confused
rm -rf apps/web/.next
```

---

## Still stuck?

1. Read [`ONBOARDING.md`](./ONBOARDING.md) §3–6 for env and module tables.  
2. Read [`SYSTEM_ARCHITECTURE.md`](./SYSTEM_ARCHITECTURE.md) for package boundaries and open tasks.  
3. Ask a teammate for a working `apps/web/.env.local` and a test login.  
4. Trace one real module end-to-end (recommended: C2S or Inventory) before inventing a new one.

---

*This is the beginner path. Prefer adding features to `apps/web` unless you clearly need a separate public/deployable app.*
