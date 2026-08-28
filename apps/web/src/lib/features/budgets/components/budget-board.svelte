<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import { resolve } from '$app/paths'
  import { page } from '$app/state'
  import { toast } from 'svelte-sonner'
  import CategoryColumn from './category-column.svelte'
  import AddCategoryColumn from './add-category-column.svelte'
  import {
    DragDropProvider,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
  } from '@dnd-kit-svelte/svelte'
  import { move } from '@dnd-kit/helpers'
  import type { AvailableCategory, BudgetCategory } from '../types'
  import type { addBudgetCategorySchema } from '../schemas/add-budget-category-schema'
  import type { Infer, SuperValidated } from 'sveltekit-superforms'
  import type { AddBudgetCategoryError } from './add-budget-category-dialog.svelte'

  type Props = {
    budgetCategories: BudgetCategory[]
    availableCategories: AvailableCategory[]
    addCategoryForm: SuperValidated<Infer<typeof addBudgetCategorySchema>>
    addCategoryError: AddBudgetCategoryError | undefined
  }

  let {
    budgetCategories,
    availableCategories,
    addCategoryForm,
    addCategoryError,
  }: Props = $props()

  let items = $derived(budgetCategories.map((bc) => ({ ...bc })))
  let lastPersistedIds = $derived(budgetCategories.map((bc) => bc.id))

  const sensors = [PointerSensor, KeyboardSensor]

  async function handleDragEnd(event: { canceled: boolean }) {
    if (event.canceled) return

    const currentIds = items.map((item) => item.id)

    if (currentIds.every((id, i) => lastPersistedIds[i] === id)) return

    const previousIds = lastPersistedIds
    lastPersistedIds = currentIds

    try {
      const response = await fetch(
        resolve(`/budgets/${page.params.id}/reorder`),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            items.map((item, index) => ({ id: item.id, sortOrder: index })),
          ),
        },
      )

      if (!response.ok) {
        throw new Error('Reorder failed')
      }
    } catch {
      lastPersistedIds = previousIds
      items = budgetCategories.map((bc) => ({ ...bc }))
      toast.error(m.budget_detail_reorder_error())
    }
  }

  function findItemBySourceId(sourceId: string | number) {
    return items.find((bc) => bc.id === sourceId)
  }
</script>

<div class="max-w-full snap-x snap-mandatory overflow-x-auto pb-4 sm:snap-none">
  <DragDropProvider
    {sensors}
    onDragOver={(event) => {
      items = move(items, event)
    }}
    onDragEnd={handleDragEnd}
  >
    <div class="flex gap-4">
      {#each items as bc, index (bc.id)}
        <CategoryColumn budgetCategory={bc} {index} />
      {/each}
      {#if availableCategories.length > 0}
        <AddCategoryColumn
          {availableCategories}
          {addCategoryForm}
          {addCategoryError}
        />
      {/if}
    </div>

    <DragOverlay>
      {#snippet children(source)}
        {@const item = findItemBySourceId(source.id)}
        {#if item}
          <CategoryColumn budgetCategory={item} index={0} isOverlay />
        {/if}
      {/snippet}
    </DragOverlay>
  </DragDropProvider>
</div>
