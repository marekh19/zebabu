# [US-3.2] Edit Category

**Epic:** Category Management
**Priority:** P0 (MVP Critical)
**Story Points:** 2
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** edit a category's details,
**So that** I can update its name, color, icon, or target allocation as my needs change.

---

## Description

Implement category editing functionality allowing users to modify existing categories. Users should be able to change the name, color, icon, and target percentage. Category type (income/expense) cannot be changed after creation to prevent data inconsistency.

---

## Acceptance Criteria

- [ ] Edit button available on category header
- [ ] Edit modal pre-populated with current values
- [ ] Can change: name, color, icon, target percentage
- [ ] Cannot change: type (income/expense)
- [ ] Changes immediately reflected on board
- [ ] Validation same as create
- [ ] Success feedback after update
- [ ] Optimistic UI updates

---

## Technical Implementation

### Files to Modify/Create

- `src/routes/(app)/budgets/[id]/+page.server.ts` - Add updateCategory action
- `src/lib/server/modules/category/service.ts` - Update category logic
- `src/lib/components/category/EditCategoryModal.svelte` - Edit modal
- `src/lib/components/category/CategoryHeader.svelte` - Category header with edit button

### Implementation Steps

1. **Implement Update Service**
   - Accept category ID and update data
   - Validate changes
   - Update database record
   - Return updated category

2. **Create Edit Modal**
   - Pre-populate form with current values
   - Disable type field (show but not editable)
   - Use same validation as create
   - Handle form submission

3. **Add Edit Trigger**
   - Add edit button/icon to category header
   - Open modal on click
   - Pass current category data

### Service Layer

```typescript
// src/lib/server/modules/category/service.ts
export async function updateCategory(
  categoryId: string,
  data: {
    name?: string
    color?: string
    icon?: string
    targetPercentage?: number | null
  },
): Promise<Category> {
  const [category] = await db
    .update(categories)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(categories.id, categoryId))
    .returning()

  if (!category) {
    throw new Error('Category not found')
  }

  return category
}
```

```typescript
// Validator
export const updateCategorySchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  icon: z.string().max(50).optional(),
  targetPercentage: z.number().min(0).max(100).nullable().optional(),
})
```

### UI Components

```svelte
<!-- src/lib/components/category/EditCategoryModal.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms'
  import { superForm } from 'sveltekit-superforms/client'
  import ColorPicker from './ColorPicker.svelte'
  import IconPicker from './IconPicker.svelte'
  import type { Category } from '$lib/server/db/schema/categories'

  let {
    category,
    show,
    onClose,
  }: {
    category: Category
    show: boolean
    onClose: () => void
  } = $props()

  const {
    form,
    errors,
    enhance: formEnhance,
  } = superForm(data.form, {
    resetForm: false,
  })

  // Initialize with current values
  $effect(() => {
    if (show) {
      $form.name = category.name
      $form.color = category.color || undefined
      $form.icon = category.icon || undefined
      $form.targetPercentage = category.targetPercentage || undefined
    }
  })
</script>

{#if show}
  <div class="modal-overlay" onclick={onClose}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <h2>Edit Category</h2>

      <form
        method="POST"
        action="?/updateCategory"
        use:formEnhance={() => {
          return async ({ result, update }) => {
            if (result.type === 'success') {
              onClose()
            }
            await update()
          }
        }}
      >
        <input type="hidden" name="categoryId" value={category.id} />

        <label>
          Category Name *
          <input type="text" name="name" bind:value={$form.name} required />
        </label>
        {#if $errors.name}
          <span class="error">{$errors.name}</span>
        {/if}

        <div class="field-disabled">
          <label>Type</label>
          <div class="type-display">
            {category.type === 'income' ? '💰 Income' : '💸 Expense'}
          </div>
          <span class="help-text">Category type cannot be changed</span>
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
        </label>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick={onClose}>
            Cancel
          </button>
          <button type="submit" class="btn-primary"> Save Changes </button>
        </div>
      </form>
    </div>
  </div>
{/if}
```

---

## Validation & Business Rules

- Same validation as create
- Type cannot be changed after creation
- All other fields can be modified
- Target percentage can be cleared (set to null)

---

## Testing Checklist

- [ ] Unit tests for update category service
- [ ] Integration test for edit flow
- [ ] Manual testing checklist:
  - [ ] Edit button opens modal with current values
  - [ ] Can change name
  - [ ] Can change color
  - [ ] Can change icon
  - [ ] Can change target percentage
  - [ ] Can clear target percentage
  - [ ] Cannot change type
  - [ ] Changes reflected immediately
  - [ ] Validation works same as create

---

## Dependencies

- Depends on: US-3.1 (Create Category)
- Blocks: None

---

## Notes

- Consider allowing type change with transaction migration
- Add confirmation if changing critical fields
- Track edit history in future
