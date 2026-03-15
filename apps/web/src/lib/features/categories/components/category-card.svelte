<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import * as Card from '$lib/components/ui/card'
  import { Badge } from '$lib/components/ui/badge'
  import { colorClasses } from '$lib/features/categories/colors'
  import CategoryActions from './category-actions.svelte'
  import type { category } from '$lib/server/db/schema'
  import type { Infer, SuperValidated } from 'sveltekit-superforms'
  import type { createUpdateCategorySchema } from '$lib/features/categories/schemas/update-category-schema'

  type Category = typeof category.$inferSelect
  type UpdateCategorySchema = ReturnType<typeof createUpdateCategorySchema>

  type Props = {
    category: Category
    budgetUsageCount: number
    editForm: SuperValidated<Infer<UpdateCategorySchema>>
  }

  let { category: cat, budgetUsageCount, editForm }: Props = $props()

  const usageLabel = $derived(
    budgetUsageCount === 0
      ? m.categories_usage_unused()
      : budgetUsageCount === 1
        ? m.categories_usage_one_budget()
        : m.categories_usage_budgets({ count: budgetUsageCount }),
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
        <Badge variant={cat.type === 'income' ? 'default' : 'secondary'}>
          {cat.type === 'income'
            ? m.categories_type_income()
            : m.categories_type_expense()}
        </Badge>
        <span
          class="text-xs {budgetUsageCount === 0
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
