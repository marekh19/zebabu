import { errorCodeSchema } from '@zebabu/api-contract'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { secureHeaders } from 'hono/secure-headers'
import type { createIdentity } from './lib/identity/server/create-identity'
import { getReadiness } from './lib/server/readiness'
import { generateOpenApi } from './openapi'
import { requestLocale, resolveApiKey } from './principal'
import { apiHandler } from './router'

async function apiErrorResponse(response: Response, requestId: string) {
  const body: unknown = await response
    .clone()
    .json()
    .catch(() => null)
  const reportedCode =
    body && typeof body === 'object' && 'code' in body ? body.code : undefined
  const parsedCode = errorCodeSchema.safeParse(reportedCode)
  const code =
    response.status >= 500
      ? 'INTERNAL_ERROR'
      : parsedCode.success
        ? parsedCode.data
        : 'INVALID_INPUT'
  return new Response(JSON.stringify({ code, requestId }), {
    status: response.status,
    headers: { 'content-type': 'application/json', 'x-request-id': requestId },
  })
}

export function createApp(
  auth: ReturnType<typeof createIdentity>,
  webOrigin: string,
) {
  const app = new Hono()

  app.use('*', secureHeaders())
  app.use('*', async (context, next) => {
    const incomingId = context.req.header('x-request-id')
    const requestId =
      incomingId && /^[A-Za-z0-9._-]{1,128}$/.test(incomingId)
        ? incomingId
        : crypto.randomUUID()
    const started = performance.now()
    context.header('x-request-id', requestId)
    await next()
    console.info(
      JSON.stringify({
        event: 'http_request',
        requestId,
        method: context.req.method,
        path: context.req.path,
        status: context.res.status,
        durationMs: Math.round(performance.now() - started),
      }),
    )
  })

  app.get('/health/live', (context) => context.json({ status: 'ok' }))
  app.get('/health/ready', async (context) => {
    const readiness = await getReadiness()
    return context.json(readiness, readiness.ready ? 200 : 503)
  })
  app.get('/api/health/ready', async (context) => {
    const readiness = await getReadiness()
    return context.json(readiness, readiness.ready ? 200 : 503)
  })
  app.all('/api/auth/*', (context) => auth.handler(context.req.raw))
  app.get('/api/openapi', async (context) =>
    context.json(await generateOpenApi()),
  )
  app.get('/api/docs', (context) =>
    context.html(
      '<!doctype html><html><head><meta charset="utf-8"><title>Zebabu API</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="app"></div><script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script><script>Scalar.createApiReference("#app",{url:"/api/openapi"})</script></body></html>',
    ),
  )

  app.use('/api/v1/*', async (context, next) => {
    const key = context.req.header('x-api-key')
    if (key && context.req.header('cookie')) {
      return context.json(
        {
          code: 'INVALID_INPUT',
          requestId: context.res.headers.get('x-request-id') ?? '',
        },
        400,
      )
    }
    if (key) return next()
    if (['GET', 'HEAD', 'OPTIONS'].includes(context.req.method)) return next()
    const origin = context.req.header('origin')
    const fetchSite = context.req.header('sec-fetch-site')
    if (origin !== webOrigin || fetchSite === 'cross-site') {
      return context.json(
        {
          code: 'FORBIDDEN',
          requestId: context.res.headers.get('x-request-id') ?? '',
        },
        403,
      )
    }
    return next()
  })
  app.use(
    '/api/v1/*',
    bodyLimit({
      maxSize: 1024 * 1024,
      onError: (context) =>
        context.json(
          {
            code: 'PAYLOAD_TOO_LARGE',
            requestId: context.res.headers.get('x-request-id') ?? '',
          },
          413,
        ),
    }),
  )

  app.all('/api/v1/*', async (context) => {
    const token = context.req.header('x-api-key')
    const apiKey = token
      ? resolveApiKey(
          auth,
          token,
          context.req.method,
          context.res.headers.get('x-request-id') ?? '',
        )
      : Promise.resolve(null)
    const { matched, response } = await apiHandler.handle(context.req.raw, {
      context: {
        session: token
          ? Promise.resolve(null)
          : auth.api.getSession({ headers: context.req.raw.headers }),
        apiKey,
        auth,
        locale: requestLocale(context.req.raw.headers),
      },
    })
    if (!matched)
      return context.json(
        {
          code: 'NOT_FOUND',
          requestId: context.res.headers.get('x-request-id') ?? '',
        },
        404,
      )
    if (response.status >= 400) {
      return apiErrorResponse(
        response,
        context.res.headers.get('x-request-id') ?? '',
      )
    }
    return context.newResponse(response.body, response)
  })

  app.notFound((context) =>
    context.json(
      {
        code: 'NOT_FOUND',
        requestId: context.res.headers.get('x-request-id') ?? '',
      },
      404,
    ),
  )
  app.onError((_error, context) => {
    console.error(
      JSON.stringify({
        event: 'request_error',
        requestId: context.res.headers.get('x-request-id'),
      }),
    )
    return context.json(
      {
        code: 'INTERNAL_ERROR',
        requestId: context.res.headers.get('x-request-id') ?? '',
      },
      500,
    )
  })

  return app
}
