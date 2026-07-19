# Connect2Souls (C2S) — Student Guide: Build the Dashboard

**Audience:** a student team starting work on the C2S mentor/admin dashboard  
**Product:** COG Studio monorepo (`github.com/njcarlo/studio`)  
**Live public Group Finder:**  
https://studio--cog-app-studio.asia-southeast1.hosted.app/public/c2s-join

This guide tells you:

1. What is already built (especially the Group Finder)  
2. How to set up your machine  
3. How the C2S code is organized  
4. A step-by-step plan for your team to develop the dashboard  
5. Suggested student tasks you can ship  

---

## 1. Big picture (read this first)

C2S has **two user surfaces** on **one production host** (Studio):

| Surface | Who uses it | Where |
|---|---|---|
| **Group Finder** (public) | Anyone (no login) | Studio `/public/c2s-join` |
| **Dashboard** (staff/mentors) | Logged-in mentors & admins | Studio `/c2s` and `/c2s/my-group` |

```
Public visitor
    → Group Finder (list + map + Join form)
    → creates a Join Request
    → mentor Approves / Rejects in dashboard
    → Approved person becomes a Mentee in the group
```

**You are mainly building / improving the dashboard.**  
The Group Finder already works — use it as the reference for UX quality and data fields.

---

## 2. What is already done — Group Finder

Do **not** rebuild this from scratch. Study it, then extend the dashboard.

### Live URL

https://studio--cog-app-studio.asia-southeast1.hosted.app/public/c2s-join

### Code locations

| Area | Path |
|---|---|
| Studio embed (production) | `apps/web/src/app/public/c2s-join/` |
| Standalone app (local optional) | `apps/c2s-public/` |
| Domain logic | `packages/c2s` (`@studio/c2s`) |
| Public actions (Studio) | `apps/web/src/actions/c2s.ts` |

### Features already implemented

1. **Group list** — cards with name, location, schedule, age range, demographics, “New” badge  
2. **Filters** — search, age group, meetup day, barangay/subdivision, demographics  
3. **Map** — Leaflet map; pins when `mapLat` / `mapLng` exist  
4. **Join dialog** — collects:
   - Required: first name, last name, email, phone, birthday, gender, privacy checkbox  
   - Optional: Facebook/social URL, first-attended month/year, notes/message  
5. **Submit join request** — creates `C2SJoinRequest` + approval workflow for the group’s mentor  
6. **No login required** — uses `withPublicAction`

### Data shown publicly (safe fields only)

`id`, `name`, `location`, `meetingSchedule`, `currentModule`, `ageGroupLabel`, `ageRangeMin/Max`, `meetupDay`, `demographics`, `mapLat`, `mapLng`, `createdAt`  
(Mentor private info is **not** exposed.)

---

## 3. What is already done — Dashboard (starting point)

| Route | Role | Already working |
|---|---|---|
| `/c2s` | Admin (`mentorship:manage`) | Groups CRUD, mentees directory CRUD, basic analytics charts |
| `/c2s/my-group` | Mentor (`mentor` flag) | Group profile edit, join-request inbox (approve/reject), mentee roster, sessions + attendance, per-group analytics |
| `/approvals` | Approvers | C2S join requests also appear on the Kanban |

### My Group cards (mentor dashboard)

| Component folder | Purpose |
|---|---|
| `GroupProfileCard` | Location, schedule, module, age, demographics, map coordinates |
| `JoinRequestsCard` | Pending join requests → Approve / Reject |
| `GroupMenteesCard` | Add / edit / delete mentees + notes + status |
| `GroupSessionsCard` | Sessions + attendance checkboxes |
| `GroupAnalyticsCard` | Status pie + attendance-by-session chart |

All under: `apps/web/src/app/c2s/my-group/`

---

## 4. Team setup (do this before coding)

### Step 0 — Tools to install

| Tool | Check |
|---|---|
| Git | `git --version` |
| Node.js 20+ | `node -v` |
| npm 11 | `npm -v` |
| Docker (for Postgres) | `docker --version` |

### Step 1 — Clone and install

```bash
git clone <repo-url>
cd studio
git checkout main
git pull
npm install
npx prisma generate
```

### Step 2 — Local Postgres

```bash
docker run -d --name cog-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=postgres \
  -p 54322:5432 \
  postgres:15

export DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
export DIRECT_URL="postgresql://postgres:postgres@localhost:54322/postgres"
npx prisma db push
```

