<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import {
    currencies,
    languages,
    profileSchema,
    updatePreferences,
  } from '$lib/identity'
  import * as m from '$lib/paraglide/messages'
  import { setLocale } from '$lib/paraglide/runtime'
  import { Button } from '@zebabu/ui/button'
  import * as Card from '@zebabu/ui/card'
  import { Label } from '@zebabu/ui/label'
  import { toast } from 'svelte-sonner'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  function getInitialPreferences() {
    return data.preferences
  }

  const initialPreferences = getInitialPreferences()
  let primaryCurrency = $state(initialPreferences.primaryCurrency)
  let language = $state(initialPreferences.language)
  let saving = $state(false)

  const languageLabels = {
    en: 'English — 1,234.56',
    cs: 'Čeština — 1 234,56',
  } as const

  async function save(event: SubmitEvent) {
    event.preventDefault()
    const preferences = profileSchema.safeParse({ primaryCurrency, language })
    if (!preferences.success) {
      toast.error(m.profile_save_error())
      return
    }

    saving = true
    const saved = await updatePreferences(preferences.data)
    saving = false

    if (!saved) {
      toast.error(m.profile_save_error())
      return
    }

    await setLocale(preferences.data.language, { reload: false })
    await invalidateAll()
    toast.success(m.profile_save_success())
  }
</script>

<div class="mx-auto w-full max-w-xl">
  <Card.Root>
    <Card.Header>
      <Card.Title>{m.profile_title()}</Card.Title>
      <Card.Description>{m.profile_description()}</Card.Description>
    </Card.Header>
    <Card.Content>
      <form class="space-y-5" onsubmit={save}>
        <div class="space-y-2">
          <Label for="primary-currency">{m.profile_currency_label()}</Label>
          <select
            id="primary-currency"
            name="primaryCurrency"
            bind:value={primaryCurrency}
            class="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
          >
            {#each currencies as currency (currency)}
              <option value={currency}>{currency}</option>
            {/each}
          </select>
        </div>

        <div class="space-y-2">
          <Label for="language">{m.profile_language_label()}</Label>
          <select
            id="language"
            name="language"
            bind:value={language}
            class="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
          >
            {#each languages as option (option)}
              <option value={option}>{languageLabels[option]}</option>
            {/each}
          </select>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? m.profile_saving() : m.profile_save()}
        </Button>
      </form>
    </Card.Content>
  </Card.Root>
</div>
