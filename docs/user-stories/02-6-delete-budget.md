# [US-2.6] Delete Budget

**Epic:** Budget Management
**Priority:** P0 (MVP Critical)
**Story Points:** 1
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** delete a budget I no longer need,
**So that** I can keep my budget list clean and organized.

---

## Description

Implement budget deletion functionality with confirmation dialog. Deleting a budget cascades to all associated categories and transactions. This is a destructive operation that requires user confirmation.

---

## Acceptance Criteria

- [ ] Delete button available on budget list and detail pages
- [ ] Confirmation dialog shown before deletion
- [ ] Confirmation shows budget name and warning about cascade
- [ ] Successful deletion removes budget and all associated data
- [ ] User redirected to budget list after deletion
- [ ] Success message shown after deletion
- [ ] Cannot delete other users' budgets
- [ ] Database cascades deletion to categories and transactions

---

## Technical Implementation

### Files to Modify/Create

- `src/routes/(app)/budgets/+page.server.ts` - Add delete action
- `src/routes/(app)/budgets/[id]/+page.server.ts` - Add delete action
- `src/lib/server/modules/budget/service.ts` - Delete budget logic
- `src/lib/components/budget/DeleteBudgetModal.svelte` - Confirmation modal

### Implementation Steps

1. **Implement Delete Service**
   - Verify budget exists and user has access
   - Delete budget (cascades to categories and transactions via DB constraint)
   - Return success

2. **Create Confirmation Modal**
   - Show budget name
   - Explain cascade deletion
   - Require explicit confirmation
   - Disable button during deletion

3. **Add Delete Actions**
   - In budget list page
   - In budget detail page
   - Handle redirects appropriately

### Service Layer

```typescript
// src/lib/server/modules/budget/service.ts
import { db } from '$lib/server/db'
import { budgets } from '$lib/server/db/schema/budgets'
import { eq, and } from 'drizzle-orm'

export async function deleteBudget(
  budgetId: string,
  userId: string,
): Promise<void> {
  const budget = await db.query.budgets.findFirst({
    where: and(eq(budgets.id, budgetId), eq(budgets.userId, userId)),
  })

  if (!budget) {
    throw new Error('Budget not found')
  }

  // Delete budget (cascades to categories and transactions)
  await db.delete(budgets).where(eq(budgets.id, budgetId))
}
```

### UI Components

```svelte
<!-- src/lib/components/budget/DeleteBudgetModal.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms'
  import type { Budget } from '$lib/server/db/schema/budgets'

  let {
    budget,
    show,
    onClose,
    redirectAfter = '/budgets',
  }: {
    budget: Budget
    show: boolean
    onClose: () => void
    redirectAfter?: string
  } = $props()

  let isDeleting = $state(false)
</script>

{#if show}
  <div class="modal-overlay" onclick={onClose}>
    <div class="modal danger" onclick={(e) => e.stopPropagation()}>
      <div class="modal-icon">⚠️</div>
      <h2>Delete Budget?</h2>

      <p class="warning-text">
        Are you sure you want to delete <strong>{budget.name}</strong>?
      </p>

      <div class="info-box danger">
        <p><strong>This action cannot be undone.</strong></p>
        <p>This will permanently delete:</p>
        <ul>
          <li>The budget</li>
          <li>All categories</li>
          <li>All transactions</li>
        </ul>
      </div>

      <form
        method="POST"
        action="?/delete"
        use:enhance={() => {
          isDeleting = true
          return async ({ result, update }) => {
            await update()
            isDeleting = false
            if (result.type === 'redirect') {
              // SvelteKit will handle redirect
            }
          }
        }}
      >
        <input type="hidden" name="budgetId" value={budget.id} />

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
            {isDeleting ? 'Deleting...' : 'Yes, Delete Budget'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
```

```typescript
// src/routes/(app)/budgets/+page.server.ts (delete action)
export const actions: Actions = {
  delete: async ({ request, locals }) => {
    const user = locals.session?.user
    if (!user) return fail(401, { message: 'Unauthorized' })

    const formData = await request.formData()
    const budgetId = formData.get('budgetId') as string

    if (!budgetId) {
      return fail(400, { message: 'Budget ID required' })
    }

    try {
      await budgetService.deleteBudget(budgetId, user.id)
      return { success: true, message: 'Budget deleted successfully' }
    } catch (error) {
      if (error.message === 'Budget not found') {
        return fail(404, { message: 'Budget not found' })
      }
      throw error
    }
  },
}
```

```typescript
// src/routes/(app)/budgets/[id]/+page.server.ts (delete action with redirect)
export const actions: Actions = {
  delete: async ({ params, locals }) => {
    const user = locals.session?.user
    if (!user) return fail(401, { message: 'Unauthorized' })

    try {
      await budgetService.deleteBudget(params.id, user.id)
      redirect(303, '/budgets?message=Budget deleted successfully')
    } catch (error) {
      if (error.message === 'Budget not found') {
        return fail(404, { message: 'Budget not found' })
      }
      throw error
    }
  },
}
```

---

## Validation & Business Rules

- **BR-22**: Deleting budget cascades to categories and transactions (database constraint)
- User can only delete their own budgets
- Confirmation required before deletion
- Operation is irreversible

---

## Testing Checklist

- [ ] Unit tests for delete budget service
- [ ] Unit tests for authorization
- [ ] Integration test for delete flow
- [ ] Manual testing checklist:
  - [ ] Delete button available
  - [ ] Confirmation modal shows
  - [ ] Can cancel deletion
  - [ ] Deletion removes budget from database
  - [ ] Deletion cascades to categories
  - [ ] Deletion cascades to transactions
  - [ ] Redirects to budget list after deletion
  - [ ] Success message shown
  - [ ] Cannot delete other users' budgets
  - [ ] 404 error for invalid budget ID

---

## Dependencies

- Depends on: US-2.1 (Create Monthly Budget), US-2.3 (List Budgets)
- Blocks: None

---

## Notes

- Consider soft delete for data recovery (future enhancement)
- Could add "Archive" as alternative to deletion
- Consider export option before deletion
- Add rate limiting to prevent abuse
- Consider requiring password confirmation for extra security
