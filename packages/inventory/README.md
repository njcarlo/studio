# @studio/inventory

Inventory domain package — categories, items, stock adjustments, borrowings,
bulk import, and reports.

Depends on `@studio/database` (Prisma).

## Usage

```ts
import * as Inventory from '@studio/inventory';

await Inventory.getItems(ministryId, { search: 'mic' });
await Inventory.listItemsForPicker(); // event equipment picker
```

## Deploy surface

| Surface | App | Notes |
|---|---|---|
| Staff inventory UI | `apps/web` `/inventory/**` | Auth wrappers in `actions/inventory.ts` |

The standalone `apps/inventory` app was sunset — do not recreate it.
