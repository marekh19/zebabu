# [US-2.2] Create Scenario Budget

**Epic:** Budget Management
**Priority:** P0 (MVP Critical)
**Story Points:** 2
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** create a scenario budget with a custom name,
**So that** I can plan for hypothetical situations without affecting my monthly budgets.

---

## Description

Implement scenario budget creation functionality. Unlike monthly budgets (tied to specific month/year), scenario budgets are flexible planning tools with custom names like "If I get promoted" or "Summer vacation budget". Users can create unlimited scenario budgets for various planning purposes.

---

## Acceptance Criteria

- [ ] Budget creation form includes "Scenario" option
- [ ] Scenario budget requires only a name (no month/year)
- [ ] Name must be unique per user (optional constraint)
- [ ] System auto-creates default "Income" and "Expenses" categories
- [ ] Success message shown after creation
- [ ] User redirected to newly created budget view
- [ ] Scenario budgets listed separately from monthly budgets
- [ ] No limit on number of scenario budgets per user

---

## Technical Implementation

### Files to Modify/Create

- `src/routes/(app)/budgets/+page.svelte` - Add scenario budget creation form
- `src/routes/(app)/budgets/+page.server.ts` - Add scenario budget create action
- `src/lib/server/modules/budget/service.ts` - Scenario budget creation logic
- `src/lib/server/modules/budget/validators.ts` - Scenario budget validation schema
- `src/lib/server/modules/category/service.ts` - Default category creation

### Implementation Steps

1. **Update Budget Creation Form**
   - Add budget type selector (Monthly/Scenario)
   - Conditionally show/hide month/year fields based on type
   - For scenario: show only name field
   - Add help text explaining scenario budgets

2. **Implement Validation**
   - Validate scenario budget has no month/year
   - Validate name is required and reasonable length
   - Check name uniqueness (optional)

3. **Create Scenario Budget**
   - Call budget service with type='scenario'
   - Auto-create default categories (same as monthly)
   - Save budget with null month/year
   - Redirect to budget detail page

4. **Update Budget List**
   - Separate monthly and scenario budgets in UI
   - Show appropriate labels/icons for each type
   - Add filtering/tabs for budget types

### Service Layer

```typescript
// src/lib/server/modules/budget/service.ts
import { db } from '$lib/server/db'
import { budgets } from '$lib/server/db/schema/budgets'
import type { NewBudget } from '$lib/server/db/schema/budgets'

export async function createScenarioBudget(
  userId: string,
  name: string,
): Promise<Budget> {
  // Create scenario budget
  const [budget] = await db
    .insert(budgets)
    .values({
      userId,
      name,
      type: 'scenario',
      month: null,
      year: null,
    })
    .returning()

  // Create default categories
  await categoryService.createDefaultCategories(budget.id)

  return budget
}
```

```typescript
// src/lib/server/modules/budget/validators.ts
import { z } from 'zod'

export const createScenarioBudgetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  type: z.literal('scenario'),
})

export const createBudgetSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('monthly'),
    name: z.string().min(1).max(200),
    month: z.number().min(1).max(12),
    year: z.number().min(2000),
  }),
  z.object({
    type: z.literal('scenario'),
    name: z.string().min(1).max(200),
  }),
])
```

### UI Components

