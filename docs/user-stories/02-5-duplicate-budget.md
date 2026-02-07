# [US-2.5] Duplicate Budget

**Epic:** Budget Management
**Priority:** P0 (MVP Critical)
**Story Points:** 3
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** duplicate an existing budget,
**So that** I can quickly create next month's budget without starting from scratch.

---

## Description

Implement budget duplication functionality that copies all categories and transactions from an existing budget to a new one. This is essential for month-to-month planning where most expenses remain similar. All transaction amounts and details are copied, but `isPaid` flags are reset to false.

---

## Acceptance Criteria

- [ ] Duplicate button available on budget detail page and list
- [ ] Duplication modal prompts for new budget name and type
- [ ] For monthly: select new month/year
- [ ] For scenario: enter new name
- [ ] All categories copied with same properties (name, color, icon, order, targetPercentage)
- [ ] All transactions copied with same properties (title, amount, currency, note, order)
- [ ] All `isPaid` flags reset to false in duplicated budget
- [ ] All IDs are new (not copied from source)
- [ ] Order preserved for categories and transactions
- [ ] Success message shown with link to new budget
- [ ] User redirected to new budget

---

## Technical Implementation

### Files to Modify/Create

- `src/routes/(app)/budgets/[id]/+page.svelte` - Add duplicate button
- `src/routes/(app)/budgets/[id]/+page.server.ts` - Add duplicate action
- `src/lib/server/modules/budget/service.ts` - Duplicate budget logic
- `src/lib/components/budget/DuplicateBudgetModal.svelte` - Duplication modal

### Implementation Steps

1. **Implement Duplicate Logic**
   - Fetch source budget with all categories and transactions
   - Create new budget with new name/type/month/year
   - For each category: create new with new ID, copy properties
   - For each transaction: create new with new ID, copy properties, reset isPaid
   - Use database transaction for atomicity

2. **Create Duplication Modal**
   - Show source budget name
   - Prompt for new budget details (name, type, month/year)
   - Validate new budget doesn't conflict (monthly uniqueness)
   - Show progress indicator during duplication
   - Show success/error messages

3. **Add UI Trigger Points**
   - Add "Duplicate" button to budget detail page header
   - Add "Duplicate" action to budget card in list
   - Handle optimistic UI updates

### Service Layer

```typescript
// src/lib/server/modules/budget/service.ts
import { db } from '$lib/server/db'
import { budgets, categories, transactions } from '$lib/server/db/schema'

export async function duplicateBudget(
  sourceBudgetId: string,
  userId: string,
  newBudgetData: {
    name: string
    type: 'monthly' | 'scenario'
    month?: number
    year?: number
  },
): Promise<Budget> {
  // Fetch source budget with all details
  const sourceBudget = await getBudgetWithDetails(sourceBudgetId, userId)
  if (!sourceBudget) {
    throw new Error('Source budget not found')
  }

  // Start transaction
  return await db.transaction(async (tx) => {
    // Create new budget
    const [newBudget] = await tx
      .insert(budgets)
      .values({
        userId,
        name: newBudgetData.name,
        type: newBudgetData.type,
        month: newBudgetData.month || null,
        year: newBudgetData.year || null,
      })
      .returning()

    // Duplicate categories
    for (const sourceCategory of sourceBudget.categories) {
      const [newCategory] = await tx
        .insert(categories)
        .values({
          budgetId: newBudget.id,
          name: sourceCategory.name,
          type: sourceCategory.type,
          color: sourceCategory.color,
          icon: sourceCategory.icon,
          order: sourceCategory.order,
          targetPercentage: sourceCategory.targetPercentage,
        })
        .returning()

      // Duplicate transactions
      const transactionValues = sourceCategory.transactions.map((t) => ({
        categoryId: newCategory.id,
        title: t.title,
        amount: t.amount,
        currency: t.currency,
        isPaid: false, // Reset isPaid flag
        note: t.note,
        order: t.order,
      }))

      if (transactionValues.length > 0) {
        await tx.insert(transactions).values(transactionValues)
      }
    }

    return newBudget
  })
}
```

### UI Components

