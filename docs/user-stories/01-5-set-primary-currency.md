# [US-1.5] Set Primary Currency

**Epic:** User Authentication & Profile Management
**Priority:** P0 (MVP Critical)
**Story Points:** 1
**Status:** ☒ Done

## User Story

**As a** user,
**I want to** set my primary currency,
**So that** future multi-currency calculations have a preferred base currency.

## Current-State Alignment

Transactions do not have a currency yet. This story stores the preference but does not relabel or convert existing budget amounts. Transaction currencies and conversion remain in US-6.2 and US-6.3.

## Acceptance Criteria

- [x] A profile page is accessible from the user menu.
- [x] The current primary currency is selected.
- [x] Users can choose USD, CZK, EUR, GBP, PLN, CHF, CAD, TRY, or HUF.
- [x] Currency names are localized in English and Czech.
- [x] Unsupported values are rejected at the authentication boundary.
- [x] Saving updates the user and active session immediately.
- [x] A localized success message is shown after saving.
- [x] New and existing users default to USD.
- [x] The page explains that budget amounts are not converted yet.
- [x] Existing budget amounts and formatting remain unchanged.

## Implementation Notes

- Store `primaryCurrency` on the Better Auth user model.
- Validate updates through Better Auth's additional-field validator.
- Use `/profile` for this preference and the future locale preference from US-1.6.
- Keep the supported list intentionally small and expand it from user demand.

## Dependencies

- Depends on: US-1.1 (User Registration)
- Blocks: US-6.2 (Multi-Currency Transactions)