```svelte
<!-- src/routes/(app)/budgets/+page.svelte -->
<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const { form, errors, enhance } = superForm(data.form)

  let budgetType = $state<'monthly' | 'scenario'>('monthly')

  // Update form type when user changes selection
  $effect(() => {
    $form.type = budgetType
  })
</script>

<div class="budget-list-page">
  <div class="header">
    <h1>My Budgets</h1>
    <button onclick={() => (showCreateModal = true)}>Create Budget</button>
  </div>

  <div class="budget-tabs">
    <button class:active={activeTab === 'monthly'}> Monthly Budgets </button>
    <button class:active={activeTab === 'scenario'}> Scenario Budgets </button>
  </div>

  <!-- Budget lists... -->
</div>

<!-- Create Budget Modal -->
{#if showCreateModal}
  <div class="modal">
    <div class="modal-content">
      <h2>Create New Budget</h2>

      <form method="POST" action="?/create" use:enhance>
        <div class="type-selector">
          <label>
            <input
              type="radio"
              name="type"
              value="monthly"
              bind:group={budgetType}
            />
            Monthly Budget
          </label>
          <label>
            <input
              type="radio"
              name="type"
              value="scenario"
              bind:group={budgetType}
            />
            Scenario Budget
          </label>
        </div>

        {#if budgetType === 'monthly'}
          <label>
            Month
            <select name="month" bind:value={$form.month}>
              {#each Array(12) as _, i}
                <option value={i + 1}
                  >{new Date(2000, i).toLocaleString('en', {
                    month: 'long',
                  })}</option
                >
              {/each}
            </select>
          </label>
          {#if $errors.month}<span class="error">{$errors.month}</span>{/if}

          <label>
            Year
            <input
              type="number"
              name="year"
              bind:value={$form.year}
              min="2000"
            />
          </label>
          {#if $errors.year}<span class="error">{$errors.year}</span>{/if}
        {:else}
          <label>
            Budget Name
            <input
              type="text"
              name="name"
              bind:value={$form.name}
              placeholder="e.g., If I get promoted, Summer vacation"
            />
          </label>
          {#if $errors.name}<span class="error">{$errors.name}</span>{/if}

          <p class="help-text">
            Scenario budgets let you plan for hypothetical situations without
            affecting your monthly tracking.
          </p>
        {/if}

        <div class="modal-actions">
          <button type="button" onclick={() => (showCreateModal = false)}>
            Cancel
          </button>
          <button type="submit">Create Budget</button>
        </div>
      </form>
    </div>
  </div>
{/if}
```

```typescript
// src/routes/(app)/budgets/+page.server.ts
import { fail, redirect } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms/server'
import { createBudgetSchema } from '$lib/server/modules/budget/validators'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.session?.user) {
    redirect(302, '/auth/login')
  }

  const type = url.searchParams.get('type') as 'monthly' | 'scenario' | null
  const budgets = await budgetService.listBudgets(locals.session.user.id, {
    type,
  })

  const form = await superValidate(createBudgetSchema)

  return { budgets, form }
}

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const user = locals.session?.user
    if (!user) return fail(401, { message: 'Unauthorized' })

    const form = await superValidate(request, createBudgetSchema)

    if (!form.valid) {
      return fail(400, { form })
    }

    try {
      let budget
      if (form.data.type === 'monthly') {
        budget = await budgetService.createMonthlyBudget(
          user.id,
          form.data.month,
          form.data.year,
        )
      } else {
        budget = await budgetService.createScenarioBudget(
          user.id,
          form.data.name,
        )
      }

      redirect(303, `/budgets/${budget.id}`)
    } catch (error) {
      if (error.code === 'DUPLICATE_MONTHLY_BUDGET') {
        return fail(409, {
          form,
          message: 'Budget for this month already exists',
        })
      }
      throw error
    }
  },
}
```

---

## Validation & Business Rules

- **BR-2**: User can have unlimited scenario budgets
- **BR-6**: Scenario budget must NOT have month/year (must be null)
- **BR-7**: Budget name is required
- Name length: 1-200 characters
- Type must be 'scenario'

---

## Testing Checklist

- [ ] Unit tests for scenario budget creation service
- [ ] Unit tests for validation logic
- [ ] Integration test for scenario budget creation flow
- [ ] Manual testing checklist:
  - [ ] Can select "Scenario" type in create form
  - [ ] Month/year fields hidden for scenario budgets
  - [ ] Name field shown and required for scenario budgets
  - [ ] Creating scenario budget succeeds
  - [ ] Default categories created automatically
  - [ ] Redirects to budget detail page after creation
  - [ ] Scenario budgets listed separately from monthly
  - [ ] Can create multiple scenario budgets with different names
  - [ ] Month and year are null in database

---

## Dependencies

- Depends on: US-2.1 (Create Monthly Budget)
- Blocks: US-2.3 (List All Budgets), US-2.5 (Duplicate Budget)

---

## Notes

- Consider adding scenario budget templates in future (common scenarios)
- Could add optional description field for more context
- Consider allowing scenario budgets to be converted to monthly budgets
- Add icons or colors to differentiate scenario budgets visually
