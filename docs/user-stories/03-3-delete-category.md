# [US-3.3] Delete Category

**Epic:** Category Management
**Priority:** P0 (MVP Critical)
**Story Points:** 1
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** delete a category I no longer need,
**So that** I can keep my budget organized and remove unused categories.

---

## Description

Implement category deletion with cascade to all transactions. Must enforce business rules preventing deletion of the last income or expense category. Requires confirmation due to destructive nature.

---

## Acceptance Criteria

- [ ] Delete button available on category
- [ ] Confirmation dialog shown
- [ ] Cannot delete last income category
- [ ] Cannot delete last expense category
- [ ] Deletion cascades to transactions
- [ ] Success feedback after deletion
- [ ] Category removed from board immediately

---

## Technical Implementation

### Files to Modify/Create

- `src/routes/(app)/budgets/[id]/+page.server.ts` - Add deleteCategory action
- `src/lib/server/modules/category/service.ts` - Delete logic with validation
- `src/lib/components/category/DeleteCategoryModal.svelte` - Confirmation modal

### Implementation Steps

1. **Implement Delete Service**
   - Check if last income/expense category
   - Throw error if validation fails
   - Delete category (cascades to transactions)

2. **Create Confirmation Modal**
   - Show category name
   - Warn about transaction cascade
   - Show transaction count
   - Disable if last of type

3. **Add Delete Trigger**
   - Delete button on category header
   - Disable if last of type
   - Show tooltip explaining why

### Service Layer

```typescript
// src/lib/server/modules/category/service.ts
export async function deleteCategory(
  categoryId: string,
  budgetId: string,
): Promise<void> {
  // Get category
  const category = await db.query.categories.findFirst({
    where: eq(categories.id, categoryId),
  })

  if (!category) {
    throw new Error('Category not found')
  }

  // Check if last of its type
  const categoriesOfSameType = await db.query.categories.findMany({
    where: and(
      eq(categories.budgetId, budgetId),
      eq(categories.type, category.type),
    ),
  })

  if (categoriesOfSameType.length <= 1) {
    const error: any = new Error(`Cannot delete last ${category.type} category`)
    error.code =
      category.type === 'income'
        ? 'CANNOT_DELETE_LAST_INCOME_CATEGORY'
        : 'CANNOT_DELETE_LAST_EXPENSE_CATEGORY'
    throw error
  }

  // Delete category (cascades to transactions)
  await db.delete(categories).where(eq(categories.id, categoryId))
}
```

### UI Components

```svelte
<!-- src/lib/components/category/DeleteCategoryModal.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms'
  import type { Category } from '$lib/server/db/schema/categories'

  let {
    category,
    transactionCount,
    isLastOfType,
    show,
    onClose,
  }: {
    category: Category
    transactionCount: number
    isLastOfType: boolean
    show: boolean
    onClose: () => void
  } = $props()

  let isDeleting = $state(false)
</script>

{#if show}
  <div class="modal-overlay" onclick={onClose}>
    <div class="modal danger" onclick={(e) => e.stopPropagation()}>
      <div class="modal-icon">⚠️</div>
      <h2>Delete Category?</h2>

      {#if isLastOfType}
        <div class="error-message">
          <p>
            This is the last {category.type} category in your budget. You must have
            at least one {category.type} category.
          </p>
          <button class="btn-primary" onclick={onClose}> Got it </button>
        </div>
      {:else}
        <p>
          Are you sure you want to delete <strong>{category.name}</strong>?
        </p>

        <div class="info-box danger">
          <p><strong>This action cannot be undone.</strong></p>
          <p>This will permanently delete:</p>
          <ul>
            <li>The category</li>
            <li>
              {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
            </li>
          </ul>
        </div>

        <form
          method="POST"
          action="?/deleteCategory"
          use:enhance={() => {
            isDeleting = true
            return async ({ result, update }) => {
              await update()
              if (result.type === 'success') {
                onClose()
              }
              isDeleting = false
            }
          }}
        >
          <input type="hidden" name="categoryId" value={category.id} />

          <div class="modal-actions">
            <button
              type="button"
              class="btn-secondary"
              onclick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button type="submit" class="btn-danger" disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Yes, Delete Category'}
            </button>
          </div>
        </form>
      {/if}
    </div>
  </div>
{/if}
```

---

## Validation & Business Rules

- **BR-8**: Cannot delete last income category
- **BR-9**: Cannot delete last expense category
- **BR-23**: Deleting category cascades to transactions
- Confirmation required
- Transaction count shown in warning

---

## Testing Checklist

- [ ] Unit tests for delete with validation
- [ ] Integration test for delete flow
- [ ] Manual testing checklist:
  - [ ] Can delete category with transactions
  - [ ] Cannot delete last income category
  - [ ] Cannot delete last expense category
  - [ ] Confirmation shows transaction count
  - [ ] Transactions deleted with category
  - [ ] Success message shown
  - [ ] Category removed from board

---

## Dependencies

- Depends on: US-3.1 (Create Category)
- Blocks: None

---

## Notes

- Consider soft delete for recovery
- Could offer "move transactions" before deletion
- Add category archive as alternative
