# Requirements Document

## Introduction

This feature extends the existing Ministry Management module in the COG App (apps/web) to support **workload categories** — customizable groupings that ministry heads can define per ministry to organize the types of work or roles within that ministry. For example, a Music Ministry might define categories like "Guitar", "Piano", and "Vocals". These categories are scoped per ministry, so each ministry maintains its own independent set.

Workers can optionally be assigned to one or more workload categories within a ministry (e.g., a musician assigned to "Guitar"), but assignment is not required.

The feature is accessible to Ministry Heads (workers assigned as `headId` on a Ministry), Ministry Managers (users explicitly assigned to manage a specific ministry), and system administrators with the `canManageMinistries` permission.

## Glossary

- **Ministry**: An existing organizational unit in the COG App, belonging to a Department (e.g., Music Ministry, Prayer Ministry).
- **Ministry_Head**: A worker assigned as the `headId` of a Ministry. Has authority to manage that ministry's workload categories.
- **Ministry_Manager**: A user explicitly assigned by a system administrator to manage a specific ministry. Exactly one Ministry_Manager may be assigned to a ministry at a time. Has authority to create, edit, delete, and reorder Workload_Categories, and manage members for the assigned ministry.
- **Workload_Category**: A named grouping defined within a specific ministry to classify types of work or roles (e.g., "Guitar", "Piano", "Vocals" for a Music Ministry).
- **Category_Manager**: A Ministry_Head, Ministry_Manager, or system administrator who can create, edit, delete, and reorder Workload_Categories for a ministry.
- **COG_App**: The Next.js church management application at `apps/web`.
- **Ministry_Management_Module**: The existing settings page at `/settings/ministries` in the COG_App.
- **Scheduling_Module**: The scheduling feature in the COG_App responsible for managing ServiceSchedules, ScheduleAssignments, ServiceTemplates, TemplateRoles, WorshipSlots, and WorshipSlotWorkers.
- **Scheduler**: A user with permission to create and manage schedule assignments, template roles, and worship slot worker entries.
- **ScheduleAssignment**: A record linking a worker to a role (`roleName`) within a ministry for a specific ServiceSchedule.
- **TemplateRole**: A record defining a named role (`roleName`) and slot count within a ServiceTemplate for a ministry.
- **WorshipSlotWorker**: A record linking a worker to a WorshipSlot with an optional `role` field.

---

## Requirements

### Requirement 1: View Workload Categories per Ministry

**User Story:** As a Ministry_Head, I want to view the workload categories defined for my ministry, so that I can understand how workload is organized within the ministry.

#### Acceptance Criteria

1. WHEN a Ministry_Head navigates to a ministry's detail view, THE Ministry_Management_Module SHALL display all Workload_Categories belonging to that ministry.
2. THE Ministry_Management_Module SHALL display each Workload_Category with its name and an optional description.
3. WHEN a ministry has no Workload_Categories defined, THE Ministry_Management_Module SHALL display an empty state message indicating no categories exist yet.
4. THE Ministry_Management_Module SHALL display Workload_Categories in their defined sort order.

---

### Requirement 2: Create Workload Categories

**User Story:** As a Ministry_Head, I want to create custom workload categories for a ministry, so that I can organize the types of work specific to that ministry's needs.

#### Acceptance Criteria

1. WHEN a Category_Manager submits a new Workload_Category with a valid name, THE Ministry_Management_Module SHALL persist the Workload_Category associated with the correct ministry.
2. THE Ministry_Management_Module SHALL require a non-empty name for each Workload_Category.
3. WHEN a Category_Manager submits a Workload_Category with a name that already exists within the same ministry, THE Ministry_Management_Module SHALL reject the submission and display a duplicate name error.
4. THE Ministry_Management_Module SHALL allow an optional description field of up to 255 characters for each Workload_Category.
5. WHEN a Workload_Category is successfully created, THE Ministry_Management_Module SHALL display the new category in the ministry's category list without requiring a full page reload.

---

### Requirement 3: Edit Workload Categories

**User Story:** As a Ministry_Head, I want to edit existing workload categories, so that I can correct names or update descriptions as the ministry's needs evolve.

