# [US-4.6] Reorder Transactions

**Epic:** Transaction Management
**Priority:** P0 (MVP Critical)
**Story Points:** 2
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** drag transactions within a category to reorder them,
**So that** I can organize transactions by priority or any order that makes sense to me.

---

## Description

Implement drag-and-drop reordering for transactions within the same category. This allows users to organize their transaction lists in a way that makes sense for their workflow, such as by priority, due date, or importance.

---

## Acceptance Criteria

- [ ] Can drag transactions up/down within same category
- [ ] Visual feedback during drag (placeholder, ghost)
- [ ] Drop updates transaction order
- [ ] Order persists to database
- [ ] Smooth animations
- [ ] Optimistic UI update
- [ ] Works on touch devices
- [ ] Order maintained after page reload

---

## Technical Implementation

### Files to Modify/Create

- `src/routes/(app)/budgets/[id]/+page.server.ts` - Add reorderTransactions action
- `src/lib/server/modules/transaction/service.ts` - Reorder logic
- `src/lib/components/category/CategoryColumn.svelte` - Implement sortable transactions
- `src/lib/components/transaction/TransactionCard.svelte` - Make draggable

### Service Layer

```typescript
// src/lib/server/modules/transaction/service.ts
export async function reorderTransactions(
  transactionIds: string[],
): Promise<void> {
  await db.transaction(async (tx) => {
    for (let i = 0; i < transactionIds.length; i++) {
      await tx
        .update(transactions)
        .set({ order: i, updatedAt: new Date() })
        .where(eq(transactions.id, transactionIds[i]))
    }
  })
}
```

### UI Components

```svelte
<!-- Enhanced CategoryColumn.svelte with sortable transactions -->
<script lang="ts">
  import {
    SortableContext,
    verticalListSortingStrategy,
  } from '@dnd-kit/sortable'
  import SortableTransactionCard from '../transaction/SortableTransactionCard.svelte'
  import type { Category } from '$lib/server/db/schema/categories'

  let { category }: { category: Category } = $props()

  let localTransactions = $state(category.transactions)

  async function handleReorder(transactionIds: string[]) {
    // Optimistic update
    localTransactions = transactionIds.map(
      (id) => localTransactions.find((t) => t.id === id)!,
    )

    // Persist to server
    try {
      await fetch('?/reorderTransactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: category.id,
          transactionIds,
        }),
      })
    } catch (error) {
      // Rollback on error
      localTransactions = category.transactions
      alert('Failed to reorder transactions')
    }
  }
</script>

<div class="category-column">
  <div class="category-header">
    <h3>{category.name}</h3>
  </div>

  <div class="transactions-list">
    <SortableContext
      items={localTransactions.map((t) => t.id)}
      strategy={verticalListSortingStrategy}
    >
      {#each localTransactions as transaction (transaction.id)}
        <SortableTransactionCard {transaction} />
      {/each}
    </SortableContext>

    {#if localTransactions.length === 0}
      <div class="empty-category">No transactions yet</div>
    {/if}

    <button class="add-transaction-btn"> + Add Transaction </button>
  </div>
</div>
```

```svelte
<!-- src/lib/components/transaction/SortableTransactionCard.svelte -->
<script lang="ts">
  import { useSortable } from '@dnd-kit/sortable'
  import { CSS } from '@dnd-kit/utilities'
  import type { Transaction } from '$lib/server/db/schema/transactions'

  let { transaction }: { transaction: Transaction } = $props()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: transaction.id })

  const style = $derived(
    CSS.Transform.toString(transform) +
      (isDragging ? ' opacity: 0.5; cursor: grabbing;' : ' cursor: grab;'),
  )
</script>

<div
  bind:this={setNodeRef}
  style={`${style} ${transition}`}
  class="transaction-card"
  class:dragging={isDragging}
  {...attributes}
  {...listeners}
>
  <div class="drag-handle">⋮⋮</div>

  <div class="transaction-content">
    <h4>{transaction.title}</h4>
    <p class="amount">{transaction.amount} {transaction.currency}</p>
    {#if transaction.isPaid}
      <span class="paid-badge">✓ Paid</span>
    {/if}
  </div>

  <div class="transaction-actions">
    <button
      class="btn-icon"
      onclick={(e) => {
        e.stopPropagation() /* edit */
      }}
    >
      ✏️
    </button>
    <button
      class="btn-icon"
      onclick={(e) => {
        e.stopPropagation() /* delete */
      }}
    >
      🗑️
    </button>
  </div>
</div>

<style>
  .transaction-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .transaction-card.dragging {
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    transform: rotate(2deg);
  }

  .drag-handle {
    cursor: grab;
    color: #9ca3af;
    font-size: 18px;
  }

  .drag-handle:active {
    cursor: grabbing;
  }
</style>
```

---

## Validation & Business Rules

- **BR-17**: Transaction order must be non-negative
- Order is sequential from 0 within each category
- All transactions in category reordered atomically

---

## Testing Checklist

- [ ] Unit tests for reorder service
- [ ] Integration test for drag-and-drop
- [ ] Manual testing checklist:
  - [ ] Can drag transactions up/down
  - [ ] Visual feedback during drag
  - [ ] Order persists to database
  - [ ] Order maintained after reload
  - [ ] Works on touch devices
  - [ ] Smooth animations
  - [ ] Error handling works

---

## Dependencies

- Depends on: US-4.1 (Create Transaction), US-3.1 (Create Category)
- Blocks: US-8.3 (Drag Transactions Within Category)

---

## Notes

- Consider keyboard navigation for accessibility
- Add visual indicators for drag handle
- Consider auto-scroll when dragging near edges
- Future: Save user's preferred order preference
