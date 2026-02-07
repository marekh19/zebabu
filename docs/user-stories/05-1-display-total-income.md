# [US-5.1] Display Total Income

**Epic:** Budget Calculations & Validation
**Priority:** P0 (MVP Critical)
**Story Points:** 1
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** see my total income displayed prominently,
**So that** I know how much money I have to allocate.

---

## Description

Calculate and display total income by summing all transactions in income categories. The value updates in real-time as transactions are added, edited, or deleted. All amounts converted to user's primary currency.

---

## Acceptance Criteria

- [ ] Total income displayed in budget summary section
- [ ] Updates in real-time as transactions change
- [ ] All currencies converted to primary currency
- [ ] Formatted according to user's locale
- [ ] Shows 0.00 if no income transactions
- [ ] Visual styling (green, positive indicator)

---

## Technical Implementation

### Files to Modify/Create

- `src/lib/components/budget/BudgetSummary.svelte` - Display component
- `src/lib/utils/budgetCalculations.ts` - Calculation logic
- `src/lib/utils/formatting.ts` - Number formatting (already exists)

### Implementation Steps

1. **Create Calculation Function**
   - Filter categories by type === 'income'
   - Sum all transaction amounts
   - Apply currency conversions
   - Return total

2. **Add to Budget Summary**
   - Display in prominent card/section
   - Use derived reactive value
   - Format with user's locale and currency

### Service Layer

```typescript
// src/lib/utils/budgetCalculations.ts
import type { Budget, User } from '$lib/server/db/schema'

export function calculateTotalIncome(
  budget: Budget,
  exchangeRates: ExchangeRate[],
  user: User,
): number {
  const incomeCategories = budget.categories.filter((c) => c.type === 'income')

  return incomeCategories.reduce((total, category) => {
    const categoryTotal = category.transactions.reduce((sum, transaction) => {
      const convertedAmount = convertToPrimaryCurrency(
        Number(transaction.amount),
        transaction.currency,
        user.primaryCurrency,
        exchangeRates,
      )
      return sum + convertedAmount
    }, 0)

    return total + categoryTotal
  }, 0)
}

function convertToPrimaryCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: ExchangeRate[],
): number {
  if (fromCurrency === toCurrency) return amount

  const rate = exchangeRates.find(
    (r) => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency,
  )

  if (!rate) {
    console.warn(`No exchange rate found for ${fromCurrency} to ${toCurrency}`)
    return amount // Fallback 1:1
  }

  return amount * Number(rate.rate)
}
```

### UI Components

```svelte
<!-- src/lib/components/budget/BudgetSummary.svelte -->
<script lang="ts">
  import { formatCurrency } from '$lib/utils/formatting'
  import { calculateTotalIncome } from '$lib/utils/budgetCalculations'
  import type { Budget, User } from '$lib/server/db/schema'

  let {
    budget,
    user,
    exchangeRates,
  }: {
    budget: Budget
    user: User
    exchangeRates: ExchangeRate[]
  } = $props()

  const totalIncome = $derived(
    calculateTotalIncome(budget, exchangeRates, user),
  )

  const formattedIncome = $derived(
    formatCurrency(totalIncome, user.primaryCurrency, user.locale),
  )
</script>

<div class="budget-summary">
  <div class="summary-card income">
    <div class="card-icon">💰</div>
    <div class="card-content">
      <h3 class="card-label">Total Income</h3>
      <p class="card-value positive">{formattedIncome}</p>
    </div>
  </div>
</div>

<style>
  .summary-card {
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .summary-card.income {
    border-left: 4px solid #10b981;
  }

  .card-icon {
    font-size: 32px;
  }

  .card-label {
    font-size: 14px;
    font-weight: 500;
    color: #6b7280;
    margin: 0 0 4px 0;
  }

  .card-value {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
  }

  .card-value.positive {
    color: #10b981;
  }
</style>
```

---

## Validation & Business Rules

- Include only transactions from income categories
- Convert all currencies to primary currency
- Handle missing exchange rates gracefully
- Update in real-time (derived/reactive)

---

## Testing Checklist

- [ ] Unit tests for calculation function
- [ ] Unit tests for currency conversion
- [ ] Manual testing checklist:
  - [ ] Shows correct total for single currency
  - [ ] Shows correct total for multiple currencies
  - [ ] Updates when transaction added
  - [ ] Updates when transaction edited
  - [ ] Updates when transaction deleted
  - [ ] Shows 0.00 when no income
  - [ ] Formatted correctly for locale

---

## Dependencies

- Depends on: US-2.4 (View Budget Details), US-4.1 (Create Transaction)
- Blocks: US-5.3 (Display Budget Balance), US-5.4 (Display Allocation Percentage)

---

## Notes

- Calculation happens on client side for real-time updates
- Consider caching calculation result
- Future: Show breakdown by currency before conversion
