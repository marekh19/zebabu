import { z } from 'zod'
import { protectedContract } from './base'
import { idSchema, timestampSchema } from './schemas'

export const keyScopeSchema = z.enum(['read', 'write'])

export const keyMetadataSchema = z.strictObject({
  id: idSchema,
  name: z.string().min(1).max(100),
  scope: keyScopeSchema,
  createdAt: timestampSchema,
  expiresAt: timestampSchema,
})

export const keysContract = {
  list: protectedContract
    .route({
      method: 'GET',
      path: '/api/v1/keys',
      operationId: 'listApiKeys',
      tags: ['API keys'],
      summary: 'List the current User API keys',
      spec: (spec) => ({ ...spec, security: [{ sessionCookie: [] }] }),
    })
    .output(z.array(keyMetadataSchema)),
  create: protectedContract
    .route({
      method: 'POST',
      path: '/api/v1/keys',
      operationId: 'createApiKey',
      tags: ['API keys'],
      summary: 'Create a scoped API key and show its secret once',
      successStatus: 201,
      spec: (spec) => ({ ...spec, security: [{ sessionCookie: [] }] }),
    })
    .input(
      z.strictObject({
        name: keyMetadataSchema.shape.name,
        scope: keyScopeSchema,
        expiresInDays: z.number().int().min(1).max(365),
      }),
    )
    .output(keyMetadataSchema.extend({ key: z.string().min(1) })),
  revoke: protectedContract
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: 'DELETE',
      path: '/api/v1/keys/{keyId}',
      operationId: 'revokeApiKey',
      tags: ['API keys'],
      summary: 'Revoke a User API key',
      spec: (spec) => ({ ...spec, security: [{ sessionCookie: [] }] }),
    })
    .input(z.strictObject({ keyId: idSchema }))
    .output(z.strictObject({ success: z.literal(true) })),
}
