# [US-6.5] Automatically Fetch Exchange Rates

**Epic:** Multi-Currency Support
**Priority:** P1 (Important)
**Story Points:** 3
**Status:** ☐ Not Started

---

## User Story

**As a** user,
**I want** exchange rates to be fetched automatically,
**So that** my budget calculations are always up-to-date without manual intervention.

---

## Description

Integrate with an exchange rate API (exchangerate-api.com) to automatically fetch currency conversion rates. Cache rates in Redis and store in database for historical tracking. Refresh rates daily.

---

## Acceptance Criteria

- [ ] Exchange rates fetched from external API
- [ ] Rates cached in Redis with 24-hour TTL
- [ ] Rates stored in database for historical tracking
- [ ] Daily cron job refreshes commonly used rates
- [ ] Fallback to 1:1 if rate unavailable
- [ ] Warning shown when rate missing or stale
- [ ] Rate date displayed to user

---

## Technical Implementation

```typescript
// src/lib/server/modules/exchange-rates/providers/exchangerate-api.ts
export async function fetchRateFromAPI(
  fromCurrency: string,
  toCurrency: string,
): Promise<ExchangeRate> {
  const apiKey = env.EXCHANGE_RATE_API_KEY
  const url = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${fromCurrency}/${toCurrency}`

  const response = await fetch(url)
  const data = await response.json()

  if (data.result !== 'success') {
    throw new Error(`Failed to fetch exchange rate: ${data['error-type']}`)
  }

  return {
    fromCurrency,
    toCurrency,
    rate: data.conversion_rate,
    date: new Date(),
  }
}
```

```typescript
// src/lib/server/cron/refresh-rates.ts
import { CronJob } from 'cron'

export function startExchangeRateCron() {
  // Run daily at 00:00 UTC
  const job = new CronJob('0 0 * * *', async () => {
    console.log('Refreshing exchange rates...')

    // Get list of unique currencies used by users
    const currencies = await getActiveCurrencies()

    // Fetch rates for all currency pairs
    for (const from of currencies) {
      for (const to of currencies) {
        if (from !== to) {
          try {
            await exchangeRateService.getExchangeRate(from, to)
          } catch (error) {
            console.error(`Failed to fetch ${from} to ${to}:`, error)
          }
        }
      }
    }

    console.log('Exchange rates refreshed.')
  })

  job.start()
}
```

---

## Dependencies

- Depends on: None (independent infrastructure)
- Blocks: US-6.3 (Currency Conversion)

---

## Notes

- Free tier: 1,500 requests/month on exchangerate-api.com
- Consider fallback APIs: fixer.io, currencyapi.com
- Rate limiting on API calls
- Monitor API usage
