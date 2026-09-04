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
  import type {
    AvailableCategory,
    BudgetCategory,
    PlannedTransaction,
  } from '$lib/budget-planning/model'
  import type { addBudgetCategorySchema } from '../schemas/add-budget-category-schema'
  import type { Infer, SuperValidated } from 'sveltekit-superforms'
  import type {
    AddBudgetCategoryError,
    CreateTransactionError,
    UpdateTransactionError,
  } from '$lib/budget-planning/errors'
  import CreateTransactionDialog from './create-transaction-dialog.svelte'
  import type { createCreateTransactionSchema } from '../schemas/create-transaction-schema'
  import type { createUpdateTransactionSchema } from '../schemas/update-transaction-schema'
  import EditTransactionDialog from './edit-transaction-dialog.svelte'

  type Props = {
    budgetCategories: readonly BudgetCategory[]
    availableCategories: readonly AvailableCategory[]
    addCategoryForm: SuperValidated<Infer<typeof addBudgetCategorySchema>>
    addCategoryError: AddBudgetCategoryError | undefined
    createTransactionForm: SuperValidated<
      Infer<ReturnType<typeof createCreateTransactionSchema>>
    >
    createTransactionError: CreateTransactionError | undefined
    initialTransactionCategoryId: string | undefined
    updateTransactionForm: SuperValidated<
      Infer<ReturnType<typeof createUpdateTransactionSchema>>
    >
    updateTransactionError: UpdateTransactionError | undefined
    initialEditTransactionId: string | undefined
  }

  let {
    budgetCategories,
    availableCategories,
    addCategoryForm,
    addCategoryError,
    createTransactionForm,
    createTransactionError,
    initialTransactionCategoryId,
    updateTransactionForm,
    updateTransactionError,
    initialEditTransactionId,
  }: Props = $props()

  let items = $derived(budgetCategories.map((bc) => ({ ...bc })))
  let lastPersistedIds = $derived(budgetCategories.map((bc) => bc.id))

  const sensors = [PointerSensor, KeyboardSensor]

  // svelte-ignore state_referenced_locally
  // The query parameter only seeds the dialog; later selection is local UI state.
  let selectedBudgetCategory = $state(
    budgetCategories.find(({ id }) => id === initialTransactionCategoryId),
  )
  // svelte-ignore state_referenced_locally
  let transactionDialogOpen = $state(selectedBudgetCategory !== undefined)

  // svelte-ignore state_referenced_locally
  // The submitted transaction id only seeds a non-enhanced validation failure.
  let selectedTransaction = $state(
    budgetCategories
      .flatMap(({ transactions }) => transactions)
      .find(({ id }) => id === initialEditTransactionId),
  )
  // svelte-ignore state_referenced_locally
  let editDialogOpen = $state(selectedTransaction !== undefined)
  let editTrigger: HTMLElement | undefined

  function openTransactionDialog(budgetCategory: BudgetCategory) {
    selectedBudgetCategory = budgetCategory
    transactionDialogOpen = true
  }

  function openEditDialog(transaction: PlannedTransaction) {
    if (document.activeElement instanceof HTMLElement) {
      editTrigger = document.activeElement
    }
    selectedTransaction = transaction
    editDialogOpen = true
  }

  function handleEditOpenChange(open: boolean) {
    editDialogOpen = open
    if (open) return

    editTrigger?.focus()
    editTrigger = undefined
    selectedTransaction = undefined
  }

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
        <CategoryColumn
          budgetCategory={bc}
          {index}
          onAddTransaction={openTransactionDialog}
          onEditTransaction={openEditDialog}
        />
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

<CreateTransactionDialog
  bind:open={transactionDialogOpen}
  budgetCategoryId={selectedBudgetCategory?.id}
  categoryName={selectedBudgetCategory?.category.name}
  data={createTransactionForm}
  error={createTransactionError}
  onOpenChange={(open) => (transactionDialogOpen = open)}
/>

<EditTransactionDialog
  bind:open={editDialogOpen}
  transaction={selectedTransaction}
  data={updateTransactionForm}
  error={updateTransactionError}
  onOpenChange={handleEditOpenChange}
/>
