import { z } from 'zod'

const environmentSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3101),
  APP_ENV: z.string().regex(/^[a-z0-9-]+$/),
  WEB_ORIGIN: z.url(),
  DATABASE_URL: z
    .url()
    .refine((value) =>
      ['postgres:', 'postgresql:'].includes(new URL(value).protocol),
    ),
  REDIS_URL: z
    .url()
    .refine((value) => ['redis:', 'rediss:'].includes(new URL(value).protocol)),
  BETTER_AUTH_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
})

export function readEnvironment(values: Record<string, string | undefined>) {
  return environmentSchema.parse(values)
}
