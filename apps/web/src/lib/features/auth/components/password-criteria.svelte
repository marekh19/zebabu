<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import {
    PASSWORD_HAS_LETTER,
    PASSWORD_HAS_NUMBER,
    PASSWORD_MIN_LENGTH,
  } from '$lib/features/auth/constants/password-rules'
  import Check from '@lucide/svelte/icons/check'
  import Circle from '@lucide/svelte/icons/circle'

  type Props = {
    password: string
  }

  const { password }: Props = $props()

  const hasMinLength = $derived(password.length >= PASSWORD_MIN_LENGTH)
  const hasLetter = $derived(PASSWORD_HAS_LETTER.test(password))
  const hasNumber = $derived(PASSWORD_HAS_NUMBER.test(password))
</script>

{#snippet criterion(met: boolean, label: string)}
  <li
    class={met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}
  >
    {#if met}<Check class="inline size-3" />{:else}<Circle
        class="inline size-3"
      />{/if}
    {label}
  </li>
{/snippet}

{#if password.length > 0}
  <ul class="mt-1.5 space-y-0.5 text-xs">
    {@render criterion(hasMinLength, m.auth_validation_password_min())}
    {@render criterion(hasLetter, m.auth_validation_password_letter())}
    {@render criterion(hasNumber, m.auth_validation_password_number())}
  </ul>
{/if}
