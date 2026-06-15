# Placeholder / QA Test Accounts

Login credentials for QA/demo accounts seeded into the shared database via
`prisma/seed-qa-accounts.ts` (`npx tsx prisma/seed-qa-accounts.ts`). The
script is idempotent — re-run it any time to reset a password or re-create
a missing account.

**Update this list whenever a new placeholder account is added or an
existing one's role/permissions change.**

| Role | Email | Password | Notes |
|---|---|---|---|
| Inventory Manager | `inventory.manager@cogdasma.local` | `QaInventory#2026` | Existing "Inventory Manager" role — `inventory:access`, `inventory:manage`, `inventory:set_code`, `facilities:manage`, `venues:create`, `workers:view`. |
| Ministry Head (generic) | `ministry.head@cogdasma.local` | `QaMinistryHead#2026` | "Ministry Head (QA)" role — `venues:approve`, `venues:approve_l1` (room reservation stage-1 approval). Not wired as the actual `headId` of any real ministry. For testing a *specific* ministry/department's head flow, use one of the Department Head accounts below instead. |
| Department Head (generic) | `department.head@cogdasma.local` | `QaDepartmentHead#2026` | "Department Head (QA)" role — `venues:approve`, `venues:approve_l2` (room reservation stage-2 approval). Not wired as the actual `headId` of any real department. |

## Department Head accounts (real `headId` wiring — one per department)

These are **pre-existing placeholder Worker records** (ids `999995`–`999999`)
that are already the `headId` of every Ministry and the matching
`DepartmentSetting` in their department — no rewiring was done, we only
enabled login for them. Logging in as one of these gives the real
"Ministry Head" + "Department Head" experience (approvals, facilities,
worker management, etc.) for every ministry listed below.

| Department | Email | Password | Ministries covered |
|---|---|---|---|
| Admin (A) | `placeholder.head.a@cogdasma.local` | `QaHeadAdmin#2026` | Arts, Engineering, Finance, In-House Services, Security and Shuttle, Linkages, Pastor, Pastor (Administration), Ventures, Technology |
| Discipleship (D) | `placeholder.head.d@cogdasma.local` | `QaHeadDiscipleship#2026` | CLDP, Kapehan, KCA, KID, Childrens, Pastor (Discipleship), One Liner, J12, LIFE Institute |
| Operations (O) | `placeholder.head.o@cogdasma.local` | `QaHeadOperations#2026` | Cluster 1–9, Medical, WEYJ, Pastor (Outreach), Fishers of Men, TAPAT |
| Relationship (R) | `placeholder.head.r@cogdasma.local` | `QaHeadRelationship#2026` | Guest Experience Ministry, Ladies, Mens, Sports, Ushering, YA, Youth Empowered, Pastor (Relationship) |
| Worship (W) | `placeholder.head.w@cogdasma.local` | `QaHeadWorship#2026` | Crusade, Dance, Musician, PMT, Singers, WhiteLight, Music Research & Development, Audio |

## Existing reference accounts (not seeded by this script)

| Role | Email | Notes |
|---|---|---|
| Super Admin | `admin@system.com` | Pre-existing super admin account (`isSuperAdmin = true`). Password not managed here. |

## Notes

- All seeded Worker profiles have `majorMinistryId`/`minorMinistryId` left
  blank (unscoped) — they're for testing role-gated screens, not real
  ministry workflows.
- To add another placeholder role, add an entry to the `ACCOUNTS` array in
  `prisma/seed-qa-accounts.ts`, re-run the script, and add a row to the
  table above.
