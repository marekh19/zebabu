# [US-3.5] Prevent Deleting Last Income/Expense Category

**Epic:** Category Management
**Priority:** P0 (MVP Critical)
**Story Points:** 1
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** be prevented from deleting the last income or expense category,
**So that** my budget remains valid and functional.

---

## Description

Enforce business rules BR-8 and BR-9 by preventing deletion of the last category of each type. The UI should disable the delete button and show an explanatory tooltip when attempting to delete the last income or expense category.

---

## Acceptance Criteria

- [ ] Cannot delete last income category
- [ ] Cannot delete last expense category
- [ ] Delete button disabled when last of type
- [ ] Tooltip explains why deletion is disabled
- [ ] Server-side validation enforces rule
- [ ] Error message if validation bypassed
- [ ] Can delete when multiple categories of same type exist

---

## Technical Implementation

### Files to Modify/Create

- `src/lib/server/modules/category/service.ts` - Add validation (already implemented in US-3.3)
- `src/lib/components/category/CategoryHeader.svelte` - Disable delete button logic
- `src/lib/utils/categoryValidation.ts` - Client-side validation helper

### Implementation Steps

1. **Client-Side Validation**
   - Count categories by type
   - Disable delete button if count === 1
   - Show tooltip with explanation

2. **Server-Side Validation**
   - Check category count before deletion
   - Throw specific error code
   - Return user-friendly error message

3. **UI Feedback**
   - Visual indicator (grayed out button)
   - Tooltip on hover
   - Modal explanation if clicked

### Service Layer

```typescript
// src/lib/server/modules/category/service.ts
// (Already implemented in US-3.3, included here for reference)

export async function canDeleteCategory(
  categoryId: string,
  budgetId: string,
): Promise<{ canDelete: boolean; reason?: string }> {
  const category = await db.query.categories.findFirst({
    where: eq(categories.id, categoryId),
  })

  if (!category) {
    return { canDelete: false, reason: 'Category not found' }
  }

  const categoriesOfSameType = await db.query.categories.findMany({
    where: and(
      eq(categories.budgetId, budgetId),
      eq(categories.type, category.type),
    ),
  })

  if (categoriesOfSameType.length <= 1) {
    return {
      canDelete: false,
      reason: `Cannot delete last ${category.type} category. Your budget must have at least one ${category.type} category.`,
    }
  }

  return { canDelete: true }
}
```

### UI Components

```typescript
// src/lib/utils/categoryValidation.ts
export function isLastCategoryOfType(
  category: Category,
  allCategories: Category[],
): boolean {
  const categoriesOfSameType = allCategories.filter(
    (c) => c.type === category.type,
  )
  return categoriesOfSameType.length === 1
}

export function getDeleteDisabledReason(
  category: Category,
  allCategories: Category[],
): string | null {
  if (isLastCategoryOfType(category, allCategories)) {
    return `This is the last ${category.type} category. Your budget must have at least one ${category.type} category.`
  }
  return null
}
```

```svelte
<!-- src/lib/components/category/CategoryHeader.svelte -->
<script lang="ts">
  import {
    isLastCategoryOfType,
    getDeleteDisabledReason,
  } from '$lib/utils/categoryValidation'
  import type { Category } from '$lib/server/db/schema/categories'

  let {
    category,
    allCategories,
    onEdit,
    onDelete,
  }: {
    category: Category
    allCategories: Category[]
    onEdit: () => void
    onDelete: () => void
  } = $props()

  const isLastOfType = $derived(isLastCategoryOfType(category, allCategories))

  const deleteDisabledReason = $derived(
    getDeleteDisabledReason(category, allCategories),
  )

  let showTooltip = $state(false)
</script>

<div class="category-header">
  <div class="drag-handle">⋮⋮</div>

  <div class="category-info">
    <h3 style="color: {category.color}">
      {category.icon || ''}
      {category.name}
    </h3>
    {#if category.targetPercentage}
      <span class="target-badge">Target: {category.targetPercentage}%</span>
    {/if}
  </div>

  <div class="category-actions">
    <button class="btn-icon" onclick={onEdit} title="Edit category">
      ✏️
    </button>

    <div class="delete-button-wrapper">
      <button
        class="btn-icon btn-danger"
        onclick={onDelete}
        disabled={isLastOfType}
        title={deleteDisabledReason || 'Delete category'}
        onmouseenter={() => {
          if (isLastOfType) showTooltip = true
        }}
        onmouseleave={() => (showTooltip = false)}
      >
        🗑️
      </button>

      {#if isLastOfType && showTooltip}
        <div class="tooltip">
          {deleteDisabledReason}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .delete-button-wrapper {
    position: relative;
  }

  .tooltip {
    position: absolute;
    bottom: 100%;
    right: 0;
    padding: 8px 12px;
    background: #1f2937;
    color: white;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 10;
    margin-bottom: 4px;
  }

  .btn-icon:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
```

---

## Validation & Business Rules

- **BR-8**: Cannot delete last income category in a budget
- **BR-9**: Cannot delete last expense category in a budget
- **BR-3**: Budget must have at least 1 income category
- **BR-4**: Budget must have at least 1 expense category

---

## Testing Checklist

- [ ] Unit tests for validation logic
- [ ] Unit tests for client-side helpers
- [ ] Integration test for delete prevention
- [ ] Manual testing checklist:
  - [ ] Delete button disabled when last income category
  - [ ] Delete button disabled when last expense category
  - [ ] Tooltip shows on hover
  - [ ] Can delete when 2+ categories of same type
  - [ ] Server validation prevents deletion if client bypassed
  - [ ] Error message clear and helpful
  - [ ] Works for both income and expense types

---

## Dependencies

- Depends on: US-3.1 (Create Category), US-3.3 (Delete Category)
- Blocks: None

---

## Notes

- This validation is critical for data integrity
- Consider showing category count in UI
- Could add bulk delete protection
- Future: Allow "merge" instead of delete
