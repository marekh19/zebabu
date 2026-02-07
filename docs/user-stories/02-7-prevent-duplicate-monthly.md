# [US-2.7] Prevent Duplicate Monthly Budgets

**Epic:** Budget Management
**Priority:** P0 (MVP Critical)
**Story Points:** 1
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** be prevented from creating duplicate monthly budgets for the same month,
**So that** my budget data remains consistent and I don't accidentally create duplicates.

---

## Description

Implement validation to enforce the business rule that users can only have one monthly budget per month/year combination. This prevents data inconsistency and confusion. The validation should occur at both the database and application layers.

---

## Acceptance Criteria

- [ ] Database unique constraint on (userId, month, year)
- [ ] Validation in create budget action
- [ ] Validation in duplicate budget action
- [ ] Clear error message when attempting to create duplicate
- [ ] Error message suggests viewing existing budget
- [ ] Validation does not apply to scenario budgets
- [ ] User can create multiple scenario budgets with same name (no restriction)

---

## Technical Implementation

### Files to Modify/Create

- `src/lib/server/db/schema/budgets.ts` - Add unique constraint
- `src/lib/server/modules/budget/service.ts` - Add validation logic
- `src/lib/server/modules/budget/validators.ts` - Update validation schemas
- Database migration - Add unique constraint

### Implementation Steps

1. **Add Database Constraint**
   - Create unique index on (user_id, month, year)
   - Partial index where month and year are NOT NULL
   - Migration script to add constraint

2. **Add Application Validation**
   - Check for existing monthly budget before creation
   - Return specific error code for duplicate
   - Provide helpful error message with link to existing budget

3. **Update Error Handling**
   - Catch unique constraint violations
   - Map to user-friendly error messages
   - Include budget ID in error for navigation

4. **Test Edge Cases**
   - NULL month/year values (scenarios)
   - Different users, same month/year (should work)
   - Same user, different month/year (should work)

### Service Layer

```typescript
// src/lib/server/modules/budget/service.ts
import { db } from '$lib/server/db'
import { budgets } from '$lib/server/db/schema/budgets'
import { eq, and } from 'drizzle-orm'

export async function checkMonthlyBudgetExists(
  userId: string,
  month: number,
  year: number,
): Promise<Budget | null> {
  const existing = await db.query.budgets.findFirst({
    where: and(
      eq(budgets.userId, userId),
      eq(budgets.type, 'monthly'),
      eq(budgets.month, month),
      eq(budgets.year, year),
    ),
  })

  return existing || null
}

export async function createMonthlyBudget(
  userId: string,
  month: number,
  year: number,
): Promise<Budget> {
  // Check for existing budget
  const existing = await checkMonthlyBudgetExists(userId, month, year)
  if (existing) {
    const error: any = new Error('Budget for this month already exists')
    error.code = 'DUPLICATE_MONTHLY_BUDGET'
    error.existingBudgetId = existing.id
    throw error
  }

  // Create budget
  const name = `${new Date(year, month - 1).toLocaleString('en', { month: 'long' })} ${year}`

  const [budget] = await db
    .insert(budgets)
    .values({
      userId,
      name,
      type: 'monthly',
      month,
      year,
    })
    .returning()

  // Create default categories
  await categoryService.createDefaultCategories(budget.id)

  return budget
}
```

```typescript
// Database schema with unique constraint
// src/lib/server/db/schema/budgets.ts
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'

export const budgets = pgTable(
  'budgets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type', { enum: ['monthly', 'scenario'] }).notNull(),
    month: integer('month'),
    year: integer('year'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    uniqueMonthlyBudget: unique('unique_monthly_budget').on(
      table.userId,
      table.month,
      table.year,
    ),
  }),
)
```

### UI Components

```typescript
// src/routes/(app)/budgets/+page.server.ts
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
    } catch (error: any) {
      if (error.code === 'DUPLICATE_MONTHLY_BUDGET') {
        return fail(409, {
          form,
          message: 'A budget for this month already exists',
          existingBudgetId: error.existingBudgetId,
        })
      }
      throw error
    }
  },
}
```

```svelte
<!-- Error display in create budget modal -->
{#if form?.message}
  <div class="error-message">
    {form.message}
    {#if form.existingBudgetId}
      <a href="/budgets/{form.existingBudgetId}"> View existing budget → </a>
    {/if}
  </div>
{/if}
```

---

## Validation & Business Rules

- **BR-1**: User can only have one monthly budget per month/year
- **BR-2**: User can have unlimited scenario budgets (no uniqueness constraint)
- Validation at database level (unique constraint)
- Validation at application level (check before insert)
- Clear error messaging with navigation to existing budget

---

## Testing Checklist

- [ ] Unit tests for duplicate detection
- [ ] Unit tests for validation logic
- [ ] Integration test for duplicate creation attempt
- [ ] Database constraint test
- [ ] Manual testing checklist:
  - [ ] Cannot create two monthly budgets for same month/year
  - [ ] Error message shows when attempting duplicate
  - [ ] Link to existing budget works
  - [ ] Can create monthly budgets for different months
  - [ ] Can create scenario budgets with any name (no restriction)
  - [ ] Different users can create budgets for same month
  - [ ] Database constraint prevents duplicates even if app validation fails

---

## Dependencies

- Depends on: US-2.1 (Create Monthly Budget)
- Blocks: None

---

## Notes

- Consider allowing "replacement" of existing monthly budget
- Could add "overwrite" option with confirmation
- Future: Add audit log for budget overwrites
- Database constraint is critical backup for application validation
