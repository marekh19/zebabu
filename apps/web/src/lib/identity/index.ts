export { authClient } from './client'
export { default as ForgotPasswordForm } from './components/forgot-password-form.svelte'
export { default as LoginForm } from './components/login-form.svelte'
export { default as ResetPasswordForm } from './components/reset-password-form.svelte'
export { default as SignupForm } from './components/signup-form.svelte'
export { default as VerifyEmailCard } from './components/verify-email-card.svelte'
export {
  currencies,
  currencySchema,
  formattingLocales,
  getFormattingLocale,
  languageSchema,
  languages,
  parseLanguage,
  profileSchema,
} from './preferences'
export type { Currency, Language, ProfilePreferences } from './preferences'
export { updatePreferences } from './update-preferences'
