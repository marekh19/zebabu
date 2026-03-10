<script module lang="ts">
  import * as m from '$lib/paraglide/messages'

  export type CreateCategoryError = keyof typeof errorMessages

  export const errorMessages = {
    duplicate: m.categories_error_duplicate,
    unexpected: m.categories_error_unexpected,
  } satisfies Record<string, () => string>
</script>

<script lang="ts">
  import {
    superForm,
    type Infer,
    type SuperValidated,
  } from 'sveltekit-superforms'
  import { zod4 } from 'sveltekit-superforms/adapters'
  import { toast } from 'svelte-sonner'
  import * as Dialog from '$lib/components/ui/dialog'
  import * as Form from '$lib/components/ui/form'
  import * as Select from '$lib/components/ui/select'
  import { Input } from '$lib/components/ui/input'
  import { buttonVariants } from '$lib/components/ui/button'
  import { createCreateCategorySchema } from '$lib/features/categories/schemas/create-category-schema'

  type CreateCategorySchema = ReturnType<typeof createCreateCategorySchema>

  type Props = {
    open: boolean
    data: SuperValidated<Infer<CreateCategorySchema>>
    error: CreateCategoryError | undefined
    onOpenChange: (open: boolean) => void
  }

  let { open = $bindable(), data, error, onOpenChange }: Props = $props()

  const createCategorySchema = createCreateCategorySchema()

  // svelte-ignore state_referenced_locally
  // superForm captures initial data intentionally; reactivity is handled internally via use:enhance (https://github.com/sveltejs/svelte/issues/11883)
  const form = superForm(data, {
    dataType: 'json',
    validators: zod4(createCategorySchema),
    onResult({ result }) {
      if (result.type === 'success') {
        onOpenChange(false)
        toast.success(m.categories_create_success({ name: $formData.name }))
      }
    },
  })

  const { form: formData, enhance, submitting } = form

  $effect(() => {
    if (open) {
      $formData.name = ''
      $formData.type = 'expense'
    }
  })

  const selectedTypeLabel = $derived(
    $formData.type === 'income'
      ? m.categories_type_income()
      : $formData.type === 'expense'
        ? m.categories_type_expense()
        : undefined,
  )
</script>

<Dialog.Root {open} {onOpenChange}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{m.categories_create_title()}</Dialog.Title>
      <Dialog.Description
        >{m.categories_create_description()}</Dialog.Description
      >
    </Dialog.Header>

    <form method="POST" action="?/create" use:enhance class="space-y-4">
      {#if error}
        <p class="text-destructive text-sm font-medium">
          {errorMessages[error]()}
        </p>
      {/if}

      <Form.Field {form} name="name">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>{m.categories_create_name_label()}</Form.Label>
            <Input
              {...props}
              type="text"
              placeholder={m.categories_create_name_placeholder()}
              bind:value={$formData.name}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field {form} name="type">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>{m.categories_create_type_label()}</Form.Label>
            <Select.Root
              type="single"
              value={$formData.type}
              onValueChange={(v) => {
                if (v === 'income' || v === 'expense') $formData.type = v
              }}
            >
              <Select.Trigger {...props} class="w-full">
                {selectedTypeLabel}
              </Select.Trigger>
              <Select.Content>
                <Select.Item
                  value="income"
                  label={m.categories_type_income()}
                />
                <Select.Item
                  value="expense"
                  label={m.categories_type_expense()}
                />
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
          {m.categories_create_cancel()}
        </Dialog.Close>
        <Form.Button disabled={$submitting}>
          {$submitting
            ? m.categories_create_submitting()
            : m.categories_create_submit()}
        </Form.Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
