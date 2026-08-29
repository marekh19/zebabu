<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import {
    BudgetList,
    CreateBudgetDialog,
    createBudgetErrorMessages,
    getActionError,
  } from '$lib/budget-planning'
  import FloatingActionButton from '$lib/components/floating-action-button.svelte'

  let { data, form: actionData } = $props()

  let dialogOpen = $state(false)

  const error = $derived(
    getActionError(actionData, 'error', createBudgetErrorMessages),
  )
</script>

<div class="flex flex-col items-start gap-6">
  <h1 class="text-3xl font-bold">{m.budgets_title()}</h1>

  <BudgetList budgets={data.budgets} />
</div>

<FloatingActionButton
  onclick={() => (dialogOpen = true)}
  ariaLabel={m.budgets_create_fab_label()}
/>

<CreateBudgetDialog
  bind:open={dialogOpen}
  data={data.form}
  {error}
  onOpenChange={(v) => (dialogOpen = v)}
/>
