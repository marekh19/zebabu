<script module lang="ts">
  import * as m from '$lib/paraglide/messages'

  export type DuplicateBudgetError = keyof typeof duplicateErrorMessages

  export const duplicateErrorMessages = {
    duplicate_monthly: m.budgets_error_duplicate,
    duplicate_scenario: m.budgets_error_duplicate_scenario,
  } as const satisfies Record<string, () => string>
</script>

<script lang="ts">
  import { superForm, defaults } from 'sveltekit-superforms'
  import { zod4 } from 'sveltekit-superforms/adapters'
  import { toast } from 'svelte-sonner'
  import * as Dialog from '$lib/components/ui/dialog'
  import * as Form from '$lib/components/ui/form'
  import * as Select from '$lib/components/ui/select'
  import { Input } from '$lib/components/ui/input'
  import { buttonVariants } from '$lib/components/ui/button'
  import { createDuplicateBudgetSchema } from '$lib/features/budgets/schemas/duplicate-budget-schema'
  import {
    getMonthName,
    getMonthOptions,
  } from '$lib/features/budgets/utils/month-names'
  import { getYearOptions } from '$lib/features/budgets/utils/year-options'
  import type { budget } from '$lib/server/db/schema'

  type Budget = typeof budget.$inferSelect

  type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    sourceBudget: Pick<Budget, 'id' | 'type' | 'name' | 'month' | 'year'>
  }

  let { open, onOpenChange, sourceBudget }: Props = $props()

  const duplicateBudgetSchema = createDuplicateBudgetSchema()

  let duplicateError = $state<DuplicateBudgetError | undefined>(undefined)

  function isDuplicateBudgetError(
    value: unknown,
  ): value is DuplicateBudgetError {
    return typeof value === 'string' && value in duplicateErrorMessages
  }

  const form = superForm(defaults(zod4(duplicateBudgetSchema)), {
    dataType: 'json',
    validators: zod4(duplicateBudgetSchema),
    onResult({ result }) {
      if (result.type === 'redirect') {
        onOpenChange(false)
        toast.success(m.budgets_duplicate_success())
        return
      }
      if (result.type === 'failure') {
        const maybeError = result.data?.error
        if (isDuplicateBudgetError(maybeError)) {
          duplicateError = maybeError
        }
      }
    },
  })

  const { form: formData, enhance, submitting } = form

  const monthOptions = $derived(getMonthOptions())
  const yearOptions = $derived(getYearOptions())

  const isMonthly = $derived($formData.type === 'monthly')

  $effect(() => {
    if (open) {
      duplicateError = undefined
      $formData.sourceBudgetId = sourceBudget.id
      if (sourceBudget.type === 'monthly') {
        $formData.type = 'monthly'
        const sourceMonth = sourceBudget.month ?? 1
        const sourceYear = sourceBudget.year ?? new Date().getFullYear()
        if (sourceMonth === 12) {
          $formData.month = 1
          $formData.year = sourceYear + 1
        } else {
          $formData.month = sourceMonth + 1
          $formData.year = sourceYear
        }
        $formData.name = undefined
      } else {
        $formData.type = 'scenario'
        $formData.name = `${sourceBudget.name ?? ''} - Copy`
        $formData.month = undefined
        $formData.year = undefined
      }
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
      <Dialog.Title>{m.budgets_duplicate_title()}</Dialog.Title>
      <Dialog.Description
        >{m.budgets_duplicate_description()}</Dialog.Description
      >
    </Dialog.Header>

    <form method="POST" action="?/duplicate" use:enhance class="space-y-4">
      {#if duplicateError}
        <p class="text-destructive text-sm font-medium">
          {duplicateErrorMessages[duplicateError]()}
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
                if (v === 'monthly' || v === 'scenario') $formData.type = v
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
        <Dialog.Close
          type="button"
          class={buttonVariants({ variant: 'outline' })}
        >
          {m.budgets_duplicate_cancel()}
        </Dialog.Close>
        <Form.Button disabled={$submitting}>
          {$submitting
            ? m.budgets_duplicate_submitting()
            : m.budgets_duplicate_submit()}
        </Form.Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
