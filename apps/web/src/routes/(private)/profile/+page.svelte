<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import {
    currencyCodes,
    currencyLabels,
    primaryCurrencySchema,
    profileSchema,
  } from '$lib/identity/currencies'
  import { updatePrimaryCurrency } from '$lib/identity/update-primary-currency'
  import * as m from '$lib/paraglide/messages'
  import { Button } from '@zebabu/ui/button'
  import * as Card from '@zebabu/ui/card'
  import * as Form from '@zebabu/ui/form'
  import * as Select from '@zebabu/ui/select'
  import { toast } from 'svelte-sonner'
  import { superForm } from 'sveltekit-superforms'
  import { zod4 } from 'sveltekit-superforms/adapters'

  let { data } = $props()

  // svelte-ignore state_referenced_locally
  // superForm captures initial data intentionally; the page invalidation refreshes it after saving.
  const form = superForm(data.form, { validators: zod4(profileSchema) })
  const { form: formData } = form

  let saving = $state(false)
  let saveError = $state(false)

  const selectedLabel = $derived(
    `${$formData.primaryCurrency} — ${currencyLabels[$formData.primaryCurrency]()}`,
  )

  async function save(event: SubmitEvent) {
    event.preventDefault()
    saveError = false
    saving = true

    const updated = await updatePrimaryCurrency(
      fetch,
      $formData.primaryCurrency,
    )
    if (!updated) {
      saveError = true
      saving = false
      return
    }

    toast.success(m.profile_currency_success())
    await invalidateAll()
    saving = false
  }

  function selectCurrency(value: string | undefined) {
    const result = primaryCurrencySchema.safeParse(value)
    if (result.success) $formData.primaryCurrency = result.data
  }
</script>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-6">
  <div>
    <h1 class="text-3xl font-bold">{m.profile_title()}</h1>
    <p class="text-muted-foreground mt-2">{m.profile_description()}</p>
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title>{m.profile_currency_title()}</Card.Title>
      <Card.Description>{m.profile_currency_description()}</Card.Description>
    </Card.Header>
    <Card.Content>
      <form onsubmit={save} class="space-y-4">
        {#if saveError}
          <p class="text-destructive text-sm font-medium" role="alert">
            {m.profile_currency_error()}
          </p>
        {/if}

        <Form.Field {form} name="primaryCurrency">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>{m.profile_currency_label()}</Form.Label>
              <Select.Root
                type="single"
                value={$formData.primaryCurrency}
                onValueChange={selectCurrency}
              >
                <Select.Trigger {...props} class="w-full">
                  {selectedLabel}
                </Select.Trigger>
                <Select.Content>
                  {#each currencyCodes as code (code)}
                    <Select.Item
                      value={code}
                      label={`${code} — ${currencyLabels[code]()}`}
                    />
                  {/each}
                </Select.Content>
              </Select.Root>
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <p class="text-muted-foreground text-sm">
          {m.profile_currency_conversion_note()}
        </p>

        <Button type="submit" disabled={saving}>
          {saving ? m.profile_currency_saving() : m.profile_currency_save()}
        </Button>
      </form>
    </Card.Content>
  </Card.Root>
</div>
