<script lang="ts">
  import { resolve } from '$app/paths'
  import * as m from '$lib/paraglide/messages'
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left'
  import { Badge } from '$lib/components/ui/badge'
  import BudgetBoard from '$lib/features/budgets/components/budget-board.svelte'
  import { getBudgetDisplayName } from '$lib/features/budgets/utils/month-names'

  let { data } = $props()

  const displayName = $derived(getBudgetDisplayName(data.budget))

  const typeBadge = $derived(
    data.budget.type === 'monthly'
      ? m.budgets_type_monthly()
      : m.budgets_type_scenario(),
  )
</script>

<div class="flex flex-col gap-6">
  <div class="flex items-center gap-3">
    <a
      href={resolve('/budgets')}
      class="text-muted-foreground hover:text-foreground transition-colors"
      aria-label={m.budget_detail_back()}
    >
      <ArrowLeftIcon class="size-5" />
    </a>
    <h1 class="text-2xl font-bold">{displayName}</h1>
    <Badge variant="secondary">{typeBadge}</Badge>
  </div>

  <BudgetBoard categories={data.budget.categories} />
</div>
