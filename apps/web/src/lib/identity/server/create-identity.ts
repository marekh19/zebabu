import { env } from '$env/dynamic/private'
import { database } from '$lib/server/persistence/database'
import { sendPasswordResetEmail, sendVerificationEmail } from '@zebabu/emails'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { primaryCurrencySchema } from '../currencies'
import { redisSecondaryStorage } from './secondary-storage'

type IdentityDependencies = {
  onUserCreated: (userId: string) => Promise<void>
}

export function createIdentity({ onUserCreated }: IdentityDependencies) {
  return betterAuth({
    baseURL: env.BETTER_AUTH_BASE_URL ?? 'http://localhost:3000',

    emailAndPassword: {
      enabled: true,

      // Require email verification before session creation
      requireEmailVerification: true,

      async sendResetPassword({ user, url }) {
        await sendPasswordResetEmail({
          to: user.email,
          url,
          from: env.EMAIL_FROM,
          apiKey: env.RESEND_API_KEY,
        })
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
          from: env.EMAIL_FROM,
          apiKey: env.RESEND_API_KEY,
        })
      },
    },

    // ─── Database ──────────────────────────────────────────────
    database: drizzleAdapter(database, {
      provider: 'pg',
    }),

    user: {
      additionalFields: {
        primaryCurrency: {
          type: 'string',
          required: true,
          defaultValue: 'USD',
          input: true,
          validator: {
            input: primaryCurrencySchema,
            output: primaryCurrencySchema,
          },
        },
      },
    },

    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await onUserCreated(user.id)
          },
        },
      },
    },

    // ─── Secondary Storage (Redis) ─────────────────────────────
    secondaryStorage: redisSecondaryStorage,

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
        '/forget-password': { window: 60, max: 3 }, // 3/min
      },
    },

    // Trusted origins for CSRF protection
    trustedOrigins: [env.APP_URL ?? 'http://localhost:3000'],
  })
}
