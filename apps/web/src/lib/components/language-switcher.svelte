<script lang="ts">
  import { getLocale, setLocale, locales } from '$lib/paraglide/runtime'
  import * as m from '$lib/paraglide/messages'
  import { Button } from '$lib/components/ui/button'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
  import GlobeIcon from '@lucide/svelte/icons/globe'
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down'

  const flags = { en: '🇬🇧', cs: '🇨🇿' } as const
  const names = {
    en: m.language_en,
    cs: m.language_cs,
  } as const

  let currentLocale = $derived(getLocale())
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
    <DropdownMenu.RadioGroup bind:value={currentLocale}>
      {#each locales as locale (locale)}
        <DropdownMenu.RadioItem
          value={locale}
          onSelect={() => setLocale(locale)}
        >
          <span>{flags[locale]}</span>
          <span>{names[locale]()}</span>
        </DropdownMenu.RadioItem>
      {/each}
    </DropdownMenu.RadioGroup>
  </DropdownMenu.Content>
</DropdownMenu.Root>
