<script module lang="ts">
  import * as m from '$lib/paraglide/messages'

  export type CreateBudgetError = keyof typeof errorMessages

  export const errorMessages = {
    duplicate: m.budgets_error_duplicate,
    unexpected: m.budgets_error_unexpected,
  } satisfies Record<string, () => string>
</script>

<script lang="ts">
  import {
    superForm,
    type Infer,
    type SuperValidated,
  } from 'sveltekit-superforms'
  import { zod4 } from 'sveltekit-superforms/adapters'
  import * as Dialog from '$lib/components/ui/dialog'
  import * as Form from '$lib/components/ui/form'
  import * as Select from '$lib/components/ui/select'
  import { Input } from '$lib/components/ui/input'
  import { buttonVariants } from '$lib/components/ui/button'
  import { createCreateBudgetSchema } from '$lib/features/budgets/schemas/create-budget-schema'
  import {
    getMonthName,
    getMonthOptions,
  } from '$lib/features/budgets/utils/month-names'
  import { getYearOptions } from '$lib/features/budgets/utils/year-options'

  type CreateBudgetSchema = ReturnType<typeof createCreateBudgetSchema>

  type Props = {
    open: boolean
    data: SuperValidated<Infer<CreateBudgetSchema>>
    error: CreateBudgetError | undefined
    onOpenChange: (open: boolean) => void
  }

  let { open = $bindable(), data, error, onOpenChange }: Props = $props()

  const createBudgetSchema = createCreateBudgetSchema()

  // svelte-ignore state_referenced_locally
  // superForm captures initial data intentionally; reactivity is handled internally via use:enhance (https://github.com/sveltejs/svelte/issues/11883)
  const form = superForm(data, {
    dataType: 'json',
    validators: zod4(createBudgetSchema),
    onResult({ result }) {
      if (result.type === 'success') {
        onOpenChange(false)
      }
    },
  })

  const { form: formData, enhance, submitting } = form

  const monthOptions = $derived(getMonthOptions())
  const yearOptions = $derived(getYearOptions())

  const isMonthly = $derived($formData.type === 'monthly')

  $effect(() => {
    if (open) {
      const now = new Date()
      $formData.type = 'monthly'
      $formData.month = now.getMonth() + 1
      $formData.year = now.getFullYear()
      $formData.name = undefined
    }
  })

  const selectedMonthLabel = $derived(
    $formData.month ? getMonthName($formData.month) : undefined,
  )
  const selectedYearLabel = $derived(
    $formData.year ? String($formData.year) : undefined,
  )
  const selectedTypeLabel = $derived(
    $formData.type === 'monthly'
      ? m.budgets_type_monthly()
      : $formData.type === 'scenario'
        ? m.budgets_type_scenario()
        : undefined,
  )
</script>

<Dialog.Root {open} {onOpenChange}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{m.budgets_create_title()}</Dialog.Title>
      <Dialog.Description>{m.budgets_create_description()}</Dialog.Description>
    </Dialog.Header>

    <form method="POST" action="?/create" use:enhance class="space-y-4">
      {#if error}
        <p class="text-destructive text-sm font-medium">
          {errorMessages[error]()}
        </p>
      {/if}

      <Form.Field {form} name="type">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>{m.budgets_create_type_label()}</Form.Label>
            <Select.Root
              type="single"
              value={$formData.type}
              onValueChange={(v) => {
                if (v) $formData.type = v as 'monthly' | 'scenario'
              }}
            >
              <Select.Trigger {...props} class="w-full">
                {selectedTypeLabel ?? m.budgets_create_type_placeholder()}
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="monthly" label={m.budgets_type_monthly()} />
                <Select.Item
                  value="scenario"
                  label={m.budgets_type_scenario()}
                />
              </Select.Content>
            </Select.Root>
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      {#if isMonthly}
        <Form.Field {form} name="month">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>{m.budgets_create_month_label()}</Form.Label>
              <Select.Root
                type="single"
                value={$formData.month != null
                  ? String($formData.month)
                  : undefined}
                onValueChange={(v) => {
                  if (v) $formData.month = Number(v)
                }}
              >
                <Select.Trigger {...props} class="w-full">
                  {selectedMonthLabel ?? m.budgets_create_month_placeholder()}
                </Select.Trigger>
                <Select.Content>
                  {#each monthOptions as option (option.value)}
                    <Select.Item value={option.value} label={option.label} />
                  {/each}
                </Select.Content>
              </Select.Root>
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Form.Field {form} name="year">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>{m.budgets_create_year_label()}</Form.Label>
              <Select.Root
                type="single"
                value={$formData.year != null
                  ? String($formData.year)
                  : undefined}
                onValueChange={(v) => {
                  if (v) $formData.year = Number(v)
                }}
              >
                <Select.Trigger {...props} class="w-full">
                  {selectedYearLabel ?? m.budgets_create_year_placeholder()}
                </Select.Trigger>
                <Select.Content>
                  {#each yearOptions as option (option.value)}
                    <Select.Item value={option.value} label={option.label} />
                  {/each}
                </Select.Content>
              </Select.Root>
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>
      {:else}
        <Form.Field {form} name="name">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>{m.budgets_create_name_label()}</Form.Label>
              <Input
                {...props}
                type="text"
                placeholder={m.budgets_create_name_placeholder()}
                bind:value={$formData.name}
              />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>
      {/if}

      <Dialog.Footer>
        <Dialog.Close class={buttonVariants({ variant: 'outline' })}>
          {m.budgets_create_cancel()}
        </Dialog.Close>
        <Form.Button disabled={$submitting}>
          {$submitting
            ? m.budgets_create_submitting()
            : m.budgets_create_submit()}
        </Form.Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
