<script lang="ts">
  import type { Component } from 'svelte'
  import type { BudgetListItem } from '$lib/budget-planning/model'
  import BudgetCard from './budget-card.svelte'

  type Props = {
    icon: Component<{ class?: string }>
    title: string
    budgets: readonly BudgetListItem[]
  }

  let { icon: Icon, title, budgets }: Props = $props()
</script>

<section class="flex flex-col gap-4">
  <div class="flex items-center gap-3">
    <Icon class="text-muted-foreground size-4" />
    <h2
      class="text-muted-foreground text-xs font-medium tracking-widest uppercase"
    >
      {title}
    </h2>
    <div class="bg-border h-px flex-1"></div>
  </div>

  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
    {#each budgets as b (b.id)}
      <BudgetCard budget={b} />
    {/each}
  </div>
</section>
