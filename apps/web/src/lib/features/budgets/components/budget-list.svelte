<script lang="ts">
  import CalendarIcon from '@lucide/svelte/icons/calendar'
  import LightbulbIcon from '@lucide/svelte/icons/lightbulb'
  import * as m from '$lib/paraglide/messages'
  import type { budget } from '$lib/server/db/schema'
  import BudgetSection from './budget-section.svelte'

  type Budget = typeof budget.$inferSelect

  type Props = {
    budgets: Budget[]
  }

  let { budgets }: Props = $props()

  const monthlyBudgets = $derived(budgets.filter((b) => b.type === 'monthly'))
  const scenarioBudgets = $derived(budgets.filter((b) => b.type === 'scenario'))
</script>

{#if budgets.length === 0}
  <div
    class="text-muted-foreground flex w-full flex-col items-center gap-3 py-16 text-center"
  >
    <CalendarIcon class="size-10 opacity-20" />
    <p class="text-sm">{m.budgets_empty_state()}</p>
  </div>
{:else}
  <div class="flex w-full flex-col gap-10">
    {#if monthlyBudgets.length > 0}
      <BudgetSection
        icon={CalendarIcon}
        title={m.budgets_section_monthly()}
        budgets={monthlyBudgets}
      />
    {/if}

    {#if scenarioBudgets.length > 0}
      <BudgetSection
        icon={LightbulbIcon}
        title={m.budgets_section_scenario()}
        budgets={scenarioBudgets}
      />
    {/if}
  </div>
{/if}
