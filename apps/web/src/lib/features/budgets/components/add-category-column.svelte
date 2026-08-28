<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import PlusIcon from '@lucide/svelte/icons/plus'
  import AddBudgetCategoryDialog from './add-budget-category-dialog.svelte'
  import type { AvailableCategory } from '../types'
  import type { addBudgetCategorySchema } from '$lib/features/budgets/schemas/add-budget-category-schema'
  import type { Infer, SuperValidated } from 'sveltekit-superforms'

  type Props = {
    availableCategories: AvailableCategory[]
    addCategoryForm: SuperValidated<Infer<typeof addBudgetCategorySchema>>
  }

  let { availableCategories, addCategoryForm }: Props = $props()

  let open = $state(false)
</script>

<div class="w-70 shrink-0">
  <button
    type="button"
    class="border-primary/40 bg-primary/5 hover:border-primary/60 hover:bg-primary/10 flex h-full min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors"
    onclick={() => (open = true)}
    aria-label={m.budget_detail_add_category()}
  >
    <PlusIcon class="text-primary/60 size-6" />
    <span class="text-primary/60 text-sm font-medium"
      >{m.budget_detail_add_category()}</span
    >
  </button>
</div>

<AddBudgetCategoryDialog
  {open}
  data={addCategoryForm}
  categories={availableCategories}
  onOpenChange={(v) => (open = v)}
/>
