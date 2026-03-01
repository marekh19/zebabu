<script lang="ts">
  import { resolve } from '$app/paths'
  import SignupForm from '$lib/features/auth/components/signup-form.svelte'
  import VerifyEmailCard from '$lib/features/auth/components/verify-email-card.svelte'

  let signupEmail = $state('')

  const callbackURL = $derived(
    `${resolve('/auth/login')}?email=${encodeURIComponent(signupEmail)}`,
  )
</script>

{#if signupEmail}
  <VerifyEmailCard email={signupEmail} {callbackURL} />
{:else}
  <SignupForm onSuccess={(email) => (signupEmail = email)} />
{/if}
