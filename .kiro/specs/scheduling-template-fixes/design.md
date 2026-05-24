# Design Document — Scheduling Template Fixes

## Overview

This document describes the technical approach for fixing two bugs in the scheduling module:

1. **Bug 1**: Add edit functionality to the templates page so users can update a template's name, default status, and roles.
2. **Bug 2**: Fix the "Apply Template" button visibility on the schedule detail page so it reliably appears whenever templates exist for a ministry.

Both fixes are purely UI-layer changes. The server actions (`updateServiceTemplate`, `applyTemplateToSchedule`) and the hook mutations (`updateTemplate`) already exist and are correct. No database schema changes are required.

---

## Technical Context

### Relevant Files

| File | Role |
|------|------|
| `apps/web/src/app/schedule/templates/page.tsx` | Templates list page — Bug 1 fix target |
| `apps/web/src/app/schedule/[id]/page.tsx` | Schedule detail page — Bug 2 fix target |
| `apps/web/src/hooks/use-schedule.ts` | `useServiceTemplates` hook — exposes `updateTemplate` |
| `apps/web/src/actions/schedule.ts` | `updateServiceTemplate` server action — already correct |

### Existing Patterns

- Dialogs use `@studio/ui` `Dialog / DialogContent / DialogHeader / DialogTitle / DialogFooter` components.
- Form fields use `Input`, `Label`, `Select`, `Checkbox` from `@studio/ui`.
- Role rows in the create dialog use a local `RoleRow[]` state array with `addRole`, `removeRole`, `updateRole` helpers.
- Mutations are called via `mutateAsync` (aliased as `createTemplate`, `updateTemplate`, `deleteTemplate`).
- Toast notifications use `useToast()` with `{ title }` for success and `{ variant: "destructive", title }` for errors.
- Loading state is tracked with a local `isSaving` boolean.

---

## Fix 1: Edit Template Dialog (templates/page.tsx)

### Root Cause

The templates page only destructures `createTemplate` and `deleteTemplate` from `useServiceTemplates()`. The `updateTemplate` mutation is available but never used. No edit button or dialog exists.

### Approach

Add an edit dialog that mirrors the create dialog structure, pre-populated with the selected template's data.

#### State additions

```typescript
const [isEditOpen, setIsEditOpen] = useState(false);
const [editingTemplate, setEditingTemplate] = useState<any>(null);
const [editMinistryId, setEditMinistryId] = useState("");
const [editTemplateName, setEditTemplateName] = useState("");
const [editIsDefault, setEditIsDefault] = useState(false);
const [editRoles, setEditRoles] = useState<RoleRow[]>([]);
const [isEditSaving, setIsEditSaving] = useState(false);
```

#### Open handler

```typescript
const handleOpenEdit = (t: any) => {
    setEditingTemplate(t);
    setEditMinistryId(t.ministryId);
    setEditTemplateName(t.name);
    setEditIsDefault(t.isDefault);
    setEditRoles(t.roles.map((r: any) => ({ roleName: r.roleName, count: r.count, notes: r.notes || "" })));
    setIsEditOpen(true);
};
```

#### Submit handler

```typescript
const handleEdit = async () => {
    if (!editingTemplate || !editTemplateName.trim()) return;
    const validRoles = editRoles.filter(r => r.roleName.trim());
    if (validRoles.length === 0) return;
    setIsEditSaving(true);
    try {
        await updateTemplate({
            id: editingTemplate.id,
            data: {
                name: editTemplateName.trim(),
                isDefault: editIsDefault,
                roles: validRoles.map((r, i) => ({ roleName: r.roleName.trim(), count: r.count, notes: r.notes || undefined, order: i })),
            },
        });
        toast({ title: "Template updated" });
        setIsEditOpen(false);
        setEditingTemplate(null);
    } catch {
        toast({ variant: "destructive", title: "Failed to update template" });
    } finally {
        setIsEditSaving(false);
    }
};
```

#### Destructure `updateTemplate` from hook

```typescript
const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate } = useServiceTemplates();
```

#### Edit button on template card

Add a pencil (`Pencil`) icon button next to the existing delete button in each template card's `CardHeader`:

```tsx
import { ArrowLeft, PlusCircle, Trash2, LoaderCircle, Plus, X, Pencil } from "lucide-react";

// In the card header actions:
<Button variant="ghost" size="icon" className="h-7 w-7"
    onClick={() => handleOpenEdit(t)}>
    <Pencil className="h-3.5 w-3.5" />
</Button>
<Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
    onClick={() => handleDelete(t.id)}>
    <Trash2 className="h-3.5 w-3.5" />
</Button>
```

#### Edit dialog

The edit dialog is structurally identical to the create dialog, but:
- The ministry `Select` is disabled (ministry cannot be changed after creation — changing it would require moving the template to a different ministry, which is out of scope).
- All fields are pre-populated from `editingTemplate`.
- The submit button calls `handleEdit`.

