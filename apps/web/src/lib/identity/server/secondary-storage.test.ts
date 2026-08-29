import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('$lib/server/cache', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    getdel: vi.fn(),
    eval: vi.fn(),
    expire: vi.fn(),
  },
}))

import { redis } from '$lib/server/cache'
import { redisSecondaryStorage } from './secondary-storage'

const mockRedis = vi.mocked(redis)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('set', () => {
  it('applies the TTL in the same command as the write', async () => {
    await redisSecondaryStorage.set('session:1', 'payload', 60)

    // A separate EXPIRE could be lost mid-flight, leaving a session that never
    // expires — the TTL must ride along with the SET.
    expect(mockRedis.set).toHaveBeenCalledWith('session:1', 'payload', 'EX', 60)
    expect(mockRedis.expire).not.toHaveBeenCalled()
  })

  it('writes without expiry when no TTL is given', async () => {
    await redisSecondaryStorage.set('session:1', 'payload')

    expect(mockRedis.set).toHaveBeenCalledWith('session:1', 'payload')
  })

  it('forwards a zero TTL instead of silently dropping it', async () => {
    await redisSecondaryStorage.set('session:1', 'payload', 0)

    expect(mockRedis.set).toHaveBeenCalledWith('session:1', 'payload', 'EX', 0)
  })
})

describe('increment', () => {
  it('evaluates the counter script with one key and returns the new count', async () => {
    mockRedis.eval.mockResolvedValue(3)

    const result = await redisSecondaryStorage.increment('rate:ip', 60)

    expect(result).toBe(3)
    const [script, numkeys, key, ttl] = mockRedis.eval.mock.calls[0]
    expect(numkeys).toBe(1)
    expect(key).toBe('rate:ip')
    expect(ttl).toBe(60)
    // TTL only on creation: extending it on every hit would let a caller hold
    // the window open forever.
    expect(script).toContain("if value == 1 then redis.call('EXPIRE'")
  })

  it('coerces a string reply to a number', async () => {
    mockRedis.eval.mockResolvedValue('7')

    await expect(redisSecondaryStorage.increment('rate:ip', 60)).resolves.toBe(
      7,
    )
  })
})

describe('getAndDelete', () => {
  it('uses a single atomic GETDEL', async () => {
    mockRedis.getdel.mockResolvedValue('token')

    await expect(redisSecondaryStorage.getAndDelete('verify:1')).resolves.toBe(
      'token',
    )
    expect(mockRedis.getdel).toHaveBeenCalledWith('verify:1')
  })

  it('returns null for a missing key', async () => {
    mockRedis.getdel.mockResolvedValue(null)

    await expect(
      redisSecondaryStorage.getAndDelete('verify:missing'),
    ).resolves.toBeNull()
  })
})
