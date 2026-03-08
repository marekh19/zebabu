<script lang="ts">
  import { enhance } from '$app/forms'
  import { invalidateAll } from '$app/navigation'
  import { Button } from '$lib/components/ui/button'
  import ConfirmDialog from '$lib/components/confirm-dialog.svelte'
  import DuplicateBudgetDialog from './duplicate-budget-dialog.svelte'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
  import * as m from '$lib/paraglide/messages'
  import CopyIcon from '@lucide/svelte/icons/copy'
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical'
  import Trash2Icon from '@lucide/svelte/icons/trash-2'
  import { toast } from 'svelte-sonner'
  import { cn } from '$lib/utils'
  import type { budget } from '$lib/server/db/schema'

  type Budget = typeof budget.$inferSelect

  type Props = {
    budget: Budget
    triggerSize?: 'md' | 'lg'
  }

  let { budget: b, triggerSize = 'md' }: Props = $props()

  let confirmOpen = $state(false)
  let duplicateOpen = $state(false)
  let deleting = $state(false)
  let formEl: HTMLFormElement

  function handleDelete() {
    confirmOpen = true
  }

  function handleDuplicate() {
    duplicateOpen = true
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button
        variant="ghost"
        size={triggerSize === 'md' ? 'icon' : 'icon-lg'}
        {...props}
        onclick={(e: MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <EllipsisVerticalIcon class={cn(triggerSize === 'lg' && 'size-5')} />
        <span class="sr-only">{m.budgets_actions_label()}</span>
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.Item onclick={handleDuplicate}>
      <CopyIcon />
      <span>{m.budgets_actions_duplicate()}</span>
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item variant="destructive" onclick={handleDelete}>
      <Trash2Icon />
      <span>{m.budgets_actions_delete()}</span>
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>

<DuplicateBudgetDialog
  open={duplicateOpen}
  onOpenChange={(o) => (duplicateOpen = o)}
  sourceBudget={b}
/>

<ConfirmDialog
  open={confirmOpen}
  onOpenChange={(open) => (confirmOpen = open)}
  title={m.budgets_delete_confirm_title()}
  description={m.budgets_delete_confirm_description()}
  confirmLabel={m.budgets_delete_confirm_label()}
  cancelLabel={m.budgets_delete_cancel_label()}
  loading={deleting}
  onConfirm={() => formEl.requestSubmit()}
/>

<form
  method="POST"
  action="?/delete"
  bind:this={formEl}
  aria-hidden="true"
  class="absolute"
  use:enhance={() => {
    deleting = true
    confirmOpen = false
    return async ({ result, update }) => {
      deleting = false
      if (result.type === 'success') {
        toast.success(m.budgets_delete_success())
        await invalidateAll()
      } else if (result.type === 'redirect') {
        await update()
      }
    }
  }}
>
  <input type="hidden" name="budgetId" value={b.id} />
</form>
