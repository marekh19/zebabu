<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import { Button } from '@zebabu/ui/button'
  import * as DropdownMenu from '@zebabu/ui/dropdown-menu'
  import CheckIcon from '@lucide/svelte/icons/check'
  import CircleIcon from '@lucide/svelte/icons/circle'
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical'
  import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical'
  import PencilIcon from '@lucide/svelte/icons/pencil'
  import Trash2Icon from '@lucide/svelte/icons/trash-2'
  import { formatDecimal } from '$lib/utils'
  import type { PlannedTransaction } from '$lib/budget-planning/model'
  import { useSortable } from '@dnd-kit-svelte/svelte/sortable'
  import { TRANSACTION_DRAG_TYPE } from '../transaction-position'
  import { transactionCollisionPriority } from '../transaction-drag-behavior'

  type Props = {
    transaction: PlannedTransaction
    onEdit?: (transaction: PlannedTransaction, trigger: HTMLElement) => void
    onTogglePaid?: (transaction: PlannedTransaction) => void
    onDelete?: (transaction: PlannedTransaction, trigger: HTMLElement) => void
    isPaidBusy?: boolean
    budgetCategoryId?: string
    index?: number
    dragGroupId?: string
    dragDisabled?: boolean
    isOverlay?: boolean
    onDragKeyDown?: (transactionId: string, event: KeyboardEvent) => void
  }

  let {
    transaction: t,
    onEdit,
    onTogglePaid,
    onDelete,
    isPaidBusy = false,
    budgetCategoryId,
    index = 0,
    dragGroupId = '',
    dragDisabled = false,
    isOverlay = false,
    onDragKeyDown,
  }: Props = $props()
  let actionsTrigger = $state<HTMLElement | null>(null)

  const formattedAmount = $derived(formatDecimal(t.amount))
  const sortableEnabled = $derived(budgetCategoryId !== undefined && !isOverlay)
  const { ref, handleRef, isDragSource } = useSortable({
    id: () => t.id,
    index: () => index,
    group: () => dragGroupId,
    type: TRANSACTION_DRAG_TYPE,
    accept: TRANSACTION_DRAG_TYPE,
    collisionPriority: transactionCollisionPriority.item,
    disabled: () => dragDisabled || !sortableEnabled,
    register: () => sortableEnabled,
  })
  const dragging = $derived(isDragSource.current && !isOverlay)
</script>

{#snippet details()}
  <div class="min-w-0 flex-1 text-left">
    <p class="truncate text-sm">{t.name}</p>
    {#if t.note}
      <p class="text-muted-foreground truncate text-xs">{t.note}</p>
    {/if}
  </div>
  <span class="shrink-0 text-sm font-medium tabular-nums"
    >{formattedAmount}</span
  >
{/snippet}

{#if onEdit}
  <div
    class="group focus-within:bg-muted hover:bg-muted relative flex min-h-11 items-stretch rounded-md {dragging
      ? 'invisible'
      : ''} {isOverlay ? 'bg-background ring-primary/25 shadow-lg ring-2' : ''}"
    {@attach ref}
  >
    <button
      id={`transaction-drag-${t.id}`}
      type="button"
      aria-label={m.budget_detail_transaction_drag_handle({ name: t.name })}
      aria-disabled={dragDisabled}
      disabled={dragDisabled}
      onkeydowncapture={(event) => onDragKeyDown?.(t.id, event)}
      class="text-muted-foreground hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-11 w-7 shrink-0 cursor-grab items-center justify-center rounded-md border border-transparent outline-none focus-visible:ring-[3px] active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
      {@attach handleRef}
    >
      <GripVerticalIcon class="size-4" />
    </button>
    <button
      id={`transaction-${t.id}`}
      type="button"
      class="focus-visible:border-ring focus-visible:ring-ring/50 flex min-w-0 flex-1 items-center gap-2 rounded-md border border-transparent px-2 py-1.5 outline-none focus-visible:ring-[3px]"
      onclick={(event) => onEdit(t, event.currentTarget)}
    >
      {@render details()}
    </button>

    {#if onTogglePaid}
      <button
        type="button"
        role="checkbox"
        aria-checked={t.isPaid}
        aria-busy={isPaidBusy}
        aria-label={m.budget_detail_transaction_paid_toggle_label({
          transactionName: t.name,
        })}
        class="focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md border border-transparent outline-none focus-visible:ring-[3px]"
        onclick={() => onTogglePaid(t)}
      >
        {#if t.isPaid}
          <CheckIcon class="size-4 text-emerald-500" />
        {:else}
          <CircleIcon
            class="text-muted-foreground size-4 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
          />
        {/if}
      </button>
    {:else if t.isPaid}
      <CheckIcon class="my-auto size-3.5 text-emerald-500" />
    {/if}

    {#if onDelete}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger bind:ref={actionsTrigger}>
          {#snippet child({ props })}
            <Button
              class="self-center"
              variant="ghost"
              size="icon-sm"
              {...props}
            >
              <EllipsisVerticalIcon />
              <span class="sr-only">
                {m.budget_detail_transaction_actions_label({ name: t.name })}
              </span>
            </Button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Item
            onclick={() => {
              if (actionsTrigger) onEdit(t, actionsTrigger)
            }}
          >
            <PencilIcon />
            <span>{m.budget_detail_transaction_actions_edit()}</span>
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            variant="destructive"
            onclick={() => {
              if (actionsTrigger) onDelete(t, actionsTrigger)
            }}
          >
            <Trash2Icon />
            <span>{m.budget_detail_transaction_actions_delete()}</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    {/if}

    {#if dragging}
      <div
        class="border-primary/40 bg-primary/5 visible absolute inset-0 rounded-md border-2 border-dashed"
      ></div>
    {/if}
  </div>
{:else}
  <div
    class="bg-background flex min-h-11 items-center gap-2 rounded-md px-2 py-1.5 {isOverlay
      ? 'ring-primary/25 shadow-lg ring-2'
      : ''}"
  >
    {@render details()}
    {#if t.isPaid}
      <CheckIcon class="size-3.5 text-emerald-500" />
    {/if}
  </div>
{/if}
