---
name: clean-code
description: Eliminate recurring anti-patterns in this codebase — magic strings, ternary chains, duplicated templates, type assertions, dead code, and inconsistent idioms. Refactor toward clean, readable, typesafe, maintainable code. After every changed file, run lint → format → typecheck.
---

Sharply focused on the 12 recurring anti-patterns identified in this codebase. Fix them one file at a time. After each file, validate.

## Validation (run after every changed file)

```bash
bun run lint:check && bun run format:fix && bun run typecheck
```

Note: `format:fix` must be run from the workspace root (`/apps/web/../../`), the other two from `apps/web`.

Fix any errors before moving on. Never batch-fix multiple files and validate at the end.

---

## Project rules (non-negotiable)

- **No type assertions** (`as SomeType`) — use runtime guards or narrowland instead
- **No `any`** — tighten the type or use a proper generic
- **Narrowland** for null narrowing — `ensureDefined`, `isDefined`, `assertDefined`, `isKeyOf`
- **Paraglide** for all user-visible strings — no hardcoded text in components
- **`as const satisfies Record<K, V>`** for constant lookup objects, not `: Record<K, V>`
- **`bun run db:migrate`** not `bun run db:push` for database changes

---

## Pattern 1 — Magic strings for domain types → `as const` object

Inline string literals for discriminated unions scattered across files.

```ts
// ❌ before
if (budget.type === 'monthly') ...
if (cat.type === 'income') ...
return 'positive' as const
```

```ts
// ✅ after — define once, import everywhere
export const BudgetType = { Monthly: 'monthly', Scenario: 'scenario' } as const
export type BudgetType = (typeof BudgetType)[keyof typeof BudgetType]

export const CategoryType = { Income: 'income', Expense: 'expense' } as const
export type CategoryType = (typeof CategoryType)[keyof typeof CategoryType]
```

**Seen in:** `budgets/service.ts`, `month-names.ts`, `create-budget-dialog.svelte`, `category-card.svelte`, `categories/service.ts`

---

## Pattern 2 — Ternary chain on known key → `as const satisfies` lookup map

Chained ternaries switching on the same variable.

```ts
// ❌ before
const balanceStyles = $derived(
  balanceState === 'zero' ? 'bg-emerald-500/10 ...'
    : balanceState === 'positive' ? 'bg-amber-500/10 ...'
    : 'bg-destructive/10 ...'
)
```

```ts
// ✅ after
const BALANCE_STYLES = {
  [BalanceState.Zero]: 'bg-emerald-500/10 border-emerald-500/30',
  [BalanceState.Positive]: 'bg-amber-500/10 border-amber-500/30',
  [BalanceState.Negative]: 'bg-destructive/10 border-destructive/30',
} as const satisfies Record<BalanceState, string>

const balanceStyles = $derived(BALANCE_STYLES[balanceState])
```

**Rule:** Always `as const satisfies Record<K, V>`, never `: Record<K, V>`. The `satisfies` enforces exhaustiveness; `as const` preserves literal types.

**Seen in:** `category-card.svelte`, both dialog `selectedTypeLabel` deriveds

---

## Pattern 3 — Duplicated template block → Svelte 5 snippet

Identical markup repeated N times with one varying parameter.

```svelte
<!-- ❌ before — triplicated -->
<li class={hasMinLength ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
  {#if hasMinLength}<Check class="inline size-3" />{:else}<Circle class="inline size-3" />{/if}
  {m.auth_validation_password_min()}
</li>
```

```svelte
<!-- ✅ after -->
{#snippet criterion(met: boolean, label: string)}
  <li class={met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
    {#if met}<Check class="inline size-3" />{:else}<Circle class="inline size-3" />{/if}
    {label}
  </li>
{/snippet}

{@render criterion(hasMinLength, m.auth_validation_password_min())}
{@render criterion(hasLetter, m.auth_validation_password_letter())}
{@render criterion(hasNumber, m.auth_validation_password_number())}
```

**Seen in:** `password-criteria.svelte`, `budget-card.svelte` (duplicated created-at paragraph)

---

## Pattern 4 — `$derived.by` with simple conditional → `$derived`

`$derived.by` with a plain if/else that has no side effects.

```ts
// ❌ before
const balanceState = $derived.by(() => {
  if (Math.abs(balance) < 0.01) return 'zero' as const
  if (balance > 0) return 'positive' as const
  return 'negative' as const
})
```

```ts
// ✅ after
const balanceState = $derived(
  Math.abs(balance) < BALANCE_EPSILON
    ? BalanceState.Zero
    : balance > 0
      ? BalanceState.Positive
      : BalanceState.Negative,
)
```

---

## Pattern 5 — Magic number → named constant

