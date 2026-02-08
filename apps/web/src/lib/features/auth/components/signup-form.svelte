<script lang="ts">
  import { defaults, superForm } from 'sveltekit-superforms'
  import { zod4 } from 'sveltekit-superforms/adapters'
  import * as m from '$lib/paraglide/messages'
  import { authClient } from '$lib/auth/client'
  import { getAuthError } from '$lib/features/auth/utils/auth-errors'
  import { createSignupSchema } from '$lib/features/auth/schemas/signup-schema'
  import * as Card from '$lib/components/ui/card'
  import * as Form from '$lib/components/ui/form'
  import { Input } from '$lib/components/ui/input'
  import { resolve } from '$app/paths'
  import { goto } from '$app/navigation'
  import PasswordCriteria from '$lib/features/auth/components/password-criteria.svelte'

  let serverError = $state('')

  const signupSchema = createSignupSchema()
  const form = superForm(defaults(zod4(signupSchema)), {
    SPA: true,
    validators: zod4(signupSchema),
    async onUpdate({ form: updatedForm }) {
      if (!updatedForm.valid) return

      serverError = ''

      const { error } = await authClient.signUp.email({
        name: updatedForm.data.name,
        email: updatedForm.data.email,
        password: updatedForm.data.password,
      })

      if (error) {
        serverError = getAuthError(error.code ?? '')
        return
      }

      goto(resolve('/(private)/dashboard'))
    },
  })

  const { form: formData, enhance, submitting } = form
</script>

<Card.Root class="w-full max-w-md">
  <Card.Header>
    <Card.Title class="text-2xl">{m.signup_title()}</Card.Title>
    <Card.Description>{m.signup_description()}</Card.Description>
  </Card.Header>
  <Card.Content>
    <form method="POST" use:enhance class="space-y-4">
      {#if serverError}
        <p class="text-destructive text-sm font-medium">{serverError}</p>
      {/if}

      <Form.Field {form} name="name">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>{m.signup_name_label()}</Form.Label>
            <Input
              {...props}
              type="text"
              placeholder={m.signup_name_placeholder()}
              bind:value={$formData.name}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field {form} name="email">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>{m.signup_email_label()}</Form.Label>
            <Input
              {...props}
              type="email"
              placeholder={m.signup_email_placeholder()}
              bind:value={$formData.email}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field {form} name="password">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>{m.signup_password_label()}</Form.Label>
            <Input
              {...props}
              type="password"
              placeholder={m.signup_password_placeholder()}
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
            <Form.Label>{m.signup_confirm_password_label()}</Form.Label>
            <Input
              {...props}
              type="password"
              placeholder={m.signup_confirm_password_placeholder()}
              bind:value={$formData.confirmPassword}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Button class="w-full" disabled={$submitting}>
        {$submitting ? m.signup_submitting() : m.signup_submit()}
      </Form.Button>

      <p class="text-muted-foreground text-center text-sm">
        {m.signup_login_prompt()}
        <a
          href={resolve('/auth/login')}
          class="text-primary underline-offset-4 hover:underline"
        >
          {m.signup_login_link()}
        </a>
      </p>
    </form>
  </Card.Content>
</Card.Root>
