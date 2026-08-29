<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import { Badge } from '$lib/components/ui/badge'
  import {
    addBudgetCategoryErrorMessages,
    BudgetActions,
    BudgetBoard,
    BudgetSummary,
    createTransactionErrorMessages,
    getBudgetDisplayName,
  } from '$lib/budget-planning'
  import { isKeyOf, isString } from 'narrowland'

  let { data, form: actionData } = $props()

  const addCategoryError = $derived.by(() => {
    if (actionData == null || !('error' in actionData)) return undefined
    const value = actionData.error
    if (isString(value) && isKeyOf(value, addBudgetCategoryErrorMessages))
      return value
    return undefined
  })

  const displayName = $derived(getBudgetDisplayName(data.budget))

  const createTransactionError = $derived.by(() => {
    if (actionData == null || !('createTransactionError' in actionData))
      return undefined
    const value = actionData.createTransactionError
    if (isString(value) && isKeyOf(value, createTransactionErrorMessages))
      return value
    return undefined
  })

  const typeBadge = $derived(
    data.budget.type === 'monthly'
      ? m.budgets_type_monthly()
      : m.budgets_type_scenario(),
  )
</script>

<div class="flex min-w-0 flex-col gap-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <h1 class="text-2xl font-bold">{displayName}</h1>
      <Badge variant="secondary">{typeBadge}</Badge>
    </div>
    <BudgetActions triggerSize="lg" budget={data.budget} />
  </div>

  <BudgetSummary budgetCategories={data.budget.budgetCategories} />

  <BudgetBoard
    budgetCategories={data.budget.budgetCategories}
    availableCategories={data.availableCategories}
    addCategoryForm={data.addCategoryForm}
    {addCategoryError}
    createTransactionForm={data.createTransactionForm}
    {createTransactionError}
    initialTransactionCategoryId={data.createTransactionCategoryId}
  />
</div>
