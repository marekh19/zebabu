# [US-8.1] Trello-Like Board Layout

**Epic:** Trello-Like UI & Drag-and-Drop
**Priority:** P0 (MVP Critical)
**Story Points:** 5
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** see my budget as a Trello-like board,
**So that** I can visualize my budget categories and transactions in an intuitive way.

---

## Description

Implement a Trello-style board layout where categories are displayed as vertical columns and transactions appear as cards within those columns. This provides an intuitive visual representation of the budget structure and makes it easy to see the organization at a glance.

---

## Acceptance Criteria

- [ ] Budget detail page displays categories as vertical columns
- [ ] Categories arranged horizontally (scrollable if needed)
- [ ] Each category shows:
  - [ ] Category name
  - [ ] Category icon and color
  - [ ] Total amount for category
  - [ ] Percentage of budget (if income category total > 0)
  - [ ] List of transactions as cards
- [ ] Each transaction card shows:
  - [ ] Transaction title
  - [ ] Amount with currency
  - [ ] Paid/unpaid indicator
  - [ ] Edit and delete buttons
- [ ] Horizontal scrolling works smoothly
- [ ] Layout is responsive (vertical on mobile)
- [ ] Empty categories show "Add transaction" prompt
- [ ] Budget summary visible (total income, expenses, balance)

---

## Technical Implementation

### Files to Modify/Create

- `src/routes/(app)/budgets/[id]/+page.svelte` - Main budget board page
- `src/routes/(app)/budgets/[id]/+page.server.ts` - Load budget data
- `src/lib/components/budget/BudgetBoard.svelte` - Board layout container
- `src/lib/components/category/CategoryColumn.svelte` - Category column component
- `src/lib/components/transaction/TransactionCard.svelte` - Transaction card component
- `src/lib/components/budget/BudgetSummary.svelte` - Budget totals summary
- `src/lib/styles/board.css` - Board-specific styles

### Implementation Steps

1. **Create Load Function**
   - Fetch budget with all categories and transactions
   - Include exchange rates for currency conversion
   - Return structured data to page

2. **Build Board Layout**
   - Horizontal container with overflow-x scroll
   - CSS Grid or Flexbox for column arrangement
   - Responsive breakpoints (stack vertically on mobile)

3. **Create Category Column Component**
   - Display category header (name, icon, color)
   - Show category total and percentage
   - Render transaction list
   - Add transaction form at bottom

4. **Create Transaction Card Component**
   - Display transaction details
   - Show paid/unpaid status (checkbox or badge)
   - Hover actions (edit, delete)
   - Responsive to column width

5. **Implement Budget Summary**
   - Calculate totals client-side (Svelte derived stores)
   - Display income, expenses, balance
   - Show allocation percentage
   - Warning indicators (over budget, unallocated)

6. **Style the Board**
   - Trello-inspired visual design
   - Category colors as accent
   - Card shadows and hover effects
   - Smooth scrolling

### Service Layer

```typescript
// src/routes/(app)/budgets/[id]/+page.server.ts
export async function load({ params, locals }) {
  const user = locals.session?.user
  if (!user) redirect(302, '/auth/login')

  const budget = await budgetService.getBudgetWithDetails(params.id, user.id)

  if (!budget) {
    error(404, 'Budget not found')
  }

  // Fetch exchange rates for all currencies used
  const currencies = getUniqueCurrencies(budget)
  const exchangeRates = await Promise.all(
    currencies.map((currency) =>
      exchangeRateService.getExchangeRate(currency, user.primaryCurrency),
    ),
  )

  return {
    budget,
    exchangeRates,
    primaryCurrency: user.primaryCurrency,
  }
}
```

### UI Components

