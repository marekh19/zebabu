import type { DbTransaction } from '#api-database'
import { eq, sql } from 'drizzle-orm'
import { user } from '../schema'

export function lockUserProvisioningTx(tx: DbTransaction, userId: string) {
  return tx.execute(
    sql`select pg_advisory_xact_lock(hashtext(${'user-provisioning:' + userId}))`,
  )
}

export function findProvisioningStateTx(tx: DbTransaction, userId: string) {
  return tx.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { isProvisioned: true },
  })
}

export function markUserProvisionedTx(tx: DbTransaction, userId: string) {
  return tx.update(user).set({ isProvisioned: true }).where(eq(user.id, userId))
}
