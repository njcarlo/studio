# Placeholder / QA Test Accounts

Login credentials for QA/demo accounts seeded via
`prisma/seed-qa-accounts.ts` (Firebase Auth + Postgres Worker rows).

```bash
# From repo root, with production or staging secrets loaded:
set -a && source apps/web/.env.local && set +a
# Also set GOOGLE_APPLICATION_CREDENTIALS to a Firebase service-account JSON
# that can create Auth users on project cog-app-studio.
npx prisma generate
npx tsx prisma/seed-qa-accounts.ts
```

The script is **idempotent** — re-run to reset passwords or recreate missing users.

**App URL:** https://studio--cog-app-studio.asia-southeast1.hosted.app/login  

**Public C2S (no login):** https://studio--cog-app-studio.asia-southeast1.hosted.app/public/c2s-join

### Seed status (production)

| Layer | Status |
|---|---|
| Firebase Auth users (C2S three below) | **Created** in project `cog-app-studio` |
| Worker rows + roles + demo C2S groups | **Run the seed script** with `DATABASE_URL` (and Admin credentials) — required before dashboard login works |

Until the seed script is run against production Postgres, these emails can authenticate in Firebase but Studio will not treat them as mentors/admins (no Worker profile).

---

## C2S accounts (use these for Group Finder + dashboard QA)

| Role | Email | Password | What you can test |
|---|---|---|---|
| **C2S Mentor** | `qa.c2s.mentor@cogdasma.local` | `QaC2sMentor#2026` | `/c2s/my-group` — profile, join requests, mentees, sessions, attendance. Owns **QA Demo C2S Group**. |
| **C2S Admin** | `qa.c2s.admin@cogdasma.local` | `QaC2sAdmin#2026` | `/c2s` — Groups / Mentees CRUD + analytics (`mentorship:manage`, `mentorship:view_reports`). |
| **QA Super Admin** | `qa.superadmin@cogdasma.local` | `QaSuperAdmin#2026` | Full Studio access + mentor flag. Use for broad smoke tests. |

### Suggested C2S QA script

1. Open Group Finder (no login) → find **QA Demo C2S Group** → submit a join request.  
2. Log in as **C2S Mentor** → **My Group** → Approve / Reject the request.  
3. Confirm mentee appears; create a session + mark attendance.  
4. Log in as **C2S Admin** → `/c2s` → verify groups/mentees/analytics.  

---

## Other role-gated accounts

| Role | Email | Password | Notes |
|---|---|---|---|
| Inventory Manager | `inventory.manager@cogdasma.local` | `QaInventory#2026` | Inventory + facilities permissions. |
| Ministry Head (generic) | `ministry.head@cogdasma.local` | `QaMinistryHead#2026` | Room reservation stage-1 approval. |
| Department Head (generic) | `department.head@cogdasma.local` | `QaDepartmentHead#2026` | Room reservation stage-2 approval. |

## Department Head accounts (real `headId` wiring)

Pre-existing Worker rows (`999995`–`999999`). Script enables Firebase login for them.

| Department | Email | Password |
|---|---|---|
| Admin (A) | `placeholder.head.a@cogdasma.local` | `QaHeadAdmin#2026` |
| Discipleship (D) | `placeholder.head.d@cogdasma.local` | `QaHeadDiscipleship#2026` |
| Operations (O) | `placeholder.head.o@cogdasma.local` | `QaHeadOperations#2026` |
| Relationship (R) | `placeholder.head.r@cogdasma.local` | `QaHeadRelationship#2026` |
| Worship (W) | `placeholder.head.w@cogdasma.local` | `QaHeadWorship#2026` |

## Existing reference account (not managed by this script)

| Role | Email | Notes |
|---|---|---|
| Super Admin | `admin@system.com` | Pre-existing. Password not managed here. |

## Notes

- Seeded Workers are unscoped (blank ministry ids) unless noted — for role/flag testing, not real ministry workflows.  
- C2S Mentor / Super Admin get a demo `C2SGroup` so join → approve works end-to-end.  
- Auth provider is **Firebase Auth** (not Supabase). Older seed used Supabase; this script was updated for Firebase.  
- Update this file whenever `ACCOUNTS` in `prisma/seed-qa-accounts.ts` changes.  
- **Do not use these passwords for real staff accounts.**