### Step 3 — Env file

Create `apps/web/.env.local` (ask a mentor/teammate for Firebase values):

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
DIRECT_URL=postgresql://postgres:postgres@localhost:54322/postgres

NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cog-app-studio
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Keep C2S finder inside Studio locally (same as production)
NEXT_PUBLIC_C2S_EMBEDDED=true
```

### Step 4 — Run Studio

```bash
npm run dev:web
# → http://localhost:9002
```

Optional Firebase Auth emulator (second terminal):

```bash
npx firebase emulators:start --only auth,firestore,storage --project cog-app-studio
```

### Step 5 — Log in and open C2S

1. Open http://localhost:9002/login (or the live Studio URL)  
2. Use a QA account from [`PLACEHOLDER_ACCOUNTS.md`](./PLACEHOLDER_ACCOUNTS.md), e.g.:
   - Mentor: `qa.c2s.mentor@cogdasma.local` / `QaC2sMentor#2026`
   - C2S Admin: `qa.c2s.admin@cogdasma.local` / `QaC2sAdmin#2026`
3. Open sidebar → **Connect 2 Souls**  
4. Also open `/public/c2s-join` (Group Finder)  

If login works in Firebase but Studio shows no C2S access, the Worker seed was not run — ask a mentor to run `npx tsx prisma/seed-qa-accounts.ts` with production `DATABASE_URL`.

### Step 6 — Branching rule for the team

```bash
git checkout main && git pull
git checkout -b feature/c2s-<your-task-name>
```

One task ≈ one branch ≈ one PR. Don’t mix unrelated features.

---

## 5. Where to change code (dashboard)

### Pattern every feature follows

```
UI page / component
  → Server Action (apps/web/src/actions/c2s.ts or db.ts)
    → Domain package (@studio/c2s)
      → Prisma / Postgres
```

| Layer | Path |
|---|---|
| Admin page | `apps/web/src/app/c2s/page.tsx` |
| Mentor page | `apps/web/src/app/c2s/my-group/page.tsx` |
| Mentor components | `apps/web/src/app/c2s/my-group/components/` |
| Actions | `apps/web/src/actions/c2s.ts` |
| Domain logic | `packages/c2s/src/` |
| Schema | `prisma/schema.prisma` (models `C2S*`) |
| Nav / feature flag | `apps/web/src/components/layout/nav.tsx` |
| Permissions | `apps/web/src/lib/permissions/registry.ts` |

### Important rules

1. Privileged writes use `withPermission` (or mentor checks inside `@studio/c2s`).  
2. Never import `@studio/core-engine` barrel from client components — use `@studio/core-engine/tenant` for branding.  
3. Prefer editing `@studio/c2s` for business rules; keep actions thin.  
4. Run `npm run typecheck` before pushing.

---

## 6. Data model (what you will touch)

| Model | Meaning |
|---|---|
| `C2SGroup` | A discipleship group + mentor + public profile fields |
| `C2SMentee` | Person in a group (after approval or admin add) |
| `C2SJoinRequest` | Public application waiting for mentor decision |
| `C2SSession` | A meeting of the group |
| `C2SAttendanceRecord` | Present / absent per mentee per session |

### Join → approve flow (already wired)

1. Public submits join form  
2. System creates `C2SJoinRequest` + approval workflow type **`C2S Join Request`**  
3. Mentor approves/rejects in **My Group** or **/approvals**  
4. On approve → new `C2SMentee` is created (`status: In Progress`)

Your dashboard work should **respect this flow**, not invent a second status machine.

---

## 7. Suggested team roles

| Role | Focus area | Primary folders |
|---|---|---|
| Student A — Mentor UX | My Group polish | `app/c2s/my-group/components/` |
| Student B — Admin UX | `/c2s` Groups / Mentees / Analytics | `app/c2s/page.tsx` |
| Student C — Domain / data | `@studio/c2s`, Prisma, actions | `packages/c2s`, `actions/c2s.ts` |
| Student D — Finder continuity | Shared components, map, join fields parity | `public/c2s-join`, optionally `apps/c2s-public` |

Meet daily (or 2–3×/week): demo one merged PR each time.

---

## 8. Step-by-step development plan

### Phase 0 — Orientation (Day 1)

**Goal:** every student can run the app and explain the flow.

Checklist:

