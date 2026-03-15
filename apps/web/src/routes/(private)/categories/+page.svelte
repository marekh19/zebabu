<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import CreateCategoryDialog, {
    errorMessages,
  } from '$lib/features/categories/components/create-category-dialog.svelte'
  import CategoryCard from '$lib/features/categories/components/category-card.svelte'
  import { isString, isKeyOf } from 'narrowland'
  import FloatingActionButton from '$lib/components/floating-action-button.svelte'

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
  <h1 class="text-3xl font-bold">{m.categories_title()}</h1>

  {#if data.categories.length === 0}
    <p class="text-muted-foreground">{m.categories_empty_state()}</p>
  {:else}
    <div class="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {#each data.categories as cat (cat.id)}
        <CategoryCard
          category={cat}
          budgetUsageCount={cat.budgetUsageCount}
          editForm={data.editForm}
        />
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
