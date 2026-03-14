<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
  import * as m from '$lib/paraglide/messages'
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical'
  import PencilIcon from '@lucide/svelte/icons/pencil'
  import Trash2Icon from '@lucide/svelte/icons/trash-2'
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
    <DropdownMenu.Item variant="destructive" disabled>
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