```tsx
<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
    <DialogContent className="max-w-lg">
        <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
            <div className="space-y-1.5">
                <Label>Ministry</Label>
                <Select value={editMinistryId} disabled>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {visibleMinistries.map((m: any) => (
                            <SelectItem key={m.id} value={m.id}>
                                <span className="text-xs text-muted-foreground mr-2">{getDeptCode(m)}</span>
                                {m.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label>Template Name</Label>
                <Input value={editTemplateName} onChange={e => setEditTemplateName(e.target.value)} placeholder="e.g. Standard Sunday" />
            </div>
            <div className="flex items-center gap-2">
                <Checkbox id="editIsDefault" checked={editIsDefault} onCheckedChange={v => setEditIsDefault(!!v)} />
                <Label htmlFor="editIsDefault" className="font-normal cursor-pointer">Set as default template for this ministry</Label>
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Roles</Label>
                    <Button variant="ghost" size="sm" className="h-7 text-xs"
                        onClick={() => setEditRoles(r => [...r, { roleName: "", count: 1, notes: "" }])}>
                        <Plus className="mr-1 h-3 w-3" /> Add Role
                    </Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {editRoles.map((role, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <Input className="flex-1" placeholder="Role name" value={role.roleName}
                                onChange={e => setEditRoles(r => r.map((row, idx) => idx === i ? { ...row, roleName: e.target.value } : row))} />
                            <Input type="number" min={1} max={20} className="w-16 text-center" value={role.count}
                                onChange={e => setEditRoles(r => r.map((row, idx) => idx === i ? { ...row, count: parseInt(e.target.value) || 1 } : row))} />
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive"
                                onClick={() => setEditRoles(r => r.filter((_, idx) => idx !== i))}
                                disabled={editRoles.length === 1}>
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">Role name + how many workers needed for that role.</p>
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={isEditSaving || !editTemplateName.trim()}>
                {isEditSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
```

---

## Fix 2: Apply Template Button Visibility (schedule/[id]/page.tsx)

### Root Cause

The `useServiceTemplates()` hook is called without arguments on the schedule detail page. The query key becomes `['service-templates', undefined]`. This is the same key used by the templates page, so the cache is shared — but on first load of the schedule detail page, the query may not have resolved yet, causing `templates` to be `[]`.

The button visibility check `ministryTemplates.length > 0` is evaluated synchronously during render. If `templates` is still `[]` at the time the ministry card renders, the button is hidden. Once the query resolves and `templates` is populated, React re-renders the component and the button should appear — **this is actually correct React Query behavior**.

However, there is a subtle issue: the `useServiceTemplates()` call on the schedule detail page does not expose `isLoading`. If templates are loading, the button is hidden with no indication to the user. More critically, if the templates query fails silently, the button is permanently hidden.

### Approach

The fix has two parts:

1. **Expose `isLoading` from `useServiceTemplates()`** on the schedule detail page and use it to show a loading indicator or defer the button until templates are ready.
2. **Always show the "Apply Template" button** for a ministry if the templates query has resolved and there are templates for that ministry. If the query is still loading, show a subtle loading state on the button area rather than hiding it entirely.

#### Specific change in schedule/[id]/page.tsx

Change the destructuring of `useServiceTemplates()` to also capture `isLoading`:

```typescript
const { templates, isLoading: templatesLoading } = useServiceTemplates();
```

Then in the ministry card header, replace the conditional render:

```tsx
// Before (Bug):
{ministryTemplates.length > 0 && (
    <Button variant="outline" size="sm" className="h-7 text-xs"
        onClick={() => setApplyTemplateDialog(ministryId)}>
        <LayoutTemplate className="mr-1 h-3 w-3" /> Apply Template
    </Button>
)}

// After (Fix):
{(templatesLoading || ministryTemplates.length > 0) && (
    <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        disabled={templatesLoading}
        onClick={() => setApplyTemplateDialog(ministryId)}
    >
        {templatesLoading
            ? <LoaderCircle className="mr-1 h-3 w-3 animate-spin" />
            : <LayoutTemplate className="mr-1 h-3 w-3" />
        }
        Apply Template
    </Button>
)}
```

This ensures:
- While templates are loading, the button is visible but disabled (with a spinner), so users know it exists.
- Once templates load, if the ministry has templates the button becomes active.
- If the ministry has no templates after loading, the button is hidden (same as before).

#### Why the dialog filter is correct

The dialog already filters correctly: `templates.filter((t: any) => t.ministryId === applyTemplateDialog)`. Since `applyTemplateDialog` holds the `ministryId` string and templates are loaded by the time the user can click the (now-enabled) button, the dialog will always show the correct templates.

---

## No Changes Required

- `apps/web/src/hooks/use-schedule.ts` — `useServiceTemplates` already exposes `updateTemplate` and accepts an optional `ministryId`. No changes needed.
- `apps/web/src/actions/schedule.ts` — `updateServiceTemplate` and `applyTemplateToSchedule` are already correct. No changes needed.

---

## Correctness Properties

### Fix 1 — Edit Template

**Property: Fix Checking**
For any template `t` that exists in the system, after the fix:
- The template card renders an edit button.
- Clicking the edit button opens a dialog pre-populated with `t.name`, `t.isDefault`, and `t.roles`.
- Submitting the dialog with valid data calls `updateTemplate({ id: t.id, data: { name, isDefault, roles } })`.
- The UI reflects the updated template data after the mutation resolves.

**Property: Preservation Checking**
- Creating a new template still works identically.
- Deleting a template still works identically.
- The template list grouping by department/ministry is unchanged.

### Fix 2 — Apply Template Button

**Property: Fix Checking**
For any ministry card where templates exist for that ministry:
- The "Apply Template" button is visible once the templates query resolves (even if it was loading when the page first rendered).
- While templates are loading, the button is visible but disabled.
- Clicking the button opens the Apply Template dialog with the correct templates listed.

**Property: Preservation Checking**
- For ministries with no templates, the button remains hidden after templates load.
- Applying a template still replaces existing assignments for that ministry.
- All other ministry card actions (Add Role, delete ministry) are unchanged.
