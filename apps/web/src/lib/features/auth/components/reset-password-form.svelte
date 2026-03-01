<script lang="ts">
  import { defaults, superForm } from 'sveltekit-superforms'
  import { zod4 } from 'sveltekit-superforms/adapters'
  import * as m from '$lib/paraglide/messages'
  import { authClient } from '$lib/auth/client'
  import { getAuthError } from '$lib/features/auth/utils/auth-errors'
  import { createResetPasswordSchema } from '$lib/features/auth/schemas/reset-password-schema'
  import PasswordCriteria from '$lib/features/auth/components/password-criteria.svelte'
  import * as Card from '$lib/components/ui/card'
  import * as Form from '$lib/components/ui/form'
  import { Input } from '$lib/components/ui/input'
  import { resolve } from '$app/paths'
  import { page } from '$app/state'

  const token = $derived(page.url.searchParams.get('token'))
  const tokenError = $derived(
    page.url.searchParams.get('error') === 'INVALID_TOKEN',
  )

  let serverError = $state('')
  let success = $state(false)

  const resetPasswordSchema = createResetPasswordSchema()
  const form = superForm(defaults(zod4(resetPasswordSchema)), {
    SPA: true,
    validators: zod4(resetPasswordSchema),
    async onUpdate({ form: updatedForm }) {
      if (!updatedForm.valid || !token) return

      serverError = ''

      const { error } = await authClient.resetPassword({
        newPassword: updatedForm.data.password,
        token,
      })

      if (error) {
        serverError = getAuthError(error.code ?? '')
        return
      }

      success = true
    },
  })

  const { form: formData, enhance, submitting } = form
</script>

{#if success}
  <Card.Root class="w-full max-w-md">
    <Card.Header>
      <Card.Title class="text-2xl">{m.reset_password_title()}</Card.Title>
      <Card.Description>{m.reset_password_success()}</Card.Description>
    </Card.Header>
    <Card.Content>
      <p class="text-muted-foreground text-center text-sm">
        <a
          href={resolve('/auth/login')}
          class="text-primary underline-offset-4 hover:underline"
        >
          {m.forgot_password_back_to_login()}
        </a>
      </p>
    </Card.Content>
  </Card.Root>
{:else if tokenError || !token}
  <Card.Root class="w-full max-w-md">
    <Card.Header>
      <Card.Title class="text-2xl">{m.reset_password_title()}</Card.Title>
    </Card.Header>
    <Card.Content class="space-y-4">
      <p class="text-destructive text-sm font-medium">
        {m.reset_password_invalid_token()}
      </p>
      <p class="text-muted-foreground text-center text-sm">
        <a
          href={resolve('/auth/forgot-password')}
          class="text-primary underline-offset-4 hover:underline"
        >
          {m.reset_password_back_to_forgot()}
        </a>
      </p>
    </Card.Content>
  </Card.Root>
{:else}
  <Card.Root class="w-full max-w-md">
    <Card.Header>
      <Card.Title class="text-2xl">{m.reset_password_title()}</Card.Title>
      <Card.Description>{m.reset_password_description()}</Card.Description>
    </Card.Header>
    <Card.Content>
      <form method="POST" use:enhance class="space-y-4">
        {#if serverError}
          <p class="text-destructive text-sm font-medium">{serverError}</p>
        {/if}

        <Form.Field {form} name="password">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>{m.reset_password_password_label()}</Form.Label>
              <Input
                {...props}
                type="password"
                placeholder={m.reset_password_password_placeholder()}
                bind:value={$formData.password}
              />
            {/snippet}
          </Form.Control>
          <PasswordCriteria password={$formData.password} />
          <Form.FieldErrors />
        </Form.Field>

        <Form.Field {form} name="confirmPassword">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>{m.reset_password_confirm_label()}</Form.Label>
              <Input
                {...props}
                type="password"
                placeholder={m.reset_password_confirm_placeholder()}
                bind:value={$formData.confirmPassword}
              />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Form.Button class="w-full" disabled={$submitting}>
          {$submitting
            ? m.reset_password_submitting()
            : m.reset_password_submit()}
        </Form.Button>

        <p class="text-muted-foreground text-center text-sm">
          <a
            href={resolve('/auth/login')}
            class="text-primary underline-offset-4 hover:underline"
          >
            {m.forgot_password_back_to_login()}
          </a>
        </p>
      </form>
    </Card.Content>
  </Card.Root>
{/if}
