import { z } from 'zod'

export const idSchema = z.string().min(1).max(128)
export const timestampSchema = z.iso.datetime({ offset: true })
export const moneySchema = z.string().regex(/^(?:0|[1-9]\d{0,9})\.\d{2}$/)
export const percentageSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d?|100)\.\d$/)
  .refine((value) => Number(value) <= 100)

export const errorCodeSchema = z.enum([
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'INVALID_INPUT',
  'PAYLOAD_TOO_LARGE',
  'RATE_LIMITED',
  'CONFLICT',
  'CATEGORY_IN_USE',
  'LAST_CATEGORY_OF_TYPE',
  'NON_ZERO_ALLOCATION_TARGET',
  'INVALID_ALLOCATION_TARGETS',
  'INVALID_POSITION',
  'INTERNAL_ERROR',
])

export const errorSchema = z.strictObject({
  code: errorCodeSchema,
  requestId: idSchema,
  details: z.record(z.string(), z.unknown()).optional(),
})

export const principalSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('anonymous') }),
  z.strictObject({ kind: z.literal('session'), userId: idSchema }),
  z.strictObject({
    kind: z.literal('apiKey'),
    userId: idSchema,
    keyId: idSchema,
  }),
])
