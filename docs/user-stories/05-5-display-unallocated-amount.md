# [US-5.5] Display Unallocated Amount

**Epic:** Budget Calculations & Validation
**Priority:** P0 (MVP Critical)
**Story Points:** 1
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** see how much money remains unallocated,
**So that** I know how much more I need to budget.

---

## Description

Display the unallocated amount (positive balance). This is the same as balance when positive, but displayed with different messaging focused on "remaining to allocate" rather than just balance.

---

## Acceptance Criteria

- [ ] Shows positive balance as "Unallocated"
- [ ] Shows as 0 when balance is negative or zero
- [ ] Updates in real-time
- [ ] Prominently displayed when > 0
- [ ] Formatted with currency symbol

---

## Technical Implementation

```typescript
export function calculateUnallocatedAmount(
  budget: Budget,
  exchangeRates: ExchangeRate[],
  user: User,
): number {
  const balance = calculateBalance(budget, exchangeRates, user)
  return Math.max(0, balance)
}
```

```svelte
{#if unallocatedAmount > 0}
  <div class="warning-box">
    <span class="icon">ℹ️</span>
    <p>
      You have <strong
        >{formatCurrency(
          unallocatedAmount,
          user.primaryCurrency,
          user.locale,
        )}</strong
      >
      remaining to allocate.
    </p>
  </div>
{/if}
```

---

## Dependencies

- Depends on: US-5.3 (Display Balance)
- Blocks: US-5.7 (Warn If Not Fully Allocated)

---
