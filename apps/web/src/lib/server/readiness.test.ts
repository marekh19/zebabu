import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ execute: vi.fn(), ping: vi.fn() }))

vi.mock('$lib/server/persistence/database', () => ({
  database: { execute: mocks.execute },
}))
vi.mock('$lib/server/cache', () => ({ redis: { ping: mocks.ping } }))

import { getReadiness } from './readiness'

describe('readiness', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.execute.mockResolvedValue([])
    mocks.ping.mockResolvedValue('PONG')
  })

  it('requires PostgreSQL and Redis', async () => {
    await expect(getReadiness()).resolves.toEqual({
      ready: true,
      dependencies: { postgres: 'up', redis: 'up' },
    })
  })

  it.each([
    ['PostgreSQL', mocks.execute, { postgres: 'down', redis: 'up' }],
    ['Redis', mocks.ping, { postgres: 'up', redis: 'down' }],
  ])(
    'fails readiness when %s is unavailable',
    async (_, dependency, expected) => {
      dependency.mockRejectedValue(new Error('unavailable'))

      await expect(getReadiness()).resolves.toEqual({
        ready: false,
        dependencies: expected,
      })
    },
  )

  it('bounds an unresponsive dependency', async () => {
    mocks.ping.mockReturnValue(new Promise(() => {}))

    await expect(getReadiness(1)).resolves.toEqual({
      ready: false,
      dependencies: { postgres: 'up', redis: 'down' },
    })
  })
})
