<script lang="ts">
  import CategoryColumn from './category-column.svelte'
  import type { category, transaction } from '$lib/server/db/schema'

  type Category = typeof category.$inferSelect & {
    transactions: (typeof transaction.$inferSelect)[]
  }

  type Props = {
    categories: Category[]
  }

  let { categories }: Props = $props()
</script>

<div class="overflow-x-auto pb-4">
  <div class="flex gap-4">
    {#each categories as cat (cat.id)}
      <CategoryColumn category={cat} />
    {/each}
  </div>
</div>
