# [US-2.1] Create Monthly Budget

**Epic:** Budget Management
**Priority:** P0 (MVP Critical)
**Story Points:** 3
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** create a monthly budget for a specific month/year,
**So that** I can plan my finances for that period.

---

## Description

Implement the ability to create a new monthly budget for a specific month and year. The system should automatically generate a budget name (e.g., "January 2026"), prevent duplicate monthly budgets, and auto-create default income and expense categories.

---

## Acceptance Criteria

- [ ] Budget creation form requires month (1-12) and year (>= 2000)
- [ ] System auto-generates name (e.g., "January 2026")
- [ ] System prevents duplicate monthly budgets for same month/year
- [ ] System auto-creates default "Income" category (type: income)
- [ ] System auto-creates default "Expenses" category (type: expense)
- [ ] Success message shown after creation
- [ ] User redirected to newly created budget detail page
- [ ] Budget visible in budget list

---

## Technical Implementation

### Files to Modify/Create

- `src/routes/(app)/budgets/+page.svelte` - Budget list with create button
- `src/routes/(app)/budgets/+page.server.ts` - Create budget action
- `src/lib/server/modules/budget/service.ts` - Budget creation logic
- `src/lib/server/modules/budget/repository.ts` - Database queries
- `src/lib/server/modules/category/service.ts` - Default category creation
- `src/lib/server/db/schema/budgets.ts` - Budget schema
- `src/lib/server/db/schema/categories.ts` - Category schema
- `src/lib/components/budget/CreateBudgetModal.svelte` - Create modal UI

### Implementation Steps

1. **Create Database Schemas**
   - Define budgets table with unique constraint on (userId, month, year)
   - Define categories table with foreign key to budgets

2. **Create Budget Service**
   - Function to check for existing monthly budget
   - Function to generate budget name from month/year
   - Function to create budget with default categories
   - Wrap in database transaction

3. **Create Budget List Page**
   - Display all user's budgets
   - "Create Budget" button opens modal
   - Filter by type (monthly/scenario) and year

4. **Implement Create Budget Modal**
   - Form with month/year selectors
   - Type selector (monthly/scenario)
   - Submit button

5. **Implement Create Action**
   - Validate input (Zod schema)
   - Check for duplicate monthly budget
   - Create budget record
   - Create default categories
   - Redirect to budget detail page

### Service Layer

```typescript
// src/lib/server/modules/budget/service.ts
export async function createMonthlyBudget(
  userId: string,
  data: { month: number; year: number },
): Promise<Budget> {
  // Check for existing budget (BR-1)
  const existing = await budgetRepository.findMonthlyBudget(
    userId,
    data.month,
    data.year,
  )

  if (existing) {
    throw new Error('DUPLICATE_MONTHLY_BUDGET')
  }

  // Generate name
  const name = generateBudgetName(data.month, data.year) // "January 2026"

  // Create budget with default categories in transaction
  return await db.transaction(async (tx) => {
    const budget = await budgetRepository.create(tx, {
      userId,
      name,
      type: 'monthly',
      month: data.month,
      year: data.year,
    })

    // Create default categories
    await categoryRepository.create(tx, {
      budgetId: budget.id,
      name: 'Income',
      type: 'income',
      order: 0,
    })

    await categoryRepository.create(tx, {
      budgetId: budget.id,
      name: 'Expenses',
      type: 'expense',
      order: 1,
    })

    return budget
  })
}

function generateBudgetName(month: number, year: number): string {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  return `${monthNames[month - 1]} ${year}`
}
```

### UI Components

```svelte
<!-- src/lib/components/budget/CreateBudgetModal.svelte -->
<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client'

  let { open = $bindable(false) } = $props()

  const currentDate = new Date()
  const { form, errors, enhance } = superForm({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    type: 'monthly',
  })
</script>

{#if open}
  <dialog>
    <form method="POST" action="?/create" use:enhance>
      <h2>Create Budget</h2>

      <label>
        Type
        <select name="type" bind:value={$form.type}>
          <option value="monthly">Monthly Budget</option>
          <option value="scenario">Scenario Budget</option>
        </select>
      </label>

      {#if $form.type === 'monthly'}
        <label>
          Month
          <select name="month" bind:value={$form.month}>
            {#each Array(12) as _, i}
              <option value={i + 1}
                >{new Date(2000, i).toLocaleString('default', {
                  month: 'long',
                })}</option
              >
            {/each}
          </select>
        </label>

        <label>
          Year
          <input type="number" name="year" bind:value={$form.year} min="2000" />
        </label>
      {:else}
        <label>
          Name
          <input
            type="text"
            name="name"
            placeholder="e.g., If I get promoted"
          />
        </label>
      {/if}

      <button type="submit">Create Budget</button>
      <button type="button" onclick={() => (open = false)}>Cancel</button>
    </form>
  </dialog>
{/if}
```

---

## Validation & Business Rules

- **BR-1**: User can only have one monthly budget per month/year
- **BR-3**: Budget must have at least 1 income category
- **BR-4**: Budget must have at least 1 expense category
- **BR-7**: Budget name is required

---

## Testing Checklist

- [ ] Unit tests for budget creation service
- [ ] Unit tests for duplicate detection
- [ ] Integration test for end-to-end flow
- [ ] Manual testing checklist:
  - [ ] Can create monthly budget for current month
  - [ ] Cannot create duplicate monthly budget
  - [ ] Default categories are created
  - [ ] Budget name is auto-generated correctly
  - [ ] Redirects to budget detail page
  - [ ] Budget appears in budget list

---

## Dependencies

- Depends on: US-1.1 (User Registration)
- Blocks: US-2.4 (View Budget Details), US-3.1 (Create Category)

---

## Notes

- Budget name should be localized based on user's locale setting
- Consider adding fiscal year support in future
- Default categories should use user's primary color scheme
