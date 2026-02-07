# [US-4.4] Mark Transaction as Paid/Unpaid

**Epic:** Transaction Management
**Priority:** P0 (MVP Critical)
**Story Points:** 1
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** mark transactions as paid or unpaid,
**So that** I can track which budget items have been actually spent.

---

## Description

Implement quick toggle functionality for marking transactions as paid/unpaid. This is a frequently used feature that should be fast and accessible, allowing users to track actual spending against their budget plan.

---

## Acceptance Criteria

- [ ] Checkbox or toggle button on transaction card
- [ ] Click toggles paid status immediately
- [ ] Visual distinction between paid/unpaid (checkmark, strikethrough, color)
- [ ] Optimistic UI update
- [ ] Rollback on error
- [ ] Show count of paid vs total transactions per category
- [ ] Works from transaction list and detail views

---

## Technical Implementation

### Files to Modify/Create

- `src/routes/(app)/budgets/[id]/+page.server.ts` - Add togglePaid action
- `src/lib/server/modules/transaction/service.ts` - Toggle logic
- `src/lib/components/transaction/TransactionCard.svelte` - Add checkbox
- `src/lib/components/category/CategorySummary.svelte` - Show paid count

### Service Layer

```typescript
// src/lib/server/modules/transaction/service.ts
export async function toggleTransactionPaid(
  transactionId: string,
  isPaid: boolean,
): Promise<Transaction> {
  const [transaction] = await db
    .update(transactions)
    .set({
      isPaid,
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
<!-- In TransactionCard.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms'
  import type { Transaction } from '$lib/server/db/schema/transactions'

  let { transaction }: { transaction: Transaction } = $props()

  let isPaidOptimistic = $state(transaction.isPaid)

  async function handleTogglePaid() {
    const previousState = isPaidOptimistic
    isPaidOptimistic = !isPaidOptimistic

    try {
      const response = await fetch('?/togglePaid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: transaction.id,
          isPaid: isPaidOptimistic,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update')
      }
    } catch (error) {
      // Rollback on error
      isPaidOptimistic = previousState
      alert('Failed to update transaction')
    }
  }
</script>

<div class="transaction-card" class:paid={isPaidOptimistic}>
  <label class="paid-checkbox">
    <input
      type="checkbox"
      checked={isPaidOptimistic}
      onchange={handleTogglePaid}
    />
    <span class="checkmark"></span>
  </label>

  <div class="transaction-content">
    <h4 class:strikethrough={isPaidOptimistic}>
      {transaction.title}
    </h4>
    <p class="amount">{transaction.amount} {transaction.currency}</p>
    {#if transaction.note}
      <p class="note">{transaction.note}</p>
    {/if}
  </div>

  <div class="transaction-actions">
    <button class="btn-icon" onclick={openEditModal}>✏️</button>
    <button class="btn-icon" onclick={openDeleteConfirm}>🗑️</button>
  </div>
</div>

<style>
  .transaction-card.paid {
    opacity: 0.7;
    background-color: #f0fdf4;
  }

  .strikethrough {
    text-decoration: line-through;
    color: #6b7280;
  }

  .paid-checkbox {
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .checkmark {
    width: 20px;
    height: 20px;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  input[type='checkbox']:checked + .checkmark {
    background-color: #10b981;
    border-color: #10b981;
  }

  input[type='checkbox']:checked + .checkmark::after {
    content: '✓';
    color: white;
    font-weight: bold;
  }
</style>
```

```svelte
<!-- In CategorySummary.svelte -->
<script lang="ts">
  import type { Category } from '$lib/server/db/schema/categories'

  let { category }: { category: Category } = $props()

  const paidCount = $derived(
    category.transactions.filter((t) => t.isPaid).length,
  )

  const totalCount = $derived(category.transactions.length)
</script>

<div class="category-summary">
  <div class="paid-status">
    <span class="icon">✓</span>
    <span>{paidCount} / {totalCount} paid</span>
  </div>
</div>
```

---

## Validation & Business Rules

- isPaid is boolean (true/false)
- No other validation required
- Quick toggle operation

---

## Testing Checklist

- [ ] Unit tests for toggle paid service
- [ ] Integration test for toggle flow
- [ ] Manual testing checklist:
  - [ ] Checkbox toggles paid status
  - [ ] Visual feedback immediate
  - [ ] Status persists to database
  - [ ] Paid count updates in category
  - [ ] Optimistic update works
  - [ ] Rollback on error works
  - [ ] Works for multiple quick toggles

---

## Dependencies

- Depends on: US-4.1 (Create Transaction)
- Blocks: None

---

## Notes

- Consider keyboard shortcut for quick toggle
- Add bulk "mark all as paid" feature
- Show paid percentage in category header
- Future: Track payment date
