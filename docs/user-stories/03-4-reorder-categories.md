# [US-3.4] Reorder Categories via Drag & Drop

**Epic:** Category Management
**Priority:** P0 (MVP Critical)
**Story Points:** 2
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** drag and drop categories to reorder them,
**So that** I can organize my budget layout according to my preferences.

---

## Description

Implement drag-and-drop functionality for category reordering using @dnd-kit/svelte or svelte-dnd-action. Categories should smoothly reorder with visual feedback, and the new order should persist to the database.

---

## Acceptance Criteria

- [ ] Categories can be dragged horizontally
- [ ] Visual feedback during drag (ghost element, placeholder)
- [ ] Drop updates category order
- [ ] Order persists to database
- [ ] Optimistic UI updates
- [ ] Smooth animations
- [ ] Works on touch devices
- [ ] Undo on error

---

## Technical Implementation

### Files to Modify/Create

- `src/routes/(app)/budgets/[id]/+page.server.ts` - Add reorderCategories action
- `src/lib/server/modules/category/service.ts` - Reorder logic
- `src/lib/components/budget/BudgetBoard.svelte` - Implement drag-and-drop
- Install: `pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

### Implementation Steps

1. **Install and Configure DnD Kit**
   - Install @dnd-kit packages
   - Set up DndContext in board component
   - Configure sortable context for categories

2. **Implement Reorder Service**
   - Accept array of category IDs in new order
   - Update order field for each category
   - Use transaction for atomicity

3. **Add Drag Handlers**
   - onDragStart: visual feedback
   - onDragOver: show drop position
   - onDragEnd: call reorder action
   - Handle errors and rollback

### Service Layer

```typescript
// src/lib/server/modules/category/service.ts
export async function reorderCategories(categoryIds: string[]): Promise<void> {
  await db.transaction(async (tx) => {
    for (let i = 0; i < categoryIds.length; i++) {
      await tx
        .update(categories)
        .set({ order: i, updatedAt: new Date() })
        .where(eq(categories.id, categoryIds[i]))
    }
  })
}
```

### UI Components

```svelte
<!-- src/lib/components/budget/BudgetBoard.svelte -->
<script lang="ts">
  import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
  } from '@dnd-kit/core'
  import {
    SortableContext,
    horizontalListSortingStrategy,
  } from '@dnd-kit/sortable'
  import CategoryColumn from './CategoryColumn.svelte'
  import type { Budget } from '$lib/server/db/schema/budgets'

  let { budget }: { budget: Budget } = $props()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  let categories = $state(budget.categories)

  async function handleDragEnd(event) {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c.id === active.id)
      const newIndex = categories.findIndex((c) => c.id === over.id)

      // Optimistic update
      const newCategories = arrayMove(categories, oldIndex, newIndex)
      categories = newCategories

      // Persist to server
      try {
        const categoryIds = newCategories.map((c) => c.id)
        await fetch('?/reorderCategories', {
          method: 'POST',
          body: JSON.stringify({ categoryIds }),
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (error) {
        // Rollback on error
        categories = budget.categories
        alert('Failed to reorder categories')
      }
    }
  }

  function arrayMove<T>(array: T[], from: number, to: number): T[] {
    const newArray = array.slice()
    newArray.splice(to, 0, newArray.splice(from, 1)[0])
    return newArray
  }
</script>

<div class="budget-board">
  <DndContext
    {sensors}
    collisionDetection={closestCenter}
    onDragEnd={handleDragEnd}
  >
    <SortableContext
      items={categories.map((c) => c.id)}
      strategy={horizontalListSortingStrategy}
    >
      <div class="categories-container">
        {#each categories as category (category.id)}
          <CategoryColumn {category} />
        {/each}
      </div>
    </SortableContext>
  </DndContext>

  <button class="add-category-btn">+ Add Category</button>
</div>
```

```svelte
<!-- src/lib/components/budget/CategoryColumn.svelte -->
<script lang="ts">
  import { useSortable } from '@dnd-kit/sortable'
  import { CSS } from '@dnd-kit/utilities'
  import type { Category } from '$lib/server/db/schema/categories'

  let { category }: { category: Category } = $props()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = $derived(
    CSS.Transform.toString(transform) + (isDragging ? ' opacity: 0.5;' : ''),
  )
</script>

<div
  bind:this={setNodeRef}
  style={`${style} ${transition}`}
  class="category-column"
  class:dragging={isDragging}
>
  <div class="category-header" {...attributes} {...listeners}>
    <div class="drag-handle">⋮⋮</div>
    <h3>{category.name}</h3>
  </div>

  <!-- Transactions list -->
  <div class="transactions">
    {#each category.transactions as transaction}
      <!-- Transaction card -->
    {/each}
  </div>
</div>
```

---

## Validation & Business Rules

- **BR-12**: Category order must be non-negative
- Order is sequential from 0
- All categories reordered atomically

---

## Testing Checklist

- [ ] Unit tests for reorder service
- [ ] Integration test for drag-and-drop
- [ ] Manual testing checklist:
  - [ ] Can drag categories left/right
  - [ ] Visual feedback during drag
  - [ ] Drop updates order in database
  - [ ] Order persists after page reload
  - [ ] Works on touch devices
  - [ ] Smooth animations
  - [ ] Error handling works

---

## Dependencies

- Depends on: US-3.1 (Create Category)
- Blocks: US-8.2 (Drag Categories to Reorder)

---

## Notes

- Consider keyboard navigation for accessibility
- Add grid snap for cleaner ordering
- Consider section grouping (income vs expense)
