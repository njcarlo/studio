# End-to-end tests

Playwright specs for the happy paths in the manual QA plan. Two projects, split
by what they need to run.

| Project  | Covers | Needs | CI |
| -------- | ------ | ----- | -- |
| `public` | `/public/*` pages (no login) | app + `DATABASE_URL` | yes |
| `authed` | staff modules (reservations, workers, venue assistance, approvals) | app + DB + **Firebase Auth emulator** | not yet wired |

Chromium ships in the container image. **Never run `playwright install` here** —
if the image's browser build differs from the one `@playwright/test` expects,
point `E2E_CHROMIUM_PATH` at the binary instead:

```bash
export E2E_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
```

## Public suite

```bash
npm run e2e --workspace=web
```

## Authed suite

`authed` only runs when `E2E_AUTH=true`, so a missing emulator can never turn a
pipeline red. Auth is Firebase Auth, so it needs the emulator plus the QA
accounts seeded into both the emulator and Postgres.

```bash
# 1. Postgres with the schema applied
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/studiotest
export DIRECT_URL=$DATABASE_URL
npx prisma db push --schema=prisma/schema.prisma      # from the repo root

# 2. Firebase Auth emulator (needs Java)
firebase emulators:start --only auth --project cog-app-studio   # :9099

# 3. Seed the QA accounts into the emulator + DB (idempotent)
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
export GCLOUD_PROJECT=cog-app-studio
npx tsx scripts/seed-qa-accounts-core.ts              # from the repo root

# 4. Build with the emulator flag — NEXT_PUBLIC_* is inlined at build time,
#    so this must be rebuilt, not just re-run.
export NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true
npm run build --workspace=web

# 5. Run
export E2E_AUTH=true
npm run e2e:auth --workspace=web
```

Credentials default to the documented QA super admin
(`docs/PLACEHOLDER_ACCOUNTS.md`); override with `E2E_EMAIL` / `E2E_PASSWORD`.

### Gotchas worth knowing

- **Login is two-step.** Enter the identifier, press **Continue**, and only then
  does the password field render. Filling `#identifier` and `#password` together
  fails because `#password` does not exist yet — see `_auth.ts`.
- **Toasts render their text twice** (visible title plus an `aria-live`
  announcement), so a bare `text=` locator trips Playwright strict mode. Scope
  with `.first()`.
- Vitest is configured to ignore `e2e/**`; these specs import `@playwright/test`
  and cannot run under it.
