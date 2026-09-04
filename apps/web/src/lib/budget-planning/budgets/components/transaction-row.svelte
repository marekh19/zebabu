<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import { Button } from '@zebabu/ui/button'
  import * as DropdownMenu from '@zebabu/ui/dropdown-menu'
  import CheckIcon from '@lucide/svelte/icons/check'
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical'
  import PencilIcon from '@lucide/svelte/icons/pencil'
  import Trash2Icon from '@lucide/svelte/icons/trash-2'
  import { formatDecimal } from '$lib/utils'
  import type { PlannedTransaction } from '$lib/budget-planning/model'

  type Props = {
    transaction: PlannedTransaction
    onEdit?: (transaction: PlannedTransaction, trigger: HTMLElement) => void
    onDelete?: (transaction: PlannedTransaction, trigger: HTMLElement) => void
  }

  let { transaction: t, onEdit, onDelete }: Props = $props()
  let actionsTrigger = $state<HTMLElement | null>(null)

  const formattedAmount = $derived(formatDecimal(t.amount))
</script>

{#snippet content()}
  <div class="min-w-0 flex-1 text-left">
    <p class="truncate text-sm">{t.name}</p>
    {#if t.note}
      <p class="text-muted-foreground truncate text-xs">{t.note}</p>
    {/if}
  </div>
  <div class="flex shrink-0 items-center gap-1.5">
    <span class="text-sm font-medium tabular-nums">{formattedAmount}</span>
    {#if t.isPaid}
      <CheckIcon class="size-3.5 text-emerald-500" />
    {/if}
  </div>
{/snippet}

{#if onEdit}
  <div class="flex min-h-11 items-center rounded-md">
    <button
      id={`transaction-${t.id}`}
      type="button"
      class="hover:bg-muted focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-md border border-transparent px-2 py-1.5 outline-none focus-visible:ring-[3px]"
      onclick={(event) => onEdit(t, event.currentTarget)}
    >
      {@render content()}
    </button>

    {#if onDelete}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger bind:ref={actionsTrigger}>
          {#snippet child({ props })}
            <Button variant="ghost" size="icon-sm" {...props}>
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
    {@render content()}
  </div>
{/if}