- [ ] Studio runs on `:9002`  
- [ ] Open Group Finder and submit a **test** join request  
- [ ] Log in as mentor → see request in **My Group** → Approve  
- [ ] Confirm mentee appears in roster  
- [ ] Skim `packages/c2s` README / `index.ts` exports  

**Done when:** each person can narrate “visitor → join → approve → mentee” with file paths.

---

### Phase 1 — Walk the existing dashboard (Day 1–2)

1. Open `/c2s/my-group` and click every button.  
2. Open `/c2s` as admin (or ask for an admin test account).  
3. Trace one action end-to-end, e.g. **Approve join**:
   - UI: `JoinRequestsCard`  
   - Action: `decideApprovalStage` / C2S sync  
   - Domain: `syncC2SJoinRequestFromWorkflow` in `@studio/c2s`  
4. Write a short team note: “What works / what’s confusing / what’s missing.”

---

### Phase 2 — Pick backlog items (student-sized)

Start with **one** item per person from this list (easiest → harder):

#### Easy (good first PRs)

1. **Show full join-request details** in `JoinRequestsCard`  
   (birthday, gender, social link, first-attended — already saved, not shown)  
2. **Empty / loading / error states** on My Group cards  
3. **Wire Search/Filter on admin Mentees tab** (`/c2s` — UI exists, not connected)  
4. **Copy / labels / accessibility** polish (buttons, headings, mobile layout)

#### Medium

5. **Map coordinate helper** — click map to set lat/lng in Group Profile (instead of typing)  
6. **Shared Group Finder components** — extract map/join UI so Studio + `apps/c2s-public` don’t drift  
7. **Richer mentor analytics** — date range, export CSV, attendance trends  
8. **Notify clarity** — confirm/improve messaging after approve/reject

#### Harder (ask a mentor before starting)

9. Schema changes (new fields) + `prisma db push` coordination  
10. New permission keys end-to-end  
11. Optional separate mentor PWA (`apps/c2s`) — **out of scope unless assigned**

---

### Phase 3 — Implement a feature (repeat for each task)

1. **Branch** from `main`  
2. **Find the vertical slice** (component → action → `@studio/c2s` → Prisma)  
3. **Implement the smallest useful change**  
4. **Manual test**
   - Happy path  
   - Permission denied (non-mentor)  
   - Mobile width  
5. **Typecheck**

```bash
npm run typecheck
```

6. **Commit + PR**

```bash
git add -A
git commit -m "feat(c2s): short description of dashboard change"
git push -u origin HEAD
```

Open a PR into `main`. Describe: what you changed, how you tested, screenshots if UI.

---

### Phase 4 — Integration demo (end of sprint)

As a group, demo this script:

1. Public user joins a group on Finder  
2. Mentor sees request details (your new fields)  
3. Mentor approves  
4. Mentee appears; mentor records a session + attendance  
5. Admin analytics updates  

---

## 9. Definition of done (every student PR)

- [ ] Touches the right layer (don’t put business logic only in the React page)  
- [ ] Works for mentor **and** doesn’t break admin `/c2s`  
- [ ] Public Finder still works if you touched shared types/actions  
- [ ] `npm run typecheck` passes  
- [ ] Short PR description + test steps  
- [ ] No secrets committed (`.env.local` stays local)

---

## 10. Quick command cheat sheet

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev:web                 # Studio :9002
npm run dev:c2s-public          # optional standalone finder :9004
npm run typecheck
rm -rf apps/web/.next           # if Next gets confused after a build
```

---

## 11. Helpful docs in this repo

| Doc | Why |
|---|---|
| `docs/BUILD_AN_APP_STEP_BY_STEP.md` | General monorepo beginner path |
| `docs/ONBOARDING.md` | Env, modules, first PR habits |
| `docs/SYSTEM_ARCHITECTURE.md` | Whole system map |
| `docs/CUSTOM_DOMAINS.md` | One-hosting decision for C2S |
| `packages/c2s/README.md` | Domain package notes |
| `AGENTS.md` | Local gotchas |

---

## 12. Out of scope (unless your instructor says otherwise)

- Restoring removed apps (`tract-tracker`, standalone inventory)  
- Attaching `c2s.cogdasma.app` custom DNS  
- Replacing the approval engine with a custom status field  
- Deploying a second Firebase App Hosting backend for `apps/c2s-public`

---

*Keep the Group Finder as the quality bar for public UX. Build the dashboard so mentors can manage everything that the Finder collects — clearly, quickly, and safely.*
