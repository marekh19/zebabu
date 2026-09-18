import { apikey, user } from '$lib/server/persistence/schema'
import {
  budgetPageSchema,
  budgetReferenceSchema,
  categorySchema,
  errorSchema,
  keyMetadataSchema,
  profileSchema,
} from '@zebabu/api-contract'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { afterAll, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { createApp } from './app'
import { createIdentity } from './lib/identity/server/create-identity'
import { testDatabase } from './lib/server/persistence/database.test-helper'

const runId = crypto.randomUUID()
const email = `api-${runId}@example.com`
const otherEmail = `api-other-${runId}@example.com`
const secret = 'api-integration-secret-at-least-32-characters'
const webOrigin = 'http://localhost:3000'

process.env.BETTER_AUTH_SECRET = secret

const signupAuth = betterAuth({
  baseURL: webOrigin,
  secret,
  database: drizzleAdapter(testDatabase, { provider: 'pg' }),
  emailAndPassword: { enabled: true, requireEmailVerification: true },
  emailVerification: { sendVerificationEmail: async () => {} },
})

const auth = createIdentity({
  betterAuthUrl: webOrigin,
  webOrigin,
  redisKeyPrefix: `zebabu:test:${runId}`,
  emailFrom: 'Zebabu <test@example.com>',
  resendApiKey: 'test',
})
const app = createApp(auth, webOrigin)

afterAll(async () => {
  await testDatabase.delete(user).where(eq(user.email, email))
  await testDatabase.delete(user).where(eq(user.email, otherEmail))
})

test('signed-in user reaches profile and Category routes with origin checks', async () => {
  const signup = await signupAuth.api.signUpEmail({
    body: { email, name: 'API user', password: 'valid-password-123' },
  })
  await testDatabase
    .update(user)
    .set({ emailVerified: true })
    .where(eq(user.id, signup.user.id))

  const signIn = await auth.api.signInEmail({
    body: { email, password: 'valid-password-123' },
    asResponse: true,
  })
  const setCookie = signIn.headers.get('set-cookie')
  if (!setCookie) throw new Error('Sign-in did not set a Session cookie')
  const cookie = setCookie.split(';')[0] ?? ''

  const profile = await app.request('/api/v1/profile', {
    headers: { cookie },
  })
  expect(profile.status).toBe(200)
  expect(profileSchema.parse(await profile.json()).id).toBe(signup.user.id)

  const rejected = await app.request('/api/v1/categories', {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Savings', type: 'expense', color: 'sky' }),
  })
  expect(rejected.status).toBe(403)

  const created = await app.request('/api/v1/categories', {
    method: 'POST',
    headers: {
      cookie,
      origin: webOrigin,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ name: 'Savings', type: 'expense', color: 'sky' }),
  })
  expect(created.status).toBe(201)
  const savingsCategory = categorySchema.parse(await created.json())
  expect(savingsCategory.name).toBe('Savings')

  const createBudget = await app.request('/api/v1/budgets', {
    method: 'POST',
    headers: { cookie, origin: webOrigin, 'content-type': 'application/json' },
    body: JSON.stringify({
      type: 'scenario',
      name: 'API scenario',
      useDefaultAllocationTargets: false,
    }),
  })
  expect(createBudget.status).toBe(201)
  const budget = budgetReferenceSchema.parse(await createBudget.json())
  const budgetPath = `/api/v1/budgets/${budget.id}`

  const budgetDetail = await app.request(budgetPath, { headers: { cookie } })
  expect(budgetDetail.status).toBe(200)
  const page = budgetPageSchema.parse(await budgetDetail.json())
  expect(
    page.budget.budgetCategories.some(
      ({ category }) => category.id === savingsCategory.id,
    ),
  ).toBe(true)

  const budgetCategory = page.budget.budgetCategories.find(
    ({ category }) => category.id === savingsCategory.id,
  )
  if (!budgetCategory)
    throw new Error('Created Category is missing from Budget')
  const transaction = await app.request(`${budgetPath}/transactions`, {
    method: 'POST',
    headers: { cookie, origin: webOrigin, 'content-type': 'application/json' },
    body: JSON.stringify({
      budgetCategoryId: budgetCategory.id,
      name: 'API transaction',
      amount: '12.34',
      isPaid: false,
    }),
  })
  expect(transaction.status).toBe(201)
  const updatedDetail = await app.request(budgetPath, { headers: { cookie } })
  expect(updatedDetail.status).toBe(200)
  expect(
    budgetPageSchema
      .parse(await updatedDetail.json())
      .budget.budgetCategories.find(({ id }) => id === budgetCategory.id)
      ?.transactions.some(
        ({ name, amount }) => name === 'API transaction' && amount === '12.34',
      ),
  ).toBe(true)

  const oversized = await app.request('/api/v1/categories', {
    method: 'POST',
    headers: {
      cookie,
      origin: webOrigin,
      'content-type': 'application/json',
    },
    body: 'x'.repeat(1024 * 1024 + 1),
  })
  expect(oversized.status).toBe(413)
  expect(errorSchema.parse(await oversized.json()).code).toBe(
    'PAYLOAD_TOO_LARGE',
  )

  const createKey = await app.request('/api/v1/keys', {
    method: 'POST',
    headers: {
      cookie,
      origin: webOrigin,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ name: 'Read key', scope: 'read', expiresInDays: 7 }),
  })
  expect(createKey.status).toBe(201)
  const createdKey = keyMetadataSchema
    .extend({ key: keyMetadataSchema.shape.name })
    .parse(await createKey.json())

  const keyProfile = await app.request('/api/v1/profile', {
    headers: { 'x-api-key': createdKey.key },
  })
  expect(keyProfile.status).toBe(200)

  const deniedWrite = await app.request('/api/v1/categories', {
    method: 'POST',
    headers: {
      'x-api-key': createdKey.key,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ name: 'Travel', type: 'expense', color: 'sky' }),
  })
  expect(deniedWrite.status).toBe(403)

  await testDatabase
    .update(apikey)
    .set({
      rateLimitMax: 1,
      rateLimitTimeWindow: 60_000,
      requestCount: 0,
      lastRequest: new Date(0),
    })
    .where(eq(apikey.id, createdKey.id))
  const firstLimitedRead = await app.request('/api/v1/profile', {
    headers: { 'x-api-key': createdKey.key },
  })
  const secondLimitedRead = await app.request('/api/v1/profile', {
    headers: { 'x-api-key': createdKey.key },
  })
  expect(firstLimitedRead.status).toBe(200)
  expect(secondLimitedRead.status).toBe(429)
  expect(errorSchema.parse(await secondLimitedRead.json()).code).toBe(
    'RATE_LIMITED',
  )

  const createWriteKey = await app.request('/api/v1/keys', {
    method: 'POST',
    headers: {
      cookie,
      origin: webOrigin,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Write key',
      scope: 'write',
      expiresInDays: 7,
    }),
  })
  expect(createWriteKey.status).toBe(201)
  const writeKey = keyMetadataSchema
    .extend({ key: keyMetadataSchema.shape.name })
    .parse(await createWriteKey.json())
  const written = await app.request('/api/v1/categories', {
    method: 'POST',
    headers: {
      'x-api-key': writeKey.key,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ name: 'Travel', type: 'expense', color: 'sky' }),
  })
  expect(written.status).toBe(201)

  const listed = await app.request('/api/v1/keys', {
    headers: { cookie },
  })
  expect(listed.status).toBe(200)
  const listedKeys = keyMetadataSchema.array().parse(await listed.json())
  expect(listedKeys.map(({ id }) => id)).toContain(createdKey.id)
  expect(listedKeys.map(({ id }) => id)).toContain(writeKey.id)

  const otherSignup = await signupAuth.api.signUpEmail({
    body: {
      email: otherEmail,
      name: 'Other API user',
      password: 'valid-password-123',
    },
  })
  await testDatabase
    .update(user)
    .set({ emailVerified: true })
    .where(eq(user.id, otherSignup.user.id))
  const otherSignIn = await auth.api.signInEmail({
    body: { email: otherEmail, password: 'valid-password-123' },
    asResponse: true,
  })
  const otherSetCookie = otherSignIn.headers.get('set-cookie')
  if (!otherSetCookie) throw new Error('Other sign-in did not set a cookie')
  const otherCookie = otherSetCookie.split(';')[0] ?? ''
  const foreignBudget = await app.request(budgetPath, {
    headers: { cookie: otherCookie },
  })
  expect(foreignBudget.status).toBe(404)
  expect(errorSchema.parse(await foreignBudget.json()).code).toBe('NOT_FOUND')
  const foreignTransaction = await app.request(`${budgetPath}/transactions`, {
    method: 'POST',
    headers: {
      cookie: otherCookie,
      origin: webOrigin,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      budgetCategoryId: budgetCategory.id,
      name: 'Foreign transaction',
      amount: '1.00',
      isPaid: false,
    }),
  })
  expect(foreignTransaction.status).toBe(404)
  const foreignRevoke = await app.request(`/api/v1/keys/${createdKey.id}`, {
    method: 'DELETE',
    headers: { cookie: otherCookie, origin: webOrigin },
  })
  expect(foreignRevoke.status).toBe(404)

  await testDatabase
    .update(apikey)
    .set({ expiresAt: new Date(0) })
    .where(eq(apikey.id, writeKey.id))
  const expiredRead = await app.request('/api/v1/profile', {
    headers: { 'x-api-key': writeKey.key },
  })
  expect(expiredRead.status).toBe(401)

  const revoked = await app.request(`/api/v1/keys/${createdKey.id}`, {
    method: 'DELETE',
    headers: { cookie, origin: webOrigin },
  })
  expect(revoked.status).toBe(200)
  const revokedRead = await app.request('/api/v1/profile', {
    headers: { 'x-api-key': createdKey.key },
  })
  expect(revokedRead.status).toBe(401)
  const revokedWrite = await app.request(`/api/v1/keys/${writeKey.id}`, {
    method: 'DELETE',
    headers: { cookie, origin: webOrigin },
  })
  expect(revokedWrite.status).toBe(404)
  const sessionRead = await app.request('/api/v1/profile', {
    headers: { cookie },
  })
  expect(sessionRead.status).toBe(200)
})
