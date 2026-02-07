# [US-4.5] Move Transaction Between Categories

**Epic:** Transaction Management
**Priority:** P0 (MVP Critical)
**Story Points:** 2
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** drag a transaction to a different category,
**So that** I can reorganize my budget when I realize a transaction belongs elsewhere.

---

## Description

Implement drag-and-drop functionality for moving transactions between categories. This complements the Trello-like interface, allowing users to easily reclassify transactions by dragging them to different category columns.

---

## Acceptance Criteria

- [ ] Can drag transaction from one category to another
- [ ] Visual feedback during drag
- [ ] Drop updates transaction's categoryId
- [ ] Transaction order resets to end of new category
- [ ] Budget calculations update immediately
- [ ] Optimistic UI update
- [ ] Rollback on error
- [ ] Works on touch devices

---

## Technical Implementation

### Files to Modify/Create

- `src/routes/(app)/budgets/[id]/+page.server.ts` - Add moveTransaction action
- `src/lib/server/modules/transaction/service.ts` - Move logic
- `src/lib/components/budget/BudgetBoard.svelte` - Implement cross-category drag
- `src/lib/components/category/CategoryColumn.svelte` - Drop zone logic

### Service Layer

```typescript
// src/lib/server/modules/transaction/service.ts
export async function moveTransaction(
  transactionId: string,
  newCategoryId: string,
): Promise<Transaction> {
  // Get highest order in target category
  const lastTransaction = await db.query.transactions.findFirst({
    where: eq(transactions.categoryId, newCategoryId),
    orderBy: desc(transactions.order),
  })

  const newOrder = (lastTransaction?.order ?? -1) + 1

  // Update transaction
  const [transaction] = await db
    .update(transactions)
    .set({
      categoryId: newCategoryId,
      order: newOrder,
      updatedAt: new Date(),
    })
    .where(eq(transactions.id, transactionId))
    .returning()

  if (!transaction) {
    throw new Error('Transaction not found')
  }

  return transaction
}
```

### UI Components

```svelte
<!-- Enhanced BudgetBoard.svelte with transaction dragging -->
<script lang="ts">
  import {
    DndContext,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
  } from '@dnd-kit/core'
  import type { Budget } from '$lib/server/db/schema/budgets'

  let { budget }: { budget: Budget } = $props()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  async function handleDragEnd(event) {
    const { active, over } = event

    if (!over) return

    // Check if dragging transaction
    const transactionId = active.id
    const targetCategoryId = over.id

    // Find transaction and its current category
    const currentCategory = budget.categories.find((c) =>
      c.transactions.some((t) => t.id === transactionId),
    )

    if (!currentCategory || currentCategory.id === targetCategoryId) return

    // Optimistic update
    const transaction = currentCategory.transactions.find(
      (t) => t.id === transactionId,
    )
    const targetCategory = budget.categories.find(
      (c) => c.id === targetCategoryId,
    )

    if (!transaction || !targetCategory) return

    // Remove from current, add to target
    currentCategory.transactions = currentCategory.transactions.filter(
      (t) => t.id !== transactionId,
    )
    targetCategory.transactions = [...targetCategory.transactions, transaction]

    // Persist to server
    try {
      await fetch('?/moveTransaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          categoryId: targetCategoryId,
        }),
      })
    } catch (error) {
      // Rollback on error
      alert('Failed to move transaction')
      // Re-fetch budget data
      window.location.reload()
    }
  }
</script>

<DndContext
  {sensors}
  collisionDetection={closestCorners}
  onDragEnd={handleDragEnd}
>
  <div class="budget-board">
    {#each budget.categories as category (category.id)}
      <CategoryColumn {category} />
    {/each}
  </div>
</DndContext>
```

```svelte
<!-- Enhanced CategoryColumn.svelte -->
<script lang="ts">
  import { useDroppable } from '@dnd-kit/core'
  import TransactionCard from '../transaction/TransactionCard.svelte'
  import type { Category } from '$lib/server/db/schema/categories'

  let { category }: { category: Category } = $props()

  const { setNodeRef, isOver } = useDroppable({
    id: category.id,
  })
</script>

<div bind:this={setNodeRef} class="category-column" class:drop-target={isOver}>
  <div class="category-header">
    <h3>{category.name}</h3>
  </div>

  <div class="transactions-list">
    {#each category.transactions as transaction (transaction.id)}
      <TransactionCard {transaction} draggable={true} />
    {/each}

    {#if category.transactions.length === 0}
      <div class="empty-category">
        {isOver ? 'Drop here' : 'No transactions yet'}
      </div>
    {/if}
  </div>
</div>

<style>
  .category-column.drop-target {
    background-color: #f0f9ff;
    border: 2px dashed #3b82f6;
  }
</style>
```

---

## Validation & Business Rules

- Transaction can be moved to any category in same budget
- Order recalculated for target category
- Budget must be revalidated after move

---

## Testing Checklist

- [ ] Unit tests for move transaction service
- [ ] Integration test for cross-category drag
- [ ] Manual testing checklist:
  - [ ] Can drag transaction between categories
  - [ ] Visual feedback during drag
  - [ ] categoryId updated correctly
  - [ ] Order recalculated correctly
  - [ ] Budget calculations update
  - [ ] Optimistic update works
  - [ ] Error handling works
  - [ ] Works on touch devices

---

## Dependencies

- Depends on: US-4.1 (Create Transaction), US-3.1 (Create Category), US-8.4 (Drag Transactions Between Categories)
- Blocks: None

---

## Notes

- Consider showing preview of target category
- Add visual feedback for invalid drop targets
- Consider bulk move functionality
- Future: Move with copy (duplicate to new category)
