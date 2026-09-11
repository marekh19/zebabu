<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import {
    AllocationTargetEditor,
    allocationTargetsErrorMessages,
    CategoryCard,
    CreateCategoryDialog,
    createCategoryErrorMessages,
    getActionError,
  } from '$lib/budget-planning'
  import FloatingActionButton from '$lib/components/floating-action-button.svelte'

  let { data, form: actionData } = $props()

  let dialogOpen = $state(false)

  const error = $derived(
    getActionError(actionData, 'error', createCategoryErrorMessages),
  )
  const allocationError = $derived(
    getActionError(
      actionData,
      'allocationError',
      allocationTargetsErrorMessages,
    ),
  )
  const expenseCategories = $derived(
    data.categories.filter(({ type }) => type === 'expense'),
  )
</script>

<div class="flex flex-col items-start gap-6">
  <div class="flex w-full flex-wrap items-center justify-between gap-3">
    <h1 class="text-3xl font-bold">{m.categories_title()}</h1>
    <AllocationTargetEditor
      data={data.allocationForm}
      categories={expenseCategories}
      action="?/saveAllocationTargets"
      error={allocationError}
      labels={{
        action: m.allocation_targets_action(),
        title: m.allocation_targets_defaults_title(),
        description: m.allocation_targets_defaults_description(),
        toggle: m.allocation_targets_defaults_toggle(),
        confirmTitle: m.allocation_targets_defaults_disable_title(),
        confirmDescription: m.allocation_targets_defaults_disable_description(),
      }}
    />
  </div>

  {#if data.categories.length === 0}
    <p class="text-muted-foreground">{m.categories_empty_state()}</p>
  {:else}
    <div class="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {#each data.categories as cat (cat.id)}
        <CategoryCard category={cat} editForm={data.editForm} />
      {/each}
    </div>
  {/if}
</div>

<FloatingActionButton
  onclick={() => (dialogOpen = true)}
  ariaLabel={m.categories_create_fab_label()}
/>

<CreateCategoryDialog
  bind:open={dialogOpen}
  data={data.form}
  {error}
  onOpenChange={(v) => (dialogOpen = v)}
/>
