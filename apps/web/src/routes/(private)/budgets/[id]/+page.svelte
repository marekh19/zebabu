<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import { Badge } from '$lib/components/ui/badge'
  import BudgetActions from '$lib/features/budgets/components/budget-actions.svelte'
  import BudgetBoard from '$lib/features/budgets/components/budget-board.svelte'
  import BudgetSummary from '$lib/features/budgets/components/budget-summary.svelte'
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
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <h1 class="text-2xl font-bold">{displayName}</h1>
      <Badge variant="secondary">{typeBadge}</Badge>
    </div>
    <BudgetActions triggerSize="lg" budget={data.budget} />
  </div>

  <BudgetSummary budgetCategories={data.budget.budgetCategories} />

  <BudgetBoard budgetCategories={data.budget.budgetCategories} />
</div>
