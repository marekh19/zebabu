# [US-5.2] Display Total Expenses

**Epic:** Budget Calculations & Validation
**Priority:** P0 (MVP Critical)
**Story Points:** 1
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** see my total expenses displayed,
**So that** I know how much of my income I've allocated.

---

## Description

Calculate and display total expenses by summing all transactions in expense categories. Updates in real-time, with all amounts converted to primary currency.

---

## Acceptance Criteria

- [ ] Total expenses displayed in budget summary
- [ ] Updates in real-time
- [ ] All currencies converted to primary currency
- [ ] Formatted according to locale
- [ ] Shows 0.00 if no expenses
- [ ] Visual styling (red, negative indicator)

---

## Technical Implementation

Similar to US-5.1 but filters for expense categories.

```typescript
export function calculateTotalExpenses(
  budget: Budget,
  exchangeRates: ExchangeRate[],
  user: User,
): number {
  const expenseCategories = budget.categories.filter(
    (c) => c.type === 'expense',
  )

  return expenseCategories.reduce((total, category) => {
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
```

---

## Dependencies

- Depends on: US-5.1 (Display Total Income)
- Blocks: US-5.3 (Display Budget Balance)

---
