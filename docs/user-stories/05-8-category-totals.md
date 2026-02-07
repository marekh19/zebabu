# [US-5.8] Display Per-Category Totals and Percentages

**Epic:** Budget Calculations & Validation
**Priority:** P0 (MVP Critical)
**Story Points:** 1
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** see totals and percentages for each category,
**So that** I understand my spending distribution.

---

## Description

Calculate and display for each category: total amount, percentage of total income, and number of transactions. Show in category header or footer.

---

## Acceptance Criteria

- [ ] Each category shows total amount
- [ ] Each category shows % of total income
- [ ] Shows transaction count
- [ ] Shows paid vs unpaid count
- [ ] Updates in real-time
- [ ] Formatted with currency and percentage

---

## Technical Implementation

```typescript
export function calculateCategoryTotals(
  category: Category,
  totalIncome: number,
  exchangeRates: ExchangeRate[],
  user: User,
): CategoryTotals {
  const total = category.transactions.reduce((sum, t) => {
    return (
      sum +
      convertToPrimaryCurrency(
        Number(t.amount),
        t.currency,
        user.primaryCurrency,
        exchangeRates,
      )
    )
  }, 0)

  const percentage = totalIncome > 0 ? (total / totalIncome) * 100 : 0
  const paidCount = category.transactions.filter((t) => t.isPaid).length

  return {
    total,
    percentage,
    transactionCount: category.transactions.length,
    paidCount,
    unpaidCount: category.transactions.length - paidCount,
  }
}
```

```svelte
<div class="category-footer">
  <div class="category-total">
    <strong
      >{formatCurrency(
        categoryTotal,
        user.primaryCurrency,
        user.locale,
      )}</strong
    >
    <span class="percentage"
      >({formatPercentage(categoryPercentage, user.locale)})</span
    >
  </div>
  <div class="category-stats">
    <span>{paidCount} / {totalCount} paid</span>
  </div>
</div>
```

---

## Dependencies

- Depends on: US-5.1 (Total Income)
- Blocks: US-5.9 (Display Variance)

---
