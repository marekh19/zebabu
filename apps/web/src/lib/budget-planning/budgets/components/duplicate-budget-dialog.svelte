<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import { superForm, defaults } from 'sveltekit-superforms'
  import { zod4 } from 'sveltekit-superforms/adapters'
  import { toast } from 'svelte-sonner'
  import * as Dialog from '$lib/components/ui/dialog'
  import * as Form from '$lib/components/ui/form'
  import * as Select from '$lib/components/ui/select'
  import { Input } from '$lib/components/ui/input'
  import { buttonVariants } from '$lib/components/ui/button'
  import { createDuplicateBudgetSchema } from '$lib/budget-planning/budgets/schemas/duplicate-budget-schema'
  import {
    getMonthName,
    getMonthOptions,
  } from '$lib/budget-planning/budgets/utils/month-names'
  import { getYearOptions } from '$lib/budget-planning/budgets/utils/year-options'
  import { BudgetType } from '$lib/budget-planning/budgets/types'
  import {
    duplicateBudgetErrorMessages,
    type DuplicateBudgetError,
  } from '$lib/budget-planning/errors'
  import type { BudgetReference } from '$lib/budget-planning/model'

  type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    sourceBudget: BudgetReference
  }

  let { open, onOpenChange, sourceBudget }: Props = $props()

  const duplicateBudgetSchema = createDuplicateBudgetSchema()

  let duplicateError = $state<DuplicateBudgetError | undefined>(undefined)

  function isDuplicateBudgetError(
    value: unknown,
  ): value is DuplicateBudgetError {
    return typeof value === 'string' && value in duplicateBudgetErrorMessages
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

  const BUDGET_TYPE_LABELS = {
    [BudgetType.Monthly]: m.budgets_type_monthly,
    [BudgetType.Scenario]: m.budgets_type_scenario,
  } as const satisfies Record<BudgetType, () => string>

  const isMonthly = $derived($formData.type === BudgetType.Monthly)

  $effect(() => {
    if (open) {
      duplicateError = undefined
      $formData.sourceBudgetId = sourceBudget.id
      if (sourceBudget.type === BudgetType.Monthly) {
        $formData.type = BudgetType.Monthly
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
        $formData.type = BudgetType.Scenario
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
    $formData.type ? BUDGET_TYPE_LABELS[$formData.type]() : undefined,
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
          {duplicateBudgetErrorMessages[duplicateError]()}
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
                if (v === BudgetType.Monthly || v === BudgetType.Scenario)
                  $formData.type = v
              }}
            >
              <Select.Trigger {...props} class="w-full">
                {selectedTypeLabel ?? m.budgets_create_type_placeholder()}
              </Select.Trigger>
              <Select.Content>
                <Select.Item
                  value={BudgetType.Monthly}
                  label={m.budgets_type_monthly()}
                />
                <Select.Item
                  value={BudgetType.Scenario}
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
