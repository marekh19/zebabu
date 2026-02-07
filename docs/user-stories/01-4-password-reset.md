# [US-1.4] Password Reset

**Epic:** User Authentication & Profile Management
**Priority:** P0 (MVP Critical)
**Story Points:** 3
**Status:** ☐ Not Started

---

## User Story

**As a** user who forgot their password,
**I want to** reset my password via email,
**So that** I can regain access to my account.

---

## Description

Implement a password reset flow where users can request a password reset link via email. The link should contain a secure token with expiration, allowing users to set a new password. This is critical for user account recovery.

---

## Acceptance Criteria

- [ ] "Forgot password?" link available on login page
- [ ] Password reset request form accepts email
- [ ] System sends reset email with secure token link
- [ ] Reset link expires after 1 hour
- [ ] Reset page validates token before showing form
- [ ] New password must meet requirements (min 8 chars, letters+numbers)
- [ ] Success message shown after password reset
- [ ] User automatically logged in after successful reset
- [ ] Invalid/expired tokens show appropriate error messages

---

## Technical Implementation

### Files to Modify/Create

- `src/routes/auth/forgot-password/+page.svelte` - Request reset form
- `src/routes/auth/forgot-password/+page.server.ts` - Send reset email action
- `src/routes/auth/reset-password/[token]/+page.svelte` - Reset password form
- `src/routes/auth/reset-password/[token]/+page.server.ts` - Validate token and reset action
- `src/lib/server/modules/auth/service.ts` - Password reset logic
- `src/lib/server/modules/auth/repository.ts` - Token storage queries
- `src/lib/server/email/templates/password-reset.ts` - Email template
- `src/lib/server/db/schema/password-reset-tokens.ts` - Token schema (optional, can use Better Auth tokens)

### Implementation Steps

1. **Create Token Schema**
   - Add password reset token table or use Better Auth built-in tokens
   - Fields: id, userId, token (hashed), expiresAt, createdAt
   - Add index on token for fast lookup

2. **Implement Request Reset Flow**
   - Create forgot password page with email input
   - Validate email exists in database
   - Generate secure random token (crypto.randomBytes)
   - Store hashed token with 1-hour expiration
   - Send email with reset link
   - Show success message (don't reveal if email exists)

3. **Implement Reset Password Flow**
   - Create reset password page with token in URL
   - Validate token exists and not expired
   - Show password input form
   - Validate new password requirements
   - Hash and update password
   - Invalidate reset token
   - Create session and redirect to budgets

4. **Set Up Email Service**
   - Configure email provider (Resend, SendGrid, or platform email)
   - Create password reset email template
   - Include reset link with token
   - Set appropriate email headers

### Service Layer

```typescript
// src/lib/server/modules/auth/service.ts
import { randomBytes } from 'crypto'
import { hash, compare } from 'better-auth'
import { sendEmail } from '$lib/server/email'

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await userRepository.findByEmail(email)

  // Always return success to prevent email enumeration
  if (!user) return

  // Generate secure token
  const token = randomBytes(32).toString('hex')
  const hashedToken = await hash(token)

  // Store token with expiration
  await passwordResetRepository.create({
    userId: user.id,
    token: hashedToken,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  })

  // Send email
  const resetUrl = `${env.APP_URL}/auth/reset-password/${token}`
  await sendEmail({
    to: user.email,
    subject: 'Reset your password',
    html: passwordResetTemplate({ resetUrl, userName: user.name }),
  })
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<User> {
  // Find valid token
  const resetToken = await passwordResetRepository.findValidToken(token)
  if (!resetToken) {
    throw new Error('Invalid or expired reset token')
  }

  // Validate token hash
  const isValid = await compare(token, resetToken.token)
  if (!isValid) {
    throw new Error('Invalid reset token')
  }

  // Update password
  const hashedPassword = await hash(newPassword)
  const user = await userRepository.updatePassword(
    resetToken.userId,
    hashedPassword,
  )

  // Invalidate token
  await passwordResetRepository.delete(resetToken.id)

  return user
}
```

### UI Components

```svelte
<!-- src/routes/auth/forgot-password/+page.svelte -->
<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const { form, errors, enhance, message } = superForm(data.form)
</script>

<div class="forgot-password-page">
  <h1>Reset Your Password</h1>

  {#if $message}
    <div class="success-message">
      Check your email for a password reset link.
    </div>
  {:else}
    <form method="POST" use:enhance>
      <label>
        Email
        <input
          type="email"
          name="email"
          bind:value={$form.email}
          placeholder="your@email.com"
          required
        />
      </label>
      {#if $errors.email}
        <span class="error">{$errors.email}</span>
      {/if}

      <button type="submit">Send Reset Link</button>
    </form>
  {/if}

  <a href="/auth/login">Back to Login</a>
</div>
```

```svelte
<!-- src/routes/auth/reset-password/[token]/+page.svelte -->
<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const { form, errors, enhance } = superForm(data.form)
</script>

<div class="reset-password-page">
  <h1>Set New Password</h1>

  <form method="POST" use:enhance>
    <label>
      New Password
      <input
        type="password"
        name="password"
        bind:value={$form.password}
        placeholder="Min 8 characters"
        required
      />
    </label>
    {#if $errors.password}
      <span class="error">{$errors.password}</span>
    {/if}

    <label>
      Confirm Password
      <input
        type="password"
        name="confirmPassword"
        bind:value={$form.confirmPassword}
        placeholder="Repeat password"
        required
      />
    </label>
    {#if $errors.confirmPassword}
      <span class="error">{$errors.confirmPassword}</span>
    {/if}

    <button type="submit">Reset Password</button>
  </form>
</div>
```

---

## Validation & Business Rules

- **Email Validation**: Must be valid format
- **Security**: Don't reveal whether email exists (prevent enumeration)
- **Token Security**: Use cryptographically secure random tokens, hash before storage
- **Token Expiration**: Tokens expire after 1 hour
- **Password Requirements**: Same as registration (min 8 chars, letters+numbers)
- **Single Use**: Token invalidated after successful password reset

---

## Testing Checklist

- [ ] Unit tests for password reset service
- [ ] Unit tests for token generation and validation
- [ ] Integration test for complete reset flow
- [ ] Manual testing checklist:
  - [ ] Request reset with valid email sends email
  - [ ] Request reset with invalid email shows success (security)
  - [ ] Reset link with valid token shows form
  - [ ] Reset link with expired token shows error
  - [ ] Reset link with invalid token shows error
  - [ ] Setting new password works and logs user in
  - [ ] Used token cannot be reused
  - [ ] Email contains correct reset link

---

## Dependencies

- Depends on: US-1.1 (User Registration), US-1.2 (User Login)
- Blocks: None

---

## Notes

- Consider using Better Auth's built-in password reset functionality if available
- Email service needs to be configured (use Resend for simple setup)
- Rate limit password reset requests (max 3 per hour per email)
- Consider adding password strength indicator
- Future: Add 2FA as additional security layer
