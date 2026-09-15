import * as m from '$lib/paraglide/messages'
import { database as db } from '$lib/server/persistence/database'
import { z } from 'zod'
import {
  findProvisioningStateTx,
  insertDefaultCategoriesTx,
  lockUserProvisioningTx,
  markUserProvisionedTx,
} from './provisioning-repository'

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

    const types = new Set(state.categories.map(({ type }) => type))
    const defaults = [
      {
        userId,
        name: m.category_default_income({}, { locale: parsedLocale.data }),
        type: 'income' as const,
        color: 'emerald' as const,
      },
      {
        userId,
        name: m.category_default_expense({}, { locale: parsedLocale.data }),
        type: 'expense' as const,
        color: 'rose' as const,
      },
    ].filter(({ type }) => !types.has(type))

    await insertDefaultCategoriesTx(tx, defaults)
    await markUserProvisionedTx(tx, userId)
  })
}