```svelte
<!-- src/lib/components/budget/DuplicateBudgetModal.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms'
  import { superForm } from 'sveltekit-superforms/client'
  import type { Budget } from '$lib/server/db/schema/budgets'

  let {
    budget,
    show,
    onClose,
  }: {
    budget: Budget
    show: boolean
    onClose: () => void
  } = $props()

  let { form, errors, enhance: formEnhance } = superForm(data.form)

  let budgetType = $state<'monthly' | 'scenario'>('monthly')

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  $effect(() => {
    if (budget.type === 'monthly' && budget.month && budget.year) {
      // Suggest next month
      const nextMonth = budget.month === 12 ? 1 : budget.month + 1
      const nextYear = budget.month === 12 ? budget.year + 1 : budget.year
      $form.month = nextMonth
      $form.year = nextYear
    }
  })
</script>

{#if show}
  <div class="modal-overlay" onclick={onClose}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <h2>Duplicate Budget</h2>
      <p class="subtitle">Creating a copy of: <strong>{budget.name}</strong></p>

      <form
        method="POST"
        action="?/duplicate"
        use:formEnhance={() => {
          return async ({ result, update }) => {
            if (result.type === 'redirect') {
              // Let SvelteKit handle redirect
            } else {
              await update()
            }
          }
        }}
      >
        <input type="hidden" name="sourceBudgetId" value={budget.id} />

        <div class="type-selector">
          <label>
            <input
              type="radio"
              name="type"
              value="monthly"
              bind:group={budgetType}
            />
            Monthly Budget
          </label>
          <label>
            <input
              type="radio"
              name="type"
              value="scenario"
              bind:group={budgetType}
            />
            Scenario Budget
          </label>
        </div>

        {#if budgetType === 'monthly'}
          <label>
            Month
            <select name="month" bind:value={$form.month}>
              {#each Array(12) as _, i}
                <option value={i + 1}>
                  {new Date(2000, i).toLocaleString('en', { month: 'long' })}
                </option>
              {/each}
            </select>
          </label>

          <label>
            Year
            <input
              type="number"
              name="year"
              bind:value={$form.year}
              min="2000"
            />
          </label>
        {:else}
          <label>
            New Budget Name
            <input
              type="text"
              name="name"
              bind:value={$form.name}
              placeholder="e.g., {budget.name} - Copy"
            />
          </label>
        {/if}

        {#if $errors._errors}
          <div class="error">{$errors._errors}</div>
        {/if}

        <div class="info-box">
          <p>This will copy:</p>
          <ul>
            <li>All categories (with colors, icons, and targets)</li>
            <li>All transactions (with amounts and currencies)</li>
            <li>All transaction notes</li>
          </ul>
          <p>
            <strong>Note:</strong> All transactions will be marked as unpaid.
          </p>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick={onClose}>
            Cancel
          </button>
          <button type="submit" class="btn-primary"> Duplicate Budget </button>
        </div>
      </form>
    </div>
  </div>
{/if}
```

```typescript
// src/routes/(app)/budgets/[id]/+page.server.ts (duplicate action)
export const actions: Actions = {
  duplicate: async ({ params, request, locals }) => {
    const user = locals.session?.user
    if (!user) return fail(401, { message: 'Unauthorized' })

    const formData = await request.formData()
    const type = formData.get('type') as 'monthly' | 'scenario'

    const data = {
      name: formData.get('name') as string,
      type,
      month: type === 'monthly' ? Number(formData.get('month')) : undefined,
      year: type === 'monthly' ? Number(formData.get('year')) : undefined,
    }

    // Validate
    const schema =
      type === 'monthly'
        ? z.object({
            type: z.literal('monthly'),
            month: z.number().min(1).max(12),
            year: z.number().min(2000),
          })
        : z.object({
            type: z.literal('scenario'),
            name: z.string().min(1).max(200),
          })

    const result = schema.safeParse(data)
    if (!result.success) {
      return fail(400, { errors: result.error.flatten() })
    }

    try {
      const newBudget = await budgetService.duplicateBudget(
        params.id,
        user.id,
        data,
      )

      redirect(303, `/budgets/${newBudget.id}`)
    } catch (error) {
      if (error.code === 'DUPLICATE_MONTHLY_BUDGET') {
        return fail(409, { message: 'Budget for this month already exists' })
      }
      throw error
    }
  },
}
```

---

## Validation & Business Rules

- Source budget must exist and belong to user
- New budget must meet same validation as create
- Monthly budget uniqueness enforced (BR-1)
- All `isPaid` flags reset to false
- Order preserved during duplication
- Database transaction ensures atomicity

---

## Testing Checklist

- [ ] Unit tests for duplicate budget service
- [ ] Unit tests for transaction handling
- [ ] Integration test for complete duplication flow
- [ ] Manual testing checklist:
  - [ ] Duplicate button available and working
  - [ ] Modal shows source budget name
  - [ ] Can duplicate to monthly budget
  - [ ] Can duplicate to scenario budget
  - [ ] All categories copied correctly
  - [ ] All transactions copied correctly
  - [ ] isPaid flags reset to false
  - [ ] Order preserved
  - [ ] New IDs generated
  - [ ] Redirects to new budget
  - [ ] Success message shown
  - [ ] Duplicate monthly budget validation works

---

## Dependencies

- Depends on: US-2.1 (Create Monthly Budget), US-2.2 (Create Scenario Budget), US-2.4 (View Budget Details)
- Blocks: None

---

## Notes

- Consider adding option to selectively copy categories/transactions
- Could add "smart" suggestions for next month/year
- Consider batch duplication (create multiple months at once)
- Add confirmation if source budget has many transactions
- Future: Allow duplication from template library
