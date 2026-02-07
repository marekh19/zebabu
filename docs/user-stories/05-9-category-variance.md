# [US-5.9] Display Variance Between Target and Actual

**Epic:** Budget Calculations & Validation
**Priority:** P0 (MVP Critical)
**Story Points:** 1
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** see the variance between my target and actual allocation per category,
**So that** I can adjust my budget to meet my targets.

---

## Description

When a category has a target percentage set, calculate and display the variance between target and actual allocation. Show whether over or under target.

---

## Acceptance Criteria

- [ ] Variance shown only when target percentage is set
- [ ] Variance = Actual % - Target %
- [ ] Positive variance shown as "over target"
- [ ] Negative variance shown as "under target"
- [ ] Color-coded (red when far from target, green when close)
- [ ] Updates in real-time

---

## Technical Implementation

```typescript
export function calculateCategoryVariance(
  category: Category,
  actualPercentage: number,
): number | null {
  if (!category.targetPercentage) return null
  return actualPercentage - Number(category.targetPercentage)
}
```

```svelte
{#if category.targetPercentage}
  <div class="target-info">
    <span class="label">Target: {category.targetPercentage}%</span>
    <span class="label"
      >Actual: {formatPercentage(actualPercentage, user.locale)}</span
    >

    {#if variance !== null}
      <div
        class="variance"
        class:over={variance > 0}
        class:under={variance < 0}
      >
        {variance > 0 ? '+' : ''}{formatPercentage(
          Math.abs(variance),
          user.locale,
        )}
        {variance > 0 ? 'over' : 'under'} target
      </div>
    {/if}
  </div>
{/if}
```

---

## Dependencies

- Depends on: US-5.8 (Category Totals), US-3.1 (Create Category with target)
- Blocks: None

---
