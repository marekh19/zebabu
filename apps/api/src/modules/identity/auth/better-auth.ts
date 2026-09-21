import { database } from '#api-database'
import { apiKey } from '@better-auth/api-key'
import { currencySchema } from '@zebabu/api-contract'
import { sendPasswordResetEmail, sendVerificationEmail } from '@zebabu/emails'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import type { IdentityEnvironment } from './environment'
import { createRedisSecondaryStorage } from './storage'

export function createIdentity(environment: IdentityEnvironment) {
  return betterAuth({
    baseURL: environment.betterAuthUrl,

    emailAndPassword: {
      enabled: true,

      // Require email verification before session creation
      requireEmailVerification: true,

      async sendResetPassword({ user, url }) {
        await sendPasswordResetEmail({
          to: user.email,
          url,
          from: environment.emailFrom,
          apiKey: environment.resendApiKey,
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
          from: environment.emailFrom,
          apiKey: environment.resendApiKey,
        })
      },
    },

    // ─── Database ──────────────────────────────────────────────
    database: drizzleAdapter(database, {
      provider: 'pg',
    }),

    plugins: [
      apiKey({
        enableSessionForAPIKeys: false,
        requireName: true,
        defaultPrefix: 'zebabu_',
        keyExpiration: {
          defaultExpiresIn: 60 * 60 * 24 * 90,
          minExpiresIn: 1,
          maxExpiresIn: 365,
        },
        rateLimit: { enabled: true, timeWindow: 60_000, maxRequests: 60 },
        permissions: { defaultPermissions: { api: ['read'] } },
      }),
    ],

    user: {
      additionalFields: {
        primaryCurrency: {
          type: 'string',
          required: true,
          defaultValue: 'USD',
          input: true,
          validator: {
            input: currencySchema,
            output: currencySchema,
          },
        },
      },
    },

    // ─── Secondary Storage (Redis) ─────────────────────────────
    secondaryStorage: createRedisSecondaryStorage(environment.redisKeyPrefix),

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
    trustedOrigins: [environment.webOrigin],
  })
}
