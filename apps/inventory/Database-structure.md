# Inventory System Database Structure

Below is the complete database structure for the Inventory Management System, powered by Prisma ORM and SQLite.

## Models Overview

### 1. `Category`
Tracks the diverse classifications for the items in the inventory.
- **`id`** (`String`): Primary key (CUID).
- **`name`** (`String`): Unique name of the category (e.g., Electronics, Furniture).
- **`description`** (`String?`): Optional longer description.
- **`color`** (`String?`), **`icon`** (`String?`): Optional UI customization properties.
- **`isActive`** (`Boolean`): Flags whether the category is currently used. Defaults to `true`.

### 2. `Location`
Tracks where items reside within the facility.
- **`id`** (`String`): Primary key (CUID).
- **`name`** (`String`): Unique name of the location (e.g., "4th Floor Studio", "Broadcast Room").

### 3. `Item`
The core model representing the actual stock, equipment, or consumable materials.
- **`id`** (`String`): Primary key (CUID).
- **`name`** (`String`): Descriptive name of the equipment/item.
- **`inventoryCode`** (`String?`): Auto-generated unique SKU or item code (e.g., `CAM-12A4`).
- **`categoryId`** (`String`): Foreign key connecting to the `Category` model.
- **`type`** (`String`): Type of item, generally "Equipment" or "Consumable".
- **`stock`** (`Int`): Current quantity readily available.
- **`minStock`** (`Int`): Threshold to trigger low-stock alerts.
- **`unit`** (`String`): Unit of measurement (default: `pcs`).
- **`status`** (`String`): The condition of the item (e.g., "Good Condition", "Damaged", "Borrowed").
- **`statusDetails`** (`String?`): Additional context regarding its status.
- **`locationId`** (`String?`): Foreign key connecting to the `Location` model.
- **Tracking details**: `aisle`, `shelf`, `bin` (`String?`) for granular physical location tracking.
- **`assignedTo`** (`String?`): Quick reference to who typically uses this item.
- **`imageUrl`** (`String?`): Display picture for the item.
- **`isApprovalRequired`** (`Boolean`): If checkout requires explicit admin approval.
- **`lastUpdated`**, **`createdAt`** (`DateTime`): Timestamp metadata.

### 4. `InventoryLog`
An immutable, append-only log of every single change made to items, ensuring full historical traceability.
- **`id`** (`String`): Primary key (CUID).
- **`itemId`** (`String`): Foreign key linking to the `Item`.
- **`workerId`** (`String?`): The user who enacted the change.
- **`action`** (`String`): Can be "Stock In", "Stock Out", "Checkout", "Return", or "Adjustment".
- **`quantity`** (`Int`): The delta size.
- **`balance`** (`Int`): The resulting stock balance after the action was completed.
- **`notes`** (`String?`): Contextual information about the action.
- **`timestamp`** (`DateTime`): Exact time the change occurred.

### 5. `InventoryBorrowing`
Manages the checkout and return workflows for equipment assigned to specific individuals.
- **`id`** (`String`): Primary key (CUID).
- **`itemId`** (`String`): The hardware/equipment being borrowed.
- **`quantity`** (`Int`): Count of items taken. Defaults to 1 for high-value gear.
- **`borrowerId`** (`String`), **`borrowerName`** (`String`), **`borrowerEmail`** (`String?`): Identity metrics for who holds the gear.
- **`borrowedAt`** (`DateTime`), **`returnedAt`** (`DateTime?`): Timestamp tracking.
- **`dueDate`** (`DateTime?`): The deadline for return. Triggers OVERDUE alerts if missed.
- **`status`** (`String`): Current standing (e.g., "BORROWED", "RETURNED").
- **`checkoutNotes`**, **`checkoutCondition`** (`String?`): Pre-departure checks.
- **`checkoutChecklist`** (`String?`): Stringified JSON of the checkout verification form (e.g., batteries charged, cables packed).
- **`returnNotes`**, **`returnCondition`** (`String?`): Post-arrival checks.
- **`returnChecklist`** (`String?`): Stringified JSON of the return verification form (e.g., no scratches, powers on).
- **`returnPhotos`** (`String?`): Optional array of image URLs saved as a JSON string proving condition upon return.

### 6. `Setting`
A flexible key-value store for global application configurations.
- **`id`** (`String`): Configuration key name (e.g., "checklist_templates").
- **`data`** (`String`): Configuration value stored as stringified JSON.

## Key Relationships
- An **Item** belongs to exactly one **Category**.
- An **Item** may optionally reside into one **Location**.
- When an **Item** is stocked in or out, it generates an **InventoryLog**.
- When an **Item** is assigned to a worker via "Borrowing Workflow", it creates an **InventoryBorrowing** record which manages due dates and conditions.
- On Return, **InventoryBorrowing** automatically generates an **InventoryLog** for stock adjustments.
