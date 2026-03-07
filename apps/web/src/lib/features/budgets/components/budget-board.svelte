<script lang="ts">
  import CategoryColumn from './category-column.svelte'
  import type {
    budgetCategory,
    category,
    transaction,
  } from '$lib/server/db/schema'

  type BudgetCategory = typeof budgetCategory.$inferSelect & {
    category: typeof category.$inferSelect
    transactions: (typeof transaction.$inferSelect)[]
  }

  type Props = {
    budgetCategories: BudgetCategory[]
  }

  let { budgetCategories }: Props = $props()
</script>

<div class="overflow-x-auto pb-4">
  <div class="flex gap-4">
    {#each budgetCategories as bc (bc.id)}
      <CategoryColumn budgetCategory={bc} />
    {/each}
  </div>
</div>
