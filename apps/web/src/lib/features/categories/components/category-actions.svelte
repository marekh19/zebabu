<script lang="ts">
  import { enhance } from '$app/forms'
  import { invalidateAll } from '$app/navigation'
  import { Button } from '$lib/components/ui/button'
  import ConfirmDialog from '$lib/components/confirm-dialog.svelte'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
  import * as m from '$lib/paraglide/messages'
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical'
  import PencilIcon from '@lucide/svelte/icons/pencil'
  import Trash2Icon from '@lucide/svelte/icons/trash-2'
  import { toast } from 'svelte-sonner'
  import EditCategoryDialog from './edit-category-dialog.svelte'
  import type { category } from '$lib/server/db/schema'
  import type { Infer, SuperValidated } from 'sveltekit-superforms'
  import type { createUpdateCategorySchema } from '$lib/features/categories/schemas/update-category-schema'

  type Category = typeof category.$inferSelect
  type UpdateCategorySchema = ReturnType<typeof createUpdateCategorySchema>

  type Props = {
    category: Category
    editForm: SuperValidated<Infer<UpdateCategorySchema>>
  }

  let { category: cat, editForm }: Props = $props()

  let editOpen = $state(false)
  let confirmOpen = $state(false)
  let deleting = $state(false)
  let formEl: HTMLFormElement

  const typeLabel = $derived(
    cat.type === 'income'
      ? m.categories_type_income()
      : m.categories_type_expense(),
  )

  function deleteErrorMessage(error: unknown): string {
    switch (error) {
      case 'last_of_type':
        return m.categories_error_last_of_type({ type: typeLabel })
      case 'in_use':
        return m.categories_error_in_use()
      default:
        return m.categories_error_unexpected()
    }
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button
        variant="ghost"
        size="icon"
        {...props}
        onclick={(e: MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <EllipsisVerticalIcon />
        <span class="sr-only">{m.categories_actions_label()}</span>
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.Item onclick={() => (editOpen = true)}>
      <PencilIcon />
      <span>{m.categories_actions_edit()}</span>
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item
      variant="destructive"
      onclick={() => (confirmOpen = true)}
    >
      <Trash2Icon />
      <span>{m.categories_actions_delete()}</span>
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>

<EditCategoryDialog
  open={editOpen}
  onOpenChange={(o) => (editOpen = o)}
  data={editForm}
  category={cat}
/>

<ConfirmDialog
  open={confirmOpen}
  onOpenChange={(open) => (confirmOpen = open)}
  title={m.categories_delete_confirm_title()}
  description={m.categories_delete_confirm_description({ name: cat.name })}
  confirmLabel={m.categories_delete_confirm_label()}
  cancelLabel={m.categories_delete_cancel_label()}
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
        toast.success(m.categories_delete_success())
        await invalidateAll()
        return
      }
      if (result.type === 'failure') {
        toast.error(deleteErrorMessage(result.data?.error))
        return
      }
      await update()
    }
  }}
>
  <input type="hidden" name="categoryId" value={cat.id} />
</form>
