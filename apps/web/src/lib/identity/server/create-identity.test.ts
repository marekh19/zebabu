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
vi.mock('./secondary-storage', () => ({ redisSecondaryStorage: {} }))

import { createIdentity } from './create-identity'

describe('createIdentity', () => {
  beforeEach(() => vi.clearAllMocks())

  it('configures USD as the validated primary currency default', () => {
    createIdentity({ onUserCreated: vi.fn() })

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

  it('publishes the created user ID through the application callback', async () => {
    const onUserCreated = vi.fn()
    createIdentity({ onUserCreated })

    const options = vi.mocked(betterAuth).mock.calls[0]?.[0]
    const afterUserCreated = options?.databaseHooks?.user?.create?.after
    if (!afterUserCreated)
      throw new Error('User-created hook is not configured')

    await afterUserCreated(
      {
        id: 'user-1',
        name: 'User',
        email: 'user@example.com',
        emailVerified: true,
        image: null,
        createdAt: new Date('2026-08-29T00:00:00Z'),
        updatedAt: new Date('2026-08-29T00:00:00Z'),
      },
      null,
    )

    expect(onUserCreated).toHaveBeenCalledWith('user-1')
  })
})
