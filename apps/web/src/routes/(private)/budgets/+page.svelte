<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import BudgetList from '$lib/features/budgets/components/budget-list.svelte'
  import CreateBudgetFab from '$lib/features/budgets/components/create-budget-fab.svelte'
  import CreateBudgetDialog, {
    errorMessages,
  } from '$lib/features/budgets/components/create-budget-dialog.svelte'
  import { isString, isKeyOf } from 'narrowland'

  let { data, form: actionData } = $props()

  let dialogOpen = $state(false)

  const error = $derived.by(() => {
    if (actionData == null || !('error' in actionData)) return undefined
    const value = actionData.error
    if (isString(value) && isKeyOf(value, errorMessages)) return value
    return undefined
  })
</script>

<div class="flex flex-col items-start gap-6">
  <h1 class="text-3xl font-bold">{m.budgets_title()}</h1>

  <BudgetList budgets={data.budgets} />
</div>

<CreateBudgetFab onclick={() => (dialogOpen = true)} />

<CreateBudgetDialog
  bind:open={dialogOpen}
  data={data.form}
  {error}
  onOpenChange={(v) => (dialogOpen = v)}
/>
