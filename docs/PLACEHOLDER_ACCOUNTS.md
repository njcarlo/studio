# Placeholder / QA Test Accounts

Login credentials for QA/demo accounts.

**App URL:** https://studio--cog-app-studio.asia-southeast1.hosted.app/login  

**Public C2S (no login):** https://studio--cog-app-studio.asia-southeast1.hosted.app/public/c2s-join

## How accounts are seeded

On Firebase App Hosting deploy, when `QA_SEED_ON_DEPLOY=true` in `apphosting.yaml`,
`scripts/apphosting-build.sh` runs `scripts/seed-qa-accounts-core.ts` (idempotent).

Turn `QA_SEED_ON_DEPLOY` off after the first successful seed.

Manual (local / ops):

```bash
set -a && source apps/web/.env.local && set +a
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
npx tsx scripts/seed-qa-accounts-core.ts
```

---

## C2S accounts (Group Finder + dashboard QA)

| Role | Email | Password | What you can test |
|---|---|---|---|
| **C2S Mentor** | `qa.c2s.mentor@cogdasma.local` | `QaC2sMentor#2026` | `/c2s/my-group` — profile, join requests, mentees, sessions. Owns **QA Demo C2S Group**. |
| **C2S Admin** | `qa.c2s.admin@cogdasma.local` | `QaC2sAdmin#2026` | `/c2s` — Groups / Mentees / analytics. |
| **QA Super Admin** | `qa.superadmin@cogdasma.local` | `QaSuperAdmin#2026` | Full Studio access + mentor flag. |

### Suggested C2S QA script

Full manual checklist with pass/fail steps:  
**[`C2S_MANUAL_QA_USER_STORIES.md`](./C2S_MANUAL_QA_USER_STORIES.md)** ([Word](./C2S_MANUAL_QA_USER_STORIES.docx))

Short path:

1. Open Group Finder (no login) → find **QA Demo C2S Group** → submit a join request.  
2. Log in as **C2S Mentor** → **My Group** → Approve / Reject.  
3. Confirm mentee appears; create a session + attendance.  
4. Log in as **C2S Admin** → `/c2s` → verify groups/mentees/analytics.  

---

## Other role-gated accounts (seeded only by extended scripts / older runs)

| Role | Email | Password |
|---|---|---|
| Inventory Manager | `inventory.manager@cogdasma.local` | `QaInventory#2026` |
| Ministry Head (generic) | `ministry.head@cogdasma.local` | `QaMinistryHead#2026` |
| Department Head (generic) | `department.head@cogdasma.local` | `QaDepartmentHead#2026` |

## Department Head accounts (real `headId` wiring)

| Department | Email | Password |
|---|---|---|
| Admin (A) | `placeholder.head.a@cogdasma.local` | `QaHeadAdmin#2026` |
| Discipleship (D) | `placeholder.head.d@cogdasma.local` | `QaHeadDiscipleship#2026` |
| Operations (O) | `placeholder.head.o@cogdasma.local` | `QaHeadOperations#2026` |
| Relationship (R) | `placeholder.head.r@cogdasma.local` | `QaHeadRelationship#2026` |
| Worship (W) | `placeholder.head.w@cogdasma.local` | `QaHeadWorship#2026` |

## Existing reference account

| Role | Email | Notes |
|---|---|---|
| Super Admin | `admin@system.com` | Pre-existing. Password not managed here. |

## Notes

- Auth is **Firebase Auth**.  
- **Do not use these passwords for real staff accounts.**  
- Update this file when the account list in `scripts/seed-qa-accounts-core.ts` changes.  
