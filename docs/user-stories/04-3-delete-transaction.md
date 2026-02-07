# [US-4.3] Delete Transaction

**Epic:** Transaction Management
**Priority:** P0 (MVP Critical)
**Story Points:** 1
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** delete a transaction,
**So that** I can remove incorrect or unnecessary entries from my budget.

---

## Description

Implement transaction deletion with confirmation. Deleting a transaction updates category and budget totals immediately. This is a simpler operation than category deletion as there are no cascade concerns.

---

## Acceptance Criteria

- [ ] Delete button available on transaction card
- [ ] Confirmation dialog shown (optional, can be quick)
- [ ] Transaction removed from UI immediately
- [ ] Budget calculations update in real-time
- [ ] Success feedback shown
- [ ] No undo functionality (can be added later)

---

## Technical Implementation

### Files to Modify/Create

- `src/routes/(app)/budgets/[id]/+page.server.ts` - Add deleteTransaction action
- `src/lib/server/modules/transaction/service.ts` - Delete logic
- `src/lib/components/transaction/TransactionCard.svelte` - Delete button

### Service Layer

```typescript
// src/lib/server/modules/transaction/service.ts
export async function deleteTransaction(transactionId: string): Promise<void> {
  await db.delete(transactions).where(eq(transactions.id, transactionId))
}
```

### UI Components

```svelte
<!-- In TransactionCard.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms'
  import type { Transaction } from '$lib/server/db/schema/transactions'

  let { transaction }: { transaction: Transaction } = $props()

  let showDeleteConfirm = $state(false)
  let isDeleting = $state(false)
</script>

<div class="transaction-card">
  <div class="transaction-content">
    <h4>{transaction.title}</h4>
    <p class="amount">{transaction.amount} {transaction.currency}</p>
    {#if transaction.isPaid}
      <span class="paid-badge">✓ Paid</span>
    {/if}
  </div>

  <div class="transaction-actions">
    <button class="btn-icon" onclick={() => (showDeleteConfirm = true)}>
      🗑️
    </button>
  </div>

  {#if showDeleteConfirm}
    <div class="delete-confirm">
      <p>Delete this transaction?</p>
      <form
        method="POST"
        action="?/deleteTransaction"
        use:enhance={() => {
          isDeleting = true
          return async ({ update }) => {
            await update()
            isDeleting = false
          }
        }}
      >
        <input type="hidden" name="transactionId" value={transaction.id} />
        <button type="button" onclick={() => (showDeleteConfirm = false)}
          >Cancel</button
        >
        <button type="submit" class="btn-danger" disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </form>
    </div>
  {/if}
</div>
```

---

## Validation & Business Rules

- No special validation required
- Simple deletion with no cascades
- Authorization check (user owns budget)

---

## Testing Checklist

- [ ] Unit tests for delete transaction service
- [ ] Integration test for delete flow
- [ ] Manual testing checklist:
  - [ ] Delete button works
  - [ ] Confirmation shows
  - [ ] Transaction deleted from database
  - [ ] UI updates immediately
  - [ ] Budget calculations update
  - [ ] Cannot delete other users' transactions

---

## Dependencies

- Depends on: US-4.1 (Create Transaction)
- Blocks: None

---

## Notes

- Consider bulk delete in future
- Add undo functionality (soft delete)
- Track deletion in audit log
