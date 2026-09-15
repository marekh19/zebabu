import { describe, expect, it } from 'vitest'
import { readIdentityEnvironment } from './environment'

describe('Identity environment', () => {
  it('validates exact origins and prefixes Redis by app and environment', () => {
    expect(
      readIdentityEnvironment({
        APP_ENV: 'staging',
        BETTER_AUTH_URL: 'https://staging.zebabu.com',
        WEB_ORIGIN: 'https://staging.zebabu.com/',
      }),
    ).toEqual({
      betterAuthUrl: 'https://staging.zebabu.com',
      webOrigin: 'https://staging.zebabu.com',
      redisKeyPrefix: 'zebabu:staging:better-auth',
    })
  })

  it.each([
    [{ APP_ENV: 'production' }, 'BETTER_AUTH_URL is not set'],
    [
      {
        APP_ENV: 'production',
        BETTER_AUTH_URL: 'https://zebabu.com/path',
        WEB_ORIGIN: 'https://zebabu.com',
      },
      'BETTER_AUTH_URL must be an origin without a path',
    ],
    [
      {
        APP_ENV: 'Production',
        BETTER_AUTH_URL: 'https://zebabu.com',
        WEB_ORIGIN: 'https://zebabu.com',
      },
      'APP_ENV must contain lowercase letters, numbers, or dashes',
    ],
  ])('rejects invalid production configuration', (environment, message) => {
    expect(() => readIdentityEnvironment(environment)).toThrow(message)
  })
})
