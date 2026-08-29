import { betterAuth } from 'better-auth'
import { describe, expect, it, vi } from 'vitest'

vi.mock('$env/dynamic/private', () => ({ env: {} }))
vi.mock('$lib/server/db', () => ({ db: {} }))
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
