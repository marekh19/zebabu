# Email Verification with Resend + React Email

## Context

Signup exists but email verification is stubbed (console.log). Need real email delivery via Resend, a new `packages/emails` library with react-email templates, and a smooth post-signup verification UX flow.

## Steps

- [x] **Step 1: Scaffold `packages/emails`** — Create package with react-email + Resend, tsup build, verification email template, generic `sendEmail` utility
- [x] **Step 2: Wire emails into Better Auth** — Add `@zebabu/emails` dep, update `.env.example`, replace `sendVerificationEmail` stub with real implementation, set `autoSignInAfterVerification: false`
- [x] **Step 3: 2-step signup form** — Add `callbackURL` to signup call, show "check your email" card on success with resend button (60s cooldown), i18n keys
- [x] **Step 4: Login email prefill + URL cleanup** — Read `email` from URL params after verification redirect, prefill login form, clean URL with `replaceState`

## Key files

| File                                                           | Role                                               |
| -------------------------------------------------------------- | -------------------------------------------------- |
| `packages/emails/src/send.ts`                                  | Generic email sender (Resend + react-email render) |
| `packages/emails/src/templates/verification-email.tsx`         | Email template                                     |
| `apps/web/src/lib/auth/index.ts`                               | Better Auth config (wire sendVerificationEmail)    |
| `apps/web/src/lib/features/auth/components/signup-form.svelte` | Signup: add callbackURL + verification message     |
| `apps/web/src/lib/features/auth/components/login-form.svelte`  | Login: email prefill from params                   |

## Verification

After all steps: `bun run lint && bun run format && bun run check`

Manual e2e: signup → same page shows "check your email" → click link from console/email → login page with email prefilled → login succeeds
