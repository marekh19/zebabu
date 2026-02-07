# [US-8.5] Edit Transaction in Modal

**Epic:** Trello-Like UI & Drag-and-Drop
**Priority:** P0 (MVP Critical)
**Story Points:** 1
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** click on a transaction to edit it in a modal,
**So that** I can quickly update transaction details without leaving the board.

---

## Description

This is a duplicate of US-4.2 (Edit Transaction). The modal-based editing is part of the Trello-like interface pattern. See US-4.2 for full implementation details.

---

## Acceptance Criteria

- Same as US-4.2

---

## Technical Implementation

- Already covered in US-4.2
- Click on transaction card opens edit modal

```svelte
<script lang="ts">
  let showEditModal = $state(false)
  let selectedTransaction = $state(null)
</script>

<div
  class="transaction-card"
  onclick={() => {
    selectedTransaction = transaction
    showEditModal = true
  }}
>
  <!-- Transaction content -->
</div>

{#if showEditModal && selectedTransaction}
  <EditTransactionModal
    transaction={selectedTransaction}
    show={showEditModal}
    onClose={() => (showEditModal = false)}
  />
{/if}
```

---

## Dependencies

- Depends on: US-4.2 (Edit Transaction), US-8.1 (Trello Board Layout)
- Blocks: None

---
