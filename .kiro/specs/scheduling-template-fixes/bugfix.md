# Bugfix Requirements Document

## Introduction

Two related bugs exist in the scheduling module of the COG App (`apps/web`):

**Bug 1 — Templates are not editable:** The templates page (`/schedule/templates`) only supports creating and deleting templates. There is no edit functionality exposed in the UI, even though the `updateTemplate` mutation and `updateServiceTemplate` server action already exist. Users cannot modify a template's name, roles, counts, or default status after creation.

**Bug 2 — Apply Template button is not visible / does not work:** On the schedule detail page (`/schedule/[id]`), the "Apply Template" button for a ministry card is only rendered when `ministryTemplates.length > 0`, where `ministryTemplates` is derived by filtering the globally-loaded `templates` array by `t.ministryId === ministryId`. The `useServiceTemplates()` hook is called without a `ministryId` argument, so it should return all templates. However, the query key is `['service-templates', ministryId]` — when called without an argument, `ministryId` is `undefined`, producing the key `['service-templates', undefined]`. The templates page calls the same hook without arguments, so both pages share the same cache entry and the data should be available. The real risk is a race condition or stale cache: if the schedule detail page loads before templates are fetched, `templates` is `[]` and the button never appears. Additionally, the `applyTemplateDialog` state stores a `ministryId` (string), but the dialog filters templates by `t.ministryId === applyTemplateDialog` — this comparison is correct in isolation, but if templates haven't loaded yet the list is empty and the dialog is useless.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user navigates to the templates page and views an existing template THEN the system displays only a delete button with no way to edit the template's name, roles, counts, or default status.

1.2 WHEN a user wants to correct a mistake in a template (e.g. wrong role name or count) THEN the system provides no edit action, forcing the user to delete and recreate the template.

1.3 WHEN a schedule detail page loads and the `useServiceTemplates()` query has not yet resolved THEN the system renders `templates` as an empty array, causing `ministryTemplates.length > 0` to be `false` and hiding the "Apply Template" button for all ministry cards.

1.4 WHEN the "Apply Template" button is hidden due to an empty templates array THEN the system never shows the button even after templates finish loading, because the button visibility is evaluated at render time with no re-render guard beyond the query result.

1.5 WHEN a user opens the Apply Template dialog for a ministry that has templates THEN the system correctly filters and lists those templates, but if templates are still loading the dialog body is empty and the user cannot apply any template.

### Expected Behavior (Correct)

2.1 WHEN a user views a template card on the templates page THEN the system SHALL display an edit (pencil) button alongside the existing delete button.

2.2 WHEN a user clicks the edit button on a template card THEN the system SHALL open an edit dialog pre-populated with the template's current name, isDefault flag, and all existing roles (roleName, count) so the user can modify them.

2.3 WHEN a user submits the edit dialog THEN the system SHALL call `updateTemplate` with the updated name, isDefault, and roles, persist the changes via `updateServiceTemplate`, and reflect the updated data in the UI without a page reload.

2.4 WHEN the schedule detail page renders a ministry card THEN the system SHALL show the "Apply Template" button whenever templates for that ministry exist, regardless of whether the templates query resolved before or after the ministry card rendered.

2.5 WHEN the templates query is still loading on the schedule detail page THEN the system SHALL either defer rendering the ministry card action buttons until templates are available, or show the "Apply Template" button as soon as the query resolves (i.e. the button visibility must be reactive to the query result).

2.6 WHEN a user opens the Apply Template dialog for a ministry THEN the system SHALL display all templates belonging to that ministry, and the dialog SHALL remain functional as long as at least one template exists for that ministry.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user creates a new template on the templates page THEN the system SHALL CONTINUE TO create the template and display it in the correct department/ministry grouping.

3.2 WHEN a user deletes a template on the templates page THEN the system SHALL CONTINUE TO remove the template and update the list immediately.

3.3 WHEN a user applies a template to a schedule THEN the system SHALL CONTINUE TO delete existing assignments for that ministry on that schedule and create new blank slots from the template's roles.

3.4 WHEN a user adds a role slot manually to a ministry on the schedule detail page THEN the system SHALL CONTINUE TO create the slot without affecting template data.

3.5 WHEN a user navigates between the templates page and the schedule detail page THEN the system SHALL CONTINUE TO share the same React Query cache for `['service-templates', undefined]` so that templates loaded on one page are immediately available on the other.

3.6 WHEN a template is marked as default THEN the system SHALL CONTINUE TO display the "Default" badge on the template card and in the Apply Template dialog.

---

## Bug Condition Derivation

### Bug 1 — No Edit Functionality

```pascal
FUNCTION isBugCondition_EditTemplate(X)
  INPUT: X of type UserAction
  OUTPUT: boolean

  RETURN X.page = "templates" AND X.action = "edit" AND X.templateExists = true
END FUNCTION

// Property: Fix Checking — Edit Template
FOR ALL X WHERE isBugCondition_EditTemplate(X) DO
  result ← renderTemplateCard'(X.template)
  ASSERT result.hasEditButton = true
  ASSERT result.editDialog.isPrePopulated = true
  ASSERT result.editDialog.fields INCLUDES { name, isDefault, roles }
END FOR

// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition_EditTemplate(X) DO
  ASSERT renderTemplateCard(X) = renderTemplateCard'(X)
END FOR
```

### Bug 2 — Apply Template Button Hidden

```pascal
FUNCTION isBugCondition_ApplyTemplate(X)
  INPUT: X of type ScheduleDetailPageState
  OUTPUT: boolean

  RETURN X.templatesQueryResolved = false
         AND X.ministryHasTemplates = true
END FUNCTION

// Property: Fix Checking — Apply Template Visibility
FOR ALL X WHERE isBugCondition_ApplyTemplate(X) DO
  result ← renderMinistryCard'(X.ministryId, X.templates)
  ASSERT result.applyTemplateButtonVisible = true WHEN X.templatesQueryResolved = true
END FOR

// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition_ApplyTemplate(X) DO
  ASSERT renderMinistryCard(X) = renderMinistryCard'(X)
END FOR
```
