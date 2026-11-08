import { closeDatabase } from '#api-database'
import { createApp } from './app'
import { readEnvironment } from './environment'
import { redis } from './infrastructure/redis'
import { createIdentity } from './modules/identity/auth/better-auth'
import { readIdentityEnvironment } from './modules/identity/auth/environment'

const environment = readEnvironment(process.env)
const auth = createIdentity(readIdentityEnvironment(process.env))
const app = createApp(auth, environment.WEB_ORIGIN)
const server = Bun.serve({ port: environment.PORT, fetch: app.fetch })

let stopping = false
async function shutdown() {
  if (stopping) return
  stopping = true

  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      server.stop(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error('Shutdown timed out')),
          30_000,
        )
      }),
    ])
  } catch {
    await server.stop(true)
  } finally {
    if (timeout) clearTimeout(timeout)
    await closeDatabase()
    redis.close()
    process.exit(0)
  }
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
