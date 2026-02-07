# [US-2.3] List All Budgets

**Epic:** Budget Management
**Priority:** P0 (MVP Critical)
**Story Points:** 2
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** see a list of all my budgets,
**So that** I can easily navigate between them and manage my financial plans.

---

## Description

Implement a budget list page that displays all user's budgets organized by type (monthly and scenario). The list should show key information for each budget and provide quick actions like view, duplicate, and delete. Monthly budgets should be sorted by date, scenario budgets alphabetically.

---

## Acceptance Criteria

- [ ] Budget list accessible at `/budgets`
- [ ] Budgets grouped by type (Monthly, Scenario)
- [ ] Monthly budgets sorted by year and month (newest first)
- [ ] Scenario budgets sorted alphabetically by name
- [ ] Each budget shows: name, type indicator, created date
- [ ] Click on budget navigates to detail page
- [ ] Quick actions available: View, Duplicate, Delete
- [ ] Empty state shown when no budgets exist
- [ ] Loading state shown while fetching

---

## Technical Implementation

### Files to Modify/Create

- `src/routes/(app)/budgets/+page.svelte` - Budget list UI
- `src/routes/(app)/budgets/+page.server.ts` - Load budgets data
- `src/lib/server/modules/budget/service.ts` - List budgets logic
- `src/lib/server/modules/budget/repository.ts` - Budget queries
- `src/lib/components/budget/BudgetCard.svelte` - Individual budget card component

### Implementation Steps

1. **Implement List Query**
   - Fetch all budgets for user
   - Optional filtering by type
   - Sort monthly budgets by year/month DESC
   - Sort scenario budgets by name ASC

2. **Create Budget Card Component**
   - Display budget name and type
   - Show created date
   - Add icons for budget type (calendar for monthly, lightbulb for scenario)
   - Add action buttons (view, duplicate, delete)

3. **Build List Layout**
   - Separate sections for monthly and scenario
   - Use grid or list layout
   - Add tabs or filters for budget types
   - Show count of budgets per type

4. **Add Empty States**
   - When no budgets exist, show onboarding message
   - Provide "Create Your First Budget" call-to-action
   - Different messages for filtered views

### Service Layer

```typescript
// src/lib/server/modules/budget/service.ts
import { db } from '$lib/server/db'
import { budgets } from '$lib/server/db/schema/budgets'
import { eq, desc, asc, and } from 'drizzle-orm'

export async function listBudgets(
  userId: string,
  options?: { type?: 'monthly' | 'scenario' },
): Promise<Budget[]> {
  const conditions = [eq(budgets.userId, userId)]

  if (options?.type) {
    conditions.push(eq(budgets.type, options.type))
  }

  const results = await db
    .select()
    .from(budgets)
    .where(and(...conditions))
    .orderBy(desc(budgets.year), desc(budgets.month), asc(budgets.name))

  return results
}

export async function getBudgetCounts(userId: string): Promise<{
  monthly: number
  scenario: number
  total: number
}> {
  const allBudgets = await listBudgets(userId)

  return {
    monthly: allBudgets.filter((b) => b.type === 'monthly').length,
    scenario: allBudgets.filter((b) => b.type === 'scenario').length,
    total: allBudgets.length,
  }
}
```

### UI Components

