# [US-1.6] Use Paraglide Language for Locale Formatting

**Epic:** User Authentication & Profile Management
**Priority:** P0 (MVP Critical)
**Story Points:** 1
**Status:** 🟡 In Progress
**Triage:** ready-for-agent

## User Story

**As a** user,
**I want** numbers and dates to follow my selected language,
**So that** the application uses familiar formatting without another preference to manage.

## Current State

- Paraglide provides English (`en`) and Czech (`cs`) messages and persists the active language in a browser cookie.
- The header language switcher works on public and private pages without an account update.
- Numeric inputs and stored values are locale-neutral.
- Existing decimal, budget-month, and creation-date formatting reads the active Paraglide language.

## Decisions

- Paraglide remains the only source of truth for language.
- Language stays browser-local. It is not stored on the User or synchronized across devices.
- Map `en` to `en-US` and `cs` to `cs-CZ` when calling `Intl` APIs so formatting is deterministic.
- Do not add language controls to the profile page.
- Do not add authentication fields, database columns, migrations, server hooks, session refreshes, or persistence requests.
- Primary currency remains independent. Currency display and conversion belong to US-6.2.

## Acceptance Criteria

- [x] Changing language through the existing switcher immediately updates translated text and formatted values.
- [x] The selected language survives navigation and browser reload through Paraglide's existing cookie strategy.
- [x] Language switching behaves the same on public and private pages and requires no account update.
- [x] Displayed decimal amounts use `en-US` or `cs-CZ` separators and retain two fraction digits.
- [x] Budget month names and creation dates follow the mapped formatting locale while retaining their current precision.
- [x] Numeric inputs, submitted values, and database values remain locale-neutral.
- [x] Budget amounts remain currency-neutral; this story adds no currency symbols or conversion.
- [x] The profile page remains limited to account preferences such as primary currency.

## Technical Implementation

### Expected Areas

- `apps/web/src/lib/` — one shared `en`/`cs` to `en-US`/`cs-CZ` formatting-locale mapping
- `apps/web/src/lib/utils.ts` — decimal and date formatting using the mapped locale
- Existing budget month/date helpers — reuse the same mapping without changing displayed precision
- Existing tests — cover English and Czech decimal, month, and date output

### Constraints

1. Reuse the active locale from `$lib/paraglide/runtime`.
2. Keep the existing language switcher and Paraglide cookie behavior unchanged.
3. Keep formatting separate from currency labeling and conversion.
4. Add no identity or persistence machinery.

## Testing Checklist

- [x] Formatting tests cover decimals for `en-US` and `cs-CZ`, including two fraction digits.
- [x] Formatting tests cover budget month names and creation dates for both languages.
- [ ] Manual test verifies the existing switcher updates formatting on public and private pages.
- [ ] Manual test verifies the selected language survives a reload.

## Dependencies

- Depends on: US-1.5 (Set Primary Currency)
- Blocks: features that add new formatted numbers or dates
