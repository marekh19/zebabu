<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import {
    updatePreferences,
    type Language,
    type ProfilePreferences,
  } from '$lib/identity'
  import { getLocale, setLocale, locales } from '$lib/paraglide/runtime'
  import * as m from '$lib/paraglide/messages'
  import { Button } from '@zebabu/ui/button'
  import * as DropdownMenu from '@zebabu/ui/dropdown-menu'
  import GlobeIcon from '@lucide/svelte/icons/globe'
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down'
  import { toast } from 'svelte-sonner'

  type Props = { preferences?: ProfilePreferences }

  let { preferences }: Props = $props()

  const names = {
    en: m.language_en,
    cs: m.language_cs,
  } as const

  let currentLocale = $state(getLocale())
  let changing = $state(false)

  async function selectLanguage(language: Language) {
    if (language === currentLocale || changing) return

    if (!preferences) {
      currentLocale = language
      await setLocale(language)
      return
    }

    changing = true
    const saved = await updatePreferences({
      primaryCurrency: preferences.primaryCurrency,
      language,
    })

    if (!saved) {
      changing = false
      toast.error(m.profile_save_error())
      return
    }

    currentLocale = language
    await setLocale(language, { reload: false })
    await invalidateAll()
    changing = false
    toast.success(m.profile_save_success())
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button variant="ghost" size="sm" {...props}>
        <GlobeIcon class="inline-block size-4" />
        <span class="sr-only">{m.language_en()}</span>
        <ChevronDownIcon class="size-3 opacity-50" />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.RadioGroup value={currentLocale}>
      {#each locales as locale (locale)}
        <DropdownMenu.RadioItem
          value={locale}
          disabled={changing}
          onSelect={() => selectLanguage(locale)}
        >
          <span>{names[locale]()}</span>
        </DropdownMenu.RadioItem>
      {/each}
    </DropdownMenu.RadioGroup>
  </DropdownMenu.Content>
</DropdownMenu.Root>
