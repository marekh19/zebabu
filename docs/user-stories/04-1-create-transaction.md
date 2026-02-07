# [US-4.1] Create Transaction

**Epic:** Transaction Management
**Priority:** P0 (MVP Critical)
**Story Points:** 2
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** add a transaction to a category,
**So that** I can track my planned income and expenses.

---

## Description

Implement the ability to create a new transaction within a category. Transactions represent individual line items (e.g., "Rent: 10,000 CZK") and should support multiple currencies, paid/unpaid status, and optional notes.

---

## Acceptance Criteria

- [ ] Can create transaction from budget detail page
- [ ] Transaction has title (required)
- [ ] Transaction has amount (required, > 0)
- [ ] Transaction has currency (required, defaults to user's primary currency)
- [ ] Transaction has isPaid status (boolean, defaults to false)
- [ ] Transaction has optional note field
- [ ] Amount validation enforces positive numbers
- [ ] Currency validation ensures valid ISO 4217 code
- [ ] Transaction appears in category immediately after creation
- [ ] Budget calculations update in real-time

---

## Technical Implementation

### Files to Modify/Create

- `src/routes/(app)/budgets/[id]/+page.svelte` - Budget detail page with transaction forms
- `src/routes/(app)/budgets/[id]/+page.server.ts` - Create transaction action
- `src/lib/server/modules/transaction/service.ts` - Transaction creation logic
- `src/lib/server/modules/transaction/repository.ts` - Database queries
- `src/lib/server/db/schema/transactions.ts` - Transaction schema
- `src/lib/components/transaction/TransactionForm.svelte` - Transaction input form
- `src/lib/components/transaction/TransactionCard.svelte` - Transaction display

### Implementation Steps

1. **Create Transaction Schema**
   - Define transactions table with foreign key to categories
   - Fields: id, categoryId, title, amount, currency, isPaid, note, order, timestamps
   - Add validation constraints (amount > 0)

2. **Create Transaction Service**
   - Function to create transaction
   - Function to validate currency code
   - Auto-assign order (max(order) + 1)

3. **Add Transaction Form to Budget Page**
   - Inline form at bottom of each category column
   - Quick add: title + amount (use defaults for rest)
   - Full form: all fields in modal/expanded view

4. **Implement Create Action**
   - Validate input with Zod schema
   - Create transaction record
   - Return updated category data
   - Use progressive enhancement (works without JS)

5. **Update Budget Calculations**
   - Ensure frontend recalculates totals
   - Display updated balance and allocation percentage

### Service Layer

```typescript
// src/lib/server/modules/transaction/service.ts
import { z } from 'zod'

const transactionSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.number().positive(),
  currency: z.string().regex(/^[A-Z]{3}$/), // ISO 4217
  isPaid: z.boolean().default(false),
  note: z.string().max(1000).optional(),
})

export async function createTransaction(
  categoryId: string,
  data: {
    title: string
    amount: number
    currency: string
    isPaid?: boolean
    note?: string
  },
): Promise<Transaction> {
  // Validate input
  const validated = transactionSchema.parse(data)

  // Get max order for this category
  const maxOrder = await transactionRepository.getMaxOrder(categoryId)

  // Create transaction
  const transaction = await transactionRepository.create({
    categoryId,
    ...validated,
    order: maxOrder + 1,
  })

  return transaction
}
```

### UI Components

```svelte
<!-- src/lib/components/transaction/TransactionForm.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms'

  let { categoryId, defaultCurrency = 'CZK' } = $props<{
    categoryId: string
    defaultCurrency?: string
  }>()

  let title = $state('')
  let amount = $state('')
  let showFullForm = $state(false)
</script>

<form method="POST" action="?/createTransaction" use:enhance>
  <input type="hidden" name="categoryId" value={categoryId} />

  <input
    type="text"
    name="title"
    bind:value={title}
    placeholder="Transaction name"
    required
  />

  <input
    type="number"
    name="amount"
    bind:value={amount}
    placeholder="Amount"
    step="0.01"
    min="0.01"
    required
  />

  {#if showFullForm}
    <select name="currency" value={defaultCurrency}>
      <option value="CZK">CZK</option>
      <option value="EUR">EUR</option>
      <option value="USD">USD</option>
    </select>

    <label>
      <input type="checkbox" name="isPaid" />
      Paid
    </label>

    <textarea name="note" placeholder="Note (optional)"></textarea>
  {/if}

  <button type="button" onclick={() => (showFullForm = !showFullForm)}>
    {showFullForm ? 'Less' : 'More'} options
  </button>

  <button type="submit">Add</button>
</form>
```

---

## Validation & Business Rules

- **BR-14**: Amount must be positive (> 0)
- **BR-15**: Currency must be valid ISO 4217 code
- **BR-16**: Title is required
- **BR-17**: Transaction order must be non-negative

---

## Testing Checklist

- [ ] Unit tests for transaction creation service
- [ ] Unit tests for validation (amount, currency, title)
- [ ] Integration test for creating transaction via action
- [ ] Manual testing checklist:
  - [ ] Can create transaction with title and amount only
  - [ ] Can create transaction with all fields
  - [ ] Invalid amount shows error
  - [ ] Invalid currency shows error
  - [ ] Empty title shows error
  - [ ] Transaction appears in correct category
  - [ ] Budget totals update correctly

---

## Dependencies

- Depends on: US-2.1 (Create Monthly Budget), US-3.1 (Create Category)
- Blocks: US-4.2 (Edit Transaction), US-4.5 (Move Transaction)

---

## Notes

- Consider auto-focus on title field when adding new transaction
- Consider keyboard shortcuts (Enter to add, Escape to cancel)
- Currency dropdown should show user's recent currencies first
- Consider adding transaction templates/recurring transactions in future
