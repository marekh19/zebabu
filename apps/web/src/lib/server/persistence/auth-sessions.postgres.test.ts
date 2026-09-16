import { session, user } from '$lib/server/persistence/schema'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { afterAll, describe, expect, it } from 'bun:test'
import { eq, like } from 'drizzle-orm'
import { testDatabase as database } from './database.test-helper'

const runId = crypto.randomUUID()
const emailDomain = `session-${runId}.example.com`

const auth = betterAuth({
  baseURL: 'http://localhost:3000',
  secret: 'session-test-secret-at-least-32-characters',
  database: drizzleAdapter(database, { provider: 'pg' }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    autoSignInAfterVerification: false,
    sendVerificationEmail: async () => {},
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
    storeSessionInDatabase: true,
  },
})

async function createVerifiedSession(name: string) {
  const email = `${name}@${emailDomain}`
  const signUp = await auth.api.signUpEmail({
    body: { email, name: 'Session user', password: 'valid-password-123' },
    asResponse: true,
  })
  expect(signUp.headers.get('set-cookie')).toBeNull()

  const [created] = await database
    .update(user)
    .set({ emailVerified: true })
    .where(eq(user.email, email))
    .returning({ id: user.id })
  expect(created).toBeDefined()

  const signIn = await auth.api.signInEmail({
    body: { email, password: 'valid-password-123' },
    asResponse: true,
  })
  const setCookie = signIn.headers.get('set-cookie')
  if (!setCookie) throw new Error('Sign-in did not set a Session cookie')

  return {
    headers: new Headers({ cookie: setCookie.split(';')[0] ?? '' }),
    userId: created?.id ?? '',
  }
}

afterAll(async () => {
  await database.delete(user).where(like(user.email, `%@${emailDomain}`))
})

describe('Better Auth Session cookies', () => {
  it('rejects an absent cookie', async () => {
    expect(await auth.api.getSession({ headers: new Headers() })).toBeNull()
  })

  it('rejects a malformed cookie', async () => {
    const headers = new Headers({
      cookie: 'better-auth.session_token=not-a-signed-token',
    })
    expect(await auth.api.getSession({ headers })).toBeNull()
  })

  it('rejects an expired Session cookie', async () => {
    const authenticated = await createVerifiedSession('expired')
    await database
      .update(session)
      .set({ expiresAt: new Date(0) })
      .where(eq(session.userId, authenticated.userId))

    expect(
      await auth.api.getSession({ headers: authenticated.headers }),
    ).toBeNull()
  })

  it('rejects a revoked Session cookie', async () => {
    const authenticated = await createVerifiedSession('revoked')
    await auth.api.signOut({ headers: authenticated.headers })

    expect(
      await auth.api.getSession({ headers: authenticated.headers }),
    ).toBeNull()
  })
})
