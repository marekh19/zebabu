# [US-5.6] Warn If Over Budget

**Epic:** Budget Calculations & Validation
**Priority:** P0 (MVP Critical)
**Story Points:** 1
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** be warned if my total expenses exceed my total income,
**So that** I'm aware I need to adjust my budget.

---

## Description

Implement a real-time warning system that alerts users when their total planned expenses exceed their total planned income. This warning should be prominently displayed and update automatically as the user adds or modifies transactions.

---

## Acceptance Criteria

- [ ] Warning displayed when total expenses > total income
- [ ] Warning shows exact amount over budget (e.g., "Over budget by 2,400 CZK")
- [ ] Warning styled prominently (red color, exclamation icon)
- [ ] Warning updates in real-time as user adds/edits/deletes transactions
- [ ] Warning disappears when balance becomes zero or positive
- [ ] Warning visible in budget summary section
- [ ] Warning takes currency conversion into account

---

## Technical Implementation

### Files to Modify/Create

- `src/lib/components/budget/BudgetSummary.svelte` - Display warnings
- `src/lib/stores/budgetCalculations.ts` - Reactive calculations store
- `src/lib/utils/calculations.ts` - Calculation utility functions
- `src/lib/components/ui/WarningBanner.svelte` - Reusable warning component

### Implementation Steps

1. **Create Calculation Utilities**
   - Function to calculate total income (all income categories, converted to primary currency)
   - Function to calculate total expenses (all expense categories, converted)
   - Function to calculate balance (income - expenses)

2. **Set Up Reactive Stores**
   - Create Svelte derived store for budget calculations
   - Auto-recalculates when budget data changes
   - Exposes: totalIncome, totalExpenses, balance, isOverBudget

3. **Create Warning Component**
   - Visual design: red background, exclamation icon
   - Display over-budget amount
   - Conditionally rendered based on isOverBudget

