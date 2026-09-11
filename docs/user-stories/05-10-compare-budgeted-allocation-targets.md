# [US-5.10] Compare Budgeted Shares with Allocation Targets

**Epic:** Budget Calculations & Validation
**Priority:** P1
**Story Points:** 3
**Triage:** ready-for-agent
**Status:** ☑ Done

---

## User Story

**As a** user,
**I want to** compare each expense Category's budgeted share with its allocation target,
**So that** I can see where to adjust my Budget.

---

## Description

When a Budget has allocation targets enabled, show minimal target information in
each expense Category column. Below the complete Budget board, show a full-width
horizontal bullet chart comparing every expense Category's budgeted share with
its target.

---

## Acceptance Criteria

- [x] Each expense Category column shows `Target 25.0%` when Budget targets are enabled.
- [x] Income Category columns never show allocation targets.
- [x] The chart appears below the board only when targets are enabled and total planned income is greater than zero.
- [x] Each chart row uses a bar for budgeted share and a marker for its target.
- [x] Rows follow BudgetCategory order and use the Category color for the budgeted bar.
- [x] Each row states budgeted share, target, and difference in percentage points, such as `32.0% budgeted · 30.0% target · 2.0 pp over`.
- [x] Budgeted share is the Category's total planned amount divided by total planned income; paid state has no effect.
- [x] Differences below `ALLOCATION_VARIANCE_TOLERANCE_PERCENTAGE_POINTS`, initially `0.1`, are labeled on target.
- [x] Under-target and over-target states use neutral text; on-target uses emerald. Meaning never depends on color alone.
- [x] All rows share a scale beginning at 0% and extending beyond 100% when required; values are never capped.
- [x] With zero planned income, columns still show target percentages while the comparison chart remains hidden.
- [x] The comparison refreshes after stored Transaction changes without a page reload.
- [x] Chart values and relationships are available to screen readers and remain legible on mobile.
- [x] Visible text and percentages are localized in English and Czech.

---

## Technical Implementation

- Add pure helpers for total planned income, budgeted shares, shared chart scale, and tolerance-based comparison state. Keep the tolerance as one exported domain constant.
- Build the chart inside Budget Planning with CSS or SVG; do not add a chart dependency for this single chart.
- Extend the existing Category column with only the target percentage. Keep detailed comparison in the chart.
- Place the chart after `BudgetBoard` on the Budget detail page so the board remains the primary content in the initial viewport.

---

## Testing Checklist

- [x] Unit tests cover zero income, paid-state independence, under/on/over tolerance boundaries, and scales above 100%.
- [x] Unit tests cover chart row order, labels, comparison states, and accessible descriptions.
- [ ] Manual testing covers long Category names, many Categories, mobile width, dark mode, and both locales.

---

## Dependencies

- Depends on: US-5.9
- Blocks: None
