# [US-4.2] Edit Transaction

**Epic:** Transaction Management
**Priority:** P0 (MVP Critical)
**Story Points:** 2
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** edit a transaction's details,
**So that** I can correct mistakes or update amounts as my plans change.

---

## Description

Implement transaction editing functionality allowing users to modify existing transactions. Users should be able to update title, amount, currency, paid status, and notes. Editing should be accessible via modal or inline form.

---

## Acceptance Criteria

- [ ] Click on transaction opens edit modal
- [ ] Modal pre-populated with current values
- [ ] Can edit: title, amount, currency, isPaid, note
- [ ] Changes immediately reflected on board
- [ ] Validation same as create
- [ ] Success feedback after update
- [ ] Optimistic UI updates
- [ ] Budget calculations update in real-time

---

## Technical Implementation

### Files to Modify/Create

- `src/routes/(app)/budgets/[id]/+page.server.ts` - Add updateTransaction action
- `src/lib/server/modules/transaction/service.ts` - Update transaction logic
- `src/lib/components/transaction/EditTransactionModal.svelte` - Edit modal
- `src/lib/components/transaction/TransactionCard.svelte` - Click handler

### Service Layer

```typescript
// src/lib/server/modules/transaction/service.ts
export async function updateTransaction(
  transactionId: string,
  data: {
    title?: string
    amount?: number
    currency?: string
    isPaid?: boolean
    note?: string
  },
): Promise<Transaction> {
  const [transaction] = await db
    .update(transactions)
    .set({
      ...data,
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
<!-- src/lib/components/transaction/EditTransactionModal.svelte -->
<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client'
  import { SUPPORTED_CURRENCIES } from '$lib/constants/currencies'
  import type { Transaction } from '$lib/server/db/schema/transactions'

  let {
    transaction,
    show,
    onClose,
  }: {
    transaction: Transaction
    show: boolean
    onClose: () => void
  } = $props()

  const { form, errors, enhance } = superForm(data.form)

  $effect(() => {
    if (show) {
      $form.title = transaction.title
      $form.amount = Number(transaction.amount)
      $form.currency = transaction.currency
      $form.isPaid = transaction.isPaid
      $form.note = transaction.note || ''
    }
  })
</script>

{#if show}
  <div class="modal-overlay" onclick={onClose}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <h2>Edit Transaction</h2>

      <form
        method="POST"
        action="?/updateTransaction"
        use:enhance={() => {
          return async ({ result, update }) => {
            if (result.type === 'success') onClose()
            await update()
          }
        }}
      >
        <input type="hidden" name="transactionId" value={transaction.id} />

        <label>
          Title *
          <input type="text" name="title" bind:value={$form.title} required />
        </label>
        {#if $errors.title}<span class="error">{$errors.title}</span>{/if}

        <div class="form-row">
          <div class="form-col">
            <label>
              Amount *
              <input
                type="number"
                name="amount"
                bind:value={$form.amount}
                min="0"
                step="0.01"
                required
              />
            </label>
            {#if $errors.amount}<span class="error">{$errors.amount}</span>{/if}
          </div>

          <div class="form-col">
            <label>
              Currency
              <select name="currency" bind:value={$form.currency}>
                {#each SUPPORTED_CURRENCIES as currency}
                  <option value={currency.code}>{currency.code}</option>
                {/each}
              </select>
            </label>
          </div>
        </div>

        <label>
          <input type="checkbox" name="isPaid" bind:checked={$form.isPaid} />
          Mark as paid
        </label>

        <label>
          Note
          <textarea
            name="note"
            bind:value={$form.note}
            rows="3"
            placeholder="Optional notes"
          ></textarea>
        </label>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick={onClose}
            >Cancel</button
          >
          <button type="submit" class="btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  </div>
{/if}
```

---

## Validation & Business Rules

- Same validation as create (BR-14, BR-15, BR-16)
- Amount must be positive
- Currency must be valid ISO 4217
- Title required

---

## Testing Checklist

- [ ] Unit tests for update transaction service
- [ ] Integration test for edit flow
- [ ] Manual testing checklist:
  - [ ] Click transaction opens edit modal
  - [ ] Modal shows current values
  - [ ] Can edit all fields
  - [ ] Changes saved correctly
  - [ ] Budget calculations update
  - [ ] Validation works

---

## Dependencies

- Depends on: US-4.1 (Create Transaction)
- Blocks: None

---

## Notes

- Consider inline editing for quick updates
- Add keyboard shortcuts (Esc to close, Enter to save)
- Track edit history in future
