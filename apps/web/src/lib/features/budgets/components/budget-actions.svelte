<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
  import * as m from '$lib/paraglide/messages'
  import CopyIcon from '@lucide/svelte/icons/copy'
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical'
  import Trash2Icon from '@lucide/svelte/icons/trash-2'

  type Props = {
    budgetId: string
    triggerSize?: 'icon-sm' | 'icon'
  }

  let { budgetId, triggerSize = 'icon' }: Props = $props()

  function handleDuplicate() {
    // TODO: implement duplicate
    console.log('duplicate', budgetId)
  }

  function handleDelete() {
    // TODO: implement delete
    console.log('delete', budgetId)
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button
        variant="ghost"
        size={triggerSize}
        {...props}
        onclick={(e: MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <EllipsisVerticalIcon />
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
