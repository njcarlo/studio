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
| Ministry Head | `ministry.head@cogdasma.local` | `QaMinistryHead#2026` | New "Ministry Head (QA)" role — `venues:approve`, `venues:approve_l1` (room reservation stage-1 approval). Not wired as the actual `headId` of any real ministry. |
| Department Head | `department.head@cogdasma.local` | `QaDepartmentHead#2026` | New "Department Head (QA)" role — `venues:approve`, `venues:approve_l2` (room reservation stage-2 approval). Not wired as the actual `headId` of any real department. |

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
