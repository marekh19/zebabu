import { betterAuth } from 'better-auth'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('$env/dynamic/private', () => ({ env: {} }))
vi.mock('$lib/server/persistence/database', () => ({ database: {} }))
vi.mock('@zebabu/emails', () => ({
  sendPasswordResetEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
}))
vi.mock('better-auth', () => ({ betterAuth: vi.fn() }))
vi.mock('better-auth/adapters/drizzle', () => ({
  drizzleAdapter: vi.fn(() => ({})),
}))
vi.mock('./secondary-storage', () => ({
  createRedisSecondaryStorage: vi.fn(() => ({})),
}))

import { createIdentity } from './create-identity'

describe('createIdentity', () => {
  beforeEach(() => vi.clearAllMocks())

  const environment = {
    betterAuthUrl: 'https://app.example.com',
    webOrigin: 'https://app.example.com',
    redisKeyPrefix: 'zebabu:test:better-auth',
  }

  it('configures USD as the validated primary currency default', () => {
    createIdentity(environment)

    const options = vi.mocked(betterAuth).mock.calls[0]?.[0]
    const field = options?.user?.additionalFields?.primaryCurrency

    expect(field?.defaultValue).toBe('USD')
    expect(field?.validator?.input?.['~standard'].validate('CAD')).toEqual({
      value: 'CAD',
    })
    expect(field?.validator?.input?.['~standard'].validate('AUD')).toEqual({
      issues: expect.any(Array),
    })
  })

  it('does not provision inside the User creation transaction', () => {
    createIdentity(environment)

    const options = vi.mocked(betterAuth).mock.calls[0]?.[0]
    expect(options?.databaseHooks?.user?.create?.after).toBeUndefined()
  })

  it('pins the browser Session and recovery behavior', () => {
    createIdentity(environment)

    const options = vi.mocked(betterAuth).mock.calls[0]?.[0]
    expect(options).toMatchObject({
      baseURL: environment.betterAuthUrl,
      trustedOrigins: [environment.webOrigin],
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        sendResetPassword: expect.any(Function),
      },
      emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: false,
        sendVerificationEmail: expect.any(Function),
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
        cookieCache: { enabled: true, maxAge: 5 * 60 },
        storeSessionInDatabase: true,
      },
      rateLimit: {
        enabled: true,
        storage: 'secondary-storage',
      },
    })
  })
})
