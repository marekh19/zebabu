<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import CreateCategoryDialog, {
    errorMessages,
  } from '$lib/features/categories/components/create-category-dialog.svelte'
  import { Badge } from '$lib/components/ui/badge'
  import { isString, isKeyOf } from 'narrowland'
  import FloatingActionButton from '$lib/components/floating-action-button.svelte'
  import { colorClasses } from '$lib/features/categories/colors'

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
    <ul class="w-full space-y-2">
      {#each data.categories as cat (cat.id)}
        <li
          class="flex items-center justify-between rounded-lg border px-4 py-3"
        >
          <span class="flex items-center gap-2 font-medium">
            <span
              class="size-3 rounded-full {colorClasses[cat.color]
                .circle} shrink-0"
            ></span>
            {cat.name}
          </span>
          <Badge variant={cat.type === 'income' ? 'default' : 'secondary'}>
            {cat.type === 'income'
              ? m.categories_type_income()
              : m.categories_type_expense()}
          </Badge>
        </li>
      {/each}
    </ul>
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
