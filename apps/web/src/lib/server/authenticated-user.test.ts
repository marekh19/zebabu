import { describe, expect, it } from 'vitest'
import { getAuthenticatedUserId } from './authenticated-user'

describe('authenticated request boundary', () => {
  it.each(['absent', 'expired', 'revoked', 'malformed'])(
    'returns UNAUTHORIZED for a resolved %s Session cookie',
    () => {
      const locals = { locale: 'en', user: null, session: null }

      expect(() => getAuthenticatedUserId(locals)).toThrow(
        expect.objectContaining({
          status: 401,
          body: expect.objectContaining({ code: 'UNAUTHORIZED' }),
        }),
      )
    },
  )
})
