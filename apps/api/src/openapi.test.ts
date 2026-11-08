import { expect, test } from 'bun:test'

process.env.DATABASE_URL ??= 'postgres://localhost/zebabu_test'

test('OpenAPI document is stable and describes every application operation', async () => {
  const { generateOpenApi } = await import('./openapi')
  const first = await generateOpenApi()
  const second = await generateOpenApi()

  expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  expect(first.openapi).toBe('3.1.1')
  expect(first.servers).toEqual([{ url: '/' }])
  expect(first.security).toEqual([{ sessionCookie: [] }, { apiKey: [] }])
  expect(first.components?.securitySchemes?.sessionCookie).toEqual({
    type: 'apiKey',
    in: 'cookie',
    name: 'better-auth.session_token',
  })
  expect(first.components?.securitySchemes?.apiKey).toEqual({
    type: 'apiKey',
    in: 'header',
    name: 'x-api-key',
    description: 'User-owned API key with read or write permission',
  })

  const operations = Object.entries(first.paths ?? {}).flatMap(([path, item]) =>
    Object.entries(item ?? {})
      .filter(
        ([method, operation]) =>
          ['get', 'post', 'put', 'patch', 'delete'].includes(method) &&
          operation !== null &&
          typeof operation === 'object' &&
          'operationId' in operation,
      )
      .map(([method, operation]) => ({ path, method, operation })),
  )
  const ids = operations.map(({ operation }) =>
    operation && typeof operation === 'object' && 'operationId' in operation
      ? operation.operationId
      : undefined,
  )
  expect(operations.length).toBe(23)
  expect(new Set(ids).size).toBe(ids.length)
  expect(
    operations
      .map(
        ({ method, path }, index) =>
          `${method.toUpperCase()} ${path} ${ids[index]}`,
      )
      .join('\n'),
  ).toBe(`GET /api/v1/profile getProfile
PATCH /api/v1/profile updateProfile
GET /api/v1/categories listCategories
POST /api/v1/categories createCategory
PATCH /api/v1/categories/{categoryId} updateCategory
DELETE /api/v1/categories/{categoryId} deleteCategory
PUT /api/v1/categories/allocation-targets replaceDefaultAllocationTargets
GET /api/v1/budgets listBudgets
POST /api/v1/budgets createBudget
GET /api/v1/budgets/{budgetId} getBudget
DELETE /api/v1/budgets/{budgetId} deleteBudget
POST /api/v1/budgets/{budgetId}/duplicate duplicateBudget
POST /api/v1/budgets/{budgetId}/categories addBudgetCategory
PATCH /api/v1/budgets/{budgetId}/categories/{budgetCategoryId}/position positionBudgetCategory
PUT /api/v1/budgets/{budgetId}/allocation-targets replaceBudgetAllocationTargets
POST /api/v1/budgets/{budgetId}/transactions createTransaction
PATCH /api/v1/budgets/{budgetId}/transactions/{transactionId} updateTransaction
DELETE /api/v1/budgets/{budgetId}/transactions/{transactionId} deleteTransaction
PUT /api/v1/budgets/{budgetId}/transactions/{transactionId}/paid setTransactionPaid
PATCH /api/v1/budgets/{budgetId}/transactions/{transactionId}/position positionTransaction
GET /api/v1/keys listApiKeys
POST /api/v1/keys createApiKey
DELETE /api/v1/keys/{keyId} revokeApiKey`)
  expect(first.paths?.['/api/v1/keys']?.get?.security).toEqual([
    { sessionCookie: [] },
  ])
  expect(first.paths?.['/api/v1/keys']?.post?.security).toEqual([
    { sessionCookie: [] },
  ])
  expect(
    operations.every(({ path, operation }) => {
      if (!operation || typeof operation !== 'object') return false
      if (!('tags' in operation) || !('responses' in operation)) return false
      return (
        path.startsWith('/api/v1/') &&
        Array.isArray(operation.tags) &&
        operation.tags.length > 0 &&
        operation.responses !== undefined &&
        '401' in operation.responses
      )
    }),
  ).toBe(true)
})