```svelte
<!-- src/lib/components/budget/BudgetBoard.svelte -->
<script lang="ts">
  import CategoryColumn from '$lib/components/category/CategoryColumn.svelte'
  import BudgetSummary from './BudgetSummary.svelte'
  import type { Budget, ExchangeRate } from '$lib/types'

  let { budget, exchangeRates, primaryCurrency } = $props<{
    budget: Budget
    exchangeRates: ExchangeRate[]
    primaryCurrency: string
  }>()

  // Separate income and expense categories
  let incomeCategories = $derived(
    budget.categories.filter((c) => c.type === 'income'),
  )
  let expenseCategories = $derived(
    budget.categories.filter((c) => c.type === 'expense'),
  )
</script>

<div class="budget-board">
  <BudgetSummary {budget} {exchangeRates} {primaryCurrency} />

  <div class="board-container">
    <div class="board-scroll">
      <!-- Income Categories -->
      <div class="category-section">
        <h2>Income</h2>
        <div class="category-columns">
          {#each incomeCategories as category (category.id)}
            <CategoryColumn {category} {exchangeRates} {primaryCurrency} />
          {/each}
        </div>
      </div>

      <!-- Expense Categories -->
      <div class="category-section">
        <h2>Expenses</h2>
        <div class="category-columns">
          {#each expenseCategories as category (category.id)}
            <CategoryColumn {category} {exchangeRates} {primaryCurrency} />
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .budget-board {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .board-container {
    flex: 1;
    overflow-x: auto;
    padding: 1rem;
  }

  .board-scroll {
    min-width: min-content;
  }

  .category-section {
    margin-bottom: 2rem;
  }

  .category-columns {
    display: flex;
    gap: 1rem;
  }

  @media (max-width: 768px) {
    .category-columns {
      flex-direction: column;
    }
  }
</style>
```

```svelte
<!-- src/lib/components/category/CategoryColumn.svelte -->
<script lang="ts">
  import TransactionCard from '$lib/components/transaction/TransactionCard.svelte'
  import TransactionForm from '$lib/components/transaction/TransactionForm.svelte'
  import type { Category, ExchangeRate } from '$lib/types'
  import { calculateCategoryTotal } from '$lib/utils/calculations'

  let { category, exchangeRates, primaryCurrency } = $props<{
    category: Category
    exchangeRates: ExchangeRate[]
    primaryCurrency: string
  }>()

  let total = $derived(
    calculateCategoryTotal(category, exchangeRates, primaryCurrency),
  )
</script>

<div
  class="category-column"
  style="--category-color: {category.color || '#gray'}"
>
  <div class="category-header">
    {#if category.icon}
      <span class="category-icon">{category.icon}</span>
    {/if}
    <h3>{category.name}</h3>
    <span class="category-total"
      >{total.toLocaleString()} {primaryCurrency}</span
    >
  </div>

  <div class="transactions-list">
    {#each category.transactions as transaction (transaction.id)}
      <TransactionCard {transaction} {primaryCurrency} />
    {:else}
      <p class="empty-message">No transactions yet</p>
    {/each}
  </div>

  <div class="add-transaction">
    <TransactionForm
      categoryId={category.id}
      defaultCurrency={primaryCurrency}
    />
  </div>
</div>

<style>
  .category-column {
    width: 320px;
    min-width: 320px;
    background: #f5f5f5;
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 200px);
  }

  .category-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--category-color);
  }

  .transactions-list {
    flex: 1;
    overflow-y: auto;
    margin: 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .empty-message {
    text-align: center;
    color: #999;
    padding: 2rem 1rem;
  }
</style>
```

---

## Validation & Business Rules

- None specific to layout (handled by other user stories)

---

## Testing Checklist

- [ ] Visual testing on different screen sizes
- [ ] Horizontal scrolling works smoothly
- [ ] Categories display in correct order
- [ ] Transactions display in correct order within categories
- [ ] Manual testing checklist:
  - [ ] Board loads with all categories visible
  - [ ] Can scroll horizontally to see all categories
  - [ ] Empty categories show placeholder message
  - [ ] Category totals calculate correctly
  - [ ] Transaction cards display all information
  - [ ] Layout responsive on mobile (stacks vertically)

---

## Dependencies

- Depends on: US-2.4 (View Budget Details), US-3.1 (Create Category), US-4.1 (Create Transaction)
- Blocks: US-8.2 (Drag Categories), US-8.3 (Drag Transactions)

---

## Notes

- Consider virtual scrolling for budgets with 100+ transactions
- Category width should be consistent but configurable
- Consider adding keyboard navigation (arrow keys to move between categories)
- Mobile UX should prioritize vertical scrolling over horizontal
- Consider adding column collapse/expand functionality