4. **Integrate into Budget Summary**
   - Add warning banner to budget summary section
   - Position above or below main metrics
   - Ensure visibility (don't hide in collapsed sections)

5. **Handle Currency Conversion**
   - All amounts must be converted to primary currency before summing
   - Use exchange rates from load function
   - Handle missing exchange rates gracefully (show warning)

### Service Layer

```typescript
// src/lib/utils/calculations.ts
export function calculateTotalIncome(
  budget: Budget,
  exchangeRates: ExchangeRate[],
  primaryCurrency: string,
): number {
  const incomeCategories = budget.categories.filter((c) => c.type === 'income')

  return incomeCategories.reduce((total, category) => {
    const categoryTotal = category.transactions.reduce((sum, transaction) => {
      const amount = convertCurrency(
        transaction.amount,
        transaction.currency,
        primaryCurrency,
        exchangeRates,
      )
      return sum + amount
    }, 0)
    return total + categoryTotal
  }, 0)
}

export function calculateTotalExpenses(
  budget: Budget,
  exchangeRates: ExchangeRate[],
  primaryCurrency: string,
): number {
  const expenseCategories = budget.categories.filter(
    (c) => c.type === 'expense',
  )

  return expenseCategories.reduce((total, category) => {
    const categoryTotal = category.transactions.reduce((sum, transaction) => {
      const amount = convertCurrency(
        transaction.amount,
        transaction.currency,
        primaryCurrency,
        exchangeRates,
      )
      return sum + amount
    }, 0)
    return total + categoryTotal
  }, 0)
}

export function calculateBudgetSummary(
  budget: Budget,
  exchangeRates: ExchangeRate[],
  primaryCurrency: string,
) {
  const totalIncome = calculateTotalIncome(
    budget,
    exchangeRates,
    primaryCurrency,
  )
  const totalExpenses = calculateTotalExpenses(
    budget,
    exchangeRates,
    primaryCurrency,
  )
  const balance = totalIncome - totalExpenses

  return {
    totalIncome,
    totalExpenses,
    balance,
    isOverBudget: balance < 0,
    overBudgetAmount: balance < 0 ? Math.abs(balance) : 0,
    allocatedPercentage:
      totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0,
    unallocatedAmount: balance > 0 ? balance : 0,
  }
}
```

### UI Components

```svelte
<!-- src/lib/components/budget/BudgetSummary.svelte -->
<script lang="ts">
  import { calculateBudgetSummary } from '$lib/utils/calculations'
  import WarningBanner from '$lib/components/ui/WarningBanner.svelte'
  import type { Budget, ExchangeRate } from '$lib/types'

  let { budget, exchangeRates, primaryCurrency } = $props<{
    budget: Budget
    exchangeRates: ExchangeRate[]
    primaryCurrency: string
  }>()

  let summary = $derived(
    calculateBudgetSummary(budget, exchangeRates, primaryCurrency),
  )
</script>

<div class="budget-summary">
  <h2>{budget.name}</h2>

  {#if summary.isOverBudget}
    <WarningBanner type="error">
      <strong
        >Over budget by {summary.overBudgetAmount.toLocaleString()}
        {primaryCurrency}</strong
      >
      <p>
        Your expenses exceed your income. Consider reducing expenses or
        increasing income.
      </p>
    </WarningBanner>
  {/if}

  <div class="metrics">
    <div class="metric">
      <span class="label">Total Income</span>
      <span class="value income">
        {summary.totalIncome.toLocaleString()}
        {primaryCurrency}
      </span>
    </div>

    <div class="metric">
      <span class="label">Total Expenses</span>
      <span class="value expense">
        {summary.totalExpenses.toLocaleString()}
        {primaryCurrency}
      </span>
    </div>

    <div class="metric">
      <span class="label">Balance</span>
      <span class="value {summary.balance < 0 ? 'negative' : 'positive'}">
        {summary.balance.toLocaleString()}
        {primaryCurrency}
      </span>
    </div>

    <div class="metric">
      <span class="label">Allocated</span>
      <span class="value">
        {summary.allocatedPercentage.toFixed(1)}%
      </span>
    </div>
  </div>
</div>

<style>
  .budget-summary {
    padding: 1.5rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 1.5rem;
  }

  .metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .metric {
    display: flex;
    flex-direction: column;
  }

  .label {
    font-size: 0.875rem;
    color: #666;
    margin-bottom: 0.25rem;
  }

  .value {
    font-size: 1.25rem;
    font-weight: 600;
  }

  .value.income {
    color: #22c55e;
  }

  .value.expense {
    color: #ef4444;
  }

  .value.negative {
    color: #ef4444;
  }

  .value.positive {
    color: #22c55e;
  }
</style>
```

```svelte
<!-- src/lib/components/ui/WarningBanner.svelte -->
<script lang="ts">
  let { type = 'warning' } = $props<{
    type?: 'warning' | 'error' | 'info'
  }>()
</script>

<div class="warning-banner {type}">
  <span class="icon">
    {#if type === 'error'}⚠️{:else if type === 'warning'}⚠️{:else}ℹ️{/if}
  </span>
  <div class="content">
    <slot />
  </div>
</div>

<style>
  .warning-banner {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 6px;
    margin: 1rem 0;
  }

  .warning-banner.error {
    background: #fee;
    border-left: 4px solid #ef4444;
    color: #991b1b;
  }

  .warning-banner.warning {
    background: #fef3c7;
    border-left: 4px solid #f59e0b;
    color: #92400e;
  }

  .warning-banner.info {
    background: #dbeafe;
    border-left: 4px solid #3b82f6;
    color: #1e40af;
  }

  .icon {
    font-size: 1.5rem;
    line-height: 1;
  }

  .content {
    flex: 1;
  }

  .content :global(strong) {
    display: block;
    margin-bottom: 0.25rem;
  }

  .content :global(p) {
    margin: 0;
    font-size: 0.875rem;
  }
</style>
```

---

## Validation & Business Rules

- **W-1**: Total expenses > total income → "You're over budget by {amount}"

---

## Testing Checklist

- [ ] Unit tests for calculation functions
- [ ] Unit tests for currency conversion
- [ ] Visual testing for warning banner
- [ ] Manual testing checklist:
  - [ ] Warning appears when expenses > income
  - [ ] Warning shows correct over-budget amount
  - [ ] Warning disappears when balance is adjusted
  - [ ] Warning updates in real-time
  - [ ] Multi-currency budgets calculate correctly
  - [ ] Warning visible on all screen sizes

---

## Dependencies

- Depends on: US-2.4 (View Budget Details), US-4.1 (Create Transaction)
- Blocks: None

---

## Notes

- Consider adding different warning levels (slightly over vs significantly over)
- Consider adding a recommendation engine (suggest where to cut expenses)
- Warning message should be customizable/localizable
- Consider animating the warning appearance/disappearance
