import { redis } from '$lib/server/cache'
import type { BetterAuthOptions } from 'better-auth'

type SecondaryStorage = NonNullable<BetterAuthOptions['secondaryStorage']>

// INCR + EXPIRE in a single round trip. Issued as two commands, a failure
// between them would leave the counter with no TTL — an immortal rate-limit
// bucket that locks the caller out permanently.
const INCREMENT_WITH_TTL = `
local value = redis.call('INCR', KEYS[1])
if value == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return value
`

// Sessions + rate limiting. Replaces DB queries with fast in-memory lookups;
// TTL is handled natively by Redis.
export const redisSecondaryStorage: SecondaryStorage = {
  get: async (key) => await redis.get(key),

  set: async (key, value, ttl) => {
    if (ttl === undefined) {
      await redis.set(key, value)
      return
    }
    // SET ... EX rather than SET + EXPIRE: a failure between two commands
    // would leave a session key that never expires.
    await redis.set(key, value, 'EX', ttl)
  },

  delete: async (key) => {
    await redis.del(key)
  },

  getAndDelete: async (key) => await redis.getdel(key),

  increment: async (key, ttl) => {
    const value: unknown = await redis.eval(INCREMENT_WITH_TTL, 1, key, ttl)
    return Number(value)
  },
}
