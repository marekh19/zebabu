<script lang="ts">
  import LightbulbIcon from '@lucide/svelte/icons/lightbulb'
  import * as m from '$lib/paraglide/messages'
  import { resolve } from '$app/paths'
  import * as Card from '@zebabu/ui/card'
  import { getMonthName } from '$lib/budget-planning/budgets/utils/month-names'
  import { BudgetType } from '$lib/budget-planning/budgets/types'
  import type { BudgetListItem } from '$lib/budget-planning/model'
  import { formatDate, formatMonthAbbrev } from '$lib/utils'
  import BudgetActions from './budget-actions.svelte'

  type Props = {
    budget: BudgetListItem
  }

  let { budget: b }: Props = $props()
</script>

{#snippet createdAt()}
  <p class="text-muted-foreground mt-1 text-xs">
    {m.budgets_card_created({ date: formatDate(b.createdAt) })}
  </p>
{/snippet}

<a
  href={resolve(`/budgets/${b.id}`)}
  class="focus-visible:ring-ring/50 block cursor-pointer rounded-xl outline-none focus-visible:ring-[3px]"
>
  <Card.Root
    class="gap-0 py-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
  >
    <div class="flex items-center gap-4 p-4">
      {#if b.type === BudgetType.Monthly}
        <div
          class="bg-primary/10 flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg"
        >
          <span
            class="text-[0.6rem] leading-none font-semibold tracking-wider uppercase"
          >
            {formatMonthAbbrev(b.month)}
          </span>
          <span class="text-lg leading-tight font-bold">
            {b.year}
          </span>
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate leading-tight font-semibold">
            {getMonthName(b.month)}
            {b.year}
          </p>
          {@render createdAt()}
        </div>
      {:else}
        <div
          class="bg-muted flex h-14 w-14 shrink-0 items-center justify-center rounded-lg"
        >
          <LightbulbIcon class="text-muted-foreground size-5" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate leading-tight font-semibold">
            {b.name}
          </p>
          {@render createdAt()}
        </div>
      {/if}
      <BudgetActions budget={b} />
    </div>
  </Card.Root>
</a>
