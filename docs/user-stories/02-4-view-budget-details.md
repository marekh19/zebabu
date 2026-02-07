# [US-2.4] View Budget Details

**Epic:** Budget Management
**Priority:** P0 (MVP Critical)
**Story Points:** 2
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** view the full details of a specific budget,
**So that** I can see all categories, transactions, and budget calculations.

---

## Description

Implement the budget detail page that displays the complete budget with all categories and transactions in a Trello-like board layout. This is the main working view where users spend most of their time managing budgets.

---

## Acceptance Criteria

- [ ] Budget detail accessible at `/budgets/[id]`
- [ ] Page shows budget name and type
- [ ] All categories displayed as columns
- [ ] All transactions displayed as cards within categories
- [ ] Budget summary shown (total income, expenses, balance)
- [ ] Real-time calculations update as data changes
- [ ] Loading state while fetching data
- [ ] 404 error for invalid budget ID
- [ ] Authorization check (user owns budget)

---

## Technical Implementation

### Files to Modify/Create

- `src/routes/(app)/budgets/[id]/+page.svelte` - Budget detail UI
- `src/routes/(app)/budgets/[id]/+page.server.ts` - Load budget data
- `src/lib/server/modules/budget/service.ts` - Get budget with details
- `src/lib/components/budget/BudgetBoard.svelte` - Trello-like board layout
- `src/lib/components/budget/BudgetSummary.svelte` - Summary calculations

### Implementation Steps

1. **Implement Load Function**
   - Fetch budget with all categories and transactions
   - Use Drizzle relations to load nested data efficiently
   - Validate budget exists and user has access
   - Return 404 if not found

2. **Create Board Layout**
   - Display categories as vertical columns
   - Display transactions as cards within columns
   - Implement responsive grid layout
   - Add scroll for overflow

3. **Add Budget Summary**
   - Show total income
   - Show total expenses
   - Show balance (income - expenses)
   - Show allocation percentage
   - Add visual indicators (colors, progress bars)

4. **Handle Loading and Errors**
   - Show skeleton loader while fetching
   - Handle 404 gracefully
   - Handle unauthorized access

### Service Layer

```typescript
// src/lib/server/modules/budget/service.ts
import { db } from '$lib/server/db'
import { budgets, categories, transactions } from '$lib/server/db/schema'
import { eq, and, asc } from 'drizzle-orm'

export async function getBudgetWithDetails(
  budgetId: string,
  userId: string,
): Promise<BudgetWithDetails | null> {
  const budget = await db.query.budgets.findFirst({
    where: and(eq(budgets.id, budgetId), eq(budgets.userId, userId)),
    with: {
      categories: {
        orderBy: asc(categories.order),
        with: {
          transactions: {
            orderBy: asc(transactions.order),
          },
        },
      },
    },
  })

  return budget || null
}
```

### UI Components

```svelte
<!-- src/routes/(app)/budgets/[id]/+page.svelte -->
<script lang="ts">
  import BudgetBoard from '$lib/components/budget/BudgetBoard.svelte'
  import BudgetSummary from '$lib/components/budget/BudgetSummary.svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
</script>

<div class="budget-detail-page">
  <div class="header">
    <div>
      <h1>{data.budget.name}</h1>
      <span class="type-badge">
        {data.budget.type === 'monthly' ? '📅 Monthly' : '💡 Scenario'}
      </span>
    </div>

    <div class="actions">
      <button
        onclick={() => {
          /* Open settings */
        }}
      >
        Settings
      </button>
      <a href="/budgets/{data.budget.id}/export" class="btn-secondary">
        Export
      </a>
    </div>
  </div>

  <BudgetSummary budget={data.budget} user={data.user} />

  <BudgetBoard budget={data.budget} />
</div>
```

```svelte
<!-- src/lib/components/budget/BudgetSummary.svelte -->
<script lang="ts">
  import { formatCurrency, formatPercentage } from '$lib/utils/formatting'
  import type { Budget, User } from '$lib/server/db/schema'

  let { budget, user }: { budget: Budget; user: User } = $props()

  const totalIncome = $derived(
    budget.categories
      .filter((c) => c.type === 'income')
      .flatMap((c) => c.transactions)
      .reduce((sum, t) => sum + Number(t.amount), 0),
  )

  const totalExpenses = $derived(
    budget.categories
      .filter((c) => c.type === 'expense')
      .flatMap((c) => c.transactions)
      .reduce((sum, t) => sum + Number(t.amount), 0),
  )

  const balance = $derived(totalIncome - totalExpenses)

  const allocatedPercentage = $derived(
    totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0,
  )

  const isOverBudget = $derived(balance < 0)
  const isFullyAllocated = $derived(Math.abs(balance) < 0.01)
</script>

<div class="budget-summary">
  <div class="summary-card">
    <h3>Total Income</h3>
    <p class="amount positive">
      {formatCurrency(totalIncome, user.primaryCurrency, user.locale)}
    </p>
  </div>

  <div class="summary-card">
    <h3>Total Expenses</h3>
    <p class="amount negative">
      {formatCurrency(totalExpenses, user.primaryCurrency, user.locale)}
    </p>
  </div>

  <div class="summary-card">
    <h3>Balance</h3>
    <p class="amount" class:positive={balance > 0} class:negative={balance < 0}>
      {formatCurrency(balance, user.primaryCurrency, user.locale)}
    </p>
  </div>

  <div class="summary-card">
    <h3>Allocated</h3>
    <p class="amount">
      {formatPercentage(allocatedPercentage, user.locale)}
    </p>
    <div class="progress-bar">
      <div
        class="progress-fill"
        style="width: {Math.min(allocatedPercentage, 100)}%"
      ></div>
    </div>
  </div>

  {#if isOverBudget}
    <div class="warning over-budget">
      ⚠️ You're over budget by {formatCurrency(
        Math.abs(balance),
        user.primaryCurrency,
        user.locale,
      )}
    </div>
  {:else if !isFullyAllocated && balance > 0}
    <div class="warning unallocated">
      ℹ️ You have {formatCurrency(balance, user.primaryCurrency, user.locale)} unallocated
    </div>
  {:else if isFullyAllocated}
    <div class="success">✓ Budget is fully allocated!</div>
  {/if}
</div>
```

```typescript
// src/routes/(app)/budgets/[id]/+page.server.ts
import { error, redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const user = locals.session?.user
  if (!user) {
    redirect(302, '/auth/login')
  }

  const budget = await budgetService.getBudgetWithDetails(params.id, user.id)

  if (!budget) {
    error(404, 'Budget not found')
  }

  return {
    budget,
    user,
  }
}
```

---

## Validation & Business Rules

- User can only view their own budgets
- All nested data loaded efficiently
- Real-time calculations on client side
- Budget not found returns 404

---

## Testing Checklist

- [ ] Unit tests for getBudgetWithDetails service
- [ ] Unit tests for calculation logic
- [ ] Integration test for budget detail page
- [ ] Manual testing checklist:
  - [ ] Budget loads with all categories and transactions
  - [ ] Summary calculations correct
  - [ ] Trello-like layout displays properly
  - [ ] Invalid budget ID shows 404
  - [ ] Cannot view other users' budgets
  - [ ] Loading state shows while fetching
  - [ ] Page is responsive on mobile

---

## Dependencies

- Depends on: US-2.1 (Create Monthly Budget), US-2.3 (List Budgets)
- Blocks: All category and transaction management stories

---

## Notes

- This is the main working view of the application
- Performance critical - optimize queries
- Consider caching for frequently accessed budgets
- Add breadcrumb navigation back to budget list
