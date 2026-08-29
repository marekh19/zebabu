<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import {
    superForm,
    type Infer,
    type SuperValidated,
  } from 'sveltekit-superforms'
  import { zod4 } from 'sveltekit-superforms/adapters'
  import { toast } from 'svelte-sonner'
  import * as Dialog from '@zebabu/ui/dialog'
  import * as Form from '@zebabu/ui/form'
  import * as Select from '@zebabu/ui/select'
  import { Input } from '@zebabu/ui/input'
  import { buttonVariants } from '@zebabu/ui/button'
  import { createCreateCategorySchema } from '$lib/budget-planning/categories/schemas/create-category-schema'
  import {
    categoryColors,
    colorClasses,
  } from '$lib/budget-planning/categories/colors'
  import { CategoryType } from '$lib/budget-planning/categories/types'
  import {
    createCategoryErrorMessages,
    type CreateCategoryError,
  } from '$lib/budget-planning/errors'

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

  const CATEGORY_TYPE_LABELS = {
    [CategoryType.Income]: m.categories_type_income,
    [CategoryType.Expense]: m.categories_type_expense,
  } as const satisfies Record<CategoryType, () => string>

  $effect(() => {
    if (open) {
      $formData.name = ''
      $formData.type = CategoryType.Expense
      $formData.color = 'slate'
    }
  })

  const selectedTypeLabel = $derived(
    $formData.type ? CATEGORY_TYPE_LABELS[$formData.type]() : undefined,
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
          {createCategoryErrorMessages[error]()}
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
                if (v === CategoryType.Income || v === CategoryType.Expense)
                  $formData.type = v
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

      <Form.Field {form} name="color">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>{m.categories_create_color_label()}</Form.Label>
            <div {...props} class="flex flex-wrap gap-2" role="radiogroup">
              {#each categoryColors as color (color)}
                <button
                  type="button"
                  aria-label={color}
                  aria-checked={$formData.color === color}
                  role="radio"
                  class="size-6 rounded-full {colorClasses[color]
                    .circle} ring-offset-background focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none {$formData.color ===
                  color
                    ? 'ring-2 ring-current ring-offset-2'
                    : ''}"
                  style="color: var(--color-{color}-500)"
                  onclick={() => ($formData.color = color)}
                ></button>
              {/each}
            </div>
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
