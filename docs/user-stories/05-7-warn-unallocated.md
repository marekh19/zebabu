# [US-5.7] Warn If Not Fully Allocated

**Epic:** Budget Calculations & Validation
**Priority:** P0 (MVP Critical)
**Story Points:** 1
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** be warned if I haven't allocated all my income,
**So that** I remember to complete my zero-based budget.

---

## Description

Display a warning when the allocation percentage is below 100% (money remains unallocated). The warning should encourage the user to allocate remaining funds to complete their zero-based budget.

---

## Acceptance Criteria

- [ ] Warning shown when balance > 0
- [ ] Shows unallocated amount
- [ ] Warning styled as info/reminder (not error)
- [ ] Dismissible or auto-hides when fully allocated
- [ ] Updates in real-time
- [ ] No warning when perfectly allocated (balance = 0)

---

## Technical Implementation

```svelte
{#if balance > 0}
  <div class="warning unallocated">
    <span class="icon">ℹ️</span>
    <p>
      You have {formatCurrency(balance, user.primaryCurrency, user.locale)} unallocated.
      Add more expenses to reach your zero-based budget goal.
    </p>
  </div>
{:else if Math.abs(balance) < 0.01}
  <div class="success">
    <span class="icon">✓</span>
    <p>Perfect! Your budget is fully allocated.</p>
  </div>
{/if}
```

---

## Dependencies

- Depends on: US-5.3, US-5.5
- Blocks: None

---
