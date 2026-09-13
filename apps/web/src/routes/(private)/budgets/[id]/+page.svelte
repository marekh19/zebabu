<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import { Badge } from '@zebabu/ui/badge'
  import {
    AllocationTargetEditor,
    AllocationComparisonChart,
    allocationTargetsErrorMessages,
    addBudgetCategoryErrorMessages,
    BudgetActions,
    BudgetBoard,
    BudgetSummary,
    createTransactionErrorMessages,
    getActionError,
    getBudgetDisplayName,
    updateTransactionErrorMessages,
  } from '$lib/budget-planning'

  let { data, form: actionData } = $props()
  let comparisonCategories = $derived(data.budget.budgetCategories)

  const addCategoryError = $derived(
    getActionError(actionData, 'error', addBudgetCategoryErrorMessages),
  )

  const displayName = $derived(getBudgetDisplayName(data.budget))

  const allocationError = $derived(
    getActionError(
      actionData,
      'allocationError',
      allocationTargetsErrorMessages,
    ),
  )
  const expenseCategories = $derived(
    data.budget.budgetCategories
      .filter(({ category }) => category.type === 'expense')
      .map(({ id, category }) => ({ id, name: category.name })),
  )

  const createTransactionError = $derived(
    getActionError(
      actionData,
      'createTransactionError',
      createTransactionErrorMessages,
    ),
  )

  const updateTransactionError = $derived(
    getActionError(
      actionData,
      'updateTransactionError',
      updateTransactionErrorMessages,
    ),
  )

  const typeBadge = $derived(
    data.budget.type === 'monthly'
      ? m.budgets_type_monthly()
      : m.budgets_type_scenario(),
  )
</script>

<div class="flex min-w-0 flex-col gap-6">
  <div class="flex items-center justify-between">
    <div class="flex flex-wrap items-center gap-3">
      <h1 class="text-2xl font-bold">{displayName}</h1>
      <Badge variant="secondary">{typeBadge}</Badge>
      <AllocationTargetEditor
        data={data.allocationForm}
        categories={expenseCategories}
        action="?/saveAllocationTargets"
        error={allocationError}
        fill={data.currentDefaultTargets.length > 0
          ? {
              label: m.allocation_targets_use_current_defaults(),
              targets: data.currentDefaultTargets,
            }
          : undefined}
        labels={{
          action: m.allocation_targets_action(),
          title: m.allocation_targets_budget_title(),
          description: m.allocation_targets_budget_description(),
          toggle: m.allocation_targets_budget_toggle(),
          confirmTitle: m.allocation_targets_budget_disable_title(),
          confirmDescription: m.allocation_targets_budget_disable_description(),
        }}
      />
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
    updateTransactionForm={actionData?.updateTransactionForm ??
      data.updateTransactionForm}
    {updateTransactionError}
    initialEditTransactionId={actionData?.updateTransactionForm?.data
      .transactionId}
    onBudgetCategoriesChange={(categories) =>
      (comparisonCategories = categories)}
  />

  <AllocationComparisonChart budgetCategories={comparisonCategories} />
</div>
