<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import {
    superForm,
    type Infer,
    type SuperValidated,
  } from 'sveltekit-superforms'
  import { zod4 } from 'sveltekit-superforms/adapters'
  import * as Dialog from '@zebabu/ui/dialog'
  import * as Form from '@zebabu/ui/form'
  import { Badge } from '@zebabu/ui/badge'
  import { Input } from '@zebabu/ui/input'
  import { buttonVariants } from '@zebabu/ui/button'
  import {
    createUpdateCategorySchema,
    type UpdateCategorySchema,
  } from '$lib/budget-planning/categories/schemas/update-category-schema'
  import {
    categoryColors,
    colorClasses,
  } from '$lib/budget-planning/categories/colors'
  import { categoryTypeLabels } from '$lib/budget-planning/categories/labels'
  import { CategoryType } from '$lib/budget-planning/categories/types'
  import { createDialogSuccessHandler } from '$lib/components/dialog-form'
  import type { Category } from '$lib/budget-planning/model'

  type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    data: SuperValidated<Infer<UpdateCategorySchema>>
    category: Category
  }

  let {
    open = $bindable(),
    onOpenChange,
    data,
    category: cat,
  }: Props = $props()

  const updateCategorySchema = createUpdateCategorySchema()

  function getSuccessMessage(): string {
    return m.categories_edit_success({ name: $formData.name })
  }

  // svelte-ignore state_referenced_locally
  // superForm captures initial data intentionally; reactivity is handled internally via use:enhance (https://github.com/sveltejs/svelte/issues/11883)
  const form = superForm(data, {
    dataType: 'json',
    validators: zod4(updateCategorySchema),
    onResult: createDialogSuccessHandler(onOpenChange, getSuccessMessage),
  })

  const { form: formData, enhance, submitting, errors } = form

  $effect(() => {
    if (open) {
      $formData.categoryId = cat.id
      $formData.name = cat.name
      $formData.color = cat.color
    }
  })

  const CATEGORY_TYPE_BADGE_VARIANT = {
    [CategoryType.Income]: 'default',
    [CategoryType.Expense]: 'secondary',
  } as const satisfies Record<CategoryType, 'default' | 'secondary'>

  const typeLabel = $derived(categoryTypeLabels[cat.type]())
</script>

<Dialog.Root {open} {onOpenChange}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{m.categories_edit_title()}</Dialog.Title>
      <Dialog.Description>{m.categories_edit_description()}</Dialog.Description>
    </Dialog.Header>

    <form method="POST" action="?/update" use:enhance class="space-y-4">
      <input type="hidden" name="categoryId" value={$formData.categoryId} />

      {#if $errors._errors}
        <p class="text-destructive text-sm font-medium">
          {$errors._errors.join(', ')}
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

      <div class="space-y-2">
        <p class="text-sm leading-none font-medium">
          {m.categories_edit_type_label()}
        </p>
        <div class="flex items-center gap-2">
          <Badge variant={CATEGORY_TYPE_BADGE_VARIANT[cat.type]}>
            {typeLabel}
          </Badge>
          <p class="text-muted-foreground text-xs">
            {m.categories_edit_type_immutable_note()}
          </p>
        </div>
      </div>

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
          {m.categories_edit_cancel()}
        </Dialog.Close>
        <Form.Button disabled={$submitting}>
          {$submitting
            ? m.categories_edit_submitting()
            : m.categories_edit_submit()}
        </Form.Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
