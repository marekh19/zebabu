import type { DbTransaction } from '$lib/server/persistence/database'
import { category, user } from '$lib/server/persistence/schema'
import { eq, sql } from 'drizzle-orm'

export function lockUserProvisioningTx(tx: DbTransaction, userId: string) {
  return tx.execute(
    sql`select pg_advisory_xact_lock(hashtext(${'user-provisioning:' + userId}))`,
  )
}

export async function findProvisioningStateTx(
  tx: DbTransaction,
  userId: string,
) {
  const found = await tx.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { isProvisioned: true },
    with: {
      categories: { columns: { type: true } },
    },
  })

  return found
}

export function insertDefaultCategoriesTx(
  tx: DbTransaction,
  values: readonly (typeof category.$inferInsert)[],
) {
  if (values.length === 0) return
  return tx.insert(category).values([...values])
}

export function markUserProvisionedTx(tx: DbTransaction, userId: string) {
  return tx.update(user).set({ isProvisioned: true }).where(eq(user.id, userId))
}
