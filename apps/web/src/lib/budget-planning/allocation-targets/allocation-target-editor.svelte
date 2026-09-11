<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import ConfirmDialog from '$lib/components/confirm-dialog.svelte'
  import { getFormattingLocale } from '$lib/formatting-locale'
  import { Button, buttonVariants } from '@zebabu/ui/button'
  import * as Dialog from '@zebabu/ui/dialog'
  import { Input } from '@zebabu/ui/input'
  import { toast } from 'svelte-sonner'
  import {
    superForm,
    type Infer,
    type SuperValidated,
  } from 'sveltekit-superforms'
  import { zod4 } from 'sveltekit-superforms/adapters'
  import { createAllocationTargetsSchema } from './schema'
  import type { AllocationTargetsError } from '../errors'
  import { allocationTargetsErrorMessages } from '../errors'
  import { fillMatchingAllocationTargets } from './values'

  type AllocationTargetsSchema = ReturnType<
    typeof createAllocationTargetsSchema
  >

  export type AllocationTargetEditorLabels = {
    action: string
    title: string
    description: string
    toggle: string
    confirmTitle: string
    confirmDescription: string
  }

  type Props = {
    data: SuperValidated<Infer<AllocationTargetsSchema>>
    categories: readonly { id: string; name: string }[]
    labels: AllocationTargetEditorLabels
    action: string
    error?: AllocationTargetsError
    fill?: {
      label: string
      targets: readonly { categoryId: string; value: number }[]
    }
  }

  let { data, categories, labels, action, error, fill }: Props = $props()
  let open = $state(false)
  let confirmOpen = $state(false)

  const schema = createAllocationTargetsSchema()
  const percentageFormatter = new Intl.NumberFormat(getFormattingLocale(), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })

  // svelte-ignore state_referenced_locally
  // superForm captures initial data intentionally; page invalidation refreshes it after saving.
  const form = superForm(data, {
    dataType: 'json',
    validators: zod4(schema),
    onResult: ({ result }) => {
      if (result.type !== 'success') return
      open = false
      toast.success(m.allocation_targets_save_success())
    },
  })
  const { form: formData, enhance, submitting, errors } = form

  const totalTenths = $derived(
    $formData.targets.reduce(
      (total, target) => total + Math.round(target.value * 10),
      0,
    ),
  )
  const differenceTenths = $derived(1000 - totalTenths)
  const totalValid = $derived(totalTenths === 1000)
  const totalMessage = $derived(
    differenceTenths >= 0
      ? m.allocation_targets_remaining({
          value: percentageFormatter.format(differenceTenths / 10),
        })
      : m.allocation_targets_over({
          value: percentageFormatter.format(Math.abs(differenceTenths) / 10),
        }),
  )

  function changeEnabled(event: Event) {
    if (!(event.currentTarget instanceof HTMLInputElement)) return
    if (!event.currentTarget.checked && data.data.enabled) {
      event.currentTarget.checked = true
      confirmOpen = true
      return
    }
    $formData.enabled = event.currentTarget.checked
  }

  function changeOpen(value: boolean) {
    open = value
    if (value) $formData = structuredClone(data.data)
  }

  function confirmDisable() {
    $formData.enabled = false
    $formData.targets = $formData.targets.map((target) => ({
      ...target,
      value: 0,
    }))
    confirmOpen = false
  }

  function fillTargets() {
    if (!fill) return
    $formData.targets = fillMatchingAllocationTargets(
      $formData.targets,
      fill.targets,
    )
  }
</script>

<Dialog.Root {open} onOpenChange={changeOpen}>
  <Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>
    {labels.action}
  </Dialog.Trigger>
  <Dialog.Content class="sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>{labels.title}</Dialog.Title>
      <Dialog.Description>{labels.description}</Dialog.Description>
    </Dialog.Header>

    <form method="POST" {action} use:enhance class="space-y-5">
      {#if error}
        <p class="text-destructive text-sm font-medium" role="alert">
          {allocationTargetsErrorMessages[error]()}
        </p>
      {/if}

      <label class="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={$formData.enabled}
          onchange={changeEnabled}
          class="border-input text-primary focus-visible:ring-ring/50 size-4 rounded border focus-visible:ring-[3px]"
        />
        {labels.toggle}
      </label>

      <fieldset disabled={!$formData.enabled} class="space-y-3">
        <legend class="sr-only">{labels.title}</legend>
        {#each categories as category, index (category.id)}
          <div class="grid grid-cols-[1fr_7rem] items-center gap-3">
            <label
              for="allocation-target-{category.id}"
              class="truncate text-sm"
            >
              {category.name}
            </label>
            <div class="relative">
              <Input
                id="allocation-target-{category.id}"
                type="number"
                min="0"
                max="100"
                step="0.1"
                bind:value={$formData.targets[index].value}
                aria-invalid={$errors.targets?.[index]?.value
                  ? 'true'
                  : undefined}
                aria-describedby={$errors.targets?.[index]?.value
                  ? `allocation-target-error-${category.id} allocation-total`
                  : 'allocation-total'}
                class="pr-7"
              />
              <span
                aria-hidden="true"
                class="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-sm"
                >%</span
              >
            </div>
            {#if $errors.targets?.[index]?.value}
              <p
                id="allocation-target-error-{category.id}"
                class="text-destructive col-start-2 text-sm"
                role="alert"
              >
                {$errors.targets[index].value}
              </p>
            {/if}
          </div>
        {/each}
      </fieldset>

      <p
        id="allocation-total"
        class:text-destructive={$formData.enabled && !totalValid}
        class="text-sm font-medium"
        aria-live="polite"
      >
        {totalMessage}
      </p>
      {#if fill}
        <Button
          type="button"
          variant="outline"
          disabled={!$formData.enabled}
          onclick={fillTargets}
        >
          {fill.label}
        </Button>
      {/if}
      {#if $errors.targets?._errors}
        {#each $errors.targets._errors as message (message)}
          <p class="text-destructive text-sm" role="alert">{message}</p>
        {/each}
      {/if}

      <Dialog.Footer>
        <Dialog.Close
          type="button"
          class={buttonVariants({ variant: 'outline' })}
          disabled={$submitting}
        >
          {m.allocation_targets_cancel()}
        </Dialog.Close>
        <Button
          type="submit"
          disabled={$submitting || ($formData.enabled && !totalValid)}
        >
          {$submitting
            ? m.allocation_targets_saving()
            : m.allocation_targets_save()}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

<ConfirmDialog
  open={confirmOpen}
  onOpenChange={(value) => (confirmOpen = value)}
  title={labels.confirmTitle}
  description={labels.confirmDescription}
  confirmLabel={m.allocation_targets_disable_confirm()}
  cancelLabel={m.allocation_targets_cancel()}
  onConfirm={confirmDisable}
/>
