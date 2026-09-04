<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import * as Dialog from '@zebabu/ui/dialog'
  import * as Form from '@zebabu/ui/form'
  import { buttonVariants } from '@zebabu/ui/button'
  import { Input } from '@zebabu/ui/input'
  import {
    createUpdateTransactionSchema,
    type UpdateTransactionSchema,
  } from '$lib/budget-planning/budgets/schemas/update-transaction-schema'
  import {
    updateTransactionErrorMessages,
    type UpdateTransactionError,
  } from '$lib/budget-planning/errors'
  import type { PlannedTransaction } from '$lib/budget-planning/model'
  import { createDialogSuccessHandler } from '$lib/components/dialog-form'
  import { shouldAcceptDialogOpenChange } from './transaction-dialog'
  import {
    superForm,
    type Infer,
    type SuperValidated,
  } from 'sveltekit-superforms'
  import { zod4 } from 'sveltekit-superforms/adapters'

  type Props = {
    open: boolean
    transaction: PlannedTransaction | undefined
    data: SuperValidated<Infer<UpdateTransactionSchema>>
    error: UpdateTransactionError | undefined
    onOpenChange: (open: boolean) => void
  }

  let {
    open = $bindable(),
    transaction,
    data,
    error,
    onOpenChange,
  }: Props = $props()

  const updateTransactionSchema = createUpdateTransactionSchema()
  // svelte-ignore state_referenced_locally
  // The posted flag only protects an initial non-enhanced validation result.
  let preserveInitialData = data.posted

  function getSuccessMessage(): string {
    return m.budget_detail_transaction_edit_success({ name: $formData.name })
  }

  // svelte-ignore state_referenced_locally
  // superForm captures initial data intentionally; reactivity is handled internally via use:enhance (https://github.com/sveltejs/svelte/issues/11883)
  const form = superForm(data, {
    dataType: 'json',
    validators: zod4(updateTransactionSchema),
    onResult: createDialogSuccessHandler(onOpenChange, getSuccessMessage),
  })

  const { form: formData, enhance, submitting } = form

  function handleOpenChange(nextOpen: boolean) {
    if (!shouldAcceptDialogOpenChange(nextOpen, $submitting)) return
    onOpenChange(nextOpen)
  }

  $effect(() => {
    if (!open || !transaction) return
    if (preserveInitialData && $formData.transactionId === transaction.id) {
      preserveInitialData = false
      return
    }

    $formData.transactionId = transaction.id
    $formData.name = transaction.name
    $formData.amount = Number(transaction.amount)
    $formData.isPaid = transaction.isPaid
    $formData.note = transaction.note ?? ''
  })
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{m.budget_detail_transaction_edit_title()}</Dialog.Title>
      <Dialog.Description>
        {m.budget_detail_transaction_edit_description()}
      </Dialog.Description>
    </Dialog.Header>

    <form
      method="POST"
      action="?/updateTransaction"
      use:enhance
      class="space-y-4"
    >
      <input
        type="hidden"
        name="transactionId"
        value={$formData.transactionId}
      />

      {#if error}
        <p class="text-destructive text-sm font-medium">
          {updateTransactionErrorMessages[error]()}
        </p>
      {/if}

      <Form.Field {form} name="name">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>{m.budget_detail_transaction_name_label()}</Form.Label>
            <Input
              {...props}
              autofocus
              type="text"
              placeholder={m.budget_detail_transaction_name_placeholder()}
              bind:value={$formData.name}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field {form} name="amount">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>{m.budget_detail_transaction_amount_label()}</Form.Label
            >
            <Input
              {...props}
              type="number"
              inputmode="decimal"
              min="0.01"
              max="9999999999.99"
              step="0.01"
              placeholder={m.budget_detail_transaction_amount_placeholder()}
              bind:value={$formData.amount}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field {form} name="note">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>{m.budget_detail_transaction_note_label()}</Form.Label>
            <textarea
              {...props}
              name="note"
              rows="3"
              maxlength="1000"
              placeholder={m.budget_detail_transaction_note_placeholder()}
              bind:value={$formData.note}
              class="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive min-h-20 w-full resize-y rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
            ></textarea>
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field {form} name="isPaid">
        <Form.Control>
          {#snippet children({ props })}
            <label class="flex items-center gap-2 text-sm font-medium">
              <input
                {...props}
                type="checkbox"
                bind:checked={$formData.isPaid}
                class="border-input text-primary focus-visible:ring-ring/50 size-4 rounded border focus-visible:ring-[3px]"
              />
              {m.budget_detail_transaction_paid_label()}
            </label>
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Dialog.Footer>
        <Dialog.Close
          type="button"
          class={buttonVariants({ variant: 'outline' })}
          disabled={$submitting}
        >
          {m.budget_detail_transaction_cancel()}
        </Dialog.Close>
        <Form.Button disabled={$submitting}>
          {$submitting
            ? m.budget_detail_transaction_edit_submitting()
            : m.budget_detail_transaction_edit_submit()}
        </Form.Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
