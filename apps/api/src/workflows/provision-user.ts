import { database as db } from '#api-database'
import { z } from 'zod'
import { ensureInitialCategoriesTx } from '../modules/budget-planning/categories/service'
import {
  findProvisioningStateTx,
  lockUserProvisioningTx,
  markUserProvisionedTx,
} from '../modules/identity/users/provisioning-repository'

const provisioningLocaleSchema = z.enum(['en', 'cs'])

export class UnsupportedLocaleError extends Error {
  constructor() {
    super('Unsupported provisioning locale')
    this.name = 'UnsupportedLocaleError'
  }
}

export async function ensureUserProvisioned(userId: string, locale: unknown) {
  const parsedLocale = provisioningLocaleSchema.safeParse(locale)
  if (!parsedLocale.success) throw new UnsupportedLocaleError()

  return db.transaction(async (tx) => {
    await lockUserProvisioningTx(tx, userId)
    const state = await findProvisioningStateTx(tx, userId)
    if (!state || state.isProvisioned) return

    await ensureInitialCategoriesTx(tx, userId, parsedLocale.data)
    await markUserProvisionedTx(tx, userId)
  })
}
