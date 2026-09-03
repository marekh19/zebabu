# [US-1.6] Persist Language and Locale Formatting

**Epic:** User Authentication & Profile Management
**Priority:** P0 (MVP Critical)
**Story Points:** 2
**Status:** ☑ Complete
**Triage:** ready-for-agent

## User Story

**As a** signed-in user,
**I want to** save my language preference,
**So that** the application uses my language and its conventional number and date formats on every device.

## Current-State Alignment

- Paraglide already provides English (`en`) and Czech (`cs`) messages and an immediate language switcher.
- `formatDecimal`, budget month names, and budget creation dates already read the active Paraglide locale. Numeric form inputs and stored values are locale-neutral.
- US-1.5 adds `/profile`, a shared profile form, `primaryCurrency` on the Better Auth user, and the `update-user` persistence pattern. Implement this story after that work is on the target branch.
- Transactions do not have currencies yet. This story changes decimal separators but must not label budget amounts with the user's primary currency. Currency-aware formatting remains in US-6.2.

## Decisions

- Store the Paraglide language code (`en` or `cs`) as the account preference.
- Derive formatting locales as `en-US` and `cs-CZ`; do not expose region as a separate preference.
- Default new and existing users to English.
- The account preference overrides browser-local state on authenticated pages. Signed-out language selection remains browser-local.
- Keep the header switcher. On authenticated pages it persists immediately; the profile selector remains a draft until the shared form is saved.
- Save primary currency and language atomically from one profile form.

## Acceptance Criteria

- [x] The profile form contains a Language select with the primary-currency setting and uses the same Save button.
- [x] The select offers `English` and `Čeština`, written in their own language, with `1,234.56` and `1 234,56` formatting examples. It does not use flags.
- [x] The current account language is selected when the profile loads.
- [x] Saving validates both profile fields and updates primary currency and language atomically.
- [x] After a successful save, the current page switches language immediately and shows a success toast in the new language.
- [x] A failed save changes neither preference nor the active language and shows a localized error.
- [x] The private header switcher remains available and persists a language change to the account before applying it locally.
- [x] If a private-header update fails, the active selection is restored and a localized error toast is shown.
- [x] Public-page language switching remains browser-local and requires no account.
- [x] Authenticated server rendering selects the stored account language before rendering, including the first page after sign-in, without a wrong-language flash.
- [x] New users and migrated existing users default to `en`.
- [x] Displayed decimal amounts use `en-US` or `cs-CZ` separators and retain two fraction digits.
- [x] Budget month names and creation dates follow the derived formatting locale while retaining their current precision.
- [x] Numeric inputs, submitted values, and database values remain locale-neutral.
- [x] Budget amounts remain currency-neutral; this story adds no currency symbols or conversion.
- [x] Unsupported language values are rejected at the authentication boundary.

## Technical Implementation

### Expected Areas

- `apps/web/src/lib/identity/` — supported language schema, formatting-locale mapping, profile schema, and preference update client
- `apps/web/src/lib/identity/server/create-identity.ts` — Better Auth user field and validation
- `apps/web/src/lib/identity/server/persistence/schema.ts` — persisted language default
- `apps/web/src/routes/(private)/profile/` — initialize and save the combined profile form
- `apps/web/src/lib/components/language-switcher.svelte` — account-aware private switching and failure rollback
- `apps/web/src/hooks.server.ts` or the nearest shared request boundary — select the account language before private rendering
- `apps/web/src/lib/utils.ts` and existing date/month helpers — explicit language-to-formatting-locale mapping
- `apps/web/messages/en.json` and `apps/web/messages/cs.json` — labels, examples, success, and error messages
- `apps/web/drizzle/` — migration adding the non-null language field with an `en` default

### Constraints

1. Extend the US-1.5 profile schema and update operation; do not create competing profile forms or endpoints.
2. Validate the stored value against the two Paraglide locale codes at the Better Auth boundary.
3. Persist successfully before calling `setLocale`. Refresh session/page data after updates so the server and client agree.
4. Keep the account-preference lookup at a shared authenticated request boundary rather than repeating it in pages.
5. Preserve each date display's existing options. Locale changes representation, not the information shown.

## Testing Checklist

- [x] Schema tests accept `en` and `cs` and reject unsupported values.
- [x] Identity tests cover the `en` default and the persisted language field.
- [ ] Profile server/component tests cover initial selection, atomic save, success, and failure without a local language change.
- [ ] Language-switcher tests cover persisted private switching, rollback on failure, and browser-local public switching.
- [ ] Request-boundary or integration coverage verifies that a stored Czech preference renders an authenticated page in Czech on first response.
- [x] Formatting tests cover decimal and date output for `en-US` and `cs-CZ`.
- [ ] Manual keyboard test covers both selectors and the shared Save button.
- [ ] Manual test verifies there is no wrong-language flash after sign-in or navigation.

## Dependencies

- Depends on: US-1.1 (User Registration), US-1.5 (Set Primary Currency)
- Blocks: features that add new formatted numbers or dates