#### Acceptance Criteria

1. WHEN a Category_Manager submits an edit to an existing Workload_Category with a valid name, THE Ministry_Management_Module SHALL update the Workload_Category record in the database.
2. WHEN a Category_Manager renames a Workload_Category to a name already used by another Workload_Category in the same ministry, THE Ministry_Management_Module SHALL reject the update and display a duplicate name error.
3. WHEN a Workload_Category is successfully updated, THE Ministry_Management_Module SHALL reflect the updated name and description immediately in the category list.

---

### Requirement 4: Delete Workload Categories

**User Story:** As a Ministry_Head, I want to delete workload categories that are no longer relevant, so that the category list stays accurate and uncluttered.

#### Acceptance Criteria

1. WHEN a Category_Manager confirms deletion of a Workload_Category, THE Ministry_Management_Module SHALL permanently remove the Workload_Category from the database.
2. WHEN a Category_Manager initiates deletion of a Workload_Category, THE Ministry_Management_Module SHALL display a confirmation prompt before executing the deletion.
3. WHEN a Workload_Category is successfully deleted, THE Ministry_Management_Module SHALL remove it from the category list immediately without requiring a full page reload.

---

### Requirement 5: Reorder Workload Categories

**User Story:** As a Ministry_Head, I want to reorder workload categories within a ministry, so that the most relevant or commonly used categories appear in a logical sequence.

#### Acceptance Criteria

1. WHEN a Category_Manager submits a new sort order for Workload_Categories within a ministry, THE Ministry_Management_Module SHALL persist the updated order for those categories.
2. WHEN Workload_Categories are reordered, THE Ministry_Management_Module SHALL reflect the new order immediately in the category list without requiring a full page reload.
3. THE Ministry_Management_Module SHALL display Workload_Categories in their persisted sort order on all subsequent loads.

---

### Requirement 6: Ministry-Scoped Category Isolation

**User Story:** As a Ministry_Head, I want each ministry's workload categories to be independent from other ministries, so that each ministry can define categories that fit its own context without interference.

#### Acceptance Criteria

1. THE Ministry_Management_Module SHALL scope all Workload_Categories to a single ministry, such that categories created for one ministry are not visible in another ministry's category list.
2. WHEN two different ministries define Workload_Categories with the same name, THE Ministry_Management_Module SHALL store and display them independently without conflict.
3. WHEN a Ministry is deleted, THE Ministry_Management_Module SHALL delete all Workload_Categories associated with that ministry.

---

### Requirement 7: Optional Worker Assignment to Categories

**User Story:** As a Ministry_Head, I want to optionally assign workers to workload categories within a ministry, so that I can track which workers handle which types of work without making assignment mandatory.

#### Acceptance Criteria

1. WHERE worker-category assignment is enabled for a ministry, THE Ministry_Management_Module SHALL allow a Category_Manager to assign a worker to one or more Workload_Categories within that ministry.
2. WHERE worker-category assignment is enabled for a ministry, THE Ministry_Management_Module SHALL allow a Category_Manager to remove a worker's assignment from a Workload_Category.
3. THE Ministry_Management_Module SHALL not require a worker to be assigned to any Workload_Category in order to be a member of a ministry.
4. WHEN a Workload_Category is deleted, THE Ministry_Management_Module SHALL remove all worker assignments associated with that Workload_Category.

---

### Requirement 8: Ministry Manager Role

**User Story:** As a system administrator, I want to assign a Ministry Manager to a specific ministry, so that a designated user can manage that ministry's categories and members without requiring system-wide admin permissions.

#### Acceptance Criteria

