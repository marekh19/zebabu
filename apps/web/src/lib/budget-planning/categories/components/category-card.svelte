<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import * as Card from '$lib/components/ui/card'
  import { Badge } from '$lib/components/ui/badge'
  import { colorClasses } from '$lib/budget-planning/categories/colors'
  import { CategoryType } from '$lib/budget-planning/categories/types'
  import CategoryActions from './category-actions.svelte'
  import type { CategoryListItem } from '$lib/budget-planning/model'
  import type { Infer, SuperValidated } from 'sveltekit-superforms'
  import type { createUpdateCategorySchema } from '$lib/budget-planning/categories/schemas/update-category-schema'

  type UpdateCategorySchema = ReturnType<typeof createUpdateCategorySchema>

  type Props = {
    category: CategoryListItem
    editForm: SuperValidated<Infer<UpdateCategorySchema>>
  }

  const CATEGORY_TYPE_BADGE_VARIANT = {
    [CategoryType.Income]: 'default',
    [CategoryType.Expense]: 'secondary',
  } as const satisfies Record<CategoryType, 'default' | 'secondary'>

  const CATEGORY_TYPE_LABELS = {
    [CategoryType.Income]: m.categories_type_income,
    [CategoryType.Expense]: m.categories_type_expense,
  } as const satisfies Record<CategoryType, () => string>

  let { category: cat, editForm }: Props = $props()

  const usageLabel = $derived(
    cat.budgetUsageCount === 0
      ? m.categories_usage_unused()
      : cat.budgetUsageCount === 1
        ? m.categories_usage_one_budget()
        : m.categories_usage_budgets({ count: cat.budgetUsageCount }),
  )
</script>

<Card.Root
  class="gap-0 py-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
>
  <div class="flex items-center gap-4 p-4">
    <div
      class="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg {colorClasses[
        cat.color
      ].header}"
    >
      <span class="size-5 rounded-full {colorClasses[cat.color].circle}"></span>
    </div>
    <div class="min-w-0 flex-1">
      <p class="truncate leading-tight font-semibold">{cat.name}</p>
      <div class="mt-1 flex items-center gap-2">
        <Badge variant={CATEGORY_TYPE_BADGE_VARIANT[cat.type]}>
          {CATEGORY_TYPE_LABELS[cat.type]()}
        </Badge>
        <span
          class="text-xs {cat.budgetUsageCount === 0
            ? 'text-muted-foreground/60'
            : 'text-muted-foreground'}"
        >
          {usageLabel}
        </span>
      </div>
    </div>
    <CategoryActions category={cat} {editForm} />
  </div>
</Card.Root>
