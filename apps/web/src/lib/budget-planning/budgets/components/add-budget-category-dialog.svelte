<script module lang="ts">
  import * as m from '$lib/paraglide/messages'

  export type AddBudgetCategoryError = keyof typeof errorMessages

  export const errorMessages = {
    not_found: m.budget_detail_add_category_error_not_found,
    unexpected: m.budget_detail_add_category_error_unexpected,
  } as const satisfies Record<string, () => string>
</script>

<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog'
  import * as Form from '$lib/components/ui/form'
  import * as Select from '$lib/components/ui/select'
  import { buttonVariants } from '$lib/components/ui/button'
  import { addBudgetCategorySchema } from '$lib/budget-planning/budgets/schemas/add-budget-category-schema'
  import type { AvailableCategory } from '../types'
  import { toast } from 'svelte-sonner'
  import {
    superForm,
    type Infer,
    type SuperValidated,
  } from 'sveltekit-superforms'
  import { zod4 } from 'sveltekit-superforms/adapters'

  type Props = {
    open: boolean
    data: SuperValidated<Infer<typeof addBudgetCategorySchema>>
    categories: AvailableCategory[]
    error: AddBudgetCategoryError | undefined
    onOpenChange: (open: boolean) => void
  }

  let {
    open = $bindable(),
    data,
    categories,
    error,
    onOpenChange,
  }: Props = $props()

  // svelte-ignore state_referenced_locally
  const form = superForm(data, {
    dataType: 'json',
    validators: zod4(addBudgetCategorySchema),
    onResult({ result }) {
      if (result.type === 'success') {
        onOpenChange(false)
        toast.success(m.budget_detail_add_category_success())
      }
    },
  })

  const { form: formData, enhance, submitting } = form

  const selectedLabel = $derived(
    categories.find((c) => c.id === $formData.categoryId)?.name,
  )

  $effect(() => {
    if (open) {
      $formData.categoryId = ''
    }
  })
</script>

<Dialog.Root {open} {onOpenChange}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{m.budget_detail_add_category_title()}</Dialog.Title>
      <Dialog.Description
        >{m.budget_detail_add_category_description()}</Dialog.Description
      >
    </Dialog.Header>

    <form method="POST" action="?/addCategory" use:enhance class="space-y-4">
      {#if error}
        <p class="text-destructive text-sm font-medium">
          {errorMessages[error]()}
        </p>
      {/if}

      <Form.Field {form} name="categoryId">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>{m.budget_detail_add_category_label()}</Form.Label>
            <Select.Root
              type="single"
              value={$formData.categoryId || undefined}
              onValueChange={(v) => {
                if (v) $formData.categoryId = v
              }}
            >
              <Select.Trigger {...props} class="w-full">
                {selectedLabel ?? m.budget_detail_add_category_placeholder()}
              </Select.Trigger>
              <Select.Content>
                {#each categories as cat (cat.id)}
                  <Select.Item value={cat.id} label={cat.name} />
                {/each}
              </Select.Content>
            </Select.Root>
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Dialog.Footer>
        <Dialog.Close
          type="button"
          class={buttonVariants({ variant: 'outline' })}
        >
          {m.budget_detail_add_category_cancel()}
        </Dialog.Close>
        <Form.Button disabled={$submitting}>
          {$submitting
            ? m.budget_detail_add_category_submitting()
            : m.budget_detail_add_category_submit()}
        </Form.Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