1. THE Ministry_Management_Module SHALL allow a worker with the `canManageMinistries` system permission to assign a Ministry_Manager to a specific ministry.
2. THE Ministry_Management_Module SHALL enforce that at most one Ministry_Manager is assigned to a ministry at any given time.
3. WHEN a worker with the `canManageMinistries` permission assigns a new Ministry_Manager to a ministry that already has one, THE Ministry_Management_Module SHALL replace the existing Ministry_Manager assignment with the new one.
4. THE Ministry_Management_Module SHALL allow a worker with the `canManageMinistries` system permission to remove a Ministry_Manager assignment from a ministry.
5. WHEN a Ministry_Manager is assigned to a ministry, THE Ministry_Management_Module SHALL grant that Ministry_Manager the ability to create, edit, delete, and reorder Workload_Categories for that ministry.
6. WHEN a Ministry_Manager is assigned to a ministry, THE Ministry_Management_Module SHALL grant that Ministry_Manager the ability to manage members within that ministry.
7. THE Ministry_Management_Module SHALL restrict a Ministry_Manager's elevated permissions to only the ministry they are explicitly assigned to manage.
8. WHEN a Ministry_Manager assignment is removed, THE Ministry_Management_Module SHALL revoke that user's Ministry_Manager permissions for the previously assigned ministry.

---

### Requirement 9: Access Control

**User Story:** As a system administrator, I want only authorized users to manage workload categories, so that ministry data is protected from unauthorized changes.

#### Acceptance Criteria

1. WHEN a worker who is not a Category_Manager for a ministry attempts to create, edit, delete, or reorder a Workload_Category for that ministry, THE Ministry_Management_Module SHALL reject the request and return an authorization error.
2. THE Ministry_Management_Module SHALL allow a worker with the `canManageMinistries` system permission to manage Workload_Categories for any ministry.
3. THE Ministry_Management_Module SHALL allow a Ministry_Head to manage Workload_Categories for the ministry where they are assigned as head.
4. THE Ministry_Management_Module SHALL allow a Ministry_Manager to manage Workload_Categories for the ministry they are assigned to manage.
5. WHEN an unauthenticated request is made to create, edit, delete, or reorder a Workload_Category, THE Ministry_Management_Module SHALL reject the request with an authentication error.

---

### Requirement 10: Data Persistence

**User Story:** As a Ministry_Head, I want workload categories to be reliably stored, so that the data is available consistently across sessions and users.

#### Acceptance Criteria

1. THE Ministry_Management_Module SHALL persist Workload_Categories in the PostgreSQL database via Prisma.
2. WHEN the COG_App is restarted or the page is refreshed, THE Ministry_Management_Module SHALL retrieve and display all previously saved Workload_Categories for each ministry in their persisted sort order.
3. IF a database error occurs during a create, update, delete, or reorder operation, THEN THE Ministry_Management_Module SHALL display a descriptive error message to the user and leave the existing data unchanged.

---

### Requirement 11: Scheduling Module Integration with Workload Categories

**User Story:** As a Scheduler, I want the role/category field in schedule assignments, template roles, and worship slot worker assignments to be populated from the selected ministry's Workload_Categories, so that role names are consistent and drawn from a defined list rather than free-text entry.

#### Acceptance Criteria

1. WHEN a Scheduler selects a ministry while adding or editing a ScheduleAssignment, THE Scheduling_Module SHALL fetch and display that ministry's Workload_Categories as a dropdown for the `roleName` field, ordered by the ministry's defined Workload_Category sort order.
2. WHEN a Scheduler defines or edits a TemplateRole for a ministry, THE Scheduling_Module SHALL fetch and display that ministry's Workload_Categories as a dropdown for the `roleName` field, ordered by the ministry's defined Workload_Category sort order.
3. WHEN a Scheduler assigns a worker to a WorshipSlotWorker entry, THE Scheduling_Module SHALL fetch and display the worship/music ministry's Workload_Categories as a dropdown for the `role` field, ordered by that ministry's defined Workload_Category sort order.
4. WHEN a ministry has no Workload_Categories defined, THE Scheduling_Module SHALL fall back to allowing free-text entry for the role field.
5. THE Scheduling_Module SHALL reflect the current sort order of a ministry's Workload_Categories each time the role dropdown is rendered.
6. WHEN a Workload_Category is renamed or deleted, THE Scheduling_Module SHALL retain the original role name string on all existing ScheduleAssignment, TemplateRole, and WorshipSlotWorker records without cascading the rename or deletion to historical data.
