# [US-8.6] Add Transaction via Inline Form

**Epic:** Trello-Like UI & Drag-and-Drop
**Priority:** P0 (MVP Critical)
**Story Points:** 2
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** add a transaction via an inline form at the bottom of each category,
**So that** I can quickly add transactions without opening a modal.

---

## Description

Provide a quick-add form at the bottom of each category column for fast transaction entry. The form should be minimal (title and amount required) with optional fields accessible via expansion or modal.

---

## Acceptance Criteria

- [ ] "+ Add Transaction" button at bottom of each category
- [ ] Clicking shows inline form
- [ ] Quick form has: title, amount fields
- [ ] Currency defaults to primary currency
- [ ] Enter key submits form
- [ ] Escape key cancels
- [ ] Form clears after successful submit
- [ ] Optional: "More fields" expands to full form

---

## Technical Implementation

```svelte
<!-- src/lib/components/category/QuickAddTransaction.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms'
  import type { Category, User } from '$lib/server/db/schema'

  let { category, user }: { category: Category; user: User } = $props()

  let showForm = $state(false)
  let title = $state('')
  let amount = $state('')

  function handleCancel() {
    showForm = false
    title = ''
    amount = ''
  }

  function handleSuccess() {
    title = ''
    amount = ''
    showForm = false
  }
</script>

<div class="quick-add-transaction">
  {#if !showForm}
    <button class="add-btn" onclick={() => (showForm = true)}>
      + Add Transaction
    </button>
  {:else}
    <form
      method="POST"
      action="?/createTransaction"
      use:enhance={() => {
        return async ({ result, update }) => {
          if (result.type === 'success') {
            handleSuccess()
          }
          await update()
        }
      }}
    >
      <input type="hidden" name="categoryId" value={category.id} />
      <input type="hidden" name="currency" value={user.primaryCurrency} />

      <div class="quick-form">
        <input
          type="text"
          name="title"
          bind:value={title}
          placeholder="Transaction name"
          required
          autofocus
          onkeydown={(e) => {
            if (e.key === 'Escape') handleCancel()
          }}
        />

        <input
          type="number"
          name="amount"
          bind:value={amount}
          placeholder="Amount"
          step="0.01"
          min="0"
          required
        />

        <div class="form-actions">
          <button type="submit" class="btn-primary btn-sm">Add</button>
          <button
            type="button"
            class="btn-secondary btn-sm"
            onclick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </div>

      <button type="button" class="expand-btn" onclick={openFullModal}>
        More fields...
      </button>
    </form>
  {/if}
</div>

<style>
  .quick-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: #f9fafb;
    border-radius: 8px;
  }

  .quick-form input {
    padding: 8px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
  }

  .form-actions {
    display: flex;
    gap: 8px;
  }

  .expand-btn {
    font-size: 12px;
    color: #6b7280;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    text-align: left;
  }

  .expand-btn:hover {
    color: #3b82f6;
  }
</style>
```

---

## Validation & Business Rules

- Same validation as full transaction creation
- Title and amount required
- Amount must be positive
- Currency defaults to primary

---

## Testing Checklist

- [ ] Unit tests for inline form
- [ ] Integration test for quick add flow
- [ ] Manual testing checklist:
  - [ ] "+ Add Transaction" button shows form
  - [ ] Form appears inline in category
  - [ ] Can enter title and amount
  - [ ] Enter key submits
  - [ ] Escape key cancels
  - [ ] Form clears after submit
  - [ ] New transaction appears immediately
  - [ ] "More fields" opens full modal (optional)

---

## Dependencies

- Depends on: US-4.1 (Create Transaction), US-8.1 (Trello Board Layout)
- Blocks: None

---

## Notes

- Consider keyboard shortcuts for power users
- Add autofocus on form show
- Consider keeping form open after submit for batch entry
- Future: Add recent transaction suggestions
