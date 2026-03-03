<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import BudgetList from '$lib/features/budgets/components/budget-list.svelte'
  import CreateBudgetFab from '$lib/features/budgets/components/create-budget-fab.svelte'
  import CreateBudgetDialog from '$lib/features/budgets/components/create-budget-dialog.svelte'

  let { data, form: actionData } = $props()

  let dialogOpen = $state(false)

  const duplicateError = $derived(
    actionData != null &&
      'duplicateError' in actionData &&
      !!actionData.duplicateError,
  )
</script>

<div class="flex flex-col items-start gap-6">
  <h1 class="text-3xl font-bold">{m.budgets_title()}</h1>

  <BudgetList budgets={data.budgets} />
</div>

<CreateBudgetFab onclick={() => (dialogOpen = true)} />

<CreateBudgetDialog
  bind:open={dialogOpen}
  data={data.form}
  {duplicateError}
  onOpenChange={(v) => (dialogOpen = v)}
/>
