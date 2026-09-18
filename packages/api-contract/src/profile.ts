import { z } from 'zod'
import { protectedContract } from './base'
import { idSchema } from './schemas'

export const currencySchema = z.enum([
  'USD',
  'CZK',
  'EUR',
  'GBP',
  'PLN',
  'CHF',
  'CAD',
  'TRY',
  'HUF',
])

export const profileSchema = z.strictObject({
  id: idSchema,
  name: z.string(),
  email: z.email(),
  image: z.url().nullable(),
  primaryCurrency: currencySchema,
})

export type Profile = z.infer<typeof profileSchema>

export const updateProfileSchema = z.strictObject({
  primaryCurrency: currencySchema,
})

export const profileContract = {
  get: protectedContract
    .route({
      method: 'GET',
      path: '/api/v1/profile',
      operationId: 'getProfile',
      tags: ['Profile'],
      summary: 'Get the authenticated User profile',
    })
    .output(profileSchema),
  update: protectedContract
    .route({
      method: 'PATCH',
      path: '/api/v1/profile',
      operationId: 'updateProfile',
      tags: ['Profile'],
      summary: 'Update the authenticated User profile',
    })
    .input(updateProfileSchema)
    .output(profileSchema),
}
