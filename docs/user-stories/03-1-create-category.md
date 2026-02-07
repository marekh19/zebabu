# [US-3.1] Create Category

**Epic:** Category Management
**Priority:** P0 (MVP Critical)
**Story Points:** 2
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** add a new category to my budget,
**So that** I can organize my income and expenses into meaningful groups.

---

## Description

Implement category creation functionality allowing users to add new categories to their budgets. Categories group related transactions and have properties like name, type (income/expense), color, icon, and optional target allocation percentage.

---

## Acceptance Criteria

- [ ] "Add Category" button visible on budget board
- [ ] Category creation form/modal includes all fields
- [ ] Required: name, type (income/expense)
- [ ] Optional: color picker, icon selector, target percentage
- [ ] Categories added to end of list (highest order number)
- [ ] Success feedback after creation
- [ ] New category immediately visible on board
- [ ] Validation prevents empty names
- [ ] Target percentage must be 0-100 if provided

---

## Technical Implementation

### Files to Modify/Create

- `src/routes/(app)/budgets/[id]/+page.server.ts` - Add createCategory action
- `src/lib/server/modules/category/service.ts` - Category creation logic
- `src/lib/server/modules/category/repository.ts` - Category database queries
- `src/lib/server/modules/category/validators.ts` - Category validation schemas
- `src/lib/components/category/CreateCategoryModal.svelte` - Creation modal
- `src/lib/components/category/ColorPicker.svelte` - Color selection component
- `src/lib/components/category/IconPicker.svelte` - Icon selection component

### Implementation Steps

1. **Create Category Service**
   - Implement category creation logic
   - Calculate next order number (max + 1)
   - Validate all fields
   - Return created category

2. **Create UI Components**
   - Modal with form fields
   - Color picker (predefined colors)
   - Icon picker (emoji or icon library)
   - Type selector (Income/Expense radio buttons)
   - Target percentage slider/input

3. **Add Action Handler**
   - Parse and validate form data
   - Call category service
   - Return success with new category data
   - Handle errors gracefully

4. **Update Board UI**
   - Add "Add Category" button
   - Show modal on click
   - Optimistically add category to UI
   - Roll back on error

### Service Layer

```typescript
// src/lib/server/modules/category/service.ts
import { db } from '$lib/server/db'
import { categories } from '$lib/server/db/schema/categories'
import { desc } from 'drizzle-orm'

export async function createCategory(
  budgetId: string,
  data: {
    name: string
    type: 'income' | 'expense'
    color?: string
    icon?: string
    targetPercentage?: number
  },
): Promise<Category> {
  // Get next order number
  const lastCategory = await db.query.categories.findFirst({
    where: eq(categories.budgetId, budgetId),
    orderBy: desc(categories.order),
  })

  const order = (lastCategory?.order ?? -1) + 1

  // Create category
  const [category] = await db
    .insert(categories)
    .values({
      budgetId,
      name: data.name,
      type: data.type,
      color: data.color || null,
      icon: data.icon || null,
      order,
      targetPercentage: data.targetPercentage || null,
    })
    .returning()

  return category
}

export async function createDefaultCategories(budgetId: string): Promise<void> {
  await db.insert(categories).values([
    {
      budgetId,
      name: 'Income',
      type: 'income',
      order: 0,
      color: '#10b981',
      icon: '💰',
    },
    {
      budgetId,
      name: 'Expenses',
      type: 'expense',
      order: 1,
      color: '#ef4444',
      icon: '💸',
    },
  ])
}
```

```typescript
// src/lib/server/modules/category/validators.ts
import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  type: z.enum(['income', 'expense']),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  icon: z.string().max(50).optional(),
  targetPercentage: z.number().min(0).max(100).optional(),
})
```

### UI Components

