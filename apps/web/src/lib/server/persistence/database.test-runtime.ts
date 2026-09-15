import { testDatabase } from './database.test-helper'

export const database = testDatabase

export type DbTransaction = Parameters<
  Parameters<typeof database.transaction>[0]
>[0]
