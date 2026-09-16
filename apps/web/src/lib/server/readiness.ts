import { redis } from '$lib/server/cache'
import { database } from '$lib/server/persistence/database'
import { sql } from 'drizzle-orm'

async function withTimeout<T>(operation: PromiseLike<T>, timeoutMs: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined
  const expired = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error('Readiness dependency timed out')),
      timeoutMs,
    )
  })

  try {
    return await Promise.race([operation, expired])
  } finally {
    clearTimeout(timeout)
  }
}

export async function getReadiness(timeoutMs = 2_000) {
  const [postgres, secondaryStorage] = await Promise.allSettled([
    withTimeout(database.execute(sql`select 1`), timeoutMs),
    withTimeout(redis.ping(), timeoutMs),
  ])

  return {
    ready:
      postgres.status === 'fulfilled' &&
      secondaryStorage.status === 'fulfilled',
    dependencies: {
      postgres: postgres.status === 'fulfilled' ? 'up' : 'down',
      redis: secondaryStorage.status === 'fulfilled' ? 'up' : 'down',
    },
  } as const
}
