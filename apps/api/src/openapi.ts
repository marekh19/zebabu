import { OpenAPIGenerator } from '@orpc/openapi'
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4'
import { router } from './router'

const generator = new OpenAPIGenerator({
  schemaConverters: [new ZodToJsonSchemaConverter()],
})

export function generateOpenApi() {
  return generator.generate(router, {
    info: { title: 'Zebabu API', version: '1.0.0' },
    servers: [{ url: '/' }],
    security: [{ sessionCookie: [] }, { apiKey: [] }],
    components: {
      securitySchemes: {
        sessionCookie: {
          type: 'apiKey',
          in: 'cookie',
          name: 'better-auth.session_token',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'User-owned API key with read or write permission',
        },
      },
    },
    customErrorResponseBodySchema: (definitions) => ({
      type: 'object',
      additionalProperties: false,
      properties: {
        code: { type: 'string', enum: definitions.map(([code]) => code) },
        requestId: { type: 'string' },
      },
      required: ['code', 'requestId'],
    }),
  })
}
