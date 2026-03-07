<script lang="ts">
  import LightbulbIcon from '@lucide/svelte/icons/lightbulb'
  import * as m from '$lib/paraglide/messages'
  import { getLocale } from '$lib/paraglide/runtime'
  import { resolve } from '$app/paths'
  import * as Card from '$lib/components/ui/card'
  import { ensureDefined } from 'narrowland'
  import {
    getMonthAbbrev,
    getMonthName,
  } from '$lib/features/budgets/utils/month-names'
  import type { budget } from '$lib/server/db/schema'

  type Budget = typeof budget.$inferSelect

  type Props = {
    budget: Budget
  }

  let { budget: b }: Props = $props()

  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat(getLocale(), {
      dateStyle: 'medium',
    }).format(date)
  }
</script>

<a
  href={resolve(`/budgets/${b.id}`)}
  class="focus-visible:ring-ring/50 block cursor-pointer rounded-xl outline-none focus-visible:ring-[3px]"
>
  <Card.Root
    class="gap-0 py-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
  >
    <div class="flex items-center gap-4 p-4">
      {#if b.type === 'monthly'}
        <div
          class="bg-primary/10 flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg"
        >
          <span
            class="text-[0.6rem] leading-none font-semibold tracking-wider uppercase"
          >
            {getMonthAbbrev(ensureDefined(b.month))}
          </span>
          <span class="text-lg leading-tight font-bold">
            {b.year}
          </span>
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate leading-tight font-semibold">
            {getMonthName(ensureDefined(b.month))}
            {b.year}
          </p>
          <p class="text-muted-foreground mt-1 text-xs">
            {m.budgets_card_created({ date: formatDate(b.createdAt) })}
          </p>
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
          <p class="text-muted-foreground mt-1 text-xs">
            {m.budgets_card_created({ date: formatDate(b.createdAt) })}
          </p>
        </div>
      {/if}
    </div>
  </Card.Root>
</a>
