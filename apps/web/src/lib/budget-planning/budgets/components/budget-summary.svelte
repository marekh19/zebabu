<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import { formatDecimal } from '$lib/utils'
  import { IsMobile } from '$lib/hooks/is-mobile.svelte'
  import TrendingUpIcon from '@lucide/svelte/icons/trending-up'
  import TrendingDownIcon from '@lucide/svelte/icons/trending-down'
  import CircleCheckIcon from '@lucide/svelte/icons/circle-check'
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert'
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert'
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down'
  import type { BudgetCategory } from '$lib/budget-planning/model'

  type Props = {
    budgetCategories: readonly BudgetCategory[]
  }

  const BalanceState = {
    Zero: 'zero',
    Positive: 'positive',
    Negative: 'negative',
  } as const

  type BalanceState = (typeof BalanceState)[keyof typeof BalanceState]

  const BALANCE_EPSILON = 0.01

  const BALANCE_STYLES = {
    [BalanceState.Zero]: 'bg-emerald-500/10 border-emerald-500/30',
    [BalanceState.Positive]: 'bg-amber-500/10 border-amber-500/30',
    [BalanceState.Negative]: 'bg-destructive/10 border-destructive/30',
  } as const satisfies Record<BalanceState, string>

  const BALANCE_TEXT_COLORS = {
    [BalanceState.Zero]: 'text-emerald-600 dark:text-emerald-400',
    [BalanceState.Positive]: 'text-amber-600 dark:text-amber-400',
    [BalanceState.Negative]: 'text-destructive',
  } as const satisfies Record<BalanceState, string>

  let { budgetCategories }: Props = $props()

  const isMobile = new IsMobile()
  let expanded = $state(false)
  const isExpanded = $derived(expanded || !isMobile.current)

  const totalIncome = $derived(
    budgetCategories
      .filter((bc) => bc.category.type === 'income')
      .flatMap((bc) => bc.transactions)
      .reduce((sum, t) => sum + Number(t.amount), 0),
  )

  const totalExpenses = $derived(
    budgetCategories
      .filter((bc) => bc.category.type === 'expense')
      .flatMap((bc) => bc.transactions)
      .reduce((sum, t) => sum + Number(t.amount), 0),
  )

  const balance = $derived(totalIncome - totalExpenses)

  const balanceState = $derived(
    Math.abs(balance) < BALANCE_EPSILON
      ? BalanceState.Zero
      : balance > 0
        ? BalanceState.Positive
        : BalanceState.Negative,
  )

  const balanceLabel = $derived(
    {
      [BalanceState.Zero]: m.budget_summary_balance_zero(),
      [BalanceState.Positive]: m.budget_summary_balance_unallocated(),
      [BalanceState.Negative]: m.budget_summary_balance_over(),
    }[balanceState],
  )

  const balanceStyles = $derived(BALANCE_STYLES[balanceState])
  const balanceTextColor = $derived(BALANCE_TEXT_COLORS[balanceState])
</script>

{#snippet balanceIcon(size: string)}
  {#if balanceState === BalanceState.Zero}
    <CircleCheckIcon class="{size} {balanceTextColor}" />
  {:else if balanceState === BalanceState.Positive}
    <TriangleAlertIcon class="{size} {balanceTextColor}" />
  {:else}
    <CircleAlertIcon class="{size} {balanceTextColor}" />
  {/if}
{/snippet}

<div>
  <button
    type="button"
    class="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 md:hidden"
    onclick={() => (expanded = !expanded)}
  >
    <span class="text-muted-foreground text-sm font-medium">
      {m.budget_summary_title()}
    </span>
    <span class="text-muted-foreground mx-0.5">·</span>
    {@render balanceIcon('size-3.5')}
    <span class="text-sm font-semibold tabular-nums {balanceTextColor}">
      {balanceLabel}
      {formatDecimal(balance)}
    </span>
    <ChevronDownIcon
      class="text-muted-foreground ml-auto size-4 transition-transform duration-200
        {expanded ? 'rotate-180' : ''}"
    />
  </button>

  {#if isExpanded}
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div class="bg-card flex items-center gap-3 rounded-lg border p-4">
        <div class="rounded-md bg-emerald-500/10 p-2">
          <TrendingUpIcon
            class="size-4 text-emerald-600 dark:text-emerald-400"
          />
        </div>
        <div>
          <p class="text-muted-foreground text-xs font-medium">
            {m.budget_summary_income()}
          </p>
          <p
            class="text-lg font-bold text-emerald-600 tabular-nums dark:text-emerald-400"
          >
            {formatDecimal(totalIncome)}
          </p>
        </div>
      </div>

      <div class="bg-card flex items-center gap-3 rounded-lg border p-4">
        <div class="bg-muted rounded-md p-2">
          <TrendingDownIcon class="text-muted-foreground size-4" />
        </div>
        <div>
          <p class="text-muted-foreground text-xs font-medium">
            {m.budget_summary_expenses()}
          </p>
          <p class="text-muted-foreground text-lg font-bold tabular-nums">
            {formatDecimal(totalExpenses)}
          </p>
        </div>
      </div>

      <div
        class="flex items-center gap-3 rounded-lg border p-4 {balanceStyles}"
      >
        <div class="bg-background/50 rounded-md p-2">
          {@render balanceIcon('size-4')}
        </div>
        <div>
          <p class="text-muted-foreground text-xs font-medium">
            {balanceLabel}
          </p>
          <p class="text-lg font-bold tabular-nums {balanceTextColor}">
            {formatDecimal(balance)}
          </p>
        </div>
      </div>
    </div>
  {/if}
</div>