```ts
// ❌ before
if (Math.abs(balance) < 0.01)

// ✅ after
const BALANCE_EPSILON = 0.01
if (Math.abs(balance) < BALANCE_EPSILON)
```

---

## Pattern 6 — Repeated ownership guard → helper function

The same `not_found` / `access_denied` check duplicated across multiple service functions.

```ts
// ❌ before — repeated 4×
if (!found) return { error: 'not_found' }
if (found.userId !== userId) return { error: 'access_denied' }
```

```ts
// ✅ after
function checkOwnership(
  found: { userId: string } | null | undefined,
  userId: string,
): 'not_found' | 'access_denied' | null {
  if (!found) return 'not_found'
  if (found.userId !== userId) return 'access_denied'
  return null
}

// usage
const ownershipError = checkOwnership(found, userId)
if (ownershipError) return { error: ownershipError }
```

**Seen in:** `budgets/service.ts` (`reorderBudgetCategories`, `deleteBudget`, `getBudgetDetail`, `duplicateBudget`)

---

## Pattern 7 — Type assertion in event handler → runtime guard

`as SomeType` to silence TypeScript. Explicitly banned by project rules.

```ts
// ❌ before
onValueChange={(v) => {
  if (v) $formData.type = v as 'monthly' | 'scenario'
}}
```

```ts
// ✅ after — type predicate, no assertion
const isBudgetType = (v: string): v is BudgetType =>
  (Object.values(BudgetType) as string[]).includes(v)

onValueChange={(v) => {
  if (v && isBudgetType(v)) $formData.type = v
}}
```

**Seen in:** `create-budget-dialog.svelte:120`

---

## Pattern 8 — Dead code

```ts
// ❌ before
const localUnused = null   // never referenced

// ✅ after — delete it
```

**Seen in:** `budgets/+page.server.ts:18`

---

## Pattern 9 — Bare path string vs `resolve()`

```ts
// ❌ before
redirect(303, `/budgets/${budgetId}`)

// ✅ after
import { resolve } from '$app/paths'
redirect(303, resolve(`/budgets/${budgetId}`))
```

`resolve()` applies the SvelteKit base path, which bare strings do not.

**Seen in:** `budgets/+page.server.ts:59`

---

## Pattern 10 — Lookup map defined in load, duplicated inline in action

```ts
// ❌ before — map used in load, then re-implemented as if-chain in action
// load:
const errorStatusMap = { not_found: 404, access_denied: 403 } as const
error(errorStatusMap[result.error])
// action:
if (result.error === 'not_found') return fail(404)
if (result.error === 'access_denied') return fail(403)

// ✅ after — hoist to module scope, reuse in both
const ERROR_STATUS = {
  not_found: 404,
  access_denied: 403,
} as const satisfies Record<'not_found' | 'access_denied', number>
```

**Seen in:** `budgets/[id]/+page.server.ts`

---

## Pattern 11 — Trivial one-liner wrapper functions

Named functions that only set a single boolean state value, used only once.

```ts
// ❌ before
function handleDelete() { confirmOpen = true }
// onclick={handleDelete}

// ✅ after — inline
// onclick={() => (confirmOpen = true)}
```

**Seen in:** `budget-actions.svelte`

---

## Pattern 12 — `satisfies` without `as const` on module-level maps

Module-level error message maps use `satisfies` but not `as const`.

```ts
// ❌ before
export const errorMessages = {
  duplicate: m.categories_error_duplicate,
  unexpected: m.categories_error_unexpected,
} satisfies Record<string, () => string>

// ✅ after
export const errorMessages = {
  duplicate: m.categories_error_duplicate,
  unexpected: m.categories_error_unexpected,
} as const satisfies Record<string, () => string>
```

**Seen in:** `create-category-dialog.svelte`, `create-budget-dialog.svelte`

---

## Execution order recommendation

Fix in this order to minimise cascading changes:

1. **Pattern 1** first — define `BudgetType` and `CategoryType` const objects. This unblocks Patterns 2, 7, and 12 in downstream files.
2. **Pattern 8** — trivial dead-code delete.
3. **Pattern 9** — trivial one-liner fix.
4. **Pattern 11** — inline the wrapper functions.
5. **Pattern 12** — add `as const` to existing satisfies maps.
6. **Pattern 2 + 4 + 5** — lookup maps and derived simplifications (often in the same file, do together).
7. **Pattern 3** — snippets (touch markup, validate with svelte-autofixer).
8. **Pattern 6** — ownership guard helper in service.ts.
9. **Pattern 7** — replace type assertion once BudgetType const exists.
10. **Pattern 10** — hoist the errorStatusMap.

After each file: `bun run lint:check && bun run format:fix && bun run typecheck`.
