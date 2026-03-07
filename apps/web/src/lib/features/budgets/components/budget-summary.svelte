<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import { formatDecimal } from '$lib/utils'
  import type {
    budgetCategory,
    category,
    transaction,
  } from '$lib/server/db/schema'
  import { IsMobile } from '$lib/hooks/is-mobile.svelte'
  import TrendingUpIcon from '@lucide/svelte/icons/trending-up'
  import TrendingDownIcon from '@lucide/svelte/icons/trending-down'
  import CircleCheckIcon from '@lucide/svelte/icons/circle-check'
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert'
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert'
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down'

  type BudgetCategory = typeof budgetCategory.$inferSelect & {
    category: typeof category.$inferSelect
    transactions: (typeof transaction.$inferSelect)[]
  }

  type Props = {
    budgetCategories: BudgetCategory[]
  }

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

  const balanceState = $derived.by(() => {
    if (Math.abs(balance) < 0.01) return 'zero' as const
    if (balance > 0) return 'positive' as const
    return 'negative' as const
  })

  const balanceLabel = $derived(
    balanceState === 'zero'
      ? m.budget_summary_balance_zero()
      : balanceState === 'positive'
        ? m.budget_summary_balance_unallocated()
        : m.budget_summary_balance_over(),
  )

  const balanceStyles = $derived(
    balanceState === 'zero'
      ? 'bg-emerald-500/10 border-emerald-500/30'
      : balanceState === 'positive'
        ? 'bg-amber-500/10 border-amber-500/30'
        : 'bg-destructive/10 border-destructive/30',
  )

  const balanceTextColor = $derived(
    balanceState === 'zero'
      ? 'text-emerald-600 dark:text-emerald-400'
      : balanceState === 'positive'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-destructive',
  )
</script>

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
    {#if balanceState === 'zero'}
      <CircleCheckIcon class="size-3.5 {balanceTextColor}" />
    {:else if balanceState === 'positive'}
      <TriangleAlertIcon class="size-3.5 {balanceTextColor}" />
    {:else}
      <CircleAlertIcon class="size-3.5 {balanceTextColor}" />
    {/if}
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
          {#if balanceState === 'zero'}
            <CircleCheckIcon
              class="size-4 text-emerald-600 dark:text-emerald-400"
            />
          {:else if balanceState === 'positive'}
            <TriangleAlertIcon
              class="size-4 text-amber-600 dark:text-amber-400"
            />
          {:else}
            <CircleAlertIcon class="text-destructive size-4" />
          {/if}
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
