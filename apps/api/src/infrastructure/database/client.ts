import { SQL } from 'bun'

function positiveNumber(
  value: string | number | undefined,
  fallback: number,
  name: string,
) {
  const parsed = value === undefined ? fallback : Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number`)
  }
  return parsed
}

function nonNegativeNumber(
  value: string | number | undefined,
  fallback: number,
  name: string,
) {
  const parsed = value === undefined ? fallback : Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative number`)
  }
  return parsed
}

export function createDatabaseClient(input: {
  url: string
  max?: string | number
  connectionTimeout?: string | number
  idleTimeout?: string | number
  queryTimeout?: string | number
}) {
  const url = new URL(input.url)
  if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
    throw new Error('DATABASE_URL must use PostgreSQL')
  }

  return new SQL({
    url,
    max: positiveNumber(input.max, 10, 'DB_POOL_SIZE'),
    connectionTimeout: positiveNumber(
      input.connectionTimeout,
      10,
      'DB_CONNECTION_TIMEOUT_SECONDS',
    ),
    idleTimeout: nonNegativeNumber(
      input.idleTimeout,
      30,
      'DB_IDLE_TIMEOUT_SECONDS',
    ),
    connection: {
      statement_timeout: positiveNumber(
        input.queryTimeout,
        10_000,
        'DB_QUERY_TIMEOUT_MS',
      ),
    },
  })
}
