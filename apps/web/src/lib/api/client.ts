import { createORPCClient, ORPCError } from '@orpc/client'
import type { ContractRouterClient } from '@orpc/contract'
import type { JsonifiedClient } from '@orpc/openapi-client'
import { OpenAPILink } from '@orpc/openapi-client/fetch'
import { apiContract, errorSchema } from '@zebabu/api-contract'

export function createApiClient(
  url: string,
  headers?: () => Record<string, string>,
) {
  const link = new OpenAPILink(apiContract, {
    url,
    headers,
    customErrorResponseBodyDecoder: (body, response) => {
      const parsed = errorSchema.safeParse(body)
      if (!parsed.success) return null
      return new ORPCError(parsed.data.code, {
        status: response.status,
        data: { requestId: parsed.data.requestId },
      })
    },
  })
  const client: JsonifiedClient<ContractRouterClient<typeof apiContract>> =
    createORPCClient(link)
  return client
}

export function createBrowserApiClient() {
  return createApiClient(window.location.origin)
}

export function apiErrorCode(error: unknown) {
  return error instanceof ORPCError ? error.code : null
}
