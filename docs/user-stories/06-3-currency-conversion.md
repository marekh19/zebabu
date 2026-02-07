# [US-6.3] Display All Amounts in Primary Currency

**Epic:** Multi-Currency Support
**Priority:** P1 (Important)
**Story Points:** 3
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want to** see all amounts converted to my primary currency,
**So that** I can understand my total budget in one currency.

---

## Description

Automatically convert all transaction amounts to the user's primary currency for display using fetched exchange rates. Show both original and converted amounts for transparency.

---

## Acceptance Criteria

- [ ] All budget calculations use converted amounts
- [ ] Total income/expenses in primary currency
- [ ] Category totals in primary currency
- [ ] Exchange rates fetched automatically
- [ ] Rates cached for performance
- [ ] Warning shown if rate unavailable

---

## Technical Implementation

```typescript
// src/lib/server/modules/exchange-rates/service.ts
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  date?: Date,
): Promise<ExchangeRate> {
  if (fromCurrency === toCurrency) {
    return { fromCurrency, toCurrency, rate: 1, date: new Date() }
  }

  // Check cache
  const cached = await redis.get(`rate:${fromCurrency}:${toCurrency}`)
  if (cached) return JSON.parse(cached)

  // Check database
  const stored = await db.query.exchangeRates.findFirst({
    where: and(
      eq(exchangeRates.fromCurrency, fromCurrency),
      eq(exchangeRates.toCurrency, toCurrency),
      eq(exchangeRates.date, date || new Date()),
    ),
  })

  if (stored && !isStale(stored)) return stored

  // Fetch from API
  const rate = await fetchRateFromAPI(fromCurrency, toCurrency)

  // Store in cache and database
  await redis.setex(
    `rate:${fromCurrency}:${toCurrency}`,
    86400,
    JSON.stringify(rate),
  )
  await db.insert(exchangeRates).values(rate)

  return rate
}
```

---

## Dependencies

- Depends on: US-6.2 (Multi-Currency Transactions), US-6.5 (Fetch Exchange Rates)
- Blocks: US-6.4 (Show Original Currency)

---
