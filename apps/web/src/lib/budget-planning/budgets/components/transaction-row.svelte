<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import { Button } from '@zebabu/ui/button'
  import * as DropdownMenu from '@zebabu/ui/dropdown-menu'
  import CheckIcon from '@lucide/svelte/icons/check'
  import CircleIcon from '@lucide/svelte/icons/circle'
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical'
  import PencilIcon from '@lucide/svelte/icons/pencil'
  import Trash2Icon from '@lucide/svelte/icons/trash-2'
  import { formatDecimal } from '$lib/utils'
  import type { PlannedTransaction } from '$lib/budget-planning/model'

  type Props = {
    transaction: PlannedTransaction
    onEdit?: (transaction: PlannedTransaction, trigger: HTMLElement) => void
    onTogglePaid?: (transaction: PlannedTransaction) => void
    onDelete?: (transaction: PlannedTransaction, trigger: HTMLElement) => void
    isPaidBusy?: boolean
  }

  let {
    transaction: t,
    onEdit,
    onTogglePaid,
    onDelete,
    isPaidBusy = false,
  }: Props = $props()
  let actionsTrigger = $state<HTMLElement | null>(null)

  const formattedAmount = $derived(formatDecimal(t.amount))
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
    class="group focus-within:bg-muted hover:bg-muted flex min-h-11 items-stretch rounded-md"
  >
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
  </div>
{:else}
  <div class="flex min-h-11 items-center gap-2 rounded-md px-2 py-1.5">
    {@render details()}
    {#if t.isPaid}
      <CheckIcon class="size-3.5 text-emerald-500" />
    {/if}
  </div>
{/if}
