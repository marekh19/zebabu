<script lang="ts">
  import * as m from '$lib/paraglide/messages'
  import Check from '@lucide/svelte/icons/check'
  import Circle from '@lucide/svelte/icons/circle'

  interface Props {
    password: string
  }

  const { password }: Props = $props()

  const hasMinLength = $derived(password.length >= 8)
  const hasLetter = $derived(/[a-zA-Z]/.test(password))
  const hasNumber = $derived(/\d/.test(password))
</script>

{#if password.length > 0}
  <ul class="mt-1.5 space-y-0.5 text-xs">
    <li
      class={hasMinLength
        ? 'text-green-600 dark:text-green-400'
        : 'text-muted-foreground'}
    >
      {#if hasMinLength}<Check class="inline size-3" />{:else}<Circle
          class="inline size-3"
        />{/if}
      {m.auth_validation_password_min()}
    </li>
    <li
      class={hasLetter
        ? 'text-green-600 dark:text-green-400'
        : 'text-muted-foreground'}
    >
      {#if hasLetter}<Check class="inline size-3" />{:else}<Circle
          class="inline size-3"
        />{/if}
      {m.auth_validation_password_letter()}
    </li>
    <li
      class={hasNumber
        ? 'text-green-600 dark:text-green-400'
        : 'text-muted-foreground'}
    >
      {#if hasNumber}<Check class="inline size-3" />{:else}<Circle
          class="inline size-3"
        />{/if}
      {m.auth_validation_password_number()}
    </li>
  </ul>
{/if}