```svelte
<!-- src/lib/components/category/CreateCategoryModal.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms'
  import { superForm } from 'sveltekit-superforms/client'
  import ColorPicker from './ColorPicker.svelte'
  import IconPicker from './IconPicker.svelte'

  let {
    budgetId,
    show,
    onClose,
  }: {
    budgetId: string
    show: boolean
    onClose: () => void
  } = $props()

  const { form, errors, enhance: formEnhance } = superForm(data.form)

  let categoryType = $state<'income' | 'expense'>('expense')

  // Default colors
  const defaultColors = {
    income: '#10b981',
    expense: '#ef4444',
  }

  $effect(() => {
    if (!$form.color) {
      $form.color = defaultColors[categoryType]
    }
  })
</script>

{#if show}
  <div class="modal-overlay" onclick={onClose}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <h2>Create Category</h2>

      <form
        method="POST"
        action="?/createCategory"
        use:formEnhance={() => {
          return async ({ result, update }) => {
            if (result.type === 'success') {
              onClose()
            }
            await update()
          }
        }}
      >
        <input type="hidden" name="budgetId" value={budgetId} />

        <label>
          Category Name *
          <input
            type="text"
            name="name"
            bind:value={$form.name}
            placeholder="e.g., Groceries, Salary, Savings"
            required
          />
        </label>
        {#if $errors.name}
          <span class="error">{$errors.name}</span>
        {/if}

        <div class="type-selector">
          <label>Type *</label>
          <div class="radio-group">
            <label>
              <input
                type="radio"
                name="type"
                value="income"
                bind:group={categoryType}
              />
              💰 Income
            </label>
            <label>
              <input
                type="radio"
                name="type"
                value="expense"
                bind:group={categoryType}
              />
              💸 Expense
            </label>
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <label>
              Color
              <ColorPicker bind:value={$form.color} />
            </label>
          </div>

          <div class="form-col">
            <label>
              Icon
              <IconPicker bind:value={$form.icon} />
            </label>
          </div>
        </div>

        <label>
          Target Allocation (%)
          <input
            type="number"
            name="targetPercentage"
            bind:value={$form.targetPercentage}
            min="0"
            max="100"
            step="0.1"
            placeholder="Optional"
          />
          <span class="help-text">
            Set a target percentage of total income for this category
          </span>
        </label>
        {#if $errors.targetPercentage}
          <span class="error">{$errors.targetPercentage}</span>
        {/if}

        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick={onClose}>
            Cancel
          </button>
          <button type="submit" class="btn-primary"> Create Category </button>
        </div>
      </form>
    </div>
  </div>
{/if}
```

```typescript
// src/routes/(app)/budgets/[id]/+page.server.ts
export const actions: Actions = {
  createCategory: async ({ request, locals, params }) => {
    const user = locals.session?.user
    if (!user) return fail(401, { message: 'Unauthorized' })

    // Verify user owns budget
    const budget = await budgetService.getBudgetWithDetails(params.id, user.id)
    if (!budget) {
      return fail(404, { message: 'Budget not found' })
    }

    const form = await superValidate(request, createCategorySchema)

    if (!form.valid) {
      return fail(400, { form })
    }

    const category = await categoryService.createCategory(params.id, form.data)

    return { form, category, success: true }
  },
}
```

---

## Validation & Business Rules

- **BR-10**: Category type must be 'income' or 'expense'
- **BR-11**: Target percentage must be 0-100 if provided
- **BR-13**: Category name is required
- Name length: 1-100 characters
- Color format: hex color (#RRGGBB) if provided
- Icon: string up to 50 characters

---

## Testing Checklist

- [ ] Unit tests for category creation service
- [ ] Unit tests for validation logic
- [ ] Unit tests for order calculation
- [ ] Integration test for category creation flow
- [ ] Manual testing checklist:
  - [ ] "Add Category" button visible
  - [ ] Modal opens with all fields
  - [ ] Can create income category
  - [ ] Can create expense category
  - [ ] Can select color from picker
  - [ ] Can select icon from picker
  - [ ] Can set target percentage
  - [ ] New category appears on board
  - [ ] Category added at end of list
  - [ ] Validation prevents empty names
  - [ ] Validation prevents invalid percentages

---

## Dependencies

- Depends on: US-2.4 (View Budget Details)
- Blocks: US-3.2 (Edit Category), US-4.1 (Create Transaction)

---

## Notes

- Consider preset color palettes for quick selection
- Icon picker could use emoji or icon library (lucide, heroicons)
- Consider category templates (common categories)
- Future: Allow reordering during creation
- Consider bulk category creation
