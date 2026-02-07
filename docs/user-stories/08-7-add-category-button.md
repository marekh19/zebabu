# [US-8.7] Add Category via Button

**Epic:** Trello-Like UI & Drag-and-Drop
**Priority:** P0 (MVP Critical)
**Story Points:** 1
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** add a new category via a button on the board,
**So that** I can quickly expand my budget structure.

---

## Description

Provide a visible "+ Add Category" button on the budget board that opens the category creation modal. This complements the inline transaction add and maintains the Trello-like workflow where new columns can be easily added.

---

## Acceptance Criteria

- [ ] "+ Add Category" button visible on board
- [ ] Button positioned at the end of category columns
- [ ] Clicking opens category creation modal
- [ ] Same modal as used elsewhere (US-3.1)
- [ ] New category appears immediately after creation
- [ ] Button always accessible (sticky or visible)

---

## Technical Implementation

This is essentially UI for US-3.1 (Create Category).

```svelte
<!-- In BudgetBoard.svelte -->
<script lang="ts">
  import CreateCategoryModal from '$lib/components/category/CreateCategoryModal.svelte'
  import type { Budget } from '$lib/server/db/schema/budgets'

  let { budget }: { budget: Budget } = $props()

  let showCreateCategoryModal = $state(false)
</script>

<div class="budget-board">
  <div class="categories-container">
    {#each budget.categories as category (category.id)}
      <CategoryColumn {category} />
    {/each}

    <button
      class="add-category-column"
      onclick={() => (showCreateCategoryModal = true)}
    >
      <span class="icon">+</span>
      <span>Add Category</span>
    </button>
  </div>
</div>

{#if showCreateCategoryModal}
  <CreateCategoryModal
    budgetId={budget.id}
    show={showCreateCategoryModal}
    onClose={() => (showCreateCategoryModal = false)}
  />
{/if}

<style>
  .categories-container {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    padding: 20px;
    min-height: 600px;
  }

  .add-category-column {
    min-width: 300px;
    height: fit-content;
    padding: 20px;
    background: #f9fafb;
    border: 2px dashed #d1d5db;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: #6b7280;
    font-weight: 500;
    transition: all 0.2s;
  }

  .add-category-column:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
    color: #3b82f6;
  }

  .add-category-column .icon {
    font-size: 32px;
  }
</style>
```

---

## Validation & Business Rules

- Same as US-3.1 (Create Category)
- No special restrictions

---

## Testing Checklist

- [ ] Manual testing checklist:
  - [ ] "+ Add Category" button visible on board
  - [ ] Button positioned at end of columns
  - [ ] Clicking opens modal
  - [ ] Creating category adds to board immediately
  - [ ] Button remains accessible as categories added
  - [ ] Responsive on smaller screens

---

## Dependencies

- Depends on: US-3.1 (Create Category), US-8.1 (Trello Board Layout)
- Blocks: None

---

## Notes

- Consider keyboard shortcut (e.g., 'c' for new category)
- Add tooltip on hover
- Consider inline form alternative to modal
- Position button to remain visible during horizontal scroll
