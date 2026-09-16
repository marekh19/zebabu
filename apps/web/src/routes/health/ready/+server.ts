import { getReadiness } from '$lib/server/readiness'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async () => {
  const readiness = await getReadiness()
  return json(readiness, { status: readiness.ready ? 200 : 503 })
}
