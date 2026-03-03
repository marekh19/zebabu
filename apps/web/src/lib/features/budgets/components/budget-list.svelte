<script lang="ts">
  import CalendarIcon from '@lucide/svelte/icons/calendar'
  import LightbulbIcon from '@lucide/svelte/icons/lightbulb'
  import * as m from '$lib/paraglide/messages'
  import * as Card from '$lib/components/ui/card'
  import { Badge } from '$lib/components/ui/badge'
  import { getMonthName } from '$lib/features/budgets/utils/month-names'
  import type { budget } from '$lib/server/db/schema'

  type Budget = typeof budget.$inferSelect

  type Props = {
    budgets: Budget[]
  }

  let { budgets }: Props = $props()

  function getBudgetDisplayName(b: Budget): string {
    if (b.type === 'monthly' && b.month && b.year) {
      return `${getMonthName(b.month)} ${b.year}`
    }
    return b.name
  }
</script>

{#if budgets.length === 0}
  <p class="text-muted-foreground text-sm">{m.budgets_empty_state()}</p>
{:else}
  <div class="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each budgets as b (b.id)}
      <Card.Root>
        <Card.Header>
          <div class="flex items-center justify-between">
            <Card.Title class="text-lg font-semibold">
              {getBudgetDisplayName(b)}
            </Card.Title>
            <Badge variant="secondary" class="gap-1">
              {#if b.type === 'monthly'}
                <CalendarIcon class="size-3" />
                {m.budgets_type_monthly()}
              {:else}
                <LightbulbIcon class="size-3" />
                {m.budgets_type_scenario()}
              {/if}
            </Badge>
          </div>
        </Card.Header>
      </Card.Root>
    {/each}
  </div>
{/if}
