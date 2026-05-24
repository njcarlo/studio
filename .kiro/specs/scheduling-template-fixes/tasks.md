# Tasks — Scheduling Template Fixes

## Task List

- [x] 1. Fix 1: Add edit functionality to the templates page
  - [x] 1.1 Destructure `updateTemplate` from `useServiceTemplates()` in `templates/page.tsx`
  - [x] 1.2 Add `Pencil` to the lucide-react import in `templates/page.tsx`
  - [x] 1.3 Add edit dialog state variables (`isEditOpen`, `editingTemplate`, `editMinistryId`, `editTemplateName`, `editIsDefault`, `editRoles`, `isEditSaving`)
  - [x] 1.4 Implement `handleOpenEdit(t)` function that pre-populates edit state from the selected template
  - [x] 1.5 Implement `handleEdit()` async function that calls `updateTemplate` and handles success/error toasts
  - [x] 1.6 Add the edit (Pencil) icon button to each template card's `CardHeader` action area, next to the delete button
  - [x] 1.7 Add the Edit Template `Dialog` component to the page JSX, mirroring the create dialog structure with pre-populated fields and a disabled ministry selector

- [ ] 2. Fix 2: Fix Apply Template button visibility on the schedule detail page
  - [x] 2.1 Destructure `isLoading` (as `templatesLoading`) from `useServiceTemplates()` in `schedule/[id]/page.tsx`
  - [x] 2.2 Update the Apply Template button conditional render to show the button while loading (disabled with spinner) and hide it only when templates have loaded and none exist for that ministry

- [ ] 3. Verification
  - [ ] 3.1 Verify the edit dialog opens pre-populated with correct data for an existing template
  - [ ] 3.2 Verify saving the edit dialog updates the template name, roles, and default status in the UI
  - [ ] 3.3 Verify the Apply Template button appears on the schedule detail page after templates finish loading
  - [ ] 3.4 Verify applying a template still replaces ministry assignments correctly
  - [ ] 3.5 Verify creating and deleting templates still work as before
