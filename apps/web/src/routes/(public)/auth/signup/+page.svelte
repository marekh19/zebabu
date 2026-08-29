<script lang="ts">
  import { resolve } from '$app/paths'
  import { SignupForm, VerifyEmailCard } from '$lib/identity'

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