```svelte
<!-- src/routes/(app)/budgets/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms'
  import BudgetCard from '$lib/components/budget/BudgetCard.svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  let activeTab = $state<'all' | 'monthly' | 'scenario'>('all')

  const monthlyBudgets = $derived(
    data.budgets.filter((b) => b.type === 'monthly'),
  )

  const scenarioBudgets = $derived(
    data.budgets.filter((b) => b.type === 'scenario'),
  )

  const filteredBudgets = $derived(
    activeTab === 'all'
      ? data.budgets
      : activeTab === 'monthly'
        ? monthlyBudgets
        : scenarioBudgets,
  )
</script>

<div class="budget-list-page">
  <div class="header">
    <h1>My Budgets</h1>
    <a href="/budgets/new" class="btn-primary"> Create Budget </a>
  </div>

  <div class="tabs">
    <button
      class:active={activeTab === 'all'}
      onclick={() => (activeTab = 'all')}
    >
      All ({data.budgets.length})
    </button>
    <button
      class:active={activeTab === 'monthly'}
      onclick={() => (activeTab = 'monthly')}
    >
      Monthly ({monthlyBudgets.length})
    </button>
    <button
      class:active={activeTab === 'scenario'}
      onclick={() => (activeTab = 'scenario')}
    >
      Scenarios ({scenarioBudgets.length})
    </button>
  </div>

  {#if filteredBudgets.length === 0}
    <div class="empty-state">
      <div class="icon">📊</div>
      <h2>No budgets yet</h2>
      <p>
        {#if activeTab === 'all'}
          Create your first budget to start planning your finances
        {:else if activeTab === 'monthly'}
          You haven't created any monthly budgets yet
        {:else}
          You haven't created any scenario budgets yet
        {/if}
      </p>
      <a href="/budgets/new" class="btn-primary"> Create Your First Budget </a>
    </div>
  {:else}
    <div class="budget-grid">
      {#each filteredBudgets as budget (budget.id)}
        <BudgetCard {budget} />
      {/each}
    </div>
  {/if}
</div>
```

```svelte
<!-- src/lib/components/budget/BudgetCard.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms'
  import { formatDate } from '$lib/utils/formatting'
  import type { Budget } from '$lib/server/db/schema/budgets'

  let { budget }: { budget: Budget } = $props()

  let showDeleteConfirm = $state(false)

  const budgetDate = $derived(
    budget.type === 'monthly'
      ? `${new Date(2000, budget.month! - 1).toLocaleString('en', { month: 'long' })} ${budget.year}`
      : formatDate(budget.createdAt, 'en-US', { dateStyle: 'medium' }),
  )

  const budgetIcon = $derived(budget.type === 'monthly' ? '📅' : '💡')
</script>

<div class="budget-card">
  <div class="card-header">
    <span class="icon">{budgetIcon}</span>
    <span class="type-badge" class:monthly={budget.type === 'monthly'}>
      {budget.type}
    </span>
  </div>

  <h3>{budget.name}</h3>
  <p class="date">{budgetDate}</p>

  <div class="card-actions">
    <a href="/budgets/{budget.id}" class="btn-secondary"> View </a>
    <form method="POST" action="?/duplicate">
      <input type="hidden" name="budgetId" value={budget.id} />
      <button type="submit" class="btn-secondary"> Duplicate </button>
    </form>
    <button class="btn-danger" onclick={() => (showDeleteConfirm = true)}>
      Delete
    </button>
  </div>

  {#if showDeleteConfirm}
    <div class="delete-confirm">
      <p>Delete this budget? This cannot be undone.</p>
      <form
        method="POST"
        action="?/delete"
        use:enhance={() => {
          return async ({ update }) => {
            await update()
            showDeleteConfirm = false
          }
        }}
      >
        <input type="hidden" name="budgetId" value={budget.id} />
        <button type="button" onclick={() => (showDeleteConfirm = false)}>
          Cancel
        </button>
        <button type="submit" class="btn-danger"> Yes, Delete </button>
      </form>
    </div>
  {/if}
</div>
```

---

## Validation & Business Rules

- User can only see their own budgets (authorization)
- Budgets sorted appropriately by type
- Empty state shown when no budgets

---

## Testing Checklist

- [ ] Unit tests for list budgets service
- [ ] Unit tests for budget filtering
- [ ] Integration test for budget list page
- [ ] Manual testing checklist:
  - [ ] Budget list loads successfully
  - [ ] Monthly budgets sorted by date (newest first)
  - [ ] Scenario budgets sorted alphabetically
  - [ ] Tabs show correct counts
  - [ ] Filtering by type works
  - [ ] Empty state shown when no budgets
  - [ ] Click on budget navigates to detail page
  - [ ] Quick actions work (view, duplicate, delete)
  - [ ] Cannot see other users' budgets

---

## Dependencies

- Depends on: US-2.1 (Create Monthly Budget), US-2.2 (Create Scenario Budget)
- Blocks: US-2.4 (View Budget Details)

---

## Notes

- Consider adding search functionality for large lists
- Consider pagination if user has many budgets (>50)
- Could add bulk actions (delete multiple, export multiple)
- Consider adding sort options (by name, by date, by creation)
- Add visual indicators for recently accessed budgets
