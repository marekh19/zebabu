import { EMAIL_FROM, RESEND_API_KEY } from '$env/static/private'
import { redis } from '$lib/server/cache'
import { db } from '$lib/server/db'
import { sendVerificationEmail } from '@zebabu/emails'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_BASE_URL ?? 'http://localhost:3000',

  emailAndPassword: {
    enabled: true,

    // Require email verification before session creation
    requireEmailVerification: true,

    async sendResetPassword({ user, url }) {
      // TODO: Plugin email provider
      console.log(`Sent reset password to ${user.email}: ${url}`)
    },
  },

  // ─── Email Verification ────────────────────────────────────
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: false,
    async sendVerificationEmail({ user, url }) {
      await sendVerificationEmail({
        to: user.email,
        url,
        from: EMAIL_FROM,
        apiKey: RESEND_API_KEY,
      })
    },
  },

  // ─── Database ──────────────────────────────────────────────
  // PostgreSQL as the primary database for users, accounts, etc.
  // Use your preferred adapter (drizzle, prisma, kysely, etc.)
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),

  // ─── Secondary Storage (Redis) ─────────────────────────────
  // Handles sessions + rate limiting. Replaces DB queries with
  // fast in-memory lookups. TTL is handled natively by Redis.
  secondaryStorage: {
    get: async (key) => await redis.get(key),
    set: async (key, value, ttl) => {
      if (ttl) {
        await redis.set(key, value, { expiration: { type: 'EX', value: ttl } })
        return
      }
      await redis.set(key, value)
    },
    delete: async (key) => {
      await redis.del(key)
    },
  },

  // ─── Session ───────────────────────────────────────────────
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh expiry every 24h

    // Cookie cache: avoids hitting Redis on every request.
    // Session is verified from a signed cookie; Redis is only
    // consulted when the cache expires.
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes - good balance between performance and revocation latency
    },

    // Uncomment if you need sessions in BOTH Postgres and Redis
    // (e.g. for audit trails or analytics)
    storeSessionInDatabase: true,
  },

  // ─── Rate Limiting ─────────────────────────────────────────
  // Uses Redis via secondary storage — works across multiple
  // server instances (unlike the default in-memory store).
  rateLimit: {
    enabled: true,
    storage: 'secondary-storage',
    window: 60,
    max: 50,
    customRules: {
      '/sign-up/email': { window: 60, max: 5 }, // 5/min
      '/sign-in/email': { window: 60, max: 10 }, // 10/min
    },
  },

  // Trusted origins for CSRF protection
  trustedOrigins: [process.env.APP_URL ?? 'http://localhost:3000'],
})
